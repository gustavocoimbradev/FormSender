"use client";

import { useRef, useState } from "react";
import { ApiError, createTemplate, updateTemplate, type Template } from "@/lib/api";
import { ActionButton } from "../Button";
import { Field } from "../Field";
import { TrashIcon } from "../icons";
import { Card, CardHeader } from "../ui/Card";
import { useToast } from "../ui/Toast";
import { CodeEditor, VARIABLES } from "./CodeEditor";
import { TemplatePreview } from "./TemplatePreview";

type TemplateEditorProps = {
  /** Present when editing; absent when creating (then `initial` holds the starting point). */
  template?: Template;
  initial?: { subject: string; html: string };
  onSaved: (template: Template) => void;
  onDelete?: () => void;
};

type Errors = { name?: string; subject?: string; html?: string; general?: string };

export function TemplateEditor({ template, initial, onSaved, onDelete }: TemplateEditorProps) {
  const toast = useToast();
  const [name, setName] = useState(template?.name ?? "");
  const [subject, setSubject] = useState(template?.subject ?? initial?.subject ?? "");
  const [html, setHtml] = useState(template?.html ?? initial?.html ?? "");
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const insert = useRef<((text: string) => void) | null>(null);

  async function save() {
    const found: Errors = {};
    if (!name.trim()) found.name = "Dê um nome ao template.";
    if (!subject.trim()) found.subject = "Informe o assunto do e-mail.";
    if (!html.trim()) found.html = "O e-mail não pode ficar vazio.";
    setErrors(found);
    if (Object.keys(found).length > 0) {
      toast("Confira os campos destacados.", "error");
      return;
    }

    setSaving(true);
    try {
      const input = { name: name.trim(), subject: subject.trim(), html };
      const saved = template ? await updateTemplate(template.code, input) : await createTemplate(input);
      toast(template ? "Template salvo." : "Template criado.");
      onSaved(saved);
    } catch (error) {
      if (error instanceof ApiError && error.status === 422) {
        setErrors({
          name: error.fieldErrors.name ? "Confira o nome do template." : undefined,
          subject: error.fieldErrors.subject ? "Confira o assunto (até 200 caracteres)." : undefined,
          html: error.fieldErrors.html ? "Confira o e-mail: scripts não são permitidos e o limite é 100 mil caracteres." : undefined,
        });
        toast("Confira os campos destacados.", "error");
      } else {
        toast("Não foi possível salvar. Tente de novo.", "error");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        void save();
      }}
      className="space-y-6"
    >
      <Card className="animate-fade-up">
        <CardHeader title="Geral" />
        <div className="grid gap-x-4 px-5 pb-2 sm:grid-cols-2 sm:px-6">
          <Field id="template-name" label="Nome do template" value={name} onChange={(event) => setName(event.target.value)} error={errors.name} disabled={saving} placeholder="Promocional" autoComplete="off" autoFocus={!template} />
          <Field id="template-subject" label="Assunto do e-mail" value={subject} onChange={(event) => setSubject(event.target.value)} error={errors.subject} disabled={saving} placeholder="Nova mensagem: {{form_name}}" autoComplete="off" spellCheck={false} />
        </div>
      </Card>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-2">
        <Card className="min-w-0 animate-fade-up">
          <CardHeader title="E-mail" />
          <div className="px-5 pb-6 sm:px-6">
            <div className="mb-3 flex flex-wrap gap-2" role="group" aria-label="Inserir variável">
              {VARIABLES.map((variable) => (
                <button
                  key={variable.label}
                  type="button"
                  title={variable.detail}
                  onClick={() => insert.current?.(variable.label)}
                  className="min-h-11 rounded-full bg-surface/[0.08] px-4 font-mono text-base text-text transition-colors duration-300 hover:bg-accent/25"
                >
                  {variable.label}
                </button>
              ))}
            </div>

            <CodeEditor value={html} onChange={setHtml} insertRef={insert} label="HTML do e-mail" />

            <p aria-live="polite" className="mt-2 text-base text-danger">
              {errors.html}
            </p>
          </div>
        </Card>

        <Card className="min-w-0 animate-fade-up">
          <CardHeader title="Prévia" />
          <div className="px-5 pb-6 sm:px-6">
            <TemplatePreview subject={subject} html={html} />
          </div>
        </Card>
      </div>

      {errors.general && <p role="alert" className="rounded-control border border-danger/30 bg-danger/10 px-4 py-3 text-base text-danger">{errors.general}</p>}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        {onDelete ? (
          <ActionButton type="button" variant="danger" onClick={onDelete} disabled={saving} className="h-14 px-6">
            <TrashIcon /> Excluir
          </ActionButton>
        ) : (
          <span aria-hidden="true" />
        )}

        <ActionButton type="submit" loading={saving} className="h-14 w-full px-8 sm:w-auto">
          {template ? "Salvar alterações" : "Criar template"}
        </ActionButton>
      </div>
    </form>
  );
}
