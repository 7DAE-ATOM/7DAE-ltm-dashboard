"use client";

import { useState } from "react";
import { useSWRConfig, unstable_serialize } from "swr";
import type { FilterValue } from "@/components/FilterBar";
import { serializeFilters } from "@/lib/filterDescription";
import { NEXT_PUBLIC_ATOM_API_BASE_URL } from "@/lib/atom-api";
import { photoKey, type CachedPhoto } from "@/lib/usePhoto";
import type { AircraftStructureNode, CoverPhoto, LabTestMean } from "@/lib/types";
import { downloadBlob, exportDateStamp } from "@/lib/downloadBlob";

type Params = {
  visible: LabTestMean[];
  totalCount: number;
  filters: FilterValue;
  tree: AircraftStructureNode[];
};

export function useExportPdf({ visible, totalCount, filters, tree }: Params) {
  const [isExporting, setIsExporting] = useState(false);
  const { cache } = useSWRConfig();

  const blobToDataUrl = async (blob: Blob): Promise<string | null> => {
    const buf = new Uint8Array(await blob.arrayBuffer());
    let fmt: "png" | "jpeg" | null = null;
    if (buf[0] === 0x89) fmt = "png";
    else if (buf[0] === 0xff) fmt = "jpeg";
    if (!fmt) return null;
    const binary = Array.from(buf).map((b) => String.fromCodePoint(b)).join("");
    return `data:image/${fmt};base64,${btoa(binary)}`;
  };

  const fetchPhotoDataUrl = async (cover: CoverPhoto): Promise<string | null> => {
    // Reuse the Blob already cached by `usePhoto` if this cover was displayed
    // (same SWR key) — no extra POST for already-shown covers.
    const cached = cache.get(unstable_serialize(photoKey(cover.id)))?.data as
      | CachedPhoto
      | undefined;
    if (cached?.blob) return blobToDataUrl(cached.blob);
    try {
      const res = await fetch(`${NEXT_PUBLIC_ATOM_API_BASE_URL}/api/infos/resource`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: cover.id, uri: cover.uri }),
      });
      if (!res.ok) return null;
      return blobToDataUrl(await res.blob());
    } catch {
      return null;
    }
  };

  const handleExportPdf = async () => {
    if (visible.length === 0 || isExporting) return;
    if (
      visible.length === totalCount &&
      !globalThis.confirm(`Export all ${visible.length} benches as PDF?`)
    ) {
      return;
    }
    setIsExporting(true);
    try {
      const resolved = await Promise.all(
        visible.map(async (b) => ({
          ...b,
          resolvedCover: b.coverPhoto ? await fetchPhotoDataUrl(b.coverPhoto) : null,
        })),
      );
      const { pdf } = await import("@react-pdf/renderer");
      const CatalogueExport = (await import("@/components/pdf/CatalogueExport")).default;
      const blob = await pdf(
        CatalogueExport({
          benches: resolved,
          filtersDescription: serializeFilters(filters, tree),
          baseUrl: globalThis.location.origin,
        }),
      ).toBlob();
      downloadBlob(blob, `ltm-export-${exportDateStamp()}.pdf`);
    } catch (e) {
      alert(`Export failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setIsExporting(false);
    }
  };

  return { isExporting, handleExportPdf };
}
