"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { InteractionSave } from "@/lib/interactionSaves";
import { parseImportedSave } from "@/lib/interactionSaves";

type Props = {
  activeSaveName: string | null;
  dirty: boolean;
  saves: string[];
  errorMessage: string | null;
  disableSave?: boolean;
  /** Rendered between the save disk and the `…` menu. A slot rather than an
   * export prop: this component has no business knowing what an image export
   * is, and the alternative was splitting it in two just for placement. */
  middleSlot?: ReactNode;
  onSaveAs: (name: string) => void;
  onSave: () => void;
  onLoad: (name: string) => void;
  onDelete: (name: string) => void;
  onExportActive: () => void;
  onExportSave: (name: string) => void;
  onImport: (name: string, data: InteractionSave) => void;
  onImportError: (message: string) => void;
};

export default function SaveLoadControls({
  activeSaveName,
  dirty,
  saves,
  errorMessage,
  disableSave = false,
  middleSlot,
  onSaveAs,
  onSave,
  onLoad,
  onDelete,
  onExportActive,
  onExportSave,
  onImport,
  onImportError,
}: Readonly<Props>) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [popup, setPopup] = useState<"saveAs" | "load" | "import" | null>(null);
  const [name, setName] = useState("");
  const [importDraft, setImportDraft] = useState<{ data: InteractionSave; name: string } | null>(
    null,
  );
  const rootRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [menuOpen]);

  function submitSaveAs() {
    const trimmed = name.trim();
    if (!trimmed) return; // empty/whitespace names are refused
    onSaveAs(trimmed);
    setName("");
    setPopup(null);
  }

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;
    try {
      const raw = await file.text();
      const data = parseImportedSave(raw);
      const suggested = file.name.replace(/\.json$/i, "").trim() || "Imported diagram";
      setImportDraft({ data, name: suggested });
      setPopup("import");
    } catch (err) {
      onImportError(err instanceof Error ? err.message : "This file could not be imported.");
    }
  }

  const importTrimmedName = importDraft?.name.trim() ?? "";
  const importNameConflict = !!importDraft && saves.includes(importTrimmedName);

  function submitImport() {
    if (!importDraft || !importTrimmedName || importNameConflict) return;
    onImport(importTrimmedName, importDraft.data);
    setImportDraft(null);
    setPopup(null);
  }

  const saveDisabled = !activeSaveName || disableSave;
  const saveAsDisabled = disableSave;

  let saveIconClass = "text-muted opacity-50 cursor-not-allowed";
  if (activeSaveName) {
    saveIconClass = dirty
      ? "text-danger cursor-pointer hover:opacity-80"
      : "text-success cursor-pointer hover:opacity-80";
  }

  const menuItemClass = (enabled: boolean) =>
    `block w-full px-3 py-1.5 text-left text-sm rounded ${
      enabled ? "text-fg hover:bg-surface-2 cursor-pointer" : "text-muted opacity-60 cursor-not-allowed"
    }`;

  return (
    <div ref={rootRef} className="relative flex items-center gap-1.5">
      <button
        type="button"
        onClick={onSave}
        disabled={!activeSaveName}
        title={activeSaveName ?? undefined}
        aria-label={activeSaveName ? `Save state: ${activeSaveName}` : "Not saved yet"}
        className={`flex h-8 w-8 items-center justify-center rounded-card border border-border bg-surface transition-opacity ${saveIconClass}`}
      >
        <SaveIcon />
      </button>

      {middleSlot}

      <button
        type="button"
        onClick={() => setMenuOpen((o) => !o)}
        className="rounded-card border border-border bg-surface/90 px-2.5 py-1.5 text-xs text-fg backdrop-blur-md hover:bg-surface-2"
      >
        ...
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        onChange={handleFileSelected}
        className="hidden"
      />

      {menuOpen && (
        <div
          role="menu"
          className="absolute right-0 top-full z-30 mt-1 min-w-[160px] rounded-card border border-border bg-surface py-1.5 shadow-2xl"
        >
          <button
            type="button"
            role="menuitem"
            disabled={saveDisabled}
            onClick={() => {
              onSave();
              setMenuOpen(false);
            }}
            className={menuItemClass(!saveDisabled)}
          >
            Save
          </button>
          <button
            type="button"
            role="menuitem"
            disabled={saveAsDisabled}
            onClick={() => {
              setName("");
              setPopup("saveAs");
              setMenuOpen(false);
            }}
            className={menuItemClass(!saveAsDisabled)}
          >
            Save as new
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setPopup("load");
              setMenuOpen(false);
            }}
            className={menuItemClass(true)}
          >
            Load
          </button>
          <button
            type="button"
            role="menuitem"
            disabled={saveDisabled}
            onClick={() => {
              onExportActive();
              setMenuOpen(false);
            }}
            className={menuItemClass(!saveDisabled)}
          >
            Export
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              fileInputRef.current?.click();
              setMenuOpen(false);
            }}
            className={menuItemClass(true)}
          >
            Import
          </button>
        </div>
      )}

      {popup === "saveAs" && (
        <div // NOSONAR: modal backdrop kept as role="presentation" (not <img>), see correction-issues-sonarqube.md
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={(e) => {
            if (e.target === e.currentTarget) setPopup(null);
          }}
          role="presentation"
        >
          <div // NOSONAR: modal panel kept as role="dialog", not native <dialog> (would change close/focus behavior)
            role="dialog"
            aria-modal="true"
            aria-labelledby="save-as-title"
            className="w-full max-w-sm rounded-lg border border-border bg-surface p-5 shadow-xl"
          >
            <h2 id="save-as-title" className="mb-3 text-base font-semibold">
              Save as new
            </h2>
            <input
              autoFocus
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submitSaveAs();
                if (e.key === "Escape") setPopup(null);
              }}
              placeholder="Save name…"
              className="w-full rounded border border-border bg-surface px-3 py-2 text-sm text-fg focus:outline-none focus:border-accent"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPopup(null)}
                className="rounded px-3 py-1.5 text-sm text-muted hover:bg-surface-2"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitSaveAs}
                disabled={!name.trim()}
                className="rounded bg-accent px-3 py-1.5 text-sm font-semibold text-accent-fg disabled:opacity-40"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {popup === "load" && (
        <div // NOSONAR: modal backdrop kept as role="presentation" (not <img>), see correction-issues-sonarqube.md
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={(e) => {
            if (e.target === e.currentTarget) setPopup(null);
          }}
          role="presentation"
        >
          <div // NOSONAR: modal panel kept as role="dialog", not native <dialog> (would change close/focus behavior)
            role="dialog"
            aria-modal="true"
            aria-labelledby="load-title"
            className="w-full max-w-sm max-h-[70vh] overflow-y-auto rounded-lg border border-border bg-surface p-5 shadow-xl"
          >
            <h2 id="load-title" className="mb-3 text-base font-semibold">
              Load
            </h2>
            {saves.length === 0 ? (
              <p className="px-1 py-1.5 text-sm text-muted">No saved diagrams yet.</p>
            ) : (
              <div className="flex flex-col gap-0.5">
                {saves.map((n) => (
                  <div
                    key={n}
                    className="flex items-center gap-1 rounded px-2 py-1.5 text-sm hover:bg-surface-2"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        onLoad(n);
                        setPopup(null);
                      }}
                      className="flex-1 truncate text-left text-fg"
                    >
                      {n}
                    </button>
                    <button
                      type="button"
                      onClick={() => onExportSave(n)}
                      aria-label={`Export ${n}`}
                      className="text-muted hover:text-accent"
                    >
                      <DownloadIcon />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(n)}
                      aria-label={`Delete ${n}`}
                      className="text-muted hover:text-danger"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {popup === "import" && importDraft && (
        <div // NOSONAR: modal backdrop kept as role="presentation" (not <img>), see correction-issues-sonarqube.md
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={(e) => {
            if (e.target !== e.currentTarget) return;
            setImportDraft(null);
            setPopup(null);
          }}
          role="presentation"
        >
          <div // NOSONAR: modal panel kept as role="dialog", not native <dialog> (would change close/focus behavior)
            role="dialog"
            aria-modal="true"
            aria-labelledby="import-title"
            className="w-full max-w-sm rounded-lg border border-border bg-surface p-5 shadow-xl"
          >
            <h2 id="import-title" className="mb-3 text-base font-semibold">
              Import diagram
            </h2>
            <input
              autoFocus
              type="text"
              value={importDraft.name}
              onChange={(e) =>
                setImportDraft((d) => (d ? { ...d, name: e.target.value } : d))
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") submitImport();
                if (e.key === "Escape") {
                  setImportDraft(null);
                  setPopup(null);
                }
              }}
              placeholder="Save name…"
              className="w-full rounded border border-border bg-surface px-3 py-2 text-sm text-fg focus:outline-none focus:border-accent"
            />
            {importNameConflict && (
              <p className="mt-1.5 text-xs text-danger">
                A save named &ldquo;{importTrimmedName}&rdquo; already exists — choose another name.
              </p>
            )}
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setImportDraft(null);
                  setPopup(null);
                }}
                className="rounded px-3 py-1.5 text-sm text-muted hover:bg-surface-2"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitImport}
                disabled={!importTrimmedName || importNameConflict}
                className="rounded bg-accent px-3 py-1.5 text-sm font-semibold text-accent-fg disabled:opacity-40"
              >
                Import
              </button>
            </div>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="fixed top-4 right-4 z-50 max-w-xs rounded-card border border-danger/40 bg-surface px-3 py-2 text-xs text-danger shadow-2xl">
          {errorMessage}
        </div>
      )}
    </div>
  );
}

function SaveIcon() {
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
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" />
      <path d="M17 21v-8H7v8" />
      <path d="M7 3v5h8" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M5 21h14" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 6h18" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
}
