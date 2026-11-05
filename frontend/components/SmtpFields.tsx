"use client";

import { withPort, withUsername, type SmtpDraft, type SmtpErrors } from "@/lib/smtp";
import type { Security } from "@/lib/validation";
import { Field } from "./Field";
import { PasswordField } from "./PasswordField";
import { Segmented } from "./Segmented";

const SECURITY_OPTIONS: { value: Security; label: string }[] = [
  { value: "none", label: "Nenhuma" },
  { value: "ssl", label: "SSL" },
  { value: "tls", label: "TLS" },
];

type SmtpFieldsProps = {
  draft: SmtpDraft;
  onChange: (draft: SmtpDraft) => void;
  errors?: SmtpErrors;
  disabled?: boolean;
  autoFocus?: boolean;
};

/** The fields of the email server (SMTP), shared by the setup and the settings screen. */
export function SmtpFields({ draft, onChange, errors = {}, disabled, autoFocus }: SmtpFieldsProps) {
  const patch = (changes: Partial<SmtpDraft>) => onChange({ ...draft, ...changes });

  return (
    <>
      <div className="grid gap-x-4 sm:grid-cols-[1fr_9rem]">
        <Field
          id="smtp-host"
          label="Servidor"
          value={draft.host}
          onChange={(event) => patch({ host: event.target.value })}
          error={errors.host}
          disabled={disabled}
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          autoFocus={autoFocus}
          placeholder="smtp.empresa.com"
        />
        <Field
          id="smtp-port"
          label="Porta"
          value={draft.port}
          onChange={(event) => onChange(withPort(draft, event.target.value))}
          error={errors.port}
          disabled={disabled}
          autoComplete="off"
          inputMode="numeric"
          placeholder="587"
        />
      </div>

      <Segmented label="Segurança" value={draft.security} options={SECURITY_OPTIONS} onChange={(security) => patch({ security, securityChosen: true })} disabled={disabled} />

      <div className="grid gap-x-4 sm:grid-cols-2">
        <Field
          id="smtp-user"
          label="Usuário"
          value={draft.username}
          onChange={(event) => onChange(withUsername(draft, event.target.value))}
          disabled={disabled}
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="Opcional"
        />
        <PasswordField
          id="smtp-password"
          label="Senha do servidor"
          value={draft.password}
          onChange={(password) => patch({ password })}
          disabled={disabled}
          showStrength={false}
          placeholder="Opcional"
        />
      </div>

      <div className="grid gap-x-4 sm:grid-cols-2">
        <Field
          id="smtp-from"
          label="Enviar como"
          type="email"
          value={draft.fromAddress}
          onChange={(event) => patch({ fromAddress: event.target.value, fromTouched: true })}
          error={errors.fromAddress}
          disabled={disabled}
          autoComplete="off"
          inputMode="email"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="nao-responda@empresa.com"
        />
        <Field
          id="smtp-from-name"
          label="Nome do remetente"
          value={draft.fromName}
          onChange={(event) => patch({ fromName: event.target.value })}
          disabled={disabled}
          autoComplete="off"
          placeholder="Minha Empresa"
        />
      </div>
    </>
  );
}
