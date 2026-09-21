"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { useLabTestMeans } from "@/lib/useLabTestMeans";
import type { LabTestMean } from "@/lib/types";
import BenchCombobox from "@/components/interaction/BenchCombobox";
import SelectedBenchesBar from "@/components/interaction/SelectedBenchesBar";
import InteractionEmptyState from "@/components/interaction/InteractionEmptyState";
import SaveLoadControls from "@/components/interaction/SaveLoadControls";
import DisplaySettingsControl from "@/components/interaction/DisplaySettingsControl";
import type { DependencyGraphHandle } from "@/components/interaction/DependencyGraph";
import {
  deleteSave,
  downloadInteractionSave,
  listSaves,
  loadSave,
  writeSave,
  type InteractionSave,
} from "@/lib/interactionSaves";
import { consumeSeedIds } from "@/lib/depgraphSeed";

const DependencyGraph = dynamic(
  () => import("@/components/interaction/DependencyGraph"),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full bg-surface-2 skeleton-pulse" />
    ),
  },
);

function InteractionSkeleton() {
  return (
    <div className="h-[calc(100vh-57px)] bg-surface-2 skeleton-pulse flex items-center justify-center">
      <span className="text-sm text-muted font-mono">Loading benches…</span>
    </div>
  );
}

export default function InteractionClient() {
  const { labTestMeans, loading, error } = useLabTestMeans();
  const router = useRouter();
  const searchParams = useSearchParams();
  const idsParam = searchParams.get("ids") ?? "";
  const selectedIds = useMemo(() => idsParam.split(",").filter(Boolean), [idsParam]);

  const [activeSaveName, setActiveSaveName] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [pendingLoad, setPendingLoad] = useState<InteractionSave | null>(null);
  const [saveVersion, setSaveVersion] = useState(0);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [seedExpired, setSeedExpired] = useState(false);
  /* Cards currently on the canvas, pushed up by the diagram. The selection
   * alone is no longer enough to decide whether to render it: hiding the last
   * selected bench empties the selection while leaving its neighbours behind,
   * and those must not vanish with it. `setGraphNodeCount` is passed to the
   * graph directly — a `useState` setter has a stable identity, which is what
   * the callbacks below are hand-wrapped in `useCallback` to achieve. */
  const [graphNodeCount, setGraphNodeCount] = useState(0);
  const graphRef = useRef<DependencyGraphHandle>(null);

  /* A `?seed=<token>` arrives from the catalogue when the selection was too
   * large to put in the URL. It is converted straight into the canonical
   * `?ids=` form rather than kept as state: on this page `?ids=` IS the live
   * selection, so after this one `replace` every existing code path applies
   * unchanged.
   *
   * The ref guards against StrictMode's double mount; `consumeSeedIds` also
   * memoizes, so a second read still resolves. */
  const seedParam = searchParams.get("seed");
  const seedConsumedRef = useRef(false);
  useEffect(() => {
    if (!seedParam || seedConsumedRef.current) return;
    seedConsumedRef.current = true;
    const ids = consumeSeedIds(seedParam);
    if (!ids) {
      // Unknown, malformed or expired: say so rather than showing an empty
      // diagram that looks like the link simply did nothing.
      setSeedExpired(true);
    }
    const params = new URLSearchParams(searchParams.toString());
    params.delete("seed");
    params.delete("id");
    if (ids?.length) params.set("ids", ids.join(","));
    const query = params.toString();
    router.replace(query ? `/depgraph?${query}` : "/depgraph", {
      scroll: false,
    });
  }, [seedParam, searchParams, router]);

  // Stable references — an inline arrow function here would get a new
  // identity on every render (e.g. right after `handleSaveAs` itself calls
  // `setActiveSaveName`/`setDirty(false)`), and since these are also
  // dependencies of DependencyGraph's internal effects, that would spuriously
  // re-fire them and immediately flip `dirty` back to `true`.
  const handleDirty = useCallback(() => setDirty(true), []);
  const handlePendingLoadConsumed = useCallback(() => setPendingLoad(null), []);

  // `saveVersion` is a pure refresh trigger — bumped after writeSave/deleteSave
  // so this recomputes, even though `listSaves()` itself doesn't read it.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const saves = useMemo(() => listSaves(), [saveVersion]);

  // Ids that no longer resolve to a bench (e.g. removed from the catalogue
  // since a link was shared) are silently dropped — same behavior as the
  // previous singular `?id=`.
  const selectedBenches = useMemo(
    () =>
      selectedIds
        .map((id) => labTestMeans.find((m) => m.externalId === id))
        .filter((m): m is LabTestMean => !!m),
    [selectedIds, labTestMeans],
  );

  // Updates only the URL — used by add/remove (which also reset the active
  // save, see `handleAddBench`/`handleRemoveBench`) and by `Load` (which sets
  // its own active-save-name right after, see `handleLoadSave`).
  const updateSelectionUrl = useCallback(
    (ids: string[]) => {
      const params = new URLSearchParams(searchParams.toString());
      if (ids.length > 0) params.set("ids", ids.join(","));
      else params.delete("ids");
      params.delete("id"); // drop the legacy singular param if present
      router.replace(`/depgraph?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  const handleAddBench = useCallback(
    (m: LabTestMean) => {
      updateSelectionUrl([...selectedIds, m.externalId]);
      setActiveSaveName(null);
      setDirty(false);
      // If the diagram isn't mounted yet (selection was empty), it'll mount
      // fresh and take the normal ELK-driven initial-layout path instead.
      graphRef.current?.addBench(m);
    },
    [selectedIds, updateSelectionUrl],
  );

  const handleRemoveBench = useCallback(
    (id: string) => {
      const next = selectedIds.filter((x) => x !== id);
      setActiveSaveName(null);
      setDirty(false);
      if (next.length > 0) {
        graphRef.current?.removeBench(id);
      } else {
        // Taking the last chip away clears the board, as it always has.
        // Without this the diagram would now stay mounted on the strength of
        // its leftover cards — that leniency is for `Hide`, which is about
        // one card, not for "I am done with this selection".
        setGraphNodeCount(0);
      }
      updateSelectionUrl(next);
    },
    [selectedIds, updateSelectionUrl],
  );

  /**
   * The diagram hid a selected bench from its context menu. It has already
   * taken the card and its edges off the canvas, so all that is left here is
   * to drop it from the selection — the chip has to go with the card.
   *
   * Pointedly NOT `handleRemoveBench`: that one calls into `removeBench`,
   * which cascades and would take the hidden bench's neighbours with it.
   * Hiding is meant to leave them exactly where they are.
   */
  const handleRootHidden = useCallback(
    (id: string) => {
      setActiveSaveName(null);
      setDirty(false);
      updateSelectionUrl(selectedIds.filter((x) => x !== id));
    },
    [selectedIds, updateSelectionUrl],
  );

  const handleSaveAs = useCallback(
    (name: string) => {
      // `getSnapshot` already returns null on an empty canvas, which is the
      // real precondition — a diagram with cards but no selected bench is
      // saveable.
      const snapshot = graphRef.current?.getSnapshot();
      if (!snapshot) return;
      const ok = writeSave(name, {
        version: 3,
        rootExternalIds: selectedBenches.map((b) => b.externalId),
        ...snapshot,
        savedAt: new Date().toISOString(),
      });
      if (!ok) {
        setSaveError("Could not save (storage unavailable or full).");
        return;
      }
      setSaveError(null);
      setActiveSaveName(name);
      setDirty(false);
      setSaveVersion((v) => v + 1);
    },
    [selectedBenches],
  );

  const handleSave = useCallback(() => {
    if (!activeSaveName) return; // SaveLoadControls routes this to Save-as instead
    handleSaveAs(activeSaveName);
  }, [activeSaveName, handleSaveAs]);

  const handleLoadSave = useCallback(
    (name: string) => {
      const save = loadSave(name);
      if (!save) {
        setSaveError("This save could not be read.");
        return;
      }
      // Root benches that no longer exist in the catalogue (removed/renamed
      // since the save was made) are silently dropped, same as an
      // unresolvable id in `?ids=` — only abort if NONE of them resolve.
      const rootBenches = save.rootExternalIds
        .map((id) => labTestMeans.find((m) => m.externalId === id))
        .filter((m): m is LabTestMean => !!m);
      // A save can legitimately have no root at all (every selected bench was
      // hidden before saving). Only complain when it HAD roots and none of
      // them survive in the catalogue.
      if (save.rootExternalIds.length > 0 && rootBenches.length === 0) {
        setSaveError("None of this save's root benches exist in the catalogue anymore.");
        return;
      }
      setSaveError(null);
      // Applied by DependencyGraph once its selection matches this save's
      // (catalogue-filtered) roots — immediately if it already does.
      const resolvedRootIds = rootBenches.map((b) => b.externalId);
      setPendingLoad({ ...save, rootExternalIds: resolvedRootIds });
      updateSelectionUrl(resolvedRootIds); // Load always replaces the whole selection
      setActiveSaveName(name);
      setDirty(false);
    },
    [labTestMeans, updateSelectionUrl],
  );

  const handleDeleteSave = useCallback(
    (name: string) => {
      deleteSave(name);
      if (activeSaveName === name) {
        setActiveSaveName(null);
        setDirty(false);
      }
      setSaveVersion((v) => v + 1);
    },
    [activeSaveName],
  );

  const handleExportActive = useCallback(() => {
    if (!activeSaveName) return;
    const snapshot = graphRef.current?.getSnapshot();
    if (!snapshot) return;
    downloadInteractionSave(activeSaveName, {
      version: 3,
      rootExternalIds: selectedBenches.map((b) => b.externalId),
      ...snapshot,
      savedAt: new Date().toISOString(),
    });
  }, [activeSaveName, selectedBenches]);

  const handleExportSave = useCallback((name: string) => {
    const save = loadSave(name);
    if (!save) {
      setSaveError("This save could not be read.");
      return;
    }
    downloadInteractionSave(name, save);
  }, []);

  const handleImport = useCallback((name: string, data: InteractionSave) => {
    const ok = writeSave(name, data);
    if (!ok) {
      setSaveError("Could not save (storage unavailable or full).");
      return;
    }
    setSaveError(null);
    setSaveVersion((v) => v + 1);
  }, []);

  const handleImportError = useCallback((message: string) => {
    setSaveError(message);
  }, []);

  if (error) throw error;
  if (loading) return <InteractionSkeleton />;

  return (
    <div className="flex h-[calc(100vh-57px)] flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
        <div className="flex flex-1 flex-wrap items-start gap-3">
          <BenchCombobox
            options={labTestMeans}
            excludeIds={new Set(selectedIds)}
            onSelect={handleAddBench}
          />
          <SelectedBenchesBar benches={selectedBenches} onRemove={handleRemoveBench} />
        </div>
        <div className="flex items-center gap-1.5">
          <SaveLoadControls
            activeSaveName={activeSaveName}
            dirty={dirty}
            saves={saves}
            errorMessage={saveError}
            disableSave={graphNodeCount === 0}
            onSaveAs={handleSaveAs}
            onSave={handleSave}
            onLoad={handleLoadSave}
            onDelete={handleDeleteSave}
            onExportActive={handleExportActive}
            onExportSave={handleExportSave}
            onImport={handleImport}
            onImportError={handleImportError}
          />
          <DisplaySettingsControl />
        </div>
      </div>
      {seedExpired && (
        <div
          role="status"
          className="flex items-center justify-between gap-3 border-b border-warning/40 bg-warning/10 px-4 py-2 text-sm text-fg"
        >
          <span>
            That link has expired — selections opened from the catalogue stay
            valid for 30 minutes, and each link can only be opened once. Open
            it again from the catalogue.
          </span>
          <button
            type="button"
            onClick={() => setSeedExpired(false)}
            className="shrink-0 text-xs text-muted underline underline-offset-2 hover:text-accent"
          >
            Dismiss
          </button>
        </div>
      )}
      <div className="relative flex-1">
        {/* `pendingLoad` belongs in this test, and it is not redundant: the
            effect that applies a save lives INSIDE the diagram, so a save
            whose `rootExternalIds` is empty (every selected bench was hidden
            before saving) would leave the selection empty, the canvas empty,
            the diagram unmounted — and the load would silently never run.
            The content of a save is only knowable once the component holding
            it exists, so the intent to load has to be enough to mount it. */}
        {selectedBenches.length > 0 || graphNodeCount > 0 || pendingLoad !== null ? (
          <DependencyGraph
            ref={graphRef}
            benches={selectedBenches}
            allBenches={labTestMeans}
            onDirty={handleDirty}
            pendingLoad={pendingLoad}
            onPendingLoadConsumed={handlePendingLoadConsumed}
            onRootHidden={handleRootHidden}
            onNodeCountChange={setGraphNodeCount}
          />
        ) : (
          <InteractionEmptyState reason="no-selection" />
        )}
      </div>
    </div>
  );
}
