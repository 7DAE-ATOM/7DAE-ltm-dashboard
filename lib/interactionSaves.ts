import type { EdgeColorKind } from "@/components/interaction/DependencyGraph";
import { downloadBlob } from "@/lib/downloadBlob";

export type InteractionSaveNode = {
  id: string;
  x: number;
  y: number;
  /** Absent unless the user resized this card by dragging one of its vertical
   * edges — absent reads back as "follow the global `nodeWidth` display
   * setting", which is what a save made before per-card widths existed should
   * do. Optional for the same reason as `dependencyType` and `curvature`
   * below: no version bump, no migration. */
  width?: number;
};
export type InteractionSaveEdge = {
  source: string;
  target: string;
  kind: EdgeColorKind;
  // Absent on an edge saved before this field existed — reads back as
  // `undefined`, which already means "unstyled/no data" (rendered gray), so
  // no version bump or migration is needed for older saves.
  dependencyType?: "mandatory" | "optional";
};
export type InteractionSave = {
  version: 3;
  rootExternalIds: string[];
  nodes: InteractionSaveNode[];
  edges: InteractionSaveEdge[];
  /** Hand-dialled edge bows, keyed by edge id — see
   * `lib/interactionEdgeCurvature.ts`, where they are otherwise session-only.
   * Optional for the same reason as `dependencyType` above: absent reads back
   * as "every edge on the global curvature setting", which is exactly what a
   * save made before this field existed should do. No version bump. */
  curvature?: Record<string, number>;
  savedAt: string;
};

/** Pre-single-algorithm save formats — `/depgraph` used to let the user
 * choose an ELK algorithm (`algorithm: "layered" | "radial"`), and before
 * that supported only one root bench at all (`rootExternalId` instead of
 * `rootExternalIds`). Both are transparently upgraded on read (see
 * `loadSave`, dropping `algorithm` — every diagram is radial now — and
 * wrapping a lone `rootExternalId` into an array), never rewritten in place —
 * the next explicit `Save` on them persists the current shape. */
type InteractionSaveV2 = {
  version: 2;
  rootExternalIds: string[];
  algorithm: string;
  nodes: InteractionSaveNode[];
  edges: InteractionSaveEdge[];
  savedAt: string;
};
type InteractionSaveV1 = {
  version: 1;
  rootExternalId: string;
  algorithm: string;
  nodes: InteractionSaveNode[];
  edges: InteractionSaveEdge[];
  savedAt: string;
};

const INDEX_KEY = "interaction-saves";
const entryKey = (name: string) => `interaction-save:${name}`;

function safeGetItem(key: string): string | null {
  try {
    return globalThis.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetItem(key: string, value: string): boolean {
  try {
    globalThis.localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

function safeRemoveItem(key: string): void {
  try {
    globalThis.localStorage.removeItem(key);
  } catch {
    // ignore — nothing to clean up if storage is unavailable
  }
}

function readIndex(): string[] {
  const raw = safeGetItem(INDEX_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((n) => typeof n === "string") : [];
  } catch {
    return [];
  }
}

function writeIndex(names: string[]): boolean {
  return safeSetItem(INDEX_KEY, JSON.stringify(names));
}

export function listSaves(): string[] {
  return readIndex();
}

export function loadSave(name: string): InteractionSave | null {
  const raw = safeGetItem(entryKey(name));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as InteractionSave | InteractionSaveV2 | InteractionSaveV1;
    if (parsed.version === 1) {
      const { rootExternalId, algorithm: _algorithm, ...rest } = parsed;
      return { ...rest, version: 3, rootExternalIds: [rootExternalId] };
    }
    if (parsed.version === 2) {
      const { algorithm: _algorithm, ...rest } = parsed;
      return { ...rest, version: 3 };
    }
    if (parsed.version !== 3) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Overwrites silently if `name` already exists — no confirmation, per spec. */
export function writeSave(name: string, data: InteractionSave): boolean {
  const wroteEntry = safeSetItem(entryKey(name), JSON.stringify(data));
  if (!wroteEntry) return false;
  const names = readIndex();
  if (!names.includes(name)) {
    return writeIndex([...names, name]);
  }
  return true;
}

export function deleteSave(name: string): void {
  safeRemoveItem(entryKey(name));
  writeIndex(readIndex().filter((n) => n !== name));
}

/** Strips the characters Windows and POSIX refuse in a filename. Falls back
 * to a neutral name rather than producing an empty one, which would leave the
 * file called just its extension. Exported because an image export names
 * itself after the active save too. */
export function sanitizeFilename(name: string): string {
  return name.replaceAll(/[\/:*?"<>|]/g, "_").trim() || "diagram";
}

/** Downloads `data` as a `.json` file named after `name` — lets a user share
 * a diagram with a colleague (email, Teams, USB key, etc.) since saves
 * otherwise never leave this browser's `localStorage`. */
export function downloadInteractionSave(name: string, data: InteractionSave): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  downloadBlob(blob, `${sanitizeFilename(name)}.json`);
}

type UnknownRecord = Record<string, unknown>;

function isNodeArray(value: unknown): value is InteractionSaveNode[] {
  return (
    Array.isArray(value) &&
    value.every((n) => {
      if (!n || typeof n !== "object") return false;
      const rec = n as UnknownRecord;
      return (
        typeof rec.id === "string" &&
        typeof rec.x === "number" &&
        typeof rec.y === "number" &&
        // Absent is the norm; present but nonsensical (hand-edited file) is
        // rejected outright rather than silently drawn as a zero-width card.
        (rec.width === undefined ||
          (typeof rec.width === "number" && Number.isFinite(rec.width) && rec.width > 0))
      );
    })
  );
}

function isEdgeArray(value: unknown): value is InteractionSaveEdge[] {
  return (
    Array.isArray(value) &&
    value.every((e) => {
      if (!e || typeof e !== "object") return false;
      const rec = e as UnknownRecord;
      if (typeof rec.source !== "string" || typeof rec.target !== "string") return false;
      if (rec.kind !== "depends-on" && rec.kind !== "shared-resource") return false;
      if (
        rec.dependencyType !== undefined &&
        rec.dependencyType !== "mandatory" &&
        rec.dependencyType !== "optional"
      ) {
        return false;
      }
      return true;
    })
  );
}

/** Absent or malformed curvature is dropped rather than rejected: it is a
 * reading comfort, not the diagram, and losing the bows beats refusing the
 * file. */
function toCurvature(value: unknown): Record<string, number> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const out: Record<string, number> = {};
  for (const [id, offset] of Object.entries(value as UnknownRecord)) {
    if (typeof offset === "number" && Number.isFinite(offset)) out[id] = offset;
  }
  return out;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === "string");
}

/**
 * Validates untrusted JSON from an imported file into a v3 `InteractionSave`,
 * upgrading the same historical v1/v2 shapes `loadSave` already reads from
 * localStorage. Unlike `loadSave` (which trusts its own past writes and only
 * branches on `.version`), this performs real structural/type checks so a
 * malformed or unrelated JSON file is rejected with a clear message instead
 * of silently becoming a broken save.
 */
export function parseImportedSave(raw: string): InteractionSave {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("This file is not valid JSON.");
  }
  if (!parsed || typeof parsed !== "object") {
    throw new Error("This file does not contain a diagram save.");
  }
  const rec = parsed as UnknownRecord;

  if (typeof rec.savedAt !== "string") {
    throw new TypeError("This file does not contain a diagram save.");
  }
  if (!isNodeArray(rec.nodes)) {
    throw new Error("This file's diagram data is malformed (nodes).");
  }
  if (!isEdgeArray(rec.edges)) {
    throw new Error("This file's diagram data is malformed (edges).");
  }

  if (rec.version === 1) {
    if (typeof rec.rootExternalId !== "string") {
      throw new TypeError("This file's diagram data is malformed (root bench).");
    }
    return {
      version: 3,
      rootExternalIds: [rec.rootExternalId],
      nodes: rec.nodes,
      edges: rec.edges,
      curvature: toCurvature(rec.curvature),
      savedAt: rec.savedAt,
    };
  }
  if (rec.version === 2 || rec.version === 3) {
    if (!isStringArray(rec.rootExternalIds)) {
      throw new Error("This file's diagram data is malformed (root benches).");
    }
    return {
      version: 3,
      rootExternalIds: rec.rootExternalIds,
      nodes: rec.nodes,
      edges: rec.edges,
      curvature: toCurvature(rec.curvature),
      savedAt: rec.savedAt,
    };
  }
  throw new Error("This file was exported by an unsupported version of this app.");
}
