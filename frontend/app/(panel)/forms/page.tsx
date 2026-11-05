import type { Metadata } from "next";
import { FormsScreen } from "@/components/forms/FormsScreen";

export const metadata: Metadata = { title: "Forms · FormSender" };

export default function FormsPage() {
  return <FormsScreen />;
}
