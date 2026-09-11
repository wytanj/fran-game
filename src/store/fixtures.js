import * as THREE from 'three';
import { categories } from '../brand.js';
import { BAY, PLAN } from './layout.js';
import { fasciaTexture, graffitiTexture, headerTexture, hoseTexture, logoStripTexture } from './labels.js';

const tmpMat = new THREE.Matrix4();

export function box(mat, w, h, d, x, y, z, parent, shadow = true) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  mesh.position.set(x, y, z);
  mesh.castShadow = shadow;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

export function makeWallBay(mats, spec, stocker) {
  const group = new THREE.Group();
  group.userData.xray = 'ghost';
  const facing = spec.facing === 's' ? 0 : spec.facing === 'n' ? Math.PI : spec.facing === 'e' ? -Math.PI / 2 : Math.PI / 2;
  group.position.set(spec.x, 0, spec.z);
  group.rotation.y = facing;

  const w = BAY.wallW;
  const d = BAY.wallD;
  const drawerH = BAY.drawerH;
  const logoH = BAY.logoH;
  const headH = BAY.headerH;
  const total = BAY.wallH;
  const cat = categories[spec.category] ?? categories.skincare;
  const isWBM = spec.variant === 'WB-M';

  box(isWBM ? mats.blush : mats.drawer, w, drawerH, d, 0, drawerH / 2, 0, group, false);
  box(mats.wallBay, w, total - drawerH, 0.03, 0, drawerH + (total - drawerH) / 2, -d / 2 + 0.02, group);
  box(mats.wallBay, 0.03, total - drawerH, d, -w / 2 + 0.015, drawerH + (total - drawerH) / 2, 0, group);
  box(mats.wallBay, 0.03, total - drawerH, d, w / 2 - 0.015, drawerH + (total - drawerH) / 2, 0, group);

  const shelfYs = [0.5, 0.81, 1.12, 1.43];
  for (const y of shelfYs) {
    box(mats.shelf, w - 0.06, 0.022, d - 0.06, 0, y, 0.01, group, false);
    stocker.fillShelf({
      origin: {
        x: spec.x + Math.sin(facing) * 0.08,
        z: spec.z + Math.cos(facing) * 0.08,
      },
      width: w - 0.12,
      y,
      category: spec.category,
      facing,
      density: 0.95,
    });
  }

  const lightY = 1.71 + headH / 2; // STACKS.wallbay lightbox from
  box(mats.canopy, w - 0.04, headH, 0.04, 0, lightY, d / 2 - 0.02, group, false);
  const lightFace = new THREE.Mesh(
    new THREE.PlaneGeometry(w - 0.08, headH - 0.06),
    new THREE.MeshBasicMaterial({ map: headerTexture(cat.label, { bg: isWBM ? '#f6cdd6' : '#fff4a8', fg: '#3a2415' }), toneMapped: false }),
  );
  lightFace.position.set(0, lightY, d / 2 + 0.005);
  group.add(lightFace);

  const ledY = 2.24 + logoH / 2;
  box(mats.header, w, logoH, d - 0.04, 0, ledY, 0, group, false);
  const logoFace = new THREE.Mesh(
    new THREE.PlaneGeometry(w - 0.04, logoH - 0.03),
    new THREE.MeshBasicMaterial({ map: logoStripTexture(spec.brands ?? ['fran']), toneMapped: false }),
  );
  logoFace.position.set(0, ledY, d / 2 + 0.004);
  group.add(logoFace);

  group.userData.fixture = spec;
  return group;
}

export function makeGondola(mats, spec, stocker) {
  const group = new THREE.Group();
  group.userData.xray = 'ghost';
  group.position.set(spec.x, 0, spec.z);
  const w = spec.w;
  const d = BAY.gondolaD;
  const h = BAY.gondolaH;
  const end = BAY.endcap;
  const ends = spec.ends ?? { w: 'EC-S3', e: 'EC-S3' };
  const endW = (type) => (type === 'lightbox' ? BAY.lightboxW : end);
  const spineMat = spec.makeup ? mats.blush : mats.gondola;

  box(mats.gondolaDark, w, 0.1, d, 0, 0.05, 0, group);

  // Runs between the two end modules; the pair can be asymmetric.
  const wWest = endW(ends.w);
  const wEast = endW(ends.e);
  const inner = w - wWest - wEast;
  const innerCx = (wWest - wEast) / 2;
  box(spineMat, 0.04, h - 0.1, d - 0.08, innerCx, h / 2 + 0.05, 0, group);
  const bayCount = spec.bays;
  for (let b = 1; b < bayCount; b += 1) {
    const x = innerCx - inner / 2 + (inner / bayCount) * b;
    box(mats.gondolaDark, 0.02, h - 0.12, d - 0.1, x, h / 2 + 0.04, 0, group, false);
  }

  const shelfYs = spec.shelves === 5 ? [0.32, 0.58, 0.84, 1.1, 1.36] : [0.36, 0.64, 0.92, 1.2];
  for (const y of shelfYs) {
    box(mats.shelf, inner - 0.04, 0.02, d - 0.06, innerCx, y, 0, group, false);
    for (const side of [-1, 1]) {
      const face = side === 1 ? 0 : Math.PI;
      stocker.fillShelf({
        origin: { x: spec.x + innerCx, z: spec.z + side * (d / 2 - 0.14) },
        width: inner - 0.1,
        y,
        category: spec.category,
        facing: face,
        density: 1.05,
      });
    }
  }

  // End modules face the east–west aisle. Rev 18/08 types:
  // EC-S3 (3 shelves + L-panel + hygiene) · EC-S5 (5 shelves + frost panel)
  // EC-M (makeup, 4 shelves) · lightbox (illuminated tower).
  for (const dir of [-1, 1]) {
    const type = dir < 0 ? ends.w : ends.e;

    if (type === 'lightbox') {
      const lw = BAY.lightboxW;
      const x = dir * (w / 2 - lw / 2);
      box(mats.gondolaDark, lw, 0.12, d, x, 0.06, 0, group);
      box(mats.lightbox, lw - 0.02, 1.78, d - 0.04, x, 0.12 + 0.89, 0, group, false);
      box(mats.gondolaDark, lw, 0.06, d, x, 2.03, 0, group, false);
      const glow = new THREE.PointLight(0xfff0b8, 1.4, 3.5, 1.8);
      glow.position.set(x, 1.4, 0);
      group.add(glow);
      continue;
    }

    const x = dir * (w / 2 - end / 2);
    box(mats.gondolaDark, end, 0.1, d, x, 0.05, 0, group);
    box(mats.gondola, 0.03, h - 0.1, d - 0.04, x - dir * (end / 2 - 0.02), h / 2 + 0.05, 0, group);
    box(mats.gondola, end, h - 0.1, 0.03, x, h / 2 + 0.05, d / 2 - 0.015, group);
    box(mats.gondola, end, h - 0.1, 0.03, x, h / 2 + 0.05, -d / 2 + 0.015, group);
    box(type === 'EC-M' ? mats.blush : mats.gondola, end, 0.03, d, x, h - 0.02, 0, group, false);

    const levels =
      type === 'EC-S5' ? [0.3, 0.56, 0.82, 1.08, 1.34]
      : type === 'EC-S3' ? [0.45, 0.85, 1.25]
      : [0.36, 0.64, 0.92, 1.2];
    const face = dir > 0 ? Math.PI / 2 : -Math.PI / 2;
    const outward = spec.x + dir * (w / 2 - 0.05);
    for (const y of levels) {
      box(mats.shelf, end - 0.05, 0.018, d - 0.08, x, y, 0, group, false);
      stocker.fillShelf({
        origin: { x: outward, z: spec.z },
        width: d - 0.14,
        depth: 0.16,
        y,
        category: spec.category,
        facing: face,
        density: 1.15,
      });
    }

    if (type === 'EC-S3') {
      // L-shape side panel wrapping the outer corner, hygiene unit mounted on it.
      const px = x + dir * (end / 2 - 0.015);
      box(mats.gondola, 0.03, h + 0.15, d, px, (h + 0.15) / 2, 0, group);
      box(mats.gondola, 0.45, h + 0.15, 0.03, x + dir * (end / 2 - 0.225), (h + 0.15) / 2, -d / 2 + 0.015, group);
      box(mats.hygiene, 0.06, 0.34, 0.22, px + dir * 0.045, 1.12, 0, group, false);
      box(mats.shelf, 0.12, 0.018, 0.26, px + dir * 0.07, 0.92, 0, group, false);
    } else if (type === 'EC-S5') {
      // White transparent side panel.
      const glass = new THREE.Mesh(
        new THREE.BoxGeometry(0.02, h - 0.08, d - 0.04),
        mats.panelFrost,
      );
      glass.position.set(x + dir * (end / 2 - 0.01), h / 2 + 0.03, 0);
      group.add(glass);
    } else if (type === 'EC-M') {
      box(mats.blush, 0.03, h - 0.08, d - 0.04, x + dir * (end / 2 - 0.015), h / 2 + 0.03, 0, group);
    }
  }

  const logoY = h - BAY.gondolaLogo / 2;
  box(spec.makeup ? mats.blush : mats.header, w, BAY.gondolaLogo, 0.04, 0, logoY, d / 2 + 0.01, group, false);
  const logoFace = new THREE.Mesh(
    new THREE.PlaneGeometry(w - 0.08, BAY.gondolaLogo - 0.04),
    new THREE.MeshBasicMaterial({ map: logoStripTexture(spec.brands ?? ['fran']), toneMapped: false }),
  );
  logoFace.position.set(0, logoY, d / 2 + 0.032);
  group.add(logoFace);
  const logoBack = logoFace.clone();
  logoBack.position.z = -d / 2 - 0.032;
  logoBack.rotation.y = Math.PI;
  group.add(logoBack);

  group.userData.fixture = spec;
  return group;
}

/** Wallbay hygiene station (rev 18/08) — slim sanitiser / tester point. */
export function makeHygieneStation(mats, spec) {
  const group = new THREE.Group();
  group.userData.xray = 'ghost';
  const facing = spec.facing === 's' ? 0 : Math.PI;
  group.position.set(spec.x, 0, spec.z);
  group.rotation.y = facing;
  const w = spec.w;
  const d = 0.38;

  box(mats.gondola, w, 0.9, d, 0, 0.45, 0, group);
  box(mats.hygiene, w, 0.05, d + 0.02, 0, 0.925, 0, group, false);
  box(mats.gondola, w, 1.5, 0.05, 0, 0.75 + 0.9, -d / 2 + 0.025, group);
  const mirror = new THREE.Mesh(
    new THREE.PlaneGeometry(w - 0.05, 0.62),
    mats.steel,
  );
  mirror.position.set(0, 1.45, -d / 2 + 0.055);
  group.add(mirror);
  box(mats.hygiene, 0.07, 0.16, 0.07, 0.03, 1.03, 0.02, group, false);
  box(mats.black, 0.09, 0.05, 0.09, -0.05, 0.975, 0.05, group, false);

  group.userData.fixture = spec;
  return group;
}

export function makeCashier(mats, spec) {
  const group = new THREE.Group();
  group.userData.xray = 'ghost';
  box(mats.counter, spec.w, spec.h, spec.d, spec.x, spec.h / 2, spec.z, group);
  box(mats.counterGlow, spec.w - 0.08, 0.08, spec.d + 0.02, spec.x, 0.12, spec.z, group, false);
  box(mats.black, 0.42, 0.04, 0.28, spec.x + 0.35, spec.h + 0.03, spec.z, group, false);

  const g = spec.graffiti;
  const wall = box(mats.wall, g.w, g.h, g.d, g.x, g.h / 2, g.z, group, false);
  const art = new THREE.Mesh(
    new THREE.PlaneGeometry(g.d - 0.1, g.h - 0.2),
    new THREE.MeshStandardMaterial({ map: graffitiTexture(), roughness: 0.85 }),
  );
  art.position.set(g.x + 0.03, g.h / 2, g.z);
  art.rotation.y = Math.PI / 2;
  group.add(art);

  const c = spec.canopy;
  const canopy = new THREE.Mesh(new THREE.BoxGeometry(c.w, 0.08, c.d), mats.canopy);
  canopy.position.set(c.x, c.y, c.z);
  canopy.rotation.z = -0.12;
  canopy.castShadow = true;
  group.add(canopy);

  // Soft fill under the canopy.
  const lamp = new THREE.PointLight(0xffe14d, 4.2, 6.5, 1.6);
  lamp.position.set(c.x, c.y - 0.15, c.z);
  group.add(lamp);

  group.userData.fixture = {
    name: 'Cash wrap',
    category: 'service',
    concept: 'Yellow canopy + graffiti brand wall',
    brands: ['fran'],
    vm: ['Canopy', 'Graffiti wall'],
  };
  return group;
}

export function makeExperience(mats, spec, stocker) {
  const group = new THREE.Group();
  group.userData.xray = 'ghost';

  const round = new THREE.Mesh(
    new THREE.CylinderGeometry(spec.round.r, spec.round.r, spec.round.h, 36),
    mats.wallBay,
  );
  round.position.set(spec.round.x, spec.round.h / 2, spec.round.z);
  round.castShadow = true;
  round.receiveShadow = true;
  group.add(round);
  const inset = new THREE.Mesh(
    new THREE.CylinderGeometry(spec.round.r - 0.18, spec.round.r - 0.18, 0.08, 32),
    mats.drawer,
  );
  inset.position.set(spec.round.x, spec.round.h + 0.02, spec.round.z);
  group.add(inset);
  stocker.fillShelf({
    origin: { x: spec.round.x, z: spec.round.z },
    width: spec.round.r * 1.2,
    y: spec.round.h + 0.04,
    category: 'theme',
    facing: 0,
    density: 0.55,
  });

  box(mats.wallBay, spec.table.w, spec.table.h, spec.table.d, spec.table.x, spec.table.h / 2, spec.table.z, group);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(spec.discLight.r, 0.09, 12, 48),
    mats.barrisol,
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.set(spec.discLight.x, spec.discLight.y, spec.discLight.z);
  group.add(ring);
  const disc = new THREE.Mesh(
    new THREE.CircleGeometry(spec.discLight.r - 0.08, 48),
    mats.barrisol,
  );
  disc.rotation.x = -Math.PI / 2;
  disc.position.set(spec.discLight.x, spec.discLight.y - 0.04, spec.discLight.z);
  group.add(disc);
  const discLight = new THREE.PointLight(0xfff4c2, 7, 8, 1.4);
  discLight.position.set(spec.discLight.x, spec.discLight.y - 0.2, spec.discLight.z);
  group.add(discLight);

  // Mask wall on the angled mascot wall.
  const mw = spec.maskWall;
  const mask = new THREE.Group();
  mask.position.set(mw.x, 0, mw.z);
  mask.rotation.y = mw.rot;
  box(mats.wall, 4.0, PLAN.ceiling, 0.12, 0, PLAN.ceiling / 2, -0.08, mask, false);
  box(mats.wallBay, 3.16, 2.0, 0.08, -0.35, 1.4, 0.02, mask);
  box(mats.wallBay, 0.99, 2.0, 0.08, 1.45, 1.4, 0.02, mask);
  const head = new THREE.Mesh(
    new THREE.PlaneGeometry(3.16, 0.28),
    new THREE.MeshBasicMaterial({ map: headerTexture('masks'), toneMapped: false }),
  );
  head.position.set(-0.35, 2.55, 0.08);
  mask.add(head);
  const head2 = new THREE.Mesh(
    new THREE.PlaneGeometry(0.99, 0.28),
    new THREE.MeshBasicMaterial({ map: headerTexture('masks', { w: 512 }), toneMapped: false }),
  );
  head2.position.set(1.45, 2.55, 0.08);
  mask.add(head2);
  const cols = 18;
  const rows = 9;
  const gridW = 3.05;
  const gridH = 1.85;
  const cellW = gridW / cols;
  const cellH = gridH / rows;
  const maskColors = [0x7fb36b, 0xc5e0a5, 0xf7f4ec, 0xf4c6d0, 0x5bbfe0];
  const pktGeo = new THREE.BoxGeometry(cellW * 0.86, cellH * 0.82, 0.016);
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const color = maskColors[(row * 3 + col) % maskColors.length];
      const pkt = new THREE.Mesh(
        pktGeo,
        new THREE.MeshStandardMaterial({ color, roughness: 0.55 }),
      );
      pkt.position.set(-0.35 - gridW / 2 + cellW * (col + 0.5), 0.48 + cellH * (row + 0.5), 0.07);
      mask.add(pkt);
    }
  }
  mask.userData.fixture = mw;
  group.add(mask);

  return group;
}

export function makeEntrance(mats, spec) {
  const group = new THREE.Group();
  group.name = 'entrance';
  group.userData.xray = 'ghost';
  const opening = spec.z1 - spec.z0;
  const mid = (spec.z0 + spec.z1) / 2;
  const H = PLAN.ceiling;
  const rec = spec.recess;
  const outerX = spec.x + rec;

  box(mats.fascia, rec + 0.18, spec.fasciaH, opening + 0.55, spec.x + rec / 2 + 0.04, H + spec.fasciaH / 2 - 0.12, mid, group, false);

  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(2.5, 0.72),
    new THREE.MeshBasicMaterial({ map: fasciaTexture(), toneMapped: false }),
  );
  sign.position.set(outerX + 0.1, H + 0.38, mid);
  sign.rotation.y = Math.PI / 2;
  group.add(sign);

  box(mats.steel, 0.06, H + 0.08, 0.12, spec.x, (H + 0.08) / 2, spec.z0, group, false);
  box(mats.steel, 0.06, H + 0.08, 0.12, spec.x, (H + 0.08) / 2, spec.z1, group, false);
  box(mats.steel, 0.06, H + 0.08, 0.1, outerX, (H + 0.08) / 2, spec.z0, group, false);
  box(mats.steel, 0.06, H + 0.08, 0.1, outerX, (H + 0.08) / 2, spec.z1, group, false);
  box(mats.steel, rec + 0.08, 0.06, 0.08, spec.x + rec / 2, H - 0.02, spec.z0, group, false);
  box(mats.steel, rec + 0.08, 0.06, 0.08, spec.x + rec / 2, H - 0.02, spec.z1, group, false);

  const soffit = box(mats.portalSoffit, rec + 0.04, 0.05, opening - 0.08, spec.x + rec / 2, H - 0.06, mid, group, false);
  void soffit;
  const lamp = new THREE.RectAreaLight(0xfff1c0, 6.5, opening - 0.2, rec);
  lamp.position.set(spec.x + rec / 2, H - 0.1, mid);
  lamp.rotation.x = -Math.PI / 2;
  group.add(lamp);
  const wash = new THREE.PointLight(0xfff3cc, 4.2, 7.5, 1.5);
  wash.position.set(spec.x + rec * 0.45, 2.35, mid);
  group.add(wash);

  const northGlass = new THREE.Mesh(new THREE.PlaneGeometry(rec, H - 0.14), mats.portalGlass);
  northGlass.position.set(spec.x + rec / 2, (H - 0.14) / 2, spec.z0 + 0.03);
  group.add(northGlass);
  const southGlass = northGlass.clone();
  southGlass.position.z = spec.z1 - 0.03;
  group.add(southGlass);

  const transom = new THREE.Mesh(new THREE.PlaneGeometry(opening - 0.16, 0.42), mats.portalGlass);
  transom.position.set(spec.x + 0.03, H - 0.32, mid);
  transom.rotation.y = Math.PI / 2;
  group.add(transom);

  const leafW = 0.52;
  const leafH = H - 0.22;
  for (const side of [-1, 1]) {
    const jamb = side < 0 ? spec.z0 + 0.08 : spec.z1 - 0.08;
    for (let i = 0; i < 2; i += 1) {
      const leaf = new THREE.Mesh(new THREE.BoxGeometry(0.03, leafH, leafW), mats.portalGlass);
      const fold = side * (0.38 + i * 0.22);
      leaf.position.set(spec.x + 0.16 + i * 0.12, leafH / 2, jamb + fold);
      leaf.rotation.y = side * (0.55 + i * 0.18);
      group.add(leaf);
      box(mats.steel, 0.025, leafH, 0.025, leaf.position.x, leafH / 2, leaf.position.z - leafW * 0.42 * Math.cos(leaf.rotation.y), group, false);
    }
  }

  const runner = new THREE.Mesh(new THREE.PlaneGeometry(rec + 0.35, opening - 0.12), mats.portalFloor);
  runner.rotation.x = -Math.PI / 2;
  runner.position.set(spec.x + rec / 2 + 0.04, 0.008, mid);
  runner.receiveShadow = true;
  group.add(runner);
  const strip = new THREE.Mesh(
    new THREE.PlaneGeometry(0.08, opening - 0.16),
    new THREE.MeshBasicMaterial({ color: 0xffe14d, toneMapped: false }),
  );
  strip.rotation.x = -Math.PI / 2;
  strip.position.set(spec.x + 0.02, 0.012, mid);
  group.add(strip);

  const hose = new THREE.Mesh(
    new THREE.PlaneGeometry(spec.hose.w, spec.hose.h),
    new THREE.MeshBasicMaterial({ map: hoseTexture(), toneMapped: false }),
  );
  hose.position.set(spec.hose.x, spec.hose.h / 2 + 0.25, spec.hose.z);
  hose.rotation.y = Math.PI / 2;
  group.add(hose);

  return group;
}

export function makeColumn(mats, spec) {
  const group = new THREE.Group();
  group.name = `column-${spec.id || 'x'}`;
  group.userData.xray = 'solid';
  group.userData.column = spec;

  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(spec.r, spec.r, PLAN.ceiling, 28),
    mats.column,
  );
  mesh.position.set(spec.x, PLAN.ceiling / 2, spec.z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.renderOrder = 6;
  group.add(mesh);

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(spec.r * 0.88, spec.r + 0.05, 36),
    new THREE.MeshBasicMaterial({ color: 0x3a2415, side: THREE.DoubleSide }),
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(spec.x, 0.018, spec.z);
  ring.renderOrder = 4;
  group.add(ring);

  const cap = new THREE.Mesh(
    new THREE.CircleGeometry(spec.r, 28),
    new THREE.MeshBasicMaterial({ color: 0x3f3f3f, side: THREE.DoubleSide }),
  );
  cap.rotation.x = -Math.PI / 2;
  cap.position.set(spec.x, PLAN.ceiling + 0.03, spec.z);
  cap.renderOrder = 7;
  group.add(cap);

  const capRing = new THREE.Mesh(
    new THREE.RingGeometry(spec.r * 0.82, spec.r + 0.03, 36),
    new THREE.MeshBasicMaterial({ color: 0x1a1a1a, side: THREE.DoubleSide }),
  );
  capRing.rotation.x = -Math.PI / 2;
  capRing.position.set(spec.x, PLAN.ceiling + 0.035, spec.z);
  capRing.renderOrder = 8;
  group.add(capRing);

  return group;
}

export function makeQueue(mats, spec) {
  const group = new THREE.Group();
  group.userData.xray = 'ghost';
  box(mats.counter, spec.w, spec.h, spec.d, spec.x, spec.h / 2, spec.z, group);
  return group;
}

export function makeDesk(mats, spec) {
  const group = new THREE.Group();
  group.userData.xray = 'ghost';
  box(mats.counter, spec.w, spec.h, spec.d, spec.x, spec.h / 2, spec.z, group);
  box(mats.black, spec.w - 0.08, 0.03, spec.d - 0.08, spec.x, spec.h + 0.02, spec.z, group, false);
  const chairX = spec.id === 'manager-desk' ? spec.x + 0.15 : spec.x + spec.w / 2 + 0.22;
  const chairZ = spec.id === 'manager-desk' ? spec.z - spec.d / 2 - 0.22 : spec.z;
  box(mats.gondolaDark, 0.38, 0.46, 0.38, chairX, 0.23, chairZ, group);
  box(mats.gondolaDark, 0.34, 0.32, 0.05, chairX, 0.62, chairZ + 0.12, group, false);
  const plate = new THREE.Mesh(
    new THREE.PlaneGeometry(Math.min(spec.w, 0.9), 0.16),
    new THREE.MeshBasicMaterial({
      map: headerTexture(spec.name, { bg: '#3a2415', fg: '#ffe14d', w: 700, size: 70 }),
      toneMapped: false,
    }),
  );
  plate.position.set(spec.x, spec.h + 0.12, spec.z);
  plate.rotation.x = -0.55;
  group.add(plate);
  group.userData.fixture = spec;
  return group;
}

export function makeReceiving(mats, spec) {
  const group = new THREE.Group();
  group.userData.xray = 'ghost';
  const decal = new THREE.Mesh(
    new THREE.PlaneGeometry(spec.w, spec.d),
    new THREE.MeshBasicMaterial({
      map: headerTexture('RECEIVING', { bg: '#cfc8bb', fg: '#3a2415', w: 700, h: 700, size: 88 }),
      transparent: true,
      opacity: 0.92,
      toneMapped: false,
    }),
  );
  decal.rotation.x = -Math.PI / 2;
  decal.position.set(spec.x, 0.012, spec.z);
  group.add(decal);
  box(mats.steel, 0.08, 0.9, spec.d, spec.x - spec.w / 2 + 0.06, 0.45, spec.z, group, false);
  group.userData.fixture = spec;
  return group;
}

export function makeBohWalls(mats, walls, height) {
  const group = new THREE.Group();
  group.name = 'boh-walls';
  group.userData.xray = 'wall';
  for (const w of walls) {
    box(
      mats.wallInner,
      Math.max(0.08, w.x1 - w.x0),
      height,
      Math.max(0.08, w.z1 - w.z0),
      (w.x0 + w.x1) / 2,
      height / 2,
      (w.z0 + w.z1) / 2,
      group,
      false,
    );
  }
  return group;
}

export function makeStockDoor(mats, door, height) {
  const group = new THREE.Group();
  group.userData.xray = 'wall';
  const mid = (door.x0 + door.x1) / 2;
  const opening = door.x1 - door.x0;
  box(mats.steel, 0.08, height, 0.08, door.x0, height / 2, door.z, group, false);
  box(mats.steel, 0.08, height, 0.08, door.x1, height / 2, door.z, group, false);
  box(mats.steel, opening + 0.12, 0.08, 0.08, mid, height + 0.02, door.z, group, false);
  const leaf = box(mats.wallInner, 0.04, height - 0.16, 0.7, door.x0 + 0.06, (height - 0.16) / 2, door.z + 0.42, group, false);
  leaf.rotation.y = 1.15;

  const mat = new THREE.MeshBasicMaterial({
    map: headerTexture('STOCK / STAFF', { bg: '#ffe14d', fg: '#3a2415', w: 800, size: 70 }),
    toneMapped: false,
  });
  const salesFace = new THREE.Mesh(new THREE.PlaneGeometry(1.35, 0.24), mat);
  salesFace.position.set(mid, 2.12, door.z - 0.09);
  salesFace.rotation.y = Math.PI;
  group.add(salesFace);
  const stockFace = new THREE.Mesh(new THREE.PlaneGeometry(1.35, 0.24), mat);
  stockFace.position.set(mid, 2.12, door.z + 0.09);
  group.add(stockFace);

  const runner = new THREE.Mesh(
    new THREE.PlaneGeometry(opening - 0.08, 1.15),
    new THREE.MeshBasicMaterial({
      map: headerTexture('ENTER  STOCK', { bg: '#ffe14d', fg: '#3a2415', w: 900, h: 280, size: 72 }),
      transparent: true,
      opacity: 0.92,
      toneMapped: false,
    }),
  );
  runner.rotation.x = -Math.PI / 2;
  runner.position.set(mid, 0.016, door.z - 0.62);
  group.add(runner);
  return group;
}

/**
 * Locker room (PL-01, 4 m²) — fully enclosed SW bulge: walls + roof cap,
 * framed swing door with signage, and the plan's fit-out (2 lockers,
 * water dispenser, DB panel).
 */
export function makeLockerRoom(mats, spec, height) {
  const group = new THREE.Group();
  group.userData.xray = 'wall';
  const t = 0.12;
  const H = height;
  const x0 = spec.x - spec.w / 2;
  const x1 = spec.x + spec.w / 2;
  const z0 = spec.z - spec.d / 2;
  const z1 = spec.z + spec.d / 2;
  const door = spec.door;

  function wall(x, z, w, d, h = H, y = h / 2) {
    box(mats.wallInner, w, h, d, x, y, z, group, false);
  }

  // Shell: west, north, south, roof cap.
  wall(x0, spec.z, t, spec.d + t * 2);
  wall(spec.x, z0, spec.w + t * 2, t);
  wall(spec.x, z1, spec.w + t * 2, t);
  box(mats.wallInner, spec.w + t * 2.5, 0.1, spec.d + t * 2.5, spec.x, H + 0.05, spec.z, group, false);

  // East wall split around the door, header above the leaf, and infill up
  // to the sales ceiling so the envelope gap over the doorway is closed.
  const topD = door.z0 - z0;
  const botD = z1 - door.z1;
  if (topD > 0.08) wall(x1, z0 + topD / 2, t, topD);
  if (botD > 0.08) wall(x1, z1 - botD / 2, t, botD);
  const doorMid = (door.z0 + door.z1) / 2;
  const gap = door.z1 - door.z0;
  wall(x1, doorMid, t, gap, H - 2.05, 2.05 + (H - 2.05) / 2);
  const infillH = PLAN.ceiling - H;
  box(mats.wall, 0.14, infillH, gap + 0.3, x1, H + infillH / 2, doorMid, group, false);

  // Door frame + swing leaf, ajar into the room.
  box(mats.steel, 0.08, 2.05, 0.08, x1, 1.025, door.z0, group, false);
  box(mats.steel, 0.08, 2.05, 0.08, x1, 1.025, door.z1, group, false);
  box(mats.steel, 0.08, 0.08, gap + 0.12, x1, 2.07, doorMid, group, false);
  // Leaf hinged on the south jamb, ajar into the room.
  const leaf = box(mats.wallInner, 0.04, 1.95, gap - 0.1, x1 - 0.375, 0.975, door.z1 - 0.33, group, false);
  leaf.rotation.y = 0.85;
  box(mats.steel, 0.03, 0.12, 0.03, x1 - 0.62, 1.0, door.z1 - 0.58, group, false);

  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(1.15, 0.22),
    new THREE.MeshBasicMaterial({
      map: headerTexture('LOCKER ROOM', { bg: '#8d8d8d', fg: '#fffef5', w: 800, size: 70 }),
      toneMapped: false,
    }),
  );
  sign.position.set(x1 + t / 2 + 0.01, 2.28, doorMid);
  sign.rotation.y = Math.PI / 2;
  group.add(sign);

  // Fit-out per PL-01: two lockers on the west wall, water dispenser and
  // DB panel on the north wall.
  for (const lz of [spec.z + 0.07, spec.z + 0.65]) {
    box(mats.steel, 0.5, 1.8, 0.55, x0 + t / 2 + 0.31, 0.9, lz, group);
    box(mats.gondolaDark, 0.02, 1.7, 0.49, x0 + t / 2 + 0.57, 0.9, lz, group, false);
  }
  box(mats.cream, 0.34, 1.0, 0.34, x0 + 0.55, 0.5, z0 + t / 2 + 0.28, group);
  box(mats.fridgeGlass, 0.24, 0.3, 0.24, x0 + 0.55, 1.16, z0 + t / 2 + 0.28, group, false);
  box(mats.black, 0.5, 0.7, 0.08, spec.x + 0.35, 1.5, z0 + t / 2 + 0.05, group, false);

  group.userData.fixture = {
    name: 'Locker room',
    category: 'back of house',
    concept: 'Locker room 4 m² · 2 lockers, water dispenser, DB',
    brands: [],
    vm: ['PL-01 locker room'],
  };
  return group;
}

export function makeRack(mats, spec) {
  const group = new THREE.Group();
  group.userData.xray = 'ghost';
  box(mats.gondolaDark, spec.w, 0.08, spec.d, spec.x, 0.04, spec.z, group);
  box(mats.gondola, spec.w, spec.h - 0.1, 0.04, spec.x, spec.h / 2, spec.z - spec.d / 2 + 0.02, group);
  for (const y of [0.45, 0.95, 1.45, 1.95]) {
    box(mats.shelf, spec.w - 0.06, 0.02, spec.d - 0.04, spec.x, y, spec.z, group, false);
  }
  return group;
}

// silence unused
void tmpMat;
