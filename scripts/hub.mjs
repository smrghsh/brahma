#!/usr/bin/env node
// The local playground: build the starter + examples as real exported
// bundles, assemble them behind the splash home page, start a relay, and
// serve the lot.
//
//   npm run hub               build everything, then serve
//   npm run hub -- --no-build serve the last build as-is
//   npm run hub -- --no-relay don't start a relay (you run your own)
import path from "node:path";
import { fileURLToPath } from "node:url";
import { APPS, buildApp, assembleHub } from "./lib/apps.mjs";
import { run, isPortOpen, waitForPort } from "./lib/procs.mjs";
import { startStaticServer } from "./lib/staticServer.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const argv = process.argv.slice(2);
const hubDir = path.join(root, "dist", "hub");
const HUB_PORT = 4173;
const RELAY_PORT = 8080;

if (!argv.includes("--no-build")) {
  for (const app of APPS) {
    console.log(`\n📦 building ${app.dir}`);
    await buildApp(path.join(root, app.dir));
  }
  assembleHub(
    path.join(root, "home", "index.html"),
    hubDir,
    APPS.map((app) => ({
      route: app.route,
      docsDir: path.join(root, app.dir, "docs"),
    })),
  );
  console.log(`\n🏠 hub assembled at ${path.relative(root, hubDir)}`);
}

if (!argv.includes("--no-relay")) {
  if (await isPortOpen(RELAY_PORT)) {
    console.log(`🛜 relay already running on port ${RELAY_PORT} — reusing it`);
  } else {
    run("node", [path.join(root, "packages", "server", "main.js")], {
      env: { ...process.env, PORT: String(RELAY_PORT) },
    });
    await waitForPort(RELAY_PORT);
  }
}

await startStaticServer(hubDir, HUB_PORT);
console.log(`
✨ brahma playground: http://localhost:${HUB_PORT}
   (open an app in two windows and Join Session in both — Ctrl-C stops everything)
`);

// keep serving until interrupted
await new Promise(() => {});
