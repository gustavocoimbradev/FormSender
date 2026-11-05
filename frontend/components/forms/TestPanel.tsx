"use client";

import { useState, type FormEvent } from "react";
import { ApiError, sendTestMessage, type Form, type FormField } from "@/lib/api";
import { isValidEmail } from "@/lib/validation";
import { ActionButton, Button } from "../Button";
import { Field } from "../Field";
import { FormsIcon } from "../icons";
import { SuccessCheck } from "../SuccessCheck";
import { TextArea } from "../TextArea";
import { Card, CardHeader } from "../ui/Card";
import { EmptyState } from "../ui/EmptyState";
import { Select } from "../ui/Select";
import { Switch } from "../ui/Switch";
import { useToast } from "../ui/Toast";

type Values = Record<string, string | boolean>;
type Errors = Record<string, string>;

const INPUT_TYPES: Record<string, string> = { text: "text", email: "email", phone: "tel", number: "number", date: "date" };

const emptyValues = (fields: FormField[]): Values => Object.fromEntries(fields.map((field) => [field.name, field.type === "checkbox" ? false : ""]));

/** Checks what the person typed before sending, so most mistakes never leave the page. */
function validate(fields: FormField[], values: Values): Errors {
  const errors: Errors = {};

  for (const field of fields) {
    const value = values[field.name];
    const empty = value === "" || value === undefined;

    if (field.required && field.type !== "checkbox" && empty) errors[field.name] = "Preencha este campo.";
    else if (!empty && field.type === "email" && !isValidEmail(String(value))) errors[field.name] = "Informe um e-mail válido.";
    else if (!empty && field.type === "number" && Number.isNaN(Number(value))) errors[field.name] = "Informe um número.";
  }

  return errors;
}

/** What is sent: numbers as numbers, checkboxes as yes/no, and optional empty fields left out. */
function payload(fields: FormField[], values: Values): Record<string, unknown> {
  const body: Record<string, unknown> = {};

  for (const field of fields) {
    const value = values[field.name];

    if (field.type === "checkbox") body[field.name] = Boolean(value);
    else if (value !== "" && value !== undefined) body[field.name] = field.type === "number" ? Number(value) : value;
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

  const set = (name: string, value: string | boolean) => {
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
        const fromServer: Errors = Object.fromEntries(Object.keys(error.fieldErrors).map((name) => [name, "Valor inválido."]));

        if (Object.keys(fromServer).length > 0) setErrors(fromServer);
        else setFormError("Adicione ao menos um destino na aba Configuração para receber as mensagens.");
      } else if (error instanceof ApiError && error.status === 503) {
        setFormError("O envio de e-mail ainda não está configurado. Peça a um administrador para ajustar o SMTP.");
      } else {
        toast("Não foi possível enviar o teste. Tente de novo.", "error");
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
          title="Este formulário ainda não tem campos"
          text="Adicione os campos na aba Configuração para poder testá-lo."
          action={
            <ActionButton type="button" onClick={onOpenConfig}>
              Ir para Configuração
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
          <h2 className="mt-6 animate-fade-up text-2xl font-semibold tracking-tight">Teste enviado!</h2>
          <p className="mt-2 max-w-sm text-base leading-relaxed text-muted">A mensagem foi para a fila e chega aos destinos em instantes.</p>
          <div className="mt-7 grid w-full max-w-sm gap-3 sm:grid-cols-2">
            <ActionButton
              type="button"
              variant="ghost"
              onClick={() => {
                setValues(emptyValues(form.fields));
                setSent(false);
              }}
            >
              Enviar outro
            </ActionButton>
            <ActionButton type="button" onClick={onOpenMessages}>
              Ver mensagens
            </ActionButton>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="animate-fade-up">
      <CardHeader title="Testar formulário" />

      <form onSubmit={submit} noValidate className="px-5 pb-6 sm:px-6">
        {form.fields.map((field, index) => {
          const id = `test-${field.name}`;
          const label = field.required ? `${field.label} *` : field.label;
          const value = values[field.name];

          if (field.type === "textarea") return <TextArea key={field.name} id={id} label={label} value={String(value)} onChange={(event) => set(field.name, event.target.value)} error={errors[field.name]} disabled={sending} />;

          if (field.type === "select") {
            return (
              <div key={field.name} className="mb-4">
                <Select
                  id={id}
                  label={label}
                  value={String(value)}
                  options={[{ value: "", label: "Selecione" }, ...(field.options ?? []).map((option) => ({ value: option, label: option }))]}
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

        <Button type="submit" loading={sending} loadingLabel="Enviando…">
          Enviar teste
        </Button>
      </form>
    </Card>
  );
}
