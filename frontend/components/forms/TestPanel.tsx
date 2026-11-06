"use client";

import { useState, type FormEvent } from "react";
import { ApiError, sendTestMessage, type Form, type FormField } from "@/lib/api";
import { isValidEmail } from "@/lib/validation";
import { ActionButton, Button } from "../Button";
import { Field } from "../Field";
import { FileField } from "../FileField";
import { FormsIcon } from "../icons";
import { SuccessCheck } from "../SuccessCheck";
import { TextArea } from "../TextArea";
import { Card, CardHeader } from "../ui/Card";
import { EmptyState } from "../ui/EmptyState";
import { Select } from "../ui/Select";
import { Switch } from "../ui/Switch";
import { useToast } from "../ui/Toast";

type Value = string | boolean | File | null;
type Values = Record<string, Value>;
type Errors = Record<string, string>;

const INPUT_TYPES: Record<string, string> = { text: "text", email: "email", phone: "tel", number: "number", date: "date" };

const emptyValues = (fields: FormField[]): Values => Object.fromEntries(fields.map((field) => [field.name, field.type === "checkbox" ? false : field.type === "file" ? null : ""]));

/** Checks what the person typed before sending, so most mistakes never leave the page. */
function validate(fields: FormField[], values: Values): Errors {
  const errors: Errors = {};

  for (const field of fields) {
    const value = values[field.name];
    const empty = value === "" || value === undefined || value === null;

    if (field.required && field.type !== "checkbox" && empty) errors[field.name] = "Fill in this field.";
    else if (!empty && field.type === "email" && !isValidEmail(String(value))) errors[field.name] = "Enter a valid email.";
    else if (!empty && field.type === "number" && Number.isNaN(Number(value))) errors[field.name] = "Enter a number.";
  }

  return errors;
}

/** What is sent: numbers as numbers, checkboxes as yes/no, and optional empty fields left out. */
function payload(fields: FormField[], values: Values): Record<string, unknown> {
  const body: Record<string, unknown> = {};

  for (const field of fields) {
    const value = values[field.name];

    if (field.type === "checkbox") body[field.name] = Boolean(value);
    else if (value instanceof File) body[field.name] = value;
    else if (typeof value === "string" && value !== "") body[field.name] = field.type === "number" ? Number(value) : value;
  }

  return body;
}

type TestPanelProps = {
  form: Form;
  onOpenMessages: () => void;
  onOpenConfig: () => void;
};

export function TestPanel({ form, onOpenMessages, onOpenConfig }: TestPanelProps) {
  const toast = useToast();
  const [values, setValues] = useState<Values>(() => emptyValues(form.fields));
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string>();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const set = (name: string, value: Value) => {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => (name in current ? Object.fromEntries(Object.entries(current).filter(([key]) => key !== name)) : current));
  };

  async function submit(event: FormEvent) {
    event.preventDefault();

    const found = validate(form.fields, values);
    setErrors(found);
    setFormError(undefined);
    if (Object.keys(found).length > 0) return;

    setSending(true);
    try {
      await sendTestMessage(form.code, payload(form.fields, values));
      setSent(true);
    } catch (error) {
      if (error instanceof ApiError && error.status === 422) {
        // A file has limits people can fix (size, type), so its own message is shown; the rest is simply invalid.
        const fileFields = new Set(form.fields.filter((field) => field.type === "file").map((field) => field.name));
        const fromServer: Errors = Object.fromEntries(Object.entries(error.fieldErrors).map(([name, messages]) => [name, fileFields.has(name) ? (messages[0] ?? "Invalid file.") : "Invalid value."]));

        if (Object.keys(fromServer).length > 0) setErrors(fromServer);
        else setFormError("Add at least one destination in the Delivery tab to receive messages.");
      } else if (error instanceof ApiError && error.status === 503) {
        setFormError("Email sending is not set up yet. Ask an administrator to configure SMTP.");
      } else {
        toast("Could not send the test. Please try again.", "error");
      }
    } finally {
      setSending(false);
    }
  }

  if (form.fields.length === 0) {
    return (
      <Card className="animate-fade-up">
        <EmptyState
          icon={<FormsIcon />}
          title="This form has no fields yet"
          text="Add fields in the Fields tab to test it."
          action={
            <ActionButton type="button" className="w-full sm:w-auto" onClick={onOpenConfig}>
              Go to Fields
            </ActionButton>
          }
        />
      </Card>
    );
  }

  if (sent) {
    return (
      <Card className="animate-fade-up">
        <div className="flex flex-col items-center px-6 py-12 text-center">
          <SuccessCheck />
          <h2 className="mt-6 animate-fade-up text-2xl font-semibold tracking-tight">Test sent!</h2>
          <p className="mt-2 max-w-sm text-base leading-relaxed text-muted">The message is on its way and reaches the destinations in a moment.</p>
          <div className="mt-7 grid w-full max-w-sm gap-3 sm:grid-cols-2">
            <ActionButton
              type="button"
              variant="ghost"
              onClick={() => {
                setValues(emptyValues(form.fields));
                setSent(false);
              }}
            >
              Send another
            </ActionButton>
            <ActionButton type="button" onClick={onOpenMessages}>
              View messages
            </ActionButton>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="animate-fade-up">
      <CardHeader title="Test form" />

      <form onSubmit={submit} noValidate className="px-5 pb-6 sm:px-6">
        {form.fields.map((field, index) => {
          const id = `test-${field.name}`;
          const label = field.required ? `${field.label} *` : field.label;
          const value = values[field.name];

          if (field.type === "file") {
            return <FileField key={field.name} id={id} label={label} file={value instanceof File ? value : null} onChange={(next) => set(field.name, next)} error={errors[field.name]} disabled={sending} />;
          }

          if (field.type === "textarea") return <TextArea key={field.name} id={id} label={label} value={String(value)} onChange={(event) => set(field.name, event.target.value)} error={errors[field.name]} disabled={sending} />;

          if (field.type === "select") {
            return (
              <div key={field.name} className="mb-4">
                <Select
                  id={id}
                  label={label}
                  value={String(value)}
                  options={[{ value: "", label: "Select" }, ...(field.options ?? []).map((option) => ({ value: option, label: option }))]}
                  onChange={(next) => set(field.name, next)}
                  disabled={sending}
                />
                {errors[field.name] && <p className="mt-2 animate-fade-in text-base text-danger">{errors[field.name]}</p>}
              </div>
            );
          }

          if (field.type === "checkbox") {
            return (
              <div key={field.name} className="mb-4">
                <Switch id={id} label={field.label} checked={Boolean(value)} onChange={(next) => set(field.name, next)} disabled={sending} />
              </div>
            );
          }

          return (
            <Field
              key={field.name}
              id={id}
              label={label}
              type={INPUT_TYPES[field.type] ?? "text"}
              value={String(value)}
              onChange={(event) => set(field.name, event.target.value)}
              error={errors[field.name]}
              disabled={sending}
              autoComplete="off"
              autoFocus={index === 0}
              inputMode={field.type === "number" ? "decimal" : undefined}
            />
          );
        })}

        {formError && (
          <p role="alert" className="mb-4 animate-fade-in rounded-control border border-danger/30 bg-danger/10 px-4 py-3 text-base text-danger">
            {formError}
          </p>
        )}

        <Button type="submit" loading={sending} loadingLabel="Sending…">
          Send test
        </Button>
      </form>
    </Card>
  );
}
