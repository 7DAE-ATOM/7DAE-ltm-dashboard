"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import clsx from "clsx";
import ThemeToggle from "./ThemeToggle";
import AboutDialog from "./AboutDialog";
import RefreshButton from "./RefreshButton";
import PhotoCacheSettingsControl from "./PhotoCacheSettingsControl";

export default function Header() {
  // usePathname() is typed `string | null` in some Next versions (e.g. 16.2.9)
  // and `string` in others (16.2.7) — coalesce so the strict null check passes
  // regardless of the installed patch.
  const pathname = usePathname() ?? "";
  const [logoFailed, setLogoFailed] = useState(false);

  const catalogueActive =
    pathname === "/" || pathname.startsWith("/labtestmean");
  const mapActive =
    pathname === "/map" || pathname.startsWith("/map/");
  const depGraphActive =
    pathname === "/depgraph" || pathname.startsWith("/depgraph/");
  const depViewActive =
    pathname === "/depview" || pathname.startsWith("/depview/");

  const itemClass = (active: boolean) =>
    clsx(
      "px-3 py-1.5 rounded text-sm font-medium transition-colors",
      active
        ? "bg-[#00205B] text-white"
        : "text-[#00205B]/70 hover:text-[#00205B]"
    );

  return (
    <header className="sticky top-0 z-20 border-b border-[#00205B]/15 bg-white">
      <div className="relative px-4 md:px-6 py-3 flex items-center gap-6 max-w-[1600px] mx-auto">
        <Link
          href="/"
          className="flex flex-col items-start gap-0.5 hover:opacity-80 transition-opacity"
          aria-label="Airbus Lab Test Means — go to catalogue"
        >
          {logoFailed ? (
            <span className="text-lg font-bold tracking-tight">Airbus</span>
          ) : (
            <img
              src={`${process.env.NEXT_PUBLIC_BASE_HREF ?? ""}/airbus-logo.svg`}
              alt="Airbus"
              className="h-6 w-auto"
              onError={() => setLogoFailed(true)}
            />
          )}
          <img
            src={`${process.env.NEXT_PUBLIC_BASE_HREF ?? ""}/lab-test-means-wordmark.svg`}
            alt="Lab Test Means"
            className="h-2.5 w-auto"
          />
        </Link>

        <nav className="flex items-center gap-1">
          {/* No filter reset here: the selection is shared with /map and
              /depview (lib/appFilters.ts), so clearing it on a nav click would
              silently throw away what the other two tabs are showing. The
              panel's "Clear All" is the explicit way to empty it. */}
          <Link href="/" className={itemClass(catalogueActive)}>
            Catalogue
          </Link>
          <Link href="/map" className={itemClass(mapActive)}>
            Map
          </Link>
          <Link href="/depgraph" className={itemClass(depGraphActive)}>
            Dependency Graph
          </Link>
          <Link href="/depview" className={itemClass(depViewActive)}>
            Dependency View
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-2 min-h-[32px]">
          {/* RESERVED: avatar, global search, notifications (V2) */}
          <RefreshButton />
          <AboutDialog />
          <PhotoCacheSettingsControl />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
