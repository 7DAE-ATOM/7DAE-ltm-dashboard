import type { LabTestMeanStatus } from "@/lib/types";
import clsx from "clsx";
import StatusIcon from "./icons/StatusIcon";

const labels: Record<LabTestMeanStatus, string> = {
  operational: "In Service",
  mothballed: "Mothballed",
  "out-of-service": "Dismantled",
  "in-project": "In Development",
};

const colors: Record<LabTestMeanStatus, string> = {
  operational: "bg-success/15 text-success",
  mothballed: "bg-warning/15 text-warning",
  "out-of-service": "bg-danger/15 text-danger",
  "in-project": "bg-accent/15 text-accent",
};

export default function BadgeStatus({
  status,
  withIcon = false,
}: Readonly<{
  status: LabTestMeanStatus;
  withIcon?: boolean;
}>) {
  return (
    <span
      className={clsx(
        "badge-status inline-flex items-center px-2 py-0.5 rounded font-medium",
        colors[status]
      )}
    >
      {withIcon ? (
        <StatusIcon status={status} className="mr-1.5" />
      ) : (
        <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5" />
      )}
      {labels[status]}
    </span>
  );
}
