"use client";

import Link from "next/link";
import GraphIcon from "@/components/icons/GraphIcon";
import PdfIcon from "@/components/icons/PdfIcon";
import SpinnerIcon from "@/components/icons/SpinnerIcon";

type Props = {
  /** Lab test means currently matching the filters — shown in each tooltip. */
  count: number;
  isExporting: boolean;
  onExportPdf: () => void;
  /** `null` when there is nothing to open (no match) — an `<a>` has no
   * `disabled`, so that case renders a real disabled button instead. */
  depgraphHref: string | null;
  onDepgraphClick: (e: React.MouseEvent<HTMLAnchorElement>) => void;
};

/** Shared by the two icon actions so they stay visually identical — one is a
 * <button>, the other a <Link>. Round pill, solid glyph, no border. */
const ACTION_BUTTON_CLASS =
  "inline-flex h-11 w-11 items-center justify-center rounded-full bg-surface text-accent shadow-sm transition-colors hover:bg-accent/10 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent";

/** Styled tooltip under the button, carrying the full label *and* the exact
 * count — a badge pinned to the icon could not show more than two digits.
 * Shown on hover and on keyboard focus; never intercepts the pointer, so it
 * can't swallow a click. */
function ActionTooltip({ label }: Readonly<{ label: string }>) {
  return (
    <span
      role="tooltip"
      className="pointer-events-none absolute left-1/2 top-full z-30 mt-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-fg px-3 py-1.5 text-xs font-medium text-bg shadow-lg group-hover:block group-focus-within:block"
    >
      <span
        aria-hidden="true"
        className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-fg"
      />
      {label}
    </span>
  );
}

/**
 * The two quick actions — Export PDF and Open in Dependency Graph — rendered
 * as round icon buttons for the filter panel's "ACTIONS" block on the
 * catalogue. Purely presentational: every behaviour (PDF generation, the
 * graph URL and its threshold) lives in `useCatalogueActions`.
 */
export default function CatalogueActions({
  count,
  isExporting,
  onExportPdf,
  depgraphHref,
  onDepgraphClick,
}: Readonly<Props>) {
  const exportLabel = isExporting ? "Generating PDF…" : `Export PDF (${count})`;
  const depgraphLabel = `Open in Dependency Graph (${count})`;

  return (
    <div className="flex items-center gap-3">
      <div className="group relative">
        <button
          type="button"
          onClick={onExportPdf}
          disabled={count === 0 || isExporting}
          aria-label={exportLabel}
          className={ACTION_BUTTON_CLASS}
        >
          {isExporting ? (
            <SpinnerIcon size={21} className="animate-spin" />
          ) : (
            <PdfIcon size={21} />
          )}
        </button>
        <ActionTooltip label={exportLabel} />
      </div>

      <div className="group relative">
        {depgraphHref === null ? (
          <button
            type="button"
            disabled
            aria-label={depgraphLabel}
            className={ACTION_BUTTON_CLASS}
          >
            <GraphIcon size={21} />
          </button>
        ) : (
          <Link
            href={depgraphHref}
            prefetch={false}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onDepgraphClick}
            aria-label={depgraphLabel}
            className={ACTION_BUTTON_CLASS}
          >
            <GraphIcon size={21} />
          </Link>
        )}
        <ActionTooltip label={depgraphLabel} />
      </div>
    </div>
  );
}
