# data-vis from CSV

A seals-style data-vis app in the canonical brahma structure: a CSV of
synthetic dive tracks renders as 3D lines with selectable points, and
selecting a point shares a **callout** with everyone in the room.

What it demonstrates:

- `sources.js` declaring a `simulationData` source — the CSV preloads through
  `Resources` and arrives as raw text in `resources.items.diveTracks`.
- `Selectable` subclassing (`DataPoint`) — hover highlights, select acts.
- The **callout protocol**: `sendCalloutUpdate(visible, position, payload)`
  out, `World.onCalloutUpdate(data)` in. The payload is app-defined
  (`{ track, index, temp }` here).

## Run it

```bash
npm install
npm run dev            # terminal 1 — https://localhost:5173
npx brahma-xr-server   # terminal 2 — the relay
```

Open two tabs, **Join Session** in both, then click a point on a track — the
other tab sees your callout with your name and the point's value. This app
joins the room `data-vis-csv`.
