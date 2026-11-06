"use client";

import { CSSProperties, useEffect, useRef, useState } from "react";
import { ApiError, confirmEmail } from "@/lib/api";
import { AuthShell } from "./AuthShell";
import { LinkButton } from "./Button";
import { CardSkeleton, CardUnreachable } from "./CardStates";
import { SuccessCheck } from "./SuccessCheck";

type Phase = "working" | "unreachable" | "invalid" | { type: "account" | "destination"; email: string; form: string | null };

const step = (index: number): CSSProperties => ({ "--i": index }) as CSSProperties;

/** Where the link of a confirmation email lands: it uses the token right away and says what happened. */
export function ConfirmScreen() {
  const [phase, setPhase] = useState<Phase>("working");
  // The link can be used once: the effect must not run twice (React does that while developing).
  const started = useRef(false);

  async function confirm() {
    setPhase("working");
    const token = new URLSearchParams(window.location.search).get("token");

    if (!token) {
      setPhase("invalid");
      return;
    }

    try {
      setPhase(await confirmEmail(token));
    } catch (error) {
      setPhase(error instanceof ApiError && (error.status === 422 || error.status === 404) ? "invalid" : "unreachable");
    }
  }

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void confirm();
  }, []);

  return (
    <AuthShell>
      {phase === "working" && <CardSkeleton rows={2} />}
      {phase === "unreachable" && <CardUnreachable onRetry={() => void confirm()} />}

      {phase === "invalid" && (
        <div className="text-center">
          <h1 className="text-3xl font-semibold tracking-tight">This link does not work</h1>
          <p className="mb-7 mt-3 text-base leading-relaxed text-muted">It may have been used already, or it expired. Sign in to ask for a new one.</p>
          <LinkButton href="/login">Go to sign in</LinkButton>
        </div>
      )}

      {typeof phase === "object" && (
        <div className="flex flex-col items-center text-center">
          <SuccessCheck />
          <h1 className="stagger mt-6 animate-fade-up text-3xl font-semibold tracking-tight" style={step(3)}>
            {phase.type === "account" ? "Email confirmed!" : "All set!"}
          </h1>
          <p className="stagger mb-7 mt-3 animate-fade-up text-base leading-relaxed text-muted" style={step(4)}>
            {phase.type === "account" ? (
              "Your account is ready. Sign in to create your first form."
            ) : (
              <>
                <span className="break-all text-text">{phase.email}</span> will receive the messages of <span className="text-text">{phase.form}</span>.
              </>
            )}
          </p>
          {phase.type === "account" && (
            <div className="stagger w-full animate-fade-up" style={step(5)}>
              <LinkButton href="/login">Sign in</LinkButton>
            </div>
          )}
        </div>
      )}
    </AuthShell>
  );
}
