/** Slow drifting glows behind the content. Purely decorative. */
export function AmbientBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute -left-[12%] -top-[18%] size-[46rem] animate-drift rounded-full bg-accent/25 blur-[120px]" />
      <div className="absolute -bottom-[22%] right-[-10%] size-[40rem] animate-drift rounded-full bg-accent-2/15 blur-[120px] [animation-delay:-8s]" />
      <div className="absolute inset-0 bg-[radial-gradient(rgb(var(--surface)/0.05)_1px,transparent_1px)] [background-size:28px_28px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
    </div>
  );
}
