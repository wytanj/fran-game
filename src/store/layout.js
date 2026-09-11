import { catalog, productsForBrand } from './catalog.js';

/**
 * FRAN @ Bugis+ #01-04 furniture plan (PL-01).
 * Lock: FRAN_FULL_TECHNICAL_DRAWING_SET_110926.pdf (56p).
 * Units: metres. Origin = outer NW corner of the main sales rectangle.
 * +X east, +Z south, +Y up.
 *
 * Sales 178 m² · stock 34 m² · locker 4 m² · total 230 m².
 * Brand / product names come from fran-skums (sample-brands + product-list).
 *
 * FULL 110926 legend: WB-M 7 · WB-S4 17 · WB-S5 2; GD-M 12 · GD-S4 20;
 * EC-M 1 · EC-S3 2 · EC-S3+H 4 · EC-S5 3; HS-G 8.
 * Lightboxes (fixture sheets + Store Dev confirm): wallbay 900×530,
 * gondola 900×270, shelf cube 150×220×50.
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
  headerH: 0.53, // wallbay lightbox H530
  gondolaD: 0.862,
  gondolaH: 1.71, // GD-M sheet overall with H270 lightbox
  gondolaDrawer: 0.3,
  gondolaLogo: 0.27,
  endcap: 0.431,
  bayW: 0.9,
  lightboxW: 0.25,
  hygieneW: 0.213,
  twoBay: 2.662,
  threeBay: 3.762,
  threeBayShort: 3.381,
  wallLightbox: { w: 0.9, h: 0.53 },
  gondolaLightbox: { w: 0.9, h: 0.27 },
  shelfLightbox: { w: 0.15, h: 0.22, d: 0.05 },
};

/** Shop-drawing component stacks (Rev 9) — metres from finished floor. */
export const STACKS = {
  gondola: {
    total: 1.71,
    parts: [
      { id: 'drawer', label: 'Base drawer', from: 0, to: 0.3 },
      { id: 's1', label: 'Shelf 1', from: 0.3, to: 0.58 },
      { id: 's2', label: 'Shelf 2', from: 0.58, to: 0.86 },
      { id: 's3', label: 'Shelf 3', from: 0.86, to: 1.14 },
      { id: 's4', label: 'Shelf 4', from: 1.14, to: 1.44 },
      { id: 'logo', label: 'Lightbox 270', from: 1.44, to: 1.71 },
    ],
  },
  wallbay: {
    total: 2.4,
    parts: [
      { id: 'drawer', label: 'Base drawer', from: 0, to: 0.42 },
      { id: 's1', label: 'Shelf 1', from: 0.42, to: 0.73 },
      { id: 's2', label: 'Shelf 2', from: 0.73, to: 1.04 },
      { id: 's3', label: 'Shelf 3', from: 1.04, to: 1.35 },
      { id: 's4', label: 'Shelf 4', from: 1.35, to: 1.71 },
      { id: 'lightbox', label: 'Lightbox 530', from: 1.71, to: 2.24 },
      { id: 'led', label: 'P4 LED 160', from: 2.24, to: 2.4 },
    ],
  },
};

const WB = BAY.wallD;

/** WB-M bay centres — FULL PL-01 6940 run east of 1625 mirror; HS after bays 2, 4, 7. */
const WBM_XS = [11.324, 12.224, 13.337, 14.237, 15.35, 16.25, 17.15];
const HS_XS = [12.7805, 14.7935, 17.7065];

/**
 * Gondola islands — rev 18/08. Per-end fittings via `ends` (w = west, e = east):
 * EC-S3 · 3-shelf endcap, L-shape side panel + mounted hygiene station.
 * EC-S5 · 5-shelf endcap, white transparent side panel.
 * EC-M  · makeup endcap, 4 shelves.
 * lightbox · illuminated tower (250 wide) replacing the endcap.
 * 3-bay islands are 200 shorter than rev 13/08 (3581→3381, 3962→3762);
 * east edges hold, the trim comes off the west end.
 */
export const gondolas = [
  {
    id: 'NL',
    name: 'North 2-bay',
    bays: 2,
    shelves: 5,
    w: BAY.twoBay,
    x: 6.354,
    z: WB + 1.7 + BAY.gondolaD / 2,
    rot: 0,
    ends: { w: 'EC-S3', e: 'EC-S3' },
    category: 'skincare',
    concept: 'Standard gondola (5 shelves) · functions',
    ...merch(catalog.plan.gondolas.NL.brands),
    vm: ['POP box', 'Risers / testers', 'Glorifier', 'Hygiene on L-panels'],
  },
  {
    id: 'NM',
    name: 'North 3-bay',
    bays: 3,
    shelves: 4,
    makeup: true,
    w: BAY.threeBayShort,
    x: 10.885,
    z: WB + 1.7 + BAY.gondolaD / 2,
    rot: 0,
    ends: { w: 'lightbox', e: 'EC-S3' },
    category: 'makeup',
    concept: 'Makeup gondola · colour cosmetics',
    ...merch(['Dear Dahlia', 'espoir', 'ETUDE']),
    vm: ['Lightbox tower', 'Product grid', 'Hygiene on L-panel'],
  },
  {
    id: 'NR',
    name: 'North 3-bay',
    bays: 3,
    shelves: 4,
    makeup: true,
    w: BAY.threeBay,
    x: 15.951,
    z: WB + 1.7 + BAY.gondolaD / 2,
    rot: 0,
    ends: { w: 'EC-M', e: 'EC-S3' },
    category: 'makeup',
    concept: 'Makeup gondola · brands + EC-M endcap',
    ...merch(catalog.plan.gondolas.NR.brands),
    vm: ['EC-M endcap', 'Product grid', 'Hygiene on L-panel'],
  },
  {
    id: 'SL',
    name: 'South 2-bay',
    bays: 2,
    shelves: 5,
    w: BAY.twoBay,
    x: 6.354,
    z: PLAN.depthWest - WB - 1.7 - BAY.gondolaD / 2,
    rot: 0,
    ends: { w: 'EC-S5', e: 'EC-S3' },
    category: 'hair',
    concept: 'Standard gondola (5 shelves) · hair / body',
    ...merch(catalog.plan.gondolas.SL.brands),
    vm: ['POP box', 'Risers / testers', 'EC-S5 transparent panel'],
  },
  {
    id: 'SM',
    name: 'South 3-bay',
    bays: 3,
    shelves: 4,
    w: BAY.threeBayShort,
    x: 10.885,
    z: PLAN.depthWest - WB - 1.7 - BAY.gondolaD / 2,
    rot: 0,
    ends: { w: 'lightbox', e: 'EC-S3' },
    category: 'cleanser',
    concept: 'Category gondola · cleanser / moisturiser',
    ...merch(catalog.plan.gondolas.SM.brands),
    vm: ['Lightbox tower', 'POP box', 'Callout'],
  },
  {
    id: 'SR',
    name: 'South 3-bay',
    bays: 3,
    shelves: 4,
    w: BAY.threeBay,
    x: 15.951,
    z: PLAN.depthWest - WB - 1.7 - BAY.gondolaD / 2,
    rot: 0,
    ends: { w: 'EC-S5', e: 'EC-S5' },
    category: 'suncare',
    concept: 'Category gondola · sun',
    ...merch(catalog.plan.gondolas.SR.brands),
    vm: ['EC-S5 transparent panels', 'Risers / testers', 'Callout'],
  },
];

/**
 * Perimeter wallbays. `facing` is the direction the merchandise faces
 * (the aisle side). Position is the bay centre on the floor.
 */
export const wallBays = [
  // North WB-S4 ×7 (6340) after fullheight + column pocket.
  ...run({
    count: 7,
    startX: 3.357,
    z: WB / 2,
    facing: 's',
    category: 'hair',
    brandList: catalog.plan.wallBays.hair,
  }),
  // North WB-M ×7 (6940) with 3 HS-W interleaved.
  ...makeupRun(),
  // South WB-S4 ×7 (6340) on stock north face.
  ...run({
    count: 7,
    startX: 4.946,
    z: PLAN.depthWest - WB / 2,
    facing: 'n',
    category: 'skincare',
    brandList: catalog.plan.wallBays.skincare,
  }),
  // Stock-room east face WB-S4 ×3 (2740).
  ...runAlong({
    count: 3,
    x: 11.105 + BAY.wallD / 2,
    startZ: 7.155 + BAY.wallW / 2,
    facing: 'e',
    category: 'skincare',
    brandList: catalog.plan.wallBays.skincareEast,
  }),
  // SE jog WB-S5 ×2 (1840).
  ...run({
    count: 2,
    startX: 12.14,
    z: 9.895 + BAY.wallD / 2,
    facing: 's',
    category: 'suncare',
    brandList: catalog.plan.wallBays.suncare,
    variant: 'WB-S5',
  }),
];

function makeupRun() {
  const brandList = catalog.plan.wallBays.makeup;
  return WBM_XS.map((x, i) => {
    const brand = brandList[i % brandList.length];
    return {
      id: `WB-M-${i}`,
      name: brand,
      x,
      z: WB / 2,
      facing: 's',
      category: 'makeup',
      variant: 'WB-M',
      ...merch([brand]),
      concept: `Makeup wallbay (WB-M) · ${brand}`,
      vm: ['P4 LED category', 'Brand logo strip', 'Storage drawer'],
    };
  });
}

/** Wallbay hygiene stations (rev 18/08 · 3 nos on the WB-M run). */
export const hygieneStations = HS_XS.map((x, i) => ({
  id: `HS-W${i + 1}`,
  name: 'Hygiene station',
  x,
  z: 0.19,
  w: BAY.hygieneW,
  facing: 's',
  category: 'service',
  concept: 'Wallbay hygiene station · sanitiser + testers (WB-M run)',
  brands: [],
  vm: ['Sanitiser', 'Tissue / bin', 'Mirror'],
}));

function run({ count, startX, z, facing, category, brandList, variant }) {
  return runAlong({
    count,
    x: startX,
    startZ: z,
    axis: 'x',
    facing,
    category,
    brandList,
    variant,
  });
}

function runAlong({ count, x, startZ, axis = 'z', facing, category, brandList, variant }) {
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
      ...(variant ? { variant } : {}),
      ...merch([brand]),
      concept: `Wallbay · ${brand}`,
      vm: ['P4 LED category', 'Brand logo strip', 'Storage drawer'],
    });
  }
  return out;
}

/** Structural columns from PL-01 — centres on the wall lines, ~Ø800. */
export const columns = [
  { id: 'N-W', x: 2.01, z: 0.45, r: 0.45 },
  { id: 'N-M', x: 10.42, z: 0.45, r: 0.45 },
  { id: 'N-E', x: 18.32, z: 0.45, r: 0.45 },
  { id: 'S-W', x: 2.52, z: 6.88, r: 0.45 },
  { id: 'S-STK', x: 10.72, z: 7.12, r: 0.45 },
  { id: 'E-S', x: 18.88, z: 6.52, r: 0.45 },
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
  // CC-01: 2940 × 600 × 900, long axis N–S, 1000 off storefront.
  x: 1.3,
  z: 3.857,
  w: 0.6,
  d: 2.94,
  h: 0.9,
  graffiti: { x: 0.08, z: 3.857, w: 0.04, d: 3.4, h: 2.6 },
  canopy: { x: 1.5, z: 3.857, w: 2.0, d: 3.2, y: 2.55 },
};

// PL-01 Queue Line fixture — T: head 1000×350 + stem 350×2000; gap from cashier 1107.
export const queueFixtures = [
  { x: 3.207, z: 2.6, w: 1.0, d: 0.35, h: 0.9 },
  { x: 3.207, z: 3.95, w: 0.35, d: 2.0, h: 0.9 },
];

export const experience = {
  // SUNCARE TABLE 900 × 1800, 1600 east of south WB-S4 run.
  table: { x: 12.884, z: 8.06, w: 0.9, d: 1.8, h: 0.9 },
  // SPECIAL FIXTURE stadium 3000 × 1800.
  special: { x: 16.55, z: 8.15, w: 3.0, d: 1.8, h: 0.78 },
  // Circum-approx kept for disc light / hide-spot helpers.
  round: { x: 16.55, z: 8.15, r: 1.5, h: 0.78 },
  discLight: { x: 16.55, z: 8.15, r: 1.7, y: 3.28 },
  maskWall: {
    // MASK NICHE WALL — outer run 3700.
    x: 15.15,
    z: 9.35,
    w: 3.7,
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
  w: 1.2,
  d: 0.8,
  h: 0.75,
  category: 'back of house',
  concept: 'Staff desk · 1200 × 800 against the west wall',
  brands: [],
  vm: ['PL-01 staff desk'],
};

export const managerDesk = {
  id: 'manager-desk',
  name: 'Manager desk',
  x: 2.9,
  z: 9.22,
  w: 1.2,
  d: 1.2,
  h: 0.75,
  category: 'back of house',
  concept: 'Manager desk · 1200 × 1200',
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
  for (const h of hygieneStations) {
    boxes.push({
      x0: h.x - h.w / 2,
      x1: h.x + h.w / 2,
      z0: h.z - 0.19,
      z1: h.z + 0.19,
      id: h.id,
      kind: 'hygiene',
      data: h,
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
    x0: experience.special.x - experience.special.w / 2,
    x1: experience.special.x + experience.special.w / 2,
    z0: experience.special.z - experience.special.d / 2,
    z1: experience.special.z + experience.special.d / 2,
    id: 'special',
    kind: 'display',
    data: {
      name: 'Special fixture',
      category: 'theme',
      concept: 'Special display · stadium 3000 × 1800',
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
      concept: 'Special display · suncare table 900 × 1800',
      ...merch(catalog.plan.mask),
      vm: ['Risers / testers'],
    },
  });
  for (const wall of bohWalls) {
    boxes.push({ ...wall, kind: 'wall', data: null });
  }
  // Locker room fit-out (mirrors makeLockerRoom geometry): 2 lockers on the
  // west wall, water dispenser by the north wall.
  const lockerData = (name) => ({
    name,
    category: 'back of house',
    concept: 'Locker room fit-out (PL-01)',
    brands: [],
    vm: [],
  });
  boxes.push({ x0: -1.83, x1: -1.33, z0: 6.07, z1: 6.63, id: 'locker-1', kind: 'locker', data: lockerData('Locker') });
  boxes.push({ x0: -1.83, x1: -1.33, z0: 6.65, z1: 7.21, id: 'locker-2', kind: 'locker', data: lockerData('Locker') });
  boxes.push({ x0: -1.57, x1: -1.23, z0: 5.45, z1: 5.79, id: 'water-disp', kind: 'locker', data: lockerData('Water dispenser') });
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
