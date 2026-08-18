import { defineConfig } from "vite";
import basicSsl from "@vitejs/plugin-basic-ssl";

// The brahma ecosystem convention: app code in src/, assets in static/,
// GitHub-Pages-ready build in docs/. HTTPS is on because WebXR requires a
// secure context — accept the self-signed certificate warning in dev.
export default defineConfig({
  root: "src/",
  publicDir: "../static/",
  base: "./",
  plugins: [basicSsl()],
  server: {
    host: true, // reachable from headsets on your LAN
    https: true,
  },
  build: {
    outDir: "../docs",
    emptyOutDir: true,
    sourcemap: true,
  },
});
