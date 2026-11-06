import type { Metadata } from "next";
import { ConfirmScreen } from "@/components/ConfirmScreen";

export const metadata: Metadata = { title: "Confirm email · FormSender", robots: { index: false } };

export default function ConfirmPage() {
  return <ConfirmScreen />;
}
