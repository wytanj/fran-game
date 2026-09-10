# FRAN GAME — build plan

**Date:** 2026-09-10 · **Status:** for approval (J T + Engineer) · **Supersedes:** `docs/FRAN_ZONE_HEIST.md` for build planning (that file stays as the short idea note)
**Host floor:** fran-zone (Bugis+ #01-04, https://fran-zone.vercel.app) · **Not this:** fran-web SUNFALL (arena combat stays there)

---

## 1. One-liner + fantasy

**60 seconds after closing, Wisp goes feral. Yoink testers off the shelves, scoff them in a hiding spot, don't get spotted. Daily board resets at midnight SGT.**

Fantasy: a closing-time dream on the real Bugis+ floor. The lights are half-down, the Barrisol hums, goofy Glow Guards shuffle the aisles, ceiling eyes sweep the floor. Everything you grab floats back to the shelf by morning. It is Pizza Possum's "grab, hide, eat, one more run" loop with the actual fixture plan as the level.

Working title on screen: **FRAN GAME**. Real title is an open decision (§12).

---

## 2. Loop table (Pizza Possum → FRAN GAME)

| Pizza Possum | FRAN GAME | Where in the store |
|---|---|---|
| Grab food from tables, carry it stacked on your head | **Yoink** props off shelf fronts; they stack on Wisp as a loose **haul** | Every gondola face, endcap and wallbay run |
| Hide in a bush to eat what you carry | Duck into a **hide spot** to **scoff** the haul into banked score | Frosted endcap panels, lightbox towers, queue rail gap, round table lip, BOH doorways |
| Guard dogs chase and throw you out | **Glow Guards** patrol beats, chase on line-of-sight, one touch = **busted** | Three east-west aisles + cross-aisles + experience zone |
| Nothing (Possum has no cameras) | **Ceiling eyes** (CCTV cones) sweep the floor; a lock summons a guard, cameras never catch you themselves | Cash canopy, column N-M, centre track bar, entrance, Barrisol disc |
| Big cake takes many bites | **Hero props** on lightbox towers and the EC-M endcap need a 3 s hold | NM west tower, SM west tower, NR west EC-M |
| Crown + king pizza | **Crowns**: the cashier lightbox hero and the mask-wall centrepiece; taking one sounds the alarm | Cash wrap (west) and mask wall (south-east) |
| Getting bigger makes you slower | Loose haul slows Wisp and grows the silhouette; scoffing resets | — |
| Personal best | **Daily board** (SGT day bucket), top 20 + your rank, device-local best | End screen + landing |
| Local co-op | **Duo Chaos** (later, not day one) | — |

---

## 3. Core systems

### 3.1 Player (Wisp)
- Reuse `src/wisp.js` locomotion as-is: 0.22 m radius, 2.35 m/s, AABB slide collision against `fixtureAabbs()`, door routing through `doors.stock` / `doors.locker` waypoints.
- Drop the height-mode person and rulers. Keep sprite + glow + halo + trailing particles: this is the mascot until §12 decides otherwise.
- Haul slowdown: speed = 2.35 × clamp(1 − 0.02 × loose, 0.7, 1). At 15 loose items Wisp is at 1.65 m/s. Scoffing restores full speed.
- Camera: reuse the follow camera from `src/controls.js` but fix yaw and pitch (three-quarter view, yaw −π/4, pitch 0.85, dist 6.5). No orbit, no pan, no plan mode. Readability beats freedom in a 60 s game.
- Input: WASD / left stick (reuse joystick from `src/ui.js`), plus one **Yoink** button (Space / tap-hold right thumb). Click-to-walk stays for desktop mouse players.

### 3.2 Steal / yoink
- **Pickup registry.** `createStocker()` in `src/store/products.js` already records every shelf prop as `{type, x, y, z, sx, sy, sz, color}` and renders per-type `InstancedMesh` with `DynamicDrawUsage`. Expose `items` and add `take(index)` that zeroes the instance matrix and flags `instanceMatrix.needsUpdate`. That is the whole "product disappears from the shelf" mechanic; no new geometry.
- **Pickup volumes.** Per fixture, a front-face strip 0.55 m deep along each stocked face (both faces of each gondola, the endcap faces, wallbay fronts, the round table rim). Volumes are derived at boot from `gondolas`, `wallBays`, `experience` in `layout.js` plus `BAY.gondolaD` / `BAY.wallD`, so a plan revision moves them automatically.
- **Rule.** Hold Yoink while inside a strip and roughly facing it (dot ≥ 0.3). One prop every 0.18 s, nearest-first, reachable shelves only (y ≤ 1.45 m: shelf 4 on wallbays is out of reach, which reads as "Wisp is small"). Each taken prop spawns a flying copy that arcs onto the head stack (Possum-style pile, capped at 12 visible).
- **Haul HUD.** Bottom centre: stack icon + loose count, tinted per category using the existing `PALETTES`. Top right: **banked score**. Loose is at risk, banked is safe.
- **Empty faces.** A face with fewer than 20 % props left shows a "cleared" tag and stops yielding, pushing the player across the floor.

### 3.3 Hide + scoff
- Hide spots are 0.7 × 0.7 m volumes placed in game data, keyed to fixture ids so they follow the plan. Starting set (validate each with `blockersAt(x, z)`):

| Spot | Where | Approx (x, z) |
|---|---|---|
| Queue rail gap | Between the two queue fixtures, cash wrap | (3.52, 2.95) |
| SL frost panel | West of gondola SL's EC-S5 | (4.05, 4.6) |
| SR frost panels | Both ends of gondola SR (EC-S5 / EC-S5) | (13.1, 4.6), (17.75, 4.6) |
| NM tower shadow | Under the lightbox tower on NM's west end | (8.85, 2.56) |
| SM tower shadow | Under the lightbox tower on SM's west end | (8.2, 4.6) |
| Table lip | West lip of the round tester table, under the Barrisol disc | (15.1, 8.15) |
| Display table | East of the 1600 × 1800 display table | (13.65, 8.06) |
| Stock doorway | `doors.stock.approach`; stepping to `inside` is fully safe | (4.1, 6.62) → (4.1, 7.7) |
| Locker doorway | `doors.locker.approach` | (0.42, 6.05) |

- **Enter:** walk in and stop. Wisp dims and shrinks; camera cones ignore you immediately; guards ignore you unless the "seen entering" rule fires.
- **Scoff:** while hidden, loose items convert to banked score at 4 items/s with popups. Scoffing 10+ in one hide gives +25 %. Three categories in one scoff gives +10.
- **Seen entering:** if a guard had line-of-sight on you within 0.5 s of entering, the spot is burned for 4 s; the guard walks to it and boots you out (run continues, loose haul scatters).
- **No camping:** after 6 s in one spot it glows yellow; 2 s later the nearest guard is pinged to it.
- **Exit:** any move input.

### 3.4 Wardens (Glow Guards)
- P1 ships two guards on fixed beats, spawning from the stock door. Beats are waypoint loops; starting values (engineer validates with `blockersAt`):
  - **North beat:** (4.8, 1.3) → (17.9, 1.3) → (17.9, 3.55) → (4.8, 3.55).
  - **South beat:** (4.8, 5.9) → (17.9, 5.9) → (18.1, 8.9) → (14.0, 8.9) → (14.0, 6.9).
  - All hide spots and beat waypoints above were checked against `blockersAt` on the rev 18/08 layout and return no blockers.
- States: **patrol** 1.4 m/s → **curious** 1.8 m/s (heard a yoink within 3.5 m or a camera ping; walk to the spot, look around 2 s) → **chase** 2.9 m/s (has line-of-sight) → **search** (lost you 2.5 s: go to last seen, 2 s look) → patrol.
- Guard line-of-sight: horizontal cone from eye height 1.5 m, half-angle 70°, radius 5 m. Occluded by any fixture AABB from `fixtureAabbs()` taller than 1.0 m (2D segment test against the box; all gondolas, wallbays, columns, walls count; queue rails and the cash counter do not).
- **Catch:** guard within 0.5 m of Wisp for 0.25 s, or any contact during chase. One hit = busted, no health.
- Guards move on the same walk pads and AABBs as Wisp (reuse the `collide` / `blocked` helpers from `wisp.js`).
- Goofy rules: guards bump and stall 1 s when they cross paths; a guard that chases into a hide spot the player just left does a confused spin.
- P2 adds the **Floor Bot**: a slow disc that only travels the three main aisles in straight lines, released after a crown alarm.

### 3.5 Camera rays (ceiling eyes) — see §4.

### 3.6 Scoring
| Item | Points | Notes |
|---|---|---|
| bottle / tube / packet | 1 | Types come from the stocker |
| compact / box | 2 | |
| Hero prop | 15 | 3 s hold, one per tower / EC-M |
| Crown | 50 | Cashier lightbox hero, mask-wall centrepiece |
| Scoff 10+ in one hide | +25 % of that scoff | |
| 3 categories in one scoff | +10 | |
| Overtime crumb | +5 s | Once per run if a hero or crown is scoffed in the last 10 s |

Score only counts when banked. Busted = banked score submits, loose haul scatters back to shelves. Sanity cap for validation: 600.

### 3.7 Catch / bust
- Bust sting: guard torch spotlights Wisp, Wisp gets scooped into a jar and floated to the entrance, loose props pop off and drift back to their shelves ("Everything back on the shelf by morning.").
- End screen after bust or timer: banked score, best item, crown badge, your rank today, **Run again** as the biggest button. Time to restart ≤ 1.5 s.

### 3.8 HUD
- Reuse the `.hud-panel` / `.chip` / joystick CSS and the `bindHudPanels` minimise pattern from `src/ui.js`; delete inspect, height, grid, plan, reset.
- Layout: timer top-left (big, Barlow Condensed), banked score top-right, haul stack bottom-centre, heat eye bottom-right above the Yoink button, joystick bottom-left.
- Minimap: reuse `drawMap()` transforms from `ui.js`; add guard dots, camera sectors, hide spots, hero / crown markers. Everything is shown: no hidden information, Possum-style.
- Framing card on first load: "It's closing time. Wisp is dreaming. None of this is real."

---

## 4. Camera ray design (ceiling eyes)

**Purpose.** Cameras are the *pressure* system; guards are the *punishment* system. Cameras never bust you. They build exposure, lock, and summon a guard to where you were.

### 4.1 Mounts (world metres, ceiling 3.55)
| Id | Name | Mount (x, y, z) | Look | Sweep | Radius | Ships |
|---|---|---|---|---|---|---|
| CAM-A | Cash eye | (1.7, 3.3, 2.7) under the yellow canopy | east | ±45°, 7 s | 6.0 | P2 (guards the cashier crown) |
| CAM-B | Column dome | (9.97, 3.4, 0.6) on column N-M | south | ±60°, 8 s | 5.5 | P1 |
| CAM-C | Centre bar | (12.65, 3.47, 3.7) on an existing track-light bar | — | 360°, 12 s | 4.5 | P1 |
| CAM-D | Entrance eye | (18.6, 3.4, 3.35) | west | fixed ±35° | 5.5 | P2, wakes at t = 5 s (grace) |
| CAM-E | Disc eye | (16.55, 3.28, 8.15) in the Barrisol disc | — | 360°, 9 s | 4.0 | P1 (guards the mask-wall crown) |

Mount points are all existing geometry (`cashier.canopy`, `columns[1]`, the track bars in `build.js`, `experience.discLight`) so the eyes sit on real fixtures.

### 4.2 Cone geometry
- Gameplay test is a **floor sector**: origin = mount projected to the floor, inner blind radius 0.8 m (directly under the dome is safe), outer radius R, half-angle 30°, yaw(t) from the sweep.
- Render is a translucent sector mesh on the floor (`CircleGeometry` with theta range, additive blend, colour by state) plus a thin beam from the dome to the sector's leading edge. The sector is always drawn; the player can read the sweep.
- **Occlusion is 2.5D.** Ray from the dome (y ≈ 3.4) to Wisp (y 0.62). For each fixture AABB the segment crosses in XZ, compute the ray height at the crossing: `h = 3.4 − t × (3.4 − 0.62)`. Blocked if `h < fixture height` (gondola 1.75, wallbay 2.4, lightbox 2.0, column 3.55). Result: hugging the far side of a gondola hides you; standing one metre out does not. This is the "shadow" a player learns.
- Hide spots are always invisible to cameras, no ray test.

### 4.3 Detection tick + alert states
- Tick at 10 Hz (independent of frame rate). Per tick per camera: inside sector AND not occluded → `exposure += 0.1`; otherwise `exposure −= 0.02` (full decay in 5 s).
- States by exposure:

| State | Exposure | Cone colour | Dome | Sound | Effect |
|---|---|---|---|---|---|
| Idle | 0 | cream-blue, 18 % | soft white | none | sweeping |
| Tracking | 0.1 – 0.99 | yellow, 35 %, pulses | yellow blink | shutter tick, faster as it fills | ring around Wisp fills; sweep slows 50 % |
| Locked | 1.0 | red, 55 % | red | "SPOTTED" sting | see below |

- **Lock (0.6 s of continuous exposure):** the cone stops sweeping and tracks Wisp (max turn 90°/s) for 2.0 s or until occluded for 0.5 s, then resets to idle after a 3 s cooldown. On lock: heat +1, nearest guard gets a **curious** target = Wisp's position at lock time (a snapshot, not live tracking). Second lock within 10 s: that guard runs (chase speed) to the snapshot. Third: Floor Bot releases (P2).
- **Heat** (0–3, decays one level per 8 s) scales guard patrol speed +15 % per level and camera sweep speed +20 % per level. Crown alarm sets heat 3 and holds it 15 s.

### 4.4 How to dodge (what the player learns)
1. Time the sweep: cones are drawn and periodic.
2. Cross fast: 0.6 s to lock means a straight run across a 4 m cone at 2.35 m/s (1.7 s) locks, but a cross-aisle dash (1.4 m, 0.6 s) with decay in between does not.
3. Use the shadow: the far side of any gondola is dark to a camera.
4. Stand under it: 0.8 m blind radius.
5. Dive into a hide spot: exposure zeroes instantly.
6. Later: tester-spray power-up fogs a lens for 4 s (P3, optional).

### 4.5 Feedback channels
Floor cone colour + pulse · dome LED · exposure ring around Wisp · minimap sector · edge vignette (yellow tracking, red on lock) · escalating shutter tick · "SPOTTED" popup with an arrow to the summoned guard.

### 4.6 Camera vs guard line-of-sight
| | Ceiling eye | Glow Guard |
|---|---|---|
| Origin | Fixed mount at ceiling, sweeping | Moving, eye height 1.5 m, faces travel direction |
| Shape | Floor sector, 30° half-angle, blind radius 0.8 m | Horizontal cone, 70° half-angle, 5 m |
| Occlusion | 2.5D height test: only *tall enough* fixtures block, depending on distance | 2D: any fixture ≥ 1.0 m blocks fully |
| Reaction | Exposure meter, 0.6 s to lock | Instant: seen = chase |
| Consequence | Summons / escalates guards; never catches | Catches (0.5 m, 0.25 s) |
| Escape | Break the sector, hide, or wait out the 2 s track | Break line-of-sight for 2.5 s, or hide unseen |
| Player feel | Tempo and route planning | Panic and improvisation |

---

## 5. Timer + daily leaderboard

- **Run:** hard 60 s. "Last call" at 10 s (lights dim a notch, ticking). Overtime crumb +5 s once per run (§3.6).
- **Day bucket:** `dayKey = new Date(Date.now() + 8 × 3600 × 1000).toISOString().slice(0, 10)` on the server. Board resets at 00:00 SGT, no DST.
- **Storage:** Upstash Redis via Vercel serverless functions in the same repo (`api/*.js`). One sorted set per day `board:{dayKey}` (score → runId), a hash `run:{runId}` for nickname / crown / items, 14-day expiry. Sorted sets give top-N and rank for free.
- **API:**
  - `POST /api/run/start` → `{ runId, token }` (token = HMAC of runId + server time).
  - `POST /api/run/end { runId, token, score, items, crowns, nickname }` → validates elapsed 55–75 s, score ≤ 600, items ≤ 330, one submission per runId, nickname through a small blocklist. Returns `{ rank, top20 }`.
  - `GET /api/board?day=` → top 20 + count.
- **Identity:** nickname (3–12 chars) + a device id in localStorage for "your best today". No accounts day one.
- **Weekly board** later as a union of the seven day keys.

---

## 6. Hero + crown targets

Positions are where the prop sits (inside the fixture footprint); the player yoinks from the adjacent pickup strip.

| Target | Fixture | Prop position | Rule |
|---|---|---|---|
| Hero: NM tower | Lightbox tower, west end of gondola NM (`ends.w === 'lightbox'`) | (9.4, 2.56) | 3 s hold, 15 pts, tower dims when taken |
| Hero: SM tower | Lightbox tower, west end of gondola SM | (8.75, 4.6) | same |
| Hero: NR EC-M | Makeup endcap, west end of gondola NR | (13.9, 2.56) | same |
| **Crown: cashier hero** | Oversized gift-set prop on the cash wrap under the canopy (`cashier`) | (1.55, 2.45) | 4 s hold, 50 pts, covered by CAM-A |
| **Crown: mask-wall icon** | Giant mascot mask at the centre of the angled mask wall (`experience.maskWall`) | (15.15, 9.0) | 4 s hold, 50 pts, covered by CAM-E |

Taking a crown triggers the **crown alarm**: heat 3, every guard goes curious to the crown, cameras sweep double speed for 15 s. Scoffing a crown needs a hide spot; carrying it shows a big crown on the head stack and slows Wisp to 0.7×. Both crowns in one run = "Full Send" badge on the board.

---

## 7. Reuse from fran-zone vs net-new

### Reuse verbatim (vendored, never edited in the game repo)
| File | What the game gets |
|---|---|
| `src/store/layout.js` | Every coordinate: gondolas, wallbays, endcap types, cashier, queue, experience, BOH, doors, walk pads, `fixtureAabbs()`, `blockersAt()`, `nearestFixture()`, `placeName()` |
| `src/store/fixtures.js`, `build.js`, `materials.js`, `labels.js` | The whole store build, lights, canvas-text textures (reuse `headerTexture` for in-world signs and the framing card) |
| `src/store/products.js` | Prop placement + instanced render; add `items` getter and `take(index)` (one small change, upstream it to fran-zone) |
| `src/store/catalog.js`, `scripts/build-catalog.mjs` | Real brand and product names for the yoink toast ("Yoinked · Anua · tester") |
| `src/brand.js`, `src/style.css` tokens, `public/*` | Colours, fonts, wordmark, Wisp texture, floor textures |
| `src/wisp.js` | Locomotion, collision, door routing, sprite + particles |
| `src/controls.js` (partial) | Follow camera, key handling, joystick input, click-to-walk |
| `src/ui.js` (partial) | Minimap transforms, joystick binding, panel minimise |
| `tools/browser-check.js` | Puppeteer smoke test; extend to play one scripted run headless |

### Adapt
- `main.js` → game boot: same renderer / scene setup, replace the frame loop with the run state machine.
- Mask wall in `fixtures.js` builds 162 individual `Mesh` packets. Switch it to the existing but unused `stocker.fillMaskGrid()` so the wall is instanced and yoinkable like everything else. Upstream this too.
- `?noshadow` already exists; the game defaults shadows off on `pointer: coarse` devices.

### Net-new (`src/game/`, est. 2.5k lines)
`run.js` (state machine: idle → playing → busted / timeout → results), `timer.js`, `steal.js` (pickup strips from layout + stocker `take`), `haul.js` (head stack, slowdown), `hide.js`, `guards.js` (beats, states, LoS), `eyes.js` (cameras, exposure, cone meshes), `heat.js`, `score.js`, `hud.js`, `board.js` (client), `audio.js` (small synth or 6 short files), `floor/` (hide spots, beats, camera mounts, hero / crown placements keyed by fixture id), `api/run-start.js`, `api/run-end.js`, `api/board.js`, tutorial card, results screen.

---

## 8. Repo shape: new `fran-game` repo with a vendored store sync

**Pick: a new `fran-game` repo, seeded from fran-zone, with `src/store/` (plus `brand.js`, `wisp.js` and `public/textures`) treated as vendored and refreshed by `npm run sync-store` from the sibling `../fran-zone` checkout.**

Why this over the alternatives:
- **Mode flag in fran-zone:** rejected. The game replaces `main.js`, the frame loop, the camera and the entire HUD; a flag would leave the VM tool carrying game code, audio and a leaderboard API, and a public mall QR would share a deploy with an internal planning tool. Different audiences, different release cadence.
- **Monorepo package:** rejected for now. Heyfran's convention is sibling repos (`fran-mobile`, `fran-pos`, `fran-crm`, `fran-hrm`, `fran-skums`, `fran-web`, `fran-zone`) and fran-zone already reads `../fran-skums` from a script. A workspace would mean migrating fran-zone and its Vercel project to serve two packages. Not worth it for one consumer.
- **Plain fork:** rejected because fixture revisions keep landing (rev 18/08 changed layout, fixtures, materials in 289 lines). A one-way sync keeps "exactly all the same stuff" true a month from now.

Mechanics of the sync:
- `scripts/sync-store.mjs` copies `src/store/**`, `src/brand.js`, `src/wisp.js`, `public/textures/**` from `../fran-zone`, writes `src/store/SYNC.md` with the source commit hash and date. Game never edits those files; if a change is needed (the `take()` hook, the mask-wall instancing) it lands in fran-zone first and syncs down.
- Game-specific floor data lives in `src/game/floor/*.js`, keyed by fixture ids (`NL`, `SM`, `WB-M-3`, `cashier`, `maskWall`). If a fixture moves the data follows; if an id disappears the boot logs it and skips that entry.
- Separate Vercel project and URL (§12).

---

## 9. Smallest playable slices

| Slice | Scope | Done when |
|---|---|---|
| **P0 · Yoink loop** | Seed repo + sync; strip VM UI; fixed camera; 60 s timer; pickup strips on the six gondola islands + endcaps; head stack + slowdown; 4 hide spots with scoff; results screen with local best | Someone plays five runs back to back without being told how |
| **P1 · Heat** | Two Glow Guards on beats with LoS, chase, bust sting; CAM-B, CAM-C, CAM-E with exposure, lock, summon; heat; minimap with guards, cones, spots; sounds | Bust rate in internal play sits between 40 % and 70 %; players can explain why they got caught |
| **P2 · Board + crowns** | Daily leaderboard (Upstash + three API routes), nickname, SGT bucket, rank on results; hero props; both crowns + crown alarm; CAM-A, CAM-D; Floor Bot; all shelf fronts and wallbays yoinkable | Ten staff on one evening produce a board that changes hands at least three times |
| **P3 · Juice + QR** | Yoink arcs, scoff popups, bust jar, last-call lighting, tutorial card, portrait layout, share card, QR landing, analytics events, kill switch, load budget | Meets the §13 criteria on a mid Android over mall Wi-Fi |

Rough effort: P0 3 days, P1 4 days, P2 4 days, P3 3 days, one engineer.

---

## 10. Tone / brand guardrails

- **Dream frame, always.** Opening card and results screen both say it is a dream. Props float back at the end of every run.
- **Never instructional.** No blind-spot maps of real security, no pocketing animation, no exit-through-the-mall goal. The "win" is scoffing in a hide spot, not leaving the store. Wisp never crosses the entrance line during a run (the mall pad is off-limits in game mode).
- **Security is goofy.** Glow Guards are glowing blobs with torches, not uniformed people. Cameras are cute domes with eyelids. No real CCTV UI, no "recording" overlays.
- **Products are props.** HUD says "tester" / "prop"; shelf items are the existing coloured primitives, never product photos. Brand names appear only in the yoink toast, drawn from the same catalog the VM tool already shows, and only for brands on J T's sign-off list.
- **No money.** No prices, no baskets, no links to shop from inside a run. A "shop this" link may live on the results screen if J T wants it (§12).
- **Yellow is the player's colour.** Exposure ring, cones and the haul use the brand yellow / brown / blue tokens from `brand.js`.
- **Words to avoid in UI copy:** steal, shoplift, theft, loss prevention. Use yoink, haul, scoff, busted, spotted.

---

## 11. Non-goals

- No SUNFALL bosses, arrows, arena platforms or PartyKit fight protocol in the store. Combat stays on fran-web.
- No real inventory deduction, no writes to fran-skums, fran-pos or any stock system, ever.
- No planogram source-of-truth wiring on day one. Yoinkable props come from the existing procedural stocker; hero / crown placements are hand-keyed to fixture ids.
- No accounts, no FWB login, no payments, no push.
- No multiplayer at launch (Duo Chaos is a P4 candidate).
- No free orbit / plan view / VM inspect inside the game.
- No product imagery; no realistic guard characters.

---

## 12. Open decisions for J T

1. **Mascot:** Wisp as-is (zero art cost, brand-native) vs a raccoon / possum vs a new Fran creature. Recommendation: ship P0–P2 with Wisp, decide after the first staff test.
2. **Title:** "FRAN GAME" placeholder vs a real name (candidates: YOINK, CLOSING TIME, FRAN AFTER DARK).
3. **Identity:** nickname + device id (recommended) vs FWB login later.
4. **URL:** `fran-game.vercel.app` (recommended for P0–P2) vs `game.heyfran.com` for the QR launch. Not `fran-zone.vercel.app/heist`, since the repo split makes that a proxy rule for no gain.
5. **Launch context:** staff party first (recommended, collects the day-one board and a bust-rate reading), then mall QR at the queue rail and experience zone.
6. **Brand names in toasts:** full catalog, official-only (`official: true` in `catalog.js`), or none.
7. **Results-screen link:** none, or a single "see this week's picks" link to fran-web.
8. **Prize:** does the daily #1 get anything at the counter? Affects anti-cheat effort.

---

## 13. Success criteria for "fun enough to ship a mall QR"

| Measure | Target |
|---|---|
| QR scan to first yoink | ≤ 20 s on a 2021 mid Android over mall Wi-Fi |
| Initial load | ≤ 2.5 MB transferred, ≤ 5 s to interactive |
| Frame rate | 60 fps iPhone 12 / Pixel 6; ≥ 30 fps on a 2020 mid Android with shadows off |
| Replay | ≥ 40 % of first-time players start a second run; median session ≥ 3 runs |
| Tension | Bust rate 40–70 % across a 10-person test |
| Readability | 8 of 10 first-time testers finish a run without asking how; every bust is explainable by the tester ("the camera got me, then the guard") |
| Board health | Top 20 changes hands ≥ 3 times on staff-party night; zero scores above the validation cap |
| Delight | At least three people laugh at the bust sting in the first staff test |
| Brand | Store team and J T sign off the framing card, guard look and brand-name list; no copy uses the §10 avoid-list |
| Ops | Kill switch (env flag) hides the QR landing within a deploy; leaderboard survives a 200-player evening on the Upstash free tier |

---

*FRAN GAME build plan · Heyfran · Pizza Possum loop on the Bugis+ play-canvas. SUNFALL stays the arena on fran-web.*
