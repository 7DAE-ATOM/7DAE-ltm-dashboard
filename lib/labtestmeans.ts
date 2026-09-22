import { fetchLabTestMean, fetchLabTestMeans } from "./atom-api";
import { toLabTestMean } from "./labtestmean-adapter";
import type {
  Complexity,
  LabTestMean,
  LabTestMeanStatus,
  LabTestMeanType,
  PhotoFilter,
  QualitySealFilter,
} from "./types";

export async function getLabTestMeans(): Promise<LabTestMean[]> {
  const dtos = await fetchLabTestMeans();
  return dtos.map(toLabTestMean);
}

export async function getLabTestMeanByExternalId(
  externalId: string,
): Promise<LabTestMean | null> {
  const dto = await fetchLabTestMean(externalId);
  return dto ? toLabTestMean(dto) : null;
}

/** Sentinel option in the Portfolio filter that matches LTMs with `portfolio === null`. */
export const PORTFOLIO_NONE = "__none__";

/** Sentinel option in the Complexity filter that matches LTMs with `complexity === null`. */
export const COMPLEXITY_NA = "__na__";

export type Filters = {
  search?: string;
  photo?: PhotoFilter;
  qualitySeal?: QualitySealFilter;
  types?: LabTestMeanType[];
  statuses?: LabTestMeanStatus[];
  countries?: string[];
  programNodeNames?: Set<string>;
  includeUnassignedPrograms?: boolean;
  complexities?: string[];
  portfolios?: string[];
};

function matchesPhoto(m: LabTestMean, f: Filters): boolean {
  if (f.photo === "with" && m.photos.length === 0) return false;
  if (f.photo === "without" && m.photos.length > 0) return false;
  return true;
}

function matchesQualitySeal(m: LabTestMean, f: Filters): boolean {
  if (f.qualitySeal === "draft" && m.lxState !== "DRAFT") return false;
  if (f.qualitySeal === "released" && m.lxState !== "RELEASE") return false;
  return true;
}

function matchesTypeStatusCountry(m: LabTestMean, f: Filters): boolean {
  if (f.types?.length && !f.types.includes(m.type)) return false;
  if (f.statuses?.length && !f.statuses.includes(m.status)) return false;
  if (f.countries?.length && !f.countries.includes(m.location.country))
    return false;
  return true;
}

function matchesProgram(m: LabTestMean, f: Filters): boolean {
  const programFilterActive =
    (f.programNodeNames && f.programNodeNames.size > 0) ||
    f.includeUnassignedPrograms;
  if (!programFilterActive) return true;
  if (m.programs.length === 0) return !!f.includeUnassignedPrograms;
  return !!f.programNodeNames && m.programs.some((p) => f.programNodeNames!.has(p));
}

function matchesComplexity(m: LabTestMean, f: Filters): boolean {
  if (!f.complexities?.length) return true;
  if (m.complexity == null) return f.complexities.includes(COMPLEXITY_NA);
  return f.complexities.includes(m.complexity);
}

function matchesPortfolio(m: LabTestMean, f: Filters): boolean {
  if (!f.portfolios?.length) return true;
  if (m.portfolio == null) return f.portfolios.includes(PORTFOLIO_NONE);
  return f.portfolios.includes(m.portfolio.name);
}

function matchesSearch(m: LabTestMean, f: Filters): boolean {
  if (!f.search) return true;
  const q = f.search.toLowerCase();
  const hay = [
    m.name,
    m.externalId,
    m.description,
    m.manager?.name ?? "",
    ...m.programs,
    ...m.projects,
  ]
    .join(" ")
    .toLowerCase();
  return hay.includes(q);
}

const FILTER_PREDICATES = [
  matchesPhoto,
  matchesQualitySeal,
  matchesTypeStatusCountry,
  matchesProgram,
  matchesComplexity,
  matchesPortfolio,
  matchesSearch,
];

export function filterLabTestMeans(
  list: LabTestMean[],
  f: Filters,
): LabTestMean[] {
  return list.filter((m) => FILTER_PREDICATES.every((matches) => matches(m, f)));
}

/**
 * The second, finer-grained refinement step: benches the user ticked off
 * one by one in the "Displayed LTM" chapter.
 *
 * Deliberately NOT one of `FILTER_PREDICATES`, although `excludedIds` does
 * live inside `FilterValue` like every other axis. The chapter has to offer
 * the user the benches that the *coarse* filters kept — including the ones
 * already excluded, or unticking would be impossible. So the two steps have
 * to stay separable, and `lib/useFilteredLabTestMeans.ts` applies them in
 * order: `filterLabTestMeans` gives the candidates, this gives what is shown.
 */
export function excludeBenches(
  list: LabTestMean[],
  excludedIds: readonly string[] | undefined,
): LabTestMean[] {
  if (!excludedIds?.length) return list;
  const excluded = new Set(excludedIds);
  return list.filter((m) => !excluded.has(m.externalId));
}

export function uniqueCountries(list: LabTestMean[]): string[] {
  return Array.from(new Set(list.map((m) => m.location.country))).sort((a, b) =>
    a.localeCompare(b),
  );
}
export function uniqueTypes(list: LabTestMean[]): LabTestMeanType[] {
  return Array.from(new Set(list.map((m) => m.type)));
}
export function uniqueStatuses(list: LabTestMean[]): LabTestMeanStatus[] {
  return Array.from(new Set(list.map((m) => m.status)));
}
export function uniqueComplexities(list: LabTestMean[]): string[] {
  const out = new Set<Complexity>();
  let hasNa = false;
  for (const m of list) {
    if (m.complexity) out.add(m.complexity);
    else hasNa = true;
  }
  const result: string[] = Array.from(out);
  if (hasNa) result.push(COMPLEXITY_NA);
  return result;
}
export function uniquePortfolios(list: LabTestMean[]): string[] {
  const names = new Set<string>();
  let hasNone = false;
  for (const m of list) {
    if (m.portfolio) names.add(m.portfolio.name);
    else hasNone = true;
  }
  const sorted = Array.from(names).sort((a, b) => a.localeCompare(b));
  if (hasNone) sorted.push(PORTFOLIO_NONE);
  return sorted;
}
