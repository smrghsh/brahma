#!/usr/bin/env node
// Regenerate template/ from the starter workspace. Runs on `npm pack` /
// `npm publish` (prepack), so the published template IS the starter — the
// monorepo never carries two copies. Monorepo-only concerns are stripped:
// the CI vite config, the build:ci script, and the gitignored docs/ (a
// scaffolded project commits docs/ for GitHub Pages).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const pkgDir = path.dirname(fileURLToPath(import.meta.url));

export function syncTemplate() {
  const starterDir = path.resolve(pkgDir, "..", "..", "starter");
  const templateDir = path.join(pkgDir, "template");
  if (!fs.existsSync(starterDir)) {
    throw new Error(`starter workspace not found at ${starterDir}`);
  }

  const skip = new Set([
    "node_modules",
    "docs",
    "vite.config.ci.js",
    ".gitignore",
    "package-lock.json",
  ]);
  fs.rmSync(templateDir, { recursive: true, force: true });
  fs.cpSync(starterDir, templateDir, {
    recursive: true,
    filter: (src) => !skip.has(path.basename(src)),
  });

  // npm strips .gitignore files from published tarballs — ship it dotless;
  // the scaffolder renames it back. docs/ is committed (GitHub Pages).
  fs.writeFileSync(path.join(templateDir, "gitignore"), "node_modules/\n");

  const pkgPath = path.join(templateDir, "package.json");
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  pkg.name = "my-brahma-world"; // overwritten by the scaffolder
  pkg.version = "1.0.0";
  delete pkg.scripts["build:ci"];
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");

  return templateDir;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const dir = syncTemplate();
  console.log(`template synced from starter/ → ${path.relative(pkgDir, dir)}`);
}
