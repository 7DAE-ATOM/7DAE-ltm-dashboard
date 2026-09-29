/***********************************************************
 * leanixPages — Every page of one `allFactSheets` query through the
 * synchronizer's read-only LeanIX proxy.
 *
 * File structure:
 *
 *   1. IMPORTS — postLeanixQuery.
 *   2. TYPES — PageCursor, AllPages.
 *   3. CONSTANTS — MAX_PAGES.
 *   4. FUNCTIONS — loadAllPages(): the crawl.
 *
 * EVERY PAGE OR NOTHING. `allFactSheets` is paginated: the crawl follows
 * `pageInfo.endCursor` to the last page. One failing page fails the whole
 * load — it THROWS, like every fetcher of this app, so SWR hands the error
 * to `app/error.tsx`. Figures computed on half the benches would otherwise
 * be presented as the whole.
 *
 * A 200 THAT IS NOT A PAGE (the caller's `readPage` returns null) throws
 * too. A 200 WITH `errors[]` already threw in `postLeanixQuery`.
 *
 * AT MOST MAX_PAGES: a proxy looping on one cursor cannot spin forever.
 * Stopping there, or on a cursor that does not move, is REPORTED
 * (`truncated`), never hidden.
 *
 * BUDGET: 30 s per page, NOT MEASURED — no call may be made without
 * approval (CLAUDE.md). Time the query and adjust: never a budget below
 * the real response time.
 *
 * Ported from 7DAE-atom-cockpit (`components/statistics/leanixPages.ts`),
 * which returns an error union instead of throwing.
 *
 * Used on: lib/kpi/kpiLabTestMeans.ts
 ***********************************************************/

import { postLeanixQuery } from "@/lib/atom-api";

/***********************************************************
 * Types
 ***********************************************************/

/** What every validated page must tell the loop. */
export type PageCursor = { hasNextPage: boolean; endCursor: string | null };

export type AllPages<P> = {
  /** Every validated page, in order. */
  pages: P[];
  /** True when MAX_PAGES (or a stuck cursor) stopped the crawl early. */
  truncated: boolean;
};

/***********************************************************
 * Constants
 ***********************************************************/

export const MAX_PAGES = 100;

/** Per page. Unmeasured — see the header. */
export const PAGE_TIMEOUT_MS = 30_000;

/***********************************************************
 * Functions
 ***********************************************************/

/** Every page, validated by `readPage`. Throws on the first failure. */
export async function loadAllPages<P extends PageCursor>(
  buildQuery: (after: string | null) => string,
  readPage: (body: unknown) => P | null,
): Promise<AllPages<P>> {
  const pages: P[] = [];
  let after: string | null = null;

  for (;;) {
    const body = await postLeanixQuery(buildQuery(after), PAGE_TIMEOUT_MS);
    const page = readPage(body);
    if (page === null) {
      throw new Error("LEANIX_GRAPHQL: the answer is not a LeanIX allFactSheets result.");
    }
    pages.push(page);

    const more = page.hasNextPage && page.endCursor !== null && page.endCursor !== after;
    if (!more || pages.length >= MAX_PAGES) return { pages, truncated: more };
    after = page.endCursor;
  }
}
