"use client";

import { useState } from "react";
import type { LabTestMean } from "@/lib/types";
import BenchChip from "./BenchChip";
import SelectedBenchesDialog from "./SelectedBenchesDialog";
import ZoomIcon from "@/components/icons/ZoomIcon";

type Props = {
  benches: LabTestMean[];
  onRemove: (externalId: string) => void;
};

/**
 * The compact selection strip in the Dependency Graph toolbar, plus the
 * magnifier that opens the same list at full width.
 *
 * The dialog's open state lives here on purpose: the bar unmounts as soon as
 * the selection is empty, which closes the dialog for free when the last bench
 * is removed from inside it.
 */
export default function SelectedBenchesBar({
  benches,
  onRemove,
}: Readonly<Props>) {
  const [open, setOpen] = useState(false);

  if (benches.length === 0) return null;

  return (
    // Flexible footprint (shrinks/grows with the search field so both stay on
    // the same toolbar row down to small screens; height stays constant
    // regardless of how many benches are selected) — overflow scrolls
    // vertically instead of pushing the rest of the toolbar down. `relative`
    // is what the magnifier anchors to.
    <div className="relative h-10 min-w-[140px] max-w-xl flex-1 basis-52">
      {/* Straddles the strip's top-left corner rather than sitting inside it:
       * anywhere inside would overlap either a chip or the scrollbar. */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Expand the selected lab test means list"
        title="Expand the selected lab test means list"
        className="absolute -left-2 -top-2 z-10 inline-flex h-5 w-5 items-center justify-center rounded-full border border-border bg-surface text-muted shadow-sm transition-colors hover:bg-surface-2 hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <ZoomIcon size={11} />
      </button>
      <div className="flex h-full flex-wrap content-start gap-1.5 overflow-y-auto rounded-card border border-border bg-surface p-1.5">
        {benches.map((b) => (
          <BenchChip key={b.externalId} bench={b} onRemove={onRemove} />
        ))}
      </div>
      {open && (
        <SelectedBenchesDialog
          benches={benches}
          onRemove={onRemove}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}
