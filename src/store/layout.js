import { catalog, productsForBrand } from './catalog.js';

/**
 * FRAN @ Bugis+ #01-04 furniture plan (PL-01).
 * Units: metres. Origin = outer NW corner of the main sales rectangle.
 * +X east, +Z south, +Y up.
 *
 * Sales 178 m² · stock 34 m² · locker 4 m² · total 230 m².
 * Brand / product names come from fran-skums (sample-brands + product-list).
 */

function merch(brandNames) {
  return {
    brands: brandNames,
    products: brandNames.flatMap((b) =>
      productsForBrand(b).slice(0, 2).map((p) => `${b} · ${p}`),
    ),
  };
}
export const PLAN = {
  title: 'FRAN @ Bugis+',
  unit: '#01-04',
  salesArea: 178,
  width: 19.23,
  depthWest: 7.156,
  depthEast: 6.26,
  ceiling: 3.55,
  ceilingSlab: 3.7,
  wall: 0.12,
};

export const BAY = {
  wallW: 0.9,
  wallD: 0.431,
  wallH: 2.4,
  drawerH: 0.42,
  logoH: 0.16,
  logoGap: 0.08,
  headerH: 0.5,
  gondolaD: 0.862,
  gondolaH: 1.75,
  gondolaDrawer: 0.3,
  gondolaLogo: 0.175,
  endcap: 0.431,
  bayW: 0.9,
  twoBay: 2.662,
  threeBay: 3.962,
  threeBayShort: 3.56,
};

/** Shop-drawing component stacks (Rev 9) — metres from finished floor. */
export const STACKS = {
  gondola: {
    total: 1.75,
    parts: [
      { id: 'drawer', label: 'Base drawer', from: 0, to: 0.3 },
      { id: 's1', label: 'Shelf 1', from: 0.3, to: 0.58 },
      { id: 's2', label: 'Shelf 2', from: 0.58, to: 0.86 },
      { id: 's3', label: 'Shelf 3', from: 0.86, to: 1.14 },
      { id: 's4', label: 'Shelf 4', from: 1.14, to: 1.575 },
      { id: 'logo', label: 'Logo runner', from: 1.575, to: 1.75 },
    ],
  },
  wallbay: {
    total: 2.4,
    parts: [
      { id: 'drawer', label: 'Base drawer', from: 0, to: 0.42 },
      { id: 's1', label: 'Shelf 1', from: 0.42, to: 0.73 },
      { id: 's2', label: 'Shelf 2', from: 0.73, to: 1.04 },
      { id: 's3', label: 'Shelf 3', from: 1.04, to: 1.35 },
      { id: 's4', label: 'Shelf 4', from: 1.35, to: 1.74 },
      { id: 'lightbox', label: 'Lightbox 500', from: 1.74, to: 2.24 },
      { id: 'led', label: 'P4 LED 160', from: 2.24, to: 2.4 },
    ],
  },
};

const WB = BAY.wallD;

/** Gondolas — 2× 2-bay + 4× 3-bay + endcap (+ hygiene glass on 3-bay). */
export const gondolas = [
  {
    id: 'NL',
    name: 'North 2-bay',
    bays: 2,
    w: BAY.twoBay,
    x: 6.531,
    z: WB + 1.7 + BAY.gondolaD / 2,
    rot: 0,
    hygiene: false,
    category: 'skincare',
    concept: 'Brand wall / gondola · functions',
    ...merch(catalog.plan.gondolas.NL.brands),
    vm: ['Lightbox', 'POP box', 'Risers / testers', 'Glorifier'],
  },
  {
    id: 'NM',
    name: 'North 3-bay',
    bays: 3,
    w: BAY.threeBayShort,
    x: 10.85,
    z: WB + 1.7 + BAY.gondolaD / 2,
    rot: 0,
    hygiene: true,
    category: 'serum',
    concept: 'Category gondola · serum / routine',
    ...merch(catalog.plan.gondolas.NM.brands),
    vm: ['Lightbox', 'POP box', 'Risers / testers', 'Callout'],
  },
  {
    id: 'NR',
    name: 'North 3-bay',
    bays: 3,
    w: BAY.threeBay,
    x: 15.62,
    z: WB + 1.7 + BAY.gondolaD / 2,
    rot: 0,
    hygiene: true,
    category: 'makeup',
    concept: 'Brand gondola · makeup',
    ...merch(catalog.plan.gondolas.NR.brands),
    vm: ['Lightbox', 'Product grid'],
  },
  {
    id: 'SL',
    name: 'South 2-bay',
    bays: 2,
    w: BAY.twoBay,
    x: 5.8,
    z: PLAN.depthWest - WB - 1.7 - BAY.gondolaD / 2,
    rot: 0,
    hygiene: false,
    category: 'hair',
    concept: 'Brand gondola · hair / body',
    ...merch(catalog.plan.gondolas.SL.brands),
    vm: ['Lightbox', 'POP box', 'Risers / testers'],
  },
  {
    id: 'SM',
    name: 'South 3-bay',
    bays: 3,
    w: BAY.threeBay,
    x: 10.05,
    z: PLAN.depthWest - WB - 1.7 - BAY.gondolaD / 2,
    rot: 0,
    hygiene: true,
    category: 'cleanser',
    concept: 'Category gondola · cleanser / moisturiser',
    ...merch(catalog.plan.gondolas.SM.brands),
    vm: ['Lightbox', 'POP box', 'Callout'],
  },
  {
    id: 'SR',
    name: 'South 3-bay',
    bays: 3,
    w: BAY.threeBay,
    x: 15.08,
    z: PLAN.depthWest - WB - 1.7 - BAY.gondolaD / 2,
    rot: 0,
    hygiene: true,
    category: 'suncare',
    concept: 'Category gondola · sun',
    ...merch(catalog.plan.gondolas.SR.brands),
    vm: ['Lightbox', 'Risers / testers', 'Callout'],
  },
];

/**
 * Perimeter wallbays. `facing` is the direction the merchandise faces
 * (the aisle side). Position is the bay centre on the floor.
 */
export const wallBays = [
  ...run({
    count: 6,
    startX: 3.2,
    z: WB / 2,
    facing: 's',
    category: 'hair',
    brandList: catalog.plan.wallBays.hair,
  }),
  ...run({
    count: 8,
    startX: 10.0,
    z: WB / 2,
    facing: 's',
    category: 'makeup',
    brandList: catalog.plan.wallBays.makeup,
  }),
  ...run({
    count: 5,
    startX: 5.78,
    z: PLAN.depthWest - WB / 2,
    facing: 'n',
    category: 'skincare',
    brandList: catalog.plan.wallBays.skincare,
  }),
  ...run({
    count: 3,
    startX: 14.55,
    z: PLAN.depthEast + 0.15,
    facing: 'n',
    category: 'suncare',
    brandList: catalog.plan.wallBays.suncare,
  }),
  ...run({
    count: 2,
    startX: 17.55,
    z: PLAN.depthEast + 0.15,
    facing: 'n',
    category: 'skincare',
    brandList: catalog.plan.wallBays.skincareEast,
  }),
  // PL-01: 3 wallbays on the east face of the stock partition, into the experience.
  ...runAlong({
    count: 3,
    x: 11.105 + BAY.wallD / 2,
    startZ: 7.155 + BAY.wallW / 2,
    facing: 'e',
    category: 'skincare',
    brandList: catalog.plan.wallBays.skincareEast,
  }),
];

function run({ count, startX, z, facing, category, brandList }) {
  return runAlong({
    count,
    x: startX,
    startZ: z,
    axis: 'x',
    facing,
    category,
    brandList,
  });
}

function runAlong({ count, x, startZ, axis = 'z', facing, category, brandList }) {
  const out = [];
  for (let i = 0; i < count; i += 1) {
    const brand = brandList[i % brandList.length];
    const alongX = axis === 'x';
    out.push({
      id: `WB-${category}-${alongX ? i : `e${i}`}`,
      name: brand,
      x: alongX ? x + i * BAY.wallW : x,
      z: alongX ? startZ : startZ + i * BAY.wallW,
      facing,
      category,
      ...merch([brand]),
      concept: `Wallbay · ${brand}`,
      vm: ['P4 LED category', 'Brand logo strip', 'Storage drawer'],
    });
  }
  return out;
}

/** Structural columns from PL-01 — centres on the wall lines, ~Ø800. */
export const columns = [
  { id: 'N-W', x: 1.56, z: 0.36, r: 0.4 },
  { id: 'N-M', x: 9.97, z: 0.36, r: 0.4 },
  { id: 'N-E', x: 18.32, z: 0.4, r: 0.42 },
  { id: 'S-W', x: 2.52, z: 6.88, r: 0.4 },
  { id: 'S-STK', x: 10.72, z: 7.12, r: 0.4 },
  { id: 'E-S', x: 18.88, z: 6.52, r: 0.4 },
];

export const doors = {
  stock: {
    aisle: { x: 4.1, z: 5.85 },
    approach: { x: 4.1, z: 6.62 },
    inside: { x: 4.1, z: 7.7 },
  },
  locker: {
    aisle: { x: 0.85, z: 6.05 },
    approach: { x: 0.42, z: 6.05 },
    inside: { x: -0.55, z: 6.05 },
  },
};

export const cashier = {
  x: 1.55,
  z: 2.85,
  w: 1.8,
  d: 0.55,
  h: 0.95,
  graffiti: { x: 0.08, z: 2.7, w: 0.04, d: 3.4, h: 2.6 },
  canopy: { x: 1.7, z: 2.7, w: 2.4, d: 1.6, y: 2.55 },
};

export const queueFixtures = [
  { x: 3.35, z: 2.35, w: 1.0, d: 0.45, h: 0.9 },
  { x: 3.35, z: 3.55, w: 1.0, d: 0.45, h: 0.9 },
];

export const experience = {
  // PL-01 display table 1600 × 1800, east of stock / west of the round table.
  table: { x: 12.42, z: 8.06, w: 1.6, d: 1.8, h: 0.9 },
  round: { x: 16.55, z: 8.15, r: 1.15, h: 0.78 },
  discLight: { x: 16.55, z: 8.15, r: 1.45, y: 3.28 },
  maskWall: {
    // Customised featured mascot wall — angled.
    x: 15.15,
    z: 9.35,
    w: 3.42,
    rot: -0.72,
    category: 'mask',
    name: 'Mask wall',
    ...merch(catalog.plan.mask),
    concept: 'Special display · mask wall',
    vm: ['Category LED only', '18×9 sheet-mask grid', '250mm end gaps'],
  },
};

/**
 * Back of house from PL-01 (metres).
 *
 * Stock 34 m² is the south wing: 8705 E–W × 3923 N–S, with a SE jog
 * (east wall 2740). Staff + manager desks sit on the west wall inside
 * that room; receiving 1000×1000 is just inside the sales door.
 * Locker 4 m² is the SW bulge (4348 to the stock west wall).
 */
export const BOH = {
  ceiling: 2.4,
  stock: {
    x0: 2.4,
    x1: 11.105,
    z0: 7.155,
    z1: 11.078,
    eastZ1: 9.895,
    jogX: 8.975,
    door: { x0: 3.12, x1: 5.08, z: 7.155 },
  },
  locker: {
    x0: -1.948,
    x1: 0.08,
    z0: 5.28,
    z1: 7.28,
    door: { z0: 5.5, z1: 6.6, x: 0 },
  },
};

export const stockRoom = {
  x: (BOH.stock.x0 + BOH.stock.x1) / 2,
  z: (BOH.stock.z0 + BOH.stock.z1) / 2,
  w: BOH.stock.x1 - BOH.stock.x0,
  d: BOH.stock.z1 - BOH.stock.z0,
  door: BOH.stock.door,
};

export const locker = {
  x: (BOH.locker.x0 + BOH.locker.x1) / 2,
  z: (BOH.locker.z0 + BOH.locker.z1) / 2,
  w: BOH.locker.x1 - BOH.locker.x0,
  d: BOH.locker.z1 - BOH.locker.z0,
  door: BOH.locker.door,
};

export const staffDesk = {
  id: 'staff-desk',
  name: 'Staff desk',
  x: 2.9,
  z: 7.72,
  w: 1.0,
  d: 0.8,
  h: 0.75,
  category: 'back of house',
  concept: 'Staff desk · 1000 × 800 against the west wall',
  brands: [],
  vm: ['PL-01 staff desk'],
};

export const managerDesk = {
  id: 'manager-desk',
  name: 'Manager desk',
  x: 2.9,
  z: 9.22,
  w: 1.0,
  d: 1.2,
  h: 0.75,
  category: 'back of house',
  concept: 'Manager desk · 1000 × 1200',
  brands: [],
  vm: ['PL-01 manager desk'],
};

export const receiving = {
  id: 'receiving',
  name: 'Receiving',
  x: 3.88,
  z: 7.72,
  w: 1.0,
  d: 1.0,
  h: 0.08,
  category: 'back of house',
  concept: 'Receiving bay · 1000 × 1000 inside the stock door',
  brands: [],
  vm: ['PL-01 receiving'],
};

const RACK = { w: 1.2, d: 0.45, h: 2.1, pitch: 1.22 };

function rackRow(id, x0, z, count) {
  const out = [];
  for (let i = 0; i < count; i += 1) {
    out.push({
      id: `rack-${id}-${i + 1}`,
      x: x0 + RACK.w / 2 + i * RACK.pitch,
      z,
      w: RACK.w,
      d: RACK.d,
      h: RACK.h,
    });
  }
  return out;
}

/** Stock racking 1200×450×2100 — 14 nos, 4 + 5 + 5, aisles 1250 / 1333. */
export const stockRacks = [
  ...rackRow('N', 5.28, 7.38, 4),
  ...rackRow('M', 3.5, 9.07, 5),
  ...rackRow('S', 2.56, 10.84, 5),
];

/** Partition AABBs (and matching meshes). Door gap is left open. */
export const bohWalls = [
  { id: 'stock-w', x0: 2.34, x1: 2.46, z0: 7.1, z1: 11.14 },
  { id: 'stock-s', x0: 2.34, x1: 9.04, z0: 11.02, z1: 11.14 },
  { id: 'stock-jog', x0: 8.91, x1: 9.04, z0: 9.84, z1: 11.14 },
  { id: 'stock-se-s', x0: 8.91, x1: 11.17, z0: 9.84, z1: 9.96 },
  { id: 'stock-e', x0: 11.04, x1: 11.17, z0: 7.1, z1: 9.96 },
  { id: 'stock-n-w', x0: 0.0, x1: 3.12, z0: 7.09, z1: 7.22 },
  { id: 'stock-n-e', x0: 5.08, x1: 11.17, z0: 7.09, z1: 7.22 },
];

/** Mall-facing east opening + fascia. Recess is a shallow glass portal into the mall. */
export const entrance = {
  x: 19.23,
  z0: 0.95,
  z1: 5.85,
  fasciaH: 1.15,
  recess: 0.82,
  hose: { x: 19.05, z: 0.55, w: 0.72, h: 0.9 },
};

export const spawn = { x: 17.35, z: 3.35, facing: -Math.PI / 2 };

/** Simple walkable AABB islands (union). Used to reject out-of-store clicks. */
export const walkPads = [
  { x0: 0.12, z0: 0.45, x1: 18.9, z1: 7.16 },
  { x0: 11.22, z0: 6.4, x1: 18.9, z1: 9.75 },
  { x0: 15.4, z0: 9.4, x1: 18.2, z1: 10.4 },
  { x0: 3.0, z0: 6.2, x1: 5.25, z1: 7.85 },
  { x0: 2.48, z0: 7.1, x1: 11.05, z1: 9.88 },
  { x0: 2.48, z0: 9.68, x1: 8.92, z1: 11.02 },
  { x0: -0.25, z0: 5.35, x1: 0.95, z1: 6.75 },
  { x0: -1.95, z0: 5.28, x1: 0.22, z1: 7.22 },
  { x0: 18.5, z0: 1.0, x1: 24.2, z1: 5.8 },
];

export function walkRegion(x, z) {
  if (x > 19.05) return 'mall';
  if (x < 0.22 && z > 5.2 && z < 7.35) return 'locker';
  if (x > 2.45 && x < 11.15 && z > 7.12) return 'stock';
  return 'sales';
}

export function onWalkable(x, z) {
  return walkPads.some((p) => x >= p.x0 && x <= p.x1 && z >= p.z0 && z <= p.z1);
}

export function blockersAt(x, z, radius = 0.22) {
  if (!onWalkable(x, z)) return ['off-pad'];
  const hit = [];
  for (const b of fixtureAabbs()) {
    if (b.ghost) continue;
    const cx = Math.max(b.x0, Math.min(x, b.x1));
    const cz = Math.max(b.z0, Math.min(z, b.z1));
    if (Math.hypot(x - cx, z - cz) < radius) hit.push(b.id);
  }
  return hit;
}

export function fixtureAabbs() {
  const boxes = [];
  const pad = 0.04;
  for (const g of gondolas) {
    boxes.push({
      x0: g.x - g.w / 2 - pad,
      x1: g.x + g.w / 2 + pad,
      z0: g.z - BAY.gondolaD / 2 - pad,
      z1: g.z + BAY.gondolaD / 2 + pad,
      id: g.id,
      kind: 'gondola',
      data: g,
    });
  }
  for (const b of wallBays) {
    const alongX = b.facing === 'n' || b.facing === 's';
    const w = alongX ? BAY.wallW : BAY.wallD;
    const d = alongX ? BAY.wallD : BAY.wallW;
    boxes.push({
      x0: b.x - w / 2,
      x1: b.x + w / 2,
      z0: b.z - d / 2,
      z1: b.z + d / 2,
      id: b.id,
      kind: 'wallbay',
      data: b,
    });
  }
  boxes.push({
    x0: cashier.x - cashier.w / 2,
    x1: cashier.x + cashier.w / 2,
    z0: cashier.z - cashier.d / 2,
    z1: cashier.z + cashier.d / 2,
    id: 'cashier',
    kind: 'cashier',
    data: {
      name: 'Cash wrap',
      category: 'service',
      concept: 'Yellow canopy + graffiti brand wall',
      brands: ['fran'],
      vm: ['Canopy', 'Graffiti wall', 'Queue fixtures'],
    },
  });
  for (const q of queueFixtures) {
    boxes.push({
      x0: q.x - q.w / 2,
      x1: q.x + q.w / 2,
      z0: q.z - q.d / 2,
      z1: q.z + q.d / 2,
      id: 'queue',
      kind: 'queue',
      data: { name: 'Queue fixture', category: 'service', concept: 'Queue line', brands: [], vm: [] },
    });
  }
  for (const c of columns) {
    boxes.push({
      x0: c.x - c.r,
      x1: c.x + c.r,
      z0: c.z - c.r,
      z1: c.z + c.r,
      id: 'col',
      kind: 'column',
      data: null,
    });
  }
  boxes.push({
    x0: experience.round.x - experience.round.r,
    x1: experience.round.x + experience.round.r,
    z0: experience.round.z - experience.round.r,
    z1: experience.round.z + experience.round.r,
    id: 'round',
    kind: 'display',
    data: {
      name: 'Experience table',
      category: 'theme',
      concept: 'Special display · testers',
      ...merch(catalog.plan.mask),
      vm: ['Risers / testers', 'Callout'],
    },
  });
  for (const r of stockRacks) {
    boxes.push({
      x0: r.x - r.w / 2,
      x1: r.x + r.w / 2,
      z0: r.z - r.d / 2,
      z1: r.z + r.d / 2,
      id: r.id,
      kind: 'rack',
      data: {
        name: 'Stock racking',
        category: 'back of house',
        concept: 'W1200 × D450 × H2100',
        brands: [],
        vm: ['14 nos · 4 / 5 / 5'],
      },
    });
  }
  boxes.push({
    x0: receiving.x - receiving.w / 2,
    x1: receiving.x + receiving.w / 2,
    z0: receiving.z - receiving.d / 2,
    z1: receiving.z + receiving.d / 2,
    id: receiving.id,
    kind: 'receiving',
    ghost: true,
    data: receiving,
  });
  for (const desk of [staffDesk, managerDesk]) {
    boxes.push({
      x0: desk.x - desk.w / 2,
      x1: desk.x + desk.w / 2,
      z0: desk.z - desk.d / 2,
      z1: desk.z + desk.d / 2,
      id: desk.id,
      kind: 'desk',
      data: desk,
    });
  }
  boxes.push({
    x0: experience.table.x - experience.table.w / 2,
    x1: experience.table.x + experience.table.w / 2,
    z0: experience.table.z - experience.table.d / 2,
    z1: experience.table.z + experience.table.d / 2,
    id: 'display-table',
    kind: 'display',
    data: {
      name: 'Display table',
      category: 'theme',
      concept: 'Special display · 1600 × 1800',
      ...merch(catalog.plan.mask),
      vm: ['Risers / testers'],
    },
  });
  for (const wall of bohWalls) {
    boxes.push({ ...wall, kind: 'wall', data: null });
  }
  // Locker walls (east wall is the west sales wall, with a door).
  boxes.push({ x0: BOH.locker.x0 - 0.08, x1: BOH.locker.x0 + 0.08, z0: BOH.locker.z0, z1: BOH.locker.z1, id: 'lock-w', kind: 'wall', data: null });
  boxes.push({ x0: BOH.locker.x0, x1: BOH.locker.x1, z0: BOH.locker.z0 - 0.08, z1: BOH.locker.z0 + 0.08, id: 'lock-n', kind: 'wall', data: null });
  boxes.push({ x0: BOH.locker.x0, x1: BOH.locker.x1, z0: BOH.locker.z1 - 0.08, z1: BOH.locker.z1 + 0.08, id: 'lock-s', kind: 'wall', data: null });
  // Perimeter: west wall split around locker door, north wall, mall neighbours.
  boxes.push({ x0: -0.4, x1: 0.18, z0: -0.4, z1: 5.45, id: 'wall-w-n', kind: 'wall', data: null });
  boxes.push({ x0: -0.4, x1: 0.18, z0: 6.65, z1: 7.2, id: 'wall-w-s', kind: 'wall', data: null });
  boxes.push({ x0: -0.4, x1: 19.5, z0: -0.4, z1: 0.12, id: 'wall-n', kind: 'wall', data: null });
  boxes.push({ x0: 19.5, x1: 25, z0: -4, z1: 0.92, id: 'mall-n', kind: 'wall', data: null });
  boxes.push({ x0: 19.5, x1: 25, z0: 5.88, z1: 13, id: 'mall-s', kind: 'wall', data: null });
  boxes.push({ x0: 24.15, x1: 24.4, z0: 0.9, z1: 5.9, id: 'mall-end', kind: 'wall', data: null });
  return boxes;
}

export function nearestFixture(x, z, maxDist = 2.1) {
  let best = null;
  let bestD = maxDist;
  for (const box of fixtureAabbs()) {
    if (!box.data) continue;
    const cx = (box.x0 + box.x1) / 2;
    const cz = (box.z0 + box.z1) / 2;
    const d = Math.hypot(cx - x, cz - z);
    const rank = box.kind === 'gondola' || box.kind === 'wallbay' || box.kind === 'display' ? 0 : 0.45;
    if (d + rank < bestD) {
      bestD = d + rank;
      best = box;
    }
  }
  return best;
}

export function placeName(x, z) {
  if (x > 19.05) return 'Mall';
  if (x < 0.25 && z > 5.2 && z < 7.35) return 'Locker room';
  if (x > 2.4 && x < 3.7 && z > 8.35 && z < 10.0) return 'Staff / manager';
  if (x > 3.2 && x < 4.55 && z > 7.15 && z < 8.35) return 'Receiving';
  if (x > 2.4 && x < 11.15 && z > 7.15) return 'Stock room';
  if (x > 11.15 && z > 6.5) return 'Experience zone';
  if (x < 4.2 && z < 4.8) return 'Cash wrap';
  if (z < 2.4) return 'North wallbays';
  if (z > 5.4 && x < 14) return 'South wallbays';
  const g = gondolas.find((item) => Math.abs(item.x - x) < item.w / 2 + 0.7 && Math.abs(item.z - z) < 1.1);
  if (g) return g.name;
  if (x > 16.5) return 'Entrance aisle';
  return 'Centre aisle';
}

/** Key PL-01 check points used by the walk-through and the floor grid. */
export const measurePoints = [
  { id: 'origin', x: 0, z: 0, label: '0,0 NW' },
  { id: 'sales-se-west', x: 0, z: 7.155, label: '7 155' },
  { id: 'sales-ne', x: 19.23, z: 0, label: '19 230' },
  { id: 'stock-door', x: 3.88, z: 7.2, label: 'Stock door' },
  { id: 'stock-sw', x: 2.4, z: 11.078, label: 'Stock SW' },
  { id: 'stock-se', x: 11.105, z: 9.895, label: 'Stock SE' },
  { id: 'locker', x: -0.9, z: 6.28, label: 'Locker' },
];
