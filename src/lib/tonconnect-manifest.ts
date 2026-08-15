/**
 * TON Connect requires the manifest `url` to match the origin the app is served
 * from. A manifest hard-coded to one domain makes wallets refuse to connect
 * (and therefore every payment fails) on any other host.
 *
 * On the production domain we use the static manifest. Anywhere else (Lovable
 * preview / published domain) we ask the backend for a manifest generated for
 * that exact origin, and fall back to the static manifest if that endpoint is
 * not reachable.
 */
const PRODUCTION_ORIGIN = "https://nova.megsyai.com";
const PRODUCTION_MANIFEST = `${PRODUCTION_ORIGIN}/tonconnect-manifest.json`;
const MANIFEST_ENDPOINT = "https://ltgampdtawuefwwayncx.supabase.co/functions/v1/tonconnect-manifest";

/** Synchronous best guess, safe to use for the first render. */
export function resolveTonManifestUrl(): string {
  if (typeof window === "undefined") return PRODUCTION_MANIFEST;
  const origin = window.location.origin;
  if (origin === PRODUCTION_ORIGIN) return PRODUCTION_MANIFEST;
  if (origin.startsWith("http://")) return PRODUCTION_MANIFEST;
  return `${origin}/tonconnect-manifest.json`;
}

/**
 * Picks a manifest whose `url` matches the current origin when possible.
 * Returns the production manifest when nothing better is available.
 */
export async function resolveBestTonManifestUrl(): Promise<string> {
  if (typeof window === "undefined") return PRODUCTION_MANIFEST;
  const origin = window.location.origin;
  if (origin === PRODUCTION_ORIGIN || origin.startsWith("http://")) return PRODUCTION_MANIFEST;

  const dynamicUrl = `${MANIFEST_ENDPOINT}?origin=${encodeURIComponent(origin)}`;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(dynamicUrl, { signal: controller.signal }).finally(() =>
      clearTimeout(timer),
    );
    if (res.ok) {
      const json: any = await res.json();
      if (json?.url === origin) return dynamicUrl;
    }
  } catch {
    /* fall through */
  }

  return `${origin}/tonconnect-manifest.json`;
}
