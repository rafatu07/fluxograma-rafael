import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type MouseEvent as ReactMouseEvent,
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
import { FlowLine } from "./Connector.tsx";
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

function BusCap({
  index,
  total,
  dropActive,
  leftActive,
  rightActive,
}: {
  index: number;
  total: number;
  dropActive: boolean;
  leftActive: boolean;
  rightActive: boolean;
}) {
  return (
    <div className="relative h-8 w-full">
      {total > 1 && index > 0 ? (
        <FlowLine
          orientation="horizontal"
          active={leftActive}
          className="absolute top-0 left-0 h-0.5 w-1/2"
        />
      ) : null}
      {total > 1 && index < total - 1 ? (
        <FlowLine
          orientation="horizontal"
          active={rightActive}
          className="absolute top-0 right-0 h-0.5 w-1/2"
        />
      ) : null}
      <FlowLine
        orientation="vertical"
        active={dropActive}
        className="absolute top-0 left-1/2 h-8 w-0.5 -translate-x-1/2"
      />
    </div>
  );
}

export function OrganizationMap({ departments, onSelect }: OrganizationMapProps) {
  const [highlight, setHighlight] = useState<FlowHighlight | null>(null);
  const [areaFocus, setAreaFocus] = useState<string | null>(null);
  const focusId = highlight?.departmentId ?? areaFocus ?? undefined;
  const resetKey = departments.map((department) => department.id).join("-");
  const pan = useCanvasPan(resetKey);

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
          <div className="flex flex-col items-center">
            <RootNode active={focusId !== undefined} />
            <FlowLine
              orientation="vertical"
              active={focusId !== undefined}
              className="h-8 w-0.5"
            />
            <div className="flex items-start">
              {departments.map((department, index) => (
                <DepartmentBranch
                  key={department.id}
                  department={department}
                  index={index}
                  total={departments.length}
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
  index,
  total,
  focusId,
  highlight,
  areaFocus,
  onSelect,
  onHighlight,
  onAreaFocus,
}: {
  department: Department;
  index: number;
  total: number;
  focusId?: string;
  highlight: FlowHighlight | null;
  areaFocus: string | null;
  onSelect: (selection: ProjectContext) => void;
  onHighlight: (highlight: FlowHighlight | null) => void;
  onAreaFocus: (departmentId: string | null) => void;
}) {
  const ids = { current: department.id, focusId };
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
      <div className="w-full">
        <BusCap
          index={index}
          total={total}
          dropActive={active}
          leftActive={active || ids.focusId !== undefined && index > 0}
          rightActive={active || ids.focusId !== undefined && index < total - 1}
        />
      </div>
      <div className="w-64">
        <DepartmentNode
          department={department}
          active={active}
          onHover={(hovered) => onAreaFocus(hovered ? department.id : null)}
        />
      </div>
      {department.children.length > 0 ? (
        <div className="mt-0 flex flex-col items-center">
          <FlowLine
            orientation="vertical"
            active={active}
            className="h-6 w-0.5"
          />
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
      {childrenNodes.map((child, index) => {
        const id = child.id;
        const sectorId = sector?.id ?? (isOrgChild(child) && isSector(child) ? child.id : undefined);
        const projectId = sector || !isOrgChild(child) || !isSector(child) ? child.id : undefined;
        const active = childActive(
          department.id,
          undefined,
          highlight,
          areaFocus,
          isOrgChild(child) && isSector(child) ? child.id : sector?.id,
          sector || !(isOrgChild(child) && isSector(child)) ? id : undefined,
        );
        const leftActive = active || (index > 0 && neighborActive(childrenNodes, index - 1, department, highlight, areaFocus, sector));
        const rightActive = active || (index < childrenNodes.length - 1 && neighborActive(childrenNodes, index + 1, department, highlight, areaFocus, sector));

        return (
          <div key={id} className="flex w-max flex-col items-center px-2">
            <div className="w-full">
              <BusCap
                index={index}
                total={childrenNodes.length}
                dropActive={active}
                leftActive={leftActive}
                rightActive={rightActive}
              />
            </div>
            {isOrgChild(child) && isSector(child) ? (
              <SectorBranch
                sector={child}
                department={department}
                highlight={highlight}
                areaFocus={areaFocus}
                onSelect={onSelect}
                onHighlight={onHighlight}
              />
            ) : (
              <div className="w-60">
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

function neighborActive(
  nodes: Array<OrgChild | Project>,
  index: number,
  department: Department,
  highlight: FlowHighlight | null,
  areaFocus: string | null,
  sector?: Sector,
) {
  const child = nodes[index];
  if (!child) return false;
  return childActive(
    department.id,
    undefined,
    highlight,
    areaFocus,
    isOrgChild(child) && isSector(child) ? child.id : sector?.id,
    sector || !(isOrgChild(child) && isSector(child)) ? child.id : undefined,
  );
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
      <div className="w-52">
        <SectorNode
          sector={sector}
          departmentId={department.id}
          accentKey={accentKey}
          active={active}
        />
      </div>
      <FlowLine orientation="vertical" active={active} className="h-6 w-0.5" />
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
