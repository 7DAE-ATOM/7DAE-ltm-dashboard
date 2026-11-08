import clsx from "clsx";

type Props = { size?: number; className?: string };

/**
 * A chain link. Heads the identifier pills (External Ref, Functional Code)
 * of the detail page header. Stroke icon, inherits the text colour;
 * decorative, the pill's label carries the meaning.
 *
 * Used on: components/LabTestMeanHeader.tsx
 */
export default function LinkIcon({ size = 16, className }: Props) {
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
      <path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1.5 1.5" />
      <path d="M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1.5-1.5" />
    </svg>
  );
}
