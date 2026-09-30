/***********************************************************
 * KpiClient — The KPI page: the data quality of the Lab Test Means,
 * filterable eleven ways.
 *
 *   KPI — Explore key metrics related to lab test data
 *   [ Filters ………………………………………………………………… ]
 *   124  of 180 Lab Test Means in scope
 *   [LTM Type ▤         ] [Complexity ▤        ] [Export control ▤ ]
 *   [Config. mgmt plan ◯] [Access control ◯    ] [Quality Seal ◯   ]
 *   [Completion ▥       ] [ LTM Photos — share · 4 band tiles       ]
 *   [ Lab Test Means in scope — sortable, paginated table             ]
 *
 * File structure:
 *
 *   1. IMPORTS — Next navigation, useUrlState and the list helper, the SWR
 *      hook, the pure figures, the sections.
 *   2. CONSTANTS — CHARTS (field → title, form, the filter it toggles if
 *      any), CARD_COUNT.
 *   3. FUNCTIONS — KpiSkeleton().
 *   4. COMPONENT FUNCTION —
 *      a. URL state — the eleven filters and the table order.
 *      b. Data — the SWR hook; errors thrown to app/error.tsx.
 *      c. Handlers — add(), remove(), toggle(), reset().
 *      d. Derived data — the known filters, the scope, the notes.
 *      e. JSX return — heading, filters, scope, the card grid in the
 *         user's order, table.
 *
 * Spec: `_specification/vibe coding/kpi-lab-test-means.md`.
 *
 * EVERYTHING IN THE ADDRESS. One parameter per filter (lists joined with
 * "|", lib/kpi/urlList.ts) plus `order` for the table: a shared link shows
 * the same view and a reload loses nothing. One hook per filter, written
 * out — hooks cannot be called in a loop. RESET writes the address itself
 * in one replace: eleven setters in a row would each start from the same stale
 * address and only the last one would stick. The catalogue's filters
 * (sessionStorage) are not touched.
 *
 * A FILTER VALUE THE DATA DOES NOT KNOW IS IGNORED — a stale link.
 *
 * SIX CARDS FILTER. Quality Seal, Type, Complexity, Export Control, the
 * Completion columns and the Photos bands toggle their filter's value on
 * click; the configuration management plan and access control do not
 * filter. Each filtering card counts WITHOUT its own filter (`repartition`,
 * `completionDistribution`, `photoSummary`), so its other values keep their
 * true size.
 *
 * ONE GRID FOR EVERY CARD, three columns at xl, in the order the user set:
 * Type, Complexity, Export control / CMP, Access, Seal / Completion, then
 * Photos over two columns.
 *
 * LOADING AND ERRORS FOLLOW THE APP. A skeleton while SWR loads (once per
 * session; the Header's refresh re-fetches); an error is THROWN, so
 * `app/error.tsx` shows its diagnostics and "Try again", as on every page.
 *
 * Used on: app/kpi/page.tsx
 ***********************************************************/

"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  DEFAULT_LTM_ORDER,
  LTM_AXES,
  ltmAxisOptions,
  ltmInScope,
  parseLtmOrder,
  completionDistribution,
  photoSummary,
  repartition,
  serializeLtmOrder,
  sortLtms,
  type LtmAxisKey,
  type LtmField,
  type LtmFilters,
  type LtmOrder,
} from "@/lib/kpi/kpiStats";
import { URL_LIST } from "@/lib/kpi/urlList";
import { useKpiLabTestMeans } from "@/lib/kpi/useKpiLabTestMeans";
import { useUrlState } from "@/lib/useUrlState";
import KpiFilterBar from "./KpiFilterBar";
import KpiTable from "./KpiTable";
import CompletionDistribution from "./CompletionDistribution";
import PhotoCoverage from "./PhotoCoverage";
import RepartitionChart from "./RepartitionChart";

/***********************************************************
 * Constants
 ***********************************************************/

type ChartField = Extract<LtmField, "seal" | "cmp" | "access" | "category" | "complexity" | "ecLevel">;

/** The six repartition charts; their place on the page is in the JSX. */
const CHARTS: Record<
  ChartField,
  {
    title: string;
    kind: "donut" | "bars";
    /** The chart toggles this filter on click. Absent: not clickable. */
    filter?: LtmAxisKey;
  }
> = {
  seal: { title: "Quality Seal", kind: "donut", filter: "seal" },
  cmp: { title: "Configuration management plan", kind: "donut" },
  access: { title: "LTM Access Control", kind: "donut" },
  category: { title: "LTM Type Repartition", kind: "bars", filter: "category" },
  complexity: { title: "LTM Complexity Repartition", kind: "bars", filter: "complexity" },
  ecLevel: { title: "LTM Export Control", kind: "bars", filter: "ecLevel" },
};

/** The single-width cards (six charts + Completion); Photos spans two. */
const CARD_COUNT = 7;

/***********************************************************
 * Functions
 ***********************************************************/

function KpiSkeleton() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-4">
      <div className="h-36 rounded-card bg-surface-2 skeleton-pulse" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: CARD_COUNT }, (_, i) => (
          <div key={i} className="h-72 rounded-card bg-surface-2 skeleton-pulse" />
        ))}
        <div className="h-72 rounded-card bg-surface-2 skeleton-pulse md:col-span-2" />
      </div>
      <div className="h-80 rounded-card bg-surface-2 skeleton-pulse" />
    </div>
  );
}

export default function KpiClient() {
  /***********************************************************
   * URL state
   ***********************************************************/

  const [portfolio, setPortfolio] = useUrlState({ param: "portfolio", ...URL_LIST });
  const [country, setCountry] = useUrlState({ param: "country", ...URL_LIST });
  const [category, setCategory] = useUrlState({ param: "type", ...URL_LIST });
  const [shared, setShared] = useUrlState({ param: "shared", ...URL_LIST });
  const [program, setProgram] = useUrlState({ param: "program", ...URL_LIST });
  const [ata, setAta] = useUrlState({ param: "ata", ...URL_LIST });
  const [ecLevel, setEcLevel] = useUrlState({ param: "ec", ...URL_LIST });
  const [complexity, setComplexity] = useUrlState({ param: "complexity", ...URL_LIST });
  const [seal, setSeal] = useUrlState({ param: "seal", ...URL_LIST });
  const [photos, setPhotos] = useUrlState({ param: "photos", ...URL_LIST });
  const [completion, setCompletion] = useUrlState({ param: "completion", ...URL_LIST });
  const [order, setOrder] = useUrlState<LtmOrder>({
    param: "order",
    defaultValue: DEFAULT_LTM_ORDER,
    parse: parseLtmOrder,
    serialize: serializeLtmOrder,
  });

  const values: Record<LtmAxisKey, string[]> = {
    portfolio,
    country,
    category,
    shared,
    program,
    ata,
    ecLevel,
    complexity,
    seal,
    photos,
    completion,
  };
  const setters: Record<LtmAxisKey, (v: string[]) => void> = {
    portfolio: setPortfolio,
    country: setCountry,
    category: setCategory,
    shared: setShared,
    program: setProgram,
    ata: setAta,
    ecLevel: setEcLevel,
    complexity: setComplexity,
    seal: setSeal,
    photos: setPhotos,
    completion: setCompletion,
  };

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  /***********************************************************
   * Data
   ***********************************************************/

  const { data, loading, error } = useKpiLabTestMeans();
  if (error) throw error;

  /***********************************************************
   * Handlers
   ***********************************************************/

  function add(key: LtmAxisKey, value: string) {
    if (!values[key].includes(value)) setters[key]([...values[key], value]);
  }

  function remove(key: LtmAxisKey, value: string) {
    setters[key](values[key].filter((v) => v !== value));
  }

  /** A chart click: in if out, out if in. */
  function toggle(key: LtmAxisKey, value: string) {
    if (values[key].includes(value)) remove(key, value);
    else add(key, value);
  }

  /** One replace for all eleven parameters — see the header. The order stays. */
  function reset() {
    const params = new URLSearchParams(searchParams.toString());
    for (const axis of LTM_AXES) params.delete(axis.param);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  /***********************************************************
   * Derived data
   ***********************************************************/

  const ltms = data?.ltms ?? [];

  // Keep only the filter values that exist in the data (see header).
  const filters: LtmFilters = {};
  if (data) {
    for (const axis of LTM_AXES) {
      const options = ltmAxisOptions(ltms, axis.key);
      const known = values[axis.key].filter((v) => options.includes(v));
      if (known.length > 0) filters[axis.key] = known;
    }
  }

  const scope = ltmInScope(ltms, filters);

  /** One repartition chart, counted without its own filter. */
  function chart(field: ChartField) {
    const { title, kind, filter } = CHARTS[field];
    const { total, slices } = repartition(ltms, filters, field);
    return (
      <RepartitionChart
        title={title}
        field={field}
        kind={kind}
        total={total}
        slices={slices}
        onPick={filter ? (value) => toggle(filter, value) : undefined}
      />
    );
  }
  const scopeKey = JSON.stringify(filters);

  const notes: string[] = [];
  if (data?.truncated) notes.push("the list was cut at the page limit — figures cover part of ATOM only");
  if (data && data.dropped > 0) notes.push(`${data.dropped} fact sheets without id or name were left out`);
  if (data && data.completionFixed > 0) notes.push(`${data.completionFixed} had no readable completion and count as 0 %`);

  /***********************************************************
   * Render
   ***********************************************************/

  return (
    <main className="mx-auto flex max-w-[1400px] flex-col gap-5 px-4 py-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-fg">KPI</h1>
        <p className="text-sm text-muted">Explore key metrics related to lab test data</p>
      </header>

      {loading || !data ? (
        <KpiSkeleton />
      ) : (
        <>
          <KpiFilterBar ltms={ltms} filters={filters} onAdd={add} onRemove={remove} onReset={reset} />

          {notes.length > 0 ? <p className="-mt-2 text-xs text-warning">{notes.join(" · ")}</p> : null}

          <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-3xl font-bold text-fg">{scope.length}</span>
            <span className="text-sm text-muted">of {ltms.length} Lab Test Means in scope</span>
          </p>

          <section aria-label="Charts" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {chart("category")}
            {chart("complexity")}
            {chart("ecLevel")}
            {chart("cmp")}
            {chart("access")}
            {chart("seal")}
            <CompletionDistribution
              slices={completionDistribution(ltms, filters).slices}
              onPick={(band) => toggle("completion", band)}
            />
            <PhotoCoverage
              className="md:col-span-2"
              summary={photoSummary(ltms, filters)}
              onPick={(band) => toggle("photos", band)}
            />
          </section>

          {/* Remounted when the scope changes, so the table goes back to page 1. */}
          <KpiTable key={scopeKey} ltms={sortLtms(scope, order)} order={order} onOrder={setOrder} />
        </>
      )}
    </main>
  );
}
