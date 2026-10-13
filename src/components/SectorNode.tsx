import { Users } from "lucide-react";
import { accentFor } from "../data/accents.ts";
import type {
  IconKey,
  Officer,
  OrgUnit,
  StaffContext,
} from "../data/organization.ts";
import { cn } from "../lib/utils.ts";
import { iconMap } from "./icons.tsx";

type SectorNodeProps = {
  sector?: OrgUnit;
  name?: string;
  icon?: IconKey;
  departmentId: string;
  accentKey?: string;
  active?: boolean;
  officers?: readonly Officer[];
  staff?: readonly Officer[];
  onOpenStaff?: (selection: StaffContext) => void;
};

export function SectorNode({
  sector,
  name,
  icon,
  departmentId,
  accentKey,
  active = false,
  officers = [],
  staff,
  onOpenStaff,
}: SectorNodeProps) {
  const label = name ?? sector?.name ?? "";
  const iconKey = icon ?? sector?.icon ?? "building";
  const Icon = iconMap[iconKey];
  const accent = accentFor(accentKey ?? departmentId);
  const team = staff ?? sector?.staff ?? [];
  const hasStaff = team.length > 0;

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
      <p className="text-sm font-semibold text-slate-800">{label}</p>
      {hasStaff && onOpenStaff ? (
        <button
          type="button"
          className="mt-2 inline-flex items-center justify-center gap-1.5 rounded-lg border border-line px-2 py-1 text-[11px] font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
          onClick={(event) => {
            event.stopPropagation();
            onOpenStaff({
              title: label,
              officers: [...officers],
              staff: [...team],
            });
          }}
        >
          <Users className="h-3 w-3" aria-hidden="true" />
          Equipe
        </button>
      ) : null}
    </div>
  );
}
