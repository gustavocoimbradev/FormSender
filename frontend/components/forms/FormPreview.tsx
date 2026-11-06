"use client";

import { useEffect, useRef } from "react";
import { apiPublicUrl } from "@/lib/config";

type FormPreviewProps = {
  code: string;
  /** The style being written: the form follows it as it changes, without being saved. */
  css: string;
  /** The texts being written: the form shows them as they change, without being saved. */
  strings?: Record<string, string>;
};

/**
 * The form exactly as a site shows it: drawn by the very same script. It is a preview: it validates, but sending is
 * switched off, and pointing at any part of it says which CSS selector styles that part. It shows the fields as
 * saved; the style is the one being written.
 */
export function FormPreview({ code, css, strings }: FormPreviewProps) {
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = `${apiPublicUrl()}/embed.js`;
    script.async = true;
    script.dataset.form = code;
    script.dataset.preview = "";
    script.dataset.target = "#form-preview";
    document.body.appendChild(script);

    const container = box.current;
    return () => {
      script.remove();
      container?.replaceChildren();
    };
  }, [code]);

  // Hands the style to the form once it is there (the script draws itself a moment after it loads).
  useEffect(() => {
    let timer: number | undefined;
    let tries = 0;

    const send = () => {
      const host = box.current?.querySelector("[data-formsender]");

      if (host) {
        if (strings) host.dispatchEvent(new CustomEvent("formsender:strings", { detail: strings }));
        host.dispatchEvent(new CustomEvent("formsender:style", { detail: css }));
      }
      else if (tries++ < 40) timer = window.setTimeout(send, 150);
    };

    timer = window.setTimeout(send, 200);
    return () => window.clearTimeout(timer);
  }, [css, strings, code]);

  return <div ref={box} id="form-preview" className="min-h-48 rounded-control border border-surface/10 bg-white p-4 text-[#14141f] sm:p-6" />;
}
