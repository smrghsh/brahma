# bruno simon integration

brahma inside an app that **owns its Experience subclass** — the structure
every brahma research app (seals, coral, aiwar-xr, RYR1) uses.

What it demonstrates:

- `class Experience extends BrahmaExperience` in `src/Experience/Experience.js` —
  the subclass instance IS the singleton, so every brahma class sees your app.
- **Camera constructor options** (`near: 0.01`, `far: 5000`, orbit damping) —
  the settings aiwar-xr previously had to fork `Camera`/`Renderer` for.
- App-owned domain state (`experience.orbitSpeed`) read by a `Selectable`
  subclass — click the sun to change the orbit speed.

## Run it

```bash
npm install
npm run dev            # terminal 1 — https://localhost:5173
npx brahma-xr-server   # terminal 2 — the relay
```

Open two tabs, **Join Session** in both. This app joins the room
`bruno-simon-integration`, so its users only meet each other.
