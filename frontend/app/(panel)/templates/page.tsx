import type { Metadata } from "next";
import { TemplatesScreen } from "@/components/templates/TemplatesScreen";

export const metadata: Metadata = { title: "Templates · FormSender" };

export default function TemplatesPage() {
  return <TemplatesScreen />;
}
