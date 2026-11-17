/***********************************************************
 * lifecycleDate — Is a lifecycle step of a Lab Test Mean REACHED, only
 * PLANNED, or not set? The four LeanIX dates (`kickoff`, `eisdateyear`,
 * `mothballed`, `dismantled`) may lie in the future: a dismantling planned
 * for 2030 must not make the bench "Dismantled" today.
 *
 * File structure:
 *
 *   1. TYPES — LifecycleStepState.
 *   2. FUNCTIONS —
 *      a. lifecycleDateStart() — the first day the raw date stands for.
 *      b. lifecycleStepState() — that day compared with today.
 *
 * THE DATE IS READ AT ITS OWN PRECISION. A step is reached from the FIRST
 * DAY of the period the value names:
 *   - "2027"        → 1 January 2027;
 *   - "2027-03"     → 1 March 2027;
 *   - "2027-03-15…" → 15 March 2027 (any time part is ignored);
 *   - anything else `Date` can read → that day.
 * So `eisdateyear: "2026"` counts as in service for the whole of 2026.
 *
 * LOCAL TIME, PARSED BY HAND. `new Date("2026-11-01")` is UTC midnight,
 * which is still 31 October west of Greenwich; the ISO shapes are split by
 * hand into a local date so "today" and the step are compared on the same
 * calendar. Comparison is by day: hours never matter.
 *
 * AN UNREADABLE DATE COUNTS AS REACHED — the behaviour before dates were
 * compared, so a value we cannot read never silently changes a status.
 * The adapter warns about it in the console.
 *
 * Spec: `_specification/vibe coding/statut-dates-futures.md`.
 *
 * Used on: lib/labtestmean-adapter.ts, components/detail/LifecycleSection.tsx,
 * components/pdf/BenchDetailPage.tsx
 ***********************************************************/

/***********************************************************
 * Types
 ***********************************************************/

/** reached: on or before today · planned: after today · unset: no date. */
export type LifecycleStepState = "reached" | "planned" | "unset";

/***********************************************************
 * Functions
 ***********************************************************/

const YEAR = /^(\d{4})$/;
const YEAR_MONTH = /^(\d{4})-(\d{1,2})$/;
const ISO_DAY = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T\s].*)?$/;

/**
 * The first day (local midnight) the raw date stands for; null when blank;
 * "unreadable" when no known shape matches.
 */
export function lifecycleDateStart(raw: string | null | undefined): Date | null | "unreadable" {
  if (typeof raw !== "string") return null;
  const s = raw.trim();
  if (s === "") return null;

  let m = YEAR.exec(s);
  if (m) return new Date(Number(m[1]), 0, 1);

  m = YEAR_MONTH.exec(s);
  if (m) {
    const month = Number(m[2]);
    return month >= 1 && month <= 12 ? new Date(Number(m[1]), month - 1, 1) : "unreadable";
  }

  m = ISO_DAY.exec(s);
  if (m) {
    const month = Number(m[2]);
    const day = Number(m[3]);
    return month >= 1 && month <= 12 && day >= 1 && day <= 31
      ? new Date(Number(m[1]), month - 1, day)
      : "unreadable";
  }

  const parsed = new Date(s);
  if (Number.isNaN(parsed.getTime())) return "unreadable";
  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
}

/** Reached when its first day is today or earlier; planned when later. */
export function lifecycleStepState(
  raw: string | null | undefined,
  today: Date = new Date(),
): LifecycleStepState {
  const start = lifecycleDateStart(raw);
  if (start === null) return "unset";
  if (start === "unreadable") return "reached";
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return start.getTime() <= todayStart.getTime() ? "reached" : "planned";
}
