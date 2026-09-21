"use client";

import { useCallback, useMemo } from "react";
import { excludeBenches, filterLabTestMeans } from "@/lib/labtestmeans";
import { expandSelection } from "@/lib/aircraftStructure";
import type { FilterValue } from "@/components/FilterBar";
import type { AircraftStructureNode, LabTestMean } from "@/lib/types";

export type FilteredLabTestMeans = {
  /** What the coarse axes kept — the candidate list the "Displayed LTM"
   * chapter offers. It must stay pre-exclusion: a bench the user has ticked
   * off still has to appear there, or it could never be ticked back on. */
  selectable: LabTestMean[];
  /** What the page actually renders: `selectable` minus the benches excluded
   * one by one. */
  visible: LabTestMean[];
  /** How many lab test means would remain under a hypothetical filter value,
   * for the per-option counts on the filter chips. Runs the exact same
   * pipeline as `visible`, so a count can never disagree with the panel's own
   * total. */
  countUnder: (next: FilterValue) => number;
};

/**
 * The filtering pipeline, in one place. The catalogue, the map and the
 * dependency view each used to carry a byte-identical copy of the
 * `expandSelection` + `filterLabTestMeans` memo; now that they also share the
 * selection itself (`lib/appFilters.ts`), three copies of the derivation would
 * be three chances for them to disagree about what a filter means.
 */
export function useFilteredLabTestMeans(
  labTestMeans: LabTestMean[],
  tree: AircraftStructureNode[],
  filters: FilterValue,
): FilteredLabTestMeans {
  const selectable = useMemo(() => {
    const { names, includeUnassigned } = expandSelection(
      tree,
      filters.programNodeIds,
    );
    return filterLabTestMeans(labTestMeans, {
      ...filters,
      programNodeNames: names,
      includeUnassignedPrograms: includeUnassigned,
    });
  }, [labTestMeans, tree, filters]);

  const visible = useMemo(
    () => excludeBenches(selectable, filters.excludedIds),
    [selectable, filters.excludedIds],
  );

  const countUnder = useCallback(
    (next: FilterValue) => {
      const { names, includeUnassigned } = expandSelection(
        tree,
        next.programNodeIds,
      );
      const coarse = filterLabTestMeans(labTestMeans, {
        ...next,
        programNodeNames: names,
        includeUnassignedPrograms: includeUnassigned,
      });
      // Last, like everywhere else: the hand-picked exclusions.
      return excludeBenches(coarse, next.excludedIds).length;
    },
    [labTestMeans, tree],
  );

  return { selectable, visible, countUnder };
}
