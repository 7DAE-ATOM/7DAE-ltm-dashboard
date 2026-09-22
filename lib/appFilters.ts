"use client";

import { useSyncExternalStore } from "react";
import { createPersistedStore } from "@/lib/createPersistedStore";
import type { FilterValue } from "@/components/FilterBar";
import type {
  LabTestMeanStatus,
  LabTestMeanType,
  PhotoFilter,
  QualitySealFilter,
} from "@/lib/types";

/**
 * The one source of truth for the filter selection, shared by the catalogue
 * (`/`), the map (`/map`) and the dependency view (`/depview`). Each of those
 * used to hold its own copy — the catalogue in a RAM-only module store, the
 * other two in a local `useState` with the default literal copy-pasted — so
 * the same perimeter had to be re-entered on every tab change.
 *
 * **`sessionStorage`, not `localStorage`**: a narrow filter forgotten since
 * yesterday would look like an empty catalogue. It survives a reload and
 * client-side navigation, and dies with the tab. For the same reason it is
 * deliberately *not* synced across tabs: two tabs scoped differently is a
 * legitimate way to work.
 *
 * `page` and `resetToken` sit beside the persisted half rather than inside it:
 *  - `page` is owned by the URL (`?page=`, see `lib/usePageQuery.ts`). It is
 *    mirrored here only so the detail page's "Back to catalog" link can
 *    restore it, and persisting it would fight the URL on the next load.
 *  - `resetToken` exists because `components/TreeFilter.tsx` keeps its
 *    expanded nodes in local `useState`. Emptying `programNodeIds` cannot
 *    reach that state; `key={resetToken}` on the component is what re-collapses
 *    the tree on Clear All.
 *
 * The fold state of the panel's chapters is a *display* preference and lives
 * separately, in `localStorage` — see `lib/filterSectionState.ts`.
 */

export const DEFAULT_FILTERS: FilterValue = {
  search: "",
  photo: "all",
  qualitySeal: "all",
  types: [],
  statuses: [],
  countries: [],
  programNodeIds: [],
  complexities: [],
  portfolios: [],
  excludedIds: [],
};

const PHOTO_VALUES: PhotoFilter[] = ["all", "with", "without"];
const QUALITY_SEAL_VALUES: QualitySealFilter[] = ["all", "draft", "released"];

function stringArray(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  return value.filter((v): v is string => typeof v === "string");
}

/** Field-at-a-time validation rather than a blind cast: what comes back from
 * storage was written by an older build, or by hand. Anything unrecognised
 * falls back to that field's default instead of rejecting the whole value —
 * losing one axis beats losing the selection. */
function restore(raw: string): FilterValue | null {
  const parsed: unknown = JSON.parse(raw);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
  const p = parsed as Record<string, unknown>;
  return {
    search: typeof p.search === "string" ? p.search : DEFAULT_FILTERS.search,
    photo: PHOTO_VALUES.includes(p.photo as PhotoFilter)
      ? (p.photo as PhotoFilter)
      : DEFAULT_FILTERS.photo,
    qualitySeal: QUALITY_SEAL_VALUES.includes(p.qualitySeal as QualitySealFilter)
      ? (p.qualitySeal as QualitySealFilter)
      : DEFAULT_FILTERS.qualitySeal,
    types: (stringArray(p.types) as LabTestMeanType[] | null) ?? DEFAULT_FILTERS.types,
    statuses:
      (stringArray(p.statuses) as LabTestMeanStatus[] | null) ??
      DEFAULT_FILTERS.statuses,
    countries: stringArray(p.countries) ?? DEFAULT_FILTERS.countries,
    programNodeIds: stringArray(p.programNodeIds) ?? DEFAULT_FILTERS.programNodeIds,
    complexities: stringArray(p.complexities) ?? DEFAULT_FILTERS.complexities,
    portfolios: stringArray(p.portfolios) ?? DEFAULT_FILTERS.portfolios,
    excludedIds: stringArray(p.excludedIds) ?? DEFAULT_FILTERS.excludedIds,
  };
}

const filtersStore = createPersistedStore<FilterValue>({
  key: "ltm-filters",
  storage: "session",
  defaultValue: DEFAULT_FILTERS,
  parse: restore,
});

export type SharedFilterState = {
  filters: FilterValue;
  page: number;
  resetToken: number;
};

let page = 1;
let resetToken = 0;

/** Stable reference for the server snapshot — `useSyncExternalStore` compares
 * snapshots by identity, so this must not be rebuilt per read. */
const SERVER_STATE: SharedFilterState = {
  filters: DEFAULT_FILTERS,
  page: 1,
  resetToken: 0,
};

let snapshot: SharedFilterState = SERVER_STATE;

/** Mints a new snapshot only when something actually changed, for the same
 * identity reason. */
function compose(): SharedFilterState {
  const filters = filtersStore.get();
  if (
    snapshot.filters === filters &&
    snapshot.page === page &&
    snapshot.resetToken === resetToken
  ) {
    return snapshot;
  }
  snapshot = { filters, page, resetToken };
  return snapshot;
}

const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  const unsubscribeStore = filtersStore.subscribe(listener);
  return () => {
    listeners.delete(listener);
    unsubscribeStore();
  };
}

function getServerSnapshot(): SharedFilterState {
  return SERVER_STATE;
}

export function useSharedFilters(): SharedFilterState {
  return useSyncExternalStore(subscribe, compose, getServerSnapshot);
}

/** Non-reactive read — used by the detail page to build its "Back to catalog"
 * link outside of a render pass. */
export function getSharedFilterState(): SharedFilterState {
  return compose();
}

export function setFilters(filters: FilterValue): void {
  filtersStore.set(filters);
}

export function setPage(next: number): void {
  if (next === page) return;
  page = next;
  emit();
}

/** Empties every axis and bumps `resetToken` so `TreeFilter` re-collapses.
 * Display preferences — chapter folding, catalogue density — are untouched:
 * emptying the filters is not a display change. */
export function clearFilters(): void {
  page = 1;
  resetToken += 1;
  filtersStore.set(DEFAULT_FILTERS);
  emit();
}

/** How many axes are narrowing the result. Drives the "Clear All" link's
 * visibility, the mobile sheet's badge and the per-chapter counts, which used
 * to be computed by three different pieces of arithmetic.
 *
 * `excludedIds` counts as one axis, not N: the number the user cares about on
 * the badge is "how many kinds of narrowing are on", and the chapter header
 * already carries the precise count. */
export function countActiveFilters(v: FilterValue): number {
  return (
    (v.search ? 1 : 0) +
    (v.photo !== "all" ? 1 : 0) +
    (v.qualitySeal !== "all" ? 1 : 0) +
    (v.types.length > 0 ? 1 : 0) +
    (v.statuses.length > 0 ? 1 : 0) +
    (v.countries.length > 0 ? 1 : 0) +
    (v.programNodeIds.length > 0 ? 1 : 0) +
    (v.complexities.length > 0 ? 1 : 0) +
    (v.portfolios.length > 0 ? 1 : 0) +
    (v.excludedIds.length > 0 ? 1 : 0)
  );
}
