import * as THREE from 'three';
import { gondolas, BAY } from '../store/layout.js';

/**
 * Pickup registry.
 *
 * The vendored stocker renders every shelf prop as an InstancedMesh. We do not
 * edit that file, so the registry is rebuilt at boot from the instance
 * matrices: decompose each one, work out which gondola face owns it, and keep
 * the original matrix so a run can be reset. Taking a prop zeroes its instance
 * matrix, which is the whole "it vanished from the shelf" mechanic.
 *
 * P0 scope: the six gondola islands (both long faces + both endcaps).
 * Wallbays, the round table and the mask wall stay on the shelf.
 */
export const POINTS = { bottle: 1, tube: 1, packet: 1, compact: 2, box: 2 };
export const REACH = 0.8;
export const REACH_Y = 1.45;
export const CLEARED_AT = 0.2;

const PAD = 0.06;

function typeOf(geometry, scale) {
  const t = geometry.type;
  if (t === 'CapsuleGeometry') return 'tube';
  if (t === 'CylinderGeometry') return geometry.parameters?.radialSegments === 14 ? 'compact' : 'bottle';
  if (t === 'BoxGeometry') return scale.z < 0.02 ? 'packet' : 'box';
  return 'bottle';
}

function faceFor(x, z) {
  for (const g of gondolas) {
    const hw = g.w / 2 + PAD;
    const hd = BAY.gondolaD / 2 + PAD;
    if (Math.abs(x - g.x) > hw || Math.abs(z - g.z) > hd) continue;
    const inner = g.w / 2 - BAY.endcap;
    let side;
    if (x < g.x - inner) side = 'w';
    else if (x > g.x + inner) side = 'e';
    else side = z < g.z ? 'n' : 's';
    const endcap = side === 'w' || side === 'e';
    return {
      gondola: g,
      side,
      id: `${g.id}:${side}`,
      category: endcap && g.hygiene ? 'cleanser' : g.category,
    };
  }
  return null;
}

export function createPickups(storeRoot) {
  const wrap = storeRoot.getObjectByName('products');
  const items = [];
  const faces = new Map();
  const m = new THREE.Matrix4();
  const p = new THREE.Vector3();
  const q = new THREE.Quaternion();
  const s = new THREE.Vector3();
  const c = new THREE.Color();

  for (const mesh of wrap?.children ?? []) {
    if (!mesh.isInstancedMesh) continue;
    for (let i = 0; i < mesh.count; i += 1) {
      mesh.getMatrixAt(i, m);
      m.decompose(p, q, s);
      const face = faceFor(p.x, p.z);
      if (!face) continue;
      const type = typeOf(mesh.geometry, s);
      if (mesh.instanceColor) mesh.getColorAt(i, c);
      else c.setHex(0xc4a070);
      let f = faces.get(face.id);
      if (!f) {
        f = { id: face.id, gondola: face.gondola, side: face.side, total: 0, left: 0, cleared: false };
        faces.set(face.id, f);
      }
      f.total += 1;
      f.left += 1;
      items.push({
        id: items.length,
        mesh,
        index: i,
        type,
        points: POINTS[type] ?? 1,
        category: face.category,
        face: f,
        x: p.x,
        y: p.y,
        z: p.z,
        rotY: 2 * Math.atan2(q.y, q.w),
        sx: s.x,
        sy: s.y,
        sz: s.z,
        color: c.getHex(),
        matrix: m.clone(),
        taken: false,
      });
    }
  }

  const zero = new THREE.Matrix4().makeScale(0, 0, 0);
  let takenCount = 0;

  function take(item) {
    if (item.taken) return false;
    item.taken = true;
    takenCount += 1;
    item.mesh.setMatrixAt(item.index, zero);
    item.mesh.instanceMatrix.needsUpdate = true;
    const f = item.face;
    f.left -= 1;
    const justCleared = !f.cleared && f.left / f.total < CLEARED_AT;
    if (justCleared) f.cleared = true;
    return justCleared ? 'cleared' : true;
  }

  function restoreAll() {
    const touched = new Set();
    for (const item of items) {
      if (!item.taken) continue;
      item.taken = false;
      item.mesh.setMatrixAt(item.index, item.matrix);
      touched.add(item.mesh);
    }
    for (const mesh of touched) mesh.instanceMatrix.needsUpdate = true;
    for (const f of faces.values()) {
      f.left = f.total;
      f.cleared = false;
    }
    takenCount = 0;
  }

  /** Nearest untaken, reachable prop within `reach` metres (horizontal). */
  function nearest(x, z, reach = REACH) {
    let best = null;
    let bestD = reach * reach;
    for (const it of items) {
      if (it.taken || it.face.cleared || it.y > REACH_Y) continue;
      const dx = it.x - x;
      const dz = it.z - z;
      const d = dx * dx + dz * dz;
      if (d < bestD) {
        bestD = d;
        best = it;
      }
    }
    return best;
  }

  return {
    items,
    faces,
    take,
    restoreAll,
    nearest,
    get takenCount() {
      return takenCount;
    },
  };
}
