import type { DependencyRelationKind } from "@/lib/types";

/**
 * The two axes of a dependency edge are orthogonal and must stay that way:
 * the **color** carries the relation kind (`--color-graph-<kind>`), the
 * **stroke pattern** carries the dependency level. This module owns the
 * second axis alone, for both `/depgraph` (React Flow) and `/depview` (SVG
 * radial) plus their two legends — before it existed each of the four
 * inlined its own patterns and the legends had already drifted from the
 * diagrams ("4 3" vs "6 4").
 */
export type EffectiveDependencyType = "mandatory" | "optional" | "no-data";

/**
 * A "shared-resource" relation is optional by nature — the backend never
 * sends a dependencyType for it, so an absent value there means "optional",
 * not "no data". For `depends-on`/`supports`, absent really does mean
 * undetermined.
 */
export function resolveDependencyType(
  dependencyType: "mandatory" | "optional" | undefined,
  kind: DependencyRelationKind | "depends-on" | "shared-resource",
): EffectiveDependencyType {
  if (dependencyType) return dependencyType;
  return kind === "shared-resource" ? "optional" : "no-data";
}

/**
 * SVG stroke properties for a dependency level. "no-data" is a zero-length
 * dash with a round cap: the cap alone paints a disc of diameter
 * `stroke-width`, giving evenly spaced dots — a third pattern that reads as
 * clearly distinct from the solid and dashed ones without stealing the color
 * axis. (Should a renderer refuse a 0-length dash, "0.01 6" is the same
 * picture.)
 */
export function dependencyStrokeStyle(type: EffectiveDependencyType): {
  strokeDasharray?: string;
  strokeLinecap?: "round";
} {
  switch (type) {
    case "optional":
      return { strokeDasharray: "6 4" };
    case "no-data":
      return { strokeDasharray: "0 6", strokeLinecap: "round" };
    default:
      return {};
  }
}

/** Legend rows, in the order the two legends display them. */
export const DEPENDENCY_LEVEL_ITEMS: { type: EffectiveDependencyType; label: string }[] = [
  { type: "mandatory", label: "Mandatory" },
  { type: "optional", label: "Optional" },
  { type: "no-data", label: "No data" },
];
