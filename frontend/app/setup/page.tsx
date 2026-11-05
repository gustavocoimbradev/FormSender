import type { Metadata } from "next";
import { SetupScreen } from "@/components/SetupScreen";

export const metadata: Metadata = { title: "Initial setup · FormSender" };

export default function SetupPage() {
  return <SetupScreen />;
}
