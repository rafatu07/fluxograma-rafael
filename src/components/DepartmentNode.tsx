import { accentFor } from "../data/accents.ts";
import {
  countProjects,
  projectWord,
  type Department,
  type Officer,
} from "../data/organization.ts";
import { cn } from "../lib/utils.ts";
import { iconMap } from "./icons.tsx";

type DepartmentNodeProps = {
  department: Department;
  active?: boolean;
  onHover?: (active: boolean) => void;
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
}: DepartmentNodeProps) {
  const Icon = iconMap[department.icon];
  const accent = accentFor(department.id);
  const total = countProjects(department);

  return (
    <article
      className={cn(
        "flex h-full w-full flex-col rounded-2xl border bg-white/92 px-4 py-4 text-center shadow-sm backdrop-blur-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md",
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
      <OfficerList officers={department.officers} />
      <p className="mt-auto pt-3 text-xs text-muted">
        {total} {projectWord(total)}
      </p>
    </article>
  );
}
