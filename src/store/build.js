import * as THREE from 'three';
import {
  PLAN,
  BAY,
  gondolas,
  wallBays,
  columns,
  cashier,
  queueFixtures,
  experience,
  stockRoom,
  locker,
  stockRacks,
  entrance,
  BOH,
  bohWalls,
  staffDesk,
  managerDesk,
  receiving,
} from './layout.js';
import { createMaterials } from './materials.js';
import { createStocker } from './products.js';
import {
  makeWallBay,
  makeGondola,
  makeCashier,
  makeExperience,
  makeEntrance,
  makeColumn,
  makeQueue,
  makeRoom,
  makeRack,
  makeDesk,
  makeReceiving,
  makeBohWalls,
  makeStockDoor,
  box,
} from './fixtures.js';
import { headerTexture } from './labels.js';

export function buildStore(scene) {
  const mats = createMaterials();
  const stocker = createStocker();
  const root = new THREE.Group();
  root.name = 'store';

  const floors = group('floors', 'floor');
  const walls = group('walls', 'wall');
  const ceilings = group('ceilings', 'hide');
  root.add(floors, walls, ceilings);

  buildEnvelope(root, mats, floors, walls);
  buildCeiling(ceilings, mats);
  buildLights(root);

  root.add(makeCashier(mats, cashier));
  for (const q of queueFixtures) root.add(makeQueue(mats, q));
  for (const g of gondolas) root.add(makeGondola(mats, g, stocker));
  for (const b of wallBays) root.add(makeWallBay(mats, b, stocker));
  for (const c of columns) root.add(makeColumn(mats, c));
  root.add(makeExperience(mats, experience, stocker));
  root.add(makeEntrance(mats, entrance));
  root.add(makeBohWalls(mats, bohWalls.filter((w) => !w.id.startsWith('stock-n')), BOH.ceiling));
  root.add(makeStockDoor(mats, BOH.stock.door, BOH.ceiling));
  root.add(
    makeRoom(mats, locker, 'locker', {
      wall: 'e',
      from: locker.door.z0,
      to: locker.door.z1,
    }),
  );
  root.add(makeDesk(mats, staffDesk));
  root.add(makeDesk(mats, managerDesk));
  root.add(makeReceiving(mats, receiving));
  for (const r of stockRacks) root.add(makeRack(mats, r));
  buildBohCeiling(ceilings, mats);

  stocker.build(root);
  scene.add(root);
  return { root, mats, stocker };
}

function group(name, xray) {
  const g = new THREE.Group();
  g.name = name;
  g.userData.xray = xray;
  return g;
}

function buildEnvelope(root, mats, floors, walls) {
  const W = PLAN.width;
  const D = PLAN.depthWest;
  const H = PLAN.ceiling;

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(W + 0.4, D + 0.4), mats.floor);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(W / 2, 0, D / 2);
  floor.receiveShadow = true;
  floors.add(floor);

  const terra = new THREE.Mesh(new THREE.PlaneGeometry(7.8, 4.4), mats.terrazzo);
  terra.rotation.x = -Math.PI / 2;
  terra.position.set(15.4, 0.005, 8.15);
  terra.receiveShadow = true;
  floors.add(terra);

  const mallFloor = new THREE.Mesh(new THREE.PlaneGeometry(10, 16), mats.mallFloor);
  mallFloor.rotation.x = -Math.PI / 2;
  mallFloor.position.set(W + 5.1, -0.02, 4.2);
  mallFloor.receiveShadow = true;
  floors.add(mallFloor);

  const apron = new THREE.Mesh(
    new THREE.PlaneGeometry(2.6, entrance.z1 - entrance.z0 + 0.8),
    mats.portalFloor,
  );
  apron.rotation.x = -Math.PI / 2;
  apron.position.set(W + 1.55, 0.001, (entrance.z0 + entrance.z1) / 2);
  apron.receiveShadow = true;
  floors.add(apron);

  addFloor(floors, mats.floor, BOH.stock.x1 - BOH.stock.x0, BOH.stock.eastZ1 - BOH.stock.z0, (BOH.stock.x0 + BOH.stock.x1) / 2, (BOH.stock.z0 + BOH.stock.eastZ1) / 2);
  addFloor(floors, mats.floor, BOH.stock.jogX - BOH.stock.x0, BOH.stock.z1 - BOH.stock.eastZ1, (BOH.stock.x0 + BOH.stock.jogX) / 2, (BOH.stock.eastZ1 + BOH.stock.z1) / 2);
  addFloor(floors, mats.floor, locker.w, locker.d, locker.x, locker.z);

  box(mats.wall, W + 0.3, H, 0.14, W / 2, H / 2, -0.05, walls, false);
  box(mats.wall, 0.14, H, 5.55, -0.05, H / 2, 2.7, walls, false);
  box(mats.wall, 0.14, H, 0.55, -0.05, H / 2, 6.92, walls, false);
  const door = BOH.stock.door;
  box(mats.wall, door.x0, H, 0.14, door.x0 / 2, H / 2, D, walls, false);
  const southEastW = 11.17 - door.x1;
  box(mats.wall, southEastW, H, 0.14, door.x1 + southEastW / 2, H / 2, D, walls, false);

  const open0 = entrance.z0;
  const open1 = entrance.z1;
  box(mats.wall, 0.16, H, open0 + 0.2, W, H / 2, open0 / 2 - 0.1, walls, false);
  box(mats.wall, 0.16, H, D - open1 + 0.4, W, H / 2, (open1 + D) / 2 + 0.1, walls, false);

  const glass = new THREE.Mesh(new THREE.PlaneGeometry(5.6, H - 0.2), mats.glassClear);
  glass.position.set(18.15, H / 2, 8.55);
  glass.rotation.y = 0.85;
  walls.add(glass);
  const glass2 = new THREE.Mesh(new THREE.PlaneGeometry(3.4, H - 0.2), mats.glassClear);
  glass2.position.set(17.35, H / 2, 10.15);
  glass2.rotation.y = 1.15;
  walls.add(glass2);

  const mall = group('mall', 'hide');
  box(mats.mall, 1.2, 5.2, 5.4, W + 0.7, 2.5, -1.85, mall, false);
  box(mats.mall, 1.2, 5.2, 6.2, W + 0.7, 2.5, 9.6, mall, false);
  const corridor = new THREE.Mesh(new THREE.PlaneGeometry(9, 5.2), mats.wallInner);
  corridor.position.set(W + 6.8, 2.4, 3.4);
  corridor.rotation.y = -Math.PI / 2;
  mall.add(corridor);
  const mallWash = new THREE.PointLight(0xf2ebe0, 3.4, 12, 1.6);
  mallWash.position.set(W + 3.4, 3.4, 3.4);
  mall.add(mallWash);
  root.add(mall);
}

function buildCeiling(root, mats) {
  const W = PLAN.width;
  const D = PLAN.depthWest;
  const y = PLAN.ceiling;

  const main = new THREE.Mesh(new THREE.PlaneGeometry(W - 3.2, D - 0.4), mats.ceiling);
  main.rotation.x = Math.PI / 2;
  main.position.set(W / 2, y, D / 2);
  root.add(main);

  // Barrisol strips 1.5m along north and south.
  const north = new THREE.Mesh(new THREE.PlaneGeometry(W - 1.2, 1.5), mats.barrisol);
  north.rotation.x = Math.PI / 2;
  north.position.set(W / 2, y - 0.04, 0.85);
  root.add(north);
  const south = new THREE.Mesh(new THREE.PlaneGeometry(12.5, 1.5), mats.barrisol);
  south.rotation.x = Math.PI / 2;
  south.position.set(8.4, y - 0.04, D - 0.85);
  root.add(south);

  // Exposed ceiling band above special display.
  const exp = new THREE.Mesh(new THREE.PlaneGeometry(5.8, 4.2), mats.exposed);
  exp.rotation.x = Math.PI / 2;
  exp.position.set(16.5, PLAN.ceilingSlab, 8.1);
  root.add(exp);

  // Track-light bars over the gondola aisles.
  for (const z of [2.15, 3.7, 5.25]) {
    for (let i = 0; i < 8; i += 1) {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.05, 0.55), mats.black);
      bar.position.set(5.4 + i * 1.45, y - 0.08, z);
      root.add(bar);
    }
  }
}

function buildLights(root) {
  const hemi = new THREE.HemisphereLight(0xfff6e4, 0x8a8680, 0.7);
  root.add(hemi);

  const sun = new THREE.DirectionalLight(0xfff3d6, 1.15);
  sun.position.set(22, 11, 4);
  sun.target.position.set(10, 0, 4);
  sun.castShadow = !new URLSearchParams(location.search).has('noshadow');
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 40;
  sun.shadow.camera.left = -16;
  sun.shadow.camera.right = 8;
  sun.shadow.camera.top = 10;
  sun.shadow.camera.bottom = -8;
  sun.shadow.bias = -0.00025;
  root.add(sun);
  root.add(sun.target);

  const fill = new THREE.DirectionalLight(0xdde7ee, 0.28);
  fill.position.set(4, 8, 12);
  root.add(fill);

  // Barrisol wash.
  const north = new THREE.RectAreaLight(0xfff1b8, 4.5, 16, 1.4);
  north.position.set(10, PLAN.ceiling - 0.06, 0.85);
  north.rotation.x = -Math.PI / 2;
  root.add(north);
  const south = new THREE.RectAreaLight(0xfff1b8, 3.4, 12, 1.4);
  south.position.set(8.4, PLAN.ceiling - 0.06, PLAN.depthWest - 0.85);
  south.rotation.x = -Math.PI / 2;
  root.add(south);
}

function addFloor(root, mat, w, d, x, z) {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(x, 0.004, z);
  mesh.receiveShadow = true;
  root.add(mesh);
}

function gridCeilingTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ece6dc';
  ctx.fillRect(0, 0, 256, 256);
  ctx.strokeStyle = '#b7b1a6';
  ctx.lineWidth = 10;
  ctx.strokeRect(2, 2, 252, 252);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set((BOH.stock.x1 - BOH.stock.x0) / 0.6, (BOH.stock.z1 - BOH.stock.z0) / 0.6);
  return tex;
}

function buildBohCeiling(root, mats) {
  const y = BOH.ceiling;
  const mat = new THREE.MeshStandardMaterial({
    map: gridCeilingTexture(),
    roughness: 0.88,
    metalness: 0.04,
    side: THREE.FrontSide,
  });
  const main = new THREE.Mesh(
    new THREE.PlaneGeometry(BOH.stock.x1 - BOH.stock.x0, BOH.stock.eastZ1 - BOH.stock.z0),
    mat,
  );
  main.rotation.x = Math.PI / 2;
  main.position.set((BOH.stock.x0 + BOH.stock.x1) / 2, y, (BOH.stock.z0 + BOH.stock.eastZ1) / 2);
  root.add(main);
  const deep = new THREE.Mesh(
    new THREE.PlaneGeometry(BOH.stock.jogX - BOH.stock.x0, BOH.stock.z1 - BOH.stock.eastZ1),
    mat,
  );
  deep.rotation.x = Math.PI / 2;
  deep.position.set((BOH.stock.x0 + BOH.stock.jogX) / 2, y, (BOH.stock.eastZ1 + BOH.stock.z1) / 2);
  root.add(deep);

  const lockerCeil = new THREE.Mesh(new THREE.PlaneGeometry(locker.w, locker.d), mat);
  lockerCeil.rotation.x = Math.PI / 2;
  lockerCeil.position.set(locker.x, y, locker.z);
  root.add(lockerCeil);

  const panelMat = new THREE.MeshStandardMaterial({
    color: 0xfff4c2,
    emissive: 0xffe9a0,
    emissiveIntensity: 0.7,
    roughness: 0.4,
  });
  const panels = [
    [3.4, 8.2],
    [5.2, 8.2],
    [7.0, 8.2],
    [8.8, 8.2],
    [3.4, 10.2],
    [5.2, 10.2],
    [7.0, 10.2],
    [8.2, 10.2],
    [locker.x - 0.4, locker.z],
    [locker.x + 0.4, locker.z],
  ];
  for (const [x, z] of panels) {
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(0.58, 0.58), panelMat);
    panel.rotation.x = Math.PI / 2;
    panel.position.set(x, y - 0.02, z);
    root.add(panel);
    const lamp = new THREE.PointLight(0xfff1c2, 1.6, 4.2, 1.8);
    lamp.position.set(x, y - 0.12, z);
    root.add(lamp);
  }

  const title = new THREE.Mesh(
    new THREE.PlaneGeometry(1.8, 0.26),
    new THREE.MeshBasicMaterial({
      map: headerTexture('stock room  34 m²', { bg: '#8d8d8d', fg: '#fffef5', w: 900, size: 64 }),
      toneMapped: false,
    }),
  );
  title.position.set(6.8, 2.05, 7.08);
  root.add(title);
}

void BAY;
void stockRoom;
