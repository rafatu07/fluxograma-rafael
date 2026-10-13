import { statusLabel, type ProjectStatus } from "../data/organization.ts";
import { cn } from "../lib/utils.ts";

type StatusBadgeProps = {
  status: ProjectStatus;
  compact?: boolean;
};

const statusTone: Record<
  ProjectStatus,
  { badge: string; dot: string }
> = {
  concluido: {
    badge: "border-emerald-200 bg-emerald-50 text-emerald-800",
    dot: "bg-emerald-600",
  },
  "em-desenvolvimento": {
    badge: "border-amber-200 bg-amber-50 text-amber-900",
    dot: "bg-amber-600",
  },
  "em-homologacao": {
    badge: "border-sky-200 bg-sky-50 text-sky-900",
    dot: "bg-sky-600",
  },
};

export function StatusBadge({ status, compact = false }: StatusBadgeProps) {
  const tone = statusTone[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-medium",
        compact
          ? "gap-1 px-1.5 py-px text-[10px] leading-4"
          : "gap-1.5 px-2 py-0.5 text-xs",
        tone.badge,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "status-dot rounded-full",
          compact ? "h-1 w-1" : "h-1.5 w-1.5",
          tone.dot,
        )}
      />
      {statusLabel[status]}
    </span>
  );
}
