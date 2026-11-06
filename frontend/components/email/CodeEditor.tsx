"use client";

import { autocompletion, closeBrackets, type CompletionContext } from "@codemirror/autocomplete";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { css } from "@codemirror/lang-css";
import { html } from "@codemirror/lang-html";
import { HighlightStyle, bracketMatching, syntaxHighlighting } from "@codemirror/language";
import { lintGutter, linter } from "@codemirror/lint";
import { EditorState } from "@codemirror/state";
import { EditorView, keymap, lineNumbers, placeholder } from "@codemirror/view";
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
};

/**
 * A code editor. For email: HTML, variable autocomplete (type `{{`) and a checker for what email clients ignore.
 * For the form's style: CSS.
 */
export function CodeEditor({ value, onChange, insertRef, label, language = "html", height = "h-[34rem]" }: CodeEditorProps) {
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView>();
  const change = useRef(onChange);
  change.current = onChange;

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
          ...(language === "css" ? [autocompletion()] : [autocompletion({ override: [variableCompletions] }), linter(lintEmail, { delay: 400 }), lintGutter()]),
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
