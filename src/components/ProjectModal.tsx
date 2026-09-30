import type { ProjectContext } from "../data/organization.ts";
import { iconMap } from "./icons.tsx";
import { SystemLink } from "./ProjectNode.tsx";
import { StatusBadge } from "./StatusBadge.tsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "./ui/dialog.tsx";

type ProjectModalProps = {
  selection: ProjectContext | null;
  onClose: () => void;
};

export function ProjectModal({ selection, onClose }: ProjectModalProps) {
  const project = selection?.project;
  const Icon = project ? iconMap[project.icon] : null;

  return (
    <Dialog open={selection !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        {selection && project && Icon ? (
          <>
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-ink">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </div>
            <DialogTitle>{project.name}</DialogTitle>
            <DialogDescription>{project.description}</DialogDescription>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                  Área responsável
                </dt>
                <dd className="text-slate-800">{selection.departmentName}</dd>
              </div>
              {selection.sectorName ? (
                <div>
                  <dt className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                    Subárea
                  </dt>
                  <dd className="text-slate-800">{selection.sectorName}</dd>
                </div>
              ) : null}
              <div>
                <dt className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                  Status
                </dt>
                <dd className="mt-1">
                  <StatusBadge status={project.status} />
                </dd>
              </div>
              {project.note ? (
                <div>
                  <dt className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                    Observação
                  </dt>
                  <dd className="text-slate-700">{project.note}</dd>
                </div>
              ) : null}
              {project.highlights ? (
                <div>
                  <dt className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                    Destaques
                  </dt>
                  <dd>
                    <ul className="mt-1 list-disc space-y-1 pl-4 text-slate-700">
                      {project.highlights.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </dd>
                </div>
              ) : null}
              <div>
                <dt className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                  Link do sistema
                </dt>
                <dd className="break-all text-slate-700">{project.url}</dd>
              </div>
            </dl>
            <div className="mt-5">
              <SystemLink project={project} />
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
