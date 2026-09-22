/**
 * Turns a snapshot of the dependency graph into Mermaid flowchart text.
 *
 * No React, no xyflow: the exporter only knows a plain description of what is
 * on screen, so it can be read — and reasoned about — on its own.
 *
 * The output is meant to be opened in draw.io (Arrange → Insert → Advanced →
 * Mermaid), which converts it to native shapes. That conversion is why the
 * semantics live in the **shapes** rather than in `classDef` styling: a shape
 * survives it, a style rule may not.
 */

export type DiagramSnapshot = {
  benches: {
    /** The bench's `externalId`, which is also its node id on the canvas. */
    id: string;
    /** Full name, untruncated: the 20-character cap on screen exists so a
     * card matches the box the layout reserved for it, not because the user
     * asked for less. */
    name: string;
    /** A selected bench (it has a chip), as opposed to one brought in by
     * expanding. Rendered with a distinct shape. */
    isRoot: boolean;
  }[];
  /** Only the relations actually drawn: a kind switched off in the legend is
   * expected to have been filtered out before reaching here. */
  edges: {
    source: string;
    target: string;
    kind: "depends-on" | "shared-resource";
    /** Absent means "undetermined" — drawn gray on screen, and with no
     * Mermaid equivalent it reads the same as "mandatory" here. */
    dependencyType?: "mandatory" | "optional";
  }[];
};

/**
 * Mermaid labels are wrapped in double quotes, so an inner quote ends the
 * label and breaks the whole diagram. `#quot;` is Mermaid's entity form for
 * it. Line breaks are folded away for the same reason — a label is one line.
 */
function label(raw: string): string {
  return raw.replace(/\s+/g, " ").trim().replace(/"/g, "#quot;");
}

/**
 * Serialises `snapshot` to a Mermaid `flowchart`.
 *
 * Deterministic: the same graph always yields the same text, byte for byte,
 * which is what makes the file worth versioning next to a document.
 */
export function toMermaid(snapshot: DiagramSnapshot): string {
  // Short sequential ids rather than the bench's own `externalId`: the latter
  // is human-chosen and can hold characters Mermaid reads as syntax. The
  // alias sidesteps both the escaping and any collision question, and
  // traceability rides in the label instead.
  const alias = new Map<string, string>();
  const lines: string[] = ["flowchart LR"];

  snapshot.benches.forEach((bench, i) => {
    const id = `b${i}`;
    alias.set(bench.id, id);
    // Name plus id: the alias below throws the real id away, and a diagram
    // pasted into a document is worth nothing if nobody can trace a box back
    // to the catalogue.
    const text = label(`${bench.name} — ${bench.id}`);
    // `[[…]]` for a selected bench, `[…]` for one reached by expanding.
    lines.push(bench.isRoot ? `  ${id}[["${text}"]]` : `  ${id}["${text}"]`);
  });

  for (const edge of snapshot.edges) {
    const source = alias.get(edge.source);
    const target = alias.get(edge.target);
    if (!source || !target) continue;
    // Mermaid has no per-edge colour, so the two axes the canvas shows with
    // colour and dashing both become a dotted line with a word on it.
    // "mandatory" and "undetermined" share the plain arrow: inventing a
    // label for an absent value would be noise.
    if (edge.kind === "shared-resource") {
      lines.push(`  ${source} -. shared .-> ${target}`);
    } else if (edge.dependencyType === "optional") {
      lines.push(`  ${source} -. optional .-> ${target}`);
    } else {
      lines.push(`  ${source} --> ${target}`);
    }
  }

  return `${lines.join("\n")}\n`;
}
