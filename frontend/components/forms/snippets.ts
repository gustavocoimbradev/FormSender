import type { Form, FormField } from "@/lib/api";

const FALLBACK: FormField = { name: "message", label: "Message", type: "textarea", required: true };

const fieldsOf = (form: Form): FormField[] => (form.fields.length > 0 ? form.fields : [FALLBACK]);

const escapeHtml = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const INPUT_TYPES: Record<string, string> = { text: "text", email: "email", phone: "tel", number: "number", date: "date" };

/** Hidden field every form has built in. It is never explained in the snippet, so a bot reading it learns nothing. */
const HONEYPOT = "_gotcha";
const HONEYPOT_STYLE = "position:absolute;left:-9999px";
const HONEYPOT_ATTRS = 'tabindex="-1" autocomplete="off" aria-hidden="true"';

function control(field: FormField): string {
  const name = escapeHtml(field.name);
  const required = field.required ? " required" : "";

  if (field.type === "textarea") return `<textarea name="${name}" rows="4"${required}></textarea>`;

  if (field.type === "select") {
    const options = (field.options ?? []).map((option) => `      <option>${escapeHtml(option)}</option>`).join("\n");
    return `<select name="${name}"${required}>\n      <option value="">Select</option>\n${options}\n    </select>`;
  }

  // A checkbox sends its value only when ticked: 1 is what the API reads as yes.
  if (field.type === "checkbox") return `<input type="checkbox" name="${name}" value="1"${required}>`;

  if (field.type === "file") return `<input type="file" name="${name}"${required}>`;

  return `<input type="${INPUT_TYPES[field.type] ?? "text"}" name="${name}"${required}>`;
}

/**
 * The whole embed: a regular HTML form that posts straight to FormSender. No script.
 * (With a file field the form must be sent as multipart.)
 */
export function htmlForm(form: Form, endpoint: string): string {
  const fields = fieldsOf(form);
  const encoding = fields.some((field) => field.type === "file") ? ' enctype="multipart/form-data"' : "";
  const rows = fields.map((field) => `  <label>\n    ${escapeHtml(field.label)}\n    ${control(field)}\n  </label>`).join("\n");

  return `<form action="${endpoint}" method="post"${encoding}>
  <input type="text" name="${HONEYPOT}" ${HONEYPOT_ATTRS} style="${HONEYPOT_STYLE}">

${rows}

  <button type="submit">Send</button>
</form>`;
}
