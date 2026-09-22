/**
 * Hands a generated file to the browser's download flow.
 *
 * A synthetic anchor rather than `window.open`: no popup blocker to fight,
 * and `download` is what gives the file its name. The object URL is revoked
 * straight away — the click has already started the download.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Strips the characters Windows and POSIX refuse in a filename. Falls back
 * to a neutral name rather than producing an empty one, which would leave the
 * file called just its extension. */
export function sanitizeFilename(name: string): string {
  return name.replaceAll(/[\\/:*?"<>|]/g, "_").trim() || "diagram";
}

/** `YYYY-MM-DD`, the date stamp every export filename carries. */
export function exportDateStamp(): string {
  return new Date().toISOString().slice(0, 10);
}
