import { accentFor } from "../data/accents.ts";
import type { Sector } from "../data/organization.ts";
import { cn } from "../lib/utils.ts";
import { iconMap } from "./icons.tsx";

type SectorNodeProps = {
  sector: Sector;
  departmentId: string;
  accentKey?: string;
  active?: boolean;
};

export function SectorNode({
  sector,
  departmentId,
  accentKey,
  active = false,
}: SectorNodeProps) {
  const Icon = iconMap[sector.icon];
  const accent = accentFor(accentKey ?? departmentId);

  return (
    <div
      className={cn(
        "w-full rounded-xl border bg-white/90 px-3 py-3 text-center backdrop-blur-sm",
        active ? "shadow-sm" : "border-line",
      )}
      style={active ? { borderColor: accent } : undefined}
    >
      <span
        aria-hidden="true"
        className="mx-auto mb-2 block h-0.5 w-8 rounded-full"
        style={{ backgroundColor: accent }}
      />
      <div
        className="mx-auto mb-1 flex h-8 w-8 items-center justify-center rounded-lg bg-white"
        style={{ color: accent }}
      >
        <Icon className="h-4 w-4" aria-hidden="true" />
      </div>
      <p className="text-sm font-semibold text-slate-800">{sector.name}</p>
    </div>
  );
}
