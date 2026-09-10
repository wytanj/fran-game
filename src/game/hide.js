import * as THREE from 'three';
import { headerTexture } from '../store/labels.js';
import { brand } from '../brand.js';

/**
 * Hide spots: 0.7 × 0.7 m volumes. Walk in and stop to hide; any move input
 * pops you back out. Scoffing (loose → banked) happens while hidden and is
 * driven by run.js; this module owns the volumes and their floor glow.
 */
const SETTLE = 0.25;

export function createHideSpots(scene, spots) {
  const group = new THREE.Group();
  group.name = 'hide-spots';
  scene.add(group);

  const ringGeo = new THREE.RingGeometry(0.3, 0.38, 40);
  const discGeo = new THREE.CircleGeometry(0.3, 40);
  const labelTex = headerTexture('HIDE', { bg: '#5bbfe0', fg: '#3a2415', w: 320, h: 120, size: 78 });

  const visuals = spots.map((spot) => {
    const ringMat = new THREE.MeshBasicMaterial({
      color: brand.blue,
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
    });
    const discMat = new THREE.MeshBasicMaterial({
      color: brand.blue,
      transparent: true,
      opacity: 0.16,
      depthWrite: false,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(spot.x, 0.02, spot.z);
    const disc = new THREE.Mesh(discGeo, discMat);
    disc.rotation.x = -Math.PI / 2;
    disc.position.set(spot.x, 0.015, spot.z);
    const label = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: labelTex, transparent: true, depthWrite: false }),
    );
    label.scale.set(0.42, 0.16, 1);
    label.position.set(spot.x, 0.95, spot.z);
    group.add(ring, disc, label);
    return { spot, ring, disc, label, ringMat, discMat };
  });

  let current = null;
  let hidden = false;
  let still = 0;

  function spotAt(x, z) {
    for (const s of spots) {
      if (Math.abs(x - s.x) <= s.size / 2 && Math.abs(z - s.z) <= s.size / 2) return s;
    }
    return null;
  }

  function update(dt, time, x, z, moving) {
    const inside = spotAt(x, z);
    if (inside && !moving) still += dt;
    else still = 0;
    const wasHidden = hidden;
    hidden = !!inside && still >= SETTLE;
    current = inside;

    for (const v of visuals) {
      const active = hidden && v.spot === current;
      const wave = Math.sin(time * 3 + v.spot.x);
      v.ring.scale.setScalar(active ? 1.18 : 1 + wave * 0.05);
      v.ringMat.color.setHex(active ? brand.yellow : brand.blue);
      v.discMat.color.setHex(active ? brand.yellow : brand.blue);
      v.ringMat.opacity = active ? 0.95 : 0.55 + wave * 0.15;
      v.discMat.opacity = active ? 0.32 : 0.14;
      v.label.visible = !active;
    }

    return {
      hidden,
      entered: hidden && !wasHidden,
      exited: !hidden && wasHidden,
      spot: current,
    };
  }

  function reset() {
    hidden = false;
    current = null;
    still = 0;
  }

  return {
    update,
    reset,
    spots,
    get hidden() {
      return hidden;
    },
    get spot() {
      return current;
    },
  };
}
