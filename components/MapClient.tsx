"use client";

import dynamic from "next/dynamic";
import FilterPanel from "@/components/FilterPanel";
import FilterSheet from "@/components/FilterSheet";
import ExportPdfButton from "@/components/ExportPdfButton";
import { useLabTestMeans } from "@/lib/useLabTestMeans";
import { useFilteredLabTestMeans } from "@/lib/useFilteredLabTestMeans";
import { useSharedFilters, setFilters, clearFilters } from "@/lib/appFilters";
import { useExportPdf } from "@/lib/useExportPdf";

const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });

function MapSkeleton() {
  return (
    <div className="relative h-[calc(100vh-57px)] bg-surface-2 skeleton-pulse flex items-center justify-center">
      <span className="text-sm text-muted font-mono">Loading map…</span>
    </div>
  );
}

export default function MapClient() {
  const {
    labTestMeans,
    tree,
    programCounts,
    hasUnassignedPrograms,
    types,
    statuses,
    countries,
    complexities,
    portfolios,
    loading,
    error,
  } = useLabTestMeans();

  if (error) throw error;
  if (loading) return <MapSkeleton />;

  return (
    <MapLoaded
      labTestMeans={labTestMeans}
      tree={tree}
      programCounts={programCounts}
      hasUnassignedPrograms={hasUnassignedPrograms}
      types={types}
      statuses={statuses}
      countries={countries}
      complexities={complexities}
      portfolios={portfolios}
    />
  );
}

type LoadedProps = {
  labTestMeans: ReturnType<typeof useLabTestMeans>["labTestMeans"];
  tree: ReturnType<typeof useLabTestMeans>["tree"];
  programCounts: ReturnType<typeof useLabTestMeans>["programCounts"];
  hasUnassignedPrograms: boolean;
  types: ReturnType<typeof useLabTestMeans>["types"];
  statuses: ReturnType<typeof useLabTestMeans>["statuses"];
  countries: ReturnType<typeof useLabTestMeans>["countries"];
  complexities: ReturnType<typeof useLabTestMeans>["complexities"];
  portfolios: ReturnType<typeof useLabTestMeans>["portfolios"];
};

function MapLoaded({
  labTestMeans,
  tree,
  programCounts,
  hasUnassignedPrograms,
  types,
  statuses,
  countries,
  complexities,
  portfolios,
}: Readonly<LoadedProps>) {
  // Shared with `/` and `/depview` — see `lib/appFilters.ts`.
  const { filters, resetToken } = useSharedFilters();
  const { selectable, visible, countUnder } = useFilteredLabTestMeans(
    labTestMeans,
    tree,
    filters,
  );

  const { isExporting, handleExportPdf } = useExportPdf({
    visible,
    totalCount: labTestMeans.length,
    filters,
    tree,
  });

  // One object for the desktop panel and the mobile sheet — see CatalogueClient.
  const barProps = {
    types,
    statuses,
    countries,
    tree,
    programCounts,
    hasUnassignedPrograms,
    complexities,
    portfolios,
    value: filters,
    onChange: setFilters,
    onClear: clearFilters,
    programResetToken: resetToken,
    selectableBenches: selectable,
    previewCount: countUnder,
    // The ACTIONS block is the catalogue's; the map keeps only its PDF export,
    // which predates it and must not regress.
    actions: (
      <ExportPdfButton
        count={visible.length}
        disabled={visible.length === 0 || isExporting}
        isExporting={isExporting}
        onClick={handleExportPdf}
      />
    ),
  };

  return (
    <div className="relative h-[calc(100vh-57px)]">
      <div className="absolute inset-0">
        <MapView labTestMeans={visible} />
      </div>
      {visible.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="px-5 py-3 rounded-card bg-surface/90 border border-border text-sm text-muted backdrop-blur-md pointer-events-auto">
            No lab test means match these filters.
          </div>
        </div>
      )}
      {/* `lg:flex`, not `lg:block` — see the note on FilterPanel.className. */}
      <FilterPanel
        {...barProps}
        count={visible.length}
        total={labTestMeans.length}
        className="absolute left-4 top-4 z-10 hidden lg:flex w-[340px] max-h-[calc(100vh-100px)]"
      />
      <FilterSheet {...barProps} count={visible.length} />
    </div>
  );
}
