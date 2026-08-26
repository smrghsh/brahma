// The three playground apps and how to build them into the local hub.
import fs from "node:fs";
import path from "node:path";
import { npmRun } from "./procs.mjs";

export const APPS = [
  {
    dir: "starter",
    route: "starter",
    title: "my brahma world (starter)",
  },
  {
    dir: "examples/bruno-simon-integration",
    route: "examples/bruno-simon-integration",
    title: "bruno simon integration",
  },
  {
    dir: "examples/data-vis-csv",
    route: "examples/data-vis-csv",
    title: "data-vis from CSV",
  },
];

/** vite-build one app dir (plain-http CI config; extraEnv reaches vite). */
export async function buildApp(appDir, extraEnv = {}) {
  await npmRun(["--prefix", appDir, "run", "build:ci"], {
    env: { ...process.env, ...extraEnv },
  });
}

/**
 * Assemble a servable hub directory: the splash home page at /, each app's
 * vite build (its docs/ output) under its route.
 *
 * @param {string} homeFile - path to home/index.html
 * @param {string} outDir - hub output dir (wiped first)
 * @param {Array<{route: string, docsDir: string}>} builtApps
 */
export function assembleHub(homeFile, outDir, builtApps) {
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });
  fs.copyFileSync(homeFile, path.join(outDir, "index.html"));
  for (const { route, docsDir } of builtApps) {
    fs.cpSync(docsDir, path.join(outDir, route), { recursive: true });
  }
}
