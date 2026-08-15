/**
 * TON Connect requires the manifest `url` to match the origin the app is served
 * from. A manifest hard-coded to one domain makes wallets refuse to connect
 * (and therefore every payment fails) on any other host.
 *
 * Use the stable production manifest. Tonkeeper must be able to fetch this URL
 * itself, and random deployment URLs or Edge Function query URLs are not
 * reliable wallet-facing manifest locations.
 */
export function resolveTonManifestUrl(): string {
  if (typeof window !== "undefined" && window.location.protocol === "https:") {
    return `${window.location.origin}/tonconnect-manifest.json`;
  }
  return "https://nova.megsyai.com/tonconnect-manifest.json";
}
