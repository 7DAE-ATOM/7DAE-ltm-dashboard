/***********************************************************
 * PhotoCoverage — The KPI page's wide Photos card (two columns): how many
 * benches of the scope are illustrated, and how well.
 *
 *   [📷] LTM Photos    34 % with at least one photo    190 photos in all   [Filter]
 *   ┌ No photo ──────┐┌ 1 photo ───────┐┌ 2–4 photos ────┐┌ 5+ photos ─────┐
 *   │ 214  ▇▇▇▇ 66 % ││ 9    ▏    3 %  ││ 34   ▇   10 %  ││ 67   ▇▇  21 %  │
 *   └────────────────┘└────────────────┘└────────────────┘└────────────────┘
 *
 * File structure:
 *
 *   1. IMPORTS — clsx, the camera icon, the PhotoSummary type.
 *   2. CONSTANTS — BAR (bar colour per band).
 *   3. COMPONENT FUNCTION —
 *      a. Derived data — the share with a photo, the average per bench,
 *         the selected bands, the note.
 *      b. JSX return — one header row (title, share, photo count, "Filter"
 *         tag), the note while filtering, then the four band buttons sharing
 *         the full width.
 *
 * A PHOTO is a document of type "image" or "photo" (kpiLabTestMeans.ts —
 * the rule the catalogue applies). The bands are 0 / 1 / 2–4 / 5+ (spec answer 4); "No
 * photo" is in the warning colour: it is the gap to fill.
 *
 * THE TILES ARE FILTERS, like the filtering charts: each band is a button
 * (`aria-pressed`) that adds it to the "Photos" filter, or removes it when
 * already selected. Selected bands get a ring; the others fade, at their
 * true size.
 *
 * Counts the scope WITHOUT the Photos filter (`photoSummary`), so choosing
 * "No photo" does not collapse the other bands to 0.
 *
 * Ported from 7DAE-atom-cockpit.
 *
 * Used on: components/kpi/KpiClient.tsx
 ***********************************************************/

import clsx from "clsx";

import CameraIcon from "@/components/icons/CameraIcon";
import type { PhotoSummary } from "@/lib/kpi/kpiStats";
import { TINT } from "./kpiStyle";

/** Bar colour per band: the gap in warning, then one accent in three strengths. */
const BAR = ["bg-warning", TINT.accentBar45, TINT.accentBar70, "bg-accent"];

export default function PhotoCoverage({
  summary,
  onPick,
  className,
}: {
  summary: PhotoSummary;
  /** Placement in the page's card grid (it spans two columns there). */
  className?: string;
  /** Toggles a band in the Photos filter. */
  onPick: (band: string) => void;
}) {
  /***********************************************************
   * Derived data
   ***********************************************************/

  const share = summary.total ? Math.round((summary.illustrated / summary.total) * 100) : 0;
  const perBench = summary.illustrated ? (summary.photos / summary.illustrated).toFixed(1) : "0";
  const max = Math.max(1, ...summary.bands.map((b) => b.count));
  const selected = summary.bands.filter((b) => b.selected).map((b) => b.band);
  const anySelected = selected.length > 0;
  const note = anySelected ? `Filtering on ${selected.join(", ")} — faded bands are outside the filter.` : null;

  /***********************************************************
   * Render
   ***********************************************************/

  return (
    <section
      aria-label="LTM Photos"
      className={clsx("flex flex-col gap-5 rounded-card border border-border bg-surface p-5", className)}
    >
      <div className="flex flex-wrap items-center gap-x-10 gap-y-3">
        <div className="flex items-center gap-3">
          <span aria-hidden="true" className={clsx("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-accent", TINT.accentBg)}>
            <CameraIcon size={20} />
          </span>
          <h3 className="text-base font-semibold text-fg">LTM Photos</h3>
        </div>
        <p className="flex items-baseline gap-2">
          <span className="text-4xl font-bold text-fg">{share} %</span>
          <span className="text-sm text-muted">with at least one photo</span>
        </p>
        <p className="flex items-baseline gap-2" title={`${summary.illustrated} of ${summary.total} Lab Test Means illustrated · ${perBench} per illustrated bench`}>
          <span className="text-4xl font-bold text-fg">{summary.photos}</span>
          <span className="text-sm text-muted">photos in all</span>
        </p>
        <span
          className={clsx(
            "ml-auto shrink-0 self-start whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold text-accent",
            TINT.accentBg,
          )}
        >
          Filter
        </span>
      </div>
      {note ? <p className="-mt-2 text-xs text-muted">{note}</p> : null}

      {/* The four bands share the full width, centred in the remaining height. */}
      <ul className="my-auto grid grid-cols-2 gap-3 md:grid-cols-4">
        {summary.bands.map((b, index) => (
          <li key={b.band}>
            <button
              type="button"
              aria-pressed={b.selected}
              title={`${b.count} Lab Test Means — ${b.band}${b.selected ? " (click to remove the filter)" : " (click to filter)"}`}
              onClick={() => onPick(b.band)}
              className={clsx(
                "flex w-full flex-col gap-1.5 rounded-lg border px-4 py-3 text-left hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                b.selected ? clsx("border-accent", TINT.accentBg) : "border-border",
                anySelected && !b.selected && "opacity-50",
              )}
            >
              <span
                className={clsx(
                  "text-[13px]",
                  index === 0 ? "text-warning" : "text-muted",
                  b.selected ? "font-bold" : "font-semibold",
                )}
              >
                {b.band}
              </span>
              <span className="text-2xl font-bold text-fg">{b.count}</span>
              <span aria-hidden="true" className="h-2 overflow-hidden rounded-full bg-surface-2">
                <span
                  className={clsx("chart-grow-x block h-full rounded-full", BAR[index])}
                  style={{ width: `${Math.round((b.count / max) * 100)}%` }}
                />
              </span>
              <span className="text-xs text-muted">{b.pct} % of the scope</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
