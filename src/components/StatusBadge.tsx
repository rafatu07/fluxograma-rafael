import { statusLabel, type ProjectStatus } from "../data/organization.ts";
import { cn } from "../lib/utils.ts";

type StatusBadgeProps = {
  status: ProjectStatus;
  compact?: boolean;
};

export function StatusBadge({ status, compact = false }: StatusBadgeProps) {
  const concluded = status === "concluido";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-medium",
        compact
          ? "gap-1 px-1.5 py-px text-[10px] leading-4"
          : "gap-1.5 px-2 py-0.5 text-xs",
        concluded
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-amber-200 bg-amber-50 text-amber-900",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "status-dot rounded-full",
          compact ? "h-1 w-1" : "h-1.5 w-1.5",
          concluded ? "bg-emerald-600" : "bg-amber-600",
        )}
      />
      {statusLabel[status]}
    </span>
  );
}
