import * as THREE from 'three';

/**
 * Dream view: the store as a dollhouse under a fixed high camera.
 * - Ceiling / mall slabs (xray role 'hide') are hidden.
 * - Perimeter and BOH walls (role 'wall') go translucent.
 * - Anything else that sits between the camera and Wisp fades for that frame.
 * - Last call dims the house lights a notch.
 * Vendored store files are not edited; this only touches live materials.
 */
export function createDreamView(storeRoot, camera, wisp) {
  const occluders = [];
  const faded = new Map();
  const lights = [];
  const wallMats = new Set();

  function roleOf(obj) {
    let p = obj;
    while (p) {
      if (p.userData?.xray) return p.userData.xray;
      p = p.parent;
    }
    return 'ghost';
  }

  storeRoot.traverse((obj) => {
    if (obj.isLight && (obj.isHemisphereLight || obj.isDirectionalLight)) {
      lights.push({ light: obj, base: obj.intensity });
      return;
    }
    if (!obj.isMesh || obj.isInstancedMesh) return;
    const role = roleOf(obj);
    if (role === 'hide') {
      obj.visible = false;
      return;
    }
    if (role === 'wall') {
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      for (const mat of mats) if (mat) wallMats.add(mat);
      return;
    }
    if (role === 'floor') return;
    occluders.push(obj);
  });

  for (const mat of wallMats) {
    mat.transparent = true;
    mat.opacity = Math.min(mat.opacity ?? 1, 0.38);
    mat.depthWrite = false;
  }

  const ray = new THREE.Raycaster();
  const from = new THREE.Vector3();
  const to = new THREE.Vector3();
  const dir = new THREE.Vector3();
  let lastHits = new Set();

  function fade(mesh, on) {
    let rec = faded.get(mesh);
    if (on) {
      if (!rec) {
        const orig = mesh.material;
        const ghost = (Array.isArray(orig) ? orig[0] : orig).clone();
        ghost.transparent = true;
        ghost.opacity = 0.22;
        ghost.depthWrite = false;
        rec = { orig, ghost };
        faded.set(mesh, rec);
      }
      mesh.material = rec.ghost;
    } else if (rec) {
      mesh.material = rec.orig;
    }
  }

  function update() {
    from.copy(camera.position);
    to.copy(wisp.position);
    to.y += 0.35;
    dir.subVectors(to, from);
    const dist = dir.length();
    dir.normalize();
    ray.set(from, dir);
    ray.near = 0.1;
    ray.far = Math.max(0.2, dist - 0.45);
    const hits = ray.intersectObjects(occluders, false);
    const now = new Set();
    for (const h of hits) now.add(h.object);
    for (const mesh of lastHits) if (!now.has(mesh)) fade(mesh, false);
    for (const mesh of now) if (!lastHits.has(mesh)) fade(mesh, true);
    lastHits = now;
  }

  function setDim(k) {
    for (const { light, base } of lights) light.intensity = base * k;
  }

  return { update, setDim, occluderCount: occluders.length };
}
