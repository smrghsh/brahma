#!/usr/bin/env node
// Smoke-test the SCAFFOLDER — the full newcomer path:
//   npm pack create-brahma-xr + brahma-xr + brahma-xr-server
//   → install the create tarball and run its bin (like `npm create brahma-xr`)
//   → install brahma-xr into the scaffolded project from the tarball
//   → vite-build it → serve statically → two-user money moment
// This is what a researcher's first five minutes will feel like, so it
// catches template/prepack/bin mistakes the workspace symlink hides.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { run, npmRun, npmCapture, waitForPort, killAll } from "./lib/procs.mjs";
import { startStaticServer } from "./lib/staticServer.mjs";
import { launchBrowser, runMoneyMoment } from "./lib/moneyMoment.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const testDir = path.join(root, "dist", "create-test");
// Own ports so a dev relay/hub can keep running alongside
const HTTP_PORT = 4195;
const RELAY_PORT = 8093;

console.log(`🧪 create test workspace: ${path.relative(root, testDir)}`);
fs.rmSync(testDir, { recursive: true, force: true });
fs.mkdirSync(testDir, { recursive: true });

// 1. Pack all three packages exactly as `npm publish` would
//    (packing create-brahma-xr triggers its prepack template sync)
const tgz = {};
for (const dir of ["client", "server", "create-brahma-xr"]) {
  tgz[dir] = npmCapture(["pack", "--pack-destination", testDir], {
    cwd: path.join(root, "packages", dir),
  })
    .split("\n")
    .pop();
}
console.log(`📦 packed ${Object.values(tgz).join(" + ")}`);

// 2. Install the create + server tarballs, then scaffold a project with the
//    packed bin — the `npm create brahma-xr my-world` moment
fs.writeFileSync(
  path.join(testDir, "package.json"),
  JSON.stringify(
    {
      name: "brahma-create-test",
      private: true,
      dependencies: {
        "create-brahma-xr": `file:./${tgz["create-brahma-xr"]}`,
        "brahma-xr-server": `file:./${tgz.server}`,
      },
    },
    null,
    2,
  ) + "\n",
);
await npmRun(["install", "--no-audit", "--no-fund"], { cwd: testDir });

console.log("\n🏗  scaffolding my-world with the packed bin");
const bin = path.join(testDir, "node_modules", ".bin", "create-brahma-xr");
execFileSync(bin, ["my-world"], { cwd: testDir, stdio: "inherit" });

const appDir = path.join(testDir, "my-world");
for (const expected of [
  ".gitignore",
  "src/Experience/World.js",
  "src/Experience/sources.js",
  "vite.config.js",
]) {
  if (!fs.existsSync(path.join(appDir, expected)))
    throw new Error(`scaffold missing ${expected}`);
}

// 3. Point the scaffolded project at the packed client and install/build it
const pkgPath = path.join(appDir, "package.json");
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
if (pkg.name !== "my-world")
  throw new Error(`scaffold package name is ${pkg.name}, expected my-world`);
pkg.dependencies["brahma-xr"] = `file:../${tgz.client}`;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");

console.log("\n📥 npm install in my-world (fresh — fetches three/vite)");
await npmRun(["install", "--no-audit", "--no-fund"], { cwd: appDir });
console.log("\n📦 npm run build in my-world");
await npmRun(["run", "build"], {
  cwd: appDir,
  env: { ...process.env, VITE_BRAHMA_SERVER: `ws://localhost:${RELAY_PORT}` },
});

// 4. Run the PACKED server, serve the docs/ build, assert the money moment
run(
  "node",
  [path.join(testDir, "node_modules", "brahma-xr-server", "main.js")],
  {
    env: { ...process.env, PORT: String(RELAY_PORT) },
  },
);
await waitForPort(RELAY_PORT);
const staticServer = await startStaticServer(
  path.join(appDir, "docs"),
  HTTP_PORT,
);
const browser = await launchBrowser();

try {
  console.log("\n🚬 smoke (scaffolded): my-world");
  await runMoneyMoment(browser, `http://localhost:${HTTP_PORT}/`);
  console.log("\n✅ CREATE SMOKE TEST PASSED — npm create brahma-xr works");
} catch (error) {
  console.error("\n❌ create smoke test failed:", error.message);
  process.exitCode = 1;
} finally {
  await browser.close();
  staticServer.close();
  killAll();
}
