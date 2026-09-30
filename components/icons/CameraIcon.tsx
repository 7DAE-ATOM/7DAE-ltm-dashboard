import clsx from "clsx";

type Props = { size?: number; className?: string };

/**
 * A camera. Heads the KPI page's "LTM Photos" card. Stroke icon,
 * inherits the text colour; decorative, the card title carries the meaning.
 *
 * Used on: components/kpi/PhotoCoverage.tsx
 */
export default function CameraIcon({ size = 20, className }: Props) {
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
      <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  );
}
