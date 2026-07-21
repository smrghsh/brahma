#!/usr/bin/env node
// Thin bin entry for the brahma relay server — all configuration comes from
// the environment: PORT, TLS_CERT, TLS_KEY, TICK_RATE, TELEMETRY, TELEMETRY_DIR
import { createServer } from "./server.js";

const config = {
  port: process.env.PORT !== undefined ? Number(process.env.PORT) : undefined,
  tlsCert: process.env.TLS_CERT,
  tlsKey: process.env.TLS_KEY,
  tickRate:
    process.env.TICK_RATE !== undefined
      ? Number(process.env.TICK_RATE)
      : undefined,
  telemetry: process.env.TELEMETRY,
  telemetryDir: process.env.TELEMETRY_DIR,
};

const server = createServer(config);
const port = await server.listen();

const tls = Boolean(config.tlsCert && config.tlsKey);
const scheme = tls ? "wss" : "ws";
console.log(`🛜 WebSocket server started on ${scheme}://localhost:${port}`);
console.log(
  `   TLS: ${tls ? "on" : "off"} | telemetry: ${config.telemetry === "csv" ? "csv" : "off"}`,
);
