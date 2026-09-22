"use client";

import { useEffect, useRef } from "react";
import type { LabTestMean } from "@/lib/types";
import BenchChip from "./BenchChip";
import CloseIcon from "@/components/icons/CloseIcon";

type Props = {
  benches: LabTestMean[];
  onRemove: (externalId: string) => void;
  onClose: () => void;
};

/**
 * The selected lab test means, shown at full width.
 *
 * The toolbar bar that owns this dialog is a fixed 40px-tall strip sharing its
 * row with the bench search, so past three or four chips the selection is read
 * through a cramped internal scrollbar — and a selection opened from the
 * catalogue's ACTIONS block can arrive thirty benches at a time. This is an
 * *enlargement*, not a new feature: same list, same per-chip remove action,
 * no sorting, no search, no way to add a bench (that stays `BenchCombobox`'s
 * job).
 *
 * Overlay / focus / Escape handling mirrors `components/AboutDialog.tsx`.
 */
export default function SelectedBenchesDialog({
  benches,
  onRemove,
  onClose,
}: Readonly<Props>) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div // NOSONAR: modal backdrop kept as role="presentation" (not <img>), see correction-issues-sonarqube.md
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      // Only a click on the backdrop itself closes. Testing the target rather
      // than stopping propagation on the panel is what keeps clicking a chip's
      // remove button from dismissing the whole dialog.
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="presentation"
    >
      <div // NOSONAR: modal panel kept as role="dialog", not native <dialog> (would change close/focus behavior)
        role="dialog"
        aria-modal="true"
        aria-labelledby="selected-benches-title"
        className="w-full max-w-2xl rounded-lg border border-border bg-surface shadow-xl"
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <h2 id="selected-benches-title" className="text-base font-semibold">
            Selected lab test means ({benches.length})
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="inline-flex items-center justify-center w-8 h-8 rounded text-muted hover:text-fg hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <CloseIcon />
          </button>
        </div>
        <div className="flex max-h-[70vh] flex-wrap content-start gap-2 overflow-y-auto p-5">
          {benches.map((b) => (
            <BenchChip
              key={b.externalId}
              bench={b}
              onRemove={onRemove}
              size="large"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
