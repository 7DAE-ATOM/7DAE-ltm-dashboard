"use client";

/**
 * The catalogue → dependency graph bridge: the catalogue's "Open in Dependency
 * Graph" action writes the filtered benches' `externalId`s into the `/depgraph`
 * URL, and `InteractionClient` reads them back as the diagram's roots.
 *
 * Both sides live here so the thresholds and the `?ids=` grammar can never
 * drift apart. Ids are the bench `externalId` — the same thing `?ids=` has
 * always meant on that page, which is why a small selection needs no special
 * handling at all: the plain URL already *is* the page's own state.
 */

/** Above this, opening the graph warns first: the canvas gets dense and the
 * initial layout noticeably longer. It is only a warning — the user can go
 * ahead, and there is no ceiling above it. */
export const SEED_CONFIRM_THRESHOLD = 30;

/** Trailing slash on purpose: `next.config.mjs` sets `trailingSlash: true`.
 * The result is fed to `next/link`, which prefixes the (prod-only) `basePath`
 * — a raw `<a href>` would 404 behind the AFTER gateway. */
export function buildDepgraphHref(ids: string[]): string {
  return `/depgraph/?ids=${ids.join(",")}`;
}

/* ------------------------------------------------------------------ *
 * Token relay — for selections too large to travel comfortably in the URL.
 *
 * `localStorage`, not `sessionStorage`: the graph tab is opened with
 * `noopener`, which makes it a detached context that does NOT inherit the
 * opener's sessionStorage.
 * ------------------------------------------------------------------ */

const SEED_STORAGE_PREFIX = "depgraph-seed:";

/** Long enough to survive a distracted user, short enough that abandoned
 * entries don't pile up. */
export const SEED_TOKEN_TTL_MS = 30 * 60 * 1000;

type StoredSeed = { ids: string[]; createdAt: number };

/** Resolved tokens, kept for the lifetime of the page. `consumeSeedIds`
 * deletes the entry on first read, so without this memo StrictMode's
 * mount → unmount → mount would report the second read as expired. */
const consumed = new Map<string, string[]>();

function storage(): Storage | null {
  try {
    return globalThis.localStorage;
  } catch {
    // Private mode, blocked site data — the caller falls back to `?ids=`.
    return null;
  }
}

/** Drops entries past their TTL, left behind by opens that never landed. */
function purgeStaleSeeds(store: Storage): void {
  const now = Date.now();
  for (let i = store.length - 1; i >= 0; i--) {
    const key = store.key(i);
    if (!key?.startsWith(SEED_STORAGE_PREFIX)) continue;
    try {
      const raw = store.getItem(key);
      const parsed = raw ? (JSON.parse(raw) as StoredSeed) : null;
      if (!parsed || now - parsed.createdAt > SEED_TOKEN_TTL_MS) {
        store.removeItem(key);
      }
    } catch {
      store.removeItem(key);
    }
  }
}

/** Writes the selection under a fresh token. Returns `null` when storage is
 * unavailable or full — the caller then keeps the plain `?ids=` URL rather
 * than doing nothing. */
export function storeSeedIds(ids: string[]): string | null {
  const store = storage();
  if (!store) return null;
  const token =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  try {
    purgeStaleSeeds(store);
    const payload: StoredSeed = { ids, createdAt: Date.now() };
    store.setItem(`${SEED_STORAGE_PREFIX}${token}`, JSON.stringify(payload));
    return token;
  } catch {
    return null;
  }
}

/** Reads a token **once**: the entry is removed on read, so reloading the
 * graph tab reports an expired link rather than silently re-seeding.
 * `null` when the token is unknown, malformed or past its TTL. */
export function consumeSeedIds(token: string): string[] | null {
  const memoized = consumed.get(token);
  if (memoized) return memoized;
  const store = storage();
  if (!store) return null;
  const key = `${SEED_STORAGE_PREFIX}${token}`;
  try {
    const raw = store.getItem(key);
    store.removeItem(key);
    purgeStaleSeeds(store);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredSeed;
    if (
      !Array.isArray(parsed?.ids) ||
      Date.now() - parsed.createdAt > SEED_TOKEN_TTL_MS
    ) {
      return null;
    }
    consumed.set(token, parsed.ids);
    return parsed.ids;
  } catch {
    return null;
  }
}
