"use client";

import { useEffect, useRef } from "react";
import LabTestMeanCard from "@/components/LabTestMeanCard";
import { type FilterValue } from "@/components/FilterBar";
import FilterPanel from "@/components/FilterPanel";
import FilterSheet from "@/components/FilterSheet";
import Pagination from "@/components/Pagination";
import { useLabTestMeans } from "@/lib/useLabTestMeans";
import { useFilteredLabTestMeans } from "@/lib/useFilteredLabTestMeans";
import { usePageQuery } from "@/lib/usePageQuery";
import {
  useSharedFilters,
  setFilters,
  setPage as setStoredPage,
  clearFilters,
} from "@/lib/appFilters";
import { useCatalogueActions } from "@/components/useCatalogueActions";
import {
  COMPACT_COLUMNS,
  useCatalogueDensity,
} from "@/lib/catalogueDensity";

const SKELETON_CARD_KEYS = ["a", "b", "c", "d", "e", "f"];

/* Must stay a literal: Tailwind's JIT scans source files and there is no
 * safelist, so a class assembled from a template would be purged. Below `lg`
 * the density setting has no say — one or two columns is all that fits. */
const GRID_CLASS =
  "grid grid-cols-1 sm:grid-cols-2 gap-5 lg:[grid-template-columns:repeat(var(--cat-cols,5),minmax(0,1fr))]";

function CatalogueSkeleton() {
  return (
    <main className="px-4 py-8 max-w-[1600px]">
      <div className="grid lg:grid-cols-[340px_1fr] gap-6">
        <aside className="hidden lg:block">
          <div className="h-[400px] rounded-card bg-surface-2 skeleton-pulse" />
        </aside>
        <section>
          <div className={GRID_CLASS}>
            {SKELETON_CARD_KEYS.map((k) => (
              <div key={k} className="rounded-card overflow-hidden">
                <div className="aspect-[4/3] bg-surface-2 skeleton-pulse" />
                <div className="px-4 pt-4 pb-3 space-y-2">
                  <div className="h-4 w-24 rounded bg-surface-2 skeleton-pulse" />
                  <div className="h-5 w-3/4 rounded bg-surface-2 skeleton-pulse" />
                  <div className="h-4 w-1/2 rounded bg-surface-2 skeleton-pulse" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

export default function CatalogueClient() {
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
  if (loading) return <CatalogueSkeleton />;

  return (
    <CatalogueLoaded
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

function CatalogueLoaded({
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
  // Shared with `/map` and `/depview` and kept in sessionStorage — see
  // `lib/appFilters.ts`. Survives catalogue → detail → catalogue ("Back to
  // catalog") and a reload; cleared by the panel's "Clear All", no longer by
  // the "Catalogue" menu item.
  const { filters, resetToken } = useSharedFilters();

  const { selectable, visible, countUnder } = useFilteredLabTestMeans(
    labTestMeans,
    tree,
    filters,
  );

  const { columns, rows, pageSize } = useCatalogueDensity();
  // `"all"` rows means one page holding everything; `Math.max(…, 1)` keeps the
  // arithmetic safe on an empty result.
  const size = pageSize ?? Math.max(visible.length, 1);
  const totalPages = Math.max(1, Math.ceil(visible.length / size));
  const { page, setPage } = usePageQuery(totalPages);
  const paged = visible.slice((page - 1) * size, page * size);

  /* On a density change, keep the card that was at the top of the grid in
   * view instead of jumping back to page 1: work out its index under the old
   * page size, then which page holds it under the new one.
   *
   * Ordering note, load-bearing and invisible: when a bigger page size shrinks
   * `totalPages`, `usePageQuery`'s own clamp also wants to write. It is called
   * during this component's render, so its effect is registered — and runs —
   * first, which leaves this `router.replace` as the last write. */
  const prevSize = useRef(size);
  useEffect(() => {
    if (prevSize.current === size) return;
    const firstIndex = (page - 1) * prevSize.current;
    prevSize.current = size;
    setPage(Math.floor(firstIndex / size) + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageSize]);

  // Mirror the (URL-driven, clamped) page into the store so the detail page's
  // "Back to catalog" link can restore it via ?page=N.
  useEffect(() => {
    setStoredPage(page);
  }, [page]);

  const handleFiltersChange = (v: FilterValue) => {
    setFilters(v);
    setPage(1);
  };

  const handleClear = () => {
    clearFilters();
    setPage(1);
  };

  const { actions, dialog } = useCatalogueActions({
    visible,
    totalCount: labTestMeans.length,
    filters,
    tree,
  });

  // One object for the desktop panel and the mobile sheet: the two are mounted
  // at the same time and must never offer different filters.
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
    onChange: handleFiltersChange,
    onClear: handleClear,
    programResetToken: resetToken,
    selectableBenches: selectable,
    previewCount: countUnder,
    actions,
  };

  return (
    <main className="px-4 py-8 max-w-[1600px]">
      <div className="grid lg:grid-cols-[340px_1fr] gap-6">
        {/* `lg:flex`, not `lg:block` — see the note on FilterPanel.className. */}
        <FilterPanel
          {...barProps}
          count={visible.length}
          total={labTestMeans.length}
          className="hidden lg:flex sticky top-[80px] max-h-[calc(100vh-100px)]"
        />

        <section>
          <div className={GRID_CLASS}>
            {paged.map((m) => (
              <LabTestMeanCard
                key={m.id}
                labTestMean={m}
                compact={columns >= COMPACT_COLUMNS}
              />
            ))}
          </div>
          {visible.length === 0 && (
            <div className="py-20 text-center text-muted">
              No lab test mean matches these filters.
            </div>
          )}
          <Pagination
            page={page}
            totalPages={totalPages}
            pageSize={size}
            totalItems={visible.length}
            onPageChange={setPage}
            rows={rows}
          />
        </section>
      </div>

      <FilterSheet {...barProps} count={visible.length} />
      {/* After the sheet: both are `fixed z-50`, so DOM order decides which
          one stacks on top. */}
      {dialog}
    </main>
  );
}
