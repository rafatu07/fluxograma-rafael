export const departmentAccents: Record<string, string> = {
  "administracao-financeira": "#2563EB",
  "receita-fiscalizacao": "#C2410C",
  "relacoes-federativas": "#6366F1",
  "planejamento-orcamento": "#0E7490",
  gabinete: "#D9A441",
  tesouraria: "#0F766E",
};

export function accentFor(departmentId: string) {
  return departmentAccents[departmentId] ?? "#2563EB";
}
