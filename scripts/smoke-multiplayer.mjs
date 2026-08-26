#!/usr/bin/env node
// Fast inner-loop smoke test against the starter's DEV server: two users
// join, see each other, and a disconnect purges cleanly. Starts the vite
// dev server (plain-http config) and the relay itself unless they're
// already running. For the exported-bundle and packed-tarball variants see
// smoke-bundle.mjs and smoke-pack.mjs.
import path from "node:path";
import { fileURLToPath } from "node:url";
import { run, isPortOpen, waitForPort, killAll } from "./lib/procs.mjs";
import { launchBrowser, runMoneyMoment } from "./lib/moneyMoment.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const APP_PORT = 5173;
const RELAY_PORT = 8080;

if (await isPortOpen(RELAY_PORT)) {
  console.log(`🛜 relay already running on port ${RELAY_PORT} — reusing it`);
} else {
  run("node", [path.join(root, "packages", "server", "main.js")], {
    env: { ...process.env, PORT: String(RELAY_PORT) },
  });
  await waitForPort(RELAY_PORT);
}

if (await isPortOpen(APP_PORT)) {
  console.log(`⚡ dev server already running on port ${APP_PORT} — reusing it`);
} else {
  run(
    process.platform === "win32" ? "npm.cmd" : "npm",
    [
      "--prefix",
      path.join(root, "starter"),
      "run",
      "dev",
      "--",
      "--config",
      "vite.config.ci.js",
      "--port",
      String(APP_PORT),
      "--strictPort",
    ],
    {},
  );
  await waitForPort(APP_PORT);
}

const browser = await launchBrowser();
try {
  await runMoneyMoment(browser, `http://localhost:${APP_PORT}`, {
    screenshots: {
      alice: "/tmp/brahma-alice.png",
      bob: "/tmp/brahma-bob.png",
    },
  });
} catch (error) {
  console.error("❌ smoke test failed:", error.message);
  process.exitCode = 1;
} finally {
  await browser.close();
  killAll();
}
