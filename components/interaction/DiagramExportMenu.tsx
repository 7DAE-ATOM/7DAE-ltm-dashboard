"use client";

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import ExportIcon from "@/components/icons/ExportIcon";

export type ExportFormat = "png" | "svg" | "mermaid";

type Props = {
  /** Nothing on the canvas, nothing to export — the whole control goes quiet. */
  disabled: boolean;
  /** The format currently being generated, `null` when idle. Image captures
   * take a moment on a dense graph, and a second click would start a
   * competing one. */
  busy: ExportFormat | null;
  onExport: (format: ExportFormat) => void;
};

const FORMATS: { value: ExportFormat; label: string; extension: string }[] = [
  { value: "png", label: "PNG", extension: ".png" },
  { value: "svg", label: "SVG", extension: ".svg" },
  { value: "mermaid", label: "Mermaid", extension: ".mmd" },
];

/**
 * "Export" menu for the Dependency Graph toolbar, sitting between the save
 * disk and the `…` menu and built on the same popover mechanics (Escape,
 * outside click, same button size) so the controls read as one row.
 *
 * PNG and SVG capture the rendered canvas; Mermaid rebuilds the diagram from
 * the model. Two unrelated mechanisms behind one menu — which is why this
 * component only forwards a format and knows nothing about either.
 *
 * Not to be confused with the `…` menu's own "Export", which downloads the
 * save file for re-importing here. This one produces something for the
 * outside world.
 */
export default function DiagramExportMenu({
  disabled,
  busy,
  onExport,
}: Readonly<Props>) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onMouseDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onMouseDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onMouseDown);
    };
  }, [open]);

  const label = "Export diagram";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={disabled}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        // Spells out what it will NOT do: next to a "…" menu that exports the
        // save file, "Export" alone is ambiguous.
        title={`${label} as an image or Mermaid text`}
        // The toolbar's shared frame, as worn by DisplaySettingsControl.
        className="flex h-8 w-8 items-center justify-center rounded-card border border-border bg-surface/90 text-fg backdrop-blur-md transition-opacity hover:bg-surface-2 disabled:cursor-not-allowed disabled:text-muted disabled:opacity-50 disabled:hover:bg-surface/90"
      >
        <ExportIcon size={16} />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-30 mt-1 w-56 rounded-card border border-border bg-surface p-2 shadow-2xl"
        >
          <div className="mb-1 px-2 text-xs uppercase tracking-[0.1em] text-muted">
            Export as
          </div>
          {FORMATS.map((format) => {
            const running = busy === format.value;
            return (
              <button
                key={format.value}
                type="button"
                role="menuitem"
                // Any generation in flight locks the whole menu: they all read
                // the same canvas.
                disabled={busy !== null}
                onClick={() => {
                  setOpen(false);
                  onExport(format.value);
                }}
                className={clsx(
                  "flex w-full items-center justify-between gap-6 rounded px-2 py-1.5 text-left text-sm",
                  busy === null
                    ? "text-fg hover:bg-surface-2"
                    : "cursor-not-allowed text-muted",
                )}
              >
                <span>{format.label}</span>
                <span className="font-mono text-[10px] text-muted">
                  {running ? "…" : format.extension}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
