import { defineConfig } from "vite";

// Plain-http variant of vite.config.js for headless browser tests (CI and
// local smoke checks). Real dev uses vite.config.js — WebXR needs https.
export default defineConfig({
  root: "src/",
  publicDir: "../static/",
  base: "./",
  server: {
    host: true,
  },
  build: {
    outDir: "../docs",
    emptyOutDir: true,
    sourcemap: true,
  },
});
