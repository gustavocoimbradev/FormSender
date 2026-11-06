import type { Metadata } from "next";
import { RequireAdmin } from "@/components/panel/RequireAdmin";
import { SettingsScreen } from "@/components/settings/SettingsScreen";

export const metadata: Metadata = { title: "Settings · FormSender" };

export default function SettingsPage() {
  return (
    <RequireAdmin>
      <SettingsScreen />
    </RequireAdmin>
  );
}
