"use client";

/***********************************************************
 * KpiFilterBar — The nine filters of the KPI page, each able to
 * hold several values.
 *
 *   FILTERS                                                         Reset all
 *   [Portfolio ▾] [Country ▾] [LTM Type (2) ▾] [Shared ▾] [Aircraft Program ▾]
 *   [ATA ▾] [Export control level ▾] [Complexity ▾] [Quality seal ▾]
 *   Active: (LTM Type: SIB ×) (LTM Type: FIB ×) (Quality seal: DRAFT ×)
 *
 * File structure:
 *
 *   1. IMPORTS — clsx, the KpiLtm type, the axes and their options, TINT.
 *   2. COMPONENT FUNCTION —
 *      a. Derived data — the chips, one per selected value.
 *      b. JSX return — header with Reset all, the grid of pickers, the chips.
 *
 * NOT THE CATALOGUE'S FILTER PANEL: those filters are shared by the
 * catalogue, the map and the dependency view and kept in sessionStorage;
 * these live in the KPI page's address and touch nothing else. A select is an "ADD" picker — picking a value adds it and the select goes
 * back to its placeholder; values already chosen are not offered again; the
 * CHIPS are the state, each removable on its own. Several values of one
 * filter combine with OR, filters with AND (`ltmInScope`).
 *
 * The chart clicks (Quality Seal, Type, Complexity, Export Control) add to
 * these same filters, so their choices show here as chips too.
 *
 * OPTIONS COME FROM THE DATA, in each axis's display order (known values
 * first, "Not set" last).
 *
 * Fully controlled: `filters` in, `onAdd` / `onRemove` / `onReset` out. The
 * values live in the URL, owned by KpiClient.
 *
 * Ported from 7DAE-atom-cockpit (`LtmFilterBar.tsx`).
 *
 * Used on: components/kpi/KpiClient.tsx
 ***********************************************************/

import clsx from "clsx";

import type { KpiLtm } from "@/lib/kpi/kpiLabTestMeans";
import { LTM_AXES, ltmAxisOptions, type LtmAxisKey, type LtmFilters } from "@/lib/kpi/kpiStats";
import { TINT } from "./kpiStyle";

export default function KpiFilterBar({
  ltms,
  filters,
  onAdd,
  onRemove,
  onReset,
  disabled,
}: {
  /** Every loaded bench — the source of the options. */
  ltms: KpiLtm[];
  /** Only the values that exist in the data. */
  filters: LtmFilters;
  onAdd: (key: LtmAxisKey, value: string) => void;
  onRemove: (key: LtmAxisKey, value: string) => void;
  onReset: () => void;
  /** True while loading: the options are not known yet. */
  disabled?: boolean;
}) {
  /***********************************************************
   * Derived data
   ***********************************************************/

  const chips = LTM_AXES.flatMap((axis) => (filters[axis.key] ?? []).map((value) => ({ axis, value })));

  /***********************************************************
   * Render
   ***********************************************************/

  return (
    <section aria-label="Filters" className="flex flex-col gap-3 rounded-card border border-border bg-surface px-5 py-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Filters</h2>
        <button
          type="button"
          onClick={onReset}
          disabled={disabled || chips.length === 0}
          className="rounded px-1 py-1 text-sm font-semibold text-accent hover:underline disabled:cursor-default disabled:text-muted disabled:no-underline"
        >
          Reset all
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {LTM_AXES.map((axis) => {
          const selected = filters[axis.key] ?? [];
          const remaining = ltmAxisOptions(ltms, axis.key).filter((v) => !selected.includes(v));
          const active = selected.length > 0;
          return (
            <label key={axis.key} className="flex min-w-0 flex-col gap-1 text-xs font-semibold text-muted">
              <span>
                {axis.label}
                {active ? <span className="text-accent"> ({selected.length})</span> : null}
              </span>
              <select
                // Always back on the placeholder: the select adds, the chips hold.
                value=""
                disabled={disabled || remaining.length === 0}
                onChange={(e) => {
                  if (e.target.value) onAdd(axis.key, e.target.value);
                }}
                className={clsx(
                  "w-full rounded-md border px-2 py-2 text-sm font-normal text-fg disabled:opacity-60",
                  active ? clsx("border-accent", TINT.accentBg) : "border-border bg-surface",
                )}
              >
                <option value="">{remaining.length === 0 && active ? "All selected" : active ? "Add…" : "All"}</option>
                {remaining.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
          );
        })}
      </div>

      {chips.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted">Active:</span>
          {chips.map(({ axis, value }) => (
            <button
              key={`${axis.key}:${value}`}
              type="button"
              onClick={() => onRemove(axis.key, value)}
              aria-label={`Remove filter ${axis.label}: ${value}`}
              className={clsx(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm text-accent",
                TINT.accentBorder,
                TINT.accentBg,
                TINT.accentBgHover,
              )}
            >
              {axis.label}: {value}
              <span aria-hidden="true">×</span>
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}
