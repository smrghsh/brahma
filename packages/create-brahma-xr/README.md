# create-brahma-xr

Scaffold a minimal [brahma-xr](https://github.com/smrghsh/brahma) project — a
shared virtual world you can walk around in on desktop, phone, and XR
headsets.

```bash
npm create brahma-xr@latest my-world
cd my-world
npm install
npm run dev            # the app — https on your LAN, headset-ready
npx brahma-xr-server   # the relay, in a second terminal
```

The generated app is intentionally tiny: `World.js` (your scene),
`sources.js` (your assets), and the entry files. The Experience wiring —
renderer, camera, XR session, avatars, networking — lives in the `brahma-xr`
library. `npm run build` writes a GitHub-Pages-ready static site to `docs/`.

## How the template works

`template/` is not checked in — it is generated from the monorepo's
`starter/` workspace by `sync-template.mjs`, which runs automatically on
`npm pack` / `npm publish` (prepack). The starter is the single source of
truth; this package is just the delivery mechanism.

Smoke-test the full outsider path (pack → scaffold → install → build →
two-user session) with:

```bash
node scripts/smoke-create.mjs   # from the monorepo root
```
