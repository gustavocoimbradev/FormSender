"use client";

import { useEffect, useState } from "react";
import { previewTemplate } from "@/lib/api";
import { Pills } from "../ui/Pills";

type Width = "desktop" | "mobile";

const WIDTHS: { id: Width; label: string }[] = [
  { id: "desktop", label: "Computador" },
  { id: "mobile", label: "Celular" },
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
        <Pills label="Largura da prévia" value={width} options={WIDTHS} onChange={setWidth} />
      </div>

      <p className="mb-3 truncate text-base text-muted" title={rendered?.subject}>
        Assunto: <span className="text-text">{rendered?.subject ?? "…"}</span>
      </p>

      <div aria-live="polite" className="mb-3 text-base text-danger">
        {failed && "Não foi possível atualizar a prévia. Confira o conteúdo (scripts não são permitidos)."}
      </div>

      <div className="overflow-hidden rounded-control border border-surface/10 bg-bg">
        <iframe
          title="Prévia do e-mail"
          sandbox=""
          srcDoc={rendered?.html ?? ""}
          className={`mx-auto block h-[34rem] border-0 bg-white transition-[width] duration-300 ease-out ${width === "mobile" ? "w-[390px] max-w-full" : "w-full"}`}
        />
      </div>
    </div>
  );
}
