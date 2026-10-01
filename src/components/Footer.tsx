export function Footer() {
  return (
    <footer className="mx-auto mt-14 w-full max-w-[1360px] px-4 pb-8 sm:px-6">
      <div className="flex flex-col gap-2 border-t border-line pt-5 text-sm text-muted sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-medium text-ink">
            Mapa de Projetos Digitais — Secretaria da Fazenda
          </p>
          <p>Soluções digitais desenvolvidas para apoio às atividades da Fazenda.</p>
          <p className="mt-1">Desenvolvimento: Rafael Turino de Oliveira</p>
          <p>Lotação: Gabinete da Secretaria da Fazenda</p>
        </div>
        <p>Última atualização: Outubro/2026</p>
      </div>
    </footer>
  );
}
