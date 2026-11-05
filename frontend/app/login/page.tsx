import type { Metadata } from "next";
import { LoginScreen } from "@/components/LoginScreen";

export const metadata: Metadata = { title: "Entrar · FormSender" };

export default function LoginPage() {
  return <LoginScreen />;
}
