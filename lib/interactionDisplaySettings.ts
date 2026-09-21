"use client";

import { useSyncExternalStore } from "react";

/**
 * Which info is shown on each bench box in the `/depgraph` diagram.
 * Global to the app (not per-diagram), persisted in localStorage so it
 * survives a reload — deliberately NOT part of `InteractionSave` (see
 * `lib/interactionSaves.ts`), per spec.
 *
 * Same external-store pattern as `lib/radarDisplaySettings.ts`
 * (`useSyncExternalStore`), plus the localStorage persistence already used by
 * `lib/useTheme.ts` / `lib/interactionSaves.ts`.
 */
export type InteractionDisplaySettings = {
  showQualitySeal: boolean;
  showType: boolean;
  showCity: boolean;
  showStatus: boolean;
  showBuilding: boolean;
  showRoom: boolean;
  nodeWidth: number;
  /** How pronounced the bow on an edge is, 0–100. 50 is the historical
   * rendering; 0 draws straight lines, 100 twice the default bow. An edge the
   * user has bent by hand ignores this — see
   * `lib/interactionEdgeCurvature.ts`. */
  edgeCurvature: number;
};

const STORAGE_KEY = "interaction-display-settings";

// 80%–150% of the original fixed box width (200px) — deliberately narrow so a
// resize can't make a dense diagram unreadably overlapped.
export const NODE_WIDTH_MIN = 160;
export const NODE_WIDTH_MAX = 300;

export const EDGE_CURVATURE_MIN = 0;
export const EDGE_CURVATURE_MAX = 100;
/** The value that reproduces the rendering from before the setting existed. */
export const EDGE_CURVATURE_NEUTRAL = 50;

const DEFAULT_SETTINGS: InteractionDisplaySettings = {
  showQualitySeal: true,
  showType: true,
  showCity: true,
  showStatus: true,
  showBuilding: true,
  showRoom: true,
  nodeWidth: 200,
  edgeCurvature: EDGE_CURVATURE_NEUTRAL,
};

let state: InteractionDisplaySettings = DEFAULT_SETTINGS;
let hydrated = false;
const listeners = new Set<() => void>();

function pickBool(parsed: Record<string, unknown>, key: string, fallback: boolean): boolean {
  const v = parsed[key];
  return typeof v === "boolean" ? v : fallback;
}

function pickNodeWidth(parsed: Record<string, unknown>, fallback: number): number {
  const v = parsed.nodeWidth;
  if (typeof v !== "number") return fallback;
  return Math.min(NODE_WIDTH_MAX, Math.max(NODE_WIDTH_MIN, v));
}

function pickEdgeCurvature(parsed: Record<string, unknown>, fallback: number): number {
  const v = parsed.edgeCurvature;
  if (typeof v !== "number") return fallback;
  return Math.min(EDGE_CURVATURE_MAX, Math.max(EDGE_CURVATURE_MIN, v));
}

function hydrate(): void {
  if (hydrated || globalThis.window === undefined) return;
  hydrated = true;
  try {
    const raw = globalThis.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      state = {
        showQualitySeal: pickBool(parsed, "showQualitySeal", DEFAULT_SETTINGS.showQualitySeal),
        showType: pickBool(parsed, "showType", DEFAULT_SETTINGS.showType),
        showCity: pickBool(parsed, "showCity", DEFAULT_SETTINGS.showCity),
        showStatus: pickBool(parsed, "showStatus", DEFAULT_SETTINGS.showStatus),
        showBuilding: pickBool(parsed, "showBuilding", DEFAULT_SETTINGS.showBuilding),
        showRoom: pickBool(parsed, "showRoom", DEFAULT_SETTINGS.showRoom),
        nodeWidth: pickNodeWidth(parsed, DEFAULT_SETTINGS.nodeWidth),
        edgeCurvature: pickEdgeCurvature(parsed, DEFAULT_SETTINGS.edgeCurvature),
      };
    }
  } catch {
    // localStorage unavailable or corrupt value — keep defaults
  }
}

function emit(): void {
  for (const l of listeners) l();
}

function subscribe(callback: () => void): () => void {
  hydrate();
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function getSnapshot(): InteractionDisplaySettings {
  hydrate();
  return state;
}

function getServerSnapshot(): InteractionDisplaySettings {
  return DEFAULT_SETTINGS;
}

export function useInteractionDisplaySettings(): InteractionDisplaySettings {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function setInteractionDisplaySetting<K extends keyof InteractionDisplaySettings>(
  key: K,
  value: InteractionDisplaySettings[K],
): void {
  hydrate();
  state = { ...state, [key]: value };
  try {
    globalThis.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage unavailable (private mode, etc.) — session-only toggle still works
  }
  emit();
}
