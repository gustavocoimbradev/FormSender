"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { getSetupStatus } from "@/lib/api";
import { getToken } from "@/lib/session";
import { AuthShell } from "./AuthShell";
import { CardUnreachable } from "./CardStates";
import { Splash } from "./Splash";

/**
 * Entry point. Decides where the person belongs: the panel (there is a session;
 * the panel itself confirms it), setup (fresh install) or login.
 */
export function HomeScreen() {
  const router = useRouter();
  const [unreachable, setUnreachable] = useState(false);

  const resolve = useCallback(async () => {
    setUnreachable(false);

    if (getToken()) {
      router.replace("/forms");
      return;
    }

    try {
      router.replace((await getSetupStatus()).completed ? "/login" : "/setup");
    } catch {
      setUnreachable(true);
    }
  }, [router]);

  useEffect(() => {
    void resolve();
  }, [resolve]);

  return unreachable ? (
    <AuthShell>
      <CardUnreachable onRetry={resolve} />
    </AuthShell>
  ) : (
    <Splash />
  );
}
