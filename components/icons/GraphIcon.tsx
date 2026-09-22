import clsx from "clsx";

type Props = { size?: number; className?: string };

/** Three linked nodes — the catalogue's "Open in Dependency Graph" action. */
export default function GraphIcon({ size = 20, className }: Readonly<Props>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={clsx(className)}
    >
      <circle cx="6" cy="6" r="2.5" />
      <circle cx="18" cy="9" r="2.5" />
      <circle cx="9" cy="18" r="2.5" />
      <path d="M8.3 7.1 15.7 8" />
      <path d="M7 8.4 8.3 15.6" />
    </svg>
  );
}
