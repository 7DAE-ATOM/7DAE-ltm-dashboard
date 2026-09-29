/***********************************************************
 * PhotoCoverage — The KPI page's full-width Photos card: how many
 * benches of the scope are illustrated, and how well.
 *
 *   [📷] LTM Photos                 ┌ No photo ┐┌ 1 photo ┐┌ 2–4 ┐┌ 5+ ┐
 *        66 %  with at least one    │   61     ││   32    ││  50 ││ 37 │
 *        119 of 180 · 412 photos…   │ ▇▇▇ 34 % ││ ▇ 18 %  ││ …   ││ …  │
 *                                   └──────────┘└─────────┘└─────┘└────┘
 *
 * File structure:
 *
 *   1. IMPORTS — clsx, the camera icon, the PhotoSummary type.
 *   2. CONSTANTS — BAR (bar colour per band).
 *   3. COMPONENT FUNCTION —
 *      a. Derived data — the share with a photo, the average per bench.
 *      b. JSX return — heading and headline on the left, four band tiles.
 *
 * A PHOTO is a document of type "image" or "photo" (kpiLabTestMeans.ts —
 * the rule the catalogue applies). The bands are 0 / 1 / 2–4 / 5+ (spec answer 4); "No
 * photo" is in the warning colour: it is the gap to fill.
 *
 * NOT A FILTER (spec answer 1): the tiles are not buttons and set no
 * filter. The table below lists every bench with its number of photos, and
 * sorts on it — that is where to find the ones to illustrate.
 *
 * Counts the SCOPE (every filter applied).
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

export default function PhotoCoverage({ summary }: { summary: PhotoSummary }) {
  /***********************************************************
   * Derived data
   ***********************************************************/

  const share = summary.total ? Math.round((summary.illustrated / summary.total) * 100) : 0;
  const perBench = summary.illustrated ? (summary.photos / summary.illustrated).toFixed(1) : "0";
  const max = Math.max(1, ...summary.bands.map((b) => b.count));

  /***********************************************************
   * Render
   ***********************************************************/

  return (
    <section
      aria-label="LTM Photos"
      className="grid gap-6 rounded-card border border-border bg-surface p-5 lg:grid-cols-[19rem_minmax(0,1fr)] lg:items-center"
    >
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-3">
          <span aria-hidden="true" className={clsx("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-accent", TINT.accentBg)}>
            <CameraIcon size={20} />
          </span>
          <h3 className="min-w-0 flex-1 text-base font-semibold text-fg">LTM Photos</h3>
        </div>
        <p className="mt-2 flex items-baseline gap-2">
          <span className="text-4xl font-bold text-fg">{share} %</span>
          <span className="text-sm text-muted">with at least one photo</span>
        </p>
        <p className="text-sm text-muted">
          {summary.illustrated} of {summary.total} Lab Test Means · {summary.photos} photos in all · {perBench} per
          illustrated bench
        </p>
      </div>

      <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {summary.bands.map((b, index) => (
          <li key={b.band} className="flex flex-col gap-1.5 rounded-lg border border-border px-4 py-3">
            <span className={clsx("text-[13px] font-semibold", index === 0 ? "text-warning" : "text-muted")}>{b.band}</span>
            <span className="text-2xl font-bold text-fg">{b.count}</span>
            <span aria-hidden="true" className="h-2 overflow-hidden rounded-full bg-surface-2">
              <span
                className={clsx("chart-grow-x block h-full rounded-full", BAR[index])}
                style={{ width: `${Math.round((b.count / max) * 100)}%` }}
              />
            </span>
            <span className="text-xs text-muted">{b.pct} % of the scope</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
