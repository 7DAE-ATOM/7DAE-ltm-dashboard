/***********************************************************
 * kpiLabTestMeans — The KPI page's data: every LeanIX Solution fact sheet
 * (a Lab Test Mean), with the attributes it is filtered and charted by, its
 * people, its completion and its number of photos.
 *
 * File structure:
 *
 *   1. IMPORTS — the shared crawl; the adapter's type and quality-seal
 *      rules; the label maps of the catalogue.
 *   2. TYPES — KpiLtm, KpiData, the private raw shapes.
 *   3. CONSTANTS — the KPI label maps and display orders, PHOTO_TYPES.
 *   4. FUNCTIONS —
 *      a. buildQuery() — the GraphQL document for one page.
 *      b. readPage() — field-by-field validation of one page.
 *      c. fetchKpiLabTestMeans() — every page, merged (SWR fetcher).
 *
 * WHY GRAPHQL AND NOT /api/infos/labtestmeans. The REST route the
 * catalogue uses lacks what the KPIs are about — completion, `shared`,
 * `cmpAvailability`, `partIS` — and GraphQL is meant to replace the REST
 * routes over time (spec answer 6). So this page reads the synchronizer's
 * read-only LeanIX proxy (`postLeanixQuery`), through the shared crawl.
 *
 * EVERY SOLUTION IS A LAB TEST MEAN (spec answer 7): nothing is excluded.
 *
 * SAME READING AS THE CATALOGUE, so a bench shows the same values on every
 * page of this app:
 *   - type: the adapter's `TYPE_MAP` (category lowercased) with its
 *     `TYPE_LABELS`, except RT which reads "R&T" as the spec asks;
 *   - quality seal: the adapter's `toLxTag` — APPROVED and
 *     BROKEN_QUALITY_SEAL are RELEASE, anything else DRAFT;
 *   - country: `COUNTRY_MAP`; complexity: `COMPLEXITY_LABELS`;
 *   - photo: a document whose `documentType` is "image" or "photo", case
 *     ignored.
 * A value no map knows is kept as it is — never dropped.
 *
 * YES / NO FIELDS (`shared`, `cmpAvailability`, `accesscontrol`, `partIS`)
 * may arrive as booleans or "yes"/"no" strings; both read "Yes"/"No".
 *
 * VALIDATION. A fact sheet without id or name is dropped and counted; a
 * completion missing or outside 0–100 counts as 0 % and is counted, so the
 * page can say so instead of hiding it.
 *
 * Ported from 7DAE-atom-cockpit (`components/statistics/labTestMeans.ts`).
 *
 * Used on: lib/kpi/useKpiLabTestMeans.ts
 ***********************************************************/

import { COMPLEXITY_LABELS, TYPE_LABELS } from "@/lib/labels";
import { COUNTRY_MAP, TYPE_MAP, toLxTag } from "@/lib/labtestmean-adapter";
import { loadAllPages } from "./leanixPages";

/***********************************************************
 * Types
 ***********************************************************/

/** One Lab Test Mean, validated. Values are display labels; null = not set. */
export type KpiLtm = {
  id: string;
  /** LeanIX external id — the detail page's key (`/labtestmean?id=`). */
  externalId: string | null;
  name: string;
  /** 0–100, integer. */
  completion: number;
  seal: "RELEASE" | "DRAFT";
  category: string | null;
  complexity: string | null;
  country: string | null;
  ecLevel: string | null;
  shared: string | null;
  cmp: string | null;
  access: string | null;
  partIS: string | null;
  /** Relations: empty array = not set. */
  portfolio: string[];
  program: string[];
  ata: string[];
  manager: string[];
  projectManager: string[];
  /** Documents of type image / photo. */
  photos: number;
};

export type KpiData = {
  ltms: KpiLtm[];
  /** Fact sheets dropped for lacking an id or a name. */
  dropped: number;
  /** Fact sheets whose completion was missing or out of range. */
  completionFixed: number;
  pages: number;
  /** True when the page limit stopped the crawl before the last page. */
  truncated: boolean;
};

type RawRelation = {
  edges?: { node?: { factSheet?: { name?: unknown } | null } | null }[] | null;
} | null;

type RawNode = {
  id?: unknown;
  name?: unknown;
  externalId?: { externalId?: unknown } | null;
  category?: unknown;
  complexity?: unknown;
  lxState?: unknown;
  country?: unknown;
  completion?: { percentage?: unknown } | null;
  ecLevel?: unknown;
  shared?: unknown;
  cmpAvailability?: unknown;
  accesscontrol?: unknown;
  partIS?: unknown;
  documents?: { edges?: { node?: { documentType?: unknown } | null }[] | null } | null;
  relSolutionToPortfolio?: RawRelation;
  relWorkOnSolutionToAircraftStructure?: RawRelation;
  relSolutionToATA?: RawRelation;
  relLTMmanagerSolutionToUsers?: RawRelation;
  relLtmProMngSolutionToUsers?: RawRelation;
};

/***********************************************************
 * Constants
 ***********************************************************/

/** The catalogue's type labels, RT spelled "R&T" (spec). */
const KPI_TYPE_LABELS: Record<string, string> = { ...TYPE_LABELS, RT: "R&T" };

const EXPORT_CONTROL_LABELS: Record<string, string> = {
  notListed: "Not Listed",
  dualUse: "Dual Use",
  military: "Military",
  bothMilitaryAndDualUse: "Both",
};

/** Display orders — the charts and filter lists follow them. */
export const TYPE_ORDER = ["SIMULATOR", "SIB", "FIB", "R&T", "SHARED RESOURCE"];
export const COMPLEXITY_ORDER = ["Simple", "Medium", "Complex"];
export const EXPORT_CONTROL_ORDER = ["Not Listed", "Dual Use", "Military", "Both"];
export const SEAL_ORDER = ["RELEASE", "DRAFT"];
export const YES_NO_ORDER = ["Yes", "No"];

/** The adapter's rule for "this document is a photo". */
const PHOTO_TYPES = new Set(["image", "photo"]);

/** A relation, read as the names of the related fact sheets. */
const RELATED_NAMES = "{ edges { node { factSheet { name } } } }";

/***********************************************************
 * Functions — the query
 ***********************************************************/

/** The GraphQL document for one page — only the fields the page uses. */
export function buildQuery(after: string | null): string {
  const afterArg = after ? `, after: ${JSON.stringify(after)}` : "";
  return `
query {
  allFactSheets(factSheetType: Solution${afterArg}) {
    pageInfo { hasNextPage endCursor }
    edges {
      node {
        ... on Solution {
          id
          name
          externalId { externalId }
          category
          complexity
          lxState
          country
          completion { percentage }
          ecLevel
          shared
          cmpAvailability
          accesscontrol
          partIS
          documents { edges { node { documentType } } }
          relSolutionToPortfolio ${RELATED_NAMES}
          relWorkOnSolutionToAircraftStructure ${RELATED_NAMES}
          relSolutionToATA ${RELATED_NAMES}
          relLTMmanagerSolutionToUsers ${RELATED_NAMES}
          relLtmProMngSolutionToUsers ${RELATED_NAMES}
        }
      }
    }
  }
}`;
}

/***********************************************************
 * Functions — validation
 ***********************************************************/

function text(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

/** Relation → the distinct, non-empty names of the related fact sheets. */
function names(relation: RawRelation | undefined): string[] {
  const edges = Array.isArray(relation?.edges) ? relation.edges : [];
  const out = new Set<string>();
  for (const edge of edges) {
    const name = text(edge?.node?.factSheet?.name);
    if (name) out.add(name);
  }
  return [...out];
}

function labelled(value: unknown, labels: Record<string, string>): string | null {
  const raw = text(value);
  if (raw === null) return null;
  return labels[raw] ?? raw;
}

/** The category through the adapter's TYPE_MAP, then the KPI label. */
function typeLabel(value: unknown): string | null {
  const raw = text(value);
  if (raw === null) return null;
  const type = TYPE_MAP[raw.toLowerCase()];
  return type ? (KPI_TYPE_LABELS[type] ?? type) : raw;
}

/** A boolean or a "yes"/"no" string → "Yes"/"No"; anything else as sent. */
function yesNo(value: unknown): string | null {
  if (value === true) return "Yes";
  if (value === false) return "No";
  const raw = text(value);
  if (raw === null) return null;
  const lower = raw.toLowerCase();
  if (lower === "yes" || lower === "true") return "Yes";
  if (lower === "no" || lower === "false") return "No";
  return raw;
}

/** An integer 0–100, or null when missing or out of range. */
function readCompletion(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isFinite(raw) && raw >= 0 && raw <= 100) return Math.round(raw);
  return null;
}

function countPhotos(documents: RawNode["documents"]): number {
  const edges = Array.isArray(documents?.edges) ? documents.edges : [];
  return edges.filter((e) => PHOTO_TYPES.has(text(e?.node?.documentType)?.toLowerCase() ?? "")).length;
}

/** One page of `allFactSheets`, or null when it is not one. */
export function readPage(body: unknown): {
  ltms: KpiLtm[];
  dropped: number;
  completionFixed: number;
  hasNextPage: boolean;
  endCursor: string | null;
} | null {
  const page = (body as { data?: { allFactSheets?: unknown } } | null)?.data?.allFactSheets as
    | { edges?: unknown; pageInfo?: { hasNextPage?: unknown; endCursor?: unknown } }
    | undefined;
  if (!page || !Array.isArray(page.edges)) return null;

  const ltms: KpiLtm[] = [];
  let dropped = 0;
  let completionFixed = 0;

  for (const edge of page.edges) {
    const node = ((edge as { node?: unknown } | null)?.node ?? {}) as RawNode;
    const id = text(node.id);
    const name = text(node.name);
    if (!id || !name) {
      dropped++;
      continue;
    }

    const read = readCompletion(node.completion?.percentage);
    if (read === null) completionFixed++;

    ltms.push({
      id,
      externalId: text(node.externalId?.externalId),
      name,
      completion: read ?? 0,
      seal: toLxTag(text(node.lxState)),
      category: typeLabel(node.category),
      complexity: labelled(node.complexity, COMPLEXITY_LABELS),
      country: labelled(node.country, COUNTRY_MAP),
      ecLevel: labelled(node.ecLevel, EXPORT_CONTROL_LABELS),
      shared: yesNo(node.shared),
      cmp: yesNo(node.cmpAvailability),
      access: yesNo(node.accesscontrol),
      partIS: yesNo(node.partIS),
      portfolio: names(node.relSolutionToPortfolio),
      program: names(node.relWorkOnSolutionToAircraftStructure),
      ata: names(node.relSolutionToATA),
      manager: names(node.relLTMmanagerSolutionToUsers),
      projectManager: names(node.relLtmProMngSolutionToUsers),
      photos: countPhotos(node.documents),
    });
  }

  const endCursor = page.pageInfo?.endCursor;
  return {
    ltms,
    dropped,
    completionFixed,
    hasNextPage: page.pageInfo?.hasNextPage === true,
    endCursor: typeof endCursor === "string" ? endCursor : null,
  };
}

/***********************************************************
 * Functions — the fetcher
 ***********************************************************/

/** Every page, merged. Throws on any failure (SWR → app/error.tsx). */
export async function fetchKpiLabTestMeans(): Promise<KpiData> {
  const crawl = await loadAllPages(buildQuery, readPage);
  const ltms = crawl.pages.flatMap((page) => page.ltms);
  ltms.sort((a, b) => a.name.localeCompare(b.name));
  return {
    ltms,
    dropped: crawl.pages.reduce((n, page) => n + page.dropped, 0),
    completionFixed: crawl.pages.reduce((n, page) => n + page.completionFixed, 0),
    pages: crawl.pages.length,
    truncated: crawl.truncated,
  };
}
