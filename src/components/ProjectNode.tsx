import { ExternalLink } from "lucide-react";
import type { FocusEvent } from "react";
import { accentFor } from "../data/accents.ts";
import type { Project } from "../data/organization.ts";
import { cn } from "../lib/utils.ts";
import { iconMap } from "./icons.tsx";
import { StatusBadge } from "./StatusBadge.tsx";

type ProjectNodeProps = {
  project: Project;
  departmentId: string;
  accentKey?: string;
  departmentName: string;
  sectorName?: string;
  active?: boolean;
  linked?: boolean;
  onOpen: () => void;
  onHighlight: (active: boolean) => void;
};

export function ProjectNode({
  project,
  departmentId,
  accentKey,
  departmentName,
  sectorName,
  active = false,
  linked = false,
  onOpen,
  onHighlight,
}: ProjectNodeProps) {
  const Icon = iconMap[project.icon];
  const accent = accentFor(accentKey ?? departmentId);
  const highlighted = active || linked;
  const areaLabel = departmentName.replace(/^Departamento de /, "");
  const areaLine = sectorName ? `${areaLabel} · ${sectorName}` : areaLabel;

  const clearHighlight = (event: FocusEvent<HTMLElement>) => {
    const next = event.relatedTarget;
    if (!(next instanceof Node) || !event.currentTarget.contains(next)) {
      onHighlight(false);
    }
  };

  return (
    <article
      className={cn(
        "project-card group relative flex w-full flex-col rounded-xl border bg-white py-2.5 pr-3 pl-3.5 text-left shadow-sm transition duration-200 hover:shadow-md",
        highlighted ? "shadow-md" : "border-line hover:border-sky",
      )}
      style={highlighted ? { borderColor: accent } : undefined}
      onMouseEnter={() => onHighlight(true)}
      onMouseLeave={() => onHighlight(false)}
      onFocus={() => onHighlight(true)}
      onBlur={clearHighlight}
    >
      <span
        aria-hidden="true"
        className="absolute inset-y-2 left-0 w-0.5 rounded-r-full"
        style={{ backgroundColor: accent }}
      />
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Ver detalhes de ${project.name}`}
        className="w-full rounded-md text-left"
      >
        <span className="mb-1.5 flex items-center justify-between gap-2">
          <span
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
            style={{
              color: accent,
              backgroundColor: `color-mix(in srgb, ${accent} 12%, white)`,
            }}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
          <StatusBadge status={project.status} compact />
        </span>
        <span className="block text-[13px] leading-snug font-semibold text-slate-900 text-balance">
          {project.name}
        </span>
        <span
          className="mt-1 block truncate text-[10px] leading-4 font-medium tracking-wide"
          style={{ color: accent }}
        >
          {areaLine}
        </span>
      </button>
      <a
        href={project.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Abrir sistema ${project.name} em nova aba`}
        className="group/link mt-2 inline-flex w-fit items-center gap-1 text-xs font-medium text-ink transition hover:text-[#1d4d75]"
      >
        Abrir sistema
        <span
          aria-hidden="true"
          className="transition-transform duration-200 group-hover/link:translate-x-[2px]"
        >
          →
        </span>
      </a>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-full left-0 z-20 mt-1.5 w-full rounded-lg border border-line bg-white px-2.5 py-2 text-xs leading-4 text-muted opacity-0 shadow-md transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100"
      >
        {project.description}
      </span>
    </article>
  );
}

export function SystemLink({ project }: { project: Project }) {
  return (
    <a
      href={project.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Abrir sistema ${project.name} em nova aba`}
      className="group/link inline-flex items-center gap-2 rounded-lg bg-ink px-3.5 py-2 text-sm font-medium text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#1d4d75] hover:shadow-md"
    >
      Abrir Sistema
      <span
        aria-hidden="true"
        className="transition-transform duration-200 group-hover/link:translate-x-[3px]"
      >
        →
      </span>
      <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
    </a>
  );
}
