const PUBLIC_MANIFEST_ENDPOINT =
  "https://ltgampdtawuefwwayncx.supabase.co/functions/v1/tonconnect-manifest";

function isLovablePreview(hostname: string): boolean {
  return hostname.endsWith(".lovable.app") || hostname.endsWith(".lovableproject.com");
}

/**
 * Lovable preview routes are protected by an auth redirect, so wallets cannot
 * fetch a manifest from the preview origin. Serve that manifest through the
 * public Edge Function while preserving the actual dApp origin inside it.
 * Deployed hosts keep a same-origin static manifest generated at build time.
 */
export function resolveTonManifestUrl(): string {
  if (typeof window !== "undefined") {
    const { origin, hostname, protocol } = window.location;

    if (protocol === "https:" && isLovablePreview(hostname)) {
      return `${PUBLIC_MANIFEST_ENDPOINT}?origin=${encodeURIComponent(origin)}`;
    }

    if (protocol === "https:") {
      return `${origin}/tonconnect-manifest.json`;
    }
  }

  return "https://nova.megsyai.com/tonconnect-manifest.json";
}
