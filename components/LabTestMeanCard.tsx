"use client";

import Link from "next/link";
import clsx from "clsx";
import type { LabTestMean } from "@/lib/types";
import { usePhoto } from "@/lib/usePhoto";
import PhotoSpinner from "./PhotoSpinner";
import ChipType from "./ChipType";
import BadgeStatus from "./BadgeStatus";
import BadgeQualitySeal from "./BadgeQualitySeal";
import ChipAccessControl from "./ChipAccessControl";

export default function LabTestMeanCard({
  labTestMean,
  compact = false,
}: Readonly<{
  labTestMean: LabTestMean;
  /** Set once the grid packs 8 cards per row (`COMPACT_COLUMNS`), where each
   * one is barely 150px wide: the 4:3 cover and the secondary chips stop being
   * readable long before the name does, so they give way first. */
  compact?: boolean;
}>) {
  const { url: coverSrc, isLoading: coverLoading } = usePhoto(
    labTestMean.coverPhoto?.id ?? "",
    labTestMean.coverPhoto?.uri ?? "",
  );

  return (
    <Link
      href={`/labtestmean?id=${encodeURIComponent(labTestMean.externalId)}`}
      // No prefetch: every detail link resolves to the SAME static page
      // (/labtestmean, the ?id= is read client-side), so Next's viewport
      // prefetch would just refetch the same shell per card and spam the gateway
      // with 301/403 on load. Navigation still works on click.
      prefetch={false}
      // `flex h-full flex-col` rather than `block`: grid items stretch, so the
      // card fills its row and the status badge can be pinned to the bottom
      // (see `mt-auto` below) instead of floating wherever a one- or two-line
      // name happens to end.
      className="bench-card group flex h-full flex-col overflow-hidden rounded-card transition-all duration-200"
    >
      <div
        className={clsx(
          // `shrink-0` so the cover keeps its aspect ratio instead of being
          // squeezed when the body below is the taller part of the card.
          "relative shrink-0 overflow-hidden bg-surface-2",
          compact ? "aspect-[16/9]" : "aspect-[4/3]",
        )}
      >
        <img
          src={coverSrc}
          alt={labTestMean.name}
          className="w-full h-full object-cover"
          loading="lazy"
          decoding="async"
        />
        {coverLoading && <PhotoSpinner />}
        <div className="absolute right-2 top-2">
          <BadgeQualitySeal lxState={labTestMean.lxState} />
        </div>
      </div>
      {/* `gap-*`, not `space-y-*`: Tailwind's space-y sets `margin-top` on
          every child but the first, at a higher specificity than `mt-auto`,
          which would silently defeat the bottom-pinned status. */}
      <div
        className={clsx(
          "flex flex-1 flex-col",
          compact ? "px-3 pt-3 pb-2 gap-1" : "px-4 pt-4 pb-3 gap-2",
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <ChipType type={labTestMean.type} withIcon />
          {!compact && (
            <div className="flex items-center gap-2">
              {labTestMean.complexity && (
                <span className="text-[10px] uppercase tracking-wide text-muted font-mono">
                  {labTestMean.complexity}
                </span>
              )}
              <ChipAccessControl enabled={labTestMean.security.accesscontrol} />
            </div>
          )}
        </div>
        <h3
          className={clsx(
            "font-semibold leading-tight",
            compact ? "text-sm line-clamp-1" : "line-clamp-2",
          )}
        >
          {labTestMean.name}
        </h3>
        <p className={clsx("text-muted", compact ? "text-xs truncate" : "text-sm")}>
          {labTestMean.location.city}, {labTestMean.location.country}
          {labTestMean.location.building
            ? ` · ${labTestMean.location.building}`
            : ""}
        </p>
        {/* `mt-auto` eats the leftover height, so the status sits on the
            card's bottom edge whatever the name and location above it took. */}
        <div className="mt-auto">
          <BadgeStatus status={labTestMean.status} />
        </div>
      </div>
    </Link>
  );
}
