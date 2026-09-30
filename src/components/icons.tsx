import {
  Banknote,
  Building,
  Calculator,
  ChartLine,
  ClipboardList,
  FileSpreadsheet,
  Handshake,
  Landmark,
  Receipt,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { IconKey } from "../data/organization.ts";

export const iconMap: Record<IconKey, LucideIcon> = {
  landmark: Landmark,
  wallet: Wallet,
  handshake: Handshake,
  building: Building,
  calculator: Calculator,
  receipt: Receipt,
  sheet: FileSpreadsheet,
  clipboard: ClipboardList,
  chart: ChartLine,
  banknote: Banknote,
};
