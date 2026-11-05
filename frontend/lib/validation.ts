export const MIN_PASSWORD_LENGTH = 8;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Accepts the email the way people paste it: with stray spaces and capitals. */
export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function isValidEmail(value: string): boolean {
  return EMAIL.test(normalizeEmail(value));
}

export function isValidPassword(value: string): boolean {
  return value.length >= MIN_PASSWORD_LENGTH;
}

export type Strength = { score: 0 | 1 | 2 | 3 | 4; label: string };

const LABELS = ["", "Fraca", "Razoável", "Boa", "Forte"] as const;

/** A friendly 0-4 estimate; only the length is actually required by the API. */
export function passwordStrength(value: string): Strength {
  if (value.length === 0) return { score: 0, label: LABELS[0] };

  const checks = [
    value.length >= MIN_PASSWORD_LENGTH,
    value.length >= 12,
    /[a-z]/.test(value) && /[A-Z]/.test(value),
    /\d/.test(value) && /[^A-Za-z0-9]/.test(value),
  ];
  const raw = checks.filter(Boolean).length;
  const score = (value.length < MIN_PASSWORD_LENGTH ? Math.min(raw, 1) : Math.max(raw, 1)) as Strength["score"];

  return { score, label: LABELS[score] };
}

export function isValidHost(value: string): boolean {
  const host = value.trim();
  return host.length > 0 && !/\s/.test(host);
}

export function isValidPort(value: string): boolean {
  const port = Number(value);
  return /^\d+$/.test(value) && port >= 1 && port <= 65535;
}

export type Security = "none" | "ssl" | "tls";

/** The usual security for the usual ports, so most people never have to choose. */
export function securityForPort(value: string): Security | null {
  if (value === "465") return "ssl";
  if (value === "587") return "tls";
  if (value === "25") return "none";
  return null;
}
