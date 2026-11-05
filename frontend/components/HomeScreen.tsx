"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ApiError, getCurrentUser, getSetupStatus, logout, type User } from "@/lib/api";
import { clearToken, getToken } from "@/lib/session";
import { AuthShell } from "./AuthShell";
import { GhostButton } from "./Button";
import { CardSkeleton, CardUnreachable } from "./CardStates";

type Phase = "checking" | "ready" | "unreachable";

/**
 * Entry point. Decides where the person belongs: setup (fresh install), login
 * (no valid session) or the app. The panel itself replaces the box below.
 */
export function HomeScreen() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("checking");
  const [user, setUser] = useState<User>();

  const resolve = useCallback(async () => {
    setPhase("checking");

    try {
      const token = getToken();

      if (token) {
        try {
          setUser(await getCurrentUser(token));
          setPhase("ready");
          return;
        } catch (failure) {
          if (failure instanceof ApiError && failure.status === 0) throw failure;
          clearToken();
        }
      }

      router.replace((await getSetupStatus()) ? "/login" : "/setup");
    } catch {
      setPhase("unreachable");
    }
  }, [router]);

  useEffect(() => {
    void resolve();
  }, [resolve]);

  async function handleLogout() {
    const token = getToken();
    clearToken();
    if (token) await logout(token).catch(() => undefined);
    router.replace("/login");
  }

  return (
    <AuthShell>
      {phase === "checking" && <CardSkeleton rows={1} />}
      {phase === "unreachable" && <CardUnreachable onRetry={resolve} />}

      {phase === "ready" && user && (
        <div className="animate-fade-up text-center">
          <h1 className="text-3xl font-semibold tracking-tight">Você entrou</h1>
          <p className="mb-7 mt-3 text-base leading-relaxed text-muted">
            Conectado como <span className="break-all text-text">{user.email}</span>.
          </p>
          <GhostButton type="button" onClick={handleLogout}>
            Sair
          </GhostButton>
        </div>
      )}
    </AuthShell>
  );
}
