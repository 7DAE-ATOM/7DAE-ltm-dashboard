import type { ComponentType, CSSProperties } from "react";
import clsx from "clsx";
import { lifecycleStepState } from "@/lib/lifecycleDate";
import type { Lifecycle } from "@/lib/types";
import {
  KickoffIcon,
  InServiceIcon,
  MothballedIcon,
  DismantledIcon,
} from "@/components/icons/LifecycleStepIcon";
import { formatDate } from "@/lib/format-date";

type StepKey = "kickoff" | "inService" | "mothballed" | "dismantled";

type StepDef = {
  key: StepKey;
  label: string;
  Icon: ComponentType<{ size?: number; className?: string }>;
  colorVar: string;
  reachedDescription: (formattedDate: string) => string;
  /** A date in the future: the step is planned, not reached. */
  plannedDescription: (formattedDate: string) => string;
  unreachedDescription: string;
};

const STEPS: StepDef[] = [
  {
    key: "kickoff",
    label: "Kickoff",
    Icon: KickoffIcon,
    colorVar: "var(--color-accent)",
    reachedDescription: (d) => `Project started in ${d}`,
    plannedDescription: (d) => `Kickoff planned for ${d}`,
    unreachedDescription: "Not started",
  },
  {
    key: "inService",
    label: "In Service",
    Icon: InServiceIcon,
    colorVar: "var(--color-success)",
    reachedDescription: (d) => `In service since ${d}`,
    plannedDescription: (d) => `Planned entry into service: ${d}`,
    unreachedDescription: "Not yet in service",
  },
  {
    key: "mothballed",
    label: "Mothballed",
    Icon: MothballedIcon,
    colorVar: "var(--color-warning)",
    reachedDescription: (d) => `Mothballed since ${d}`,
    plannedDescription: (d) => `Mothballing planned for ${d}`,
    unreachedDescription: "Not mothballed",
  },
  {
    key: "dismantled",
    label: "Dismantled",
    Icon: DismantledIcon,
    colorVar: "var(--color-danger)",
    reachedDescription: (d) => `Dismantled in ${d}`,
    plannedDescription: (d) => `Dismantling planned for ${d}`,
    unreachedDescription: "Still in service",
  },
];

function StepCard({
  step,
  rawDate,
}: Readonly<{
  step: StepDef;
  rawDate?: string;
}>) {
  // A date in the future is a PLANNED step (lib/lifecycleDate.ts): dashed
  // border, hollow dot ringed in the step's colour, faded icon, future tense.
  const state = lifecycleStepState(rawDate);
  const reached = state === "reached";
  const planned = state === "planned";
  const formatted = formatDate(rawDate?.trim());
  let description = step.unreachedDescription;
  if (reached) description = step.reachedDescription(formatted);
  else if (planned) description = step.plannedDescription(formatted);

  let dotStyle: CSSProperties = {
    backgroundColor: "transparent",
    boxShadow: "inset 0 0 0 1px var(--color-muted)",
  };
  if (reached) dotStyle = { backgroundColor: step.colorVar };
  else if (planned) dotStyle = { backgroundColor: "transparent", boxShadow: `inset 0 0 0 1.5px ${step.colorVar}` };

  return (
    <li
      className={clsx(
        "pl-3 py-1.5 border-l-[3px] flex items-start gap-3",
        planned && "border-dashed",
      )}
      style={{
        borderLeftColor: reached || planned ? step.colorVar : "var(--color-border)",
      }}
    >
      <div
        className={clsx("flex items-center gap-2 shrink-0", planned && "opacity-60")}
        style={{ color: reached || planned ? step.colorVar : "var(--color-muted)" }}
      >
        <span className="inline-block w-2 h-2 rounded-full" style={dotStyle} />
        <step.Icon size={18} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-fg">{step.label}</div>
        <div className="text-xs text-muted mt-0.5">{description}</div>
      </div>
    </li>
  );
}

export default function LifecycleSection({
  lifecycle,
}: Readonly<{
  lifecycle: Lifecycle;
}>) {
  return (
    <ul className="space-y-3">
      {STEPS.map((s) => (
        <StepCard key={s.key} step={s} rawDate={lifecycle[s.key]} />
      ))}
    </ul>
  );
}
