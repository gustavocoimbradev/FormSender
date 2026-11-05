"use client";

import { useState } from "react";
import { ApiError, createForm, listTemplates, updateForm, type Form } from "@/lib/api";
import { useResource } from "@/lib/hooks";
import { ActionButton } from "../Button";
import { Field } from "../Field";
import { ArrowDownIcon, ArrowUpIcon, PlusIcon, TrashIcon } from "../icons";
import { Card, CardHeader } from "../ui/Card";
import { ChipsInput } from "../ui/ChipsInput";
import { Select } from "../ui/Select";
import { Switch } from "../ui/Switch";
import { useToast } from "../ui/Toast";
import {
  FIELD_TYPES,
  draftFromForm,
  emptyDraft,
  emptyField,
  errorsFromApi,
  hasErrors,
  inputFromDraft,
  nameFromLabel,
  normalizeDomain,
  validateDomain,
  validateDraft,
  validateEmailChip,
  type DraftErrors,
  type FieldDraft,
  type FormDraft,
} from "./formDraft";

type FormEditorProps = {
  /** Present when editing; absent when creating. */
  form?: Form;
  onSaved: (form: Form) => void;
  /** When given, a delete button sits at the left of the save button. */
  onDelete?: () => void;
};

const ICON_BUTTON = "grid size-11 place-items-center rounded-control text-muted transition-colors duration-300 hover:bg-surface/[0.08] hover:text-text disabled:opacity-30";

export function FormEditor({ form, onSaved, onDelete }: FormEditorProps) {
  const toast = useToast();
  const [draft, setDraft] = useState<FormDraft>(() => (form ? draftFromForm(form) : emptyDraft()));
  const [errors, setErrors] = useState<DraftErrors>({ fields: {} });
  const [saving, setSaving] = useState(false);
  const templates = useResource(listTemplates, []);
  const templateOptions = [
    { value: "", label: "Padrão" },
    ...(templates.data ?? []).filter((template) => !template.is_default).map((template) => ({ value: template.code, label: template.name })),
  ];

  const patch = (changes: Partial<FormDraft>) => setDraft((current) => ({ ...current, ...changes }));

  function patchField(key: string, changes: Partial<FieldDraft>) {
    setDraft((current) => ({
      ...current,
      fields: current.fields.map((field) => {
        if (field.key !== key) return field;
        const next = { ...field, ...changes };
        // The technical name follows the label until the person edits it.
        if (changes.label !== undefined && !field.nameTouched) next.name = nameFromLabel(changes.label);
        return next;
      }),
    }));
  }

  function moveField(index: number, direction: -1 | 1) {
    setDraft((current) => {
      const fields = [...current.fields];
      const target = index + direction;
      if (target < 0 || target >= fields.length) return current;
      [fields[index], fields[target]] = [fields[target], fields[index]];
      return { ...current, fields };
    });
  }

  async function save() {
    const found = validateDraft(draft);
    setErrors(found);
    if (hasErrors(found)) {
      toast("Confira os campos destacados.", "error");
      return;
    }

    setSaving(true);
    try {
      const saved = form ? await updateForm(form.code, inputFromDraft(draft)) : await createForm(inputFromDraft(draft));
      toast(form ? "Formulário salvo." : "Formulário criado.");
      onSaved(saved);
    } catch (error) {
      if (error instanceof ApiError && error.status === 422) {
        setErrors(errorsFromApi(error, draft));
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
        <div className="px-5 pb-2 sm:px-6">
          <Field
            id="form-name"
            label="Nome do formulário"
            value={draft.name}
            onChange={(event) => patch({ name: event.target.value })}
            error={errors.name}
            disabled={saving}
            placeholder="Contato do site"
            autoFocus={!form}
            autoComplete="off"
          />
          <Select id="form-template" label="Template do e-mail" value={draft.template} options={templateOptions} onChange={(template) => patch({ template })} disabled={saving} />
        </div>
      </Card>

      <Card className="animate-fade-up">
        <CardHeader title="Campos">
          <ActionButton type="button" variant="ghost" onClick={() => patch({ fields: [...draft.fields, emptyField()] })} disabled={saving}>
            <PlusIcon /> Adicionar campo
          </ActionButton>
        </CardHeader>

        <div className="space-y-4 px-5 pb-6 sm:px-6">
          {draft.fields.length === 0 && <p className="text-base leading-relaxed text-muted">Nenhum campo ainda. Adicione os campos que o formulário aceita, como nome, e-mail e mensagem.</p>}

          {draft.fields.map((field, index) => {
            const row = errors.fields[field.key] ?? {};

            return (
              <div key={field.key} className="animate-pop rounded-control border border-surface/10 bg-bg/40 p-4">
                <div className="grid gap-x-4 sm:grid-cols-2">
                  <Field
                    id={`${field.key}-label`}
                    label="Rótulo"
                    value={field.label}
                    onChange={(event) => patchField(field.key, { label: event.target.value })}
                    error={row.label}
                    disabled={saving}
                    placeholder="Seu e-mail"
                    autoComplete="off"
                  />
                  <Field
                    id={`${field.key}-name`}
                    label="Nome do campo"
                    value={field.name}
                    onChange={(event) => patchField(field.key, { name: event.target.value, nameTouched: true })}
                    error={row.name}
                    disabled={saving}
                    placeholder="email"
                    autoComplete="off"
                    autoCapitalize="none"
                    spellCheck={false}
                  />
                </div>

                <div className="grid items-end gap-x-4 gap-y-3 sm:grid-cols-[1fr_auto]">
                  <Select id={`${field.key}-type`} label="Tipo" value={field.type} options={FIELD_TYPES} onChange={(type) => patchField(field.key, { type })} disabled={saving} />
                  <Switch id={`${field.key}-required`} label="Obrigatório" checked={field.required} onChange={(required) => patchField(field.key, { required })} disabled={saving} />
                </div>

                {field.type === "select" && (
                  <div className="mt-4">
                    <ChipsInput
                      id={`${field.key}-options`}
                      label="Opções"
                      values={field.options}
                      onChange={(options) => patchField(field.key, { options })}
                      error={row.options}
                      placeholder="Digite uma opção e tecle Enter"
                      disabled={saving}
                      max={100}
                    />
                  </div>
                )}

                <div className="mt-2 flex justify-end gap-1">
                  <button type="button" className={ICON_BUTTON} onClick={() => moveField(index, -1)} disabled={saving || index === 0} aria-label="Subir campo">
                    <ArrowUpIcon />
                  </button>
                  <button type="button" className={ICON_BUTTON} onClick={() => moveField(index, 1)} disabled={saving || index === draft.fields.length - 1} aria-label="Descer campo">
                    <ArrowDownIcon />
                  </button>
                  <button type="button" className={`${ICON_BUTTON} hover:!text-danger`} onClick={() => patch({ fields: draft.fields.filter((current) => current.key !== field.key) })} disabled={saving} aria-label="Remover campo">
                    <TrashIcon />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="animate-fade-up">
        <CardHeader title="Entrega" />
        <div className="px-5 pb-2 sm:px-6">
          <ChipsInput
            id="destinations"
            label="Destinos"
            values={draft.destinations}
            onChange={(destinations) => patch({ destinations })}
            validate={validateEmailChip}
            normalize={(value) => value.trim().toLowerCase()}
            placeholder="voce@empresa.com"
            error={errors.destinations}
            max={20}
            disabled={saving}
          />
          <ChipsInput
            id="domains"
            label="Sites permitidos"
            values={draft.domains}
            onChange={(domains) => patch({ domains })}
            validate={validateDomain}
            normalize={normalizeDomain}
            placeholder="empresa.com ou *.empresa.com"
            error={errors.domains}
            disabled={saving}
          />
        </div>
      </Card>

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
          {form ? "Salvar alterações" : "Criar formulário"}
        </ActionButton>
      </div>
    </form>
  );
}
