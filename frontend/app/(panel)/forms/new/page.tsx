import type { Metadata } from "next";
import { NewFormScreen } from "@/components/forms/NewFormScreen";

export const metadata: Metadata = { title: "Novo formulário · FormSender" };

export default function NewFormPage() {
  return <NewFormScreen />;
}
