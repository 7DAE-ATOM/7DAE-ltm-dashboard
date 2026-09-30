/***********************************************************
 * useUrlState — Service 09: one piece of view state, kept in the address.
 *
 * File structure:
 *
 *   1. IMPORTS — React hooks, Next's navigation hooks.
 *   2. TYPES — UrlStateOptions, UrlStateMeta.
 *   3. HOOK — useUrlState():
 *      a. Read — raw parameter → parsed → validated → constrained (§4.1).
 *      b. Write — default removes the parameter, other parameters kept,
 *         no write when nothing changes, history REPLACED, no scroll (§4.2).
 *      c. Effect — canonical correction after render, idempotent (§4.3).
 *
 * Ported from 7DAE-atom-cockpit, where it is service 09 (spec
 * `_specification/services/09-etat-dans-url.md` there). What it guarantees,
 * and why each point lives here rather than in every caller:
 *
 *   - THE ADDRESS IS THE ONLY SOURCE OF TRUTH (§3.2). The value is re-read
 *     from the URL on every render and never copied into React state — so
 *     the browser's back/forward buttons, which change the URL without
 *     touching application code, are followed for free.
 *   - EVERY READ IS VALIDATED AND CONSTRAINED (§3.3). A hand-edited absurd
 *     value, or one outside the caller's current domain, gives the default —
 *     never an error, never a broken view.
 *   - THE DEFAULT IS ABSENT FROM THE ADDRESS (§3.5). One view, one address.
 *   - WRITES REPLACE, THEY DO NOT STACK (§3.4), and never scroll (§3.6).
 *   - OTHER PARAMETERS ARE PRESERVED (§4.2): unknown ones may belong to
 *     another state or to a tracking tool, and must survive untouched.
 *   - THE CORRECTION IS IDEMPOTENT (§4.3): on an already canonical address it
 *     writes nothing — otherwise it would re-trigger itself forever.
 *
 * STATIC EXPORT: `useSearchParams` makes a component bail out of
 * prerendering. Every page using this hook must wrap the client island that
 * calls it in `<Suspense>`, or `npm run build` fails — `npm run dev` does
 * not show the problem.
 *
 * Used on: components/kpi/KpiClient.tsx (the KPI page's filters and table
 *          order). The catalogue keeps its filters in sessionStorage
 *          (lib/appFilters.ts) and its page in `?page=` (usePageQuery).
 ***********************************************************/

"use client";

import { useCallback, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/***********************************************************
 * Types
 ***********************************************************/

export type UrlStateOptions<T> = {
  /**
   * Name in the address. Short, stable, non-technical (§5): it survives in
   * saved links long after the version that produced it.
   */
  param: string;
  /** The value that never appears in the address. */
  defaultValue: T;
  /** Text → a valid value, or `null` when the text is not one. */
  parse: (text: string) => T | null;
  /** Value → text. Two equal values must serialize identically. */
  serialize: (value: T) => string;
  /**
   * Optional current domain (§3.3, second step). Depends on data only the
   * caller knows — how many pages exist now, for instance.
   */
  inDomain?: (value: T) => boolean;
};

export type UrlStateMeta = {
  /**
   * Whether the address carried a USABLE value for this parameter. False
   * when it was absent, invalid or out of domain. Lets a caller fall back to
   * something else (a remembered preference) only when the link said nothing.
   */
  present: boolean;
  /** The raw text in the address, for inspection. */
  raw: string | null;
  /** Whether the address is already in its canonical form for this param. */
  canonical: boolean;
};

/***********************************************************
 * Hook
 ***********************************************************/

export function useUrlState<T>({
  param,
  defaultValue,
  parse,
  serialize,
  inDomain,
}: UrlStateOptions<T>): [T, (next: T) => void, UrlStateMeta] {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  /***********************************************************
   * Read — §4.1
   ***********************************************************/

  const raw = searchParams.get(param);
  const parsed = raw === null ? null : parse(raw);
  const valid = parsed !== null && (inDomain ? inDomain(parsed) : true);
  const value = valid ? (parsed as T) : defaultValue;

  const defaultText = serialize(defaultValue);
  // Canonical = absent, or present with the exact text of a non-default
  // valid value ("?page=02" is valid but not canonical: it becomes "2").
  const canonical =
    raw === null ||
    (valid && raw === serialize(value) && serialize(value) !== defaultText);

  /***********************************************************
   * Write — §4.2
   ***********************************************************/

  const query = searchParams.toString();

  const setValue = useCallback(
    (next: T) => {
      const params = new URLSearchParams(query);
      const text = serialize(next);
      if (text === defaultText) params.delete(param);
      else params.set(param, text);

      const nextQuery = params.toString();
      if (nextQuery === query) return; // nothing to do — no render loop

      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
        scroll: false,
      });
    },
    // `serialize` is expected to be stable in behaviour; it is not a dep so
    // an inline arrow at the call site does not rebuild the setter each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [query, pathname, router, param, defaultText],
  );

  /***********************************************************
   * Effect — canonical correction, §4.3
   ***********************************************************/

  useEffect(() => {
    // Rewrites an invalid, out-of-domain, default-valued or non-canonical
    // parameter. On a canonical address `canonical` is true and nothing runs.
    if (!canonical) setValue(value);
    // `value` is derived from `raw`, which is already represented by `canonical`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canonical, raw, setValue]);

  return [value, setValue, { present: valid, raw, canonical }];
}
