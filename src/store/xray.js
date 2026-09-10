/**
 * Plan-mode "maphack": ghost furniture so structural columns and walls read
 * like PL-01, instead of being buried under bay tops and shelves.
 */
export function createXray(roots) {
  const matState = new Map();
  const meshState = [];
  let collected = false;
  let on = false;

  function roleOf(obj) {
    let p = obj;
    while (p) {
      if (p.userData?.xray) return p.userData.xray;
      p = p.parent;
    }
    const n = `${obj.name || ''}`.toLowerCase();
    if (n.includes('column') || n.includes('pillar')) return 'solid';
    if (n.includes('ceiling') || n.includes('barrisol') || n.includes('exposed')) return 'hide';
    if (n.includes('floor')) return 'floor';
    return 'ghost';
  }

  function saveMat(mat) {
    if (!mat || matState.has(mat)) return;
    matState.set(mat, {
      transparent: mat.transparent,
      opacity: mat.opacity ?? 1,
      depthWrite: mat.depthWrite !== false,
    });
  }

  function collect() {
    matState.clear();
    meshState.length = 0;
    for (const root of roots) {
      if (!root) continue;
      root.traverse((obj) => {
        if (!obj.isMesh && !obj.isInstancedMesh && !obj.isPoints) return;
        const role = roleOf(obj);
        meshState.push({ obj, role, visible: obj.visible });
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        for (const mat of mats) saveMat(mat);
      });
    }
    collected = true;
  }

  function paintMat(mat, role) {
    const orig = matState.get(mat);
    if (!orig || !mat) return;
    if (role === 'solid' || role === 'floor') {
      mat.transparent = orig.transparent;
      mat.opacity = orig.opacity;
      mat.depthWrite = orig.depthWrite;
      return;
    }
    if (role === 'wall') {
      mat.transparent = true;
      mat.opacity = Math.min(orig.opacity, 0.5);
      mat.depthWrite = true;
      return;
    }
    mat.transparent = true;
    mat.opacity = 0.16;
    mat.depthWrite = false;
  }

  function apply(enabled) {
    if (!collected) collect();
    on = !!enabled;
    const rank = { hide: 0, ghost: 1, wall: 2, floor: 3, solid: 4 };
    const matRole = new Map();
    for (const rec of meshState) {
      if (!on) {
        rec.obj.visible = rec.visible;
        continue;
      }
      if (rec.role === 'hide') {
        rec.obj.visible = false;
        continue;
      }
      rec.obj.visible = rec.visible;
      const mats = Array.isArray(rec.obj.material) ? rec.obj.material : [rec.obj.material];
      for (const mat of mats) {
        if (!mat) continue;
        const prev = matRole.get(mat);
        if (!prev || rank[rec.role] > rank[prev]) matRole.set(mat, rec.role);
      }
    }
    if (!on) {
      for (const [mat, orig] of matState) {
        mat.transparent = orig.transparent;
        mat.opacity = orig.opacity;
        mat.depthWrite = orig.depthWrite;
      }
      return;
    }
    for (const [mat, role] of matRole) paintMat(mat, role);
  }

  return {
    setEnabled(enabled) {
      apply(enabled);
    },
    refresh() {
      collected = false;
      if (on) apply(true);
    },
    get enabled() {
      return on;
    },
  };
}
