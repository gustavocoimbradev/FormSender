import type { ApiError, Form, FormField, FormInput, FieldType } from "@/lib/api";
import { slugify } from "@/lib/format";
import { isValidEmail } from "@/lib/validation";

export const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: "text", label: "Short text" },
  { value: "textarea", label: "Long text" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "number", label: "Number" },
  { value: "select", label: "List of options" },
  { value: "checkbox", label: "Checkbox" },
  { value: "date", label: "Date" },
  { value: "file", label: "File upload" },
];

export type FieldDraft = {
  key: string;
  name: string;
  label: string;
  type: FieldType;
  required: boolean;
  options: string[];
  /** A saved field keeps its name for good (sites already send it); a new one follows its label. */
  nameLocked: boolean;
};

export type FormDraft = {
  name: string;
  fields: FieldDraft[];
  destinations: string[];
  domains: string[];
  /** The email delivered for the form's messages. Empty means the default email (a form being created has not got to choose yet). */
  emailSubject: string;
  emailHtml: string;
};

export type DraftErrors = {
  name?: string;
  fields: Record<string, { name?: string; label?: string; options?: string }>;
  destinations?: string;
  domains?: string;
  emailSubject?: string;
  emailHtml?: string;
  general?: string;
};

let counter = 0;

/**
 * Identifies a row while the form is being edited (it also identifies the row when dragging it). The random part keeps it
 * unique even if this module is reloaded and the counter starts over: two rows with one key would move together.
 */
export const newKey = () => `field-${Math.random().toString(36).slice(2, 8)}${(++counter).toString(36)}`;

export const emptyField = (): FieldDraft => ({ key: newKey(), name: "", label: "", type: "text", required: false, options: [], nameLocked: false });

export const emptyDraft = (): FormDraft => ({ name: "", fields: [], destinations: [], domains: [], emailSubject: "", emailHtml: "" });

export function draftFromForm(form: Form): FormDraft {
  return {
    name: form.name,
    fields: form.fields.map((field: FormField) => ({
      key: newKey(),
      name: field.name,
      label: field.label,
      type: field.type,
      required: field.required ?? false,
      options: field.options ?? [],
      nameLocked: true,
    })),
    destinations: form.destinations,
    domains: form.allowed_domains,
    emailSubject: form.email_subject,
    emailHtml: form.email_html,
  };
}

export function inputFromDraft(draft: FormDraft): FormInput {
  return {
    name: draft.name.trim(),
    fields: draft.fields.map((field) => ({
      name: field.name,
      label: field.label.trim(),
      type: field.type,
      required: field.required,
      ...(field.type === "select" ? { options: field.options } : {}),
    })),
    destinations: draft.destinations,
    allowed_domains: draft.domains,
    email_subject: draft.emailSubject.trim() || null,
    email_html: draft.emailHtml.trim() || null,
  };
}

const FIELD_NAME = /^[a-z][a-z0-9_]*$/;
const DOMAIN = /^(?:(?:\*\.)?(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}|localhost)$/;

/** Accepts a domain the way people paste it (URL, port, capitals) and keeps just the host. */
export function normalizeDomain(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/^[a-z][a-z0-9+.-]*:\/\//, "")
    .replace(/[/?#].*$/, "")
    .replace(/:\d+$/, "");
}

export const validateDomain = (value: string) => (DOMAIN.test(value) ? null : "Use an address like company.com or *.company.com.");
export const validateEmailChip = (value: string) => (isValidEmail(value) ? null : "Enter a valid email.");

/** Client-side checks that mirror the API, so most mistakes are caught before sending. */
export function validateDraft(draft: FormDraft, { checkEmail }: { checkEmail: boolean }): DraftErrors {
  const errors: DraftErrors = { fields: {} };

  if (!draft.name.trim()) errors.name = "Give the form a name.";

  // A saved form shows its email in the editor, so an empty one is a mistake (to go back to the default there is a button).
  if (checkEmail) {
    if (!draft.emailSubject.trim()) errors.emailSubject = "Enter the email subject.";
    if (!draft.emailHtml.trim()) errors.emailHtml = "The email cannot be empty.";
  }

  const seen = new Set<string>();
  for (const field of draft.fields) {
    const row: { name?: string; label?: string; options?: string } = {};

    if (!field.label.trim()) row.label = "Enter the field label.";
    // The name comes from the label, so a problem with it is shown on the label.
    if (!FIELD_NAME.test(field.name)) row.label ??= "Use letters or numbers in the label.";
    else if (seen.has(field.name)) row.label ??= "Another field has the same name. Change the label.";
    seen.add(field.name);

    if (field.type === "select" && field.options.length === 0) row.options = "Enter at least one option.";

    if (Object.keys(row).length > 0) errors.fields[field.key] = row;
  }

  return errors;
}

export type EditorSection = "general" | "fields" | "delivery" | "email";

/** The tab that holds the first mistake, so the person is taken to it. */
export function sectionWithErrors(errors: DraftErrors): EditorSection {
  if (errors.name) return "general";
  if (Object.keys(errors.fields).length > 0) return "fields";
  if (errors.emailSubject || errors.emailHtml) return "email";
  return "delivery";
}

export const hasErrors = (errors: DraftErrors) => Boolean(errors.name || errors.destinations || errors.domains || errors.emailSubject || errors.emailHtml || Object.keys(errors.fields).length > 0);

/** The technical name of a new field: its label as a slug, made unique among the other fields (email, email_2...). */
export function nameFromLabel(label: string, taken: string[]): string {
  const base = slugify(label) || "field";
  let name = base;

  for (let copy = 2; taken.includes(name); copy++) name = `${base}_${copy}`;

  return name;
}

/** Maps the API's field errors (e.g. `fields.1.name`) back to the draft. */
export function errorsFromApi(error: ApiError, draft: FormDraft): DraftErrors {
  const errors: DraftErrors = { fields: {} };

  for (const key of Object.keys(error.fieldErrors)) {
    const parts = key.split(".");

    if (key === "name") errors.name = "Give the form a name.";
    else if (parts[0] === "destinations") errors.destinations = "Check the destination emails.";
    else if (parts[0] === "allowed_domains") errors.domains = "Check the allowed sites.";
    else if (key === "email_subject") errors.emailSubject = "Check the subject (up to 200 characters).";
    else if (key === "email_html") errors.emailHtml = "Check the email: scripts are not allowed and the limit is 100,000 characters.";
    else if (parts[0] === "fields" && parts[1] !== undefined) {
      const field = draft.fields[Number(parts[1])];
      if (!field) continue;

      const row = (errors.fields[field.key] ??= {});
      if (parts[2] === "name") row.label = "This label gives the field an invalid or repeated name. Change it.";
      else if (parts[2] === "label") row.label = "Enter the field label.";
      else if (parts[2] === "options") row.options = "Enter at least one option.";
      else errors.general = "Check the form fields.";
    }
  }

  if (!errors.name && !errors.destinations && !errors.domains && !errors.emailSubject && !errors.emailHtml && Object.keys(errors.fields).length === 0) {
    errors.general = "Check the form details and try again.";
  }

  return errors;
}
