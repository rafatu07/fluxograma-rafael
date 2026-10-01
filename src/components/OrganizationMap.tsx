import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type MouseEvent as ReactMouseEvent,
  type RefObject,
} from "react";
import { Crosshair, Minus, Plus, Scan } from "lucide-react";
import { accentFor } from "../data/accents.ts";
import {
  isSector,
  secretariatOfficers,
  type Department,
  type FlowHighlight,
  type OrgChild,
  type Project,
  type ProjectContext,
  type Sector,
} from "../data/organization.ts";
import { cn } from "../lib/utils.ts";
import { DepartmentNode, OfficerList } from "./DepartmentNode.tsx";
import { MunicipalityBrand } from "./MunicipalityBrand.tsx";
import { ProjectNode } from "./ProjectNode.tsx";
import { SectorNode } from "./SectorNode.tsx";

type OrganizationMapProps = {
  departments: Department[];
  onSelect: (selection: ProjectContext) => void;
};

type HighlightHandler = (
  project: Project,
  sectorId: string | undefined,
  active: boolean,
) => void;

const MIN_SCALE = 0.2;
const MAX_SCALE = 2;
const ZOOM_STEP = 1.15;
const FIT_MARGIN = 48;

type CanvasView = {
  x: number;
  y: number;
  scale: number;
};

type PointerPoint = {
  id: number;
  x: number;
  y: number;
};

type PinchStart = {
  distance: number;
  scale: number;
  x: number;
  y: number;
  focalX: number;
  focalY: number;
};

function clampScale(scale: number) {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));
}

function isMobileViewport() {
  return window.matchMedia("(max-width: 767px)").matches;
}

function useCanvasView(resetKey: string) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const percentRef = useRef<HTMLSpanElement>(null);
  const viewRef = useRef<CanvasView>({ x: 0, y: 16, scale: 1 });
  const pointers = useRef(new Map<number, PointerPoint>());
  const pan = useRef<{
    id: number;
    x: number;
    y: number;
    ox: number;
    oy: number;
    moved: boolean;
  } | null>(null);
  const pinch = useRef<PinchStart | null>(null);
  const suppressClick = useRef(false);
  const frame = useRef(0);
  const pending = useRef<CanvasView | null>(null);
  const settle = useRef(0);
  const [view, setView] = useState<CanvasView>({ x: 0, y: 16, scale: 1 });
  const [dragging, setDragging] = useState(false);

  const paint = (next: CanvasView) => {
    const stage = stageRef.current;
    if (!stage) return;
    stage.style.transform = `translate(${next.x}px, ${next.y}px) scale(${next.scale})`;
    if (percentRef.current) {
      percentRef.current.textContent = `${Math.round(next.scale * 100)}%`;
    }
  };

  const commit = (next: CanvasView, smooth: boolean) => {
    const stage = stageRef.current;
    if (stage) stage.style.transition = smooth ? "transform 200ms ease" : "none";
    viewRef.current = next;
    setView(next);
  };

  const schedule = (next: CanvasView) => {
    viewRef.current = next;
    pending.current = next;
    if (frame.current) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = 0;
      if (pending.current) paint(pending.current);
    });
  };

  const placed = (scale: number) => {
    const viewport = viewportRef.current;
    const stage = stageRef.current;
    if (!viewport || !stage) return { x: 0, y: 16, scale };
    return {
      scale,
      x: (viewport.clientWidth - stage.offsetWidth * scale) / 2,
      y: (viewport.clientHeight - stage.offsetHeight * scale) / 2,
    };
  };

  const fitView = () => {
    const viewport = viewportRef.current;
    const stage = stageRef.current;
    if (!viewport || !stage) return viewRef.current;
    const availableWidth = Math.max(viewport.clientWidth - FIT_MARGIN, 1);
    const availableHeight = Math.max(viewport.clientHeight - FIT_MARGIN, 1);
    const scale = clampScale(
      Math.min(availableWidth / stage.offsetWidth, availableHeight / stage.offsetHeight),
    );
    return placed(scale);
  };

  const zoomAt = (clientX: number, clientY: number, nextScale: number, smooth: boolean) => {
    const viewport = viewportRef.current;
    const current = viewRef.current;
    if (!viewport) return;
    const rect = viewport.getBoundingClientRect();
    const focalX = clientX - rect.left;
    const focalY = clientY - rect.top;
    const scale = clampScale(nextScale);
    const worldX = (focalX - current.x) / current.scale;
    const worldY = (focalY - current.y) / current.scale;
    commit(
      {
        scale,
        x: focalX - worldX * scale,
        y: focalY - worldY * scale,
      },
      smooth,
    );
  };

  const zoomBy = (factor: number) => {
    const viewport = viewportRef.current;
    const current = viewRef.current;
    if (!viewport) return;
    const rect = viewport.getBoundingClientRect();
    zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, current.scale * factor, true);
  };

  const zoomTo = (scale: number) => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const rect = viewport.getBoundingClientRect();
    zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, scale, true);
  };

  const fit = () => commit(fitView(), true);
  const center = () => commit(placed(viewRef.current.scale), true);

  useLayoutEffect(() => {
    paint(view);
  }, [view]);

  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const next = isMobileViewport()
      ? fitView()
      : {
          scale: 1,
          x: ((viewportRef.current?.clientWidth ?? 0) - stage.offsetWidth) / 2,
          y: 16,
        };
    commit(next, false);
    // A vista inicial depende só da estrutura visível.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const clear = () => {
      stage.style.transition = "none";
    };
    stage.addEventListener("transitionend", clear);
    return () => stage.removeEventListener("transitionend", clear);
  }, [resetKey]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const settleView = () => {
      window.clearTimeout(settle.current);
      settle.current = window.setTimeout(() => {
        commit(viewRef.current, false);
      }, 120);
    };
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const current = viewRef.current;
      const stage = stageRef.current;
      if (stage) stage.style.transition = "none";
      if (event.ctrlKey || event.metaKey) {
        const viewport = viewportRef.current;
        if (!viewport) return;
        const rect = viewport.getBoundingClientRect();
        const focalX = event.clientX - rect.left;
        const focalY = event.clientY - rect.top;
        const scale = clampScale(current.scale * Math.exp(-event.deltaY * 0.002));
        const worldX = (focalX - current.x) / current.scale;
        const worldY = (focalY - current.y) / current.scale;
        schedule({
          scale,
          x: focalX - worldX * scale,
          y: focalY - worldY * scale,
        });
        settleView();
        return;
      }
      const deltaX = event.shiftKey ? event.deltaY : event.deltaX;
      const deltaY = event.shiftKey ? 0 : event.deltaY;
      schedule({
        x: current.x - deltaX,
        y: current.y - deltaY,
        scale: current.scale,
      });
      settleView();
    };
    viewport.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      viewport.removeEventListener("wheel", onWheel);
      window.clearTimeout(settle.current);
      cancelAnimationFrame(frame.current);
    };
  }, [resetKey]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || event.altKey) return;
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        target.closest("input, textarea, select, [contenteditable='true']")
      ) {
        return;
      }
      if (event.key === "0") {
        event.preventDefault();
        fit();
        return;
      }
      if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        zoomBy(ZOOM_STEP);
        return;
      }
      if (event.key === "-" || event.key === "_") {
        event.preventDefault();
        zoomBy(1 / ZOOM_STEP);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [resetKey]);

  const beginPinch = () => {
    const points = [...pointers.current.values()];
    const viewport = viewportRef.current;
    if (points.length < 2 || !viewport) return;
    const [first, second] = points;
    const current = viewRef.current;
    const rect = viewport.getBoundingClientRect();
    const midX = (first.x + second.x) / 2;
    const midY = (first.y + second.y) / 2;
    pinch.current = {
      distance: Math.max(Math.hypot(first.x - second.x, first.y - second.y), 1),
      scale: current.scale,
      x: current.x,
      y: current.y,
      focalX: midX - rect.left,
      focalY: midY - rect.top,
    };
    pan.current = null;
    suppressClick.current = true;
    const stage = stageRef.current;
    if (stage) stage.style.transition = "none";
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    pointers.current.set(event.pointerId, {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
    });
    const interactive =
      event.target instanceof Element &&
      Boolean(event.target.closest("[data-canvas-controls], a, button"));
    if (pointers.current.size === 1) {
      if (interactive) return;
      pan.current = {
        id: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        ox: viewRef.current.x,
        oy: viewRef.current.y,
        moved: false,
      };
      event.currentTarget.setPointerCapture(event.pointerId);
      setDragging(true);
      return;
    }
    beginPinch();
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const point = pointers.current.get(event.pointerId);
    if (!point) return;
    point.x = event.clientX;
    point.y = event.clientY;
    if (pointers.current.size >= 2 && pinch.current) {
      const points = [...pointers.current.values()];
      const [first, second] = points;
      const viewport = viewportRef.current;
      if (!first || !second || !viewport) return;
      const distance = Math.max(Math.hypot(first.x - second.x, first.y - second.y), 1);
      const rect = viewport.getBoundingClientRect();
      const start = pinch.current;
      const scale = clampScale(start.scale * (distance / start.distance));
      const worldX = (start.focalX - start.x) / start.scale;
      const worldY = (start.focalY - start.y) / start.scale;
      const focalX = (first.x + second.x) / 2 - rect.left;
      const focalY = (first.y + second.y) / 2 - rect.top;
      schedule({
        scale,
        x: focalX - worldX * scale,
        y: focalY - worldY * scale,
      });
      return;
    }
    const current = pan.current;
    if (!current || current.id !== event.pointerId) return;
    const dx = event.clientX - current.x;
    const dy = event.clientY - current.y;
    if (!current.moved && Math.hypot(dx, dy) < 6) return;
    current.moved = true;
    const stage = stageRef.current;
    if (stage) stage.style.transition = "none";
    schedule({
      x: current.ox + dx,
      y: current.oy + dy,
      scale: viewRef.current.scale,
    });
  };

  const endPointer = (event: ReactPointerEvent<HTMLDivElement>) => {
    pointers.current.delete(event.pointerId);
    if (pointers.current.size >= 2) {
      beginPinch();
      return;
    }
    if (pointers.current.size === 1) {
      const remaining = [...pointers.current.values()][0];
      if (!remaining) return;
      pan.current = {
        id: remaining.id,
        x: remaining.x,
        y: remaining.y,
        ox: viewRef.current.x,
        oy: viewRef.current.y,
        moved: true,
      };
      pinch.current = null;
      suppressClick.current = true;
      return;
    }
    if (pan.current?.moved || pinch.current) suppressClick.current = true;
    pan.current = null;
    pinch.current = null;
    setDragging(false);
    commit(viewRef.current, false);
  };

  const onClickCapture = (event: ReactMouseEvent) => {
    if (!suppressClick.current) return;
    event.preventDefault();
    event.stopPropagation();
    suppressClick.current = false;
  };

  return {
    viewportRef,
    stageRef,
    percentRef,
    view,
    dragging,
    zoomBy,
    zoomTo,
    fit,
    center,
    onPointerDown,
    onPointerMove,
    endPointer,
    onClickCapture,
  };
}

const IDLE_STROKE = "rgba(37, 99, 235, 0.32)";
const ACTIVE_STROKE = "#163b5c";

type FlowSegment = {
  key: string;
  d: string;
  active: boolean;
};

type AnchorBox = {
  id: string;
  parent: string | null;
  department: string;
  sector: string;
  cx: number;
  top: number;
  bottom: number;
};

function segment(x1: number, y1: number, x2: number, y2: number) {
  return `M ${x1} ${y1} L ${x2} ${y2}`;
}

function layoutBox(node: HTMLElement, stage: HTMLElement) {
  let left = 0;
  let top = 0;
  let current: HTMLElement | null = node;
  while (current && current !== stage) {
    left += current.offsetLeft;
    top += current.offsetTop;
    const offsetParent: Element | null = current.offsetParent;
    if (!(offsetParent instanceof HTMLElement) || !stage.contains(offsetParent)) break;
    current = offsetParent;
  }
  return {
    left,
    top,
    width: node.offsetWidth,
    height: node.offsetHeight,
  };
}

function useConnectors(
  stageRef: RefObject<HTMLDivElement | null>,
  resetKey: string,
  highlight: FlowHighlight | null,
  areaFocus: string | null,
) {
  const [segments, setSegments] = useState<FlowSegment[]>([]);

  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const onPath = (box: AnchorBox) => {
      if (areaFocus && !highlight) return box.department === areaFocus || box.id === areaFocus;
      if (!highlight) return false;
      if (box.id === highlight.departmentId) return true;
      if (box.id === highlight.projectId) return true;
      if (highlight.sectorId && box.id === `${highlight.departmentId}:${highlight.sectorId}`) {
        return true;
      }
      return false;
    };

    const measure = () => {
      const boxes = [...stage.querySelectorAll<HTMLElement>("[data-flow-id]")].map((node) => {
        const box = layoutBox(node, stage);
        return {
          id: node.dataset.flowId ?? "",
          parent: node.dataset.flowParent || null,
          department: node.dataset.flowDepartment ?? "",
          sector: node.dataset.flowSector ?? "",
          cx: box.left + box.width / 2,
          top: box.top,
          bottom: box.top + box.height,
        } satisfies AnchorBox;
      });
      const byParent = new Map<string, AnchorBox[]>();
      for (const box of boxes) {
        if (!box.parent) continue;
        const group = byParent.get(box.parent) ?? [];
        group.push(box);
        byParent.set(box.parent, group);
      }

      const next: FlowSegment[] = [];
      for (const [parentId, children] of byParent) {
        const parent = boxes.find((box) => box.id === parentId);
        if (!parent || children.length === 0) continue;
        const ordered = [...children].sort((a, b) => a.cx - b.cx);
        const childTop = Math.min(...ordered.map((child) => child.top));
        if (childTop <= parent.bottom) continue;
        const busY = (parent.bottom + childTop) / 2;
        const left = Math.min(parent.cx, ordered[0].cx);
        const right = Math.max(parent.cx, ordered[ordered.length - 1].cx);
        const active = ordered.some(onPath);

        next.push({
          key: `${parentId}-stem`,
          d: segment(parent.cx, parent.bottom, parent.cx, busY),
          active,
        });
        if (right - left > 0.5) {
          next.push({
            key: `${parentId}-bus`,
            d: segment(left, busY, right, busY),
            active,
          });
        }
        for (const child of ordered) {
          next.push({
            key: `${child.id}-drop`,
            d: segment(child.cx, busY, child.cx, child.top),
            active: onPath(child),
          });
        }
      }
      setSegments(next);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(stage);
    for (const anchor of stage.querySelectorAll<HTMLElement>("[data-flow-id]")) {
      observer.observe(anchor);
    }
    stage.addEventListener("animationend", measure);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      stage.removeEventListener("animationend", measure);
      window.removeEventListener("resize", measure);
    };
  }, [stageRef, resetKey, highlight, areaFocus]);

  return segments;
}

export function OrganizationMap({ departments, onSelect }: OrganizationMapProps) {
  const [highlight, setHighlight] = useState<FlowHighlight | null>(null);
  const [areaFocus, setAreaFocus] = useState<string | null>(null);
  const focusId = highlight?.departmentId ?? areaFocus ?? undefined;
  const resetKey = departments.map((department) => department.id).join("-");
  const canvas = useCanvasView(resetKey);
  const segments = useConnectors(canvas.stageRef, resetKey, highlight, areaFocus);

  if (departments.length === 0) {
    return (
      <p className="px-4 py-16 text-center text-sm text-muted">
        Nenhum projeto corresponde aos filtros selecionados.
      </p>
    );
  }

  return (
    <section
      aria-label="Fluxograma da Secretaria da Fazenda"
      className="mx-auto mt-8 w-full max-w-[1360px] px-4 sm:px-6"
    >
      <div
        ref={canvas.viewportRef}
        className={cn(
          "relative h-[min(75vh,800px)] overflow-hidden rounded-2xl border border-line/80 bg-white/35 touch-none",
          canvas.dragging ? "cursor-grabbing" : "cursor-grab",
        )}
        onPointerDown={canvas.onPointerDown}
        onPointerMove={canvas.onPointerMove}
        onPointerUp={canvas.endPointer}
        onPointerCancel={canvas.endPointer}
        onClickCapture={canvas.onClickCapture}
      >
        <p className="pointer-events-none absolute top-3 left-3 z-10 max-w-[45%] text-[11px] text-muted">
          Arraste para explorar e aproxime para ler
        </p>
        <div
          data-canvas-controls
          className="absolute top-4 right-4 z-20 flex items-center gap-0.5 rounded-full border border-line/80 bg-white/92 p-1 shadow-sm backdrop-blur-sm"
          onPointerDown={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            aria-label="Afastar"
            disabled={canvas.view.scale <= MIN_SCALE + 0.001}
            onClick={() => canvas.zoomBy(1 / ZOOM_STEP)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-ink transition hover:bg-slate-100 disabled:opacity-40"
          >
            <Minus className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label={`Zoom ${Math.round(canvas.view.scale * 100)} por cento. Voltar para 100%`}
            onClick={() => canvas.zoomTo(1)}
            className="h-8 min-w-12 rounded-full px-1 text-xs font-medium text-ink tabular-nums transition hover:bg-slate-100"
          >
            <span ref={canvas.percentRef}>{Math.round(canvas.view.scale * 100)}%</span>
          </button>
          <button
            type="button"
            aria-label="Aproximar"
            disabled={canvas.view.scale >= MAX_SCALE - 0.001}
            onClick={() => canvas.zoomBy(ZOOM_STEP)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-ink transition hover:bg-slate-100 disabled:opacity-40"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Enquadrar tudo"
            onClick={canvas.fit}
            className="flex h-8 w-8 items-center justify-center rounded-full text-ink transition hover:bg-slate-100"
          >
            <Scan className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Centralizar"
            onClick={canvas.center}
            className="flex h-8 w-8 items-center justify-center rounded-full text-ink transition hover:bg-slate-100"
          >
            <Crosshair className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <div
          ref={canvas.stageRef}
          className="absolute top-0 left-0 w-max origin-top-left px-10 pt-8 pb-10"
        >
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
            aria-hidden="true"
          >
            {segments.map((line) => (
              <path
                key={line.key}
                d={line.d}
                fill="none"
                stroke={line.active ? ACTIVE_STROKE : IDLE_STROKE}
                strokeWidth={2}
              />
            ))}
          </svg>
          <div className="flex flex-col items-center">
            <RootNode active={focusId !== undefined} />
            <div className="h-8" aria-hidden="true" />
            <div className="flex items-start">
              {departments.map((department) => (
                <DepartmentBranch
                  key={department.id}
                  department={department}
                  focusId={focusId}
                  highlight={highlight}
                  areaFocus={areaFocus}
                  onSelect={onSelect}
                  onHighlight={setHighlight}
                  onAreaFocus={setAreaFocus}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function RootNode({ active }: { active: boolean }) {
  return (
    <div className="enter relative" style={{ animationDelay: "160ms" }}>
      <div className="origin-aura" aria-hidden="true" />
      <div
        className={cn(
          "relative flex w-72 flex-col items-center gap-2 rounded-2xl border bg-white/95 px-6 py-5 text-center shadow-sm backdrop-blur-sm",
          active ? "border-ink shadow-md" : "border-line",
        )}
        data-flow-id="secretaria"
      >
        <MunicipalityBrand size="node" />
        <p className="text-sm font-semibold tracking-[0.14em] text-ink uppercase">
          Secretaria da Fazenda
        </p>
        <OfficerList officers={secretariatOfficers} />
        <p className="text-xs text-muted">Prefeitura de Taubaté</p>
      </div>
    </div>
  );
}

function DepartmentBranch({
  department,
  focusId,
  highlight,
  areaFocus,
  onSelect,
  onHighlight,
  onAreaFocus,
}: {
  department: Department;
  focusId?: string;
  highlight: FlowHighlight | null;
  areaFocus: string | null;
  onSelect: (selection: ProjectContext) => void;
  onHighlight: (highlight: FlowHighlight | null) => void;
  onAreaFocus: (departmentId: string | null) => void;
}) {
  const active = focusId === department.id;
  const highlightProject: HighlightHandler = (project, sectorId, hovered) => {
    onHighlight(
      hovered
        ? { departmentId: department.id, sectorId, projectId: project.id }
        : null,
    );
  };

  return (
    <div
      className="area-column flex w-max flex-col items-center px-3"
      data-lit={areaFocus === department.id ? "true" : "false"}
      style={{ "--area": accentFor(department.id) } as CSSProperties}
    >
      <div className="h-8 w-full" aria-hidden="true" />
      <div
        className="w-64"
        data-flow-id={department.id}
        data-flow-parent="secretaria"
        data-flow-department={department.id}
      >
        <DepartmentNode
          department={department}
          active={active}
          onHover={(hovered) => onAreaFocus(hovered ? department.id : null)}
        />
      </div>
      {department.children.length > 0 ? (
        <div className="mt-0 flex flex-col items-center">
          <div className="h-6" aria-hidden="true" />
          <ChildRow
            childrenNodes={department.children}
            department={department}
            highlight={highlight}
            areaFocus={areaFocus}
            onSelect={onSelect}
            onHighlight={highlightProject}
          />
        </div>
      ) : null}
    </div>
  );
}

function childActive(
  departmentId: string,
  focusId: string | undefined,
  highlight: FlowHighlight | null,
  areaFocus: string | null,
  sectorId?: string,
  projectId?: string,
) {
  if (areaFocus === departmentId && !highlight) return true;
  if (!highlight || highlight.departmentId !== departmentId) return focusId === departmentId && !highlight && !sectorId && !projectId;
  if (projectId) return highlight.projectId === projectId;
  if (sectorId) return highlight.sectorId === sectorId;
  return highlight.departmentId === departmentId;
}

function ChildRow({
  childrenNodes,
  department,
  highlight,
  areaFocus,
  onSelect,
  onHighlight,
  sector,
}: {
  childrenNodes: OrgChild[] | Project[];
  department: Department;
  highlight: FlowHighlight | null;
  areaFocus: string | null;
  onSelect: (selection: ProjectContext) => void;
  onHighlight: HighlightHandler;
  sector?: Sector;
}) {
  return (
    <div className="flex items-start">
      {childrenNodes.map((child) => {
        const id = child.id;
        const sectorId = sector?.id ?? (isOrgChild(child) && isSector(child) ? child.id : undefined);
        const projectId = sector || !isOrgChild(child) || !isSector(child) ? child.id : undefined;
        const sectorNode = isOrgChild(child) && isSector(child);
        const parentId = sector ? `${department.id}:${sector.id}` : department.id;
        const anchorId = sectorNode ? `${department.id}:${child.id}` : child.id;

        return (
          <div key={id} className="flex w-max flex-col items-center px-2">
            <div className="h-8 w-full" aria-hidden="true" />
            {sectorNode ? (
              <SectorBranch
                sector={child}
                department={department}
                highlight={highlight}
                areaFocus={areaFocus}
                onSelect={onSelect}
                onHighlight={onHighlight}
              />
            ) : (
              <div
                className="w-60"
                data-flow-id={anchorId}
                data-flow-parent={parentId}
                data-flow-department={department.id}
                data-flow-sector={sector?.id ?? ""}
              >
                <ProjectCard
                  project={child as Project}
                  department={department}
                  sector={sector}
                  sectorId={sectorId}
                  projectId={projectId}
                  highlight={highlight}
                  areaFocus={areaFocus}
                  onSelect={onSelect}
                  onHighlight={onHighlight}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function isOrgChild(child: OrgChild | Project): child is OrgChild {
  return "type" in child;
}

function SectorBranch({
  sector,
  department,
  highlight,
  areaFocus,
  onSelect,
  onHighlight,
}: {
  sector: Sector;
  department: Department;
  highlight: FlowHighlight | null;
  areaFocus: string | null;
  onSelect: (selection: ProjectContext) => void;
  onHighlight: HighlightHandler;
}) {
  const accentKey = sector.id === "tesouraria" ? sector.id : department.id;
  const active = childActive(
    department.id,
    undefined,
    highlight,
    areaFocus,
    sector.id,
  );

  return (
    <div className="flex flex-col items-center">
      <div
        className="w-52"
        data-flow-id={`${department.id}:${sector.id}`}
        data-flow-parent={department.id}
        data-flow-department={department.id}
        data-flow-sector={sector.id}
      >
        <SectorNode
          sector={sector}
          departmentId={department.id}
          accentKey={accentKey}
          active={active}
        />
      </div>
      <div className="h-6" aria-hidden="true" />
      <ChildRow
        childrenNodes={sector.projects}
        department={department}
        highlight={highlight}
        areaFocus={areaFocus}
        onSelect={onSelect}
        onHighlight={onHighlight}
        sector={sector}
      />
    </div>
  );
}

function ProjectCard({
  project,
  department,
  sector,
  highlight,
  areaFocus,
  onSelect,
  onHighlight,
}: {
  project: Project;
  department: Department;
  sector?: Sector;
  sectorId?: string;
  projectId?: string;
  highlight: FlowHighlight | null;
  areaFocus: string | null;
  onSelect: (selection: ProjectContext) => void;
  onHighlight: HighlightHandler;
}) {
  const accentKey = sector?.id === "tesouraria" ? sector.id : department.id;

  return (
    <ProjectNode
      project={project}
      departmentId={department.id}
      accentKey={accentKey}
      departmentName={department.name}
      sectorName={sector?.name}
      active={highlight?.projectId === project.id}
      linked={areaFocus === department.id && !highlight}
      onOpen={() =>
        onSelect({
          project,
          departmentName: department.name,
          sectorName: sector?.name,
        })
      }
      onHighlight={(active) => onHighlight(project, sector?.id, active)}
    />
  );
}
