import clsx from "clsx";

type Props = { size?: number; className?: string };

/** Magnifying glass — opens the selected lab test means list in a dialog
 * (Dependency Graph toolbar). */
export default function ZoomIcon({ size = 14, className }: Readonly<Props>) {
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
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-4.5-4.5" />
    </svg>
  );
}
