"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { matchesBenchQuery } from "@/lib/labtestmeans";
import type { LabTestMean } from "@/lib/types";

type Props = {
  options: LabTestMean[];
  excludeIds: Set<string>;
  onSelect: (m: LabTestMean) => void;
  placeholder?: string;
};

const MAX_RESULTS = 400;

export default function BenchCombobox({
  options,
  excludeIds,
  onSelect,
  placeholder = "Search a bench by name or code…",
}: Readonly<Props>) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const listboxId = "bench-combobox-listbox";

  const filtered = useMemo(() => {
    // Some backend records have a null/empty `externalId` despite the DTO's
    // string typing — selecting one of those breaks every downstream feature
    // keyed on it (routing, the /depgraph graph's node ids fed to ELK), so
    // they're excluded here rather than merely hidden from the search filter.
    // Already-selected benches are also excluded — picking one again would
    // just be a no-op duplicate.
    const selectable = options.filter(
      (m) => !!m.externalId && !excludeIds.has(m.externalId),
    );
    const q = query.trim().toLowerCase();
    const matches = q
      ? selectable.filter((m) => matchesBenchQuery(m, q))
      : selectable;
    return matches.slice(0, MAX_RESULTS);
  }, [options, query, excludeIds]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, open]);

  useEffect(() => {
    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  function selectOption(m: LabTestMean) {
    onSelect(m);
    setQuery("");
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setOpen(true);
      return;
    }
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const m = filtered[activeIndex];
      if (m) selectOption(m);
    } else if (e.key === "Escape") {
      setOpen(false);
      setQuery("");
    }
  }

  return (
    <div ref={rootRef} className="relative min-w-[140px] max-w-xl flex-1 basis-52">
      <input
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        aria-activedescendant={
          open && filtered[activeIndex]
            ? `bench-option-${filtered[activeIndex].id}`
            : undefined
        }
        aria-label="Select a bench"
        placeholder={placeholder}
        value={query}
        onFocus={() => {
          setQuery("");
          setOpen(true);
        }}
        onClick={() => {
          // `onFocus` doesn't fire again if the field is already focused, so
          // a plain click there would otherwise leave the list closed until
          // the user blurs and refocuses.
          setOpen(true);
        }}
        onChange={(e) => {
          setQuery(e.target.value);
          // Picking an option keeps focus in the field (the option's
          // `onMouseDown` calls `preventDefault()` so the click registers
          // before any blur) but closes the list — typing right after a
          // pick must reopen it even though no focus/blur transition
          // happens to trigger `onFocus` again.
          setOpen(true);
        }}
        onKeyDown={onKeyDown}
        className="w-full px-3 py-2 rounded bg-surface border border-border text-fg placeholder:text-muted focus:outline-none focus:border-accent"
      />
      {open && (
        <ul // NOSONAR: custom filterable combobox kept as ARIA listbox (WAI-ARIA APG pattern) — native <select>/<datalist> can't reproduce live filtering, see correction-issues-sonarqube.md
          id={listboxId}
          role="listbox" // NOSONAR: see note above the <ul>
          className="absolute top-full left-0 right-0 mt-1 max-h-72 overflow-y-auto rounded-card bg-surface border border-border shadow-lg z-20"
        >
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-sm text-muted" role="option" aria-disabled="true" aria-selected={false}> {/* NOSONAR: same ARIA listbox pattern as the <ul> above */}
              No bench found.
            </li>
          ) : (
            filtered.map((m, i) => (
              <li // NOSONAR: same ARIA listbox pattern as the <ul> above
                key={m.id}
                id={`bench-option-${m.id}`}
                role="option" // NOSONAR: see note above the <li>
                aria-selected={i === activeIndex}
                onMouseDown={(e) => {
                  e.preventDefault();
                  selectOption(m);
                }}
                onMouseEnter={() => setActiveIndex(i)}
                className={`px-3 py-2 text-sm cursor-pointer ${
                  i === activeIndex
                    ? "bg-accent/10 text-accent"
                    : "text-fg/90"
                }`}
              >
                <span className="font-medium">{m.name}</span>{" "}
                <span className="text-muted font-mono text-xs">
                  {m.externalId}
                </span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
