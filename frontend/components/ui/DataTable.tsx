import type { ReactNode } from "react";

export type Column<T> = {
  id: string;
  header: string;
  cell: (row: T) => ReactNode;
  /** Width/alignment classes for the desktop cell. */
  className?: string;
  /** The row title on phones (shown big, without a label). */
  primary?: boolean;
};

type DataTableProps<T> = {
  columns: Column<T>[];
  rows: T[];
  getKey: (row: T) => string | number;
  onRowClick?: (row: T) => void;
  /** Rows to show as skeletons while loading. */
  loading?: boolean;
  empty?: ReactNode;
};

const SHIMMER =
  "animate-shimmer rounded-full bg-[linear-gradient(90deg,rgb(var(--surface)/0.04),rgb(var(--surface)/0.12),rgb(var(--surface)/0.04))] [background-size:200%_100%]";

/** A table on desktop, a list of cards on phones. */
export function DataTable<T>({ columns, rows, getKey, onRowClick, loading = false, empty }: DataTableProps<T>) {
  if (loading) {
    return (
      <div role="status" aria-label="Carregando" className="space-y-1 p-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className={`h-14 rounded-control ${SHIMMER}`} style={{ animationDelay: `${index * 120}ms` }} />
        ))}
      </div>
    );
  }

  if (rows.length === 0) return <>{empty}</>;

  const primary = columns.find((column) => column.primary) ?? columns[0];
  const others = columns.filter((column) => column !== primary);

  return (
    <>
      <table className="hidden w-full border-separate border-spacing-0 text-left md:table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.id} scope="col" className={`bg-surface/[0.03] px-5 py-3 text-base font-medium text-muted first:rounded-tl-control last:rounded-tr-control ${column.className ?? ""}`}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={getKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              onKeyDown={onRowClick ? (event) => event.key === "Enter" && onRowClick(row) : undefined}
              tabIndex={onRowClick ? 0 : undefined}
              style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
              className={`group animate-fade-up focus-visible:ring-inset ${onRowClick ? "cursor-pointer" : ""}`}
            >
              {columns.map((column) => (
                <td key={column.id} className={`border-t border-surface/10 px-5 py-4 align-middle text-base transition-colors duration-300 group-hover:bg-surface/[0.04] ${column.className ?? ""}`}>
                  {column.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <ul className="divide-y divide-surface/10 md:hidden">
        {rows.map((row, index) => (
          <li
            key={getKey(row)}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
            onKeyDown={onRowClick ? (event) => event.key === "Enter" && onRowClick(row) : undefined}
            tabIndex={onRowClick ? 0 : undefined}
            style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
            className={`animate-fade-up space-y-2 px-4 py-4 transition-colors duration-300 active:bg-surface/[0.06] ${onRowClick ? "cursor-pointer" : ""}`}
          >
            <div className="text-lg font-medium">{primary.cell(row)}</div>
            {others.map((column) => (
              <div key={column.id} className="flex items-center justify-between gap-4 text-base">
                <span className="text-muted">{column.header}</span>
                <span className="min-w-0 text-right">{column.cell(row)}</span>
              </div>
            ))}
          </li>
        ))}
      </ul>
    </>
  );
}
