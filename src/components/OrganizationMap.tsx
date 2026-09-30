import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { accentFor } from "../data/accents.ts";
import {
  isSector,
  type Department,
  type FlowHighlight,
  type OrgChild,
  type Project,
  type ProjectContext,
  type Sector,
} from "../data/organization.ts";
import { cn } from "../lib/utils.ts";
import { Connector, FlowLine } from "./Connector.tsx";
import { DepartmentNode } from "./DepartmentNode.tsx";
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

function useColumns(count: number) {
  const [width, setWidth] = useState(() => window.innerWidth);

  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  if (count <= 1) return 1;
  if (width >= 1280) return Math.min(count, 4);
  if (width >= 768) return Math.min(count, 2);
  return 1;
}

function chunk<T>(items: T[], size: number) {
  const rows: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    rows.push(items.slice(index, index + size));
  }
  return rows;
}

function rowHas(row: Department[], id?: string) {
  return Boolean(id && row.some((department) => department.id === id));
}

function childOnPath(
  child: OrgChild,
  highlight: FlowHighlight | null,
  departmentId: string,
  areaFocus: string | null,
) {
  if (areaFocus === departmentId) return true;
  if (!highlight || highlight.departmentId !== departmentId) return false;
  if (isSector(child)) return highlight.sectorId === child.id;
  return highlight.projectId === child.id;
}

export function OrganizationMap({ departments, onSelect }: OrganizationMapProps) {
  const [highlight, setHighlight] = useState<FlowHighlight | null>(null);
  const [areaFocus, setAreaFocus] = useState<string | null>(null);
  const focusedId = highlight?.departmentId ?? areaFocus ?? undefined;
  const columns = useColumns(departments.length);
  const rows = chunk(departments, columns);

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
      <div className="flex flex-col items-center">
        <RootNode active={focusedId !== undefined} />
        <Connector active={focusedId !== undefined} />
        {rows.map((row, rowIndex) => {
          const showBar = columns > 1 && row.length > 1;
          const stemActive = rows
            .slice(rowIndex)
            .some((item) => rowHas(item, focusedId));

          return (
            <div
              key={row.map((department) => department.id).join("-")}
              className="flex w-full flex-col items-center"
            >
              {rowIndex > 0 ? (
                <Connector active={stemActive} className="h-10" />
              ) : null}
              {showBar ? (
                <div className="relative h-px w-full">
                  <FlowLine
                    orientation="horizontal"
                    active={rowHas(row, focusedId)}
                    className="absolute top-0 h-px"
                    style={{
                      left: `${50 / row.length}%`,
                      right: `${50 / row.length}%`,
                    }}
                  />
                </div>
              ) : null}
              <div
                className={cn("w-full", showBar ? "grid gap-x-5" : "flex justify-center")}
                style={
                  showBar
                    ? { gridTemplateColumns: `repeat(${row.length}, minmax(0, 1fr))` }
                    : undefined
                }
              >
                {row.map((department, index) => (
                  <div
                    key={department.id}
                    className={cn(
                      "area-column flex min-w-0 flex-col items-center",
                      showBar ? "w-full" : "w-full max-w-xl",
                    )}
                    data-lit={areaFocus === department.id ? "true" : "false"}
                    style={{ "--area": accentFor(department.id) } as CSSProperties}
                  >
                    {showBar ? (
                      <Connector active={focusedId === department.id} />
                    ) : null}
                    <DepartmentColumn
                      department={department}
                      highlight={highlight}
                      areaFocus={areaFocus}
                      delay={`${200 + (rowIndex * columns + index) * 70}ms`}
                      onSelect={onSelect}
                      onHighlight={setHighlight}
                      onAreaFocus={setAreaFocus}
                    />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
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
          "relative flex flex-col items-center gap-2 rounded-2xl border bg-white/95 px-8 py-5 text-center shadow-sm backdrop-blur-sm",
          active ? "border-ink shadow-md" : "border-line",
        )}
      >
        <MunicipalityBrand size="node" />
        <p className="text-sm font-semibold tracking-[0.14em] text-ink uppercase">
          Secretaria da Fazenda
        </p>
        <p className="text-xs text-muted">Prefeitura de Taubaté</p>
      </div>
    </div>
  );
}

function DepartmentColumn({
  department,
  highlight,
  areaFocus,
  delay,
  onSelect,
  onHighlight,
  onAreaFocus,
}: {
  department: Department;
  highlight: FlowHighlight | null;
  areaFocus: string | null;
  delay: string;
  onSelect: (selection: ProjectContext) => void;
  onHighlight: (highlight: FlowHighlight | null) => void;
  onAreaFocus: (departmentId: string | null) => void;
}) {
  const departmentActive =
    highlight?.departmentId === department.id || areaFocus === department.id;
  const highlightProject: HighlightHandler = (project, sectorId, active) => {
    onHighlight(
      active
        ? {
            departmentId: department.id,
            sectorId,
            projectId: project.id,
          }
        : null,
    );
  };

  return (
    <div
      className="enter flex w-full flex-col items-center"
      style={{ animationDelay: delay }}
    >
      <DepartmentNode
        department={department}
        active={departmentActive}
        onHover={(active) => onAreaFocus(active ? department.id : null)}
      />
      {department.children.length === 1 ? (
        <>
          <Connector
            active={childOnPath(
              department.children[0],
              highlight,
              department.id,
              areaFocus,
            )}
          />
          <ChildContent
            child={department.children[0]}
            department={department}
            highlight={highlight}
            areaFocus={areaFocus}
            onSelect={onSelect}
            onHighlight={highlightProject}
          />
        </>
      ) : (
        <SiblingRail
          stemActive={departmentActive}
          items={department.children.map((child) => ({
            id: child.id,
            active: childOnPath(child, highlight, department.id, areaFocus),
            node: (
              <ChildContent
                child={child}
                department={department}
                highlight={highlight}
                areaFocus={areaFocus}
                onSelect={onSelect}
                onHighlight={highlightProject}
              />
            ),
          }))}
        />
      )}
    </div>
  );
}

function SiblingRail({
  items,
  stemActive,
}: {
  items: { id: string; active: boolean; node: ReactNode }[];
  stemActive: boolean;
}) {
  return (
    <div className="flex w-full flex-col items-center">
      <Connector active={stemActive} />
      <div className="relative w-full">
        <FlowLine
          orientation="horizontal"
          active={stemActive}
          className="absolute top-0 left-0 h-px w-1/2"
        />
        <span
          className={cn(
            "rail-line absolute top-0 left-0 h-4 w-px",
            stemActive ? "bg-line-active" : "bg-line",
          )}
        />
        <ul className="flex flex-col gap-4 pt-4">
          {items.map((item, index) => (
            <li key={item.id} className="relative pl-5">
              <span
                className={cn(
                  "rail-line absolute top-0 left-0 w-px",
                  stemActive ? "bg-line-active" : "bg-line",
                  index === items.length - 1 ? "h-8" : "-bottom-4",
                )}
              />
              <span
                className={cn(
                  "rail-line absolute top-8 left-0 h-px w-5",
                  item.active ? "bg-line-active" : "bg-line",
                )}
              />
              {item.node}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function ChildContent({
  child,
  department,
  highlight,
  areaFocus,
  onSelect,
  onHighlight,
}: {
  child: OrgChild;
  department: Department;
  highlight: FlowHighlight | null;
  areaFocus: string | null;
  onSelect: (selection: ProjectContext) => void;
  onHighlight: HighlightHandler;
}) {
  if (isSector(child)) {
    return (
      <SectorBranch
        sector={child}
        departmentName={department.name}
        departmentId={department.id}
        highlight={highlight}
        areaFocus={areaFocus}
        onSelect={onSelect}
        onHighlight={onHighlight}
      />
    );
  }

  return (
    <ProjectNode
      project={child}
      departmentId={department.id}
      departmentName={department.name}
      active={highlight?.projectId === child.id}
      linked={areaFocus === department.id}
      onOpen={() =>
        onSelect({
          project: child,
          departmentName: department.name,
        })
      }
      onHighlight={(active) => onHighlight(child, undefined, active)}
    />
  );
}

function SectorBranch({
  sector,
  departmentName,
  departmentId,
  highlight,
  areaFocus,
  onSelect,
  onHighlight,
}: {
  sector: Sector;
  departmentName: string;
  departmentId: string;
  highlight: FlowHighlight | null;
  areaFocus: string | null;
  onSelect: (selection: ProjectContext) => void;
  onHighlight: HighlightHandler;
}) {
  const sectorActive =
    areaFocus === departmentId ||
    (highlight?.departmentId === departmentId && highlight.sectorId === sector.id);
  const accentKey = sector.id === "tesouraria" ? sector.id : departmentId;
  const projectOnPath = (projectId: string) =>
    areaFocus === departmentId || highlight?.projectId === projectId;

  const projectNode = (project: Sector["projects"][number]) => (
    <ProjectNode
      project={project}
      departmentId={departmentId}
      accentKey={accentKey}
      departmentName={departmentName}
      sectorName={sector.name}
      active={highlight?.projectId === project.id}
      linked={areaFocus === departmentId}
      onOpen={() =>
        onSelect({
          project,
          departmentName,
          sectorName: sector.name,
        })
      }
      onHighlight={(active) => onHighlight(project, sector.id, active)}
    />
  );

  return (
    <div className="flex w-full flex-col items-center">
      <SectorNode
        sector={sector}
        departmentId={departmentId}
        accentKey={accentKey}
        active={sectorActive}
      />
      {sector.projects.length > 1 ? (
        <SiblingRail
          stemActive={sectorActive}
          items={sector.projects.map((project) => ({
            id: project.id,
            active: projectOnPath(project.id),
            node: projectNode(project),
          }))}
        />
      ) : (
        sector.projects.map((project) => (
          <div key={project.id} className="flex w-full flex-col items-center">
            <Connector active={projectOnPath(project.id)} />
            {projectNode(project)}
          </div>
        ))
      )}
    </div>
  );
}
