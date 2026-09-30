import { statusLabel, type ProjectStatus } from "../data/organization.ts";
import { cn } from "../lib/utils.ts";

type StatusBadgeProps = {
  status: ProjectStatus;
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const concluded = status === "concluido";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium",
        concluded
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-amber-200 bg-amber-50 text-amber-900",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "status-dot h-1.5 w-1.5 rounded-full",
          concluded ? "bg-emerald-600" : "bg-amber-600",
        )}
      />
      {statusLabel[status]}
    </span>
  );
}
