/***********************************************************
 * TablePagination — The bar under the KPI table: rows per page, the
 * range shown, and first / previous / next / last page.
 *
 *   Rows per page [10 ▾]      11–20 of 72      «  ‹  Page 2 of 8  ›  »
 *
 * File structure:
 *
 *   1. IMPORTS — the page-size preference.
 *   2. CONSTANTS — NAV_BUTTON.
 *   3. COMPONENT FUNCTION — JSX return: the size picker, the range, the
 *      four buttons (disabled at the ends) around "Page n of m".
 *
 * PAGE SIZE IS A PREFERENCE, THE PAGE IS NOT. Rows per page (10/25/50/100)
 * is written straight to `pageSizePreference` (lib/kpi/).
 * The current page belongs to the table: it passes it in, already clamped,
 * and gets `onPage` back; changing the size calls `onPage(1)` too.
 *
 * Not the catalogue's `components/Pagination.tsx`: that one is tied to the
 * catalogue's density controls; this one knows its own preference.
 *
 * Ported from 7DAE-atom-cockpit.
 *
 * Used on: components/kpi/KpiTable.tsx
 ***********************************************************/

import { PAGE_SIZES, pageSizePreference, type PageSize } from "@/lib/kpi/pageSizePreference";

const NAV_BUTTON =
  "inline-flex h-9 w-9 items-center justify-center rounded border border-border text-fg hover:bg-surface-2 disabled:cursor-default disabled:opacity-40 disabled:hover:bg-transparent";

export default function TablePagination({
  total,
  page,
  pageCount,
  pageSize,
  shown,
  onPage,
}: {
  /** Rows in the whole table. */
  total: number;
  /** Current page, 1-based, already clamped to [1, pageCount]. */
  page: number;
  pageCount: number;
  pageSize: PageSize;
  /** Rows on the current page. */
  shown: number;
  onPage: (page: number) => void;
}) {
  const start = (page - 1) * pageSize;

  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center justify-between gap-3 pt-1 text-sm text-muted">
      <label className="flex items-center gap-2">
        Rows per page
        <select
          value={pageSize}
          onChange={(e) => {
            pageSizePreference.set(Number(e.target.value) as PageSize);
            onPage(1);
          }}
          className="rounded-md border border-border bg-surface px-2 py-1.5 text-sm text-fg"
        >
          {PAGE_SIZES.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </label>

      <span aria-live="polite">
        {start + 1}–{start + shown} of {total}
      </span>

      <div className="flex items-center gap-1.5">
        <button type="button" aria-label="First page" disabled={page === 1} onClick={() => onPage(1)} className={NAV_BUTTON}>
          <span aria-hidden="true">«</span>
        </button>
        <button type="button" aria-label="Previous page" disabled={page === 1} onClick={() => onPage(page - 1)} className={NAV_BUTTON}>
          <span aria-hidden="true">‹</span>
        </button>
        <span className="whitespace-nowrap px-2 text-fg">
          Page {page} of {pageCount}
        </span>
        <button type="button" aria-label="Next page" disabled={page === pageCount} onClick={() => onPage(page + 1)} className={NAV_BUTTON}>
          <span aria-hidden="true">›</span>
        </button>
        <button type="button" aria-label="Last page" disabled={page === pageCount} onClick={() => onPage(pageCount)} className={NAV_BUTTON}>
          <span aria-hidden="true">»</span>
        </button>
      </div>
    </nav>
  );
}
