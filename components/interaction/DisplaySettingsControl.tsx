"use client";

import { useEffect, useRef, useState } from "react";
import {
  useInteractionDisplaySettings,
  setInteractionDisplaySetting,
  NODE_WIDTH_MIN,
  NODE_WIDTH_MAX,
  EDGE_CURVATURE_MIN,
  EDGE_CURVATURE_MAX,
  type InteractionDisplaySettings,
} from "@/lib/interactionDisplaySettings";
import Switch from "@/components/Switch";

type BooleanSettingKey = {
  [K in keyof InteractionDisplaySettings]: InteractionDisplaySettings[K] extends boolean
    ? K
    : never;
}[keyof InteractionDisplaySettings];

const ROWS: { key: BooleanSettingKey; label: string }[] = [
  { key: "showQualitySeal", label: "Quality seal tag" },
  { key: "showType", label: "Type" },
  { key: "showCity", label: "City" },
  { key: "showStatus", label: "Status" },
  { key: "showBuilding", label: "Building" },
  { key: "showRoom", label: "Room" },
];

export default function DisplaySettingsControl() {
  const settings = useInteractionDisplaySettings();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Diagram display settings"
        title="Diagram display settings"
        className="flex h-8 w-8 items-center justify-center rounded-card border border-border bg-surface/90 text-fg backdrop-blur-md hover:bg-surface-2"
      >
        <SettingsIcon />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-30 mt-1 min-w-[200px] rounded-card border border-border bg-surface p-2 shadow-2xl"
        >
          <div className="px-1 pb-1.5 text-xs font-semibold uppercase tracking-wider text-muted">
            Show on bench boxes
          </div>
          {ROWS.map(({ key, label }) => (
            <label
              key={key}
              className="flex cursor-pointer items-center justify-between gap-3 rounded px-1 py-1.5 text-sm text-fg hover:bg-surface-2"
            >
              {label}
              <Switch checked={settings[key]} onChange={(v) => setInteractionDisplaySetting(key, v)} />
            </label>
          ))}

          <div className="mt-1.5 border-t border-border pt-1.5">
            <div className="flex items-center justify-between gap-3 px-1 py-1.5 text-sm text-fg">
              <label htmlFor="node-width-slider">Box width</label>
              <span className="font-mono text-xs text-muted">{settings.nodeWidth}px</span>
            </div>
            <input
              id="node-width-slider"
              type="range"
              min={NODE_WIDTH_MIN}
              max={NODE_WIDTH_MAX}
              step={10}
              value={settings.nodeWidth}
              onChange={(e) => setInteractionDisplaySetting("nodeWidth", Number(e.target.value))}
              className="w-full px-1"
            />
          </div>

          <div className="mt-1.5 border-t border-border pt-1.5">
            <div className="flex items-center justify-between gap-3 px-1 py-1.5 text-sm text-fg">
              <label htmlFor="edge-curvature-slider">Link curvature</label>
              <span className="font-mono text-xs text-muted">
                {settings.edgeCurvature}%
              </span>
            </div>
            <input
              id="edge-curvature-slider"
              type="range"
              min={EDGE_CURVATURE_MIN}
              max={EDGE_CURVATURE_MAX}
              step={5}
              value={settings.edgeCurvature}
              onChange={(e) =>
                setInteractionDisplaySetting("edgeCurvature", Number(e.target.value))
              }
              className="w-full px-1"
            />
            {/* Links bent by hand keep their own bow and ignore this. */}
            <p className="px-1 pt-1 text-[11px] text-muted">
              Drag the dot on a link to bend it individually.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function SettingsIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
    </svg>
  );
}
