import { Button } from "./Button";
import { Bar, FieldSkeleton } from "./ui/Skeleton";

/** The inside of the sign in / setup box while it finds out where the person goes: title, fields, button. */
export function CardSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div role="status" aria-label="Loading">
      <Bar className="mx-auto mb-7 h-8 w-44 rounded-full" />
      {Array.from({ length: rows }, (_, index) => (
        <FieldSkeleton key={index} width={index % 2 === 0 ? "w-16" : "w-24"} />
      ))}
      <Bar className="mt-2 h-14 rounded-control" />
    </div>
  );
}

export function CardUnreachable({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="animate-fade-up text-center" role="alert">
      <h1 className="text-2xl font-semibold tracking-tight">Could not connect</h1>
      <p className="mb-7 mt-3 text-base leading-relaxed text-muted">Check your connection and try again in a moment.</p>
      <Button type="button" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}
