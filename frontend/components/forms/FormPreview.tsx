"use client";

import { useEffect, useRef } from "react";
import { apiPublicUrl } from "@/lib/config";

type FormPreviewProps = {
  code: string;
  theme: "light" | "dark";
  /** The style being written: the form follows it as it changes, without being saved. */
  css: string;
};

/**
 * The form exactly as a site shows it: drawn by the very same script. It is a preview: it validates, but sending is
 * switched off. It shows the fields as saved; the style is the one being written.
 */
export function FormPreview({ code, theme, css }: FormPreviewProps) {
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = `${apiPublicUrl()}/embed.js`;
    script.async = true;
    script.dataset.form = code;
    script.dataset.theme = theme;
    script.dataset.preview = "";
    script.dataset.target = "#form-preview";
    document.body.appendChild(script);

    const container = box.current;
    return () => {
      script.remove();
      container?.replaceChildren();
    };
  }, [code, theme]);

  // Hands the style to the form once it is there (the script draws itself a moment after it loads).
  useEffect(() => {
    let timer: number | undefined;
    let tries = 0;

    const send = () => {
      const host = box.current?.querySelector("[data-formsender]");

      if (host) host.dispatchEvent(new CustomEvent("formsender:style", { detail: css }));
      else if (tries++ < 40) timer = window.setTimeout(send, 150);
    };

    timer = window.setTimeout(send, 200);
    return () => window.clearTimeout(timer);
  }, [css, theme, code]);

  return <div ref={box} id="form-preview" className={`min-h-48 rounded-control border border-surface/10 p-4 sm:p-6 ${theme === "dark" ? "bg-[#07070d] text-[#f4f4fb]" : "bg-white text-[#14141f]"}`} />;
}
