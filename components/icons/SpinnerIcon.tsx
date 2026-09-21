import clsx from "clsx";

type Props = { size?: number; className?: string };

/** The same arrows-in-a-circle glyph `RefreshButton` draws inline, extracted
 * so the catalogue's Export PDF action can borrow it for its busy state. */
export default function SpinnerIcon({ size = 20, className }: Readonly<Props>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={clsx(className)}
    >
      <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
      <path d="M3 21v-5h5" />
    </svg>
  );
}
