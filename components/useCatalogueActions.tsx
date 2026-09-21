"use client";

import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";
import CatalogueActions from "@/components/CatalogueActions";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useExportPdf } from "@/lib/useExportPdf";
import {
  SEED_CONFIRM_THRESHOLD,
  buildDepgraphHref,
  storeSeedIds,
} from "@/lib/depgraphSeed";
import type { FilterValue } from "@/components/FilterBar";
import type { AircraftStructureNode, LabTestMean } from "@/lib/types";

type Params = {
  visible: LabTestMean[];
  totalCount: number;
  filters: FilterValue;
  tree: AircraftStructureNode[];
};

/**
 * Behaviour behind the catalogue's ACTIONS block: the PDF export (delegated
 * untouched to `useExportPdf`) and the bridge to `/depgraph`.
 *
 * Returns the rendered block plus its dialog, because the two have to be
 * mounted in different places — the block goes inside the filter panel, the
 * dialog has to sit above the mobile sheet.
 */
export function useCatalogueActions({
  visible,
  totalCount,
  filters,
  tree,
}: Params): { actions: ReactNode; dialog: ReactNode } {
  const { isExporting, handleExportPdf } = useExportPdf({
    visible,
    totalCount,
    filters,
    tree,
  });

  // The whole filtered set, not just the current page — same rule as the PDF
  // export. `visible` is already post-exclusion, so a bench hidden in the
  // "Displayed LTM" chapter is absent from the graph too, matching what the
  // user sees on screen.
  const ids = useMemo(() => visible.map((m) => m.externalId), [visible]);
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const triggerRef = useRef<HTMLAnchorElement | null>(null);

  const handleDepgraphClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      // Small enough to travel in the URL: let the browser navigate natively,
      // and the link stays shareable.
      if (ids.length <= SEED_CONFIRM_THRESHOLD) return;
      e.preventDefault();
      triggerRef.current = e.currentTarget;
      // The RESOLVED href off the anchor itself, basePath included —
      // rebuilding it by hand would 404 behind the gateway.
      setPendingHref(e.currentTarget.href);
    },
    [ids.length],
  );

  const closeDialog = useCallback(() => {
    setPendingHref(null);
    triggerRef.current?.focus();
  }, []);

  const confirmDepgraph = useCallback(() => {
    if (!pendingHref) return closeDialog();
    const token = storeSeedIds(ids);
    let href = pendingHref;
    if (token) {
      const url = new URL(pendingHref);
      url.search = `seed=${token}`;
      href = url.toString();
    }
    // No token means storage is unavailable — fall back to the plain `?ids=`
    // URL rather than doing nothing.
    globalThis.open(href, "_blank", "noopener,noreferrer");
    closeDialog();
  }, [pendingHref, ids, closeDialog]);

  return {
    actions: (
      <CatalogueActions
        count={visible.length}
        isExporting={isExporting}
        onExportPdf={handleExportPdf}
        depgraphHref={ids.length > 0 ? buildDepgraphHref(ids) : null}
        onDepgraphClick={handleDepgraphClick}
      />
    ),
    dialog: (
      <ConfirmDialog
        open={pendingHref !== null}
        title="Large selection"
        message={`This opens ${ids.length} lab test means in the dependency graph. The diagram will be dense and may take a moment to lay out.`}
        onConfirm={confirmDepgraph}
        onCancel={closeDialog}
      />
    ),
  };
}
