import type { Metadata } from "next";
import { NewFormScreen } from "@/components/forms/NewFormScreen";

export const metadata: Metadata = { title: "New form · FormSender" };

export default function NewFormPage() {
  return <NewFormScreen />;
}
