import clsx from "clsx";

type Props = { size?: number; className?: string };

/** Cross — dialog dismiss button. `AboutDialog` and `SaveLoadControls` still
 * carry their own inline copies; migrating them here is a separate cleanup. */
export default function CloseIcon({ size = 16, className }: Readonly<Props>) {
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
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
