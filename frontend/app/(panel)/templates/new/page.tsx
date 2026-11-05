import type { Metadata } from "next";
import { NewTemplateScreen } from "@/components/templates/TemplateScreens";

export const metadata: Metadata = { title: "Novo template · FormSender" };

export default function NewTemplatePage() {
  return <NewTemplateScreen />;
}
