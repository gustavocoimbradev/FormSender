"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useState, type ReactNode } from "react";
import { ApiError, getCurrentUser, logout, type User } from "@/lib/api";
import { clearToken, getCachedUser, getToken, saveUser } from "@/lib/session";
import { AuthShell } from "../AuthShell";
import { CardUnreachable } from "../CardStates";
import { Splash } from "../Splash";
import { ToastProvider } from "../ui/Toast";
import { AppShell } from "./AppShell";

type Session = { user: User; signOut: () => Promise<void> };

const SessionContext = createContext<Session | null>(null);

export function useSession(): Session {
  const session = useContext(SessionContext);
  if (!session) throw new Error("useSession must be used inside the panel");
  return session;
}

const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * Everything behind the login. With a session the panel draws itself at once from
 * the user saved in this browser, and the API confirms it in the background.
 * Without one, only a neutral splash shows before going to the login.
 */
export function PanelFrame({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User>();
  const [unreachable, setUnreachable] = useState(false);
  const [attempt, setAttempt] = useState(0);

  // Before the first paint: use what this browser already knows about the person.
  useIsomorphicLayoutEffect(() => {
    const cached = getCachedUser();
    if (getToken() && cached) setUser(cached);
  }, []);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }

    setUnreachable(false);
    getCurrentUser(token).then(
      (fresh) => {
        saveUser(fresh);
        setUser(fresh);
      },
      (error: unknown) => {
        // Only a refused token ends the session. A slow or busy server must not log anyone out.
        if (error instanceof ApiError && error.status === 401) {
          clearToken();
          router.replace("/login");
          return;
        }
        setUnreachable(true);
      },
    );
  }, [router, attempt]);

  const signOut = useCallback(async () => {
    const token = getToken();
    clearToken();
    if (token) await logout(token).catch(() => undefined);
    router.replace("/login");
  }, [router]);

  const session = useMemo(() => (user ? { user, signOut } : null), [user, signOut]);

  if (!session) {
    return unreachable ? (
      <AuthShell>
        <CardUnreachable onRetry={() => setAttempt((current) => current + 1)} />
      </AuthShell>
    ) : (
      <Splash />
    );
  }

  return (
    <SessionContext.Provider value={session}>
      <ToastProvider>
        <AppShell>{children}</AppShell>
      </ToastProvider>
    </SessionContext.Provider>
  );
}
