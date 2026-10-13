import { Users } from "lucide-react";
import { accentFor } from "../data/accents.ts";
import {
  countProjects,
  projectWord,
  type Department,
  type Officer,
  type StaffContext,
} from "../data/organization.ts";
import { cn } from "../lib/utils.ts";
import { iconMap } from "./icons.tsx";

type DepartmentNodeProps = {
  department: Department;
  active?: boolean;
  onHover?: (active: boolean) => void;
  onOpenStaff?: (selection: StaffContext) => void;
};

export function OfficerList({ officers }: { officers: readonly Officer[] }) {
  return (
    <div className="mt-2 space-y-2">
      {officers.map((officer) => (
        <div key={officer.name}>
          <p className="text-xs font-medium text-slate-800">{officer.name}</p>
          <p className="text-[11px] leading-4 text-muted">{officer.role}</p>
        </div>
      ))}
    </div>
  );
}

export function DepartmentNode({
  department,
  active = false,
  onHover,
  onOpenStaff,
}: DepartmentNodeProps) {
  const Icon = iconMap[department.icon];
  const accent = accentFor(department.id);
  const total = countProjects(department);
  const staff = department.staff ?? [];
  const hasStaff = staff.length > 0;

  return (
    <article
      className={cn(
        "flex w-full flex-col rounded-2xl border bg-white/92 px-4 py-4 text-center shadow-sm backdrop-blur-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md",
        active ? "shadow-md" : "border-line",
      )}
      style={active ? { borderColor: accent } : undefined}
      onMouseEnter={() => onHover?.(true)}
      onMouseLeave={() => onHover?.(false)}
    >
      <span
        aria-hidden="true"
        className="mx-auto mb-3 block h-0.5 w-10 rounded-full"
        style={{ backgroundColor: accent }}
      />
      <div
        className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl"
        style={{
          color: accent,
          backgroundColor: `color-mix(in srgb, ${accent} 12%, white)`,
        }}
      >
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <h2 className="text-sm font-semibold tracking-wide text-slate-900 uppercase text-balance">
        {department.name}
      </h2>
      <p className="mt-1 text-xs font-semibold tracking-[0.16em] text-muted uppercase">
        {department.sigla}
      </p>
      <OfficerList officers={department.officers} />
      {hasStaff && onOpenStaff ? (
        <button
          type="button"
          className="mt-3 inline-flex items-center justify-center gap-1.5 self-center rounded-lg border border-line px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
          onClick={(event) => {
            event.stopPropagation();
            onOpenStaff({
              title: department.name,
              subtitle: department.sigla,
              officers: department.officers,
              staff,
            });
          }}
        >
          <Users className="h-3.5 w-3.5" aria-hidden="true" />
          Equipe
        </button>
      ) : null}
      <p className="mt-3 pt-0 text-xs text-muted">
        {total} {projectWord(total)}
      </p>
    </article>
  );
}
