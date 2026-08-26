import { describe, it, expect, beforeAll, afterAll } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import WebSocket from "ws";
import { createServer } from "./server.js";

let server;
let port;
let telemetryDir;
const openSockets = [];

beforeAll(async () => {
  telemetryDir = fs.mkdtempSync(path.join(os.tmpdir(), "brahma-test-"));
  server = createServer({
    port: 0,
    tickRate: 30,
    telemetry: "off",
    telemetryDir,
  });
  port = await server.listen();
});

afterAll(async () => {
  for (const ws of openSockets) ws.close();
  await server.close();
});

// Messages are buffered from connection time (the welcome can arrive in the
// same tick as open, before any later listener attaches) and consumed via a
// per-socket cursor.
function connect(query = "") {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`ws://127.0.0.1:${port}/${query}`);
    ws.inbox = [];
    ws.cursor = 0;
    ws.on("message", (raw) => ws.inbox.push(raw.toString()));
    ws.on("open", () => {
      openSockets.push(ws);
      resolve(ws);
    });
    ws.on("error", reject);
  });
}

async function nextMessage(ws, filter = () => true, timeoutMs = 3000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    while (ws.cursor < ws.inbox.length) {
      const raw = ws.inbox[ws.cursor++];
      let data;
      try {
        data = JSON.parse(raw);
      } catch {
        continue;
      }
      if (filter(data)) return data;
    }
    await new Promise((r) => setTimeout(r, 10));
  }
  throw new Error("timed out waiting for message");
}

async function nextRawMessage(ws, predicate, timeoutMs = 3000) {
  const deadline = Date.now() + timeoutMs;
  let cursor = 0;
  while (Date.now() < deadline) {
    while (cursor < ws.inbox.length) {
      const raw = ws.inbox[cursor++];
      if (predicate(raw)) return raw;
    }
    await new Promise((r) => setTimeout(r, 10));
  }
  throw new Error("timed out waiting for raw message");
}

async function collectFor(ws, ms) {
  const start = ws.inbox.length;
  await new Promise((r) => setTimeout(r, ms));
  return ws.inbox.slice(start);
}

const MAT4 = Array.from({ length: 16 }, (_, i) => i);
const pose = (extra = {}) =>
  JSON.stringify({
    v: 1,
    type: "pose",
    HMDPosition: MAT4,
    LController: MAT4,
    RController: MAT4,
    ...extra,
  });

describe("v2 protocol", () => {
  it("welcomes each connection with an assigned name and pastel color", async () => {
    const ws = await connect("?room=welcome-test");
    const welcome = await nextMessage(ws, (m) => m.type === "welcome");
    expect(welcome.v).toBe(1);
    expect(welcome.name).toMatch(/^User-/);
    expect(welcome.color).toMatch(/^0x[0-9a-f]{6}$/);
    ws.close();
  });

  it("honors ?name when free and falls back when taken", async () => {
    const a = await connect("?room=name-test&name=Fiona");
    const welcomeA = await nextMessage(a, (m) => m.type === "welcome");
    expect(welcomeA.name).toBe("Fiona");

    const b = await connect("?room=name-test&name=Fiona");
    const welcomeB = await nextMessage(b, (m) => m.type === "welcome");
    expect(welcomeB.name).toMatch(/^User-/);
    a.close();
    b.close();
  });

  it("broadcasts a roster envelope carrying poses to roommates", async () => {
    const a = await connect("?room=roster-test");
    const b = await connect("?room=roster-test");
    const welcomeA = await nextMessage(a, (m) => m.type === "welcome");
    await nextMessage(b, (m) => m.type === "welcome");

    a.send(pose());

    const roster = await nextMessage(
      b,
      (m) =>
        m.type === "roster" &&
        m.interlocutors.some(
          (i) => i.name === welcomeA.name && Array.isArray(i.HMDPosition),
        ),
    );
    const entry = roster.interlocutors.find((i) => i.name === welcomeA.name);
    expect(entry.HMDPosition).toEqual(MAT4);
    a.close();
    b.close();
  });

  it("keeps rooms isolated", async () => {
    const a = await connect("?room=iso-a");
    const b = await connect("?room=iso-b");
    const welcomeB = await nextMessage(b, (m) => m.type === "welcome");
    await nextMessage(a, (m) => m.type === "welcome");

    b.send(pose());
    const messages = await collectFor(a, 300);
    const sawB = messages.some((raw) => raw.includes(welcomeB.name));
    expect(sawB).toBe(false);
    a.close();
    b.close();
  });

  it("relays callouts with payload to peers but not the sender", async () => {
    const a = await connect("?room=callout-test");
    const b = await connect("?room=callout-test");
    const welcomeA = await nextMessage(a, (m) => m.type === "welcome");
    await nextMessage(b, (m) => m.type === "welcome");

    a.send(
      JSON.stringify({
        v: 1,
        type: "callout",
        visible: true,
        position: [1, 2, 3],
        payload: { pathName: "FatiguedFiona-A", pointIndex: 42 },
      }),
    );

    const callout = await nextMessage(b, (m) => m.type === "callout");
    expect(callout.name).toBe(welcomeA.name);
    expect(callout.position).toEqual([1, 2, 3]);
    expect(callout.payload).toEqual({
      pathName: "FatiguedFiona-A",
      pointIndex: 42,
    });

    const echoes = await collectFor(a, 300);
    expect(echoes.some((raw) => raw.includes('"callout"'))).toBe(false);
    a.close();
    b.close();
  });

  it("purges disconnected users from the roster", async () => {
    const a = await connect("?room=purge-test");
    const b = await connect("?room=purge-test");
    const welcomeA = await nextMessage(a, (m) => m.type === "welcome");
    await nextMessage(b, (m) => m.type === "welcome");
    a.send(pose());
    await nextMessage(b, (m) =>
      m.interlocutors?.some((i) => i.name === welcomeA.name),
    );

    a.close();
    await nextMessage(
      b,
      (m) =>
        m.type === "roster" &&
        !m.interlocutors.some((i) => i.name === welcomeA.name),
    );
    b.close();
  });

  it("ignores unknown message types and malformed JSON without dying", async () => {
    const ws = await connect("?room=garbage-test");
    await nextMessage(ws, (m) => m.type === "welcome");
    ws.send("{not json");
    ws.send(JSON.stringify({ v: 1, type: "no-such-type" }));
    // still receiving rosters afterwards
    await nextMessage(ws, (m) => m.type === "roster");
    ws.close();
  });
});

describe("legacy bridge (deployed research apps)", () => {
  it("speaks the bare-array protocol with no welcome message", async () => {
    const ws = await connect(); // no ?room → legacy
    const messages = await collectFor(ws, 300);
    expect(messages.length).toBeGreaterThan(0);
    for (const raw of messages) {
      expect(Array.isArray(JSON.parse(raw))).toBe(true);
    }
    ws.close();
  });

  it("accepts a bare intro + pose and broadcasts it in the array", async () => {
    const a = await connect();
    const b = await connect();
    a.send(JSON.stringify({ name: "Legacy-1", color: "0xabcdef" }));
    a.send(
      JSON.stringify({
        name: "Legacy-1",
        color: "0xabcdef",
        HMDPosition: MAT4,
        LController: MAT4,
        RController: MAT4,
      }),
    );
    const roster = await nextMessage(
      b,
      (m) => Array.isArray(m) && m.some((i) => i.name === "Legacy-1"),
    );
    expect(roster.find((i) => i.name === "Legacy-1").HMDPosition).toEqual(MAT4);
    a.close();
    b.close();
  });

  it("keeps the old calloutUpdate shape with sealPath and pointIndex", async () => {
    const a = await connect();
    const b = await connect();
    a.send(JSON.stringify({ name: "Legacy-A", color: "0x111111" }));
    b.send(JSON.stringify({ name: "Legacy-B", color: "0x222222" }));
    // introductions must land before the callout broadcast filters on them
    await nextMessage(b, (m) => Array.isArray(m) && m.length >= 2);

    a.send(
      JSON.stringify({
        type: "calloutUpdate",
        name: "Legacy-A",
        visible: true,
        position: [4, 5, 6],
        sealPath: "HypoactiveHeidi-B",
        pointIndex: 7,
      }),
    );

    const callout = await nextMessage(
      b,
      (m) => !Array.isArray(m) && m.type === "callout",
    );
    expect(callout.sealPath).toBe("HypoactiveHeidi-B");
    expect(callout.pointIndex).toBe(7);
    expect(callout.triggeredBy).toBe("Legacy-A");
    expect(callout.payload).toBeUndefined();
    a.close();
    b.close();
  });

  it("replies to malformed JSON with the legacy error string", async () => {
    const ws = await connect();
    ws.send("{not json");
    const reply = await nextRawMessage(ws, (raw) => raw.startsWith("Error:"));
    expect(reply).toBe("Error: Invalid message format");
    ws.close();
  });
});

describe("REST", () => {
  it("serves /uniqueUsernameAndColor for legacy clients", async () => {
    const res = await fetch(`http://127.0.0.1:${port}/uniqueUsernameAndColor`);
    const data = await res.json();
    expect(data.username).toMatch(/^User-/);
    expect(data.color).toMatch(/^0x[0-9a-f]{6}$/);
  });

  it("serves /activeInterlocutors as { room: [names] }", async () => {
    const ws = await connect("?room=rest-test");
    const welcome = await nextMessage(ws, (m) => m.type === "welcome");
    const res = await fetch(`http://127.0.0.1:${port}/activeInterlocutors`);
    const data = await res.json();
    expect(data["rest-test"]).toContain(welcome.name);
    ws.close();
  });
});

describe("telemetry", () => {
  it("creates no file when off", async () => {
    const ws = await connect("?room=telemetry-test");
    await nextMessage(ws, (m) => m.type === "welcome");
    ws.send(pose());
    await new Promise((r) => setTimeout(r, 400));
    expect(fs.readdirSync(telemetryDir)).toEqual([]);
    ws.close();
  });

  it("logs rows with a room column when on", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "brahma-telemetry-"));
    const telemetryServer = createServer({
      port: 0,
      tickRate: 30,
      telemetry: "csv",
      telemetryDir: dir,
    });
    const telemetryPort = await telemetryServer.listen();

    const ws = await new Promise((resolve, reject) => {
      const socket = new WebSocket(
        `ws://127.0.0.1:${telemetryPort}/?room=proxemics`,
      );
      socket.on("open", () => resolve(socket));
      socket.on("error", reject);
    });
    ws.send(pose());
    await new Promise((r) => setTimeout(r, 600));
    ws.close();
    await telemetryServer.close();

    const files = fs.readdirSync(dir);
    expect(files.length).toBe(1);
    const contents = fs.readFileSync(path.join(dir, files[0]), "utf8");
    expect(contents.startsWith("timestamp,name,room,color,HMD_m0")).toBe(true);
    const rows = contents.trim().split("\n").slice(1);
    expect(rows.length).toBeGreaterThan(0);
    expect(rows[0].split(",")[2]).toBe("proxemics");
  });
});
