"use client";

import { useRouter } from "next/navigation";
import { CSSProperties, FormEvent, useCallback, useEffect, useState } from "react";
import { ApiError, getCurrentUser, getSetupStatus, login } from "@/lib/api";
import { clearToken, getToken, saveToken, saveUser } from "@/lib/session";
import { isValidEmail, normalizeEmail } from "@/lib/validation";
import { AuthShell } from "./AuthShell";
import { Button } from "./Button";
import { CardSkeleton, CardUnreachable } from "./CardStates";
import { Field } from "./Field";
import { PasswordField } from "./PasswordField";
import { MailIcon } from "./icons";

type Phase = "checking" | "ready" | "unreachable";

const step = (index: number): CSSProperties => ({ "--i": index }) as CSSProperties;

function toMessage(error: unknown): string {
  if (!(error instanceof ApiError)) return "Something went wrong. Please try again.";
  if (error.status === 422) return "Incorrect email or password.";
  if (error.status === 429) return "Too many attempts. Wait a minute and try again.";
  if (error.status === 0) return "Could not reach the server. Check your connection.";
  return "Something went wrong on our side. Please try again shortly.";
}

export function LoginScreen() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("checking");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>();

  const prepare = useCallback(async () => {
    setPhase("checking");

    try {
      // A fresh install has no account to log into yet.
      if (!(await getSetupStatus())) {
        router.replace("/setup");
        return;
      }

      // Already signed in on this browser: straight to the app.
      const token = getToken();
      if (token) {
        try {
          await getCurrentUser(token);
          router.replace("/");
          return;
        } catch (failure) {
          // Only a refused token is thrown away; any other problem is a connection problem.
          if (!(failure instanceof ApiError && failure.status === 401)) throw failure;
          clearToken();
        }
      }

      setPhase("ready");
    } catch {
      setPhase("unreachable");
    }
  }, [router]);

  useEffect(() => {
    void prepare();
  }, [prepare]);

  const canSubmit = isValidEmail(email) && password.length > 0 && !submitting;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setError(undefined);

    try {
      const session = await login({ email: normalizeEmail(email), password });
      saveToken(session.token);
      saveUser(session.user);
      router.replace("/");
    } catch (failure) {
      setError(toMessage(failure));
      setSubmitting(false);
    }
  }

  return (
    <AuthShell>
      {phase === "checking" && <CardSkeleton rows={2} />}
      {phase === "unreachable" && <CardUnreachable onRetry={prepare} />}

      {phase === "ready" && (
        <form onSubmit={handleSubmit} noValidate aria-label="Sign in">
          <div className="stagger animate-fade-up" style={step(0)}>
            <Field
              id="email"
              label="Email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={submitting}
              icon={<MailIcon />}
              autoComplete="email"
              inputMode="email"
              autoCapitalize="none"
              spellCheck={false}
              autoFocus
              placeholder="you@company.com"
            />
          </div>

          <div className="stagger animate-fade-up" style={step(1)}>
            <PasswordField
              id="password"
              label="Password"
              value={password}
              onChange={setPassword}
              disabled={submitting}
              showStrength={false}
              placeholder="Your password"
            />
          </div>

          {/* Remounted on every new message so the shake plays again. */}
          <div aria-live="assertive" className="text-base">
            {error && (
              <p key={error + String(submitting)} className="mb-3 animate-shake rounded-control border border-danger/30 bg-danger/10 px-4 py-3 text-danger">
                {error}
              </p>
            )}
          </div>

          <div className="stagger mt-1 animate-fade-up" style={step(2)}>
            <Button type="submit" disabled={!canSubmit} loading={submitting} loadingLabel="Signing in…">
              Sign in
            </Button>
          </div>
        </form>
      )}
    </AuthShell>
  );
}
