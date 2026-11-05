import type { ReactNode } from "react";
import { Bar } from "./Skeleton";

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
  /** A compact row for phones. Without it, phones get a card listing every column. */
  renderMobileRow?: (row: T) => ReactNode;
  /** Phone placeholder: a leading avatar circle, for lists whose compact row has one. */
  skeletonAvatar?: boolean;
};

/** A table on desktop, a list of cards on phones. */
export function DataTable<T>({ columns, rows, getKey, onRowClick, loading = false, empty, renderMobileRow, skeletonAvatar = false }: DataTableProps<T>) {
  if (loading) return <ListSkeleton columns={columns} avatar={skeletonAvatar} />;

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
            className={`animate-fade-up px-4 transition-colors duration-300 active:bg-surface/[0.06] ${renderMobileRow ? "py-3" : "space-y-2 py-4"} ${onRowClick ? "cursor-pointer" : ""}`}
          >
            {renderMobileRow ? (
              renderMobileRow(row)
            ) : (
              <>
                <div className="text-lg font-medium">{primary.cell(row)}</div>
                {others.map((column) => (
                  <div key={column.id} className="flex items-center justify-between gap-4 text-base">
                    <span className="text-muted">{column.header}</span>
                    <span className="min-w-0 text-right">{column.cell(row)}</span>
                  </div>
                ))}
              </>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}

/** The placeholder of a list: on desktop the real header row with shimmering cells, on phones the compact rows. */
export function ListSkeleton({ columns, avatar = false }: { columns: { id: string; header: string; className?: string }[]; avatar?: boolean }) {
    const widths = ["w-2/3", "w-1/2", "w-4/5", "w-1/3", "w-3/5"];

    return (
      <div role="status" aria-label="Loading">
        {/* Desktop: the real header row, then rows with the same cell paddings. */}
        <table className="hidden w-full border-separate border-spacing-0 text-left md:table" aria-hidden="true">
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
            {Array.from({ length: 4 }, (_, row) => (
              <tr key={row}>
                {columns.map((column, index) => (
                  <td key={column.id} className={`border-t border-surface/10 px-5 py-4 align-middle ${column.className ?? ""}`}>
                    <Bar className={`h-6 rounded-full ${widths[(row + index) % widths.length]}`} delay={row * 120} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Phones: the compact rows (optional avatar, two lines, chevron). */}
        <ul className="divide-y divide-surface/10 md:hidden" aria-hidden="true">
          {Array.from({ length: 4 }, (_, row) => (
            <li key={row} className="px-4 py-3">
              <div className="flex min-h-14 items-center gap-3">
                {avatar && <Bar className="size-11 shrink-0 rounded-full" delay={row * 120} />}
                <div className="min-w-0 flex-1 space-y-2">
                  <Bar className={`h-5 rounded-full ${widths[row % widths.length]}`} delay={row * 120} />
                  <Bar className="h-4 w-3/4 rounded-full" delay={row * 120} />
                </div>
                <Bar className="size-5 shrink-0 rounded-full" delay={row * 120} />
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
}
