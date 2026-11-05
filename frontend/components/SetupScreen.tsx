"use client";

import { useRouter } from "next/navigation";
import { CSSProperties, FormEvent, useCallback, useEffect, useState } from "react";
import { ApiError, createInitialAdmin, getSetupStatus } from "@/lib/api";
import { DEFAULT_SMTP } from "@/lib/defaults";
import { isValidEmail, isValidHost, isValidPassword, isValidPort, normalizeEmail, securityForPort, type Security } from "@/lib/validation";
import { AuthShell } from "./AuthShell";
import { Button, LinkButton } from "./Button";
import { CardSkeleton, CardUnreachable } from "./CardStates";
import { Field } from "./Field";
import { PasswordField } from "./PasswordField";
import { Segmented } from "./Segmented";
import { SetupSteps } from "./SetupSteps";
import { SuccessCheck } from "./SuccessCheck";
import { MailIcon } from "./icons";

type Phase = "checking" | "pending" | "unreachable" | "created";

type Errors = {
  email?: string;
  password?: string;
  host?: string;
  port?: string;
  fromAddress?: string;
  form?: string;
};

const SECURITY_OPTIONS: { value: Security; label: string }[] = [
  { value: "none", label: "Nenhuma" },
  { value: "ssl", label: "SSL" },
  { value: "tls", label: "TLS" },
];

const step = (index: number): CSSProperties => ({ "--i": index }) as CSSProperties;

/** Friendly Portuguese messages for what the API can answer to the setup. */
function toErrors(error: unknown): { errors: Errors; alreadyDone: boolean } {
  if (!(error instanceof ApiError)) return { errors: { form: "Algo deu errado. Tente novamente." }, alreadyDone: false };

  if (error.status === 403) return { errors: {}, alreadyDone: true };
  if (error.status === 429) return { errors: { form: "Muitas tentativas. Aguarde um minuto e tente de novo." }, alreadyDone: false };
  if (error.status === 0) return { errors: { form: "Não consegui falar com o servidor. Verifique sua conexão." }, alreadyDone: false };

  if (error.status === 422) {
    const errors: Errors = {};
    if (error.fieldErrors.email) errors.email = "Informe um e-mail válido.";
    if (error.fieldErrors.password) errors.password = "A senha precisa ter pelo menos 8 caracteres.";
    if (error.fieldErrors["smtp.host"]) errors.host = "Informe o endereço do servidor.";
    if (error.fieldErrors["smtp.port"]) errors.port = "Informe uma porta entre 1 e 65535.";
    if (error.fieldErrors["smtp.from_address"]) errors.fromAddress = "Informe um e-mail de remetente válido.";
    if (error.fieldErrors["smtp.encryption"]) errors.form = "Escolha uma opção de segurança válida.";
    return { errors, alreadyDone: false };
  }

  return { errors: { form: "Algo deu errado do nosso lado. Tente novamente em instantes." }, alreadyDone: false };
}

export function SetupScreen() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("checking");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [confirmationChecked, setConfirmationChecked] = useState(false);
  const [stage, setStage] = useState<1 | 2>(1);
  const [host, setHost] = useState(DEFAULT_SMTP.host);
  const [port, setPort] = useState(DEFAULT_SMTP.port);
  const [security, setSecurity] = useState<Security>(DEFAULT_SMTP.security);
  const [securityChosen, setSecurityChosen] = useState(false);
  const [smtpUser, setSmtpUser] = useState(DEFAULT_SMTP.username);
  const [smtpPassword, setSmtpPassword] = useState(DEFAULT_SMTP.password);
  const [fromAddress, setFromAddress] = useState(DEFAULT_SMTP.fromAddress);
  const [fromTouched, setFromTouched] = useState(true);
  const [fromName, setFromName] = useState(DEFAULT_SMTP.fromName);
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
  const serverReady = isValidHost(host) && isValidPort(port) && isValidEmail(fromAddress);
  const canSubmit = adminReady && serverReady && !submitting;

  // Smart defaults: the usual security for the port, and the login as the sender, until the person chooses.
  function changePort(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 5);
    setPort(digits);
    const usual = securityForPort(digits);
    if (usual && !securityChosen) setSecurity(usual);
  }

  function changeSmtpUser(value: string) {
    setSmtpUser(value);
    if (!fromTouched && isValidEmail(value)) setFromAddress(value.trim());
  }

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
      const user = await createInitialAdmin({
        email: normalizeEmail(email),
        password,
        smtp: {
          host: host.trim(),
          port: Number(port),
          username: smtpUser.trim() || null,
          password: smtpPassword || null,
          encryption: security === "none" ? null : security,
          from_address: normalizeEmail(fromAddress),
          from_name: fromName.trim() || null,
        },
      });
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
            Conta criada!
          </h1>
          <p className="stagger mb-7 mt-3 animate-fade-up text-base leading-relaxed text-muted" style={step(4)}>
            Sua conta de administrador está pronta.
            <br />
            <span className="break-all text-text">{createdEmail}</span>
          </p>
          <div className="stagger w-full animate-fade-up" style={step(5)}>
            <LinkButton href="/login">Ir para o login</LinkButton>
          </div>
        </div>
      )}

      {phase === "pending" && (
        <form onSubmit={handleSubmit} noValidate aria-label="Criar conta">
          <SetupSteps step={stage} onBack={submitting ? undefined : () => setStage(1)} />

          {stage === 1 && (
            <div key="admin" className="animate-fade-up">
              <Field
                id="email"
                label="E-mail"
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
                placeholder="voce@empresa.com"
              />
              <PasswordField
                id="password"
                label="Senha"
                value={password}
                onChange={(value) => {
                  setPassword(value);
                  setConfirmationChecked(false);
                }}
                error={errors.password}
              />
              <PasswordField
                id="confirmation"
                label="Confirmar senha"
                value={confirmation}
                onChange={(value) => {
                  setConfirmation(value);
                  setConfirmationChecked(false);
                }}
                onBlur={() => setConfirmationChecked(true)}
                error={mismatch ? "As senhas não coincidem." : undefined}
                showStrength={false}
                placeholder="Repita a senha"
              />

              <div className="mt-1">
                <Button type="submit" disabled={!adminReady}>
                  Continuar
                </Button>
              </div>
            </div>
          )}

          {stage === 2 && (
            <div key="server" className="animate-fade-up">
              <div className="grid gap-x-4 sm:grid-cols-[1fr_9rem]">
                <Field
                  id="smtp-host"
                  label="Servidor"
                  value={host}
                  onChange={(event) => setHost(event.target.value)}
                  error={errors.host}
                  disabled={submitting}
                  autoComplete="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  autoFocus
                  placeholder="smtp.empresa.com"
                />
                <Field
                  id="smtp-port"
                  label="Porta"
                  value={port}
                  onChange={(event) => changePort(event.target.value)}
                  error={errors.port}
                  disabled={submitting}
                  autoComplete="off"
                  inputMode="numeric"
                  placeholder="587"
                />
              </div>

              <Segmented
                label="Segurança"
                value={security}
                options={SECURITY_OPTIONS}
                onChange={(value) => {
                  setSecurity(value);
                  setSecurityChosen(true);
                }}
                disabled={submitting}
              />

              <div className="grid gap-x-4 sm:grid-cols-2">
                <Field
                  id="smtp-user"
                  label="Usuário"
                  value={smtpUser}
                  onChange={(event) => changeSmtpUser(event.target.value)}
                  disabled={submitting}
                  autoComplete="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  placeholder="Opcional"
                />
                <PasswordField
                  id="smtp-password"
                  label="Senha do servidor"
                  value={smtpPassword}
                  onChange={setSmtpPassword}
                  disabled={submitting}
                  showStrength={false}
                  placeholder="Opcional"
                />
              </div>

              <div className="grid gap-x-4 sm:grid-cols-2">
                <Field
                  id="smtp-from"
                  label="Enviar como"
                  type="email"
                  value={fromAddress}
                  onChange={(event) => {
                    setFromAddress(event.target.value);
                    setFromTouched(true);
                  }}
                  error={errors.fromAddress}
                  disabled={submitting}
                  autoComplete="off"
                  inputMode="email"
                  autoCapitalize="none"
                  spellCheck={false}
                  placeholder="nao-responda@empresa.com"
                />
                <Field
                  id="smtp-from-name"
                  label="Nome do remetente"
                  value={fromName}
                  onChange={(event) => setFromName(event.target.value)}
                  disabled={submitting}
                  autoComplete="off"
                  placeholder="Minha Empresa"
                />
              </div>

              <div aria-live="assertive" className="text-base">
                {errors.form && <p className="mb-3 animate-fade-in rounded-control border border-danger/30 bg-danger/10 px-4 py-3 text-danger">{errors.form}</p>}
              </div>

              <div className="mt-1">
                <Button type="submit" disabled={!canSubmit} loading={submitting} loadingLabel="Criando conta…">
                  Criar conta
                </Button>
              </div>
            </div>
          )}
        </form>
      )}
    </AuthShell>
  );
}
