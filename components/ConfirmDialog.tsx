"use client";

import { useEffect, useRef } from "react";

type Props = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * A small modal confirmation, for the one case that needs it: opening a very
 * large selection in the dependency graph.
 *
 * `window.confirm` would have done the job, but it blocks the whole tab and
 * cannot be styled or themed — and the codebase already treats browser modals
 * as something to avoid.
 */
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Continue",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
}: Readonly<Props>) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    confirmRef.current?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    globalThis.addEventListener("keydown", onKeyDown);
    return () => globalThis.removeEventListener("keydown", onKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label={cancelLabel}
        onClick={onCancel}
        className="absolute inset-0 w-full cursor-default bg-black/60"
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
        className="relative w-full max-w-sm rounded-card border border-border bg-surface p-5 shadow-2xl"
      >
        <h2 id="confirm-dialog-title" className="text-base font-bold text-fg">
          {title}
        </h2>
        <p id="confirm-dialog-message" className="mt-2 text-sm text-muted">
          {message}
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded border border-border bg-surface px-3 py-1.5 text-sm text-fg hover:border-accent/50"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            className="rounded bg-accent px-3 py-1.5 text-sm font-semibold text-accent-fg"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
