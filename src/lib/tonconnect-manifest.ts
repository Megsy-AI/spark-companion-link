/**
 * TON Connect requires the manifest `url` to match the origin the app is served
 * from. A manifest hard-coded to one domain makes wallets refuse to connect
 * (and therefore every payment fails) on any other host.
 *
 * Use the stable production manifest. Tonkeeper must be able to fetch this URL
 * itself, and random deployment URLs or Edge Function query URLs are not
 * reliable wallet-facing manifest locations.
 */
const PRODUCTION_ORIGIN = "https://nova.megsyai.com";
const PRODUCTION_MANIFEST = `${PRODUCTION_ORIGIN}/tonconnect-manifest.json`;

/** Synchronous best guess, safe to use for the first render. */
export function resolveTonManifestUrl(): string {
  return PRODUCTION_MANIFEST;
}
