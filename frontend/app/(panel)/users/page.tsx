import { redirect } from "next/navigation";

// The accounts now live in the Users tab of the settings.
export default function UsersPage() {
  redirect("/settings#users");
}
