"use client";

import { useMemo, useState } from "react";
import MapGL, { Marker, Popup, NavigationControl } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import Link from "next/link";
import type { LabTestMean } from "@/lib/types";
import { useTheme } from "@/lib/useTheme";
import ChipType from "./ChipType";
import BadgeStatus from "./BadgeStatus";

const TILE_STYLES = {
  dark: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
  light: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
} as const;

// Bubble radius in pixels. Sized so the largest site (~150 LTMs) stays readable
// at default zoom 3.5, and the smallest (1 LTM) keeps a 2-digit label margin.
const R_MIN = 18;
const R_MAX = 48;

type SiteGroup = {
  site: string;
  city: string;
  lat: number;
  lng: number;
  members: LabTestMean[];
};

function labelSizeClass(count: number): string {
  const digits = String(count).length;
  if (digits === 1) return "text-xs";
  if (digits === 2) return "text-sm";
  return "text-base";
}

export default function MapView({
  labTestMeans,
}: Readonly<{
  labTestMeans: LabTestMean[];
}>) {
  const [selectedSite, setSelectedSite] = useState<string | null>(null);
  const theme = useTheme();

  const groups = useMemo<SiteGroup[]>(() => {
    const byKey = new Map<string, LabTestMean[]>();
    for (const m of labTestMeans) {
      if (m.location.lat == null || m.location.lng == null) continue;
      const key = m.location.site;
      const arr = byKey.get(key);
      if (arr) arr.push(m);
      else byKey.set(key, [m]);
    }
    const out: SiteGroup[] = [];
    for (const [site, members] of byKey) {
      const first = members[0];
      out.push({
        site,
        city: first.location.city,
        lat: first.location.lat!,
        lng: first.location.lng!,
        members,
      });
    }
    // Largest bubbles first → they render first, smaller ones overlay on top
    // and stay clickable when bubbles overlap (e.g. Hamburg/Bremen at low zoom).
    return out.sort((a, b) => b.members.length - a.members.length);
  }, [labTestMeans]);

  const maxCount =
    groups.length > 0
      ? Math.max(...groups.map((g) => g.members.length))
      : 1;

  const selectedGroup =
    selectedSite == null
      ? null
      : groups.find((g) => g.site === selectedSite) ?? null;

  return (
    <MapGL
      initialViewState={{
        longitude: 5,
        latitude: 47,
        zoom: 3.5,
      }}
      mapStyle={TILE_STYLES[theme]}
      style={{ width: "100%", height: "100%" }}
    >
      <NavigationControl position="top-right" />
      {groups.map((g) => {
        const r =
          R_MIN + (R_MAX - R_MIN) * Math.sqrt(g.members.length / maxCount);
        const size = Math.round(2 * r);
        return (
          <Marker key={g.site} longitude={g.lng} latitude={g.lat}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedSite(g.site);
              }}
              title={g.city}
              aria-label={`${g.members.length} lab test means at ${g.city}`}
              className="rounded-full border-2 border-white shadow-lg flex items-center justify-center text-accent-fg font-mono font-bold cursor-pointer hover:scale-105 transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              style={{
                width: size,
                height: size,
                backgroundColor:
                  "color-mix(in srgb, var(--color-accent) 75%, transparent)",
              }}
            >
              <span className={labelSizeClass(g.members.length)}>
                {g.members.length}
              </span>
            </button>
          </Marker>
        );
      })}
      {selectedGroup && (
        <Popup
          longitude={selectedGroup.lng}
          latitude={selectedGroup.lat}
          onClose={() => setSelectedSite(null)}
          closeButton={true}
          anchor="top"
          offset={R_MAX}
          // The row is chip + name + status badge, and the name is the only
          // one that gives way. At 320px the two fixed ends ("SHARED
          // RESOURCE" and "Out of Service" are the widest pair) left barely
          // a character for it. `min()` so a phone-width screen still gets a
          // popup that fits on it.
          maxWidth="min(460px, 92vw)"
        >
          <div className="p-3 space-y-2 min-w-[280px]">
            <div>
              <div className="font-semibold text-sm leading-tight">
                {selectedGroup.city}
              </div>
              <div className="text-xs text-muted">
                {selectedGroup.members.length} lab test mean
                {selectedGroup.members.length > 1 ? "s" : ""}
              </div>
            </div>
            <ul className="max-h-72 overflow-y-auto divide-y divide-border -mx-3 px-3">
              {selectedGroup.members.map((m) => (
                <li key={m.id} className="py-2 flex items-center gap-2">
                  <ChipType type={m.type} withIcon />
                  <Link
                    href={`/labtestmean?id=${encodeURIComponent(m.externalId)}`}
                    // See LabTestMeanCard: all detail links hit the same static
                    // page, so prefetch is wasteful and triggers 301/403 noise.
                    prefetch={false}
                    className="flex-1 min-w-0 text-sm font-medium truncate hover:text-accent transition-colors"
                    title={m.name}
                  >
                    {m.name}
                  </Link>
                  <BadgeStatus status={m.status} />
                </li>
              ))}
            </ul>
          </div>
        </Popup>
      )}
    </MapGL>
  );
}
