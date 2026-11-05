import type { Metadata } from "next";
import { RequireAdmin } from "@/components/panel/RequireAdmin";
import { UsersScreen } from "@/components/users/UsersScreen";

export const metadata: Metadata = { title: "Users · FormSender" };

export default function UsersPage() {
  return (
    <RequireAdmin>
      <UsersScreen />
    </RequireAdmin>
  );
}
