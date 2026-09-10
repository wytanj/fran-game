import * as THREE from 'three';
import { brand, retail } from '../brand.js';

const loader = new THREE.TextureLoader();

function color(hex, opts = {}) {
  return new THREE.MeshStandardMaterial({
    color: hex,
    roughness: opts.roughness ?? 0.72,
    metalness: opts.metalness ?? 0.04,
    emissive: opts.emissive ?? 0x000000,
    emissiveIntensity: opts.emissiveIntensity ?? 0,
    transparent: opts.transparent ?? false,
    opacity: opts.opacity ?? 1,
    side: opts.side ?? THREE.FrontSide,
  });
}

export function loadTexture(url, repeatX = 1, repeatY = 1) {
  const tex = loader.load(url);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.anisotropy = 8;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createMaterials() {
  const floorMap = loadTexture('/textures/microcement.jpg', 8, 4);
  const terrazzoMap = loadTexture('/textures/terrazzo.jpg', 4, 3);

  return {
    floor: new THREE.MeshStandardMaterial({
      map: floorMap,
      color: 0xd8d8d2,
      roughness: 0.92,
      metalness: 0.02,
    }),
    terrazzo: new THREE.MeshStandardMaterial({
      map: terrazzoMap,
      roughness: 0.78,
      metalness: 0.04,
    }),
    wall: color(retail.wall, { roughness: 0.88 }),
    wallInner: color(0xdedad2, { roughness: 0.86 }),
    wallBay: color(retail.wallBay, { roughness: 0.55, metalness: 0.12 }),
    gondola: color(retail.gondola, { roughness: 0.48, metalness: 0.18 }),
    gondolaDark: color(retail.gondolaDark, { roughness: 0.5, metalness: 0.2 }),
    shelf: color(0x9b9b9b, { roughness: 0.42, metalness: 0.22 }),
    header: color(retail.header, { roughness: 0.45 }),
    drawer: color(retail.drawer, { roughness: 0.86 }),
    ceiling: color(retail.ceiling, { roughness: 0.9 }),
    exposed: color(retail.exposed, { roughness: 0.7, metalness: 0.15 }),
    barrisol: color(retail.barrisol, {
      roughness: 0.35,
      emissive: 0xfff1b0,
      emissiveIntensity: 0.55,
    }),
    canopy: color(brand.yellow, {
      roughness: 0.4,
      emissive: brand.yellow,
      emissiveIntensity: 0.35,
    }),
    fascia: color(retail.fascia, { roughness: 0.38, metalness: 0.45 }),
    steel: color(retail.steel, { roughness: 0.32, metalness: 0.62 }),
    column: color(retail.column, { roughness: 0.4, metalness: 0.25 }),
    glass: color(retail.glass, {
      roughness: 0.08,
      metalness: 0.05,
      transparent: true,
      opacity: 0.22,
      side: THREE.DoubleSide,
    }),
    glassClear: color(0xd7eef6, {
      roughness: 0.06,
      metalness: 0.02,
      transparent: true,
      opacity: 0.16,
      side: THREE.DoubleSide,
    }),
    portalGlass: color(0xeef6ff, {
      roughness: 0.04,
      metalness: 0.06,
      transparent: true,
      opacity: 0.2,
      emissive: 0xfff4d4,
      emissiveIntensity: 0.18,
      side: THREE.DoubleSide,
    }),
    portalFloor: color(0xf7f2e6, { roughness: 0.55 }),
    portalSoffit: color(0xfff4c2, {
      roughness: 0.32,
      emissive: 0xffe9a8,
      emissiveIntensity: 0.7,
    }),
    fridgeGlass: color(0xc5d8e2, {
      roughness: 0.12,
      metalness: 0.08,
      transparent: true,
      opacity: 0.28,
    }),
    mall: color(retail.mall, { roughness: 0.95 }),
    mallFloor: color(0x1a1814, { roughness: 0.9 }),
    hose: color(0xb42318, { roughness: 0.55 }),
    counter: color(0x6f6f6f, { roughness: 0.35, metalness: 0.35 }),
    counterGlow: color(brand.yellow, {
      roughness: 0.35,
      emissive: brand.yellow,
      emissiveIntensity: 0.22,
    }),
    black: color(0x141414, { roughness: 0.4 }),
    cream: color(brand.cream, { roughness: 0.85 }),
  };
}
