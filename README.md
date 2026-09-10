# FRAN GAME

**60 seconds after closing, Wisp goes feral.** Yoink testers off the shelves of the real Bugis+ #01-04 floor, haul them on your head, scoff them in a hiding spot. Everything floats back by morning. It's a dream.

Plan: [`docs/FRAN_GAME.md`](docs/FRAN_GAME.md). This repo is the **P0 · Yoink loop** slice: sync, fixed camera, 60 s timer, yoink on the six gondola islands + endcaps, head haul with slowdown, hide spots with scoff, results with a device-local best. Guards, ceiling eyes, crowns and the daily board come in P1–P2.

## Run

```bash
npm run sync-store   # vendor the store from ../fran-zone (needs the sibling checkout)
npm install
npm run dev          # http://localhost:5174
```

`npm run build` writes `dist/` for Vercel (`vercel.json` is set up for the Vite preset).

### Controls

| Do | Desktop | Phone |
|---|---|---|
| Move | WASD / arrows, or click the floor | left stick, or tap the floor |
| Yoink (hold) | Space, or the yellow button | hold the yellow button |
| Hide + scoff | walk into a glowing spot and stop | same |
| Start / run again | Enter or the big button | tap the big button |

Shadows are off by default on touch devices. Force them with `?shadow`, or off anywhere with `?noshadow`.

## The vendored store

`src/store/**`, `src/brand.js`, `src/wisp.js` and `public/textures/**` are copied verbatim from the sibling `fran-zone` repo by `scripts/sync-store.mjs`, which also writes `src/store/SYNC.md` with the source commit. **Never edit those files here.** If the game needs a change (the `take()` hook on the stocker, the instanced mask wall), land it in fran-zone first, then `npm run sync-store`.

Point at a different checkout with `FRAN_ZONE_DIR=/path/to/fran-zone npm run sync-store`.

Until the stocker exposes `take()`, `src/game/steal.js` rebuilds the pickup registry from the rendered `InstancedMesh` matrices at boot and zeroes an instance to take it. No vendored file is touched.

## Game code (`src/game/`)

| File | Owns |
|---|---|
| `run.js` | State machine idle → playing → results, timer, last call, scoff + bonuses, results |
| `steal.js` | Pickup registry from the instanced props, faces, `take()` / `restoreAll()`, nearest-first reach |
| `haul.js` | Head stack meshes, fly-in arcs, lean, slowdown `1 − 0.02 × loose` clamped to 0.7 |
| `hide.js` | Hide spot volumes + floor glow, enter on stop, exit on move |
| `floor/hideSpots.js` | Spot data keyed to fixture ids, validated with `blockersAt()` at boot |
| `camera.js` | Fixed three-quarter follow camera (yaw −π/4, pitch 0.95, dist 6.5) |
| `dream.js` | Dollhouse view: ceilings hidden, walls translucent, occluders between camera and Wisp fade |
| `input.js` | WASD / arrows / stick / Yoink button / click-to-walk |
| `hud.js` | Timer, banked, haul, hints, toasts, 3D popups, framing card, results |
| `score.js` | Points per prop type, scoff bonuses, local best in `localStorage` |
| `audio.js` | Tiny WebAudio synth (yoink, scoff, hide, last call, end) |

Scoring (P0): bottle / tube / packet 1 · compact / box 2 · 10+ in one scoff +25 % · three categories in one scoff +10 · cap 600.

## Tone guardrails

Dream frame, always. Security is goofy, products are props, no money. UI copy uses **yoink / haul / scoff / busted / spotted** and never *steal, shoplift, theft, loss prevention*. The smoke test greps the page for the avoid-list.

## Smoke test

```bash
npm run dev       # terminal 1
npm run browser   # terminal 2 → tools/shots/*.png
```

`tools/browser-check.js` boots the game headless, plays a scripted run (move, yoink, hide, scoff, last call, results, run again), checks the copy, and exits non-zero on any page error. It uses `puppeteer` from this repo if installed, otherwise from `../fran-zone`.

## Console hooks

`window.__franGame` exposes `run`, `wisp`, `camera`, `scene`, `blockersAt`. Useful bits: `run.start()`, `run.skipTo(seconds)`, `run.spots`, `run.pickups.faces`.
