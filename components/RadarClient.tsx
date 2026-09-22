"use client";

import { useState } from "react";
import FilterPanel from "@/components/FilterPanel";
import FilterSheet from "@/components/FilterSheet";
import CircularGraph, {
  RADAR_DEFAULT_RADIUS,
  RADAR_MAX_RADIUS,
  RADAR_MIN_RADIUS,
} from "@/components/radar/CircularGraph";
import TooDenseMessage from "@/components/radar/TooDenseMessage";
import RadarSettingsControl from "@/components/radar/RadarSettingsControl";
import RadarLegend from "@/components/radar/RadarLegend";
import { useFilteredLabTestMeans } from "@/lib/useFilteredLabTestMeans";
import { useSharedFilters, setFilters, clearFilters } from "@/lib/appFilters";
import { useLabTestMeans } from "@/lib/useLabTestMeans";
import { useRadarDisplaySettings } from "@/lib/radarDisplaySettings";

function RadarSkeleton() {
  return (
    <div className="relative h-[calc(100vh-57px)] bg-surface-2 skeleton-pulse flex items-center justify-center">
      <span className="text-sm text-muted font-mono">Loading radar…</span>
    </div>
  );
}

export default function RadarClient() {
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
  if (loading) return <RadarSkeleton />;

  return (
    <RadarLoaded
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

function RadarLoaded({
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
  // Shared with `/` and `/map` — see `lib/appFilters.ts`. This page used to
  // hold its own copy so that filtering here wouldn't change what the
  // catalogue showed on return; carrying one perimeter across the three tabs
  // is now the point.
  const { filters, resetToken } = useSharedFilters();
  const [radius, setRadius] = useState(RADAR_DEFAULT_RADIUS);
  const { densityLimit } = useRadarDisplaySettings();

  // `selectable` is what the coarse axes kept — the candidate list offered by
  // the bench visibility chapter. `shown` is that minus the individually
  // excluded benches, which is what the graph renders.
  const { selectable, visible: shown, countUnder } = useFilteredLabTestMeans(
    labTestMeans,
    tree,
    filters,
  );

  // One object for the desktop panel and the mobile sheet — see CatalogueClient.
  // The per-bench visibility list is no longer injected here: it is a chapter
  // of FilterBar now, fed by `selectableBenches`, so this page renders exactly
  // the same panel as the other two.
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
  };

  return (
    <div className="relative h-[calc(100vh-57px)]">
      {shown.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="px-5 py-3 rounded-card bg-surface/90 border border-border text-sm text-muted backdrop-blur-md pointer-events-auto">
            No lab test means match these filters.
          </div>
        </div>
      )}
      {shown.length > 0 && shown.length <= densityLimit && (
        <>
          <CircularGraph benches={shown} radius={radius} />
          <RadarLegend />
        </>
      )}
      {shown.length > densityLimit && (
        <TooDenseMessage count={shown.length} limit={densityLimit} />
      )}

      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <label htmlFor="radar-size" className="text-xs text-muted">
          Circle size
        </label>
        <input
          id="radar-size"
          type="range"
          min={RADAR_MIN_RADIUS}
          max={RADAR_MAX_RADIUS}
          step={10}
          value={radius}
          onChange={(e) => setRadius(Number(e.target.value))}
          className="w-40 accent-accent"
        />
        <RadarSettingsControl />
      </div>

      {/* `lg:flex`, not `lg:block` — see the note on FilterPanel.className. */}
      <FilterPanel
        {...barProps}
        count={shown.length}
        total={labTestMeans.length}
        className="absolute left-4 top-4 z-10 hidden lg:flex w-[340px] max-h-[calc(100vh-100px)]"
      />
      <FilterSheet {...barProps} count={shown.length} />
    </div>
  );
}
