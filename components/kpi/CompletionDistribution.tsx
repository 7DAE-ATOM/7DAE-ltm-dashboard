/***********************************************************
 * CompletionDistribution — One card of the KPI page: how many benches of
 * the scope fall in each completion band, as columns.
 *
 *   Completion distribution                         [Filter]
 *   Lab Test Means per completion band
 *     12    215    96     1     0
 *     ▆     ██     ▅     ▁     ▁         ← each column is a button
 *   0–24 % 25–49 % 50–74 % 75–89 % 90–100 %
 *   ■ Below 50 % — needs attention  ■ 50 – 89 %  ■ 90 % and above — complete
 *
 * File structure:
 *
 *   1. IMPORTS — clsx, COMPLETION_BAND_FLOOR and the Slice type, the tints
 *      and completionBar().
 *   2. CONSTANTS — LEGEND.
 *   3. COMPONENT FUNCTION —
 *      a. Derived data — the largest count (column scale), the selection,
 *         the note.
 *      b. JSX return — heading and "Filter" tag; the columns; the legend;
 *         the note while filtering.
 *
 * EVERY BAND IS SHOWN, empty ones too (`completionDistribution`), so the
 * five columns never move. A column's colour is the table's completion bar
 * at the band's lower bound (`completionBar`): below 50 % warning, 50–89 %
 * light accent, 90 % and above accent.
 *
 * A FILTER, like the filtering charts: a column is a button (`aria-pressed`)
 * that adds its band to the "Completion" filter, or removes it. The card
 * counts WITHOUT its own filter: selected bands get a ring, the others
 * fade, at their true size.
 *
 * COLOUR IS NEVER THE ONLY CUE: every column carries its count and its
 * band; the legend only says what the colours mean.
 *
 * Motion: columns grow up (`.chart-grow-y`), off under reduced motion.
 *
 * Used on: components/kpi/KpiClient.tsx
 ***********************************************************/

import clsx from "clsx";

import { COMPLETION_BAND_FLOOR, type Slice } from "@/lib/kpi/kpiStats";
import { TINT, completionBar } from "./kpiStyle";

const LEGEND = [
  { label: "Below 50 % — needs attention", color: completionBar(0) },
  { label: "50 – 89 %", color: completionBar(50) },
  { label: "90 % and above — complete", color: completionBar(90) },
];

export default function CompletionDistribution({
  slices,
  onPick,
}: {
  /** The five bands, in order. */
  slices: Slice[];
  /** Toggles a band in the Completion filter. */
  onPick: (band: string) => void;
}) {
  /***********************************************************
   * Derived data
   ***********************************************************/

  const max = Math.max(1, ...slices.map((s) => s.count));
  const selected = slices.filter((s) => s.selected).map((s) => s.value);
  const anySelected = selected.length > 0;
  const note = anySelected ? `Filtering on ${selected.join(", ")} — faded bands are outside the filter.` : null;

  /***********************************************************
   * Render
   ***********************************************************/

  return (
    <section className="flex min-h-[19rem] flex-col gap-3 rounded-card border border-border bg-surface p-5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-fg">Completion distribution</h3>
          <p className="mt-0.5 text-xs text-muted">Lab Test Means per completion band</p>
        </div>
        <span
          className={clsx(
            "shrink-0 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold text-accent",
            TINT.accentBg,
          )}
        >
          Filter
        </span>
      </div>

      <div className="grid grid-cols-5 gap-2">
        {slices.map((s, index) => (
          <button
            key={s.value}
            type="button"
            aria-pressed={s.selected}
            title={`${s.count} Lab Test Means — ${s.value}${s.selected ? " (click to remove the filter)" : " (click to filter)"}`}
            onClick={() => onPick(s.value)}
            className={clsx(
              "flex min-w-0 flex-col items-center gap-1.5 rounded-md border px-1 py-2 hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
              s.selected ? clsx("border-accent", TINT.accentBg) : "border-transparent",
              anySelected && !s.selected && "opacity-50",
            )}
          >
            <span className={clsx("text-sm text-fg", s.selected ? "font-bold" : "font-semibold")}>{s.count}</span>
            <span aria-hidden="true" className="flex h-40 w-full items-end border-b border-border">
              <span
                className={clsx(
                  "chart-grow-y block w-full rounded-t-sm",
                  completionBar(COMPLETION_BAND_FLOOR[index] ?? 0),
                )}
                // A band with no bench still shows a sliver, as in the mock-up.
                style={{ height: `${Math.max(2, Math.round((s.count / max) * 100))}%`, animationDelay: `${index * 40}ms` }}
              />
            </span>
            <span className="text-center text-[11px] leading-tight text-muted">{s.value}</span>
          </button>
        ))}
      </div>

      <ul className="mt-auto flex flex-col gap-1 text-xs text-muted">
        {LEGEND.map((item) => (
          <li key={item.label} className="flex items-center gap-2">
            <span aria-hidden="true" className={clsx("h-2.5 w-2.5 shrink-0 rounded-sm", item.color)} />
            {item.label}
          </li>
        ))}
      </ul>

      {note ? <p className="text-xs text-muted">{note}</p> : null}
    </section>
  );
}
