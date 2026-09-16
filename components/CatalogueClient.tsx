"use client";

import { useEffect, useMemo } from "react";
import LabTestMeanCard from "@/components/LabTestMeanCard";
import FilterBar, { type FilterValue } from "@/components/FilterBar";
import FilterSheet from "@/components/FilterSheet";
import ExportPdfButton from "@/components/ExportPdfButton";
import Pagination from "@/components/Pagination";
import { filterLabTestMeans } from "@/lib/labtestmeans";
import { expandSelection } from "@/lib/aircraftStructure";
import { useLabTestMeans } from "@/lib/useLabTestMeans";
import { usePageQuery } from "@/lib/usePageQuery";
import {
  useCatalogueFilters,
  setCatalogueFilters,
  setCataloguePage,
} from "@/lib/catalogueFilters";
import { useExportPdf } from "@/lib/useExportPdf";

const PAGE_SIZE = 6;
const SKELETON_CARD_KEYS = ["a", "b", "c", "d", "e", "f"];

function CatalogueSkeleton() {
  return (
    <main className="px-4 py-8 max-w-[1600px]">
      <div className="grid lg:grid-cols-[296px_1fr] gap-6">
        <aside className="hidden lg:block">
          <div className="h-[400px] rounded-card bg-surface-2 skeleton-pulse" />
        </aside>
        <section>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
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
  // Filters live in an in-memory store (see lib/catalogueFilters) so they
  // survive catalogue → detail → catalogue ("Back to catalog") and can be reset
  // by the "Catalogue" menu, while being lost on reload.
  const { filters } = useCatalogueFilters();

  const visible = useMemo(() => {
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

  const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const { page, setPage } = usePageQuery(totalPages);
  const paged = visible.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Mirror the (URL-driven, clamped) page into the store so the detail page's
  // "Back to catalog" link can restore it via ?page=N.
  useEffect(() => {
    setCataloguePage(page);
  }, [page]);

  const handleFiltersChange = (v: FilterValue) => {
    setCatalogueFilters(v);
    setPage(1);
  };

  const { isExporting, handleExportPdf } = useExportPdf({
    visible,
    totalCount: labTestMeans.length,
    filters,
    tree,
  });

  return (
    <main className="px-4 py-8 max-w-[1600px]">
      <div className="grid lg:grid-cols-[296px_1fr] gap-6">
        <aside className="hidden lg:block">
          <div className="sticky top-[80px] max-h-[calc(100vh-100px)] overflow-y-auto glass-panel p-5">
            <div className="mb-3 text-xs text-muted font-mono">
              {visible.length} / {labTestMeans.length} lab test means
            </div>
            <FilterBar
              types={types}
              statuses={statuses}
              countries={countries}
              tree={tree}
              programCounts={programCounts}
              hasUnassignedPrograms={hasUnassignedPrograms}
              complexities={complexities}
              portfolios={portfolios}
              value={filters}
              onChange={handleFiltersChange}
            />
            <ExportPdfButton
              count={visible.length}
              disabled={visible.length === 0 || isExporting}
              isExporting={isExporting}
              onClick={handleExportPdf}
            />
          </div>
        </aside>

        <section>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {paged.map((m) => (
              <LabTestMeanCard key={m.id} labTestMean={m} />
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
            pageSize={PAGE_SIZE}
            totalItems={visible.length}
            onPageChange={setPage}
          />
        </section>
      </div>

      <FilterSheet
        types={types}
        statuses={statuses}
        countries={countries}
        tree={tree}
        programCounts={programCounts}
        hasUnassignedPrograms={hasUnassignedPrograms}
        complexities={complexities}
        portfolios={portfolios}
        value={filters}
        onChange={handleFiltersChange}
        count={visible.length}
        extraContent={
          <ExportPdfButton
            count={visible.length}
            disabled={visible.length === 0 || isExporting}
            isExporting={isExporting}
            onClick={handleExportPdf}
          />
        }
      />
    </main>
  );
}
