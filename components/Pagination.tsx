"use client";

import clsx from "clsx";
import ColumnsToggle from "@/components/ColumnsToggle";
import { ALL_ROWS, ROW_OPTIONS, setDensity, type Rows } from "@/lib/catalogueDensity";

type Props = {
  page: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (p: number) => void;
  /** Rows per page, or `"all"`. Present only on the catalogue, which is the
   * one place the density controls belong. */
  rows?: Rows;
};

function computePageSlots(
  page: number,
  totalPages: number,
): (number | "...")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const set = new Set<number>([
    1,
    totalPages,
    page - 1,
    page,
    page + 1,
  ]);
  if (page <= 3) [2, 3, 4, 5].forEach((n) => set.add(n));
  if (page >= totalPages - 2)
    [totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1].forEach(
      (n) => set.add(n),
    );
  const sorted = Array.from(set)
    .filter((n) => n >= 1 && n <= totalPages)
    .sort((a, b) => a - b);
  const result: (number | "...")[] = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push("...");
    result.push(sorted[i]);
  }
  return result;
}

export default function Pagination({
  page,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  rows,
}: Readonly<Props>) {
  // Deliberately no early return when there is a single page: the density
  // controls live in this bar, and someone who set 10 rows and then filtered
  // down to one page would have no way left to get them back.
  const showPageButtons = totalPages > 1;
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);
  const slots = computePageSlots(page, totalPages);

  const btnBase =
    "px-2.5 py-1 rounded text-xs font-medium border transition-colors disabled:opacity-40 disabled:cursor-not-allowed";
  const btnInactive =
    "bg-surface text-fg border-border hover:border-accent/50";
  const btnActive = "bg-accent text-accent-fg border-accent";

  return (
    <nav
      aria-label="Pagination"
      className="mt-8 flex flex-wrap items-center justify-between gap-3"
    >
      <div className="text-sm text-muted">
        Showing {start}–{end} of {totalItems}
      </div>
      {rows !== undefined && (
        <div className="flex items-center gap-3">
          <ColumnsToggle />
          <label className="flex items-center gap-1 text-xs text-muted">
            Rows
            <select
              value={String(rows)}
              onChange={(e) =>
                setDensity({
                  rows:
                    e.target.value === ALL_ROWS
                      ? ALL_ROWS
                      : Number(e.target.value),
                })
              }
              className="rounded border border-border bg-surface px-2 py-1 text-xs text-fg focus:outline-none focus:border-accent"
            >
              {ROW_OPTIONS.map((r) => (
                <option key={String(r)} value={String(r)}>
                  {r === ALL_ROWS ? "All" : r}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}
      <div className={clsx("items-center gap-1", showPageButtons ? "flex" : "hidden")}>
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          aria-label="Previous page"
          className={clsx(btnBase, btnInactive)}
        >
          ← Previous
        </button>
        {slots.map((slot, i) =>
          slot === "..." ? (
            <span
              key={`ellipsis-before-${slots[i + 1]}`}
              aria-hidden="true"
              className="px-1.5 text-muted select-none"
            >
              …
            </span>
          ) : (
            <button
              key={slot}
              type="button"
              onClick={() => onPageChange(slot)}
              aria-label={`Go to page ${slot}`}
              aria-current={slot === page ? "page" : undefined}
              className={clsx(
                btnBase,
                slot === page ? btnActive : btnInactive,
              )}
            >
              {slot}
            </button>
          ),
        )}
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          aria-label="Next page"
          className={clsx(btnBase, btnInactive)}
        >
          Next →
        </button>
      </div>
    </nav>
  );
}
