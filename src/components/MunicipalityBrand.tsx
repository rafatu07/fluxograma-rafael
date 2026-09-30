import { useState } from "react";
import { cn } from "../lib/utils.ts";

const sources = ["/brasao.png"];

type MunicipalityBrandProps = {
  size?: "header" | "node";
};

export function MunicipalityBrand({ size = "header" }: MunicipalityBrandProps) {
  const [sourceIndex, setSourceIndex] = useState(0);
  const missing = sourceIndex >= sources.length;
  const dimension =
    size === "node" ? "h-10 w-10 sm:h-14 sm:w-14" : "h-8 w-8 sm:h-12 sm:w-12";

  if (missing) {
    return (
      <span
        aria-hidden="true"
        className={cn(
          "inline-block shrink-0 rounded-full border border-dashed border-gold/80 bg-white/80",
          dimension,
        )}
      />
    );
  }

  return (
    <img
      src={sources[sourceIndex]}
      alt="Brasão da Prefeitura de Taubaté"
      className={cn("shrink-0 object-contain", dimension)}
      onError={() => setSourceIndex((current) => current + 1)}
    />
  );
}
