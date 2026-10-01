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

function useCanvasPan(resetKey: string) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{
    x: number;
    y: number;
    ox: number;
    oy: number;
    moved: boolean;
  } | null>(null);
  const suppressClick = useRef(false);
  const [offset, setOffset] = useState({ x: 0, y: 16 });
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const viewport = viewportRef.current;
    const stage = stageRef.current;
    if (!viewport || !stage) return;
    const x = (viewport.clientWidth - stage.offsetWidth) / 2;
    setOffset({ x, y: 16 });
  }, [resetKey]);

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    drag.current = {
      x: event.clientX,
      y: event.clientY,
      ox: offset.x,
      oy: offset.y,
      moved: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const current = drag.current;
    if (!current) return;
    const dx = event.clientX - current.x;
    const dy = event.clientY - current.y;
    if (!current.moved && Math.hypot(dx, dy) < 6) return;
    current.moved = true;
    setOffset({ x: current.ox + dx, y: current.oy + dy });
  };

  const endDrag = () => {
    if (drag.current?.moved) suppressClick.current = true;
    drag.current = null;
    setDragging(false);
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
    offset,
    dragging,
    onPointerDown,
    onPointerMove,
    endDrag,
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
      const stageRect = stage.getBoundingClientRect();
      const boxes = [...stage.querySelectorAll<HTMLElement>("[data-flow-id]")].map((node) => {
        const rect = node.getBoundingClientRect();
        return {
          id: node.dataset.flowId ?? "",
          parent: node.dataset.flowParent || null,
          department: node.dataset.flowDepartment ?? "",
          sector: node.dataset.flowSector ?? "",
          cx: rect.left - stageRect.left + rect.width / 2,
          top: rect.top - stageRect.top,
          bottom: rect.bottom - stageRect.top,
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
  const pan = useCanvasPan(resetKey);
  const segments = useConnectors(pan.stageRef, resetKey, highlight, areaFocus);

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
        ref={pan.viewportRef}
        className={cn(
          "relative h-[min(70vh,760px)] overflow-hidden rounded-2xl border border-line/80 bg-white/35 touch-none",
          pan.dragging ? "cursor-grabbing" : "cursor-grab",
        )}
        onPointerDown={pan.onPointerDown}
        onPointerMove={pan.onPointerMove}
        onPointerUp={pan.endDrag}
        onPointerCancel={pan.endDrag}
        onClickCapture={pan.onClickCapture}
      >
        <p className="pointer-events-none absolute top-3 left-3 z-10 text-[11px] text-muted">
          Arraste para explorar
        </p>
        <div
          ref={pan.stageRef}
          className="absolute top-0 left-0 w-max px-10 pt-8 pb-10"
          style={{ transform: `translate(${pan.offset.x}px, ${pan.offset.y}px)` }}
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
