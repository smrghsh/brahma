import fs from "node:fs";
import http from "node:http";
import https from "node:https";
import path from "node:path";

import cors from "cors";
import express from "express";
import { WebSocket, WebSocketServer } from "ws";

//Note: Data in the packet is all lowercase, whereas the data extracted is camelcased

/**
 * The formalized protocol
 *
 * From one user, sent to client
 * embodiment (bad name)
 * name: String
 * color: String
 * HMDPosition: Mat4
 * LController: Mat4 // HMD position if desktop
 * RController: Mat4 // HMD position if desktop
 *
 * v2 messages wrap those same fields in a { v: 1, type } envelope and are
 * scoped to a room from the connection URL (?room=<name>). Connections
 * without a room param join the "legacy" room, which keeps speaking the
 * original bare-JSON protocol for the deployed GitHub-Pages research apps.
 */

const LEGACY_ROOM = "legacy";
const HEARTBEAT_INTERVAL_MS = 15000; // ping every 15 s; terminate missed pongs
const TELEMETRY_INTERVAL_MS = 250; // log every 0.25 seconds
const TELEMETRY_MAX_BYTES = 100 * 1024 * 1024; // roll the CSV at 100 MB

const CSV_HEADERS =
  "timestamp,name,room,color,HMD_m0,HMD_m1,HMD_m2,HMD_m3,HMD_m4,HMD_m5,HMD_m6,HMD_m7,HMD_m8,HMD_m9,HMD_m10,HMD_m11,HMD_m12,HMD_m13,HMD_m14,HMD_m15," +
  "LC_m0,LC_m1,LC_m2,LC_m3,LC_m4,LC_m5,LC_m6,LC_m7,LC_m8,LC_m9,LC_m10,LC_m11,LC_m12,LC_m13,LC_m14,LC_m15," +
  "RC_m0,RC_m1,RC_m2,RC_m3,RC_m4,RC_m5,RC_m6,RC_m7,RC_m8,RC_m9,RC_m10,RC_m11,RC_m12,RC_m13,RC_m14,RC_m15\n";

// Helper function to generate random alphanumeric usernames
function generateUsername(interlocutors = {}) {
  const alphanumeric = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let username;
  do {
    username = "User-";
    for (let i = 0; i < 2; i++) {
      username += alphanumeric.charAt(
        Math.floor(Math.random() * alphanumeric.length),
      );
    }
  } while (Object.keys(interlocutors).includes(username)); // Ensure unique username
  return username;
}

// Helper function to generate a random pastel hex color
// Helper function to generate a random pastel color in 0x000000 format
function generatePastelColor() {
  const randomHex = () => Math.floor(Math.random() * 128 + 127); // Pastel color component
  const red = randomHex().toString(16).padStart(2, "0");
  const green = randomHex().toString(16).padStart(2, "0");
  const blue = randomHex().toString(16).padStart(2, "0");

  return `0x${red}${green}${blue}`;
}

/**
 * Create a brahma relay server. Nothing runs (no port bound, no timers, no
 * telemetry file) until listen() is called.
 *
 * @param {object} [config]
 * @param {number} [config.port=8080]
 * @param {string} [config.tlsCert]  path to fullchain.pem — TLS only if BOTH cert+key set, else plain http/ws
 * @param {string} [config.tlsKey]
 * @param {number} [config.tickRate=20]  roster broadcasts per second
 * @param {"off"|"csv"} [config.telemetry="off"]
 * @param {string} [config.telemetryDir="."]
 * @returns {{ app: import("express").Express, httpServer: import("node:http").Server, wss: WebSocketServer, listen: () => Promise<number>, close: () => Promise<void> }}
 */
export function createServer(config = {}) {
  const {
    port = 8080,
    tlsCert,
    tlsKey,
    tickRate = 20,
    telemetry = "off",
    telemetryDir = ".",
  } = config;

  const app = express();
  app.use(cors());

  // Rooms are created on demand and deleted when their last socket leaves.
  // Each room scopes its own interlocutors roster and shared callout state.
  const rooms = new Map();

  function getRoom(name) {
    let room = rooms.get(name);
    if (!room) {
      room = {
        name,
        sockets: new Set(),
        interlocutors: {},
        // Shared callout state — the legacy room keeps the seals-specific
        // sealPath/pointIndex fields; v2 rooms carry an arbitrary payload.
        sharedCallout:
          name === LEGACY_ROOM
            ? {
                visible: false,
                position: null,
                sealPath: null,
                pointIndex: null,
                triggeredBy: null,
                lastUpdated: null,
              }
            : {
                visible: false,
                position: null,
                payload: null,
                triggeredBy: null,
                lastUpdated: null,
              },
      };
      rooms.set(name, room);
    }
    return room;
  }

  // API route to get unique username and color
  // (old clients call this before connecting, so uniqueness is checked
  // against the legacy room)
  app.get("/uniqueUsernameAndColor", (req, res) => {
    const legacy = rooms.get(LEGACY_ROOM);
    const username = generateUsername(legacy ? legacy.interlocutors : {});
    const color = generatePastelColor();
    res.json({ username, color });
  });

  // API route to get active interlocutors, as { room: [names...] }
  app.get("/activeInterlocutors", (req, res) => {
    const active = {};
    for (const [name, room] of rooms) {
      active[name] = Object.keys(room.interlocutors);
    }
    res.json(active);
  });

  // Load SSL/TLS certificate and private key — only when both are configured,
  // otherwise plain http/ws
  const tls = Boolean(tlsCert && tlsKey);
  const httpServer = tls
    ? https.createServer(
        {
          cert: fs.readFileSync(tlsCert),
          key: fs.readFileSync(tlsKey),
        },
        app,
      )
    : http.createServer(app);

  const wss = new WebSocketServer({ server: httpServer });

  function broadcast() {
    for (const room of rooms.values()) {
      const interlocutors = Object.values(room.interlocutors).map(
        ({ name, color, HMDPosition, LController, RController }) => ({
          name,
          color,
          HMDPosition,
          LController,
          RController,
        }),
      );

      // Legacy clients expect the bare JSON array; v2 rooms get an envelope.
      const packet =
        room.name === LEGACY_ROOM
          ? JSON.stringify(interlocutors)
          : JSON.stringify({ v: 1, type: "roster", interlocutors });

      for (const client of room.sockets) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(packet);
        }
      }
    }
  }

  function broadcastLegacyCallout(room, excludeUser) {
    const packet = JSON.stringify({
      type: "callout",
      ...room.sharedCallout,
    });

    for (const client of room.sockets) {
      if (client.readyState === WebSocket.OPEN) {
        const clientUser = Object.values(room.interlocutors).find(
          (i) => i.ws === client,
        );
        if (clientUser && clientUser.name !== excludeUser) {
          client.send(packet);
        }
      }
    }
  }

  // Unknown message types are ignored; log each once at debug level
  const loggedIgnores = new Set();
  function debugIgnore(label) {
    if (loggedIgnores.has(label)) return;
    loggedIgnores.add(label);
    console.debug(`Ignoring ${label}`);
  }

  // The original bare-JSON protocol, preserved exactly for the legacy room
  function handleLegacyMessage(room, ws, message) {
    try {
      const data = JSON.parse(message);

      // v2 envelopes don't belong in the legacy room
      if (data.v !== undefined) {
        debugIgnore(`v2 message in legacy room: ${data.type}`);
        return;
      }

      if (data.type === "timeCommand") {
        return; // deliberately ignored
      }

      // Handle callout updates
      if (data.type === "calloutUpdate") {
        room.sharedCallout.visible = data.visible;
        room.sharedCallout.position = data.position;
        room.sharedCallout.sealPath = data.sealPath;
        room.sharedCallout.pointIndex = data.pointIndex;
        room.sharedCallout.triggeredBy = data.name;
        room.sharedCallout.lastUpdated = Date.now();

        console.log(`📍 Callout updated by ${data.name}`);
        broadcastLegacyCallout(room, data.name);
        return;
      }

      if (data.name && data.color) {
        // this means with high confidence that the interlocutor is attempting to send name, color, and avatar embodiment data

        if (!room.interlocutors[data.name]) {
          // interlocutor introducing itself, as it doesn't exist yet in the interlocutors object
          room.interlocutors[data.name] = {
            name: data.name,
            color: data.color,
            ws: ws,
          };
          room.interlocutors[data.name].timeJoined = Date.now();
          console.log(
            `New interlocutor created: ${data.name}, color: ${data.color}`,
          );
        } else {
          // Update WebSocket reference in case of reconnection
          room.interlocutors[data.name].ws = ws;
        }

        if (data.HMDPosition && data.LController && data.RController) {
          // these three are what's used for avatar embodiment
          room.interlocutors[data.name].HMDPosition = data.HMDPosition;
          room.interlocutors[data.name].LController = data.LController;
          room.interlocutors[data.name].RController = data.RController;
          room.interlocutors[data.name].lastUpdated = Date.now();
        }
      } else {
        console.log("Invalid message: missing name or color");
      }
    } catch (error) {
      console.error("Error processing message from client:", error);
      ws.send("Error: Invalid message format");
    }
  }

  // The v2 envelope protocol ({ v: 1, type, ... }) for every non-legacy room
  function handleV2Message(room, ws, name, message) {
    let data;
    try {
      data = JSON.parse(message);
    } catch {
      return; // malformed JSON: ignore, don't crash
    }

    if (data.v !== 1 || typeof data.type !== "string") {
      debugIgnore(`message without a v2 envelope in room "${room.name}"`);
      return;
    }

    if (data.type === "pose") {
      const interlocutor = room.interlocutors[name];
      if (!interlocutor) return;

      if (data.color) {
        interlocutor.color = data.color;
      }

      if (data.HMDPosition && data.LController && data.RController) {
        // these three are what's used for avatar embodiment
        interlocutor.HMDPosition = data.HMDPosition;
        interlocutor.LController = data.LController;
        interlocutor.RController = data.RController;
        interlocutor.lastUpdated = Date.now();
      }
      return;
    }

    if (data.type === "callout") {
      room.sharedCallout.visible = data.visible;
      room.sharedCallout.position = data.position;
      room.sharedCallout.payload = data.payload;
      room.sharedCallout.triggeredBy = name;
      room.sharedCallout.lastUpdated = Date.now();

      console.log(`📍 Callout updated by ${name}`);
      const packet = JSON.stringify({
        v: 1,
        type: "callout",
        name,
        visible: data.visible,
        position: data.position,
        payload: data.payload,
      });
      for (const client of room.sockets) {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(packet);
        }
      }
      return;
    }

    debugIgnore(`unknown message type: ${data.type}`);
  }

  wss.on("connection", function connection(ws, req) {
    const url = new URL(req.url, "ws://localhost");
    const roomName = url.searchParams.get("room") || LEGACY_ROOM;
    const room = getRoom(roomName);
    room.sockets.add(ws);
    console.log(`Client connected (room: ${roomName})`);

    ws.isAlive = true;
    ws.on("pong", () => {
      ws.isAlive = true;
    });

    if (roomName === LEGACY_ROOM) {
      // Legacy clients introduce themselves in-band and would choke on a
      // welcome message, so the server stays quiet until they speak.
      ws.on("message", (message) => handleLegacyMessage(room, ws, message));
    } else {
      // v2: assign a unique-in-room name and pastel color up front, honoring
      // requested ?name= / ?color= params when the name isn't already taken.
      const requestedName = url.searchParams.get("name");
      const name =
        requestedName && !room.interlocutors[requestedName]
          ? requestedName
          : generateUsername(room.interlocutors);
      const color = url.searchParams.get("color") || generatePastelColor();

      room.interlocutors[name] = {
        name,
        color,
        ws: ws,
        timeJoined: Date.now(),
      };
      console.log(`New interlocutor created: ${name}, color: ${color}`);

      ws.send(JSON.stringify({ v: 1, type: "welcome", name, color }));
      ws.on("message", (message) => handleV2Message(room, ws, name, message));
    }

    ws.on("close", () => {
      room.sockets.delete(ws);

      // Find and remove the disconnected user
      for (const [name, interlocutor] of Object.entries(room.interlocutors)) {
        if (interlocutor.ws === ws) {
          const sessionDuration = (
            (Date.now() - interlocutor.timeJoined) /
            1000
          ).toFixed(1);
          console.log(
            `🔌 Client disconnected: ${name} (session duration: ${sessionDuration}s)`,
          );
          delete room.interlocutors[name];
          console.log(
            `📊 Active users in "${room.name}": ${Object.keys(room.interlocutors).length}`,
          );
          break;
        }
      }

      // Rooms are deleted when empty
      if (room.sockets.size === 0) {
        rooms.delete(room.name);
      }
    });
  });

  // CSV logging setup (opt-in telemetry — no file is ever created when off)
  const logDate = new Date()
    .toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    })
    .replace(/\//g, "-");
  let csvStream = null;
  let csvBytes = 0;
  let csvPart = 1;

  function csvPathForPart(part) {
    const suffix = part === 1 ? "" : `-${part}`;
    return path.join(
      telemetryDir,
      `interlocutor_tracking_${logDate}${suffix}.csv`,
    );
  }

  // Initialize CSV file with headers
  function initializeCSV() {
    // Skip past any files a previous run already filled to the rotation cap
    while (
      fs.existsSync(csvPathForPart(csvPart)) &&
      fs.statSync(csvPathForPart(csvPart)).size >= TELEMETRY_MAX_BYTES
    ) {
      csvPart += 1;
    }
    const logFilePath = csvPathForPart(csvPart);

    if (!fs.existsSync(logFilePath)) {
      fs.writeFileSync(logFilePath, CSV_HEADERS);
      console.log(`📝 CSV log file created: ${logFilePath}`);
    } else {
      console.log(`📝 Appending to existing CSV log: ${logFilePath}`);
    }

    csvBytes = fs.statSync(logFilePath).size;
    csvStream = fs.createWriteStream(logFilePath, { flags: "a" });
  }

  // Log interlocutor data to CSV
  function logInterlocutorsToCSV() {
    const timestamp = new Date().toISOString();

    for (const room of rooms.values()) {
      Object.values(room.interlocutors).forEach((interlocutor) => {
        if (
          interlocutor.HMDPosition &&
          interlocutor.LController &&
          interlocutor.RController
        ) {
          const row =
            [
              timestamp,
              interlocutor.name,
              room.name,
              interlocutor.color,
              ...interlocutor.HMDPosition,
              ...interlocutor.LController,
              ...interlocutor.RController,
            ].join(",") + "\n";

          csvStream.write(row);
          csvBytes += Buffer.byteLength(row);
        }
      });
    }

    // Size-based rotation: roll to a -2, -3… suffixed file at the cap
    if (csvBytes >= TELEMETRY_MAX_BYTES) {
      csvStream.end();
      csvPart += 1;
      initializeCSV();
    }
  }

  // Heartbeat: terminate connections that missed a pong
  function heartbeat() {
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) return ws.terminate();
      ws.isAlive = false;
      ws.ping();
    });
  }

  let broadcastInterval = null;
  let heartbeatInterval = null;
  let telemetryInterval = null;

  /**
   * Bind the configured port and start the broadcast/heartbeat/telemetry
   * timers. Resolves with the bound port (useful with port 0 in tests).
   *
   * @returns {Promise<number>}
   */
  function listen() {
    return new Promise((resolve, reject) => {
      httpServer.once("error", reject);
      httpServer.listen(port, () => {
        broadcastInterval = setInterval(broadcast, 1000 / tickRate);
        heartbeatInterval = setInterval(heartbeat, HEARTBEAT_INTERVAL_MS);
        if (telemetry === "csv") {
          initializeCSV();
          telemetryInterval = setInterval(
            logInterlocutorsToCSV,
            TELEMETRY_INTERVAL_MS,
          );
        }
        resolve(httpServer.address().port);
      });
    });
  }

  /**
   * Shut down cleanly: clear intervals, close sockets, release the port.
   *
   * @returns {Promise<void>}
   */
  function close() {
    return new Promise((resolve, reject) => {
      clearInterval(broadcastInterval);
      clearInterval(heartbeatInterval);
      clearInterval(telemetryInterval);
      if (csvStream) csvStream.end();

      for (const client of wss.clients) {
        client.terminate();
      }
      wss.close();

      if (httpServer.listening) {
        httpServer.close((error) => (error ? reject(error) : resolve()));
        httpServer.closeAllConnections?.();
      } else {
        resolve();
      }
    });
  }

  return { app, httpServer, wss, listen, close };
}
