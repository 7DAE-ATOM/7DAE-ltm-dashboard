"use client";

import clsx from "clsx";
import type { ComponentProps } from "react";
import FilterBar from "@/components/FilterBar";

type Props = ComponentProps<typeof FilterBar> & {
  count: number;
  total: number;
  /**
   * Positioning only — the frame, the width and the padding are the panel's
   * own business, which is what makes the three pages look identical.
   *
   * Callers must restore visibility with `lg:flex`, **not** `lg:block`: the
   * root is a flex column, and `block` would collapse `min-h-0` and let the
   * scroll box grow past the viewport instead of scrolling inside its frame.
   */
  className?: string;
};

/**
 * The filter panel, identical on `/`, `/map` and `/depview`.
 *
 * The three pages used to hand-roll this markup, and had drifted: 296px in a
 * document-flow column on the catalogue, 340px floating on the other two, and
 * a whole extra fold wrapper on the dependency view. Only where the panel
 * sits still differs — a scrolling page cannot host an overlay the way a
 * fixed-height canvas can — and that is what `className` carries.
 *
 * The scroll lives on the framed box rather than on the root, so the border
 * and the counter stay put while the chapters scroll under them.
 */
export default function FilterPanel({
  count,
  total,
  className,
  ...bar
}: Readonly<Props>) {
  return (
    <div className={clsx("flex flex-col", className)}>
      <div className="glass-panel min-h-0 overflow-y-auto p-5">
        <FilterBar {...bar} />
      </div>
      <div className="mt-4 shrink-0 font-mono text-xs text-muted">
        {count} / {total} lab test means
      </div>
    </div>
  );
}
