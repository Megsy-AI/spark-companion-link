import { copyFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

// Vercel normally applies the SPA rewrite from vercel.json. These static
// entry points also make every public app route independently addressable,
// even when a deployment's rewrite settings are stale or overridden.
const routes = [
  "/war",
  "/tasks",
  "/servers",
  "/wallet",
  "/101",
  "/staking",
  "/attack-shop",
];

const distDir = resolve("dist");
const appShell = resolve(distDir, "index.html");

const deploymentHost = process.env.VERCEL_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL;
const appOrigin = deploymentHost ? `https://${deploymentHost.replace(/^https?:\/\//, "")}` : "https://nova.megsyai.com";
const manifest = {
  url: appOrigin,
  name: "NOVA AI",
  iconUrl: `${appOrigin}/images/nova-logo.png`,
  termsOfUseUrl: appOrigin,
  privacyPolicyUrl: appOrigin,
};

if (!existsSync(appShell)) {
  throw new Error("dist/index.html was not generated");
}

for (const route of routes) {
  const target = resolve(distDir, route.slice(1), "index.html");
  mkdirSync(dirname(target), { recursive: true });
  copyFileSync(appShell, target);
}

copyFileSync(appShell, resolve(distDir, "404.html"));
writeFileSync(resolve(distDir, "tonconnect-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Created SPA entry points for ${routes.length} routes`);
console.log(`Created TON Connect manifest for ${appOrigin}`);