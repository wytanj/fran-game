import * as THREE from 'three';
import { BAY, gondolas, wallBays, STACKS } from './layout.js';

function mm(m) {
  return `${Math.round(m * 1000)}`;
}

function rulerTexture(stack, highlightM) {
  const hPx = 1400;
  const wPx = 220;
  const canvas = document.createElement('canvas');
  canvas.width = wPx;
  canvas.height = hPx;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, wPx, hPx);
  const total = stack.total;
  const yOf = (m) => hPx - (m / total) * hPx;

  ctx.fillStyle = '#3a2415';
  ctx.fillRect(0, 0, wPx, hPx);
  ctx.fillStyle = '#fffef5';
  ctx.fillRect(4, 4, wPx - 8, hPx - 8);

  const bands = ['#fff4a8', '#fae8d4', '#ffe14d', '#fae8d4', '#fff4a8', '#d6f1f9', '#f0c820'];
  stack.parts.forEach((part, i) => {
    const y1 = yOf(part.to);
    const y0 = yOf(part.from);
    ctx.fillStyle = bands[i % bands.length];
    ctx.fillRect(8, y1, 58, Math.max(2, y0 - y1));
    ctx.fillStyle = '#3a2415';
    ctx.fillRect(8, y1, 58, 2);
  });

  ctx.fillStyle = '#3a2415';
  ctx.fillRect(64, 4, 3, hPx - 8);

  ctx.font = '700 26px "DM Sans", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  for (let cm = 0; cm <= total * 100 + 0.01; cm += 10) {
    const y = yOf(cm / 100);
    const major = cm % 20 === 0;
    ctx.fillRect(64, y - 1, major ? 18 : 10, 3);
    if (major) ctx.fillText(`${cm}`, 86, y);
  }

  ctx.font = '700 24px "Barlow Condensed", sans-serif';
  ctx.fillStyle = '#3a2415';
  for (const part of stack.parts) {
    const mid = yOf((part.from + part.to) / 2);
    ctx.fillText(part.label, 128, mid);
  }

  if (highlightM != null && highlightM >= 0) {
    const y = yOf(Math.min(highlightM, total));
    ctx.fillStyle = '#3a2415';
    ctx.fillRect(0, y - 3, wPx, 6);
    ctx.fillStyle = '#ffe14d';
    ctx.fillRect(0, y - 2, wPx, 4);
    ctx.font = '700 22px "Barlow Condensed", sans-serif';
    ctx.fillStyle = '#3a2415';
    ctx.fillText(`${Math.round(highlightM * 100)} cm`, 8, Math.max(18, y - 16));
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function makeBoard(stack) {
  const group = new THREE.Group();
  const w = 0.36;
  const h = stack.total;
  const geo = new THREE.PlaneGeometry(w, h);
  const mat = new THREE.MeshBasicMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = h / 2;
  group.add(mesh);
  group.userData.mesh = mesh;
  group.userData.stack = stack;
  return group;
}

export function createRulers(scene) {
  const root = new THREE.Group();
  root.name = 'rulers';
  root.visible = false;
  scene.add(root);

  const boards = [];

  const rings = [];
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0xffe14d,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
  });

  for (const g of gondolas) {
    const east = makeBoard(STACKS.gondola);
    east.position.set(g.x + g.w / 2 + 0.06, 0, g.z);
    east.rotation.y = -Math.PI / 2;
    root.add(east);
    boards.push(east);

    const south = makeBoard(STACKS.gondola);
    south.position.set(g.x, 0, g.z + BAY.gondolaD / 2 + 0.06);
    south.rotation.y = 0;
    root.add(south);
    boards.push(south);

    const ring = new THREE.Mesh(new THREE.BoxGeometry(g.w + 0.06, 0.018, BAY.gondolaD + 0.06), ringMat);
    ring.position.set(g.x, 1.65, g.z);
    root.add(ring);
    rings.push(ring);
  }

  for (const b of wallBays) {
    const board = makeBoard(STACKS.wallbay);
    const alongX = b.facing === 'n' || b.facing === 's';
    if (b.facing === 'e') {
      board.position.set(b.x + BAY.wallD / 2 + 0.04, 0, b.z);
      board.rotation.y = -Math.PI / 2;
    } else if (b.facing === 'w') {
      board.position.set(b.x - BAY.wallD / 2 - 0.04, 0, b.z);
      board.rotation.y = Math.PI / 2;
    } else {
      const yaw = b.facing === 's' ? 0 : Math.PI;
      const aisle = b.facing === 's' ? 1 : -1;
      board.position.set(b.x + BAY.wallW / 2 + 0.04, 0, b.z + aisle * (BAY.wallD / 2 + 0.04));
      board.rotation.y = yaw;
    }
    board.userData.kind = 'wallbay';
    root.add(board);
    boards.push(board);

    const rw = alongX ? BAY.wallW + 0.04 : BAY.wallD + 0.04;
    const rd = alongX ? BAY.wallD + 0.04 : BAY.wallW + 0.04;
    const ring = new THREE.Mesh(new THREE.BoxGeometry(rw, 0.016, rd), ringMat);
    ring.position.set(b.x, 1.65, b.z);
    root.add(ring);
    rings.push(ring);
  }

  let highlightM = 1.65;

  function paint() {
    for (const board of boards) {
      const old = board.userData.mesh.material.map;
      board.userData.mesh.material.map = rulerTexture(board.userData.stack, highlightM);
      board.userData.mesh.material.needsUpdate = true;
      old?.dispose();
    }
  }

  paint();

  return {
    root,
    setVisible(on) {
      root.visible = !!on;
    },
    setHighlightCm(cm) {
      highlightM = Math.max(0, cm) / 100;
      for (const ring of rings) ring.position.y = Math.max(0.01, highlightM);
      if (root.visible) paint();
    },
  };
}

void mm;
