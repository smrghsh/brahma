# Brahma

**Open source WebXR library for collaborative scientific visualization**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm](https://img.shields.io/npm/v/brahma-xr)](https://www.npmjs.com/package/brahma-xr)
[![Docs](https://img.shields.io/badge/docs-smrghsh.github.io%2Fbrahma-blue)](https://smrghsh.github.io/brahma)

Brahma is an open source WebXR library for building multi-user virtual reality environments for scientific visualization. Unlike proprietary engines such as Unity or Unreal Engine, Brahma requires only standard web development practices — HTML, JavaScript, and Three.js — enabling faster iteration, shareable URLs, and broad cross-platform support. Named after the Hindu deity of creation, Brahma creates a real-time data loop between clients and server, echoing Vivekananda's metaphor of electricity completing a circuit: the moment the connection is made, the whole system comes alive.

📖 **[Documentation site →](https://smrghsh.github.io/brahma)**

---

## Features

- **Cross-platform XR** — runs identically in a headset, on mobile, tablet, or desktop
- **Multi-user collaboration** — WebSocket-based avatar embodiment at ~30fps
- **Unique identity** — REST API assigns each user a unique ID and color on join
- **Shared interface state** — synchronized UI state via REST + WebSocket
- **Accessible locomotion** — grab-and-pull method works with controllers, hands, mouse, and eye-tracking
- **Raycasting** — pointing with controller, hand, mouse, or eye-tracking
- **Spatial data rendering** — geospatial views, information visualization, 3D model support
- **Telemetry** — log user poses and events to CSV for HCI research
- **No build lock-in** — peer dependency on Three.js; works with Vite, Rollup, or direct script import
- **Minimal computation** — designed to run on any WebXR-capable device

## Supported Devices

| Headset | Type |
|---|---|
| Meta Quest 2 / 3 / Pro | Standalone |
| Apple Vision Pro | Spatial computing |
| Valve Index | PC VR |
| Varjo XR / VR series | Enterprise |

| Platform | Support |
|---|---|
| Mobile (iOS, Android) | ✅ |
| Tablet | ✅ |
| Desktop (all browsers) | ✅ |

---

## Getting Started

### Quickstart

```bash
npm create brahma-xr@latest my-world
cd my-world
npm install
npm run dev            # terminal 1 — the app (https://localhost:5173)
npx brahma-xr-server   # terminal 2 — the relay (ws://localhost:8080)
```

Open two tabs, click **Join Session** in both — each sees the other as a
colored avatar. Edit `src/Experience/World.js` to build your world.

The template is the [starter](./starter) workspace — brahma's `Experience`
as-is, your `World.js`. Working in this repo, run it directly with
`npm install && npm --prefix starter run dev`. In an existing project:
`npm install brahma-xr@beta three` (the `beta` tag matters until v2 is
promoted to `latest`).

```js
import { Experience } from "brahma-xr";
import World from "./Experience/World.js";

const experience = new Experience({
  canvas: document.querySelector("canvas.webgl"),
  networking: { url: "ws://localhost:8080", room: "my-world" },
});
experience.world = new World();
experience.join();
```

The relay server is self-hosted and deliberately minimal — see
[`packages/server`](./packages/server) for env config (`PORT`, TLS,
telemetry) and deployment recipes.

---

## Examples & the local playground

```bash
npm run hub
```

builds the starter and every example as real exported bundles, serves them
behind a splash page at **http://localhost:4173**, and starts a relay — open
any app in two windows to feel the multiplayer.

| Example | Description |
|---|---|
| [`starter/`](./starter) | **The quickstart** — brahma's Experience as-is, your `World.js`. Synced to the `brahma-starter` template repo. |
| [`examples/bruno-simon-integration/`](./examples/bruno-simon-integration) | An app that **owns its Experience subclass** — the structure of the five research apps, with custom camera options. |
| [`examples/data-vis-csv/`](./examples/data-vis-csv) | Seals-style data-vis: CSV tracks, selectable points, callouts shared over the relay. |

Four smoke tests cover the whole path (each is two headless users joining
and seeing each other's avatars):

```bash
npm run smoke          # dev server — fast inner loop
npm run smoke:bundle   # the exported vite builds, served statically (runs in CI)
npm run smoke:pack     # npm-packed tarballs installed fresh — the outsider path
npm run smoke:create   # npm create brahma-xr from packed tarballs — the newcomer path (runs in CI)
```

---

## FAIR Principles

Brahma is designed around the [FAIR data principles](https://www.go-fair.org/fair-principles/) for scientific software:

| Principle | Implementation |
|---|---|
| **Findable** | Published on npm (`brahma-xr`), GitHub, with DOI via Zenodo |
| **Accessible** | MIT licensed, open source, no account required to use |
| **Interoperable** | Standard web stack (Three.js, WebSockets, REST); no proprietary formats |
| **Reusable** | Documented API, example applications, permissive license |

---

## Contributing

We welcome contributions! See [CONTRIBUTING.md](./CONTRIBUTING.md) for how to get started.

---

## Contributors

<!-- ALL-CONTRIBUTORS-LIST:START -->
<!-- ALL-CONTRIBUTORS-LIST:END -->

<!-- https://github.com/all-contributors/all-contributors -->

---

## Acknowledgments

Supported by **Alfred P. Sloan Foundation G-2023-20978**.

Contributions by Kajal Jotwani during **Google Summer of Code 2025** with the UC Open Source Program Office at UC Santa Cruz.

Built at the [SET Lab](https://setlab.soe.ucsc.edu/about/), UC Santa Cruz.
