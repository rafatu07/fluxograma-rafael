export type ProjectStatus = "concluido" | "em-desenvolvimento";

export type StatusFilter = "todos" | ProjectStatus;

export type IconKey =
  | "landmark"
  | "wallet"
  | "handshake"
  | "building"
  | "calculator"
  | "receipt"
  | "sheet"
  | "clipboard"
  | "chart"
  | "banknote";

export type Project = {
  id: string;
  name: string;
  status: ProjectStatus;
  url: string;
  description: string;
  icon: IconKey;
  note?: string;
  highlights?: readonly string[];
};

export type Sector = {
  id: string;
  name: string;
  type: "sector";
  icon: IconKey;
  projects: Project[];
};

export type DirectProject = Project & {
  type: "project";
};

export type OrgChild = Sector | DirectProject;

export type Department = {
  id: string;
  name: string;
  icon: IconKey;
  children: OrgChild[];
};

export type ProjectContext = {
  project: Project;
  departmentName: string;
  sectorName?: string;
};

export type FlowHighlight = {
  departmentId: string;
  sectorId?: string;
  projectId: string;
};

export type OrganizationStats = {
  projects: number;
  completed: number;
  inProgress: number;
  areas: number;
};

export const statusLabel: Record<ProjectStatus, string> = {
  concluido: "Concluído",
  "em-desenvolvimento": "Em desenvolvimento",
};

export const departments: Department[] = [
  {
    id: "administracao-financeira",
    name: "Departamento de Administração Financeira",
    icon: "wallet",
    children: [
      {
        id: "contabilidade",
        name: "Contabilidade",
        type: "sector",
        icon: "calculator",
        projects: [
          {
            id: "controle-aluguel",
            name: "Controle de Processos de Aluguel",
            status: "concluido",
            url: "https://controle-aluguel-fran.vercel.app/",
            description:
              "Sistema desenvolvido para apoiar a Contabilidade no controle e acompanhamento dos processos relacionados a aluguéis.",
            icon: "receipt",
          },
        ],
      },
      {
        id: "tesouraria",
        name: "Tesouraria",
        type: "sector",
        icon: "landmark",
        projects: [
          {
            id: "fluxo-caixa",
            name: "Fluxo de Caixa e Projeção Financeira",
            status: "em-desenvolvimento",
            url: "https://fluxocaixatte.vercel.app/",
            description:
              "Sistema em desenvolvimento para controle do fluxo de caixa e projeção financeira, com foco na organização, acompanhamento e visualização dos recursos.",
            icon: "chart",
            highlights: [
              "Fluxo de Caixa",
              "Dashboard Financeiro",
              "Projeções",
              "Recursos Próprios",
            ],
          },
          {
            id: "compensacao-bancaria",
            name: "Controle de Processos de Compensação Bancária",
            status: "em-desenvolvimento",
            url: "https://controle-processos-tesouraria.vercel.app/",
            description:
              "Sistema em desenvolvimento para controle, organização e acompanhamento dos processos de compensação bancária.",
            icon: "banknote",
          },
        ],
      },
      {
        id: "central-planilhas",
        name: "Central de Planilhas",
        type: "project",
        status: "concluido",
        url: "https://modulos-planilhas.vercel.app/",
        description:
          "Página desenvolvida para centralizar e organizar o acesso às planilhas utilizadas pelo Departamento de Administração Financeira.",
        icon: "sheet",
      },
    ],
  },
  {
    id: "relacoes-federativas",
    name: "Departamento de Relações Federativas",
    icon: "handshake",
    children: [
      {
        id: "gestao-recursos",
        name: "Sistema de Gestão de Recursos e Transferências",
        type: "project",
        status: "em-desenvolvimento",
        url: "https://sistema-convenio.vercel.app/login",
        description:
          "Sistema desenvolvido para gestão e acompanhamento de recursos, transferências e processos relacionados a convênios.",
        icon: "clipboard",
        note: "O projeto foi desenvolvido originalmente para o Departamento de Convênios, atualmente denominado Departamento de Relações Federativas.",
      },
    ],
  },
  {
    id: "gabinete",
    name: "Gabinete da Fazenda",
    icon: "building",
    children: [
      {
        id: "processos-obras",
        name: "Relação de Processos de Obras e Demais Processos",
        type: "project",
        status: "concluido",
        url: "https://painel-obras-tte.vercel.app/",
        description:
          "Painel desenvolvido para centralizar e facilitar a visualização e o acompanhamento dos processos relacionados a obras e demais processos do Gabinete da Fazenda.",
        icon: "clipboard",
      },
    ],
  },
];

function matchesStatus(status: ProjectStatus, filter: StatusFilter) {
  return filter === "todos" || status === filter;
}

export function isSector(child: OrgChild): child is Sector {
  return child.type === "sector";
}

export type MapUnit = {
  id: string;
  name: string;
  icon: IconKey;
  projectCount: number;
};

export type VisibleProject = {
  project: Project;
  departmentId: string;
  departmentName: string;
  sectorId?: string;
  sectorName?: string;
};

const projectOrder = [
  "controle-aluguel",
  "central-planilhas",
  "gestao-recursos",
  "processos-obras",
  "fluxo-caixa",
  "compensacao-bancaria",
];

export function countProjects(department: Department) {
  return department.children.reduce((total, child) => {
    if (isSector(child)) return total + child.projects.length;
    return total + 1;
  }, 0);
}

function findTesouraria(department: Department) {
  return department.children.find(
    (child): child is Sector => isSector(child) && child.id === "tesouraria",
  );
}

export function listMapUnits(source: Department[], areaId = "todas"): MapUnit[] {
  const units: MapUnit[] = [];
  let tesouraria: MapUnit | null = null;

  for (const department of source) {
    const sector = findTesouraria(department);

    if (areaId === "tesouraria" && sector) {
      tesouraria = {
        id: sector.id,
        name: sector.name,
        icon: sector.icon,
        projectCount: sector.projects.length,
      };
      continue;
    }

    units.push({
      id: department.id,
      name: department.name,
      icon: department.icon,
      projectCount: countProjects(department),
    });

    if (sector && sector.projects.length > 0) {
      tesouraria = {
        id: sector.id,
        name: sector.name,
        icon: sector.icon,
        projectCount: sector.projects.length,
      };
    }
  }

  if (tesouraria) units.push(tesouraria);
  return units;
}

export function listVisibleProjects(source: Department[]): VisibleProject[] {
  const items: VisibleProject[] = [];

  for (const department of source) {
    for (const child of department.children) {
      if (isSector(child)) {
        for (const project of child.projects) {
          items.push({
            project,
            departmentId: department.id,
            departmentName: department.name,
            sectorId: child.id,
            sectorName: child.name,
          });
        }
      } else {
        items.push({
          project: child,
          departmentId: department.id,
          departmentName: department.name,
        });
      }
    }
  }

  return items.sort((left, right) => {
    const leftRank = projectOrder.indexOf(left.project.id);
    const rightRank = projectOrder.indexOf(right.project.id);
    return (
      (leftRank === -1 ? projectOrder.length : leftRank) -
      (rightRank === -1 ? projectOrder.length : rightRank)
    );
  });
}

export function areaFilterOptions(source: Department[]) {
  const options = source.map((department) => ({
    id: department.id,
    name: department.name,
  }));
  const hasTesouraria = source.some((department) => findTesouraria(department));
  if (hasTesouraria) options.push({ id: "tesouraria", name: "Tesouraria" });
  return options;
}

export function projectWord(count: number) {
  return count === 1 ? "projeto" : "projetos";
}

export function filterOrganization(
  source: Department[],
  status: StatusFilter,
  areaId: string,
): Department[] {
  return source
    .filter((department) => {
      if (areaId === "todas") return true;
      if (areaId === "tesouraria") {
        return department.id === "administracao-financeira";
      }
      return department.id === areaId;
    })
    .map((department) => ({
      ...department,
      children: department.children.flatMap((child): OrgChild[] => {
        if (
          areaId === "tesouraria" &&
          !(isSector(child) && child.id === "tesouraria")
        ) {
          return [];
        }
        if (isSector(child)) {
          const projects = child.projects.filter((project) =>
            matchesStatus(project.status, status),
          );
          if (projects.length === 0) return [];
          return [{ ...child, projects }];
        }
        return matchesStatus(child.status, status) ? [child] : [];
      }),
    }))
    .filter((department) => department.children.length > 0);
}

export function computeStats(
  source: Department[],
  areaId = "todas",
): OrganizationStats {
  const projects = source.flatMap((department) =>
    department.children.flatMap((child) =>
      isSector(child) ? child.projects : [child],
    ),
  );

  return {
    projects: projects.length,
    completed: projects.filter((project) => project.status === "concluido")
      .length,
    inProgress: projects.filter(
      (project) => project.status === "em-desenvolvimento",
    ).length,
    areas: listMapUnits(source, areaId).length,
  };
}
