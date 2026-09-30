/***********************************************************
 * kpiStyle — The colours of the KPI page: every chart slice as a CSS
 * colour built from theme tokens, and the few translucent tints the page
 * uses, as Tailwind classes that actually exist.
 *
 * File structure:
 *
 *   1. IMPORTS — NOT_SET, the field type.
 *   2. FUNCTIONS — token(): a token, optionally see-through.
 *   3. CONSTANTS — COLORS (field → value → colour), NOT_SET_COLOR, OTHER,
 *      TINT (translucent background / border classes).
 *   4. FUNCTIONS — completionBar() (table and Completion card), sliceColor(),
 *      faded().
 *
 * WHY `color-mix` AND NOT `bg-accent/10`. In this app the Tailwind colours
 * are bare `var(--color-…)` strings, which Tailwind cannot split into
 * channels: an opacity modifier such as `bg-accent/10` SILENTLY GENERATES
 * NOTHING. So every translucent tint here is an arbitrary value written in
 * full — `bg-[color-mix(in_srgb,var(--color-accent)_10%,transparent)]` —
 * spelled out literally in TINT so Tailwind's scanner sees it.
 *
 * WHY STRINGS FOR THE SLICES. A donut is one `conic-gradient` computed from
 * the data: it needs colour VALUES. Bars and swatches use the same values,
 * so a slice has one colour everywhere. Each is `var(--color-…)`, lightened
 * with `color-mix`, so the charts follow the light/dark theme and no literal
 * colour sits in a component (tokens live in app/globals.css only).
 *
 * WHAT THE COLOURS SAY. LTM types are categorical (`--color-ltm-*`).
 * Elsewhere the semantic tokens carry meaning: RELEASE is success; a missing
 * plan or no access control is a warning; military export control is
 * danger; complexity is one accent in three strengths. "Not set" is a faint
 * grey. Colour is never the only cue — every slice is named and counted.
 *
 * Ported from 7DAE-atom-cockpit (`components/statistics/ltmStyle.ts`).
 *
 * Used on: components/kpi/*
 ***********************************************************/

import { NOT_SET, type LtmField } from "@/lib/kpi/kpiStats";

function token(name: string, percent?: number): string {
  return percent === undefined
    ? `var(--color-${name})`
    : `color-mix(in srgb, var(--color-${name}) ${percent}%, transparent)`;
}

const COLORS: Partial<Record<LtmField, Record<string, string>>> = {
  seal: { RELEASE: token("success"), DRAFT: token("muted", 70) },
  cmp: { Yes: token("accent"), No: token("warning") },
  access: { Yes: token("accent"), No: token("warning") },
  category: {
    SIMULATOR: token("ltm-simulator"),
    SIB: token("ltm-sib"),
    FIB: token("ltm-fib"),
    "R&T": token("ltm-rt"),
    "SHARED RESOURCE": token("ltm-shared"),
  },
  complexity: { Simple: token("accent", 35), Medium: token("accent", 65), Complex: token("accent") },
  ecLevel: {
    "Not Listed": token("accent", 35),
    "Dual Use": token("warning"),
    Military: token("danger", 75),
    Both: token("danger"),
  },
};

const NOT_SET_COLOR = token("muted", 30);
/** A value LeanIX sent that no map knows. */
const OTHER = token("accent", 50);

/** Translucent tints — see the header for why they are spelled out. */
export const TINT = {
  accentBg: "bg-[color-mix(in_srgb,var(--color-accent)_10%,transparent)]",
  accentBgHover: "hover:bg-[color-mix(in_srgb,var(--color-accent)_20%,transparent)]",
  accentBorder: "border-[color-mix(in_srgb,var(--color-accent)_40%,transparent)]",
  successBg: "bg-[color-mix(in_srgb,var(--color-success)_15%,transparent)]",
  /** Photo band bars: one accent in three strengths. */
  accentBar45: "bg-[color-mix(in_srgb,var(--color-accent)_45%,transparent)]",
  accentBar70: "bg-[color-mix(in_srgb,var(--color-accent)_70%,transparent)]",
} as const;

/** Completion bar colour: < 50 % warning, 50–89 % light accent, ≥ 90 % accent. */
export function completionBar(completion: number): string {
  if (completion < 50) return "bg-warning";
  if (completion < 90) return TINT.accentBar45;
  return "bg-accent";
}

export function sliceColor(field: LtmField, value: string): string {
  if (value === NOT_SET) return NOT_SET_COLOR;
  return COLORS[field]?.[value] ?? OTHER;
}

/** The same colour, faded — a slice outside the current selection. */
export function faded(color: string): string {
  return `color-mix(in srgb, ${color} 30%, transparent)`;
}
