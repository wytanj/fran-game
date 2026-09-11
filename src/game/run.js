import * as THREE from 'three';
import { spawn } from '../store/layout.js';
import { createPickups } from './steal.js';
import { createHaul } from './haul.js';
import { createHideSpots } from './hide.js';
import { resolveHideSpots } from './floor/hideSpots.js';
import { createGameCamera } from './camera.js';
import { createInput } from './input.js';
import { createHud } from './hud.js';
import { createAudio } from './audio.js';
import { createDreamView } from './dream.js';
import { scoffBonuses, loadBest, saveBest, RULES } from './score.js';
import { createJarell } from './jarell.js';

/**
 * Run state machine: idle (framing card) → playing → results → playing …
 * P0: 60 s timer, yoink on gondola faces + endcaps, head haul with slowdown,
 * hide spots with scoff, results with device-local best. No guards, no
 * cameras, no board, no crowns yet. Ambient egg NPC: jarell.
 */
export const RUN_SECONDS = 60;
const YOINK_EVERY = 0.18;
const SCOFF_PER_SEC = 4;
const LAST_CALL = 10;
const MALL_X = 18.9; // the mall pad is off-limits during a run

export function createRun({ scene, camera, canvas, storeRoot, wisp }) {
  const pickups = createPickups(storeRoot);
  const haul = createHaul(scene, wisp);
  const spots = resolveHideSpots();
  const hide = createHideSpots(scene, spots);
  const jarell = createJarell(scene);
  const view = createGameCamera(camera, wisp);
  const hud = createHud();
  const audio = createAudio();
  const dream = createDreamView(storeRoot, camera, wisp);
  const input = createInput(canvas, camera, view, {
    onWalkTo(x, z) {
      if (state !== 'playing') return;
      dest.set(x, 0, z);
      hasDest = true;
      stuck = 0;
    },
  });

  let state = 'idle';
  let timeLeft = RUN_SECONDS;
  let yoinkCd = 0;
  let scoffAcc = 0;
  let banked = 0;
  let scoffed = 0;
  let yoinked = 0;
  let biggestScoff = 0;
  let lastTick = -1;
  let lastCall = false;
  let session = null;
  let best = loadBest();

  const dest = new THREE.Vector3();
  let hasDest = false;
  let stuck = 0;
  const prev = new THREE.Vector3();
  const vel = new THREE.Vector3();
  const tmp = new THREE.Vector3();
  const wispParts = findWispParts(wisp.root);

  if (!spots.length) console.warn('[floor] no hide spots resolved; scoffing is impossible');
  console.info(`[game] ${pickups.items.length} yoinkable props on ${pickups.faces.size} faces · ${spots.length} hide spots`);
  console.info(`[jarell] egg on floor · ${jarell.beats.sales.length} sales + ${jarell.beats.boh.length} BOH beats`);

  hud.setBest(best.score);
  hud.setBanked(0);
  hud.setTimer(RUN_SECONDS);
  hud.showCard(best.score);
  hud.bind({ onStart: start, onAgain: start });

  function start() {
    audio.unlock();
    audio.go();
    pickups.restoreAll();
    haul.clear();
    hide.reset();
    jarell.reset();
    wisp.root.position.set(spawn.x, 0.62, spawn.z);
    wisp.clearDest();
    wisp.setWish(0, 0);
    view.snap();
    hasDest = false;
    timeLeft = RUN_SECONDS;
    yoinkCd = 0;
    scoffAcc = 0;
    banked = 0;
    scoffed = 0;
    yoinked = 0;
    biggestScoff = 0;
    lastTick = -1;
    lastCall = false;
    session = null;
    setHiddenLook(false);
    dream.setDim(1);
    hud.setLastCall(false);
    hud.setBanked(0);
    hud.setTimer(RUN_SECONDS);
    hud.setHaul([], false);
    hud.hideOverlays();
    hud.hint('Hold Yoink beside a shelf.');
    hud.toast('Lights out. Go.', true);
    input.setEnabled(true);
    state = 'playing';
  }

  function finish() {
    state = 'results';
    input.setEnabled(false);
    closeSession();
    const lost = haul.count;
    haul.scatter();
    setHiddenLook(false);
    hud.setHaul([], false);
    hud.setLastCall(false);
    dream.setDim(0.85);
    audio.end();
    // Everything back on the shelf by morning.
    setTimeout(() => {
      if (state === 'results') pickups.restoreAll();
    }, 1100);

    const newBest = banked > best.score;
    if (newBest) {
      best = { score: banked, items: scoffed, at: new Date().toISOString() };
      saveBest(best);
      hud.setBest(best.score);
    }
    hud.showResults({
      kicker: 'Lights on',
      title: newBest ? 'New best!' : "Time's up",
      banked,
      best: best.score,
      newBest,
      rows: [
        ['Testers scoffed', scoffed],
        ['Biggest scoff', biggestScoff],
        ['Floated back to the shelf', lost],
        ['Yoinked in total', yoinked],
      ],
    });
  }

  function bank(points) {
    banked = Math.min(RULES.cap, banked + points);
    hud.setBanked(banked, true);
  }

  function closeSession() {
    if (!session) return;
    const bonuses = scoffBonuses(session);
    let sum = 0;
    for (const b of bonuses) sum += b.points;
    if (sum > 0) {
      bank(sum);
      audio.bonus();
      haul.topWorld(tmp);
      tmp.y += 0.3;
      hud.popup(tmp, `${bonuses.map((b) => b.label).join(' + ')} +${sum}`, 'bonus');
    }
    biggestScoff = Math.max(biggestScoff, session.points + sum);
    session = null;
  }

  function setHiddenLook(on) {
    wisp.root.scale.setScalar(on ? 0.8 : 1);
    if (wispParts.sprite) wispParts.sprite.material.opacity = on ? 0.5 : 1;
    if (wispParts.light) wispParts.light.intensity = on ? 1.2 : 3.2;
    hud.setHidden(on);
  }

  function scoffTick(dt) {
    if (haul.count === 0) {
      scoffAcc = 0;
      return;
    }
    scoffAcc += dt * SCOFF_PER_SEC;
    while (scoffAcc >= 1 && haul.count > 0) {
      scoffAcc -= 1;
      const item = haul.pop();
      bank(item.points);
      scoffed += 1;
      session.count += 1;
      session.points += item.points;
      session.categories.add(item.category);
      audio.scoff();
      haul.topWorld(tmp);
      hud.popup(tmp, `+${item.points}`);
    }
    hud.setHaul(haul.entries, haul.speedScale < 1);
    if (haul.count === 0) hud.hint('Scoffed the lot. Move to leave.');
  }

  function yoinkTick(dt) {
    yoinkCd -= dt;
    if (!input.yoink || yoinkCd > 0) return;
    const item = pickups.nearest(wisp.position.x, wisp.position.z);
    if (!item) {
      yoinkCd = 0.08;
      return;
    }
    const res = pickups.take(item);
    haul.add(item);
    yoinked += 1;
    yoinkCd = YOINK_EVERY;
    audio.yoink(haul.count);
    hud.setHaul(haul.entries, haul.speedScale < 1);
    if (res === 'cleared') hud.toast(`${item.face.gondola.name} face cleared · move on`);
  }

  function update(dt, time) {
    const playing = state === 'playing';
    let moving = false;

    if (playing) {
      const w = input.wish();
      if (w) {
        hasDest = false;
        const s = haul.speedScale;
        wisp.setWish(w.x * s, w.z * s);
        moving = true;
      } else if (hasDest) {
        const dx = dest.x - wisp.position.x;
        const dz = dest.z - wisp.position.z;
        const d = Math.hypot(dx, dz);
        if (d < 0.14 || stuck > 0.8) {
          hasDest = false;
          stuck = 0;
        } else {
          const s = haul.speedScale;
          wisp.setWish((dx / d) * s, (dz / d) * s);
          moving = true;
        }
      }
    }

    prev.copy(wisp.position);
    wisp.update(dt, time);
    if (wisp.position.x > MALL_X) wisp.root.position.x = MALL_X;
    vel.subVectors(wisp.position, prev).divideScalar(Math.max(dt, 1e-4));
    if (hasDest) stuck = Math.hypot(vel.x, vel.z) < 0.15 ? stuck + dt : 0;

    if (playing) {
      timeLeft -= dt;
      const r = hide.update(dt, time, wisp.position.x, wisp.position.z, moving);
      if (r.entered) {
        setHiddenLook(true);
        audio.hide();
        session = { count: 0, points: 0, categories: new Set() };
        hud.hint(haul.count ? `Hidden · ${r.spot.name}. Scoffing…` : `Hidden · ${r.spot.name}. Nothing to scoff.`);
      }
      if (r.exited) {
        setHiddenLook(false);
        closeSession();
      }
      if (r.hidden) {
        scoffTick(dt);
      } else {
        scoffAcc = 0;
        yoinkTick(dt);
        if (haul.count === 0) hud.hint(input.yoink ? 'Get closer to a shelf.' : 'Hold Yoink beside a shelf.');
        else if (r.spot) hud.hint('Stop here to scoff.');
        else if (haul.speedScale < 0.85) hud.hint('Heavy haul. Find a glowing spot and stop.');
        else hud.hint('Find a glowing spot and stop to scoff.');
      }

      if (timeLeft <= LAST_CALL && !lastCall) {
        lastCall = true;
        hud.toast('Last call');
        hud.setLastCall(true);
        dream.setDim(0.6);
      }
      if (lastCall) {
        const s = Math.ceil(timeLeft);
        if (s !== lastTick) {
          lastTick = s;
          audio.tick();
        }
      }
      hud.setTimer(timeLeft);
      if (timeLeft <= 0) {
        timeLeft = 0;
        finish();
      }
    } else {
      hide.update(dt, time, wisp.position.x, wisp.position.z, true);
    }

    haul.update(dt, vel.x, vel.z);
    jarell.update(dt, time);
    view.update(dt);
    dream.update();
    hud.updatePopups(camera, dt);
  }

  return {
    update,
    start,
    finish,
    pickups,
    haul,
    hide,
    jarell,
    spots,
    hud,
    view,
    get state() {
      return state;
    },
    get banked() {
      return banked;
    },
    get timeLeft() {
      return timeLeft;
    },
    /** Test hook: fast-forward the clock. */
    skipTo(seconds) {
      timeLeft = seconds;
    },
  };
}

function findWispParts(root) {
  let sprite = null;
  let light = null;
  root.traverse((o) => {
    if (o.isSprite && !sprite) sprite = o;
    if (o.isPointLight && !light) light = o;
  });
  return { sprite, light };
}
