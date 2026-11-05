import type { Diagnostic } from "@codemirror/lint";
import type { EditorView } from "@codemirror/view";

type Rule = { pattern: RegExp; severity: Diagnostic["severity"]; message: string };

/** What email clients do not understand. Most of the web's CSS is ignored by Outlook and Gmail. */
const RULES: Rule[] = [
  { pattern: /<\s*script\b/gi, severity: "error", message: "Scripts are not allowed in emails." },
  { pattern: /display\s*:\s*(?:inline-)?(?:flex|grid)/gi, severity: "warning", message: "Flex and grid do not work in emails. Use tables." },
  { pattern: /position\s*:\s*(?:absolute|fixed|sticky)/gi, severity: "warning", message: "Positioning does not work in emails. Use tables." },
  { pattern: /var\(\s*--/gi, severity: "warning", message: "CSS variables do not work in emails. Use the color directly, like #8b6bff." },
  { pattern: /<\s*link\b[^>]*stylesheet/gi, severity: "warning", message: "External stylesheets are ignored. Write the style on the element itself (style=\"...\")." },
  { pattern: /<\s*style\b/gi, severity: "info", message: "Many clients ignore <style>. Prefer styles on the element itself (style=\"...\")." },
  { pattern: /<\s*(?:form|input|button|video|iframe|object|embed)\b/gi, severity: "warning", message: "This element does not work in most email clients." },
  { pattern: /(?:box-shadow|transform|animation|transition)\s*:/gi, severity: "info", message: "Many email clients ignore this effect." },
];

const VARIABLE = /\{\{\s*([^{}]*?)\s*\}\}/g;
const KNOWN = /^(?:form_name|date|origin|ip|fields|[#/]?field\.[a-z][a-z0-9_]*|label\.[a-z][a-z0-9_]*)$/;

export function lintEmail(view: EditorView): Diagnostic[] {
  const text = view.state.doc.toString();
  const found: Diagnostic[] = [];

  for (const rule of RULES) {
    for (const match of text.matchAll(rule.pattern)) {
      const from = match.index ?? 0;
      found.push({ from, to: from + match[0].length, severity: rule.severity, message: rule.message });
    }
  }

  for (const match of text.matchAll(VARIABLE)) {
    if (KNOWN.test(match[1])) continue;
    const from = match.index ?? 0;
    found.push({ from, to: from + match[0].length, severity: "warning", message: "Unknown variable: it will be sent as written." });
  }

  return found;
}
