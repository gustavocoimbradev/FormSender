"use client";

import { useEffect, useState } from "react";
import { previewTemplate } from "@/lib/api";
import { Pills } from "../ui/Pills";

type Width = "desktop" | "mobile";

/** The preview is its own document, so the panel's scrollbar style is repeated inside it (the sent email is not touched). */
const SCROLLBAR_STYLE = `<style>
  ::-webkit-scrollbar{width:12px;height:12px}
  ::-webkit-scrollbar-track,::-webkit-scrollbar-corner{background:transparent}
  ::-webkit-scrollbar-thumb{border:3px solid transparent;border-radius:999px;background:linear-gradient(180deg,rgba(139,107,255,.55),rgba(61,214,245,.4)) padding-box}
  ::-webkit-scrollbar-thumb:hover{background:linear-gradient(180deg,rgba(139,107,255,.9),rgba(61,214,245,.75)) padding-box}
  @supports not selector(::-webkit-scrollbar){*{scrollbar-width:thin;scrollbar-color:rgba(139,107,255,.55) transparent}}
</style>`;

const WIDTHS: { id: Width; label: string }[] = [
  { id: "desktop", label: "Desktop" },
  { id: "mobile", label: "Phone" },
];

/** The email as it will arrive, filled with example data by the API itself (the same code that sends it). */
export function TemplatePreview({ subject, html }: { subject: string; html: string }) {
  const [rendered, setRendered] = useState<{ subject: string; html: string }>();
  const [failed, setFailed] = useState(false);
  const [width, setWidth] = useState<Width>("desktop");

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      previewTemplate({ subject, html }).then(
        (result) => {
          if (cancelled) return;
          setRendered(result);
          setFailed(false);
        },
        () => !cancelled && setFailed(true),
      );
    }, 400);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [subject, html]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Pills label="Preview width" value={width} options={WIDTHS} onChange={setWidth} />
      </div>

      <p className="mb-3 truncate text-base text-muted" title={rendered?.subject}>
        Subject: <span className="text-text">{rendered?.subject ?? "…"}</span>
      </p>

      <div aria-live="polite" className="mb-3 text-base text-danger">
        {failed && "Could not update the preview. Check the content (scripts are not allowed)."}
      </div>

      <div className="overflow-hidden rounded-control border border-surface/10 bg-bg">
        <iframe
          title="Email preview"
          sandbox=""
          srcDoc={rendered ? SCROLLBAR_STYLE + rendered.html : ""}
          className={`mx-auto block h-[34rem] border-0 bg-white transition-[width] duration-300 ease-out ${width === "mobile" ? "w-[390px] max-w-full" : "w-full"}`}
        />
      </div>
    </div>
  );
}
