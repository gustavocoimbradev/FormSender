"use client";

import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { restrictToParentElement, restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useMemo, useState } from "react";
import { ApiError, createForm, updateForm, type Form } from "@/lib/api";
import { ActionButton } from "../Button";
import { Field } from "../Field";
import { PlusIcon, TrashIcon } from "../icons";
import { Card, CardHeader } from "../ui/Card";
import { ChipsInput } from "../ui/ChipsInput";
import { useToast } from "../ui/Toast";
import { DesignSection } from "./DesignSection";
import { EmailSection } from "./EmailSection";
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
  sectionWithErrors,
  type DraftErrors,
  type EditorSection,
  type FieldDraft,
  type FormDraft,
} from "./formDraft";

type FormEditorProps = {
  /** Present when editing; absent when creating. */
  form?: Form;
  onSaved: (form: Form) => void;
  /** When given, a delete button sits at the left of the save button (on the General section). */
  onDelete?: () => void;
  /** Which part of the form to show. Without it every part is shown, one after the other (used to create a form). */
  section?: EditorSection;
  /** Asks the screen to show another part, e.g. the one that has a mistake. */
  onSectionChange?: (section: EditorSection) => void;
};

export function FormEditor({ form, onSaved, onDelete, section, onSectionChange }: FormEditorProps) {
  const toast = useToast();
  const [draft, setDraft] = useState<FormDraft>(() => (form ? draftFromForm(form) : emptyDraft()));
  const [errors, setErrors] = useState<DraftErrors>({ fields: {} });
  const [saving, setSaving] = useState(false);
  /** The field just added: it gets the focus once, when it appears. */
  const [lastAdded, setLastAdded] = useState<string>();
  // A small distance before a drag starts keeps clicks on the row from moving it; the keyboard works on the grip too.
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  const emailFields = useMemo(() => draft.fields.map((field) => ({ name: field.name, label: field.label, type: field.type, required: field.required, options: field.options })), [draft.fields]);
  const shows = (part: EditorSection) => section === undefined || section === part;

  /** Shows the mistakes and takes the person to the part of the form that has the first one. */
  function showErrors(found: DraftErrors) {
    setErrors(found);
    toast("Check the highlighted fields.", "error");
    if (section !== undefined) onSectionChange?.(sectionWithErrors(found));
  }

  const patch = (changes: Partial<FormDraft>) => setDraft((current) => ({ ...current, ...changes }));

  function patchField(key: string, changes: Partial<FieldDraft>) {
    setDraft((current) => ({
      ...current,
      fields: current.fields.map((field) => {
        if (field.key !== key) return field;
        const next = { ...field, ...changes };
        // The technical name follows the label of a new field; a saved field keeps its name.
        if (changes.label !== undefined && !field.nameLocked) {
          next.name = nameFromLabel(changes.label, current.fields.filter((other) => other.key !== key).map((other) => other.name));
        }
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
    const found = validateDraft(draft, { saved: Boolean(form) });
    if (hasErrors(found)) {
      showErrors(found);
      return;
    }
    setErrors(found);

    setSaving(true);
    try {
      const saved = form ? await updateForm(form.code, inputFromDraft(draft)) : await createForm(inputFromDraft(draft));
      toast(form ? "Form saved." : "Form created.");
      onSaved(saved);
    } catch (error) {
      if (error instanceof ApiError && error.status === 422) {
        showErrors(errorsFromApi(error, draft));
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
      {shows("general") && (
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
          </div>
        </Card>
      )}

      {shows("fields") && (
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
      )}

      {shows("delivery") && (
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
          </div>
        </Card>
      )}

      {shows("email") && form && (
        <EmailSection
          subject={draft.emailSubject}
          html={draft.emailHtml}
          fields={emailFields}
          errors={{ subject: errors.emailSubject, html: errors.emailHtml }}
          disabled={saving}
          onChange={patch}
        />
      )}

      {shows("design") && form && <DesignSection code={form.code} css={draft.css} error={errors.css} disabled={saving} onChange={(css) => patch({ css })} />}

      {errors.general && <p role="alert" className="rounded-control border border-danger/30 bg-danger/10 px-4 py-3 text-base text-danger">{errors.general}</p>}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        {onDelete && shows("general") ? (
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
