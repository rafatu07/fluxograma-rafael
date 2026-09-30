import { MunicipalityBrand } from "./MunicipalityBrand.tsx";

export function Header() {
  return (
    <header className="enter mx-auto w-full max-w-[1360px] px-4 pt-8 pb-2 text-center sm:px-6">
      <div className="flex items-center justify-center gap-3">
        <MunicipalityBrand />
        <div className="text-left">
          <p className="text-[11px] font-semibold tracking-[0.18em] text-ink uppercase">
            Prefeitura de Taubaté
          </p>
          <p className="mt-0.5 text-[11px] font-semibold tracking-[0.14em] text-muted uppercase">
            Secretaria da Fazenda
          </p>
        </div>
      </div>
      <span className="mx-auto mt-3 block h-px w-14 bg-gold" aria-hidden="true" />
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 text-balance sm:text-4xl">
        Mapa de Projetos Digitais
      </h1>
      <p className="mx-auto mt-2 max-w-2xl text-base text-muted sm:text-lg">
        Soluções digitais desenvolvidas para a Secretaria da Fazenda
      </p>
    </header>
  );
}
