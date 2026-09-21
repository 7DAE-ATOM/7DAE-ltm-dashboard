"use client";

import { useId, useMemo, type ReactNode } from "react";
import type {
  AircraftStructureNode,
  LabTestMean,
  LabTestMeanStatus,
  LabTestMeanType,
  PhotoFilter,
  QualitySealFilter,
} from "@/lib/types";
import { COMPLEXITY_NA, PORTFOLIO_NONE } from "@/lib/labtestmeans";
import { STATUS_LABELS, TYPE_LABELS } from "@/lib/labels";
import TreeFilter from "@/components/TreeFilter";
import FilterSection from "@/components/FilterSection";
import BenchVisibilityList from "@/components/radar/BenchVisibilityList";
import { countActiveFilters } from "@/lib/appFilters";
import {
  useOpenFilterSections,
  toggleFilterSection,
  type SectionKey,
} from "@/lib/filterSectionState";
import clsx from "clsx";

const STATUS_ORDER: LabTestMeanStatus[] = [
  "in-project",
  "operational",
  "mothballed",
  "out-of-service",
];

// Type filter laid out on two rows: short labels together on row 1, the long
// ones (SIMULATOR, SHARED RESOURCE) on row 2 where they get half-width each and
// stay readable instead of being truncated.
const TYPE_ROWS: LabTestMeanType[][] = [
  ["SIB", "FIB", "RT"],
  ["SIMU", "SHARE"],
];

// Tri-state sliding switch, left → right. The knob is green for "with"/"all"
// and red for "without" (see the requested toggle.gif visual).
const PHOTO_STATES: { value: PhotoFilter; label: string; tone: "on" | "off" }[] =
  [
    { value: "with", label: "With photo", tone: "on" },
    { value: "all", label: "All", tone: "on" },
    { value: "without", label: "Without photo", tone: "off" },
  ];

// Same tri-state sliding switch as PHOTO_STATES, ALL in the middle position.
const QUALITY_SEAL_STATES: { value: QualitySealFilter; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "all", label: "All" },
  { value: "released", label: "Released" },
];

export type FilterValue = {
  search: string;
  photo: PhotoFilter;
  qualitySeal: QualitySealFilter;
  types: LabTestMeanType[];
  statuses: LabTestMeanStatus[];
  countries: string[];
  programNodeIds: string[];
  complexities: string[];
  portfolios: string[];
  /** Benches ticked off one by one in the "Displayed LTM" chapter. An axis of
   * the filter like any other — that is what makes it shared across the three
   * pages, persisted with the rest and cleared by "Clear All" — but applied
   * after the coarse ones, see `lib/useFilteredLabTestMeans.ts`. */
  excludedIds: string[];
};

type Props = {
  types: LabTestMeanType[];
  statuses: LabTestMeanStatus[];
  countries: string[];
  tree: AircraftStructureNode[];
  programCounts: Map<string, number>;
  hasUnassignedPrograms: boolean;
  complexities: string[];
  portfolios: string[];
  value: FilterValue;
  onChange: (v: FilterValue) => void;
  /** Empties every axis. Separate from `onChange` because it also has to
   * re-collapse the program tree — see `resetToken` in `lib/appFilters.ts`. */
  onClear: () => void;
  /** Contents of the ACTIONS block. The block is absent altogether when this
   * is omitted, which is how the map and the dependency view opt out without
   * the bar knowing which page it is on. */
  actions?: ReactNode;
  /** Candidates for the "Displayed LTM" chapter — the benches the coarse axes
   * kept, *before* exclusions. Omitted means the chapter is not rendered. */
  selectableBenches?: LabTestMean[];
  /** Bumped by "Clear All" to re-mount `TreeFilter`, whose expanded nodes are
   * local state that emptying `programNodeIds` cannot reach. */
  programResetToken?: number;
  /** How many lab test means remain under a hypothetical filter value, for
   * the per-option counts on the chips. Omitted → no counts. */
  previewCount?: (next: FilterValue) => number;
};

function Toggle<T extends string>({
  options,
  value,
  onChange,
  renderLabel,
  optionClassName,
  cols,
  previewCount,
}: Readonly<{
  options: T[];
  value: T[];
  onChange: (v: T[]) => void;
  renderLabel?: (o: T) => string;
  optionClassName?: (o: T) => string | undefined;
  cols?: number;
  /** How many lab test means remain if this chapter held exactly
   * `nextValues`, every other axis unchanged. Bound per chapter by the
   * caller; absent → no counts shown. */
  previewCount?: (nextValues: T[]) => number;
}>) {
  const containerClass = cols ? "grid gap-1.5" : "flex flex-wrap gap-1.5";
  const containerStyle = cols
    ? { gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }
    : undefined;
  /* Facet counts: each option is measured with *itself alone* on this axis,
   * the other axes kept as they are. So ticking a second option of the same
   * chapter leaves every count here untouched — only a filter set in another
   * chapter moves them. Counting the toggled selection instead (what a click
   * would yield) made an option's own number jump to the unfiltered total as
   * soon as it was selected, which read as noise.
   *
   * One filtering pass per option, recomputed when the options or the
   * selection change — a linear scan over a few hundred benches, so the whole
   * chapter costs less than a render of the cards behind it. */
  const preview = useMemo(() => {
    if (!previewCount) return null;
    return new Map(options.map((o) => [o, previewCount([o])]));
  }, [options, previewCount]);
  return (
    <div className={containerClass} style={containerStyle}>
      {options.map((o) => {
        const active = value.includes(o);
        const count = preview?.get(o) ?? null;
        return (
          <button
            key={o}
            type="button"
            aria-pressed={active}
            onClick={() =>
              onChange(active ? value.filter((v) => v !== o) : [...value, o])
            }
            className={clsx(
              "relative px-3 py-2 rounded-lg text-[11px] font-medium border transition-colors text-left",
              active
                ? "bg-accent text-accent-fg border-accent"
                : "bg-surface-2 text-fg border-transparent hover:border-accent/50",
              optionClassName?.(o)
            )}
          >
            {/* Wrapped, not truncated. In the 340px panel a two-column chapter
              * leaves about a hundred pixels of text per chip — less than
              * "Out of Service" needs, and portfolio names have no length
              * limit at all. Truncating hid the difference between two labels
              * sharing a prefix, with no tooltip to recover it. Grid items
              * stretch, so a chip that takes two lines simply makes its row
              * taller and its neighbour follows.
              *
              * `break-words` is what saves a long unbroken name; the count
              * stays out of the flow, so it never moves. */}
            <span
              className={clsx(
                "block break-words leading-tight",
                previewCount && "pr-6",
              )}
            >
              {renderLabel ? renderLabel(o) : o}
            </span>
            {count !== null && (
              <span
                className={clsx(
                  "absolute right-2 top-1/2 -translate-y-1/2 text-[10px] tabular-nums",
                  active ? "text-accent-fg/80" : "text-muted",
                )}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// Tri-state sliding switch shared by "Photo" and "Quality seal" — same knob
// animation and radiogroup semantics, parameterized by the states array.
function TriToggle<T extends string>({
  label,
  ariaLabel,
  states,
  value,
  onChange,
}: Readonly<{
  /** Omitted inside a `FilterSection`, whose header already names the axis. */
  label?: string;
  ariaLabel: string;
  states: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}>) {
  const index = Math.max(
    0,
    states.findIndex((s) => s.value === value),
  );
  const current = states[index];
  return (
    <div>
      {label && (
        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted mb-1">
          {label}
        </div>
      )}
      <div className="flex items-center gap-2">
        <div
          role="radiogroup"
          aria-label={ariaLabel}
          className="relative inline-flex h-[22px] w-14 shrink-0 rounded-full bg-[#00205B] p-[3px] shadow-inner"
        >
          <span
            aria-hidden
            className="pointer-events-none absolute top-[3px] left-[3px] z-20 h-4 w-4 rounded-full shadow transition-transform duration-200 ease-out"
            style={{
              transform: `translateX(${index * 17}px)`,
              backgroundColor: "var(--color-bg)",
            }}
          />
          {states.map((s) => (
            <button // NOSONAR: custom pill toggle kept as role="radio", not native <input type="radio"> (would need a full visual rebuild), see correction-issues-sonarqube.md
              key={s.value}
              type="button"
              role="radio"
              aria-checked={value === s.value}
              aria-label={s.label}
              title={s.label}
              onClick={() => onChange(s.value)}
              className="relative z-10 flex-1 rounded-full bg-transparent focus:outline-none"
            />
          ))}
        </div>
        <span className="text-[11px] font-medium text-fg">{current.label}</span>
      </div>
    </div>
  );
}

/** Level-1 block title — "ACTIONS" and "FILTERING". Structural label, not a
 * control: it never folds, never takes focus. Only its size sets it apart
 * from the level-2 chapter headings below. `action` is the slot where
 * FILTERING puts its "Clear All" link. */
function BlockTitle({
  id,
  action,
  children,
}: Readonly<{ id: string; action?: ReactNode; children: ReactNode }>) {
  return (
    <div className="flex items-baseline gap-2 mb-2">
      <h3
        id={id}
        className="text-sm font-bold uppercase tracking-[0.18em] text-muted"
      >
        {children}
      </h3>
      {action && <span className="ml-auto">{action}</span>}
    </div>
  );
}

/** Empties one axis, shown in that axis's chapter header only while it holds a
 * selection — an always-visible link on an untouched axis would read as an
 * action that does nothing. Distinct from the panel's "Clear All". */
function ClearAxisButton({ onClear }: Readonly<{ onClear: () => void }>) {
  return (
    <button
      type="button"
      onClick={onClear}
      className="shrink-0 text-[10px] font-medium normal-case tracking-normal text-muted underline underline-offset-2 hover:text-accent"
    >
      Clear
    </button>
  );
}

export default function FilterBar({
  types,
  statuses,
  countries,
  tree,
  programCounts,
  hasUnassignedPrograms,
  complexities,
  portfolios,
  value,
  onChange,
  onClear,
  actions,
  selectableBenches,
  programResetToken = 0,
  previewCount,
}: Readonly<Props>) {
  // The desktop panel and the mobile sheet both mount a FilterBar, so the
  // block ids have to be unique per instance.
  const panelId = useId();
  // Folded by default, unfolded chapters restored from local storage. Shared
  // by every mounted panel, and left alone by a filter reset: emptying the
  // filters isn't a display change.
  const openSections = useOpenFilterSections();
  // What each chapter contributes to the filter, shown on its header so a
  // folded chapter can't narrow the result unnoticed.
  const counts = useMemo<Record<SectionKey, number>>(
    () => ({
      photo: value.photo !== "all" ? 1 : 0,
      qualitySeal: value.qualitySeal !== "all" ? 1 : 0,
      type: value.types.length,
      status: value.statuses.length,
      country: value.countries.length,
      portfolio: value.portfolios.length,
      complexity: value.complexities.length,
      programs: value.programNodeIds.length,
      // Only the exclusions that bear on the current result: one that no
      // longer matches anything has nothing to report.
      benches: (selectableBenches ?? []).filter((b) =>
        value.excludedIds.includes(b.externalId),
      ).length,
    }),
    [value, selectableBenches],
  );
  const section = (key: SectionKey) => ({
    open: openSections.has(key),
    onToggle: () => toggleFilterSection(key),
    count: counts[key],
  });
  const typeRows = useMemo(() => {
    const present = new Set(types);
    return TYPE_ROWS.map((row) => row.filter((t) => present.has(t))).filter(
      (row) => row.length > 0,
    );
  }, [types]);
  const sortedCountries = useMemo(
    () => countries.filter((c) => c !== "Unknown"),
    [countries],
  );
  const sortedComplexities = useMemo(
    () => complexities.filter((c) => c !== COMPLEXITY_NA),
    [complexities],
  );
  const sortedStatuses = useMemo(
    () =>
      [...statuses].sort(
        (a, b) => STATUS_ORDER.indexOf(a) - STATUS_ORDER.indexOf(b),
      ),
    [statuses],
  );
  return (
    <div className="space-y-6">
      {actions && (
        <section aria-labelledby={`${panelId}-actions`}>
          <BlockTitle id={`${panelId}-actions`}>Actions</BlockTitle>
          {actions}
        </section>
      )}
      <section aria-labelledby={`${panelId}-filtering`}>
        <BlockTitle
          id={`${panelId}-filtering`}
          action={
            // Nothing to clear, nothing to show.
            countActiveFilters(value) > 0 ? (
              <button
                type="button"
                onClick={onClear}
                className="text-[11px] font-medium text-muted underline underline-offset-2 hover:text-accent"
              >
                Clear All
              </button>
            ) : undefined
          }
        >
          Filtering
        </BlockTitle>
        <div className="space-y-3">
          <input
            type="search"
            placeholder="Search lab test means, references, managers…"
            // Fully controlled from the shared store, with no local mirror: the
            // desktop panel and the mobile sheet are mounted at the same time,
            // and a local copy in each would let them drift apart.
            value={value.search}
            onChange={(e) => onChange({ ...value, search: e.target.value })}
            className="w-full px-3 py-1.5 rounded bg-surface border border-border text-sm text-fg placeholder:text-muted focus:outline-none focus:border-accent"
          />
          <FilterSection label="Photo" {...section("photo")}>
            <TriToggle
              ariaLabel="Photo filter"
              states={PHOTO_STATES}
              value={value.photo}
              onChange={(v) => onChange({ ...value, photo: v })}
            />
          </FilterSection>
          <FilterSection label="Quality seal" {...section("qualitySeal")}>
            <TriToggle
              ariaLabel="Quality seal filter"
              states={QUALITY_SEAL_STATES}
              value={value.qualitySeal}
              onChange={(v) => onChange({ ...value, qualitySeal: v })}
            />
          </FilterSection>
          <FilterSection
            label="Type"
            {...section("type")}
            action={
              value.types.length > 0 ? (
                <ClearAxisButton
                  onClear={() => onChange({ ...value, types: [] })}
                />
              ) : undefined
            }
          >
            <div className="space-y-1">
              {typeRows.map((row) => (
                <Toggle
                  key={row.join("-")}
                  options={row}
                  value={value.types}
                  onChange={(v) => onChange({ ...value, types: v })}
                  previewCount={
                    previewCount && ((v) => previewCount({ ...value, types: v }))
                  }
                  renderLabel={(t) => TYPE_LABELS[t]}
                  optionClassName={(t) =>
                    t === "SHARE" ? "!text-[10px]" : undefined
                  }
                  cols={row.length}
                />
              ))}
            </div>
          </FilterSection>
          <FilterSection
            label="Status"
            {...section("status")}
            action={
              value.statuses.length > 0 ? (
                <ClearAxisButton
                  onClear={() => onChange({ ...value, statuses: [] })}
                />
              ) : undefined
            }
          >
            <Toggle
              options={sortedStatuses}
              value={value.statuses}
              onChange={(v) => onChange({ ...value, statuses: v })}
              previewCount={
                previewCount && ((v) => previewCount({ ...value, statuses: v }))
              }
              renderLabel={(s) => STATUS_LABELS[s]}
              cols={2}
            />
          </FilterSection>
          <FilterSection
            label="Country"
            {...section("country")}
            action={
              value.countries.length > 0 ? (
                <ClearAxisButton
                  onClear={() => onChange({ ...value, countries: [] })}
                />
              ) : undefined
            }
          >
            <Toggle
              options={sortedCountries}
              value={value.countries}
              onChange={(v) => onChange({ ...value, countries: v })}
              previewCount={
                previewCount && ((v) => previewCount({ ...value, countries: v }))
              }
              cols={2}
            />
          </FilterSection>
          <FilterSection
            label="Portfolio"
            {...section("portfolio")}
            action={
              value.portfolios.length > 0 ? (
                <ClearAxisButton
                  onClear={() => onChange({ ...value, portfolios: [] })}
                />
              ) : undefined
            }
          >
            <Toggle
              options={portfolios}
              value={value.portfolios}
              onChange={(v) => onChange({ ...value, portfolios: v })}
              previewCount={
                previewCount && ((v) => previewCount({ ...value, portfolios: v }))
              }
              renderLabel={(p) => (p === PORTFOLIO_NONE ? "None" : p)}
              // Portfolio names are the longest labels in the panel and have
              // no length limit at all — "LTM DEVELOPMENT" needs the smaller
              // size to break as two whole words in a half-width chip instead
              // of splitting mid-word. `!` because the base `text-[11px]` is
              // an arbitrary value of equal specificity, so class order in the
              // attribute would not decide the winner. Same trick as the
              // SHARE label in the Type chapter above.
              optionClassName={() => "!text-[10px]"}
              cols={2}
            />
          </FilterSection>
          <FilterSection
            label="Complexity"
            {...section("complexity")}
            action={
              value.complexities.length > 0 ? (
                <ClearAxisButton
                  onClear={() => onChange({ ...value, complexities: [] })}
                />
              ) : undefined
            }
          >
            <Toggle
              options={sortedComplexities}
              value={value.complexities}
              onChange={(v) => onChange({ ...value, complexities: v })}
              previewCount={
                previewCount && ((v) => previewCount({ ...value, complexities: v }))
              }
              renderLabel={(c) => c.charAt(0).toUpperCase() + c.slice(1)}
              // Two columns, like every other chip chapter — the three values
              // (Simple / Medium / Complex) wrap as 2 + 1 instead of being
              // squeezed onto a single row, which left each chip too narrow
              // for its label plus its count.
              cols={2}
            />
          </FilterSection>
          {(tree.length > 0 || hasUnassignedPrograms) && (
            <FilterSection
              label="Aircraft programs"
              {...section("programs")}
              action={
                value.programNodeIds.length > 0 ? (
                  <ClearAxisButton
                    onClear={() => onChange({ ...value, programNodeIds: [] })}
                  />
                ) : undefined
              }
            >
              <TreeFilter
                // Re-mounted by "Clear All": the expanded nodes are local
                // state that emptying `programNodeIds` cannot reach.
                key={programResetToken}
                tree={tree}
                hasUnassigned={hasUnassignedPrograms}
                selectedIds={value.programNodeIds}
                counts={programCounts}
                onChange={(v) => onChange({ ...value, programNodeIds: v })}
              />
            </FilterSection>
          )}
          {selectableBenches && (
            <FilterSection
              label="Displayed LTM"
              {...section("benches")}
              action={
                value.excludedIds.length > 0 ? (
                  <ClearAxisButton
                    onClear={() => onChange({ ...value, excludedIds: [] })}
                  />
                ) : undefined
              }
            >
              <BenchVisibilityList
                benches={selectableBenches}
                excludedIds={value.excludedIds}
                onChange={(v) => onChange({ ...value, excludedIds: v })}
              />
            </FilterSection>
          )}
        </div>
      </section>
    </div>
  );
}
