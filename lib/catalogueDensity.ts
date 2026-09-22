"use client";

import { useSyncExternalStore } from "react";

/**
 * Display density of the catalogue grid: how many cards per row, and how many
 * rows per page (1 to 10, or `"all"`). The page size is the product of the
 * two, so a page always ends on a full row (except the very last one of the
 * result set); `"all"` renders the whole filtered set on a single page.
 *
 * Stored on `<html data-cat-cols data-cat-rows>` — and mirrored into the
 * `--cat-cols` custom property, which is what the grid template actually
 * reads — by the inline anti-FOUC script in `app/layout.tsx`, so the very
 * first paint already uses the right number of columns. Same DOM-as-source-of-
 * truth pattern as `lib/useTheme.ts`, and for the same reason: going through
 * `lib/createPersistedStore.ts` like every other preference would render the
 * defaults once and repaint after hydration. These two are the only stores
 * that qualify for the exception — see the rule in CLAUDE.md.
 *
 * Deliberately *not* a filter: it lives in `localStorage` (it outlives the
 * tab, like the theme), it is absent from the URL, and `clearFilters` does not
 * touch it.
 */

export const COLUMN_OPTIONS = [3, 5, 8] as const;

/** `"all"` drops pagination entirely and renders the whole filtered set. */
export const ALL_ROWS = "all";
export type Rows = number | typeof ALL_ROWS;

export const ROW_OPTIONS: readonly Rows[] = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, ALL_ROWS,
];

export type CatalogueDensity = {
  columns: number;
  rows: Rows;
};

/** Stable reference for the server snapshot — see `getServerSnapshot`. */
export const DEFAULT_DENSITY: CatalogueDensity = { columns: 5, rows: 5 };

export const DENSITY_STORAGE_KEY = "catalogue-density";

/** The column count above which cards render in their compact variant. */
export const COMPACT_COLUMNS = 8;

function subscribe(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-cat-cols", "data-cat-rows"],
  });
  return () => observer.disconnect();
}

function readColumns(): number {
  const raw = document.documentElement.getAttribute("data-cat-cols");
  const n = Number(raw);
  return COLUMN_OPTIONS.includes(n as (typeof COLUMN_OPTIONS)[number])
    ? n
    : DEFAULT_DENSITY.columns;
}

function normalizeRows(value: unknown): Rows {
  if (value === ALL_ROWS) return ALL_ROWS;
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 && n <= 10 ? n : DEFAULT_DENSITY.rows;
}

function readRows(): Rows {
  return normalizeRows(document.documentElement.getAttribute("data-cat-rows"));
}

/** Snapshot identity: `useSyncExternalStore` compares by reference, so a new
 * object per read would loop forever. A fresh one is minted only when one of
 * the two attributes actually changed. */
let snapshot: CatalogueDensity = DEFAULT_DENSITY;

function getSnapshot(): CatalogueDensity {
  const columns = readColumns();
  const rows = readRows();
  if (snapshot.columns !== columns || snapshot.rows !== rows) {
    snapshot = { columns, rows };
  }
  return snapshot;
}

function getServerSnapshot(): CatalogueDensity {
  return DEFAULT_DENSITY;
}

export type CatalogueDensityValue = CatalogueDensity & {
  /** `null` means "no pagination" — the `"all"` rows mode. */
  pageSize: number | null;
};

export function useCatalogueDensity(): CatalogueDensityValue {
  const density = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  return {
    ...density,
    pageSize:
      density.rows === ALL_ROWS ? null : density.columns * (density.rows as number),
  };
}

export function setDensity(partial: Partial<CatalogueDensity>): void {
  if (typeof document === "undefined") return;
  const next: CatalogueDensity = {
    columns: COLUMN_OPTIONS.includes(
      partial.columns as (typeof COLUMN_OPTIONS)[number],
    )
      ? (partial.columns as number)
      : readColumns(),
    rows:
      partial.rows === undefined ? readRows() : normalizeRows(partial.rows),
  };
  const root = document.documentElement;
  root.setAttribute("data-cat-cols", String(next.columns));
  root.setAttribute("data-cat-rows", String(next.rows));
  root.style.setProperty("--cat-cols", String(next.columns));
  try {
    globalThis.localStorage.setItem(DENSITY_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Private mode or blocked site data — the density still applies to this
    // page. Refusing to apply it would be worse than not remembering it.
  }
}
