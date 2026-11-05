import { CopyButton } from "./CopyButton";

/**
 * A code sample in one quiet box: the language sits in a slim bar at the top
 * of the box, with a discreet copy icon on the right.
 */
export function CodeBlock({ language, code, id = "snippet", flush = false }: { language: string; code: string; id?: string; flush?: boolean }) {
  return (
    <figure className={`${flush ? "" : "mt-5"} overflow-hidden rounded-control border border-surface/10 bg-bg/60`}>
      <figcaption className="flex items-center justify-between border-b border-surface/10 bg-surface/[0.03] pl-4 pr-1">
        <span className="text-sm font-medium tracking-wide text-muted">{language}</span>
        <CopyButton value={code} variant="icon" label={`Copiar ${language}`} />
      </figcaption>

      <pre data-testid={id} className="max-h-[28rem] overflow-auto p-4 text-base leading-relaxed text-text/90">
        <code>{code}</code>
      </pre>
    </figure>
  );
}

/** One value (like the address) in a box, with the copy icon inside it. */
export function CopyBox({ value, id, prefix }: { value: string; id: string; prefix?: string }) {
  return (
    <div className="flex items-center rounded-control border border-surface/10 bg-bg/60 pl-4 pr-1">
      {prefix && <span className="mr-3 shrink-0 rounded-full bg-accent/15 px-3 py-0.5 text-base font-semibold text-accent">{prefix}</span>}
      <code data-testid={id} className="min-w-0 flex-1 break-all py-3 text-base">
        {value}
      </code>
      <CopyButton value={value} variant="icon" label="Copiar endereço" />
    </div>
  );
}
