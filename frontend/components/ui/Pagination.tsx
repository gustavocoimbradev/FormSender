import type { Page } from "@/lib/api";
import { ChevronIcon } from "../icons";

type PaginationProps = {
  meta: Page<unknown>["meta"];
  onPage: (page: number) => void;
};

function pagesAround(current: number, last: number): number[] {
  const start = Math.max(1, Math.min(current - 1, last - 2));
  return Array.from({ length: Math.min(3, last) }, (_, index) => start + index);
}

const BASE = "grid size-11 place-items-center rounded-control text-base transition-colors duration-300";

export function Pagination({ meta, onPage }: PaginationProps) {
  if (meta.total === 0) return null;

  return (
    <nav aria-label="Paginação" className="flex flex-col items-center justify-between gap-4 border-t border-surface/10 px-5 py-4 sm:flex-row">
      <p className="text-base text-muted">
        Mostrando <span className="text-text">{meta.from}–{meta.to}</span> de <span className="text-text">{meta.total}</span>
      </p>

      {meta.last_page > 1 && (
        <div className="flex items-center gap-1">
          <button type="button" aria-label="Página anterior" disabled={meta.current_page <= 1} onClick={() => onPage(meta.current_page - 1)} className={`${BASE} text-muted hover:text-text disabled:opacity-30`}>
            <ChevronIcon className="size-5 rotate-180" />
          </button>

          {pagesAround(meta.current_page, meta.last_page).map((page) => (
            <button
              key={page}
              type="button"
              aria-current={page === meta.current_page ? "page" : undefined}
              onClick={() => onPage(page)}
              className={`${BASE} ${page === meta.current_page ? "bg-accent text-white" : "text-muted hover:bg-surface/[0.06] hover:text-text"}`}
            >
              {page}
            </button>
          ))}

          <button type="button" aria-label="Próxima página" disabled={meta.current_page >= meta.last_page} onClick={() => onPage(meta.current_page + 1)} className={`${BASE} text-muted hover:text-text disabled:opacity-30`}>
            <ChevronIcon className="size-5" />
          </button>
        </div>
      )}
    </nav>
  );
}
