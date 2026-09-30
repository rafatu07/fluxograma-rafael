import { useEffect, useState, type CSSProperties } from "react";
import { accentFor } from "../data/accents.ts";
import {
  listMapUnits,
  listVisibleProjects,
  type Department,
  type FlowHighlight,
  type MapUnit,
  type ProjectContext,
  type VisibleProject,
} from "../data/organization.ts";
import { cn } from "../lib/utils.ts";
import { Connector, FlowLine } from "./Connector.tsx";
import { DepartmentNode } from "./DepartmentNode.tsx";
import { MunicipalityBrand } from "./MunicipalityBrand.tsx";
import { ProjectNode } from "./ProjectNode.tsx";

type OrganizationMapProps = {
  departments: Department[];
  onSelect: (selection: ProjectContext) => void;
};

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

function rowHas(row: MapUnit[], id?: string) {
  return Boolean(id && row.some((unit) => unit.id === id));
}

function focusedUnitId(
  highlight: FlowHighlight | null,
  areaFocus: string | null,
) {
  return highlight?.departmentId ?? areaFocus ?? undefined;
}

export function OrganizationMap({ departments, onSelect }: OrganizationMapProps) {
  const [highlight, setHighlight] = useState<FlowHighlight | null>(null);
  const [areaFocus, setAreaFocus] = useState<string | null>(null);
  const units = listMapUnits(departments);
  const projects = listVisibleProjects(departments);
  const focusId = focusedUnitId(highlight, areaFocus);
  const columns = useColumns(units.length);
  const rows = chunk(units, columns);

  if (units.length === 0) {
    return (
      <p className="px-4 py-16 text-center text-sm text-muted">
        Nenhum projeto corresponde aos filtros selecionados.
      </p>
    );
  }

  return (
    <div className="mx-auto mt-8 w-full max-w-[1360px] px-4 sm:px-6">
      <section
        aria-label="Fluxograma da Secretaria da Fazenda"
        className="flex flex-col items-center"
      >
        <RootNode active={focusId !== undefined} />
        <Connector active={focusId !== undefined} />
        {rows.map((row, rowIndex) => {
          const showBar = columns > 1 && row.length > 1;
          const stemActive = rows
            .slice(rowIndex)
            .some((item) => rowHas(item, focusId));

          return (
            <div
              key={row.map((unit) => unit.id).join("-")}
              className="flex w-full flex-col items-center"
            >
              {rowIndex > 0 ? (
                <Connector active={stemActive} className="h-10" />
              ) : null}
              {showBar ? (
                <div className="relative h-px w-full">
                  <FlowLine
                    orientation="horizontal"
                    active={rowHas(row, focusId)}
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
                {row.map((unit, index) => (
                  <div
                    key={unit.id}
                    className={cn(
                      "area-column flex min-w-0 flex-col items-center",
                      showBar ? "w-full" : "w-full max-w-sm",
                    )}
                    data-lit={areaFocus === unit.id ? "true" : "false"}
                    style={{ "--area": accentFor(unit.id) } as CSSProperties}
                  >
                    {showBar ? <Connector active={focusId === unit.id} /> : null}
                    <div
                      className="enter flex w-full flex-1 flex-col"
                      style={{ animationDelay: `${200 + (rowIndex * columns + index) * 70}ms` }}
                    >
                      <DepartmentNode
                        unit={unit}
                        active={focusId === unit.id}
                        onHover={(active) => setAreaFocus(active ? unit.id : null)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </section>
      {projects.length > 0 ? (
        <section aria-label="Projetos digitais" className="mt-10">
          <h2 className="mb-4 text-center text-sm font-semibold tracking-[0.16em] text-ink uppercase">
            Projetos Digitais
          </h2>
          <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-2 xl:grid-cols-3">
            {projects.map((entry) => (
              <ProjectCard
                key={entry.project.id}
                entry={entry}
                highlight={highlight}
                areaFocus={areaFocus}
                onSelect={onSelect}
                onHighlight={setHighlight}
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
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

function ProjectCard({
  entry,
  highlight,
  areaFocus,
  onSelect,
  onHighlight,
}: {
  entry: VisibleProject;
  highlight: FlowHighlight | null;
  areaFocus: string | null;
  onSelect: (selection: ProjectContext) => void;
  onHighlight: (highlight: FlowHighlight | null) => void;
}) {
  const accentKey =
    entry.sectorId === "tesouraria" ? entry.sectorId : entry.departmentId;
  const linked = areaFocus === entry.departmentId;

  return (
    <ProjectNode
      project={entry.project}
      departmentId={entry.departmentId}
      accentKey={accentKey}
      departmentName={entry.departmentName}
      sectorName={entry.sectorName}
      active={highlight?.projectId === entry.project.id}
      linked={linked}
      onOpen={() =>
        onSelect({
          project: entry.project,
          departmentName: entry.departmentName,
          sectorName: entry.sectorName,
        })
      }
      onHighlight={(active) =>
        onHighlight(
          active
            ? {
                departmentId: entry.departmentId,
                sectorId: entry.sectorId,
                projectId: entry.project.id,
              }
            : null,
        )
      }
    />
  );
}
