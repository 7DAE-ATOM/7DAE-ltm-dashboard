import { COMPLEXITY_NA } from "@/lib/labtestmeans";
import type { LabTestMeanStatus, LabTestMeanType } from "@/lib/types";

export const STATUS_LABELS: Record<LabTestMeanStatus, string> = {
  operational: "In Service",
  mothballed: "Mothballed",
  "out-of-service": "Dismantled",
  "in-project": "In Development",
};

export const TYPE_LABELS: Record<LabTestMeanType, string> = {
  SIMU: "SIMULATOR",
  SIB: "SIB",
  FIB: "FIB",
  RT: "RT",
  SHARE: "SHARED RESOURCE",
  NA: "NA",
};

export const COMPLEXITY_LABELS: Record<string, string> = {
  simple: "Simple",
  medium: "Medium",
  complex: "Complex",
  [COMPLEXITY_NA]: "NA",
};
