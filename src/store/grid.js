import * as THREE from 'three';
import { PLAN, BOH } from './layout.js';

function labelTexture(text, opts = {}) {
  const w = opts.w ?? 256;
  const h = opts.h ?? 96;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = opts.bg ?? 'rgba(255,254,245,0.88)';
  const r = 18;
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.lineTo(w - r, 0);
  ctx.quadraticCurveTo(w, 0, w, r);
  ctx.lineTo(w, h - r);
  ctx.quadraticCurveTo(w, h, w - r, h);
  ctx.lineTo(r, h);
  ctx.quadraticCurveTo(0, h, 0, h - r);
  ctx.lineTo(0, r);
  ctx.quadraticCurveTo(0, 0, r, 0);
  ctx.fill();
  ctx.fillStyle = opts.fg ?? '#3a2415';
  ctx.font = `700 ${opts.size ?? 44}px "Barlow Condensed", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, w / 2, h / 2 + 2);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function makeLabel(text, w, h, opts) {
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshBasicMaterial({
      map: labelTexture(text, opts),
      transparent: true,
      depthWrite: false,
      toneMapped: false,
      side: THREE.DoubleSide,
    }),
  );
  return mesh;
}

function addDim(group, x0, z0, x1, z1, text, offset, alongX) {
  const dx = x1 - x0;
  const dz = z1 - z0;
  const len = Math.hypot(dx, dz) || 1;
  const nx = (-dz / len) * offset;
  const nz = (dx / len) * offset;
  const ax = x0 + nx;
  const az = z0 + nz;
  const bx = x1 + nx;
  const bz = z1 + nz;
  const pts = new Float32Array([ax, 0.03, az, bx, 0.03, bz]);
  const line = new THREE.Line(
    new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(pts, 3)),
    new THREE.LineBasicMaterial({ color: 0x3a2415, transparent: true, opacity: 0.7 }),
  );
  group.add(line);
  const label = makeLabel(text, Math.min(2.2, Math.max(1.1, len * 0.28)), 0.38, {
    w: 640,
    h: 140,
    size: 72,
    bg: '#ffe14d',
  });
  label.position.set((ax + bx) / 2, 0.05, (az + bz) / 2);
  label.rotation.x = -Math.PI / 2;
  if (!alongX) label.rotation.z = Math.PI / 2;
  group.add(label);
}

export function createFloorGrid() {
  const root = new THREE.Group();
  root.name = 'floor-grid';
  root.userData.xray = 'solid';

  const x0 = -2.5;
  const x1 = 20.5;
  const z0 = -0.6;
  const z1 = 12.0;
  const y = 0.014;

  const positions = [];
  const colors = [];
  const major = new THREE.Color(0x3a2415);
  const minor = new THREE.Color(0x8b7355);

  function pushLine(ax, az, bx, bz, isMajor) {
    positions.push(ax, y, az, bx, y, bz);
    const c = isMajor ? major : minor;
    colors.push(c.r, c.g, c.b, c.r, c.g, c.b);
  }

  for (let x = Math.ceil(x0 * 2) / 2; x <= x1 + 0.001; x += 0.5) {
    const isMajor = Math.abs(x - Math.round(x)) < 0.001;
    pushLine(x, z0, x, z1, isMajor);
  }
  for (let z = Math.ceil(z0 * 2) / 2; z <= z1 + 0.001; z += 0.5) {
    const isMajor = Math.abs(z - Math.round(z)) < 0.001;
    pushLine(x0, z, x1, z, isMajor);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  const lines = new THREE.LineSegments(
    geo,
    new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.42,
      depthWrite: false,
    }),
  );
  root.add(lines);

  for (let x = 0; x <= 20; x += 1) {
    const tag = makeLabel(`${x}`, 0.34, 0.16, { w: 160, h: 80, size: 48 });
    tag.position.set(x, 0.03, -0.38);
    tag.rotation.x = -Math.PI / 2;
    root.add(tag);
  }
  for (let z = 0; z <= 11; z += 1) {
    const tag = makeLabel(`${z}`, 0.34, 0.16, { w: 160, h: 80, size: 48 });
    tag.position.set(-0.42, 0.03, z);
    tag.rotation.x = -Math.PI / 2;
    root.add(tag);
  }

  const axisX = makeLabel('WIDTH  +X east  (m)', 2.4, 0.22, {
    w: 700,
    h: 90,
    size: 40,
    bg: '#ffe14d',
  });
  axisX.position.set(3.2, 0.035, -0.72);
  axisX.rotation.x = -Math.PI / 2;
  root.add(axisX);

  const axisZ = makeLabel('LENGTH  +Z south  (m)', 2.6, 0.22, {
    w: 740,
    h: 90,
    size: 40,
    bg: '#ffe14d',
  });
  axisZ.position.set(-0.78, 0.035, 2.4);
  axisZ.rotation.x = -Math.PI / 2;
  axisZ.rotation.z = Math.PI / 2;
  root.add(axisZ);

  addDim(root, 0, 0, PLAN.width, 0, '19 230', -0.95, true);
  addDim(root, 0, 0, 0, PLAN.depthWest, '7 155', -0.95, false);
  addDim(root, BOH.stock.x0, BOH.stock.z1, BOH.stock.x1, BOH.stock.z1, '8 705', 0.32, true);
  addDim(root, BOH.stock.x0, BOH.stock.z0, BOH.stock.x0, BOH.stock.z1, '3 923', -0.32, false);
  addDim(root, BOH.stock.x1, BOH.stock.z0, BOH.stock.x1, BOH.stock.eastZ1, '2 740', 0.32, false);
  addDim(root, BOH.locker.x0, BOH.locker.z1, BOH.stock.x0, BOH.locker.z1, '4 348', 0.28, true);

  const origin = makeLabel('0,0  NW', 0.7, 0.2, { w: 280, h: 80, size: 42, bg: '#ffe14d' });
  origin.position.set(0.15, 0.04, 0.18);
  origin.rotation.x = -Math.PI / 2;
  root.add(origin);

  return {
    root,
    setVisible(on) {
      root.visible = !!on;
    },
  };
}
