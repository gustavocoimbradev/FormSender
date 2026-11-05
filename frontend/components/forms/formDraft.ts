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
];

export type FieldDraft = {
  key: string;
  name: string;
  label: string;
  type: FieldType;
  required: boolean;
  options: string[];
  /** Once the person edits the name by hand, it stops following the label. */
  nameTouched: boolean;
};

export type FormDraft = {
  name: string;
  fields: FieldDraft[];
  destinations: string[];
  domains: string[];
  /** Code of the chosen template; empty means the default one. */
  template: string;
};

export type DraftErrors = {
  name?: string;
  fields: Record<string, { name?: string; label?: string; options?: string }>;
  destinations?: string;
  domains?: string;
  general?: string;
};

let counter = 0;
export const newKey = () => `field-${++counter}`;

export const emptyField = (): FieldDraft => ({ key: newKey(), name: "", label: "", type: "text", required: false, options: [], nameTouched: false });

export const emptyDraft = (): FormDraft => ({ name: "", fields: [], destinations: [], domains: [], template: "" });

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
      nameTouched: true,
    })),
    destinations: form.destinations,
    domains: form.allowed_domains,
    template: form.template ?? "",
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
    template: draft.template || null,
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
export function validateDraft(draft: FormDraft): DraftErrors {
  const errors: DraftErrors = { fields: {} };

  if (!draft.name.trim()) errors.name = "Give the form a name.";

  const seen = new Set<string>();
  for (const field of draft.fields) {
    const row: { name?: string; label?: string; options?: string } = {};

    if (!field.label.trim()) row.label = "Enter the field label.";
    if (!FIELD_NAME.test(field.name)) row.name = "Use lowercase letters, numbers and _ (starting with a letter).";
    else if (seen.has(field.name)) row.name = "A field with this name already exists.";
    seen.add(field.name);

    if (field.type === "select" && field.options.length === 0) row.options = "Enter at least one option.";

    if (Object.keys(row).length > 0) errors.fields[field.key] = row;
  }

  return errors;
}

export const hasErrors = (errors: DraftErrors) => Boolean(errors.name || errors.destinations || errors.domains || Object.keys(errors.fields).length > 0);

export function nameFromLabel(label: string): string {
  return slugify(label);
}

/** Maps the API's field errors (e.g. `fields.1.name`) back to the draft. */
export function errorsFromApi(error: ApiError, draft: FormDraft): DraftErrors {
  const errors: DraftErrors = { fields: {} };

  for (const key of Object.keys(error.fieldErrors)) {
    const parts = key.split(".");

    if (key === "name") errors.name = "Give the form a name.";
    else if (parts[0] === "destinations") errors.destinations = "Check the destination emails.";
    else if (parts[0] === "allowed_domains") errors.domains = "Check the allowed sites.";
    else if (parts[0] === "fields" && parts[1] !== undefined) {
      const field = draft.fields[Number(parts[1])];
      if (!field) continue;

      const row = (errors.fields[field.key] ??= {});
      if (parts[2] === "name") row.name = "This field name is invalid or repeated.";
      else if (parts[2] === "label") row.label = "Enter the field label.";
      else if (parts[2] === "options") row.options = "Enter at least one option.";
      else errors.general = "Check the form fields.";
    }
  }

  if (!errors.name && !errors.destinations && !errors.domains && Object.keys(errors.fields).length === 0) {
    errors.general = "Check the form details and try again.";
  }

  return errors;
}
