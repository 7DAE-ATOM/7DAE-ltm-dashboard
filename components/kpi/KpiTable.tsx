/***********************************************************
 * KpiTable — Every Lab Test Mean of the scope, sortable on any column,
 * one page at a time.
 *
 *   NAME ↕     EXTERNAL ID  PORTFOLIO ↕  PHOTOS  LTM MANAGER  LTM PROJECT MANAGER  SEAL     COMPLETION ▲
 *   Bench 12   LTM-1084     Not set        0     C. Martin    Not set              DRAFT    ▇░░░░ 12 %
 *   …
 *   Rows per page [10 ▾]      11–20 of 72      «  ‹  Page 2 of 8  ›  »
 *
 * File structure:
 *
 *   1. IMPORTS — useState, Link, clsx, the KpiLtm type, NOT_SET and the
 *      order types, the page-size preference, the pagination bar, TINT.
 *   2. CONSTANTS — ROW_GRID, COLUMNS (key, header label).
 *   3. FUNCTIONS — completionBar(), joined().
 *   4. COMPONENT FUNCTION —
 *      a. State — the current page; the page size (remembered preference).
 *      b. Derived data — page count, the clamped page, its rows.
 *      c. Handlers — sortBy(): same column flips, another starts ascending.
 *      d. JSX return — title, sortable header, rows, pagination; or the
 *         empty message.
 *
 * SORTABLE COLUMNS. The rows arrive ALREADY SORTED (`sortLtms` — "Not set"
 * last whatever the direction, ties by name); a header click asks the page
 * for a new order, which lives in the URL (`?order=`). Completion ascending
 * by default: the benches where effort pays most come first.
 *
 * PAGINATED. The page size is a remembered preference (lib/kpi/); the page
 * is local, back to 1 when the scope (the page remounts this table with a
 * `key`), the order or the size changes, and clamped when a refresh shrinks
 * the list.
 *
 * A GRID WITH ARIA TABLE ROLES (`aria-sort` on the headers): the header and
 * the rows share one column template. It scrolls sideways INSIDE its card on
 * a narrow screen, never the page.
 *
 * THE NAME OPENS THE BENCH'S DETAIL PAGE of this app (`/labtestmean?id=
 * <external id>`, the link every card uses) IN A NEW TAB, so the filtered
 * view stays open behind it. Without an external id it stays plain text.
 *
 * PHOTOS AT 0 ARE IN THE WARNING COLOUR. The seal is a badge, RELEASE in
 * the success colour and DRAFT muted. The completion bar is orange below
 * 50 %, light accent to 89 %, accent from 90 %.
 *
 * Ported from 7DAE-atom-cockpit (`components/statistics/LtmTable.tsx`).
 *
 * Used on: components/kpi/KpiClient.tsx
 ***********************************************************/

"use client";

import { useState } from "react";
import Link from "next/link";
import clsx from "clsx";

import type { KpiLtm } from "@/lib/kpi/kpiLabTestMeans";
import { NOT_SET, type LtmColumn, type LtmOrder } from "@/lib/kpi/kpiStats";
import { pageSizePreference } from "@/lib/kpi/pageSizePreference";
import { TINT } from "./kpiStyle";
import TablePagination from "./TablePagination";

const ROW_GRID =
  "grid min-w-[62rem] grid-cols-[minmax(0,1.4fr)_7rem_minmax(0,1.1fr)_4.5rem_minmax(0,1fr)_minmax(0,1fr)_6.5rem_10rem] items-center gap-3";

const COLUMNS: { key: LtmColumn; label: string }[] = [
  { key: "name", label: "Name" },
  { key: "externalId", label: "External ID" },
  { key: "portfolio", label: "Portfolio" },
  { key: "photos", label: "Photos" },
  { key: "manager", label: "LTM Manager" },
  { key: "projectManager", label: "LTM Project Manager" },
  { key: "seal", label: "Quality seal" },
  { key: "completion", label: "Completion" },
];

/** Bar colour by completion: < 50 %, 50–89 %, ≥ 90 %. */
function completionBar(completion: number): string {
  if (completion < 50) return "bg-warning";
  if (completion < 90) return TINT.accentBar45;
  return "bg-accent";
}

/** Several values joined; empty → "Not set". */
function joined(values: string[]): { text: string; notSet: boolean } {
  return values.length ? { text: values.join(", "), notSet: false } : { text: NOT_SET, notSet: true };
}

export default function KpiTable({
  ltms,
  order,
  onOrder,
}: {
  /** Already in `order` (sortLtms). */
  ltms: KpiLtm[];
  order: LtmOrder;
  onOrder: (order: LtmOrder) => void;
}) {
  /***********************************************************
   * State
   ***********************************************************/

  const [page, setPage] = useState(1);
  const pageSize = pageSizePreference.useValue();

  /***********************************************************
   * Derived data
   ***********************************************************/

  const pageCount = Math.max(1, Math.ceil(ltms.length / pageSize));
  const current = Math.min(Math.max(1, page), pageCount);
  const start = (current - 1) * pageSize;
  const rows = ltms.slice(start, start + pageSize);

  /***********************************************************
   * Handlers
   ***********************************************************/

  function sortBy(column: LtmColumn) {
    onOrder(column === order.column ? { column, dir: order.dir === "asc" ? "desc" : "asc" } : { column, dir: "asc" });
    setPage(1);
  }

  /***********************************************************
   * Render
   ***********************************************************/

  const cell = (c: { text: string; notSet: boolean }) => (
    <span role="cell" title={c.text} className={clsx("truncate", c.notSet ? "italic text-warning" : "text-fg")}>
      {c.text}
    </span>
  );

  return (
    <section className="flex flex-col gap-3 rounded-card border border-border bg-surface p-5">
      <div>
        <h2 className="text-base font-semibold text-fg">Lab Test Means in scope</h2>
        <p className="mt-1 text-sm text-muted">
          {ltms.length} Lab Test Mean{ltms.length === 1 ? "" : "s"} matching the filters — click a column header to
          sort.
        </p>
      </div>

      {ltms.length === 0 ? (
        <p className="px-2 py-4 text-sm text-muted">No Lab Test Mean matches these filters.</p>
      ) : (
        <div className="overflow-x-auto" role="table" aria-label="Lab Test Means in scope">
          <div
            role="row"
            className={clsx(
              ROW_GRID,
              "border-b border-border px-2 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted",
            )}
          >
            {COLUMNS.map((column) => {
              const sorted = column.key === order.column;
              return (
                <span
                  key={column.key}
                  role="columnheader"
                  aria-sort={sorted ? (order.dir === "asc" ? "ascending" : "descending") : "none"}
                >
                  <button
                    type="button"
                    onClick={() => sortBy(column.key)}
                    title={`Sort by ${column.label.toLowerCase()}`}
                    className={clsx(
                      "group inline-flex items-center gap-1 rounded text-left uppercase tracking-[0.08em] hover:text-fg",
                      sorted && "text-fg",
                    )}
                  >
                    {column.label}
                    <span
                      aria-hidden="true"
                      className={clsx(
                        "text-[10px]",
                        sorted ? "text-accent" : "opacity-0 group-hover:opacity-60 group-focus-visible:opacity-60",
                      )}
                    >
                      {sorted ? (order.dir === "asc" ? "▲" : "▼") : "↕"}
                    </span>
                  </button>
                </span>
              );
            })}
          </div>
          <ul role="rowgroup">
            {rows.map((ltm, index) => (
              <li key={ltm.id} role="row" className={clsx(ROW_GRID, "border-b border-surface-2 px-2 py-2 text-sm")}>
                <span role="cell" className="min-w-0 truncate">
                  {ltm.externalId ? (
                    <Link
                      href={`/labtestmean?id=${encodeURIComponent(ltm.externalId)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-accent hover:underline"
                      title={`${ltm.name} (opens in a new tab)`}
                    >
                      {ltm.name}
                    </Link>
                  ) : (
                    <span className="font-medium text-fg" title={ltm.name}>
                      {ltm.name}
                    </span>
                  )}
                </span>
                <span
                  role="cell"
                  className={clsx("truncate font-mono text-xs", ltm.externalId ? "text-muted" : "italic text-warning")}
                >
                  {ltm.externalId ?? NOT_SET}
                </span>
                {cell(joined(ltm.portfolio))}
                <span role="cell" className={clsx("text-center font-semibold", ltm.photos === 0 ? "text-warning" : "text-fg")}>
                  {ltm.photos}
                </span>
                {cell(joined(ltm.manager))}
                {cell(joined(ltm.projectManager))}
                <span role="cell">
                  <span
                    className={clsx(
                      "rounded px-2 py-0.5 text-[11px] font-bold tracking-[0.04em]",
                      ltm.seal === "RELEASE" ? clsx(TINT.successBg, "text-success") : "bg-surface-2 text-muted",
                    )}
                  >
                    {ltm.seal}
                  </span>
                </span>
                <span role="cell" className="flex items-center gap-2">
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
                    <span
                      className={clsx("chart-grow-x block h-full rounded-full", completionBar(ltm.completion))}
                      style={{ width: `${ltm.completion}%`, animationDelay: `${Math.min(index, 24) * 25}ms` }}
                    />
                  </span>
                  <span className="w-10 text-right font-semibold text-fg">{ltm.completion} %</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {ltms.length > 0 ? (
        <TablePagination
          total={ltms.length}
          page={current}
          pageCount={pageCount}
          pageSize={pageSize}
          shown={rows.length}
          onPage={setPage}
        />
      ) : null}
    </section>
  );
}
