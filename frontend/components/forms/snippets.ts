import type { Form, FormField } from "@/lib/api";

export type Target = {
  id: string;
  label: string;
  code: (form: Form, endpoint: string) => string;
};

const FALLBACK: FormField = { name: "message", label: "Message", type: "textarea", required: true };

const fieldsOf = (form: Form): FormField[] => (form.fields.length > 0 ? form.fields : [FALLBACK]);

/** A form with a file field cannot be sent as JSON: it travels as a regular multipart form. */
const hasFiles = (form: Form) => fieldsOf(form).some((field) => field.type === "file");

const FILE_EXAMPLE = (field: FormField) => `${field.name}.pdf`;

const escapeHtml = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const INPUT_TYPES: Record<string, string> = { text: "text", email: "email", phone: "tel", number: "number", date: "date" };

const indent = (text: string, spaces: number) =>
  text
    .split("\n")
    .map((line) => (line ? " ".repeat(spaces) + line : line))
    .join("\n");

const EMPTY_VALUE = (field: FormField) => (field.type === "checkbox" ? "false" : '""');

/** What the page sends for a field, given how to read its current value. */
function payloadValue(field: FormField, read: string): string {
  if (field.type === "number") return `${read} === "" || ${read} === null ? null : Number(${read})`;
  return read;
}

/** Hidden field every form has built in. It is never explained inside the snippets, so a bot reading them learns nothing. */
const HONEYPOT = "_gotcha";
const HONEYPOT_STYLE = "position:absolute;left:-9999px";
const HONEYPOT_ATTRS = 'tabindex="-1" autocomplete="off" aria-hidden="true"';

const OK = "Message sent!";
const FAIL = "Could not send. Please try again.";

/** A site only reaches FormSender if it is on the allowed list; server code must say which site it speaks for. */
function serverOrigin(form: Form): string | null {
  const first = form.allowed_domains[0];
  if (!first) return null;
  return `https://${first.startsWith("*.") ? `www.${first.slice(2)}` : first}`;
}

/** The JSON the form is sent as: every accepted field with an example value. */
export function sample(form: Form): Record<string, unknown> {
  return Object.fromEntries([
    [HONEYPOT, ""],
    ...fieldsOf(form).map((field) => [field.name, field.type === "checkbox" ? true : field.type === "number" ? 1 : field.type === "email" ? "person@example.com" : "..."]),
  ]);
}

/** The request body shown in the panel: JSON, or the fields of a multipart form when there is a file. */
export function requestBody(form: Form): { language: string; title: string; code: string } {
  if (!hasFiles(form)) return { language: "JSON", title: "Request body", code: JSON.stringify(sample(form), null, 2) };

  const lines = fieldsOf(form).map((field) => (field.type === "file" ? `${field.name} = (file)` : `${field.name} = ${field.type === "checkbox" ? "1" : field.type === "number" ? "1" : field.type === "email" ? "person@example.com" : "..."}`));

  return { language: "multipart/form-data", title: "Request body", code: [`${HONEYPOT} =`, ...lines].join("\n") };
}

// ------------------------------------------------------------------ plain HTML

function htmlControl(field: FormField): string {
  const name = escapeHtml(field.name);
  const required = field.required ? " required" : "";

  if (field.type === "textarea") return `<textarea name="${name}" rows="4"${required}></textarea>`;

  if (field.type === "select") {
    const options = (field.options ?? []).map((option) => `      <option>${escapeHtml(option)}</option>`).join("\n");
    return `<select name="${name}"${required}>\n      <option value="">Select</option>\n${options}\n    </select>`;
  }

  if (field.type === "checkbox") return `<input type="checkbox" name="${name}" value="1"${required}>`;

  if (field.type === "file") return `<input type="file" name="${name}"${required}>`;

  return `<input type="${INPUT_TYPES[field.type] ?? "text"}" name="${name}"${required}>`;
}

/** A complete form, with a script that sends it. Ready to paste into any page. */
export function htmlSnippet(form: Form, endpoint: string): string {
  const fields = fieldsOf(form);

  if (hasFiles(form)) return htmlMultipartSnippet(form, endpoint);

  const rows = fields.map((field) => `  <label>\n    ${escapeHtml(field.label)}\n    ${htmlControl(field)}\n  </label>`).join("\n");
  const data = [`          ${HONEYPOT}: form.elements["${HONEYPOT}"].value,`, ...fields.map((field) => `          ${field.name}: ${payloadValue(field, `form.elements["${field.name}"]${field.type === "checkbox" ? ".checked" : ".value"}`)},`)].join("\n");

  return `<form id="formsender">
  <input type="text" name="${HONEYPOT}" ${HONEYPOT_ATTRS} style="${HONEYPOT_STYLE}">

${rows}

  <button type="submit">Send</button>
  <p id="formsender-status" role="status"></p>
</form>

<script>
  const form = document.getElementById("formsender");
  const status = document.getElementById("formsender-status");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    try {
      const response = await fetch("${endpoint}", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
${data}
        }),
      });

      if (!response.ok) throw new Error();

      form.reset();
      status.textContent = "${OK}";
    } catch {
      status.textContent = "${FAIL}";
    }
  });
</script>`;
}

/** The same page, for a form with files: the browser builds the multipart body from the form itself. */
function htmlMultipartSnippet(form: Form, endpoint: string): string {
  const rows = fieldsOf(form).map((field) => `  <label>\n    ${escapeHtml(field.label)}\n    ${htmlControl(field)}\n  </label>`).join("\n");

  return `<form id="formsender" enctype="multipart/form-data">
  <input type="text" name="${HONEYPOT}" ${HONEYPOT_ATTRS} style="${HONEYPOT_STYLE}">

${rows}

  <button type="submit">Send</button>
  <p id="formsender-status" role="status"></p>
</form>

<script>
  const form = document.getElementById("formsender");
  const status = document.getElementById("formsender-status");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    try {
      const response = await fetch("${endpoint}", {
        method: "POST",
        headers: { Accept: "application/json" },
        body: new FormData(form),
      });

      if (!response.ok) throw new Error();

      form.reset();
      status.textContent = "${OK}";
    } catch {
      status.textContent = "${FAIL}";
    }
  });
</script>`;
}

// ------------------------------------------------------------------ JavaScript

function javascriptSnippet(form: Form, endpoint: string): string {
  if (hasFiles(form)) {
    return `// \`form\` is your <form enctype="multipart/form-data"> element
await fetch("${endpoint}", {
  method: "POST",
  headers: { Accept: "application/json" },
  body: new FormData(form),
});`;
  }

  return `await fetch("${endpoint}", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(${indent(JSON.stringify(sample(form), null, 2), 2).trimStart()}),
});`;
}

// ------------------------------------------------------------------ React and Next.js

function jsxControl(field: FormField, extra: string): string {
  const name = field.name;
  const required = field.required ? " required" : "";
  const value = `values.${name}`;

  if (field.type === "textarea") return `<textarea name="${name}" rows={4} value={${value}} onChange={change}${required}${extra} />`;

  if (field.type === "select") {
    const options = (field.options ?? []).map((option) => `            <option>${escapeHtml(option)}</option>`).join("\n");
    return `<select name="${name}" value={${value}} onChange={change}${required}>\n            <option value="">Select</option>\n${options}\n          </select>`;
  }

  if (field.type === "checkbox") return `<input type="checkbox" name="${name}" checked={${value}} onChange={change}${required} />`;

  return `<input type="${INPUT_TYPES[field.type] ?? "text"}" name="${name}" value={${value}} onChange={change}${required} />`;
}

function reactSnippet(form: Form, endpoint: string, directive = ""): string {
  const fields = fieldsOf(form);

  if (hasFiles(form)) {
    const plainRows = fields.map((field) => `      <label>\n        ${escapeHtml(field.label)}\n        ${htmlControl(field).replace(/<input([^>]*?)>/g, "<input$1 />")}\n      </label>`).join("\n");

    return `${directive}import { useState } from "react";

export default function ContactForm() {
  const [status, setStatus] = useState("");

  async function submit(event) {
    event.preventDefault();
    const form = event.currentTarget;

    try {
      const response = await fetch("${endpoint}", {
        method: "POST",
        headers: { Accept: "application/json" },
        body: new FormData(form),
      });

      if (!response.ok) throw new Error();

      form.reset();
      setStatus("${OK}");
    } catch {
      setStatus("${FAIL}");
    }
  }

  return (
    <form onSubmit={submit}>
      <input type="text" name="${HONEYPOT}" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: "absolute", left: "-9999px" }} />

${plainRows}

      <button type="submit">Send</button>
      <p role="status">{status}</p>
    </form>
  );
}`;
  }
  const empty = [`${HONEYPOT}: ""`, ...fields.map((field) => `${field.name}: ${EMPTY_VALUE(field)}`)].join(", ");
  const payload = [`          ${HONEYPOT}: values.${HONEYPOT},`, ...fields.map((field) => `          ${field.name}: ${payloadValue(field, `values.${field.name}`)},`)].join("\n");
  const rows = fields.map((field) => `      <label>\n        ${escapeHtml(field.label)}\n        ${jsxControl(field, "")}\n      </label>`).join("\n");

  return `${directive}import { useState } from "react";

const empty = { ${empty} };

export default function ContactForm() {
  const [values, setValues] = useState(empty);
  const [status, setStatus] = useState("");

  function change(event) {
    const { name, type, value, checked } = event.target;
    setValues((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  }

  async function submit(event) {
    event.preventDefault();

    try {
      const response = await fetch("${endpoint}", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
${payload}
        }),
      });

      if (!response.ok) throw new Error();

      setValues(empty);
      setStatus("${OK}");
    } catch {
      setStatus("${FAIL}");
    }
  }

  return (
    <form onSubmit={submit}>
      <input type="text" name="${HONEYPOT}" value={values.${HONEYPOT}} onChange={change} tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: "absolute", left: "-9999px" }} />

${rows}

      <button type="submit">Send</button>
      <p role="status">{status}</p>
    </form>
  );
}`;
}

// ------------------------------------------------------------------ Vue

function vueControl(field: FormField): string {
  const model = `v-model="values.${field.name}"`;
  const required = field.required ? " required" : "";

  if (field.type === "textarea") return `<textarea ${model} rows="4"${required}></textarea>`;

  if (field.type === "select") {
    const options = (field.options ?? []).map((option) => `        <option>${escapeHtml(option)}</option>`).join("\n");
    return `<select ${model}${required}>\n        <option value="">Select</option>\n${options}\n      </select>`;
  }

  return `<input ${model} type="${field.type === "checkbox" ? "checkbox" : (INPUT_TYPES[field.type] ?? "text")}"${required} />`;
}

function vueSnippet(form: Form, endpoint: string): string {
  const fields = fieldsOf(form);

  if (hasFiles(form)) {
    const plainRows = fields.map((field) => `    <label>\n      ${escapeHtml(field.label)}\n      ${htmlControl(field)}\n    </label>`).join("\n");

    return `<script setup>
import { ref } from "vue";

const status = ref("");

async function submit(event) {
  const form = event.target;

  try {
    const response = await fetch("${endpoint}", {
      method: "POST",
      headers: { Accept: "application/json" },
      body: new FormData(form),
    });

    if (!response.ok) throw new Error();

    form.reset();
    status.value = "${OK}";
  } catch {
    status.value = "${FAIL}";
  }
}
</script>

<template>
  <form @submit.prevent="submit">
    <input type="text" name="${HONEYPOT}" ${HONEYPOT_ATTRS} style="${HONEYPOT_STYLE}" />

${plainRows}

    <button type="submit">Send</button>
    <p role="status">{{ status }}</p>
  </form>
</template>`;
  }
  const empty = [`${HONEYPOT}: ""`, ...fields.map((field) => `${field.name}: ${EMPTY_VALUE(field)}`)].join(", ");
  const payload = [`        ${HONEYPOT}: values.${HONEYPOT},`, ...fields.map((field) => `        ${field.name}: ${payloadValue(field, `values.${field.name}`)},`)].join("\n");
  const rows = fields.map((field) => `    <label>\n      ${escapeHtml(field.label)}\n      ${vueControl(field)}\n    </label>`).join("\n");

  return `<script setup>
import { reactive, ref } from "vue";

const empty = () => ({ ${empty} });
const values = reactive(empty());
const status = ref("");

async function submit() {
  try {
    const response = await fetch("${endpoint}", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
${payload}
      }),
    });

    if (!response.ok) throw new Error();

    Object.assign(values, empty());
    status.value = "${OK}";
  } catch {
    status.value = "${FAIL}";
  }
}
</script>

<template>
  <form @submit.prevent="submit">
      <input v-model="values.${HONEYPOT}" type="text" name="${HONEYPOT}" ${HONEYPOT_ATTRS} style="${HONEYPOT_STYLE}" />

${rows}

    <button type="submit">Send</button>
    <p role="status">{{ status }}</p>
  </form>
</template>`;
}

// ------------------------------------------------------------------ Svelte

function svelteControl(field: FormField): string {
  const required = field.required ? " required" : "";
  const value = `values.${field.name}`;

  if (field.type === "textarea") return `<textarea bind:value={${value}} rows="4"${required}></textarea>`;

  if (field.type === "select") {
    const options = (field.options ?? []).map((option) => `      <option>${escapeHtml(option)}</option>`).join("\n");
    return `<select bind:value={${value}}${required}>\n      <option value="">Select</option>\n${options}\n    </select>`;
  }

  if (field.type === "checkbox") return `<input type="checkbox" bind:checked={${value}}${required} />`;

  return `<input type="${INPUT_TYPES[field.type] ?? "text"}" bind:value={${value}}${required} />`;
}

function svelteSnippet(form: Form, endpoint: string): string {
  const fields = fieldsOf(form);

  if (hasFiles(form)) {
    const plainRows = fields.map((field) => `  <label>\n    ${escapeHtml(field.label)}\n    ${htmlControl(field)}\n  </label>`).join("\n");

    return `<script>
  let status = "";

  async function submit(event) {
    const form = event.currentTarget;

    try {
      const response = await fetch("${endpoint}", {
        method: "POST",
        headers: { Accept: "application/json" },
        body: new FormData(form),
      });

      if (!response.ok) throw new Error();

      form.reset();
      status = "${OK}";
    } catch {
      status = "${FAIL}";
    }
  }
</script>

<form on:submit|preventDefault={submit}>
  <input type="text" name="${HONEYPOT}" ${HONEYPOT_ATTRS} style="${HONEYPOT_STYLE}" />

${plainRows}

  <button type="submit">Send</button>
  <p role="status">{status}</p>
</form>`;
  }
  const empty = [`${HONEYPOT}: ""`, ...fields.map((field) => `${field.name}: ${EMPTY_VALUE(field)}`)].join(", ");
  const payload = [`          ${HONEYPOT}: values.${HONEYPOT},`, ...fields.map((field) => `          ${field.name}: ${payloadValue(field, `values.${field.name}`)},`)].join("\n");
  const rows = fields.map((field) => `  <label>\n    ${escapeHtml(field.label)}\n    ${svelteControl(field)}\n  </label>`).join("\n");

  return `<script>
  const empty = () => ({ ${empty} });
  let values = empty();
  let status = "";

  async function submit() {
    try {
      const response = await fetch("${endpoint}", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
${payload}
        }),
      });

      if (!response.ok) throw new Error();

      values = empty();
      status = "${OK}";
    } catch {
      status = "${FAIL}";
    }
  }
</script>

<form on:submit={(event) => { event.preventDefault(); submit(); }}>
  <input type="text" name="${HONEYPOT}" bind:value={values.${HONEYPOT}} ${HONEYPOT_ATTRS} style="${HONEYPOT_STYLE}" />

${rows}

  <button type="submit">Send</button>
  <p role="status">{status}</p>
</form>`;
}

// ------------------------------------------------------------------ Astro

function astroSnippet(form: Form, endpoint: string): string {
  return `---
// src/components/ContactForm.astro
---

${htmlSnippet(form, endpoint)}`;
}

// ------------------------------------------------------------------ server side (PHP, Laravel, WordPress, Node.js, Python)

function phpPayload(form: Form, read: (field: FormField) => string): string {
  return fieldsOf(form)
    .map((field) => `    '${field.name}' => ${read(field)},`)
    .join("\n");
}

function phpSnippet(form: Form, endpoint: string): string {
  const origin = serverOrigin(form);

  if (hasFiles(form)) {
    const fields = [`    '${HONEYPOT}' => $_POST['${HONEYPOT}'] ?? '',`, ...fieldsOf(form).filter((field) => field.type !== "file").map((field) => `    '${field.name}' => ${field.type === "checkbox" ? `isset($_POST['${field.name}']) ? '1' : '0'` : `$_POST['${field.name}'] ?? ''`},`)].join("\n");
    const files = fieldsOf(form)
      .filter((field) => field.type === "file")
      .map((field) => `if (! empty($_FILES['${field.name}']['tmp_name'])) {\n    $payload['${field.name}'] = new CURLFile($_FILES['${field.name}']['tmp_name'], $_FILES['${field.name}']['type'], $_FILES['${field.name}']['name']);\n}`)
      .join("\n");

    return `<?php
// Receives your form (method="post" enctype="multipart/form-data") and passes it on to FormSender.
$payload = [
${fields}
];

${files}

$curl = curl_init('${endpoint}');

curl_setopt_array($curl, [
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        'Accept: application/json',${origin ? `\n        'Origin: ${origin}', // the site must be in "Allowed sites"` : ""}
    ],
    CURLOPT_POSTFIELDS => $payload, // an array with files is sent as multipart
]);

curl_exec($curl);
$sent = curl_getinfo($curl, CURLINFO_HTTP_CODE) === 202;
curl_close($curl);

echo $sent ? '${OK}' : '${FAIL}';`;
  }
  const honeypot = `    '${HONEYPOT}' => $_POST['${HONEYPOT}'] ?? '',\n`;
  const payload = honeypot + phpPayload(form, (field) => {
    const input = `$_POST['${field.name}'] ?? ''`;
    if (field.type === "checkbox") return `isset($_POST['${field.name}'])`;
    if (field.type === "number") return `(${input}) === '' ? null : (float) $_POST['${field.name}']`;
    return input;
  });

  return `<?php
// Receives your form (method="post") and passes it on to FormSender.
$payload = [
${payload}
];

$curl = curl_init('${endpoint}');

curl_setopt_array($curl, [
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        'Content-Type: application/json',${origin ? `\n        'Origin: ${origin}', // the site must be in "Allowed sites"` : ""}
    ],
    CURLOPT_POSTFIELDS => json_encode($payload),
]);

curl_exec($curl);
$sent = curl_getinfo($curl, CURLINFO_HTTP_CODE) === 202;
curl_close($curl);

echo $sent ? '${OK}' : '${FAIL}';`;
}

function laravelSnippet(form: Form, endpoint: string): string {
  const origin = serverOrigin(form);

  if (hasFiles(form)) {
    const fields = [`        '${HONEYPOT}' => $request->input('${HONEYPOT}'),`, ...fieldsOf(form).filter((field) => field.type !== "file").map((field) => (field.type === "checkbox" ? `        '${field.name}' => $request->boolean('${field.name}') ? '1' : '0',` : `        '${field.name}' => $request->input('${field.name}'),`))].join("\n");
    const files = fieldsOf(form)
      .filter((field) => field.type === "file")
      .map((field) => `    if ($request->hasFile('${field.name}')) {\n        $http = $http->attach('${field.name}', $request->file('${field.name}')->get(), $request->file('${field.name}')->getClientOriginalName());\n    }`)
      .join("\n");

    return `<?php
// routes/web.php
use Illuminate\\Http\\Request;
use Illuminate\\Support\\Facades\\Http;
use Illuminate\\Support\\Facades\\Route;

Route::post('/contato', function (Request $request) {
    $http = Http::${origin ? `withHeaders(['Origin' => '${origin}'])` : "withHeaders([])"};

${files}

    $response = $http->post('${endpoint}', [
${fields}
    ]);

    return back()->with('status', $response->successful() ? '${OK}' : '${FAIL}');
});`;
  }
  const honeypot = `        '${HONEYPOT}' => $request->input('${HONEYPOT}'),\n`;
  const payload = honeypot + fieldsOf(form)
    .map((field) => {
      if (field.type === "checkbox") return `        '${field.name}' => $request->boolean('${field.name}'),`;
      if (field.type === "number") return `        '${field.name}' => $request->filled('${field.name}') ? (float) $request->input('${field.name}') : null,`;
      return `        '${field.name}' => $request->input('${field.name}'),`;
    })
    .join("\n");

  return `<?php
// routes/web.php
use Illuminate\\Http\\Request;
use Illuminate\\Support\\Facades\\Http;
use Illuminate\\Support\\Facades\\Route;

Route::post('/contato', function (Request $request) {
    $response = Http::${origin ? `withHeaders(['Origin' => '${origin}'])->` : ""}post('${endpoint}', [
${payload}
    ]);

    return back()->with('status', $response->successful() ? '${OK}' : '${FAIL}');
});`;
}

function wordpressSnippet(form: Form, endpoint: string): string {
  return `<?php
// functions.php (or a small plugin). Then put [formsender] in any page or post.
add_shortcode('formsender', function () {
    ob_start();
    ?>
${indent(htmlSnippet(form, endpoint), 4)}
    <?php
    return ob_get_clean();
});`;
}

function nodeSnippet(form: Form, endpoint: string): string {
  const origin = serverOrigin(form);

  if (hasFiles(form)) {
    const appended = fieldsOf(form)
      .map((field) => (field.type === "file" ? `body.append("${field.name}", new Blob([await readFile("./${FILE_EXAMPLE(field)}")]), "${FILE_EXAMPLE(field)}");` : `body.append("${field.name}", "${field.type === "checkbox" ? "1" : field.type === "number" ? "1" : field.type === "email" ? "person@example.com" : "..."}");`))
      .join("\n");

    return `// Node.js 18 or newer, on your server
import { readFile } from "node:fs/promises";

const body = new FormData();
body.append("${HONEYPOT}", "");
${appended}

const response = await fetch("${endpoint}", {
  method: "POST",
  headers: {
    Accept: "application/json",${origin ? `\n    Origin: "${origin}", // the site must be in "Allowed sites"` : ""}
  },
  body,
});

console.log(response.status); // 202`;
  }

  return `// Node.js 18 or newer, on your server
const response = await fetch("${endpoint}", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",${origin ? `\n    Origin: "${origin}", // the site must be in "Allowed sites"` : ""}
  },
  body: JSON.stringify(${indent(JSON.stringify(sample(form), null, 2), 2).trimStart()}),
});

console.log(response.status); // 202`;
}

function pythonSnippet(form: Form, endpoint: string): string {
  const origin = serverOrigin(form);

  if (hasFiles(form)) {
    const values = [`        "${HONEYPOT}": "",`, ...fieldsOf(form).filter((field) => field.type !== "file").map((field) => `        "${field.name}": "${field.type === "checkbox" ? "1" : field.type === "number" ? "1" : field.type === "email" ? "person@example.com" : "..."}",`)].join("\n");
    const files = fieldsOf(form)
      .filter((field) => field.type === "file")
      .map((field) => `        "${field.name}": open("${FILE_EXAMPLE(field)}", "rb"),`)
      .join("\n");

    return `import requests

response = requests.post(
    "${endpoint}",
    data={
${values}
    },
    files={
${files}
    },
    headers={"Accept": "application/json"${origin ? `, "Origin": "${origin}"` : ""}},${origin ? "  # the site must be in \"Allowed sites\"" : ""}
    timeout=10,
)

print(response.status_code)  # 202`;
  }
  const items = Object.entries(sample(form))
    .map(([name, value]) => `        "${name}": ${typeof value === "boolean" ? (value ? "True" : "False") : typeof value === "number" ? value : JSON.stringify(value)},`)
    .join("\n");

  return `import requests

response = requests.post(
    "${endpoint}",
    json={
${items}
    },${origin ? `\n    headers={"Origin": "${origin}"},  # the site must be in "Allowed sites"` : ""}
    timeout=10,
)

print(response.status_code)  # 202`;
}

export const TARGETS: Target[] = [
  { id: "html", label: "HTML", code: htmlSnippet },
  { id: "javascript", label: "JavaScript", code: javascriptSnippet },
  { id: "react", label: "React", code: (form, endpoint) => reactSnippet(form, endpoint) },
  { id: "next", label: "Next.js", code: (form, endpoint) => reactSnippet(form, endpoint, '"use client";\n\n') },
  { id: "vue", label: "Vue", code: vueSnippet },
  { id: "svelte", label: "Svelte", code: svelteSnippet },
  { id: "astro", label: "Astro", code: astroSnippet },
  { id: "php", label: "PHP", code: phpSnippet },
  { id: "laravel", label: "Laravel", code: laravelSnippet },
  { id: "wordpress", label: "WordPress", code: wordpressSnippet },
  { id: "node", label: "Node.js", code: nodeSnippet },
  { id: "python", label: "Python", code: pythonSnippet },
];
