"use client";

import { createPersistedStore } from "@/lib/createPersistedStore";

/**
 * Which chapters of the FILTERING block are unfolded, persisted per browser
 * and shared by every mounted panel — the catalogue's column, the map's and
 * the dependency view's overlays, and the mobile sheet — because the store is
 * a module singleton.
 *
 * We store the *open* sections rather than the folded ones: everything the
 * stored value doesn't mention is folded, which is both the first-visit
 * default and the right behaviour for an axis added later on.
 *
 * `localStorage`, unlike the selection itself (`lib/appFilters.ts`, session):
 * a folded chapter forgotten since yesterday is harmless, a forgotten filter
 * is not. Emptying the filters leaves this alone — folding is a display
 * choice, not a filter.
 */
export type SectionKey =
  | "photo"
  | "qualitySeal"
  | "type"
  | "status"
  | "country"
  | "portfolio"
  | "complexity"
  | "programs"
  | "benches";

const SECTION_KEYS: SectionKey[] = [
  "photo",
  "qualitySeal",
  "type",
  "status",
  "country",
  "portfolio",
  "complexity",
  "programs",
  "benches",
];

/** First visit: everything folded. Also the server/hydration snapshot, so the
 * panel never renders open and then folds under the user's eyes. */
const DEFAULT_OPEN: ReadonlySet<SectionKey> = new Set();

const store = createPersistedStore<ReadonlySet<SectionKey>>({
  key: "filter-sections-open",
  storage: "local",
  defaultValue: DEFAULT_OPEN,
  // A `Set` is not JSON, hence the explicit pair. Unknown keys are dropped:
  // a chapter removed upstream must not resurrect as an open section.
  parse: (raw) => {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return new Set(
      parsed.filter((k): k is SectionKey =>
        SECTION_KEYS.includes(k as SectionKey),
      ),
    );
  },
  serialize: (open) => JSON.stringify([...open]),
});

export function useOpenFilterSections(): ReadonlySet<SectionKey> {
  return store.useValue();
}

export function toggleFilterSection(key: SectionKey): void {
  const next = new Set(store.get());
  if (next.has(key)) next.delete(key);
  else next.add(key);
  store.set(next);
}
