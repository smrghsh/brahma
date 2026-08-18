#!/usr/bin/env node
// Smoke-test the PACKED TARBALLS — the full outsider path:
//   npm pack brahma-xr + brahma-xr-server
//   → install the tarballs into fresh copies of the starter and examples
//   → vite-build each app → serve statically → two-user money moment
// This is what "npm install brahma-xr" will feel like to someone outside
// the workspace, so it catches files/exports/peer-dep mistakes the
// workspace symlink hides. Needs network access for registry deps.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { APPS, buildApp, assembleHub } from "./lib/apps.mjs";
import { run, npmRun, npmCapture, waitForPort, killAll } from "./lib/procs.mjs";
import { startStaticServer } from "./lib/staticServer.mjs";
import {
  launchBrowser,
  runMoneyMoment,
  runCalloutCheck,
} from "./lib/moneyMoment.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const packDir = path.join(root, "dist", "pack-test");
// Own ports so a dev relay/hub can keep running alongside
const HUB_PORT = 4193;
const RELAY_PORT = 8091;

console.log(`🧪 pack test workspace: ${path.relative(root, packDir)}`);
fs.rmSync(packDir, { recursive: true, force: true });
fs.mkdirSync(path.join(packDir, "apps"), { recursive: true });

// 1. Pack both packages exactly as `npm publish` would
const clientTgz = npmCapture(["pack", "--pack-destination", packDir], {
  cwd: path.join(root, "packages", "client"),
})
  .split("\n")
  .pop();
const serverTgz = npmCapture(["pack", "--pack-destination", packDir], {
  cwd: path.join(root, "packages", "server"),
})
  .split("\n")
  .pop();
console.log(`📦 packed ${clientTgz} + ${serverTgz}`);

// 2. Fresh copies of the apps, with brahma-xr swapped for the tarball
const skip = new Set(["node_modules", "docs"]);
for (const app of APPS) {
  const dest = path.join(packDir, "apps", path.basename(app.dir));
  fs.cpSync(path.join(root, app.dir), dest, {
    recursive: true,
    filter: (src) => !skip.has(path.basename(src)),
  });
  const pkgPath = path.join(dest, "package.json");
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  pkg.dependencies["brahma-xr"] = `file:../../${clientTgz}`;
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
}

// 3. One install for everything (apps as workspaces + the packed server)
fs.writeFileSync(
  path.join(packDir, "package.json"),
  JSON.stringify(
    {
      name: "brahma-pack-test",
      private: true,
      workspaces: ["apps/*"],
      dependencies: { "brahma-xr-server": `file:./${serverTgz}` },
    },
    null,
    2,
  ) + "\n",
);
console.log("\n📥 npm install (fresh — fetches three/vite from the registry)");
await npmRun(["install", "--no-audit", "--no-fund"], { cwd: packDir });

// 4. Build each app against the installed tarball, pointed at our relay port
for (const app of APPS) {
  const dir = path.join(packDir, "apps", path.basename(app.dir));
  console.log(`\n📦 building ${app.dir} (from tarball)`);
  await buildApp(dir, {
    VITE_BRAHMA_SERVER: `ws://localhost:${RELAY_PORT}`,
  });
}
assembleHub(
  path.join(root, "home", "index.html"),
  path.join(packDir, "hub"),
  APPS.map((app) => ({
    route: app.route,
    docsDir: path.join(packDir, "apps", path.basename(app.dir), "docs"),
  })),
);

// 5. Run the PACKED server, serve the hub, and assert the money moment
run(
  "node",
  [path.join(packDir, "node_modules", "brahma-xr-server", "main.js")],
  {
    env: { ...process.env, PORT: String(RELAY_PORT) },
  },
);
await waitForPort(RELAY_PORT);
const staticServer = await startStaticServer(
  path.join(packDir, "hub"),
  HUB_PORT,
);
const browser = await launchBrowser();

try {
  for (const app of APPS) {
    console.log(`\n🚬 smoke (packed): ${app.title}`);
    await runMoneyMoment(browser, `http://localhost:${HUB_PORT}/${app.route}/`);
  }
  console.log("\n🚬 smoke (packed): callout relay (data-vis-csv)");
  await runCalloutCheck(
    browser,
    `http://localhost:${HUB_PORT}/examples/data-vis-csv/`,
  );
  console.log("\n✅ ALL PACK SMOKE TESTS PASSED — the tarballs are shippable");
} catch (error) {
  console.error("\n❌ pack smoke test failed:", error.message);
  process.exitCode = 1;
} finally {
  await browser.close();
  staticServer.close();
  killAll();
}
