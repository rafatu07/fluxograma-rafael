import { accentFor } from "../data/accents.ts";
import { projectWord, type MapUnit } from "../data/organization.ts";
import { cn } from "../lib/utils.ts";
import { iconMap } from "./icons.tsx";

type DepartmentNodeProps = {
  unit: MapUnit;
  active?: boolean;
  onHover?: (active: boolean) => void;
};

export function DepartmentNode({
  unit,
  active = false,
  onHover,
}: DepartmentNodeProps) {
  const Icon = iconMap[unit.icon];
  const accent = accentFor(unit.id);

  return (
    <article
      className={cn(
        "flex h-full min-h-full w-full flex-1 flex-col rounded-2xl border bg-white/92 px-4 py-4 text-center shadow-sm backdrop-blur-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md",
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
        {unit.name}
      </h2>
      <p className="mt-auto pt-1 text-xs text-muted">
        {unit.projectCount} {projectWord(unit.projectCount)}
      </p>
    </article>
  );
}
