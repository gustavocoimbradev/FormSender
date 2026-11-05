import type { SmtpSettings } from "./api";
import { DEFAULT_SMTP } from "./defaults";
import { isValidEmail, isValidHost, isValidPort, normalizeEmail, securityForPort, type Security } from "./validation";

/** What the SMTP form edits, as typed (strings), plus what the smart defaults need to remember. */
export type SmtpDraft = {
  host: string;
  port: string;
  security: Security;
  /** Once chosen by hand, the port no longer picks the security. */
  securityChosen: boolean;
  username: string;
  password: string;
  fromAddress: string;
  /** Once typed by hand, the login no longer fills the sender. */
  fromTouched: boolean;
  fromName: string;
};

export type SmtpErrors = { host?: string; port?: string; fromAddress?: string };

export const defaultSmtpDraft = (): SmtpDraft => ({
  host: DEFAULT_SMTP.host,
  port: DEFAULT_SMTP.port,
  security: DEFAULT_SMTP.security,
  securityChosen: false,
  username: DEFAULT_SMTP.username,
  password: DEFAULT_SMTP.password,
  fromAddress: DEFAULT_SMTP.fromAddress,
  fromTouched: true,
  fromName: DEFAULT_SMTP.fromName,
});

export function draftFromSettings(settings: SmtpSettings): SmtpDraft {
  return {
    host: settings.host,
    port: String(settings.port),
    security: settings.encryption ?? "none",
    securityChosen: false,
    username: settings.username ?? "",
    password: settings.password ?? "",
    fromAddress: settings.from_address,
    fromTouched: true,
    fromName: settings.from_name ?? "",
  };
}

export function settingsFromDraft(draft: SmtpDraft): SmtpSettings {
  return {
    host: draft.host.trim(),
    port: Number(draft.port),
    username: draft.username.trim() || null,
    password: draft.password || null,
    encryption: draft.security === "none" ? null : draft.security,
    from_address: normalizeEmail(draft.fromAddress),
    from_name: draft.fromName.trim() || null,
  };
}

export const isSmtpReady = (draft: SmtpDraft) => isValidHost(draft.host) && isValidPort(draft.port) && isValidEmail(draft.fromAddress);

/** Typing the port picks the usual security for it, unless it was chosen by hand. */
export function withPort(draft: SmtpDraft, value: string): SmtpDraft {
  const port = value.replace(/\D/g, "").slice(0, 5);
  const usual = securityForPort(port);
  return { ...draft, port, security: usual && !draft.securityChosen ? usual : draft.security };
}

/** Typing the login fills the sender with it, unless the sender was typed by hand. */
export function withUsername(draft: SmtpDraft, username: string): SmtpDraft {
  return { ...draft, username, fromAddress: !draft.fromTouched && isValidEmail(username) ? username.trim() : draft.fromAddress };
}

/** Maps the API's field errors (`smtp.host`...) to friendly messages. */
export function smtpErrorsFromApi(fieldErrors: Record<string, string[]>): SmtpErrors {
  const errors: SmtpErrors = {};
  if (fieldErrors["smtp.host"]) errors.host = "Informe o endereço do servidor.";
  if (fieldErrors["smtp.port"]) errors.port = "Informe uma porta entre 1 e 65535.";
  if (fieldErrors["smtp.from_address"]) errors.fromAddress = "Informe um e-mail de remetente válido.";
  return errors;
}
