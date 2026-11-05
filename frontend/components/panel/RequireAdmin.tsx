"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { isAdmin } from "@/lib/permissions";
import { useSession } from "./PanelFrame";

/** Pages only administrators can use: anyone else goes back to the forms. */
export function RequireAdmin({ children }: { children: ReactNode }) {
  const { user } = useSession();
  const router = useRouter();
  const allowed = isAdmin(user);

  useEffect(() => {
    if (!allowed) router.replace("/forms");
  }, [allowed, router]);

  return allowed ? <>{children}</> : null;
}
