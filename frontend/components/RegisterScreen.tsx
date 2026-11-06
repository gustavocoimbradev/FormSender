"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { CSSProperties, FormEvent, useCallback, useEffect, useState } from "react";
import { ApiError, getSetupStatus, register, resendConfirmation } from "@/lib/api";
import { isValidEmail, isValidPassword, normalizeEmail } from "@/lib/validation";
import { AuthShell } from "./AuthShell";
import { Button, GhostButton } from "./Button";
import { CardSkeleton, CardUnreachable } from "./CardStates";
import { Field } from "./Field";
import { MailIcon } from "./icons";
import { PasswordField } from "./PasswordField";
import { SuccessCheck } from "./SuccessCheck";

type Phase = "checking" | "ready" | "unreachable" | "sent";

type Errors = { name?: string; email?: string; password?: string; form?: string };

const step = (index: number): CSSProperties => ({ "--i": index }) as CSSProperties;

function toErrors(error: unknown): Errors {
  if (!(error instanceof ApiError)) return { form: "Something went wrong. Please try again." };
  if (error.status === 403) return { form: "New accounts are not allowed here." };
  if (error.status === 429) return { form: "Too many attempts. Wait a minute and try again." };
  if (error.status === 0) return { form: "Could not reach the server. Check your connection." };

  if (error.status === 422) {
    return {
      name: error.fieldErrors.name ? "Enter your name." : undefined,
      email: error.fieldErrors.email ? "Enter a valid email that does not have an account yet." : undefined,
      password: error.fieldErrors.password ? "The password must be at least 8 characters." : undefined,
    };
  }

  return { form: "Something went wrong on our side. Please try again shortly." };
}

export function RegisterScreen() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("checking");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [resending, setResending] = useState(false);
  const [notice, setNotice] = useState<string>();

  const prepare = useCallback(async () => {
    setPhase("checking");

    try {
      const status = await getSetupStatus();

      // Nothing to create an account on yet, or the administrator keeps new accounts closed.
      if (!status.completed) router.replace("/setup");
      else if (!status.registrationOpen) router.replace("/login");
      else setPhase("ready");
    } catch {
      setPhase("unreachable");
    }
  }, [router]);

  useEffect(() => {
    void prepare();
  }, [prepare]);

  const canSubmit = name.trim().length > 0 && isValidEmail(email) && isValidPassword(password) && !submitting;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setErrors({});

    try {
      await register({ name: name.trim(), email: normalizeEmail(email), password });
      setPhase("sent");
    } catch (failure) {
      setErrors(toErrors(failure));
    } finally {
      setSubmitting(false);
    }
  }

  async function sendLinkAgain() {
    setResending(true);
    setNotice(undefined);

    try {
      await resendConfirmation(normalizeEmail(email));
      setNotice("A new link is on its way. It can take a minute to arrive.");
    } catch {
      setNotice("Could not send it now. Please try again shortly.");
    } finally {
      setResending(false);
    }
  }

  return (
    <AuthShell>
      {phase === "checking" && <CardSkeleton rows={3} />}
      {phase === "unreachable" && <CardUnreachable onRetry={prepare} />}

      {phase === "sent" && (
        <div className="flex flex-col items-center text-center">
          <SuccessCheck />
          <h1 className="stagger mt-6 animate-fade-up text-3xl font-semibold tracking-tight" style={step(3)}>
            Check your email
          </h1>
          <p className="stagger mb-7 mt-3 animate-fade-up text-base leading-relaxed text-muted" style={step(4)}>
            We sent a link to
            <br />
            <span className="break-all text-text">{normalizeEmail(email)}</span>
            <br />
            Open it to start using your account.
          </p>
          <div className="stagger w-full animate-fade-up" style={step(5)}>
            <GhostButton type="button" onClick={() => void sendLinkAgain()} disabled={resending}>
              {resending ? "Sending…" : "Send the link again"}
            </GhostButton>
          </div>
          <p role="status" className="mt-3 text-base text-muted">
            {notice}
          </p>
        </div>
      )}

      {phase === "ready" && (
        <form onSubmit={handleSubmit} noValidate aria-label="Create an account">
          <div className="stagger animate-fade-up" style={step(0)}>
            <Field id="name" label="Name" value={name} onChange={(event) => setName(event.target.value)} error={errors.name} disabled={submitting} autoComplete="name" autoFocus placeholder="Maria Souza" />
            <Field
              id="email"
              label="Email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              error={errors.email}
              disabled={submitting}
              icon={<MailIcon />}
              autoComplete="email"
              inputMode="email"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="you@company.com"
            />
          </div>

          <div className="stagger animate-fade-up" style={step(1)}>
            <PasswordField id="password" label="Password" value={password} onChange={setPassword} error={errors.password} disabled={submitting} />
          </div>

          <div aria-live="assertive" className="text-base">
            {errors.form && <p className="mb-3 animate-shake rounded-control border border-danger/30 bg-danger/10 px-4 py-3 text-danger">{errors.form}</p>}
          </div>

          <div className="stagger mt-1 animate-fade-up" style={step(2)}>
            <Button type="submit" disabled={!canSubmit} loading={submitting} loadingLabel="Creating account…">
              Create account
            </Button>
          </div>
        </form>
      )}

      {(phase === "ready" || phase === "sent") && (
        <p className="mt-5 text-center text-base text-muted">
          Already have an account?{" "}
          <Link href="/login" className="inline-flex min-h-11 items-center font-medium text-accent hover:underline">
            Sign in
          </Link>
        </p>
      )}
    </AuthShell>
  );
}
