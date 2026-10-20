const BASE_PATH = process.env.NEXT_PUBLIC_BASE_HREF ?? "";

/** URL of a Lab Test Mean's detail page, **for a plain `<a href>`** (the
 * radar's SVG labels) or a link written into an export (the PDF) — anything
 * `next/link` does not build. `next/link` prefixes the gateway context
 * (`/atom-ltm-dashboard`, val and prod builds) on its own; a raw anchor does
 * not, and its bare `/labtestmean?id=…` lands outside the app, which 404s
 * behind the AFTER gateway and only there. So never pass this to
 * `next/link`: the prefix would be doubled. Empty prefix in dev. Trailing
 * slash per `trailingSlash: true`, so nginx serves the page instead of
 * answering with a redirect first. */
export function labTestMeanHref(externalId: string): string {
  return `${BASE_PATH}/labtestmean/?id=${encodeURIComponent(externalId)}`;
}
