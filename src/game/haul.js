import * as THREE from 'three';

/**
 * The loose haul: props stacked on Wisp's head, Possum-style.
 * Loose is at risk; banked is safe. Big hauls slow Wisp down.
 */
const VISIBLE_CAP = 12;
const FLY_TIME = 0.32;
const SLOT_H = 0.085;
const STACK_BASE = 0.42;

export function speedScaleFor(loose) {
  return THREE.MathUtils.clamp(1 - 0.02 * loose, 0.7, 1);
}

export function createHaul(scene, wisp) {
  const stack = new THREE.Group();
  stack.name = 'haul';
  stack.position.y = STACK_BASE;
  wisp.root.add(stack);

  const geos = {
    bottle: new THREE.CylinderGeometry(1, 1, 1, 10),
    box: new THREE.BoxGeometry(1, 1, 1),
    tube: new THREE.CapsuleGeometry(0.5, 1.2, 4, 8),
    compact: new THREE.CylinderGeometry(1, 1, 1, 14),
    packet: new THREE.BoxGeometry(1, 1, 1),
  };
  const mats = new Map();
  function matFor(hex) {
    let mat = mats.get(hex);
    if (!mat) {
      mat = new THREE.MeshStandardMaterial({ color: hex, roughness: 0.38, metalness: 0.08 });
      mats.set(hex, mat);
    }
    return mat;
  }

  const loose = [];
  const flying = [];
  const fading = [];
  const tmp = new THREE.Vector3();
  const slot = new THREE.Vector3();

  function slotLocal(i, out = slot) {
    return out.set(Math.sin(i * 1.7) * 0.025, i * SLOT_H, Math.cos(i * 2.3) * 0.025);
  }

  function add(item) {
    const entry = { item, mesh: null, fly: null, slot: loose.length };
    if (loose.length < VISIBLE_CAP) {
      const mesh = new THREE.Mesh(geos[item.type] ?? geos.bottle, matFor(item.color));
      mesh.scale.set(item.sx, item.sy, item.sz);
      mesh.rotation.y = item.rotY + (Math.random() - 0.5) * 0.6;
      mesh.position.set(item.x, item.y, item.z);
      scene.add(mesh);
      entry.mesh = mesh;
      entry.fly = { t: 0, from: new THREE.Vector3(item.x, item.y, item.z) };
      flying.push(entry);
    }
    loose.push(entry);
    return entry;
  }

  /** Remove the top prop (scoff). Returns the item. */
  function pop() {
    const entry = loose.pop();
    if (!entry) return null;
    if (entry.mesh) {
      const fi = flying.indexOf(entry);
      if (fi >= 0) flying.splice(fi, 1);
      scene.attach(entry.mesh);
      fading.push({ mesh: entry.mesh, t: 0, mode: 'scoff' });
    }
    return entry.item;
  }

  /** Timer ran out: the loose haul floats back to the shelf by morning. */
  function scatter() {
    for (const entry of loose) {
      if (!entry.mesh) continue;
      scene.attach(entry.mesh);
      fading.push({ mesh: entry.mesh, t: 0, mode: 'float', spin: (Math.random() - 0.5) * 4 });
    }
    loose.length = 0;
    flying.length = 0;
  }

  function clear() {
    for (const entry of loose) entry.mesh?.parent?.remove(entry.mesh);
    for (const f of fading) f.mesh.parent?.remove(f.mesh);
    loose.length = 0;
    flying.length = 0;
    fading.length = 0;
  }

  /** World position of the top of the stack (for popups). */
  function topWorld(out) {
    slotLocal(Math.min(loose.length, VISIBLE_CAP) + 1, out);
    return stack.localToWorld(out);
  }

  function update(dt, velX = 0, velZ = 0) {
    for (let i = flying.length - 1; i >= 0; i -= 1) {
      const e = flying[i];
      e.fly.t += dt / FLY_TIME;
      const t = Math.min(1, e.fly.t);
      stack.localToWorld(slotLocal(e.slot, tmp));
      const target = tmp.clone();
      tmp.lerpVectors(e.fly.from, target, t);
      tmp.y += Math.sin(t * Math.PI) * 0.55;
      e.mesh.position.copy(tmp);
      e.mesh.rotation.y += dt * 9;
      if (t >= 1) {
        stack.add(e.mesh);
        e.mesh.position.copy(slotLocal(e.slot, tmp));
        e.mesh.rotation.set(0, e.mesh.rotation.y, 0);
        e.fly = null;
        flying.splice(i, 1);
      }
    }

    // Lean the pile away from the direction of travel.
    const k = 1 - Math.exp(-8 * dt);
    stack.rotation.z += (velX * 0.16 - stack.rotation.z) * k;
    stack.rotation.x += (-velZ * 0.16 - stack.rotation.x) * k;

    for (let i = fading.length - 1; i >= 0; i -= 1) {
      const f = fading[i];
      if (f.mode === 'scoff') {
        f.t += dt / 0.4;
        f.mesh.position.y += dt * 0.8;
        f.mesh.scale.multiplyScalar(Math.max(0, 1 - dt * 6));
      } else {
        f.t += dt / 1.1;
        f.mesh.position.y += dt * 1.4;
        f.mesh.rotation.y += dt * f.spin;
        if (f.t > 0.5) f.mesh.scale.multiplyScalar(Math.max(0, 1 - dt * 4));
      }
      if (f.t >= 1) {
        f.mesh.parent?.remove(f.mesh);
        fading.splice(i, 1);
      }
    }
  }

  function categories() {
    const set = new Set();
    for (const e of loose) set.add(e.item.category);
    return set;
  }

  return {
    add,
    pop,
    scatter,
    clear,
    update,
    topWorld,
    categories,
    get entries() {
      return loose;
    },
    get count() {
      return loose.length;
    },
    get speedScale() {
      return speedScaleFor(loose.length);
    },
  };
}
