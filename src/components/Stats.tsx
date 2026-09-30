import type { OrganizationStats } from "../data/organization.ts";

type StatsProps = {
  stats: OrganizationStats;
};

const labels = [
  { key: "projects", label: "Projetos", tone: "#2563EB" },
  { key: "completed", label: "Concluídos", tone: "#059669" },
  { key: "inProgress", label: "Em desenvolvimento", tone: "#D9A441" },
  { key: "areas", label: "Áreas", tone: "#163B5C" },
] as const;

export function Stats({ stats }: StatsProps) {
  return (
    <section
      aria-label="Indicadores"
      className="enter mx-auto grid w-full max-w-3xl grid-cols-2 gap-3 px-4 py-6 sm:grid-cols-4 sm:px-6"
      style={{ animationDelay: "70ms" }}
    >
      {labels.map((item) => (
        <div
          key={item.key}
          className="rounded-2xl border border-line bg-white/88 px-3 py-3 text-center shadow-sm backdrop-blur-sm"
        >
          <span
            aria-hidden="true"
            className="mx-auto mb-2 block h-0.5 w-8 rounded-full"
            style={{ backgroundColor: item.tone }}
          />
          <p className="text-2xl font-semibold tracking-tight text-ink">
            {stats[item.key]}
          </p>
          <p className="text-sm text-muted">{item.label}</p>
        </div>
      ))}
    </section>
  );
}
