"use client";

import { useRouter } from "next/navigation";
import { CSSProperties, FormEvent, useCallback, useEffect, useState } from "react";
import { ApiError, createInitialAdmin, getSetupStatus } from "@/lib/api";
import { defaultSmtpDraft, isSmtpReady, settingsFromDraft, smtpErrorsFromApi, type SmtpDraft, type SmtpErrors } from "@/lib/smtp";
import { isValidEmail, isValidPassword, normalizeEmail } from "@/lib/validation";
import { AuthShell } from "./AuthShell";
import { Button, LinkButton } from "./Button";
import { CardSkeleton, CardUnreachable } from "./CardStates";
import { Field } from "./Field";
import { MailIcon } from "./icons";
import { PasswordField } from "./PasswordField";
import { SetupSteps } from "./SetupSteps";
import { SmtpFields } from "./SmtpFields";
import { SuccessCheck } from "./SuccessCheck";

type Phase = "checking" | "pending" | "unreachable" | "created";

type Errors = SmtpErrors & { email?: string; password?: string; form?: string };

const step = (index: number): CSSProperties => ({ "--i": index }) as CSSProperties;

/** Friendly Portuguese messages for what the API can answer to the setup. */
function toErrors(error: unknown): { errors: Errors; alreadyDone: boolean } {
  if (!(error instanceof ApiError)) return { errors: { form: "Something went wrong. Please try again." }, alreadyDone: false };

  if (error.status === 403) return { errors: {}, alreadyDone: true };
  if (error.status === 429) return { errors: { form: "Too many attempts. Wait a minute and try again." }, alreadyDone: false };
  if (error.status === 0) return { errors: { form: "Could not reach the server. Check your connection." }, alreadyDone: false };

  if (error.status === 422) {
    const errors: Errors = { ...smtpErrorsFromApi(error.fieldErrors) };
    if (error.fieldErrors.email) errors.email = "Enter a valid email.";
    if (error.fieldErrors.password) errors.password = "The password must be at least 8 characters.";
    if (error.fieldErrors["smtp.encryption"]) errors.form = "Choose a valid security option.";
    return { errors, alreadyDone: false };
  }

  return { errors: { form: "Something went wrong on our side. Please try again shortly." }, alreadyDone: false };
}

export function SetupScreen() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("checking");
  const [stage, setStage] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [confirmationChecked, setConfirmationChecked] = useState(false);
  const [smtp, setSmtp] = useState<SmtpDraft>(defaultSmtpDraft);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [createdEmail, setCreatedEmail] = useState("");

  const checkStatus = useCallback(async () => {
    setPhase("checking");
    try {
      // Someone who already did the setup never sees this screen again.
      if (await getSetupStatus()) router.replace("/login");
      else setPhase("pending");
    } catch {
      setPhase("unreachable");
    }
  }, [router]);

  useEffect(() => {
    void checkStatus();
  }, [checkStatus]);

  // Only told once the person leaves the field (or tries to continue), never while typing.
  const mismatch = confirmationChecked && confirmation.length > 0 && confirmation !== password;
  const adminReady = isValidEmail(email) && isValidPassword(password) && confirmation === password;
  const canSubmit = adminReady && isSmtpReady(smtp) && !submitting;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    // Enter on the first step just moves on to the second.
    if (stage === 1) {
      if (adminReady) setStage(2);
      else setConfirmationChecked(true);
      return;
    }

    if (!canSubmit) return;

    setSubmitting(true);
    setErrors({});

    try {
      const user = await createInitialAdmin({ email: normalizeEmail(email), password, smtp: settingsFromDraft(smtp) });
      setCreatedEmail(user.email);
      setPhase("created");
    } catch (error) {
      const result = toErrors(error);

      if (result.alreadyDone) router.replace("/login");
      else {
        setErrors(result.errors);
        // Problems with the account live on the first step.
        if (result.errors.email || result.errors.password) setStage(1);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell wide={phase === "pending"}>
      {phase === "checking" && <CardSkeleton rows={3} />}
      {phase === "unreachable" && <CardUnreachable onRetry={checkStatus} />}

      {phase === "created" && (
        <div className="flex flex-col items-center text-center">
          <SuccessCheck />
          <h1 className="stagger mt-6 animate-fade-up text-3xl font-semibold tracking-tight" style={step(3)}>
            Account created!
          </h1>
          <p className="stagger mb-7 mt-3 animate-fade-up text-base leading-relaxed text-muted" style={step(4)}>
            Your administrator account is ready.
            <br />
            <span className="break-all text-text">{createdEmail}</span>
          </p>
          <div className="stagger w-full animate-fade-up" style={step(5)}>
            <LinkButton href="/login">Go to sign in</LinkButton>
          </div>
        </div>
      )}

      {phase === "pending" && (
        <form onSubmit={handleSubmit} noValidate aria-label="Create account">
          <SetupSteps step={stage} onBack={submitting ? undefined : () => setStage(1)} />

          {stage === 1 && (
            <div key="admin" className="animate-fade-up">
              <Field
                id="email"
                label="Email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                error={errors.email}
                icon={<MailIcon />}
                autoComplete="email"
                inputMode="email"
                autoCapitalize="none"
                spellCheck={false}
                autoFocus
                placeholder="you@company.com"
              />
              <PasswordField
                id="password"
                label="Password"
                value={password}
                onChange={(value) => {
                  setPassword(value);
                  setConfirmationChecked(false);
                }}
                error={errors.password}
              />
              <PasswordField
                id="confirmation"
                label="Confirm password"
                value={confirmation}
                onChange={(value) => {
                  setConfirmation(value);
                  setConfirmationChecked(false);
                }}
                onBlur={() => setConfirmationChecked(true)}
                error={mismatch ? "The passwords do not match." : undefined}
                showStrength={false}
                placeholder="Repeat the password"
              />

              <div className="mt-1">
                <Button type="submit" disabled={!adminReady}>
                  Continue
                </Button>
              </div>
            </div>
          )}

          {stage === 2 && (
            <div key="server" className="animate-fade-up">
              <SmtpFields draft={smtp} onChange={setSmtp} errors={errors} disabled={submitting} autoFocus />

              <div aria-live="assertive" className="text-base">
                {errors.form && <p className="mb-3 animate-fade-in rounded-control border border-danger/30 bg-danger/10 px-4 py-3 text-danger">{errors.form}</p>}
              </div>

              <div className="mt-1">
                <Button type="submit" disabled={!canSubmit} loading={submitting} loadingLabel="Creating account…">
                  Create account
                </Button>
              </div>
            </div>
          )}
        </form>
      )}
    </AuthShell>
  );
}
