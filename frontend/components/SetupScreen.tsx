"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { ApiError, createInitialAdmin, getSetupStatus } from "@/lib/api";
import { isValidEmail, isValidPassword, normalizeEmail } from "@/lib/validation";
import { AmbientBackground } from "./AmbientBackground";
import { Button } from "./Button";
import { Field } from "./Field";
import { Logo } from "./Logo";
import { PasswordField } from "./PasswordField";
import { SuccessCheck } from "./SuccessCheck";

type Phase = "checking" | "pending" | "completed" | "unreachable" | "created";

type Errors = { email?: string; password?: string; form?: string };

const Mail = () => (
  <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="5" width="18" height="14" rx="2.5" />
    <path d="m4 7 8 6 8-6" />
  </svg>
);

/** Friendly Portuguese messages for what the API can answer to the setup. */
function toErrors(error: unknown): { errors: Errors; completed: boolean } {
  if (!(error instanceof ApiError)) return { errors: { form: "Algo deu errado. Tente novamente." }, completed: false };

  if (error.status === 403) return { errors: {}, completed: true };
  if (error.status === 429) return { errors: { form: "Muitas tentativas. Aguarde um minuto e tente de novo." }, completed: false };
  if (error.status === 0) return { errors: { form: "Não consegui falar com o servidor. Verifique sua conexão." }, completed: false };

  if (error.status === 422) {
    const errors: Errors = {};
    if (error.fieldErrors.email) errors.email = "Informe um e-mail válido.";
    if (error.fieldErrors.password) errors.password = "A senha precisa ter pelo menos 8 caracteres.";
    return { errors, completed: false };
  }

  return { errors: { form: "Algo deu errado do nosso lado. Tente novamente em instantes." }, completed: false };
}

export function SetupScreen() {
  const [phase, setPhase] = useState<Phase>("checking");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [createdEmail, setCreatedEmail] = useState("");

  const checkStatus = useCallback(async () => {
    setPhase("checking");
    try {
      setPhase((await getSetupStatus()) ? "completed" : "pending");
    } catch {
      setPhase("unreachable");
    }
  }, []);

  useEffect(() => {
    void checkStatus();
  }, [checkStatus]);

  const canSubmit = isValidEmail(email) && isValidPassword(password) && !submitting;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setErrors({});

    try {
      const user = await createInitialAdmin({ email: normalizeEmail(email), password });
      setCreatedEmail(user.email);
      setPhase("created");
    } catch (error) {
      const result = toErrors(error);
      if (result.completed) setPhase("completed");
      else setErrors(result.errors);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="relative grid min-h-dvh place-items-center px-5 py-10 sm:px-10">
      <AmbientBackground />

      <section className="w-full max-w-[28rem]">
        <div className="mb-8 flex animate-fade-in justify-center">
          <Logo />
        </div>

        <div>
          <div className="animate-fade-up rounded-card border border-surface/10 bg-surface/[0.04] p-6 shadow-[0_30px_80px_-30px_rgb(0_0_0/0.8)] backdrop-blur-xl sm:p-8">
            {phase === "checking" && <Checking />}
            {phase === "unreachable" && <Unreachable onRetry={checkStatus} />}
            {phase === "completed" && <AlreadyDone />}
            {phase === "created" && <Created email={createdEmail} />}

            {phase === "pending" && (
              <form onSubmit={handleSubmit} noValidate>
                <p className="stagger animate-fade-up inline-flex items-center gap-2 rounded-full bg-accent/15 px-3 py-1 text-base font-medium text-accent" style={{ "--i": 0 } as React.CSSProperties}>
                  <span className="size-2 animate-pulse rounded-full bg-accent" />
                  Configuração inicial
                </p>

                <h1 className="stagger animate-fade-up mt-4 text-3xl font-semibold tracking-tight" style={{ "--i": 1 } as React.CSSProperties}>
                  Crie sua conta de administrador
                </h1>
                <p className="stagger animate-fade-up mb-7 mt-2 text-base leading-relaxed text-muted" style={{ "--i": 2 } as React.CSSProperties}>
                  É a conta principal do FormSender. Você só faz isso uma vez.
                </p>

                <div className="stagger animate-fade-up" style={{ "--i": 3 } as React.CSSProperties}>
                  <Field
                    id="email"
                    label="E-mail"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    error={errors.email}
                    disabled={submitting}
                    icon={<Mail />}
                    autoComplete="email"
                    inputMode="email"
                    autoCapitalize="none"
                    spellCheck={false}
                    autoFocus
                    placeholder="voce@empresa.com"
                  />
                </div>

                <div className="stagger animate-fade-up" style={{ "--i": 4 } as React.CSSProperties}>
                  <PasswordField id="password" label="Senha" value={password} onChange={setPassword} error={errors.password} disabled={submitting} />
                </div>

                <div aria-live="assertive" className="text-base">
                  {errors.form && <p className="mb-3 animate-fade-in rounded-control border border-danger/30 bg-danger/10 px-4 py-3 text-danger">{errors.form}</p>}
                </div>

                <div className="stagger animate-fade-up mt-1" style={{ "--i": 5 } as React.CSSProperties}>
                  <Button type="submit" disabled={!canSubmit} loading={submitting} loadingLabel="Criando conta…">
                    Criar conta e continuar
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

function Checking() {
  return (
    <div className="space-y-5" role="status" aria-label="Verificando">
      <div className="h-8 w-40 animate-shimmer rounded-full bg-[linear-gradient(90deg,rgb(var(--surface)/0.04),rgb(var(--surface)/0.12),rgb(var(--surface)/0.04))] [background-size:200%_100%]" />
      <div className="h-14 animate-shimmer rounded-control bg-[linear-gradient(90deg,rgb(var(--surface)/0.04),rgb(var(--surface)/0.12),rgb(var(--surface)/0.04))] [background-size:200%_100%]" />
      <div className="h-14 animate-shimmer rounded-control bg-[linear-gradient(90deg,rgb(var(--surface)/0.04),rgb(var(--surface)/0.12),rgb(var(--surface)/0.04))] [background-size:200%_100%]" />
      <div className="h-14 animate-shimmer rounded-control bg-[linear-gradient(90deg,rgb(var(--surface)/0.04),rgb(var(--surface)/0.12),rgb(var(--surface)/0.04))] [background-size:200%_100%]" />
    </div>
  );
}

function Unreachable({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="animate-fade-up text-center" role="alert">
      <h1 className="text-2xl font-semibold tracking-tight">Não foi possível conectar</h1>
      <p className="mb-7 mt-3 text-base leading-relaxed text-muted">
        Confira sua conexão e tente de novo em instantes.
      </p>
      <Button type="button" onClick={onRetry}>
        Tentar novamente
      </Button>
    </div>
  );
}

function AlreadyDone() {
  return (
    <div className="animate-fade-up text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Tudo pronto por aqui</h1>
      <p className="mt-3 text-base leading-relaxed text-muted">
        O FormSender já foi configurado. Entre com a conta de administrador.
      </p>
    </div>
  );
}

function Created({ email }: { email: string }) {
  return (
    <div className="flex flex-col items-center text-center">
      <SuccessCheck />
      <h1 className="stagger mt-6 animate-fade-up text-3xl font-semibold tracking-tight" style={{ "--i": 3 } as React.CSSProperties}>
        Conta criada!
      </h1>
      <p className="stagger mt-3 animate-fade-up text-base leading-relaxed text-muted" style={{ "--i": 4 } as React.CSSProperties}>
        Sua conta de administrador está pronta.
        <br />
        <span className="break-all text-text">{email}</span>
      </p>
    </div>
  );
}
