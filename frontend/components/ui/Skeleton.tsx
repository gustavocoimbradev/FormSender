/**
 * Loading placeholders. Each one mirrors the shape of what it stands for (same paddings, same heights, same
 * grid), so nothing jumps when the real content arrives.
 */

const SHIMMER =
  "animate-shimmer bg-[linear-gradient(90deg,rgb(var(--surface)/0.04),rgb(var(--surface)/0.12),rgb(var(--surface)/0.04))] [background-size:200%_100%]";

/** One shimmering bar. */
export function Bar({ className = "", delay = 0 }: { className?: string; delay?: number }) {
  return <div aria-hidden="true" className={`${SHIMMER} ${className || "h-5 w-24 rounded-full"}`} style={delay ? { animationDelay: `${delay}ms` } : undefined} />;
}

/** A labelled input: the label line, then the 56px field (same spacing as <Field>). */
export function FieldSkeleton({ width = "w-28" }: { width?: string }) {
  return (
    <div className="mb-4">
      <Bar className={`my-1 mb-3 h-4 rounded-full ${width}`} />
      <Bar className="h-14 rounded-control" />
    </div>
  );
}

/** A row of fields, laid out with the same grid classes as the real form. */
export function FieldsRow({ count, grid = "" }: { count: number; grid?: string }) {
  return (
    <div className={`grid gap-x-4 ${grid}`}>
      {Array.from({ length: count }, (_, index) => (
        <FieldSkeleton key={index} width={index % 2 === 0 ? "w-28" : "w-20"} />
      ))}
    </div>
  );
}

/** The heading of a card (same box as <CardHeader>). */
export function CardHeaderSkeleton() {
  return (
    <div className="flex items-center px-5 py-4 sm:px-6">
      <Bar className="h-7 w-28 rounded-full" />
    </div>
  );
}

/** A whole card of a form: its heading, then the given content. */
export function FormCardSkeleton({ children }: { children: React.ReactNode }) {
  return (
    <section className="rounded-card border border-surface/10 bg-surface/[0.04] backdrop-blur-xl">
      <CardHeaderSkeleton />
      <div className="px-5 pb-2 sm:px-6">{children}</div>
    </section>
  );
}

/** The tab bar of a detail screen (same height as <Pills>: 44px tabs + padding + border). */
export function PillsSkeleton() {
  return <Bar className="mb-6 h-[3.375rem] w-full rounded-full sm:w-[30.375rem]" />;
}
