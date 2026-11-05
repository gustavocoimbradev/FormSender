import type { Metadata } from "next";
import { SetupScreen } from "@/components/SetupScreen";

export const metadata: Metadata = { title: "Configuração inicial · FormSender" };

export default function SetupPage() {
  return <SetupScreen />;
}
