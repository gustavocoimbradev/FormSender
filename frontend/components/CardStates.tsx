import { Button } from "./Button";

const SHIMMER =
  "animate-shimmer bg-[linear-gradient(90deg,rgb(var(--surface)/0.04),rgb(var(--surface)/0.12),rgb(var(--surface)/0.04))] [background-size:200%_100%]";

/** Placeholder while the screen finds out where the user belongs. */
export function CardSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-5" role="status" aria-label="Carregando">
      <div className={`h-8 w-40 rounded-full ${SHIMMER}`} />
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className={`h-14 rounded-control ${SHIMMER}`} />
      ))}
    </div>
  );
}

export function CardUnreachable({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="animate-fade-up text-center" role="alert">
      <h1 className="text-2xl font-semibold tracking-tight">Não foi possível conectar</h1>
      <p className="mb-7 mt-3 text-base leading-relaxed text-muted">Confira sua conexão e tente de novo em instantes.</p>
      <Button type="button" onClick={onRetry}>
        Tentar novamente
      </Button>
    </div>
  );
}
