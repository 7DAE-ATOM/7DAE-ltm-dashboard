/***********************************************************
 * urlList — The `useUrlState` options of a filter parameter that holds a
 * LIST of values (`?portfolio=Avionics|Cabin`).
 *
 * File structure:
 *
 *   1. CONSTANTS — SEPARATOR.
 *   2. CONSTANTS — URL_LIST: default, parse, serialize.
 *
 * "|" rather than "," because LeanIX names may contain commas; a value
 * containing "|" itself cannot be expressed — accepted, none is known.
 * Empty pieces and duplicates in a hand-edited link are dropped. The empty
 * list is the default, so it never appears in the address.
 *
 * Spread into each call: `useUrlState({ param: "portfolio", ...URL_LIST })`.
 *
 * Used on: components/kpi/KpiClient.tsx
 ***********************************************************/

export const SEPARATOR = "|";

export const URL_LIST = {
  defaultValue: [] as string[],
  parse: (t: string) => {
    const values = [...new Set(t.split(SEPARATOR).map((v) => v.trim()).filter(Boolean))];
    return values.length ? values : null;
  },
  serialize: (v: string[]) => v.join(SEPARATOR),
};
