export type ProjectStatus =
  | "concluido"
  | "em-desenvolvimento"
  | "em-homologacao";

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

export type OrgUnitType = "sector" | "division" | "supervision";

export type OrgUnit = {
  id: string;
  name: string;
  type: OrgUnitType;
  icon: IconKey;
  /** Servidores além do responsável principal; abertos no painel lateral. */
  staff?: Officer[];
  children: OrgUnitChild[];
};

/** @deprecated Use OrgUnit with type "sector" */
export type Sector = OrgUnit;

export type DirectProject = Project & {
  type: "project";
};

export type OrgUnitChild = OrgUnit | DirectProject;

export type OrgChild = OrgUnit | DirectProject;

export type Officer = {
  name: string;
  role: string;
};

export type Department = {
  id: string;
  name: string;
  sigla: string;
  icon: IconKey;
  officers: Officer[];
  /** Servidores além do responsável principal; abertos no painel lateral. */
  staff?: Officer[];
  children: OrgChild[];
};

export type StaffContext = {
  title: string;
  subtitle?: string;
  officers: Officer[];
  staff: Officer[];
};

export const secretariatOfficers: Officer[] = [
  { name: "Pedro Henrique Bianchi", role: "Secretário da Fazenda" },
  { name: "Luis Claudio de Toledo Araujo", role: "Secretário Adjunto da Fazenda" },
];

export type ProjectContext = {
  project: Project;
  departmentName: string;
  sectorName?: string;
  unitPath?: string;
};

export type FlowHighlight = {
  departmentId: string;
  sectorId?: string;
  unitFlowId?: string;
  projectId: string;
};

export type OrganizationStats = {
  projects: number;
  completed: number;
  inProgress: number;
  inHomologation: number;
  areas: number;
};

export const statusLabel: Record<ProjectStatus, string> = {
  concluido: "Concluído",
  "em-desenvolvimento": "Em desenvolvimento",
  "em-homologacao": "Em homologação",
};

export const CABINET_ID = "gabinete";

export const departments: Department[] = [
  {
    id: "administracao-financeira",
    name: "Departamento de Administração Financeira",
    sigla: "DAF",
    icon: "wallet",
    officers: [
      {
        name: "Helen Viviana de Oliveira Paschetta",
        role: "Diretora do Departamento de Administração Financeira",
      },
    ],
    children: [
      {
        id: "contabilidade",
        name: "Contabilidade",
        type: "sector",
        icon: "calculator",
        children: [
          {
            id: "divisao-contabilidade",
            name: "Divisão de Contabilidade",
            type: "division",
            icon: "calculator",
            children: [
              {
                id: "supervisao-empenho",
                name: "Supervisão de Empenho",
                type: "supervision",
                icon: "clipboard",
                children: [],
              },
            ],
          },
          {
            id: "divisao-calculos-terceiro-setor",
            name: "Divisão de Cálculos e Terceiro Setor",
            type: "division",
            icon: "calculator",
            children: [
              {
                id: "supervisao-calculos-administrativos-judiciais",
                name: "Supervisão de Cálculos Administrativos e Judiciais",
                type: "supervision",
                icon: "clipboard",
                children: [],
              },
            ],
          },
          {
            id: "divisao-liquidacao-pagamento",
            name: "Divisão de Liquidação e Pagamento",
            type: "division",
            icon: "receipt",
            children: [
              {
                id: "controle-aluguel",
                name: "Controle de Processos de Aluguel",
                type: "project",
                status: "concluido",
                url: "https://controle-aluguel-fran.vercel.app/",
                description:
                  "Sistema desenvolvido para apoiar a Contabilidade no controle e acompanhamento dos processos relacionados a aluguéis.",
                icon: "receipt",
              },
            ],
          },
        ],
      },
      {
        id: "tesouraria",
        name: "Tesouraria",
        type: "sector",
        icon: "landmark",
        children: [
          {
            id: "divisao-conciliacao-bancaria",
            name: "Divisão de Conciliação Bancária",
            type: "division",
            icon: "banknote",
            children: [
              {
                id: "supervisao-conciliacao-bancaria",
                name: "Supervisão de Conciliação Bancária",
                type: "supervision",
                icon: "clipboard",
                children: [],
              },
            ],
          },
          {
            id: "divisao-tesouraria",
            name: "Divisão de Tesouraria",
            type: "division",
            icon: "landmark",
            children: [
              {
                id: "supervisao-tesouraria",
                name: "Supervisão de Tesouraria",
                type: "supervision",
                icon: "clipboard",
                children: [],
              },
            ],
          },
          {
            id: "fluxo-caixa",
            name: "Fluxo de Caixa e Projeção Financeira",
            type: "project",
            status: "concluido",
            url: "https://fluxocaixatte.vercel.app/",
            description:
              "Sistema para controle do fluxo de caixa e projeção financeira, com foco na organização, acompanhamento e visualização dos recursos.",
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
            type: "project",
            status: "em-homologacao",
            url: "https://controle-processos-tesouraria.vercel.app/",
            description:
              "Sistema em homologação para controle, organização e acompanhamento dos processos de compensação bancária.",
            icon: "banknote",
          },
          {
            id: "saldos-bancarios",
            name: "Conferência de Saldos Bancários",
            type: "project",
            status: "em-homologacao",
            url: "https://saldo-bancario.vercel.app/login",
            description:
              "Sistema em homologação para conferência e controle dos saldos bancários da Prefeitura Municipal de Taubaté.",
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
    id: "receita-fiscalizacao",
    name: "Departamento de Receita e Fiscalização Tributária",
    sigla: "DRFT",
    icon: "receipt",
    officers: [
      {
        name: "Sarah Nicia Sendretti Santos",
        role: "Diretora do Departamento de Receita e Fiscalização Tributária",
      },
    ],
    children: [],
  },
  {
    id: "relacoes-federativas",
    name: "Departamento de Relações Federativas",
    sigla: "DRF",
    icon: "handshake",
    officers: [
      {
        name: "Kátia Cristina de Oliveira",
        role: "Diretora do Departamento de Relações Federativas",
      },
    ],
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
    id: "planejamento-orcamento",
    name: "Departamento de Planejamento, Orçamento e Gestão Estratégica",
    sigla: "DPOGE",
    icon: "chart",
    officers: [
      {
        name: "Renato Motta Bicudo Guimaraes e Silva",
        role: "Diretor do Departamento de Planejamento, Orçamento e Gestão Estratégica",
      },
    ],
    children: [
      {
        id: "divisao-controle-economico",
        name: "Divisão de Controle Econômico",
        type: "division",
        icon: "chart",
        children: [],
      },
      {
        id: "divisao-planejamento-estrategico",
        name: "Divisão de Planejamento Estratégico",
        type: "division",
        icon: "clipboard",
        children: [],
      },
    ],
  },
  {
    id: CABINET_ID,
    name: "Gabinete da Secretaria",
    sigla: "GSEFAZ",
    icon: "building",
    officers: [{ name: "Fabio Augusto de Alcantara", role: "Chefe de Gabinete" }],
    staff: [
      { name: "Paulo Gustavo Correa Silveira", role: "Assessor" },
      { name: "Elza Karina Maciel Cardoso", role: "Assessor" },
      { name: "Alexandre Theofilo Jacyntho", role: "Assessor" },
      { name: "Rafael Turino de Oliveira", role: "Escriturário" },
    ],
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

export function isOrgUnit(child: OrgChild | OrgUnitChild): child is OrgUnit {
  return child.type === "sector" || child.type === "division" || child.type === "supervision";
}

export function isSector(child: OrgChild): child is OrgUnit {
  return child.type === "sector";
}

export function isDirectProject(
  child: OrgChild | OrgUnitChild | Project,
): child is DirectProject {
  return "type" in child && child.type === "project";
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
  unitPath?: string;
};

const projectOrder = [
  "controle-aluguel",
  "central-planilhas",
  "gestao-recursos",
  "processos-obras",
  "fluxo-caixa",
  "compensacao-bancaria",
  "saldos-bancarios",
];

function countProjectsInChildren(children: OrgUnitChild[]): number {
  return children.reduce((total, child) => {
    if (isOrgUnit(child)) return total + countProjectsInChildren(child.children);
    return total + 1;
  }, 0);
}

export function countProjects(department: Department) {
  return countProjectsInChildren(department.children);
}

function collectProjects(
  children: OrgUnitChild[],
  department: Department,
  sector?: OrgUnit,
  pathNames: string[] = [],
): VisibleProject[] {
  const items: VisibleProject[] = [];

  for (const child of children) {
    if (isOrgUnit(child)) {
      const nextSector = sector ?? (child.type === "sector" ? child : undefined);
      const nextPath =
        child.type === "sector" ? pathNames : [...pathNames, child.name];
      items.push(
        ...collectProjects(child.children, department, nextSector, nextPath),
      );
    } else {
      items.push({
        project: child,
        departmentId: department.id,
        departmentName: department.name,
        sectorId: sector?.id,
        sectorName: sector?.name,
        unitPath: pathNames.length > 0 ? pathNames.join(" · ") : undefined,
      });
    }
  }

  return items;
}

export function listMapUnits(source: Department[]): MapUnit[] {
  return source.map((department) => ({
    id: department.id,
    name: department.name,
    icon: department.icon,
    projectCount: countProjects(department),
  }));
}

export function listVisibleProjects(source: Department[]): VisibleProject[] {
  const items = source.flatMap((department) =>
    collectProjects(department.children, department),
  );

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
  return source.map((department) => ({
    id: department.id,
    name: `${department.name} (${department.sigla})`,
  }));
}

export function projectWord(count: number) {
  return count === 1 ? "projeto" : "projetos";
}

function filterUnitChildren(
  children: OrgUnitChild[],
  status: StatusFilter,
): OrgUnitChild[] {
  return children.flatMap((child): OrgUnitChild[] => {
    if (isOrgUnit(child)) {
      const nested = filterUnitChildren(child.children, status);
      // Estrutura sem projetos só aparece no filtro "todos".
      if (status !== "todos" && countProjectsInChildren(nested) === 0) return [];
      return [{ ...child, children: nested }];
    }
    return matchesStatus(child.status, status) ? [child] : [];
  });
}

export function filterOrganization(
  source: Department[],
  status: StatusFilter,
  areaId: string,
): Department[] {
  return source
    .filter((department) => areaId === "todas" || department.id === areaId)
    .map((department) => ({
      ...department,
      children: filterUnitChildren(department.children, status),
    }));
}

function flattenProjects(children: OrgUnitChild[]): Project[] {
  return children.flatMap((child) =>
    isOrgUnit(child) ? flattenProjects(child.children) : [child],
  );
}

export function computeStats(source: Department[]): OrganizationStats {
  const projects = source.flatMap((department) =>
    flattenProjects(department.children),
  );

  return {
    projects: projects.length,
    completed: projects.filter((project) => project.status === "concluido")
      .length,
    inProgress: projects.filter(
      (project) => project.status === "em-desenvolvimento",
    ).length,
    inHomologation: projects.filter(
      (project) => project.status === "em-homologacao",
    ).length,
    areas: source.length,
  };
}
