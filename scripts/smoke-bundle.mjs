#!/usr/bin/env node
// Smoke-test the EXPORTED BUNDLES: vite-build the starter + examples, serve
// them statically (as GitHub Pages would), and run the two-user money moment
// against each app — plus the callout-relay check on data-vis-csv.
import path from "node:path";
import { fileURLToPath } from "node:url";
import { APPS, buildApp, assembleHub } from "./lib/apps.mjs";
import { run, isPortOpen, waitForPort, killAll } from "./lib/procs.mjs";
import { startStaticServer } from "./lib/staticServer.mjs";
import {
  launchBrowser,
  runMoneyMoment,
  runCalloutCheck,
} from "./lib/moneyMoment.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const hubDir = path.join(root, "dist", "hub");
const HUB_PORT = 4173;
const RELAY_PORT = 8080;

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

if (await isPortOpen(RELAY_PORT)) {
  console.log(`🛜 relay already running on port ${RELAY_PORT} — reusing it`);
} else {
  run("node", [path.join(root, "packages", "server", "main.js")], {
    env: { ...process.env, PORT: String(RELAY_PORT) },
  });
  await waitForPort(RELAY_PORT);
}

const staticServer = await startStaticServer(hubDir, HUB_PORT);
const browser = await launchBrowser();

try {
  for (const app of APPS) {
    console.log(`\n🚬 smoke: ${app.title}`);
    await runMoneyMoment(browser, `http://localhost:${HUB_PORT}/${app.route}/`);
  }
  console.log("\n🚬 smoke: callout relay (data-vis-csv)");
  await runCalloutCheck(
    browser,
    `http://localhost:${HUB_PORT}/examples/data-vis-csv/`,
  );
  console.log("\n✅ ALL BUNDLE SMOKE TESTS PASSED");
} catch (error) {
  console.error("\n❌ bundle smoke test failed:", error.message);
  process.exitCode = 1;
} finally {
  await browser.close();
  staticServer.close();
  killAll();
}
