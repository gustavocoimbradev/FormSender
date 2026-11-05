import { PanelFrame } from "@/components/panel/PanelFrame";

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return <PanelFrame>{children}</PanelFrame>;
}
