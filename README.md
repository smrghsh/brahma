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

### Install

```bash
npm install brahma-xr three
```

### Basic client usage

```js
import { Brahma } from 'brahma-xr';
import * as THREE from 'three';

const brahma = new Brahma();
brahma.speak(); // "I am the creator of collaborative environments"
```

### Server

Brahma includes a lightweight WebSocket + REST server:

```js
import { BrahmaServer } from 'brahma-xr/server';

const server = new BrahmaServer();
```

Run locally:

```bash
npm install
npm run build
npm run server
```

Then open `http://localhost:3000` (or your configured port) in a WebXR-capable browser or headset.

---

## Examples

| Example | Description |
|---|---|
| 🔥 **Civil Engineering / Wildfire** | Collaborative geospatial visualization of wildfire burn areas using photosphere imagery and tile-based 3D terrain |
| 🦭 **Southern Elephant Seals** | *(coming soon)* Multi-user spatial analysis of seal tracking data |
| 🪸 **Coral Reef Gaussian Splat** | *(coming soon)* Collaborative exploration of Gaussian splatting renderings of coral reef structures |
| 🧬 **RYR1 Protein Viewer** | *(coming soon)* Shared visualization of RYR1 protein structures for biochemistry research |

See the [`examples/`](./examples) folder for source code.

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
