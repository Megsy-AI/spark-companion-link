/**
 * TON Connect requires the manifest `url` to match the origin the app is served
 * from. A manifest hard-coded to one domain makes wallets refuse to connect
 * (and therefore every payment fails) on any other host.
 *
 * Keep the manifest on the same host as the app. Some Tonkeeper versions fail
 * to load a cross-origin Edge Function URL (especially one containing query
 * parameters), while Vite/Vercel always serves this public file directly.
 */
const PRODUCTION_ORIGIN = "https://nova.megsyai.com";
const PRODUCTION_MANIFEST = `${PRODUCTION_ORIGIN}/tonconnect-manifest.json`;

/** Synchronous best guess, safe to use for the first render. */
export function resolveTonManifestUrl(): string {
  if (typeof window === "undefined") return PRODUCTION_MANIFEST;
  const origin = window.location.origin;
  if (origin.startsWith("http://")) return PRODUCTION_MANIFEST;
  return `${origin}/tonconnect-manifest.json`;
}
