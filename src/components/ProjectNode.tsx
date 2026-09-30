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

  const clearHighlight = (event: FocusEvent<HTMLElement>) => {
    const next = event.relatedTarget;
    if (!(next instanceof Node) || !event.currentTarget.contains(next)) {
      onHighlight(false);
    }
  };

  return (
    <article
      className={cn(
        "project-card group relative w-full rounded-2xl border bg-white/92 py-4 pr-4 pl-5 text-left shadow-sm backdrop-blur-sm transition duration-200 hover:-translate-y-1 hover:shadow-md",
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
        className="absolute inset-y-3 left-0 w-1 rounded-r-full"
        style={{ backgroundColor: accent }}
      />
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Ver detalhes de ${project.name}`}
        className="w-full rounded-lg text-left"
      >
        <span
          className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg transition duration-200 group-hover:-translate-y-0.5 group-hover:scale-105"
          style={{
            color: accent,
            backgroundColor: `color-mix(in srgb, ${accent} 12%, white)`,
          }}
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        <span className="block text-sm font-semibold text-slate-900 text-balance">
          {project.name}
        </span>
        <span className="mt-1 block text-xs text-muted">Área: {departmentName}</span>
        {sectorName ? (
          <span className="mt-0.5 block text-xs text-muted">Subárea: {sectorName}</span>
        ) : null}
        <span className="mt-2 block">
          <StatusBadge status={project.status} />
        </span>
        <span className="mt-2 line-clamp-3 block text-sm leading-5 text-muted">
          {project.description}
        </span>
      </button>
      <a
        href={project.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Abrir sistema ${project.name} em nova aba`}
        className="group/link mt-3 inline-flex items-center gap-1.5 rounded-lg bg-ink px-3 py-1.5 text-sm font-medium text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#1d4d75] hover:shadow-md"
      >
        Abrir sistema
        <span
          aria-hidden="true"
          className="transition-transform duration-200 group-hover/link:translate-x-[3px]"
        >
          →
        </span>
      </a>
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
