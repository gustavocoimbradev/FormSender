import type { Metadata } from "next";
import { RequireAdmin } from "@/components/panel/RequireAdmin";
import { SmtpScreen } from "@/components/smtp/SmtpScreen";

export const metadata: Metadata = { title: "SMTP · FormSender" };

export default function SmtpPage() {
  return (
    <RequireAdmin>
      <SmtpScreen />
    </RequireAdmin>
  );
}
