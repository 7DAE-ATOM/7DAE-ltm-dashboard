"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Per-edge curvature overrides for the dependency graph: the signed distance,
 * in graph pixels, between an edge's control point and its chord. Set by
 * dragging the handle that appears when hovering an edge (see `RadialEdge` in
 * `components/interaction/DependencyGraph.tsx`); an edge without an override
 * follows the alternating `bend` the graph assigns it, scaled by the global
 * curvature setting (`lib/interactionDisplaySettings.ts`).
 *
 * Session-only by design — no `localStorage`, nothing in the `?ids=` URL. A
 * **named save** is the one exception: it is an explicit act, and a diagram
 * reopened without the bows its author dialled in would be reopened wrong.
 * Hence `getAllEdgeCurvatures` / `setEdgeCurvatures`, used by the save/load
 * path; the store itself still persists nothing.
 *
 * Listeners are kept **per edge id** rather than in one global set: a drag
 * fires on every pointer move, and only the edge being dragged should
 * re-render.
 *
 * Distances are absolute pixels, not a fraction of the edge's length, so
 * moving a node further away keeps the bow the user dialled in instead of
 * inflating it. They are never coordinates: `buildLiveEdges` recomputes both
 * endpoints from current node positions on every render, so a stored point
 * would drift the moment a card moves.
 */

const offsets = new Map<string, number>();
const listeners = new Map<string, Set<() => void>>();

/** Fired on *any* change, unlike `listeners` which is keyed per edge id. The
 * graph uses it to notice that the diagram drifted from its saved state: a
 * curvature drag goes through neither `nodes` nor `edgeMeta`, so it is
 * invisible to every other change signal. */
const changeListeners = new Set<() => void>();

function emit(edgeId: string): void {
  for (const listener of listeners.get(edgeId) ?? []) listener();
  for (const listener of changeListeners) listener();
}

export function subscribeEdgeCurvatureChange(listener: () => void): () => void {
  changeListeners.add(listener);
  return () => changeListeners.delete(listener);
}

/** `null` means "no override" — the edge follows the global setting. */
export function useEdgeCurvature(edgeId: string): number | null {
  const subscribe = useCallback(
    (callback: () => void) => {
      let set = listeners.get(edgeId);
      if (!set) {
        set = new Set();
        listeners.set(edgeId, set);
      }
      set.add(callback);
      return () => {
        set.delete(callback);
        if (set.size === 0) listeners.delete(edgeId);
      };
    },
    [edgeId],
  );
  const getSnapshot = useCallback(() => offsets.get(edgeId) ?? null, [edgeId]);
  // Server render has no overrides at all, so the constant is correct.
  const getServerSnapshot = useCallback(() => null, []);
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function setEdgeCurvature(edgeId: string, offset: number | null): void {
  if (offset === null) offsets.delete(edgeId);
  else offsets.set(edgeId, offset);
  emit(edgeId);
}

export function getAllEdgeCurvatures(): Record<string, number> {
  return Object.fromEntries(offsets);
}

/** Bulk replace, for loading a named save. Emits on the **union** of the keys
 * that were set and the ones that are being set, so an edge losing its
 * override re-renders too. */
export function setEdgeCurvatures(next: Record<string, number>): void {
  const touched = new Set([...offsets.keys(), ...Object.keys(next)]);
  offsets.clear();
  for (const [id, offset] of Object.entries(next)) {
    if (typeof offset === "number" && Number.isFinite(offset)) {
      offsets.set(id, offset);
    }
  }
  for (const id of touched) emit(id);
}

/** Drops overrides for edges that left the graph, so hiding a node and
 * bringing it back doesn't resurrect a bow the user can no longer see. */
export function pruneEdgeCurvature(keep: ReadonlySet<string>): void {
  for (const id of [...offsets.keys()]) {
    if (!keep.has(id)) setEdgeCurvature(id, null);
  }
}
