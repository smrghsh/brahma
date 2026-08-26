# brahma starter

A shared virtual world you can walk around in — on desktop, phone, and XR
headsets — built on [brahma-xr](https://github.com/smrghsh/brahma).

## Quickstart (two terminals, two tabs, ~2 minutes)

```bash
npm install
npm run dev            # terminal 1 — the app (https://localhost:5173)
npx brahma-xr-server   # terminal 2 — the relay server (ws://localhost:8080)
```

Open **https://localhost:5173** in two browser tabs (accept the self-signed
certificate warning — HTTPS is required for WebXR). Click **Join Session** in
both. Each tab sees the other as a colored avatar. That's multiplayer.

## Where things go

| File | What it is |
| --- | --- |
| `src/Experience/World.js` | **Your world — the file you edit.** Add meshes, load data, animate in `update()`. |
| `src/Experience/sources.js` | Declare assets (models, textures, data files). Files live in `static/`. |
| `src/script.js` | Entry point — creates the Experience and wires the UI. |
| `static/` | Assets and data files, served at the app root. |
| `docs/` | Production build output (`npm run build`) — GitHub Pages-ready. |

## On a headset

Your headset needs to reach the dev server over HTTPS **and** the relay
server. Easiest paths:

- **Meta Quest:** connect via USB and run `adb reverse tcp:5173 tcp:5173` and
  `adb reverse tcp:8080 tcp:8080` — then the headset browser opens
  `https://localhost:5173` like any tab.
- **Any headset on your LAN:** open `https://<your-ip>:5173` (the dev server
  prints it). Browsers block the insecure `ws://<your-ip>:8080` from an HTTPS
  page, so run the relay with TLS (`TLS_CERT`/`TLS_KEY`) or use the adb
  route above.

## Deploy

`npm run build` writes a static site to `docs/` — enable GitHub Pages on the
`docs/` folder and your world is live at an https URL every headset can open.
Point `VITE_BRAHMA_SERVER` at your own deployed relay server (see the
[brahma-xr-server docs](https://github.com/smrghsh/brahma/tree/main/packages/server)).

## Debug panel

Open the app with `#debug` in the URL (https://localhost:5173/#debug) for the
lil-gui panel — user name/color controls and a Join Session button live there.
