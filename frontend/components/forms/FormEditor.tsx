"use client";

import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { restrictToParentElement, restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useState } from "react";
import { ApiError, createForm, listTemplates, updateForm, type Form } from "@/lib/api";
import { useResource } from "@/lib/hooks";
import { ActionButton } from "../Button";
import { Field } from "../Field";
import { PlusIcon, TrashIcon } from "../icons";
import { Card, CardHeader } from "../ui/Card";
import { ChipsInput } from "../ui/ChipsInput";
import { Select } from "../ui/Select";
import { useToast } from "../ui/Toast";
import { FieldRow } from "./FieldRow";
import {
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

export function FormEditor({ form, onSaved, onDelete }: FormEditorProps) {
  const toast = useToast();
  const [draft, setDraft] = useState<FormDraft>(() => (form ? draftFromForm(form) : emptyDraft()));
  const [errors, setErrors] = useState<DraftErrors>({ fields: {} });
  const [saving, setSaving] = useState(false);
  /** The field just added: it gets the focus once, when it appears. */
  const [lastAdded, setLastAdded] = useState<string>();
  // A small distance before a drag starts keeps clicks on the row from moving it; the keyboard works on the grip too.
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const templates = useResource(listTemplates, []);
  const templateOptions = [
    { value: "", label: "Default" },
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

  /** A field dropped somewhere new: the list follows. */
  function reorder({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;

    setDraft((current) => {
      const from = current.fields.findIndex((field) => field.key === active.id);
      const to = current.fields.findIndex((field) => field.key === over.id);
      return from < 0 || to < 0 ? current : { ...current, fields: arrayMove(current.fields, from, to) };
    });
  }

  async function save() {
    const found = validateDraft(draft);
    setErrors(found);
    if (hasErrors(found)) {
      toast("Check the highlighted fields.", "error");
      return;
    }

    setSaving(true);
    try {
      const saved = form ? await updateForm(form.code, inputFromDraft(draft)) : await createForm(inputFromDraft(draft));
      toast(form ? "Form saved." : "Form created.");
      onSaved(saved);
    } catch (error) {
      if (error instanceof ApiError && error.status === 422) {
        setErrors(errorsFromApi(error, draft));
        toast("Check the highlighted fields.", "error");
      } else {
        toast("Could not save. Please try again.", "error");
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
        <CardHeader title="General" />
        <div className="px-5 pb-2 sm:px-6">
          <Field
            id="form-name"
            label="Form name"
            value={draft.name}
            onChange={(event) => patch({ name: event.target.value })}
            error={errors.name}
            disabled={saving}
            placeholder="Website contact"
            autoFocus={!form}
            autoComplete="off"
          />
          <div className="mb-4">
            <Select id="form-template" label="Email template" value={draft.template} options={templateOptions} onChange={(template) => patch({ template })} disabled={saving} />
          </div>
        </div>
      </Card>

      <Card className="animate-fade-up">
        <CardHeader title="Fields" />

        <div className="space-y-3 px-5 pb-6 sm:px-6">
          {draft.fields.length === 0 && <p className="text-base leading-relaxed text-muted">No fields yet. Add the fields the form accepts, such as name, email and message.</p>}

          <DndContext sensors={sensors} collisionDetection={closestCenter} modifiers={[restrictToVerticalAxis, restrictToParentElement]} onDragEnd={reorder}>
            <SortableContext items={draft.fields.map((field) => field.key)} strategy={verticalListSortingStrategy}>
              {draft.fields.map((field) => (
                <FieldRow
                  key={field.key}
                  field={field}
                  errors={errors.fields[field.key] ?? {}}
                  disabled={saving}
                  autoFocus={field.key === lastAdded}
                  onChange={(changes) => patchField(field.key, changes)}
                  onRemove={() => patch({ fields: draft.fields.filter((current) => current.key !== field.key) })}
                />
              ))}
            </SortableContext>
          </DndContext>

          <ActionButton
            type="button"
            variant="ghost"
            className="w-full border-dashed"
            disabled={saving}
            onClick={() => {
              const added = emptyField();
              setLastAdded(added.key);
              patch({ fields: [...draft.fields, added] });
            }}
          >
            <PlusIcon /> Add field
          </ActionButton>
        </div>
      </Card>

      <Card className="animate-fade-up">
        <CardHeader title="Delivery" />
        <div className="px-5 pb-2 sm:px-6">
          <ChipsInput
            id="destinations"
            label="Destinations"
            values={draft.destinations}
            onChange={(destinations) => patch({ destinations })}
            validate={validateEmailChip}
            normalize={(value) => value.trim().toLowerCase()}
            placeholder="you@company.com"
            error={errors.destinations}
            max={20}
            disabled={saving}
          />
          <ChipsInput
            id="domains"
            label="Allowed sites"
            values={draft.domains}
            onChange={(domains) => patch({ domains })}
            validate={validateDomain}
            normalize={normalizeDomain}
            placeholder="company.com or *.company.com"
            error={errors.domains}
            disabled={saving}
          />
          {form && (
            <Field
              id="redirect-url"
              label="Thank-you page"
              type="url"
              inputMode="url"
              value={draft.redirectUrl}
              onChange={(event) => patch({ redirectUrl: event.target.value })}
              error={errors.redirectUrl}
              hint="Where visitors land after sending from a plain HTML page. Leave empty to skip."
              disabled={saving}
              placeholder="https://company.com/thanks"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
            />
          )}
        </div>
      </Card>

      {errors.general && <p role="alert" className="rounded-control border border-danger/30 bg-danger/10 px-4 py-3 text-base text-danger">{errors.general}</p>}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        {onDelete ? (
          <ActionButton type="button" variant="danger" onClick={onDelete} disabled={saving} className="h-14 px-6">
            <TrashIcon /> Delete
          </ActionButton>
        ) : (
          <span aria-hidden="true" />
        )}

        <ActionButton type="submit" loading={saving} className="h-14 w-full px-8 sm:w-auto">
          {form ? "Save changes" : "Create form"}
        </ActionButton>
      </div>
    </form>
  );
}
