/***********************************************************
 * kpiStats — Every figure of the KPI page, as pure functions of the loaded
 * list and the current filters.
 *
 * File structure:
 *
 *   1. IMPORTS — the KpiLtm type and the display orders.
 *   2. TYPES — LtmAxisKey, LtmField, LtmAxis, LtmFilters, Slice,
 *      LtmColumn, LtmOrder, PhotoSummary.
 *   3. CONSTANTS — NOT_SET, LTM_AXES, PHOTO_BANDS, LTM_COLUMNS,
 *      DEFAULT_LTM_ORDER.
 *   4. FUNCTIONS —
 *      a. ltmValues(), ltmInScope(), ltmAxisOptions() — axes and filtering.
 *      b. repartition() — one chart's slices.
 *      c. photoBand(), photoSummary() — the Photos card.
 *      d. parseLtmOrder(), serializeLtmOrder(), sortLtms() — the table.
 *
 * NO REACT, NO NETWORK: every figure is computed in the browser from the
 * list `kpiLabTestMeans.ts` loaded once.
 *
 * FILTER SEMANTICS: OR within one filter, AND across filters; a bench with
 * several portfolios, programs or ATA chapters stays when it carries AT
 * LEAST ONE selected value; "Not set" is a value of its own, filterable. The
 * catalogue's own filters (lib/labtestmeans.ts) are a different model —
 * sentinels, a search box — and are not reused here.
 *
 * A CHART COUNTS WITHOUT ITS OWN FILTER (`repartition`, spec req. 20). The
 * Quality Seal donut, with "DRAFT" selected, still shows the RELEASE share
 * at its true size — faded — instead of collapsing to a single full ring.
 * The information-only charts (CMP, access control) have no filter, so they
 * simply count the scope.
 *
 * THE TABLE SORTS ON ANY COLUMN (`sortLtms`), completion ascending by
 * default; "Not set" always last whatever the direction; ties fall back to
 * the name.
 *
 * URL PARAMETERS are the axes' `param` names (`portfolio`, `type`, `ec`…),
 * plus `order` for the table — the page is dedicated, no prefix needed.
 *
 * Ported from 7DAE-atom-cockpit (`components/statistics/ltmStats.ts`).
 *
 * Used on: components/kpi/KpiClient.tsx and its sections
 ***********************************************************/

import {
  COMPLEXITY_ORDER,
  EXPORT_CONTROL_ORDER,
  SEAL_ORDER,
  TYPE_ORDER,
  YES_NO_ORDER,
  type KpiLtm,
} from "./kpiLabTestMeans";

/***********************************************************
 * Types
 ***********************************************************/

export type LtmAxisKey =
  | "portfolio"
  | "country"
  | "category"
  | "shared"
  | "program"
  | "ata"
  | "ecLevel"
  | "complexity"
  | "seal";

/** A field a chart can count: every axis, plus the two information-only ones. */
export type LtmField = LtmAxisKey | "cmp" | "access";

export type LtmAxis = {
  key: LtmAxisKey;
  label: string;
  /** Name in the address (service 09). */
  param: string;
  /** Known values in display order; others follow alphabetically. */
  order?: string[];
};

/** Axis → selected values. Absent or empty = "All". */
export type LtmFilters = Partial<Record<LtmAxisKey, string[]>>;

/** One slice of a chart. */
export type Slice = { value: string; count: number; pct: number; selected: boolean };

export type LtmColumn =
  | "name"
  | "externalId"
  | "portfolio"
  | "photos"
  | "manager"
  | "projectManager"
  | "seal"
  | "completion";
export type LtmSortDir = "asc" | "desc";
export type LtmOrder = { column: LtmColumn; dir: LtmSortDir };

export type PhotoSummary = {
  /** Benches in the scope. */
  total: number;
  /** Benches with at least one photo. */
  illustrated: number;
  /** Photos across the scope. */
  photos: number;
  /** Benches per band, in PHOTO_BANDS order. */
  bands: { band: string; count: number; pct: number }[];
};

/***********************************************************
 * Constants
 ***********************************************************/

/** Shown for any empty value. A gap is data too. */
export const NOT_SET = "Not set";

/** The filter bar, in the spec's order. */
export const LTM_AXES: LtmAxis[] = [
  { key: "portfolio", label: "Portfolio", param: "portfolio" },
  { key: "country", label: "Country", param: "country" },
  { key: "category", label: "LTM Type", param: "type", order: TYPE_ORDER },
  { key: "shared", label: "Shared", param: "shared", order: YES_NO_ORDER },
  { key: "program", label: "Aircraft Program", param: "program" },
  { key: "ata", label: "ATA", param: "ata" },
  { key: "ecLevel", label: "Export control level", param: "ec", order: EXPORT_CONTROL_ORDER },
  { key: "complexity", label: "Complexity", param: "complexity", order: COMPLEXITY_ORDER },
  { key: "seal", label: "Quality seal", param: "seal", order: SEAL_ORDER },
];

const FIELD_ORDER: Partial<Record<LtmField, string[]>> = {
  ...Object.fromEntries(LTM_AXES.filter((a) => a.order).map((a) => [a.key, a.order])),
  cmp: YES_NO_ORDER,
  access: YES_NO_ORDER,
};

export const PHOTO_BANDS = ["No photo", "1 photo", "2–4 photos", "5+ photos"] as const;

export const LTM_COLUMNS: LtmColumn[] = [
  "name",
  "externalId",
  "portfolio",
  "photos",
  "manager",
  "projectManager",
  "seal",
  "completion",
];

/** Least complete first: where completing a fact sheet pays most. */
export const DEFAULT_LTM_ORDER: LtmOrder = { column: "completion", dir: "asc" };

const COLLATOR = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });

/***********************************************************
 * Functions — axes and filtering
 ***********************************************************/

/** The display values a bench carries on a field — never empty. */
export function ltmValues(ltm: KpiLtm, field: LtmField): string[] {
  const value = ltm[field];
  if (Array.isArray(value)) return value.length ? value : [NOT_SET];
  return [value ?? NOT_SET];
}

/** AND across filters, OR within one; `except` leaves one filter out. */
export function ltmInScope(ltms: KpiLtm[], filters: LtmFilters, except?: LtmField): KpiLtm[] {
  const active = LTM_AXES.filter((axis) => axis.key !== except && (filters[axis.key]?.length ?? 0) > 0);
  if (active.length === 0) return ltms;
  return ltms.filter((ltm) =>
    active.every((axis) => {
      const selected = filters[axis.key] as string[];
      return ltmValues(ltm, axis.key).some((v) => selected.includes(v));
    }),
  );
}

/** Known values in their order, the others alphabetically, "Not set" last. */
function ordered(values: Iterable<string>, field: LtmField): string[] {
  const known = FIELD_ORDER[field] ?? [];
  const set = new Set(values);
  const first = known.filter((v) => set.has(v));
  const rest = [...set].filter((v) => v !== NOT_SET && !known.includes(v)).sort((a, b) => COLLATOR.compare(a, b));
  return [...first, ...rest, ...(set.has(NOT_SET) ? [NOT_SET] : [])];
}

/** The values present on an axis, in display order. */
export function ltmAxisOptions(ltms: KpiLtm[], key: LtmAxisKey): string[] {
  return ordered(
    ltms.flatMap((ltm) => ltmValues(ltm, key)),
    key,
  );
}

/***********************************************************
 * Functions — charts
 ***********************************************************/

/**
 * One chart: the scope WITHOUT this field's own filter, counted per value.
 * A selected value with no bench left still shows (0), so it can be
 * clicked off.
 */
export function repartition(ltms: KpiLtm[], filters: LtmFilters, field: LtmField): { total: number; slices: Slice[] } {
  const base = ltmInScope(ltms, filters, field);
  const selected = field in filters ? (filters[field as LtmAxisKey] ?? []) : [];
  const counts = new Map<string, number>();
  for (const ltm of base) for (const v of ltmValues(ltm, field)) counts.set(v, (counts.get(v) ?? 0) + 1);
  for (const v of selected) if (!counts.has(v)) counts.set(v, 0);

  const total = base.length;
  const slices = ordered(counts.keys(), field).map((value) => {
    const count = counts.get(value) ?? 0;
    return { value, count, pct: total ? Math.round((count / total) * 100) : 0, selected: selected.includes(value) };
  });
  return { total, slices };
}

/***********************************************************
 * Functions — photos
 ***********************************************************/

export function photoBand(photos: number): (typeof PHOTO_BANDS)[number] {
  if (photos === 0) return PHOTO_BANDS[0];
  if (photos === 1) return PHOTO_BANDS[1];
  if (photos < 5) return PHOTO_BANDS[2];
  return PHOTO_BANDS[3];
}

export function photoSummary(scope: KpiLtm[]): PhotoSummary {
  const total = scope.length;
  return {
    total,
    illustrated: scope.filter((ltm) => ltm.photos > 0).length,
    photos: scope.reduce((n, ltm) => n + ltm.photos, 0),
    bands: PHOTO_BANDS.map((band) => {
      const count = scope.filter((ltm) => photoBand(ltm.photos) === band).length;
      return { band, count, pct: total ? Math.round((count / total) * 100) : 0 };
    }),
  };
}

/***********************************************************
 * Functions — the table's order
 ***********************************************************/

/** `completion-asc`, `photos-desc`… from the address; anything else → null. */
export function parseLtmOrder(text: string): LtmOrder | null {
  const [column, dir] = text.split("-");
  if (!LTM_COLUMNS.includes(column as LtmColumn)) return null;
  if (dir !== "asc" && dir !== "desc") return null;
  return { column: column as LtmColumn, dir };
}

export function serializeLtmOrder(order: LtmOrder): string {
  return `${order.column}-${order.dir}`;
}

/** The column's value for one bench; null = "Not set". */
function sortValue(ltm: KpiLtm, column: LtmColumn): string | number | null {
  switch (column) {
    case "photos":
      return ltm.photos;
    case "completion":
      return ltm.completion;
    case "portfolio":
    case "manager":
    case "projectManager":
      return ltm[column].length ? ltm[column].join(", ") : null;
    default:
      return ltm[column] || null;
  }
}

/** The scope in the table's order; "Not set" last in both directions. */
export function sortLtms(scope: KpiLtm[], order: LtmOrder): KpiLtm[] {
  const sign = order.dir === "asc" ? 1 : -1;
  const byName = (a: KpiLtm, b: KpiLtm) => COLLATOR.compare(a.name, b.name);
  return [...scope].sort((a, b) => {
    const va = sortValue(a, order.column);
    const vb = sortValue(b, order.column);
    if (va === null || vb === null) {
      if (va !== vb) return va === null ? 1 : -1;
      return byName(a, b);
    }
    const primary =
      typeof va === "number" && typeof vb === "number" ? va - vb : COLLATOR.compare(String(va), String(vb));
    return sign * primary || byName(a, b);
  });
}
