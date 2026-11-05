import type { Diagnostic } from "@codemirror/lint";
import type { EditorView } from "@codemirror/view";

type Rule = { pattern: RegExp; severity: Diagnostic["severity"]; message: string };

/** What email clients do not understand. Most of the web's CSS is ignored by Outlook and Gmail. */
const RULES: Rule[] = [
  { pattern: /<\s*script\b/gi, severity: "error", message: "Scripts não são permitidos em e-mails." },
  { pattern: /display\s*:\s*(?:inline-)?(?:flex|grid)/gi, severity: "warning", message: "Flex e grid não funcionam em e-mails. Use tabelas." },
  { pattern: /position\s*:\s*(?:absolute|fixed|sticky)/gi, severity: "warning", message: "Posicionamento não funciona em e-mails. Use tabelas." },
  { pattern: /var\(\s*--/gi, severity: "warning", message: "Variáveis CSS não funcionam em e-mails. Use a cor direta, como #8b6bff." },
  { pattern: /<\s*link\b[^>]*stylesheet/gi, severity: "warning", message: "Folhas de estilo externas são ignoradas. Escreva o estilo direto no elemento (style=\"...\")." },
  { pattern: /<\s*style\b/gi, severity: "info", message: "Vários clientes ignoram <style>. Prefira estilos direto no elemento (style=\"...\")." },
  { pattern: /<\s*(?:form|input|button|video|iframe|object|embed)\b/gi, severity: "warning", message: "Esse elemento não funciona na maioria dos clientes de e-mail." },
  { pattern: /(?:box-shadow|transform|animation|transition)\s*:/gi, severity: "info", message: "Esse efeito é ignorado por muitos clientes de e-mail." },
];

const VARIABLE = /\{\{\s*([^{}]*?)\s*\}\}/g;
const KNOWN = /^(?:form_name|date|origin|ip|fields|field\.[a-z][a-z0-9_]*|label\.[a-z][a-z0-9_]*)$/;

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
    found.push({ from, to: from + match[0].length, severity: "warning", message: "Variável desconhecida: ela será enviada como está." });
  }

  return found;
}
