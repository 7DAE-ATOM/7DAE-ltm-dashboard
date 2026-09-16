type Props = {
  count: number;
  disabled: boolean;
  isExporting: boolean;
  onClick: () => void;
};

export default function ExportPdfButton({
  count,
  disabled,
  isExporting,
  onClick,
}: Readonly<Props>) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="mt-3 w-full text-xs font-mono px-3 py-2 rounded border border-border bg-surface hover:bg-accent/10 hover:text-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {isExporting ? "Generating PDF…" : `Export PDF (${count})`}
    </button>
  );
}
