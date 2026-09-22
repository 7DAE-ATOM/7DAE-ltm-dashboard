import type { DependencyRelationKind } from "@/lib/types";
import {
  DEPENDENCY_LEVEL_ITEMS,
  dependencyStrokeStyle,
} from "@/lib/dependencyEdgeStyle";

// Same 3 relation kinds as `/depgraph` (see `DependencyLegend.tsx`), but kept
// separate here (not merged into 2) since `buildRadarGraph.ts` already
// colors "supports" distinctly from "depends-on" — no arrow direction on the
// radar to otherwise tell them apart. Colors only actually appear on a
// bench's connected links when it's hovered (see `CircularGraph.tsx`) — at
// rest every link is gray, since "depends on" vs "supports" is meaningful
// only relative to whichever bench you're looking from.
const RELATION_ITEMS: { kind: DependencyRelationKind; label: string }[] = [
  { kind: "depends-on", label: "Depends on" },
  { kind: "supports", label: "Supports" },
  { kind: "shared-resource", label: "Shared resource" },
];

// Purely explanatory — line style is orthogonal to the hover colors above
// (it comes from `dependencyType`, cf. `buildRadarGraph.ts`), always visible
// regardless of hover, same convention as `/depgraph`'s `DependencyLegend`.
const LINE_STYLE_ITEMS = DEPENDENCY_LEVEL_ITEMS.map((item) => ({
  ...item,
  stroke: dependencyStrokeStyle(item.type),
}));

export default function RadarLegend() {
  return (
    <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-0.5 rounded-card bg-surface/90 border border-border px-2 py-2.5 backdrop-blur-md">
      <span className="px-2 pb-1 text-[0.65rem] uppercase tracking-wider text-muted">
        On hover, colored by relation type
      </span>
      {RELATION_ITEMS.map((item) => (
        <div key={item.kind} className="flex items-center gap-2 px-2 py-1 text-xs text-fg/90">
          <svg width="18" height="10" aria-hidden="true" className="shrink-0">
            <line
              x1="0"
              y1="5"
              x2="18"
              y2="5"
              stroke={`var(--color-graph-${item.kind})`}
              strokeWidth="2"
            />
          </svg>
          <span>{item.label}</span>
        </div>
      ))}
      <div className="my-1 border-t border-border" />
      <span className="px-2 pb-1 text-[0.65rem] uppercase tracking-wider text-muted">
        Dependency level
      </span>
      {LINE_STYLE_ITEMS.map((item) => (
        <div key={item.label} className="flex items-center gap-2 px-2 py-1 text-xs text-fg/90">
          <svg width="18" height="10" aria-hidden="true" className="shrink-0">
            <line
              x1="0"
              y1="5"
              x2="18"
              y2="5"
              stroke="var(--color-fg)"
              strokeWidth="2"
              strokeDasharray={item.stroke.strokeDasharray}
              strokeLinecap={item.stroke.strokeLinecap}
            />
          </svg>
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}
