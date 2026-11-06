import type { Metadata } from "next";
import { RegisterScreen } from "@/components/RegisterScreen";

export const metadata: Metadata = { title: "Create account · FormSender" };

export default function RegisterPage() {
  return <RegisterScreen />;
}
