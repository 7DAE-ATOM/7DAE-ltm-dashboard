"use client";

import clsx from "clsx";
import { COLUMN_OPTIONS, setDensity, useCatalogueDensity } from "@/lib/catalogueDensity";

/**
 * How many cards the catalogue grid fits per row. Reads and writes the density
 * store on its own rather than taking props: it sits inside `Pagination`
 * purely for layout, and threading the value through would make that component
 * know about a preference it has no other business with.
 *
 * Desktop only — below `lg` the grid is one or two columns whatever the
 * setting says, so the control would promise something it cannot deliver.
 */
export default function ColumnsToggle() {
  const { columns } = useCatalogueDensity();
  return (
    <div
      role="group"
      aria-label="Cards per row"
      className="hidden lg:inline-flex items-center gap-1"
    >
      <span className="mr-1 text-xs text-muted">Per row</span>
      {COLUMN_OPTIONS.map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => setDensity({ columns: n })}
          aria-pressed={n === columns}
          aria-label={`${n} cards per row`}
          className={clsx(
            "px-2.5 py-1 rounded text-xs font-medium border transition-colors",
            n === columns
              ? "bg-accent text-accent-fg border-accent"
              : "bg-surface text-fg border-border hover:border-accent/50",
          )}
        >
          {n}
        </button>
      ))}
    </div>
  );
}
