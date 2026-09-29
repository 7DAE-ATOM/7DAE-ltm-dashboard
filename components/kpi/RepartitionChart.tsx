/***********************************************************
 * RepartitionChart — One card of the KPI page: how the benches of the scope
 * split over one field, as a donut or as bars.
 *
 *   Quality Seal                          [Filter]
 *    ╭───╮   ■ RELEASE   104  58 %          ← a button when the chart filters
 *   │ 180 │  ■ DRAFT      76  42 %
 *    ╰───╯
 *
 * File structure:
 *
 *   1. IMPORTS — clsx, NOT_SET and the Slice type, the colours.
 *   2. CONSTANTS — ROW (the shared row look).
 *   3. FUNCTIONS — gradient(): the donut's conic-gradient.
 *   4. COMPONENT FUNCTION —
 *      a. Derived data — the largest count (bar scale), whether something
 *         is selected, the note (only while filtering).
 *      b. JSX return — heading and "Filter" tag; the donut and its legend, or the
 *         bars; the note when a value is selected.
 *
 * CLICKABLE ONLY WITH `onPick`. A chart backed by a filter passes it: each
 * slice is then a button (`aria-pressed`) that adds its value to the filter,
 * or removes it when already selected, and the card is tagged "Filter".
 * Without it (configuration management plan, access control — spec answer
 * 1) the rows are plain text and the card carries no tag.
 *
 * THE SELECTION IS SHOWN, NOT COUNTED AWAY. The slices come from
 * `repartition()`, which counts WITHOUT this chart's own filter: selected
 * slices keep their colour and a ring, the others fade — at their true size.
 *
 * COLOUR IS NEVER THE ONLY CUE: every slice is named, counted and given its
 * share in the legend; the donut itself is decorative (`aria-hidden`).
 *
 * Motion: bars grow in (`.chart-grow-x`), off under reduced motion.
 *
 * Ported from 7DAE-atom-cockpit; tints via TINT (kpiStyle.ts), since
 * `bg-accent/10` generates nothing in this app.
 *
 * Used on: components/kpi/KpiClient.tsx
 ***********************************************************/

import clsx from "clsx";

import { NOT_SET, type LtmField, type Slice } from "@/lib/kpi/kpiStats";
import { TINT, faded, sliceColor } from "./kpiStyle";

const ROW = "flex w-full items-center gap-2 rounded-md border px-2 py-1.5 text-left text-[13px]";

/** Slices → one conic-gradient; a slice outside the selection is faded. */
function gradient(field: LtmField, slices: Slice[], total: number, anySelected: boolean): string {
  if (total === 0) return "var(--color-surface-2)";
  let at = 0;
  const stops = slices.map((s) => {
    const color = sliceColor(field, s.value);
    const from = at;
    at += (s.count / total) * 100;
    return `${anySelected && !s.selected ? faded(color) : color} ${from}% ${at}%`;
  });
  return `conic-gradient(${stops.join(", ")})`;
}

export default function RepartitionChart({
  title,
  field,
  kind,
  total,
  slices,
  onPick,
}: {
  title: string;
  field: LtmField;
  kind: "donut" | "bars";
  /** Benches counted (the scope without this chart's own filter). */
  total: number;
  slices: Slice[];
  /** Makes the slices filter buttons. Omitted: plain rows. */
  onPick?: (value: string) => void;
}) {
  /***********************************************************
   * Derived data
   ***********************************************************/

  const max = Math.max(1, ...slices.map((s) => s.count));
  const selected = slices.filter((s) => s.selected).map((s) => s.value);
  const anySelected = selected.length > 0;
  const note = onPick && anySelected
    ? `Filtering on ${selected.join(", ")} — faded parts are outside the filter.`
    : null;

  /***********************************************************
   * Render
   ***********************************************************/

  const rows = slices.map((s, index) => {
    const color = sliceColor(field, s.value);
    const dim = anySelected && !s.selected;
    const name = (
      <span
        className={clsx(
          "min-w-0 flex-1 truncate",
          s.value === NOT_SET ? "italic text-warning" : "text-fg",
          s.selected && "font-semibold",
        )}
        title={s.value}
      >
        {s.value}
      </span>
    );
    const figures = (
      <>
        <span className="w-10 text-right font-semibold text-fg">{s.count}</span>
        <span className="w-10 text-right text-muted">{s.pct} %</span>
      </>
    );
    const body =
      kind === "donut" ? (
        <>
          <span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: dim ? faded(color) : color }} />
          {name}
          {figures}
        </>
      ) : (
        <>
          <span className="w-32 shrink-0">{name}</span>
          <span aria-hidden="true" className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-2">
            <span
              className="chart-grow-x block h-full rounded-full"
              style={{
                width: `${Math.round((s.count / max) * 100)}%`,
                background: dim ? faded(color) : color,
                animationDelay: `${index * 40}ms`,
              }}
            />
          </span>
          {figures}
        </>
      );
    const look = clsx(ROW, s.selected ? clsx("border-accent", TINT.accentBg) : "border-transparent", dim && "opacity-70");

    return onPick ? (
      <button
        key={s.value}
        type="button"
        aria-pressed={s.selected}
        title={`${s.count} Lab Test Means — ${s.value}${s.selected ? " (click to remove the filter)" : " (click to filter)"}`}
        onClick={() => onPick(s.value)}
        className={clsx(look, "hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent")}
      >
        {body}
      </button>
    ) : (
      <div key={s.value} className={look}>
        {body}
      </div>
    );
  });

  return (
    <section className="flex min-h-[19rem] flex-col gap-3 rounded-card border border-border bg-surface p-5">
      <div className="flex items-start justify-between gap-2">
        <h3 className="min-w-0 text-base font-semibold text-fg">{title}</h3>
        {onPick ? (
          <span
            className={clsx(
              "shrink-0 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold text-accent",
              TINT.accentBg,
            )}
          >
            Filter
          </span>
        ) : null}
      </div>

      {slices.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted">No Lab Test Mean in this scope.</p>
      ) : kind === "donut" ? (
        <div className="flex items-center gap-4">
          <div
            aria-hidden="true"
            className="relative h-32 w-32 shrink-0 rounded-full"
            style={{ background: gradient(field, slices, total, anySelected) }}
          >
            <div className="absolute inset-[22px] flex flex-col items-center justify-center rounded-full bg-surface">
              <span className="text-xl font-bold text-fg">{total}</span>
              <span className="text-[11px] text-muted">LTMs</span>
            </div>
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-1">{rows}</div>
        </div>
      ) : (
        <div className="flex flex-col gap-1">{rows}</div>
      )}

      {note ? <p className="mt-auto text-xs text-muted">{note}</p> : null}
    </section>
  );
}
