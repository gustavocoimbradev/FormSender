"use client";

import { autocompletion, closeBrackets, snippetCompletion, type Completion, type CompletionContext } from "@codemirror/autocomplete";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { css, cssLanguage } from "@codemirror/lang-css";
import { html } from "@codemirror/lang-html";
import { HighlightStyle, bracketMatching, foldGutter, indentOnInput, syntaxHighlighting } from "@codemirror/language";
import { lintGutter, linter } from "@codemirror/lint";
import { EditorState } from "@codemirror/state";
import { highlightSelectionMatches, searchKeymap } from "@codemirror/search";
import { EditorView, highlightActiveLine, highlightActiveLineGutter, keymap, lineNumbers, placeholder } from "@codemirror/view";
import { colorPicker } from "@replit/codemirror-css-color-picker";
import { tags } from "@lezer/highlight";
import { useEffect, useRef, type MutableRefObject } from "react";
import { lintEmail } from "./emailLint";

export const VARIABLES = [
  { label: "{{form_name}}", detail: "Form name" },
  { label: "{{date}}", detail: "Date and time sent" },
  { label: "{{origin}}", detail: "Site it came from" },
  { label: "{{ip}}", detail: "Sender IP" },
  { label: "{{fields}}", detail: "The other answers, as a table" },
  { label: "{{field.NAME}}", detail: "Answer of one field" },
  { label: "{{label.NAME}}", detail: "Label of one field" },
  { label: "{{#field.NAME}}{{/field.NAME}}", detail: "Show only if the field has a value" },
];

function variableCompletions(context: CompletionContext) {
  const word = context.matchBefore(/\{\{?[\w.]*/);
  if (!word || (word.from === word.to && !context.explicit)) return null;

  return {
    from: word.from,
    options: VARIABLES.map((variable) => ({ label: variable.label, detail: variable.detail, type: "variable" })),
  };
}

// Every color comes from the panel's palette.
const theme = EditorView.theme(
  {
    "&": { color: "rgb(244 244 251)", backgroundColor: "rgb(7 7 13 / 0.6)", fontSize: "16px", height: "100%" },
    ".cm-content": { fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace", caretColor: "rgb(139 107 255)", padding: "12px 0" },
    ".cm-scroller": { fontFamily: "inherit", lineHeight: "1.6", overflow: "auto" },
    ".cm-gutters": { backgroundColor: "transparent", color: "rgb(163 163 186 / 0.6)", border: "none" },
    ".cm-activeLine, .cm-activeLineGutter": { backgroundColor: "rgb(255 255 255 / 0.04)" },
    "&.cm-focused": { outline: "none" },
    "&.cm-focused .cm-cursor": { borderLeftColor: "rgb(139 107 255)" },
    ".cm-selectionBackground, &.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground": { backgroundColor: "rgb(139 107 255 / 0.3)" },
    ".cm-tooltip": { backgroundColor: "#12121f", border: "1px solid rgb(255 255 255 / 0.15)", borderRadius: "12px", color: "rgb(244 244 251)", overflow: "hidden" },
    ".cm-tooltip-autocomplete ul li[aria-selected]": { backgroundColor: "rgb(139 107 255 / 0.3)", color: "rgb(244 244 251)" },
    ".cm-completionDetail": { color: "rgb(163 163 186)", fontStyle: "normal", marginLeft: "12px" },
    ".cm-diagnostic": { fontSize: "16px", padding: "8px 12px" },
    ".cm-placeholder": { color: "rgb(163 163 186 / 0.6)" },
    ".cm-selectionMatch": { backgroundColor: "rgb(61 214 245 / 0.18)" },
    ".cm-foldPlaceholder": { backgroundColor: "rgb(255 255 255 / 0.08)", border: "none", color: "rgb(163 163 186)", padding: "0 6px", borderRadius: "6px" },
    ".cm-foldGutter span": { cursor: "pointer" },
  },
  { dark: true },
);

const highlight = HighlightStyle.define([
  { tag: tags.tagName, color: "#8b6bff" },
  { tag: tags.angleBracket, color: "rgb(163 163 186)" },
  { tag: tags.attributeName, color: "#3dd6f5" },
  { tag: tags.attributeValue, color: "#7ee2a8" },
  { tag: tags.string, color: "#7ee2a8" },
  { tag: tags.comment, color: "rgb(163 163 186 / 0.7)", fontStyle: "italic" },
  { tag: [tags.keyword, tags.propertyName], color: "#3dd6f5" },
  { tag: tags.number, color: "#ffb454" },
]);

/** Snippets for the CSS editor: type a word (flex, media...) and choose it; Tab jumps between the blanks. */
const CSS_SNIPPETS: Completion[] = [
  snippetCompletion("display: flex;\nalign-items: ${center};\njustify-content: ${center};\ngap: ${12px};", { label: "flex", detail: "a row of items", type: "snippet" }),
  snippetCompletion("display: grid;\ngrid-template-columns: repeat(${2}, minmax(0, 1fr));\ngap: ${16px};", { label: "grid", detail: "columns", type: "snippet" }),
  snippetCompletion("display: flex;\nalign-items: center;\njustify-content: center;", { label: "center", detail: "center its content", type: "snippet" }),
  snippetCompletion("transition: ${all} ${0.2s} ${ease-out};", { label: "transition", detail: "animate a change", type: "snippet" }),
  snippetCompletion("box-shadow: 0 ${10px} ${30px} -${10px} rgba(0, 0, 0, ${0.3});", { label: "shadow", detail: "soft shadow", type: "snippet" }),
  snippetCompletion("background: linear-gradient(${90deg}, ${#7c5cff}, ${#6f8cff});", { label: "gradient", detail: "linear gradient", type: "snippet" }),
  snippetCompletion("border: 1px solid ${var(--border)};\nborder-radius: ${12px};", { label: "border", detail: "border and corners", type: "snippet" }),
  snippetCompletion("font: inherit;\nfont-size: ${16px};\nfont-weight: ${500};\nline-height: ${1.4};", { label: "font", detail: "text", type: "snippet" }),
  snippetCompletion("${selector}:hover {\n  ${}\n}", { label: "hover", detail: "when the mouse is over", type: "snippet" }),
  snippetCompletion("${selector}:focus {\n  outline: none;\n  ${}\n}", { label: "focus", detail: "when selected", type: "snippet" }),
  snippetCompletion("@media (max-width: ${600px}) {\n  ${}\n}", { label: "media", detail: "only on small screens", type: "snippet" }),
  snippetCompletion("@keyframes ${name} {\n  from {\n    ${}\n  }\n  to {\n    ${}\n  }\n}", { label: "keyframes", detail: "an animation", type: "snippet" }),
  snippetCompletion("var(--${accent})", { label: "var", detail: "a color or value from the top", type: "snippet" }),
];

type CodeEditorProps = {
  value: string;
  onChange: (value: string) => void;
  /** Filled with a function that inserts text where the cursor is. */
  insertRef?: MutableRefObject<((text: string) => void) | null>;
  label: string;
  /** HTML (the default) comes with variable autocomplete and the email checker; CSS with its own completion. */
  language?: "html" | "css";
  /** Tailwind height of the box. */
  height?: string;
  /** CSS only: tidies the code. It runs by itself when the editor loses the focus (and on Shift+Alt+F). */
  onFormat?: () => void;
};

/**
 * A code editor. For email: HTML, variable autocomplete (type `{{`) and a checker for what email clients ignore.
 * For the form's style: CSS.
 */
export function CodeEditor({ value, onChange, insertRef, label, language = "html", height = "h-[34rem]", onFormat }: CodeEditorProps) {
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView>();
  const change = useRef(onChange);
  change.current = onChange;
  const format = useRef(onFormat);
  format.current = onFormat;

  useEffect(() => {
    if (!host.current) return;

    const editor = new EditorView({
      parent: host.current,
      state: EditorState.create({
        doc: value,
        extensions: [
          lineNumbers(),
          history(),
          closeBrackets(),
          bracketMatching(),
          language === "css" ? css() : html({ autoCloseTags: true }),
          syntaxHighlighting(highlight),
          ...(language === "css"
            ? [
                // Like a code editor for CSS: a swatch beside every color (click it to pick another), snippets, folding of
                // blocks, the current line and the same words highlighted, search (Ctrl+F) and tidying (Shift+Alt+F).
                cssLanguage.data.of({ autocomplete: CSS_SNIPPETS }),
                autocompletion(),
                colorPicker,
                foldGutter(),
                indentOnInput(),
                highlightActiveLine(),
                highlightActiveLineGutter(),
                highlightSelectionMatches(),
                // Tidy by itself once the person moves on (but not while they pick a color: that is a click on the swatch's own input).
                EditorView.domEventHandlers({
                  blur: (event) => {
                    const next = event.relatedTarget;
                    if (!(next instanceof HTMLInputElement && next.type === "color")) format.current?.();
                    return false;
                  },
                }),
                keymap.of([
                  {
                    key: "Shift-Alt-f",
                    run: () => {
                      format.current?.();
                      return true;
                    },
                  },
                  ...searchKeymap,
                ]),
              ]
            : [autocompletion({ override: [variableCompletions] }), linter(lintEmail, { delay: 400 }), lintGutter()]),
          EditorView.lineWrapping,
          keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
          placeholder(language === "css" ? "/* CSS */" : "<table>...</table>"),
          EditorView.contentAttributes.of({ "aria-label": label, autocapitalize: "off", spellcheck: "false" }),
          EditorView.updateListener.of((update) => update.docChanged && change.current(update.state.doc.toString())),
          theme,
        ],
      }),
    });

    view.current = editor;

    if (insertRef) {
      insertRef.current = (text: string) => {
        const { from, to } = editor.state.selection.main;
        editor.dispatch({ changes: { from, to, insert: text }, selection: { anchor: from + text.length }, scrollIntoView: true });
        editor.focus();
      };
    }

    return () => {
      editor.destroy();
      view.current = undefined;
      if (insertRef) insertRef.current = null;
    };
    // The editor is created once; later changes to the text come from the person typing (or from the effect below).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A change that did not come from typing (a "Reset to default" button, for instance) replaces what the editor shows.
  useEffect(() => {
    const editor = view.current;
    if (editor && value !== editor.state.doc.toString()) editor.dispatch({ changes: { from: 0, to: editor.state.doc.length, insert: value } });
  }, [value]);

  return <div ref={host} className={`${height} overflow-hidden rounded-control border border-surface/10 transition duration-300 focus-within:border-accent focus-within:ring-4 focus-within:ring-accent/20`} />;
}
