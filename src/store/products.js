import * as THREE from 'three';

const PALETTES = {
  makeup: [0x1a1a1a, 0x8b1e3f, 0xf2d2ae, 0xffe14d, 0xc43a3a, 0x3a2415, 0xf4b8c5],
  hair: [0x1c3d4a, 0x5bbfe0, 0xf5f1e6, 0x2a2a2a, 0xc4a070],
  skincare: [0xf7f4ec, 0xe8d5c4, 0xd9c4a8, 0x3a2415, 0x8fbfa5, 0xffffff],
  suncare: [0xffe14d, 0xfff4a8, 0xf7f4ec, 0xf2d2ae, 0x5bbfe0],
  serum: [0xc47a3a, 0xf3ead8, 0x5c4030, 0xd6b089, 0xffffff],
  cleanser: [0xe8f4f2, 0xffffff, 0xf4c6d0, 0x9ad0c2, 0x3a2415],
  mask: [0x7fb36b, 0xc5e0a5, 0xf7f4ec, 0xf4c6d0, 0x5bbfe0],
  theme: [0xffe14d, 0x3a2415, 0xf2d2ae, 0x5bbfe0, 0xffffff],
};

function mulberry(seed) {
  let t = seed + 0x6d2b79f5;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function createStocker() {
  const items = [];

  function add(type, x, y, z, rotY, sx, sy, sz, color) {
    items.push({ type, x, y, z, rotY, sx, sy, sz, color });
  }

  function fillShelf({
    origin,
    width,
    depth = 0.22,
    y,
    category = 'skincare',
    facing = 0,
    density = 1,
  }) {
    const pal = PALETTES[category] || PALETTES.skincare;
    const seed = Math.floor((origin.x + origin.z + y) * 1000);
    let cursor = -width / 2 + 0.04;
    let i = 0;
    while (cursor < width / 2 - 0.05) {
      const r = mulberry(seed + i * 17);
      const kindRoll = mulberry(seed + i * 31);
      const color = pal[Math.floor(r * pal.length)];
      const row = ((i % 2) - 0.5) * depth * 0.35;
      let type = 'bottle';
      let sx = 0.038;
      let sy = 0.09 + r * 0.05;
      let sz = 0.038;
      let step = 0.05;
      if (category === 'mask' || kindRoll < 0.22) {
        type = 'box';
        sx = 0.055;
        sy = 0.08;
        sz = 0.04;
        step = 0.062;
      } else if (category === 'makeup' && kindRoll < 0.55) {
        type = 'compact';
        sx = 0.045;
        sy = 0.018;
        sz = 0.045;
        step = 0.052;
      } else if (kindRoll > 0.72) {
        type = 'tube';
        sx = 0.028;
        sy = 0.1;
        sz = 0.022;
        step = 0.04;
      }
      step /= density;
      const localX = cursor + sx;
      const localZ = row;
      const c = Math.cos(facing);
      const s = Math.sin(facing);
      const wx = origin.x + localX * c - localZ * s;
      const wz = origin.z + localX * s + localZ * c;
      add(type, wx, y + sy / 2, wz, facing, sx, sy, sz, color);
      cursor += step;
      i += 1;
    }
  }

  function fillMaskGrid(origin, width, height, facing) {
    const cols = 18;
    const rows = 9;
    const cellW = width / cols;
    const cellH = height / rows;
    const pal = PALETTES.mask;
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const r = mulberry(row * 97 + col * 13);
        const color = pal[Math.floor(r * pal.length)];
        const localX = -width / 2 + cellW * (col + 0.5);
        const y = 0.42 + cellH * (row + 0.5);
        const localZ = 0.03;
        const c = Math.cos(facing);
        const s = Math.sin(facing);
        add(
          'packet',
          origin.x + localX * c - localZ * s,
          y,
          origin.z + localX * s + localZ * c,
          facing,
          cellW * 0.86,
          cellH * 0.82,
          0.012,
          color,
        );
      }
    }
  }

  function build(scene) {
    const geos = {
      bottle: new THREE.CylinderGeometry(1, 1, 1, 10),
      box: new THREE.BoxGeometry(1, 1, 1),
      tube: new THREE.CapsuleGeometry(0.5, 1.2, 4, 8),
      compact: new THREE.CylinderGeometry(1, 1, 1, 14),
      packet: new THREE.BoxGeometry(1, 1, 1),
    };
    const mat = new THREE.MeshStandardMaterial({
      roughness: 0.38,
      metalness: 0.08,
    });
    const groups = { bottle: [], box: [], tube: [], compact: [], packet: [] };
    for (const item of items) groups[item.type].push(item);

    const wrap = new THREE.Group();
    wrap.name = 'products';
    wrap.userData.xray = 'ghost';
    const meshes = [];
    for (const [type, list] of Object.entries(groups)) {
      if (!list.length) continue;
      const mesh = new THREE.InstancedMesh(geos[type], mat, list.length);
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      mesh.castShadow = true;
      const dummy = new THREE.Object3D();
      const color = new THREE.Color();
      for (let i = 0; i < list.length; i += 1) {
        const it = list[i];
        dummy.position.set(it.x, it.y, it.z);
        dummy.rotation.set(0, it.rotY, 0);
        dummy.scale.set(it.sx, it.sy, it.sz);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
        color.setHex(it.color);
        mesh.setColorAt(i, color);
      }
      mesh.instanceColor.needsUpdate = true;
      wrap.add(mesh);
      meshes.push(mesh);
    }
    scene.add(wrap);
    return meshes;
  }

  return { fillShelf, fillMaskGrid, build, get count() { return items.length; } };
}
