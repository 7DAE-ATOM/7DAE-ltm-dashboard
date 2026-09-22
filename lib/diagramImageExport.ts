/**
 * Turns the dependency-graph canvas into a PNG or an SVG.
 *
 * Unlike `lib/diagramMermaid.ts`, which rebuilds the diagram from the model,
 * this captures what the browser actually renders. Everything that shapes the
 * display — the card display toggles, the theme, hand-dragged positions, the
 * bows dialled on individual links, a relation kind switched off in the
 * legend — is therefore honoured without a line of code for it.
 *
 * The caller hands over a DOM element and the logical extent to frame; this
 * module knows nothing about React Flow.
 */

/** Raised when the PNG would exceed what a browser canvas can hold. Its own
 * class so the caller can say something useful instead of "export failed". */
export class ImageExportTooLargeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImageExportTooLargeError";
  }
}

export type CaptureBounds = { x: number; y: number; width: number; height: number };

/** Logical pixels of breathing room around the diagram, so nothing touches
 * the edge of the image. Also absorbs the quality-seal tag, which straddles
 * the top border of a card and so paints slightly outside its box. */
const PADDING = 32;

/** Output pixels per logical pixel. What has to stay constant across graph
 * sizes is the scale applied to *text* — a 14px card name always lands at
 * 28px — not the file's dimensions. Aiming for a fixed output width instead
 * would keep the dimensions and let legibility collapse on large graphs. */
const PIXEL_RATIO = 2;

/** Browsers cap both a canvas' side and its total area; past either, the
 * canvas comes back blank instead of throwing. Chrome's practical ceiling. */
const MAX_CANVAS_SIDE = 16384;
const MAX_CANVAS_AREA = MAX_CANVAS_SIDE * MAX_CANVAS_SIDE;

/** Card chrome opts out of the capture by carrying this attribute — today the
 * resize handles, which unlike the edge curvature handle are in the DOM at all
 * times rather than only while hovered. Marking the element beats guessing a
 * selector from here, and the next affordance only has to set it. */
const EXCLUDE_ATTRIBUTE = "data-export-hide";

/** `html-to-image` **keeps** a node when this returns true — it is an
 * inclusion filter, not an exclusion one. */
function shouldInclude(node: HTMLElement): boolean {
  // The filter also visits SVG elements (the edges), which have no `dataset`
  // in the same sense — `getAttribute` works on both.
  return typeof node.getAttribute !== "function" || node.getAttribute(EXCLUDE_ATTRIBUTE) === null;
}

/**
 * Renders `viewport` framed on `bounds`.
 *
 * The transform is applied to the **clone** the library builds, never to the
 * live element: the on-screen zoom and pan are left exactly as they were.
 */
export async function captureViewport(
  viewport: HTMLElement,
  bounds: CaptureBounds,
  format: "png" | "svg",
): Promise<Blob> {
  const width = Math.ceil(bounds.width + PADDING * 2);
  const height = Math.ceil(bounds.height + PADDING * 2);

  if (format === "png") {
    const outWidth = width * PIXEL_RATIO;
    const outHeight = height * PIXEL_RATIO;
    if (
      outWidth > MAX_CANVAS_SIDE ||
      outHeight > MAX_CANVAS_SIDE ||
      outWidth * outHeight > MAX_CANVAS_AREA
    ) {
      throw new ImageExportTooLargeError(
        "This diagram is too large for a PNG. Export it as SVG or Mermaid instead.",
      );
    }
  }

  const options = {
    width,
    height,
    // No `backgroundColor`: that is what leaves the image transparent.
    style: {
      width: `${width}px`,
      height: `${height}px`,
      transform: `translate(${PADDING - bounds.x}px, ${PADDING - bounds.y}px)`,
    },
    // This app names its fonts rather than loading them ("Inter", system-ui,
    // …), so there is nothing to inline — but the library would still go
    // looking. Skipping keeps the export free of any network call.
    skipFonts: true,
    filter: shouldInclude,
  } as const;

  const htmlToImage = await import("html-to-image");

  if (format === "svg") {
    const dataUrl = await htmlToImage.toSvg(viewport, options);
    return new Blob([decodeURIComponent(dataUrl.split(",")[1] ?? "")], {
      type: "image/svg+xml;charset=utf-8",
    });
  }

  const blob = await htmlToImage.toBlob(viewport, {
    ...options,
    pixelRatio: PIXEL_RATIO,
  });
  if (!blob) throw new Error("The browser returned an empty image.");
  return blob;
}
