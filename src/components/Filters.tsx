import type { Department, StatusFilter } from "../data/organization.ts";
import { cn } from "../lib/utils.ts";

type FiltersProps = {
  status: StatusFilter;
  areaId: string;
  departments: Department[];
  onStatusChange: (status: StatusFilter) => void;
  onAreaChange: (areaId: string) => void;
};

const statusOptions: { id: StatusFilter; label: string }[] = [
  { id: "todos", label: "Todos" },
  { id: "concluido", label: "Concluídos" },
  { id: "em-desenvolvimento", label: "Em desenvolvimento" },
];

export function Filters({
  status,
  areaId,
  departments,
  onStatusChange,
  onAreaChange,
}: FiltersProps) {
  return (
    <div
      className="enter mx-auto flex w-full max-w-[1360px] flex-col items-center gap-3 px-4 pb-2 sm:px-6"
      style={{ animationDelay: "120ms" }}
    >
      <div
        role="group"
        aria-label="Filtrar por status"
        className="flex flex-wrap items-center justify-center gap-2"
      >
        {statusOptions.map((option) => {
          const selected = status === option.id;
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={selected}
              onClick={() => onStatusChange(option.id)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-sm transition",
                selected
                  ? "border-ink bg-ink text-white shadow-md shadow-ink/20"
                  : "border-line bg-white/85 text-muted hover:border-azure/40",
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
      <label className="w-full max-w-sm">
        <span className="sr-only">Filtrar por área</span>
        <select
          aria-label="Filtrar por área"
          value={areaId}
          onChange={(event) => onAreaChange(event.target.value)}
          className="w-full rounded-xl border border-line bg-white/90 px-3 py-2 text-sm text-slate-800 shadow-sm"
        >
          <option value="todas">Todas as áreas</option>
          {departments.map((department) => (
            <option key={department.id} value={department.id}>
              {department.name}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
