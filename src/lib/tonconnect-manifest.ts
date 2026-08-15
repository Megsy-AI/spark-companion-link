/**
 * TON Connect requires the manifest `url` to match the origin the app is served
 * from. A manifest hard-coded to one domain makes wallets silently refuse to
 * connect (and therefore every payment fails) on any other host.
 *
 * On the production domain we use the static manifest. Anywhere else (Lovable
 * preview / published domain) we ask the backend for a manifest generated for
 * that exact origin.
 */
const PRODUCTION_ORIGIN = "https://nova.megsyai.com";
const MANIFEST_ENDPOINT = "https://ltgampdtawuefwwayncx.supabase.co/functions/v1/tonconnect-manifest";

export function resolveTonManifestUrl(): string {
  if (typeof window === "undefined") {
    return `${PRODUCTION_ORIGIN}/tonconnect-manifest.json`;
  }

  const origin = window.location.origin;

  if (origin === PRODUCTION_ORIGIN) {
    return `${PRODUCTION_ORIGIN}/tonconnect-manifest.json`;
  }

  // Local development has no https origin a wallet can reach: keep production.
  if (origin.startsWith("http://")) {
    return `${PRODUCTION_ORIGIN}/tonconnect-manifest.json`;
  }

  return `${MANIFEST_ENDPOINT}?origin=${encodeURIComponent(origin)}`;
}
