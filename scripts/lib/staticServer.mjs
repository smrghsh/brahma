// Dependency-free static file server — serves a built hub (home page +
// vite builds) the way GitHub Pages would, so smoke tests exercise the
// exported bundles rather than the dev server.
import http from "node:http";
import { promises as fs } from "node:fs";
import path from "node:path";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".map": "application/json",
  ".csv": "text/csv",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".glb": "model/gltf-binary",
  ".gltf": "model/gltf+json",
  ".exr": "application/octet-stream",
  ".wasm": "application/wasm",
  ".ttf": "font/ttf",
  ".woff2": "font/woff2",
};

export function startStaticServer(rootDir, port) {
  const root = path.resolve(rootDir);

  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, "http://localhost");
      let filePath = path.normalize(
        path.join(root, decodeURIComponent(url.pathname)),
      );
      if (!filePath.startsWith(root)) {
        res.writeHead(403);
        res.end("forbidden");
        return;
      }
      let stat = await fs.stat(filePath).catch(() => null);
      if (stat?.isDirectory()) {
        if (!url.pathname.endsWith("/")) {
          res.writeHead(301, { location: url.pathname + "/" });
          res.end();
          return;
        }
        filePath = path.join(filePath, "index.html");
        stat = await fs.stat(filePath).catch(() => null);
      }
      if (!stat) {
        res.writeHead(404);
        res.end("not found");
        return;
      }
      res.writeHead(200, {
        "content-type":
          MIME[path.extname(filePath).toLowerCase()] ??
          "application/octet-stream",
      });
      res.end(await fs.readFile(filePath));
    } catch (error) {
      res.writeHead(500);
      res.end(String(error));
    }
  });

  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, () => resolve(server));
  });
}
