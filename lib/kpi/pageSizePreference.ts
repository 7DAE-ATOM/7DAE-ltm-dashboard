/***********************************************************
 * pageSizePreference — How many rows per page the reader wants in the KPI
 * table, remembered by the browser.
 *
 * File structure:
 *
 *   1. IMPORTS — createPersistedStore.
 *   2. TYPES — PageSize.
 *   3. CONSTANTS — PAGE_SIZES (every valid value), pageSizePreference.
 *
 * A DISPLAY PREFERENCE, hence `localStorage`: it outlives the tab and
 * follows the reader across tabs. `parse` accepts only a listed size — a
 * hand-edited or stale value falls back to the default rather than
 * rendering 7 or 10 000 rows. Its own key: the catalogue's density is a
 * different preference.
 *
 * The CURRENT PAGE is not stored anywhere: it is local state of the table
 * and goes back to 1 whenever the scope changes (see KpiTable).
 *
 * Used on: components/kpi/TablePagination.tsx, components/kpi/KpiTable.tsx
 ***********************************************************/

import { createPersistedStore } from "@/lib/createPersistedStore";

/***********************************************************
 * Types
 ***********************************************************/

export type PageSize = 10 | 25 | 50 | 100;

/***********************************************************
 * Constants
 ***********************************************************/

export const PAGE_SIZES: PageSize[] = [10, 25, 50, 100];

export const pageSizePreference = createPersistedStore<PageSize>({
  key: "kpi-page-size",
  storage: "local",
  defaultValue: 10,
  parse: (raw) => {
    const value: unknown = JSON.parse(raw);
    return PAGE_SIZES.includes(value as PageSize) ? (value as PageSize) : null;
  },
});
