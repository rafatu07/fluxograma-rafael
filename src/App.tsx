import { useMemo, useState } from "react";
import { Filters } from "./components/Filters.tsx";
import { Footer } from "./components/Footer.tsx";
import { Header } from "./components/Header.tsx";
import { InteractiveBackground } from "./components/InteractiveBackground.tsx";
import { OrganizationMap } from "./components/OrganizationMap.tsx";
import { ProjectModal } from "./components/ProjectModal.tsx";
import { Stats } from "./components/Stats.tsx";
import {
  computeStats,
  departments,
  filterOrganization,
  type ProjectContext,
  type StatusFilter,
} from "./data/organization.ts";

export default function App() {
  const [status, setStatus] = useState<StatusFilter>("todos");
  const [areaId, setAreaId] = useState("todas");
  const [selection, setSelection] = useState<ProjectContext | null>(null);

  const visibleDepartments = useMemo(
    () => filterOrganization(departments, status, areaId),
    [status, areaId],
  );
  const stats = useMemo(
    () => computeStats(visibleDepartments),
    [visibleDepartments],
  );

  return (
    <div className="relative min-h-screen">
      <InteractiveBackground />
      <div className="relative z-10">
        <Header />
        <main>
          <Stats stats={stats} />
          <Filters
            status={status}
            areaId={areaId}
            departments={departments}
            onStatusChange={setStatus}
            onAreaChange={setAreaId}
          />
          <OrganizationMap
            key={`${status}-${areaId}`}
            departments={visibleDepartments}
            onSelect={setSelection}
          />
        </main>
        <Footer />
      </div>
      <ProjectModal selection={selection} onClose={() => setSelection(null)} />
    </div>
  );
}
