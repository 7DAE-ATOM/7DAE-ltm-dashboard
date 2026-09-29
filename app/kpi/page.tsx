import { Suspense } from "react";
import KpiClient from "@/components/kpi/KpiClient";

/**
 * KPI — the data quality of the Lab Test Means (filters, charts, photos,
 * table). A server component: all state and data live in `KpiClient`.
 * The Suspense boundary is required because KpiClient reads the address
 * (`useSearchParams`, via useUrlState): the static export fails without it.
 */
export default function KpiPage() {
  return (
    <Suspense>
      <KpiClient />
    </Suspense>
  );
}
