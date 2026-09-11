import * as THREE from 'three';
import { brand } from '../brand.js';
import { headerTexture } from '../store/labels.js';
import { fixtureAabbs, onWalkable, walkRegion, doors } from '../store/layout.js';
import { resolveJarellBeats } from './floor/jarellBeats.js';

/**
 * jarell — little cream egg who skips the Bugis+ floor.
 * Skips around on ambient beats (sometimes ducks into BOH). Proximity catch
 * is handled by run.js (Glow Guard-style): touch = busted / dream over.
 */

const RADIUS = 0.18;
/** Horizontal catch radius vs Wisp — matches Glow Guard doc (0.5 m). */
export const CATCH_RADIUS = 0.5;
/** Seconds of continuous contact before bust. */
export const CATCH_HOLD = 0.25;
const SPEED = 1.15;
const BODY_Y = 0.28;
const BOH_CHANCE = 0.28;
const IDLE_MIN = 0.6;
const IDLE_MAX = 2.2;

function routeTo(fromX, fromZ, x, z) {
  const from = walkRegion(fromX, fromZ);
  const to = walkRegion(x, z);
  const path = [];
  if (from !== to) {
    if (from === 'locker') path.push(doors.locker.inside, doors.locker.approach, doors.locker.aisle);
    if (from === 'stock') path.push(doors.stock.inside, doors.stock.approach, doors.stock.aisle);
    if (to === 'stock') path.push(doors.stock.aisle, doors.stock.approach, doors.stock.inside);
    if (to === 'locker') path.push(doors.locker.aisle, doors.locker.approach, doors.locker.inside);
  }
  path.push({ x, z });
  return path;
}

function makeNametag() {
  const tex = headerTexture('jarell', {
    bg: '#ffe14d',
    fg: '#3a2415',
    w: 420,
    h: 140,
    size: 86,
  });
  const mat = new THREE.SpriteMaterial({
    map: tex,
    transparent: true,
    depthWrite: false,
    depthTest: true,
  });
  const sprite = new THREE.Sprite(mat);
  // Sized for three-quarter cam readability without eating the screen.
  sprite.scale.set(0.55, 0.18, 1);
  sprite.position.set(0, 0.72, 0);
  sprite.renderOrder = 4;
  return sprite;
}

function buildEgg() {
  const root = new THREE.Group();
  root.name = 'jarell';

  const shellMat = new THREE.MeshStandardMaterial({
    color: brand.cream,
    roughness: 0.55,
    metalness: 0.05,
    emissive: brand.yellowSoft,
    emissiveIntensity: 0.08,
  });
  const yolkMat = new THREE.MeshStandardMaterial({
    color: brand.yellow,
    roughness: 0.4,
    emissive: brand.yellow,
    emissiveIntensity: 0.12,
  });
  const inkMat = new THREE.MeshStandardMaterial({
    color: brand.brown,
    roughness: 0.7,
  });
  const limbMat = new THREE.MeshStandardMaterial({
    color: brand.peach,
    roughness: 0.55,
  });

  // Egg body — taller ovoid.
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.22, 22, 18), shellMat);
  body.scale.set(0.92, 1.22, 0.92);
  body.position.y = BODY_Y;
  body.castShadow = true;
  root.add(body);

  // Soft belly blush.
  const blush = new THREE.Mesh(
    new THREE.SphereGeometry(0.1, 12, 10),
    new THREE.MeshBasicMaterial({
      color: 0xf5b7a0,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
    }),
  );
  blush.position.set(0, BODY_Y - 0.02, 0.14);
  blush.scale.set(1.1, 0.7, 0.5);
  root.add(blush);

  // Tiny yolk freckle on the shell.
  const freckle = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), yolkMat);
  freckle.position.set(0.08, BODY_Y + 0.12, 0.16);
  root.add(freckle);

  // Eyes.
  const eyeGeo = new THREE.SphereGeometry(0.035, 10, 8);
  const leftEye = new THREE.Mesh(eyeGeo, inkMat);
  leftEye.position.set(-0.07, BODY_Y + 0.08, 0.18);
  const rightEye = new THREE.Mesh(eyeGeo, inkMat);
  rightEye.position.set(0.07, BODY_Y + 0.08, 0.18);
  root.add(leftEye, rightEye);

  // Smile.
  const smile = new THREE.Mesh(
    new THREE.TorusGeometry(0.05, 0.012, 6, 12, Math.PI),
    inkMat,
  );
  smile.position.set(0, BODY_Y - 0.02, 0.19);
  smile.rotation.x = Math.PI;
  smile.rotation.z = Math.PI;
  root.add(smile);

  // Legs (tiny stubs that pump on skip).
  const legGeo = new THREE.CapsuleGeometry(0.035, 0.06, 4, 8);
  const leftLeg = new THREE.Mesh(legGeo, limbMat);
  leftLeg.position.set(-0.07, 0.06, 0.02);
  const rightLeg = new THREE.Mesh(legGeo, limbMat);
  rightLeg.position.set(0.07, 0.06, 0.02);
  root.add(leftLeg, rightLeg);

  // One expressive hand on a pivot — swings / waves while moving.
  const handPivot = new THREE.Group();
  handPivot.position.set(0.2, BODY_Y + 0.02, 0.02);
  const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.028, 0.08, 4, 8), limbMat);
  arm.position.set(0.05, -0.02, 0);
  arm.rotation.z = -0.4;
  const hand = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), limbMat);
  hand.position.set(0.11, -0.06, 0.02);
  handPivot.add(arm, hand);
  root.add(handPivot);

  const nametag = makeNametag();
  root.add(nametag);

  // Soft floor blob so they read on the pad.
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.16, 20),
    new THREE.MeshBasicMaterial({
      color: 0x3a2415,
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
    }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.012;
  root.add(shadow);

  return { root, body, leftLeg, rightLeg, handPivot, nametag, shadow };
}

export function createJarell(scene) {
  const beats = resolveJarellBeats();
  const { root, body, leftLeg, rightLeg, handPivot, nametag, shadow } = buildEgg();
  scene.add(root);

  const boxes = fixtureAabbs();
  const velocity = new THREE.Vector3();
  const wish = new THREE.Vector3();
  const dest = new THREE.Vector3();
  let hasDest = false;
  let waypoints = [];
  let idle = 0.4;
  let facing = 0;
  let moving = false;
  let skipPhase = 0;
  let lastId = null;

  const start = beats.sales[0] || { x: 10.5, z: 3.55 };
  root.position.set(start.x, 0, start.z);

  function overlaps(x, z, b) {
    return (
      x + RADIUS > b.x0 &&
      x - RADIUS < b.x1 &&
      z + RADIUS > b.z0 &&
      z - RADIUS < b.z1 &&
      Math.hypot(x - Math.max(b.x0, Math.min(x, b.x1)), z - Math.max(b.z0, Math.min(z, b.z1))) <
        RADIUS
    );
  }

  function blocked(x, z) {
    if (!onWalkable(x, z)) return true;
    for (const b of boxes) {
      if (b.ghost) continue;
      if (overlaps(x, z, b)) return true;
    }
    return false;
  }

  function collide(nx, nz) {
    const x0 = root.position.x;
    const z0 = root.position.z;
    if (!blocked(nx, nz)) return { x: nx, z: nz };
    if (!blocked(nx, z0)) return { x: nx, z: z0 };
    if (!blocked(x0, nz)) return { x: x0, z: nz };
    return { x: x0, z: z0 };
  }

  function pickTarget() {
    const wantBoh = beats.boh.length && Math.random() < BOH_CHANCE;
    const pool = wantBoh ? beats.boh : beats.sales.length ? beats.sales : beats.boh;
    if (!pool.length) return null;
    let picks = pool.filter((p) => p.id !== lastId);
    if (!picks.length) picks = pool;
    return picks[(Math.random() * picks.length) | 0];
  }

  function goTo(point) {
    if (!point) return;
    lastId = point.id;
    waypoints = routeTo(root.position.x, root.position.z, point.x, point.z);
    const first = waypoints.shift();
    dest.set(first.x, 0, first.z);
    hasDest = true;
    idle = 0;
  }

  function chooseNext() {
    idle = IDLE_MIN + Math.random() * (IDLE_MAX - IDLE_MIN);
    // Schedule destination after idle; set a tiny delay then pick.
    goSoon = true;
  }

  let goSoon = true;

  function update(dt, time) {
    if (goSoon && idle <= 0 && !hasDest) {
      goSoon = false;
      goTo(pickTarget());
    }

    if (idle > 0 && !hasDest) {
      idle -= dt;
      if (idle <= 0) goSoon = true;
    }

    wish.set(0, 0, 0);
    moving = false;

    if (hasDest) {
      const dx = dest.x - root.position.x;
      const dz = dest.z - root.position.z;
      const d = Math.hypot(dx, dz);
      if (d < 0.14) {
        if (waypoints.length) {
          const nextWp = waypoints.shift();
          dest.set(nextWp.x, 0, nextWp.z);
        } else {
          hasDest = false;
          chooseNext();
        }
      } else {
        wish.set(dx / d, 0, dz / d);
        moving = true;
      }
    }

    const len = wish.length();
    if (len > 1) wish.multiplyScalar(1 / len);
    velocity.lerp(wish, 1 - Math.exp(-9 * dt));
    const speed = velocity.length();
    if (speed > 0.04) {
      const step = SPEED * dt;
      const next = collide(
        root.position.x + velocity.x * step,
        root.position.z + velocity.z * step,
      );
      // Stuck against a corner — skip ahead to next waypoint or re-pick.
      if (next.x === root.position.x && next.z === root.position.z && hasDest) {
        if (waypoints.length) {
          const nextWp = waypoints.shift();
          dest.set(nextWp.x, 0, nextWp.z);
        } else {
          hasDest = false;
          chooseNext();
        }
      } else {
        root.position.x = next.x;
        root.position.z = next.z;
      }
      facing = Math.atan2(velocity.x, velocity.z);
    }

    root.rotation.y = facing;

    // Skipping bounce + leg pump + hand wave while moving.
    if (moving && speed > 0.08) {
      skipPhase += dt * 9.5;
      const hop = Math.abs(Math.sin(skipPhase));
      body.position.y = BODY_Y + hop * 0.09;
      body.rotation.z = Math.sin(skipPhase) * 0.12;
      body.rotation.x = -0.08;
      leftLeg.rotation.x = Math.sin(skipPhase) * 0.7;
      rightLeg.rotation.x = Math.sin(skipPhase + Math.PI) * 0.7;
      // Hand swings / little wave on the hop peaks.
      handPivot.rotation.z = -0.35 + Math.sin(skipPhase * 1.15) * 0.85;
      handPivot.rotation.x = Math.sin(skipPhase * 0.9) * 0.35;
      nametag.position.y = 0.72 + hop * 0.05;
      shadow.scale.setScalar(1 - hop * 0.18);
      shadow.material.opacity = 0.22 - hop * 0.06;
    } else {
      skipPhase *= 0.9;
      body.position.y = BODY_Y + Math.sin(time * 2.2) * 0.015;
      body.rotation.z *= 0.85;
      body.rotation.x *= 0.85;
      leftLeg.rotation.x *= 0.8;
      rightLeg.rotation.x *= 0.8;
      // Gentle idle wave so the hand still feels alive.
      handPivot.rotation.z = -0.2 + Math.sin(time * 2.6) * 0.15;
      handPivot.rotation.x = Math.sin(time * 1.8) * 0.08;
      nametag.position.y = 0.72;
      shadow.scale.setScalar(1);
      shadow.material.opacity = 0.22;
    }

    // Keep nametag upright-ish for three-quarter readability (sprite already faces cam).
    nametag.material.rotation = 0;
  }

  function reset() {
    const home = beats.sales[Math.floor(beats.sales.length / 2)] || start;
    root.position.set(home.x, 0, home.z);
    hasDest = false;
    waypoints = [];
    velocity.set(0, 0, 0);
    idle = 0.5;
    goSoon = true;
    lastId = null;
    moving = false;
  }

  return {
    root,
    beats,
    update,
    reset,
    get position() {
      return root.position;
    },
    get moving() {
      return moving;
    },
  };
}
