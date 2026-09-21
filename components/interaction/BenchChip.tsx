import clsx from "clsx";
import type { LabTestMean } from "@/lib/types";

type Props = {
  bench: LabTestMean;
  onRemove: (externalId: string) => void;
  /** `compact` in the toolbar bar, `large` in the enlarged dialog. The size is
   * the only difference between the two views — markup and remove action are
   * shared so they can never drift apart. */
  size?: "compact" | "large";
};

/** One selected lab test mean in the Dependency Graph selection, with its
 * remove button. */
export default function BenchChip({
  bench,
  onRemove,
  size = "compact",
}: Readonly<Props>) {
  const large = size === "large";
  return (
    <span
      className={clsx(
        // `max-w-full break-words` so a long name wraps inside its own chip
        // instead of overflowing it — the dialog is wide enough to show names
        // the compact bar would have clipped.
        "flex max-w-full items-center gap-1.5 break-words rounded-card border border-border bg-surface-2 text-fg",
        large ? "px-3 py-1.5 text-sm" : "px-2.5 py-1 text-xs",
      )}
    >
      {bench.name}
      <button
        type="button"
        onClick={() => onRemove(bench.externalId)}
        aria-label={`Remove ${bench.name}`}
        className="shrink-0 text-muted hover:text-danger"
      >
        ✕
      </button>
    </span>
  );
}
