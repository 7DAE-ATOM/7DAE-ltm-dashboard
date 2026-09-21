"use client";

import { useMemo, useState } from "react";
import type { LabTestMean } from "@/lib/types";

type Props = {
  /** The benches the coarse axes kept, *before* exclusions — a bench already
   * ticked off still has to appear here, or it could never be ticked on. */
  benches: LabTestMean[];
  excludedIds: string[];
  onChange: (next: string[]) => void;
};

/**
 * Body of the "Displayed LTM" chapter: a second, finer-grained refinement on
 * top of the coarse axes, letting the user hide individual benches that match
 * the filters without changing those filters.
 *
 * Native checkboxes rather than `FilterBar`'s chip-style `Toggle`, because
 * this list runs to the whole filtered set — hundreds of rows on the
 * catalogue, up to the configurable density limit on the dependency view
 * (`lib/radarDisplaySettings.ts`).
 *
 * It no longer carries its own collapsible frame or header count: it is
 * mounted inside a `FilterSection`, which owns the fold, the label and the
 * active-count badge. What stays here is the part the header can't say —
 * `n of N displayed`.
 */
export default function BenchVisibilityList({
  benches,
  excludedIds,
  onChange,
}: Readonly<Props>) {
  const excluded = useMemo(() => new Set(excludedIds), [excludedIds]);
  const hiddenCount = benches.filter((b) => excluded.has(b.externalId)).length;
  const displayedCount = benches.length - hiddenCount;

  const [search, setSearch] = useState("");
  const q = search.trim().toLowerCase();
  const filtered = q
    ? benches.filter((b) => b.name.toLowerCase().includes(q))
    : benches;

  function toggle(externalId: string): void {
    const next = new Set(excluded);
    if (next.has(externalId)) next.delete(externalId);
    else next.add(externalId);
    onChange([...next]);
  }

  /* Select all / Deselect all act on the rows currently listed, not on the
   * whole set: after typing three letters, a "Deselect all" that reached
   * every bench in the catalogue would be a destructive surprise. */
  function selectAllListed(): void {
    const next = new Set(excluded);
    for (const b of filtered) next.delete(b.externalId);
    onChange([...next]);
  }

  function deselectAllListed(): void {
    const next = new Set(excluded);
    for (const b of filtered) next.add(b.externalId);
    onChange([...next]);
  }

  const listedHidden = filtered.filter((b) =>
    excluded.has(b.externalId),
  ).length;

  return (
    <div>
      <p className="mb-1.5 font-mono text-[11px] text-muted">
        {displayedCount} of {benches.length} displayed
      </p>
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search…"
        aria-label="Search displayed lab test means"
        className="mb-1.5 w-full rounded border border-border bg-surface px-2 py-1 text-sm text-fg placeholder:text-muted focus:outline-none focus:border-accent"
      />
      <div className="mb-1.5 flex items-center gap-2">
        <button
          type="button"
          onClick={selectAllListed}
          disabled={listedHidden === 0}
          className="text-[11px] text-accent hover:underline disabled:text-muted disabled:no-underline disabled:cursor-not-allowed"
        >
          Select all
        </button>
        <button
          type="button"
          onClick={deselectAllListed}
          disabled={filtered.length === 0 || listedHidden === filtered.length}
          className="text-[11px] text-accent hover:underline disabled:text-muted disabled:no-underline disabled:cursor-not-allowed"
        >
          Deselect all
        </button>
      </div>
      <div className="max-h-[240px] overflow-y-auto rounded border border-border">
        {filtered.length === 0 ? (
          <p className="px-2 py-1.5 text-sm text-muted">No match.</p>
        ) : (
          filtered.map((b) => (
            <label
              key={b.externalId}
              className="flex items-center gap-2 px-2 py-1.5 text-sm text-fg hover:bg-surface-2"
            >
              <input
                type="checkbox"
                checked={!excluded.has(b.externalId)}
                onChange={() => toggle(b.externalId)}
                className="shrink-0 accent-accent"
              />
              <span className="truncate">{b.name}</span>
            </label>
          ))
        )}
      </div>
    </div>
  );
}
