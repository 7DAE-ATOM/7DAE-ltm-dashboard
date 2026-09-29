/***********************************************************
 * useKpiLabTestMeans — The KPI page's data, loaded once per session through
 * SWR and shared with the Header's refresh button.
 *
 * File structure:
 *
 *   1. IMPORTS — useSWR, the fetcher and its type.
 *   2. CONSTANTS — SWR_KEY_KPI.
 *   3. HOOK — useKpiLabTestMeans(): data, loading, error.
 *
 * SAME CONTRACT AS useLabTestMeans. SWR is configured in `app/providers.tsx`
 * to load once and never revalidate on its own; the Header's "Refresh data"
 * (`components/RefreshButton.tsx`) re-fetches this key with the others. It
 * is only ever fetched on the KPI page — the other pages do not pay for it.
 *
 * Errors are RETURNED, and the page throws them so `app/error.tsx` shows
 * them with its "Try again" — the convention of every page of this app.
 *
 * Used on: components/kpi/KpiClient.tsx, components/RefreshButton.tsx (key)
 ***********************************************************/

"use client";

import useSWR from "swr";
import { fetchKpiLabTestMeans, type KpiData } from "./kpiLabTestMeans";

export const SWR_KEY_KPI = "kpi-labtestmeans";

export function useKpiLabTestMeans(): { data: KpiData | null; loading: boolean; error: Error | null } {
  const { data, error } = useSWR(SWR_KEY_KPI, fetchKpiLabTestMeans);
  return { data: data ?? null, loading: !data && !error, error: (error as Error | undefined) ?? null };
}
