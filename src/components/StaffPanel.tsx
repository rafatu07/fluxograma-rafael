import type { Officer, StaffContext } from "../data/organization.ts";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "./ui/dialog.tsx";

type StaffPanelProps = {
  selection: StaffContext | null;
  onClose: () => void;
};

function OfficerBlock({
  title,
  officers,
}: {
  title: string;
  officers: readonly Officer[];
}) {
  if (officers.length === 0) return null;

  return (
    <section>
      <h3 className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
        {title}
      </h3>
      <ul className="mt-2 space-y-3">
        {officers.map((officer) => (
          <li key={`${officer.role}-${officer.name}`}>
            <p className="text-sm font-medium text-slate-800">{officer.name}</p>
            <p className="text-xs text-slate-500">{officer.role}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function StaffPanel({ selection, onClose }: StaffPanelProps) {
  return (
    <Dialog open={selection !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="top-0 right-0 left-auto h-full max-h-none w-[min(100%,24rem)] translate-x-0 translate-y-0 rounded-none rounded-l-2xl border-y-0 border-r-0 p-6 sm:rounded-l-2xl">
        {selection ? (
          <>
            <DialogTitle>{selection.title}</DialogTitle>
            {selection.subtitle ? (
              <p className="mt-1 text-xs font-semibold tracking-[0.16em] text-slate-500 uppercase">
                {selection.subtitle}
              </p>
            ) : null}
            <DialogDescription>
              Servidores lotados nesta unidade.
            </DialogDescription>
            <div className="mt-6 space-y-6">
              <OfficerBlock title="Responsável" officers={selection.officers} />
              <OfficerBlock title="Equipe" officers={selection.staff} />
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
