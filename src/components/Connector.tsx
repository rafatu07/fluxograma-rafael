import type { CSSProperties } from "react";
import { cn } from "../lib/utils.ts";

type FlowLineProps = {
  orientation: "vertical" | "horizontal";
  active?: boolean;
  className?: string;
  style?: CSSProperties;
};

export function FlowLine({
  orientation,
  active = false,
  className,
  style,
}: FlowLineProps) {
  return (
    <div
      aria-hidden="true"
      data-orientation={orientation}
      data-active={active ? "true" : "false"}
      style={style}
      className={cn("flow-line relative", className)}
    />
  );
}

type ConnectorProps = {
  active?: boolean;
  className?: string;
};

export function Connector({ active = false, className }: ConnectorProps) {
  return (
    <FlowLine
      orientation="vertical"
      active={active}
      className={cn("h-8 w-px shrink-0", className)}
    />
  );
}
