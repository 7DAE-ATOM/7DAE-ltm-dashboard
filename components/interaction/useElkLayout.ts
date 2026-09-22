"use client";

import { useEffect, useState } from "react";
import ELK, { type ElkExtendedEdge, type ElkNode } from "elkjs/lib/elk.bundled.js";

// One shared instance — elkjs supports concurrent `.layout()` calls on the
// same instance, which this file relies on: one call per connected
// component, all in flight at once.
const elk = new ELK();

// The only layout algorithm `/depgraph` uses — the "layered" option (and
// the algorithm picker that let a user choose between the two) was removed;
// every diagram is radial now.
//
// BUT: ELK's radial provider is single-rooted by construction. It picks the
// first child with no incoming edge, builds a spanning tree from it, and
// leaves every node that tree doesn't reach unpositioned — they all end up
// stacked on one shared coordinate. `/depgraph` is routinely opened with
// several roots (`?ids=a,b,c`) and with benches that have no relation at
// all, so that is the common case, not the edge case. `elk.separate
// ConnectedComponents` does not help: radial ignores it. So we split the
// graph into connected components ourselves, reduce each one to a rooted
// spanning tree (see `spanningTreeEdges` — being connected is not enough,
// radial wants a tree), run radial on each (where it behaves perfectly and
// honours the card sizes), and pack the resulting boxes side by side.
const LAYOUT_OPTIONS: Record<string, string> = {
  "elk.algorithm": "radial",
  "elk.spacing.nodeNode": "40",
};

/** Gap between two packed components, both horizontally and between rows. */
const COMPONENT_GAP = 80;

export type ElkPositions = Map<string, { x: number; y: number }>;

export type ElkLayoutState =
  | { status: "loading" }
  | { status: "ok"; positions: ElkPositions }
  | { status: "error"; error: unknown };

type Component = { id: string; children: ElkNode[]; edges: NonNullable<ElkNode["edges"]> };

/** A laid-out component: node positions relative to its own origin, plus the
 * bounding box those positions occupy. */
type LaidOutComponent = { id: string; width: number; height: number; positions: ElkPositions };

/**
 * Splits `graph` into connected components, treating edges as UNDIRECTED.
 *
 * That matters: `toElkGraph` normalises every edge to `root -> neighbor`, so
 * two roots sharing a neighbour are mutually unreachable when following edge
 * direction even though they visibly form one cluster. Splitting on direction
 * would push them into two separate boxes that both claim the same shared
 * neighbour — exactly the opposite of what the picture should show.
 */
function splitConnectedComponents(graph: ElkNode): Component[] {
  const children = graph.children ?? [];
  const edges = graph.edges ?? [];

  const parent = new Map<string, string>();
  children.forEach((child) => parent.set(child.id, child.id));

  const find = (id: string): string => {
    let root = id;
    while (parent.get(root) !== root) root = parent.get(root)!;
    // Path compression — these graphs are small, but it keeps `find` flat.
    let cursor = id;
    while (parent.get(cursor) !== root) {
      const next = parent.get(cursor)!;
      parent.set(cursor, root);
      cursor = next;
    }
    return root;
  };

  edges.forEach((edge) => {
    const source = edge.sources?.[0];
    const target = edge.targets?.[0];
    if (!source || !target) return;
    if (!parent.has(source) || !parent.has(target)) return;
    const a = find(source);
    const b = find(target);
    if (a !== b) parent.set(a, b);
  });

  const byRoot = new Map<string, Component>();
  const componentFor = (root: string): Component => {
    let component = byRoot.get(root);
    if (!component) {
      component = { id: root, children: [], edges: [] };
      byRoot.set(root, component);
    }
    return component;
  };

  children.forEach((child) => componentFor(find(child.id)).children.push(child));
  edges.forEach((edge) => {
    const source = edge.sources?.[0];
    const target = edge.targets?.[0];
    // Both ends must be known children — handing ELK an edge that references
    // a node absent from the component it lands in makes `elk.layout` throw.
    if (!source || !target) return;
    if (!parent.has(source) || !parent.has(target)) return;
    componentFor(find(source)).edges.push(edge);
  });

  return [...byRoot.values()];
}

/**
 * Reduces a component's edges to a spanning tree, oriented away from one root.
 *
 * Splitting into components is necessary but not sufficient: radial wants an
 * actual TREE, rooted at the one child it finds with no incoming edge, and
 * anything that tree doesn't reach by following edge DIRECTION collapses onto
 * a single point — even inside one connected component. Two selected benches
 * supporting the same third one (`A -> S`, `B -> S`) are exactly that: S has
 * an incoming edge from each, so ELK roots at A, and B never gets visited.
 *
 * So we pick a root, walk the component undirected, and hand ELK only the
 * edges of that walk, each oriented parent -> child. Edges left out (the ones
 * closing a cycle) are a positioning input only — the rendered edges are
 * built separately by `buildGraphStructure`, so nothing disappears from the
 * picture.
 *
 * The root is the component's first child in the caller's order, which is
 * meaningful rather than arbitrary: `toElkGraph` seeds every selected bench
 * before any neighbour, so a selected bench is always preferred as the centre
 * of its star.
 */
function spanningTreeEdges(component: Component): NonNullable<ElkNode["edges"]> {
  const neighbours = new Map<string, { edge: ElkExtendedEdge; other: string }[]>();
  component.children.forEach((child) => neighbours.set(child.id, []));
  component.edges.forEach((edge) => {
    const source = edge.sources[0];
    const target = edge.targets[0];
    neighbours.get(source)?.push({ edge, other: target });
    neighbours.get(target)?.push({ edge, other: source });
  });

  const root = component.children[0].id;
  const visited = new Set<string>([root]);
  const tree: NonNullable<ElkNode["edges"]> = [];
  const queue = [root];

  while (queue.length > 0) {
    const current = queue.shift()!;
    (neighbours.get(current) ?? []).forEach(({ edge, other }) => {
      if (visited.has(other)) return;
      visited.add(other);
      // Re-oriented parent -> child, keeping the original id so nothing else
      // has to care which way round the source edge happened to point.
      tree.push({ ...edge, sources: [current], targets: [other] });
      queue.push(other);
    });
  }

  return tree;
}

/** Lays out one component. A lone node (a bench with no relation at all)
 * skips ELK entirely — there is nothing to arrange, and radial on a single
 * child would only add its own padding. */
async function layoutComponent(component: Component): Promise<LaidOutComponent> {
  if (component.children.length === 1) {
    const only = component.children[0];
    return {
      id: component.id,
      width: only.width ?? 0,
      height: only.height ?? 0,
      positions: new Map([[only.id, { x: 0, y: 0 }]]),
    };
  }

  // ELK mutates the nodes it is handed, and the caller's graph is frozen in a
  // `useState` initializer and may be laid out again — so hand it copies.
  const componentGraph: ElkNode = {
    id: component.id,
    children: component.children.map((child) => ({ ...child })),
    edges: spanningTreeEdges(component),
  };
  const result = await elk.layout(componentGraph, { layoutOptions: LAYOUT_OPTIONS });

  const positions: ElkPositions = new Map();
  (result.children ?? []).forEach((child) => {
    if (typeof child.x === "number" && typeof child.y === "number") {
      positions.set(child.id, { x: child.x, y: child.y });
    }
  });

  return {
    id: component.id,
    width: result.width ?? 0,
    height: result.height ?? 0,
    positions,
  };
}

/** Packs component boxes into rows, largest first, aiming for a roughly
 * square overall block so the initial `fitView` isn't a thin ribbon. */
function packComponents(laidOut: LaidOutComponent[]): ElkPositions {
  const ordered = [...laidOut].sort((a, b) => {
    const areaDiff = b.width * b.height - a.width * a.height;
    // Ties broken on id so the same URL always yields the same diagram.
    return areaDiff !== 0 ? areaDiff : a.id.localeCompare(b.id);
  });

  const totalArea = ordered.reduce((sum, c) => sum + c.width * c.height, 0);
  const widest = ordered.reduce((max, c) => Math.max(max, c.width), 0);
  const rowWidth = Math.max(widest, Math.sqrt(totalArea) * 1.6);

  const positions: ElkPositions = new Map();
  let cursorX = 0;
  let cursorY = 0;
  let rowHeight = 0;

  ordered.forEach((component) => {
    if (cursorX > 0 && cursorX + component.width > rowWidth) {
      cursorX = 0;
      cursorY += rowHeight + COMPONENT_GAP;
      rowHeight = 0;
    }
    component.positions.forEach((position, id) => {
      positions.set(id, { x: cursorX + position.x, y: cursorY + position.y });
    });
    cursorX += component.width + COMPONENT_GAP;
    rowHeight = Math.max(rowHeight, component.height);
  });

  return positions;
}

async function layoutByComponent(graph: ElkNode): Promise<ElkPositions> {
  const components = splitConnectedComponents(graph);
  const laidOut = await Promise.all(components.map(layoutComponent));
  return packComponents(laidOut);
}

/**
 * Runs an ELK radial layout for `graph` — once per connected component, see
 * `LAYOUT_OPTIONS` — and returns its resolved node positions.
 *
 * elkjs has no cancellation API, so a stale result (e.g. the graph changed
 * before this one resolved) is detected via the `cancelled` flag below and
 * silently ignored rather than applied.
 */
export function useElkLayout(graph: ElkNode): ElkLayoutState {
  const [state, setState] = useState<ElkLayoutState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading" });

    layoutByComponent(graph)
      .then((positions) => {
        if (cancelled) return;
        setState({ status: "ok", positions });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        console.error("[useElkLayout] layout failed", error);
        setState({ status: "error", error });
      });

    return () => {
      cancelled = true;
    };
  }, [graph]);

  return state;
}
