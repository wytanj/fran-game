import * as THREE from 'three';
import { brand } from './brand.js';
import { fixtureAabbs, onWalkable, walkRegion, doors } from './store/layout.js';

const RADIUS = 0.22;
const HOVER = 0.62;
const SPEED = 2.35;

function chromaKeyWisp(texture) {
  const img = texture.image;
  if (!img || !img.width) return texture;
  const src = document.createElement('canvas');
  src.width = img.width;
  src.height = img.height;
  const ctx = src.getContext('2d');
  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0, 0, src.width, src.height);
  const px = data.data;
  let minX = src.width;
  let minY = src.height;
  let maxX = 0;
  let maxY = 0;
  for (let y = 0; y < src.height; y += 1) {
    for (let x = 0; x < src.width; x += 1) {
      const i = (y * src.width + x) * 4;
      const r = px[i];
      const g = px[i + 1];
      const b = px[i + 2];
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const isCream = r > 208 && g > 198 && b > 178 && max - min < 42;
      if (isCream) {
        px[i + 3] = 0;
      } else {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }
  ctx.putImageData(data, 0, 0);
  const pad = 8;
  minX = Math.max(0, minX - pad);
  minY = Math.max(0, minY - pad);
  maxX = Math.min(src.width, maxX + pad);
  maxY = Math.min(src.height, maxY + pad);
  const w = Math.max(1, maxX - minX);
  const h = Math.max(1, maxY - minY);
  const cropped = document.createElement('canvas');
  cropped.width = w;
  cropped.height = h;
  cropped.getContext('2d').drawImage(src, minX, minY, w, h, 0, 0, w, h);
  const keyed = new THREE.CanvasTexture(cropped);
  keyed.colorSpace = THREE.SRGBColorSpace;
  keyed.needsUpdate = true;
  return keyed;
}

export function createWisp(scene, spawn) {
  const root = new THREE.Group();
  root.position.set(spawn.x, HOVER, spawn.z);
  scene.add(root);

  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(0.07, 12, 10),
    new THREE.MeshBasicMaterial({
      color: 0xffe14d,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
    }),
  );
  glow.position.set(0, -0.02, -0.04);
  root.add(glow);

  const halo = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 14, 10),
    new THREE.MeshBasicMaterial({
      color: 0xffd27a,
      transparent: true,
      opacity: 0.1,
      depthWrite: false,
    }),
  );
  halo.position.z = -0.05;
  root.add(halo);

  const spriteMat = new THREE.SpriteMaterial({
    color: 0xffffff,
    transparent: true,
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(spriteMat);
  sprite.scale.set(0.55, 0.55, 1);
  sprite.position.y = 0.04;
  root.add(sprite);

  new THREE.TextureLoader().load('/textures/wisp.jpg', (tex) => {
    tex.colorSpace = THREE.SRGBColorSpace;
    const keyed = chromaKeyWisp(tex);
    spriteMat.map = keyed;
    spriteMat.needsUpdate = true;
    const img = keyed.image;
    const aspect = img.width / img.height;
    const h = 0.7;
    sprite.scale.set(h * aspect, h, 1);
  });

  const light = new THREE.PointLight(0xffe14d, 3.2, 6, 1.7);
  light.position.set(0, 0.08, 0);
  root.add(light);

  const person = new THREE.Group();
  person.visible = false;
  root.add(person);
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xf2d2ae, roughness: 0.55 });
  const clothMat = new THREE.MeshStandardMaterial({ color: 0x3a2415, roughness: 0.5 });
  const accentMat = new THREE.MeshStandardMaterial({
    color: 0xffe14d,
    emissive: 0xffe14d,
    emissiveIntensity: 0.25,
    roughness: 0.4,
  });

  let mode = 'wisp';
  let heightCm = 165;

  function clearPerson() {
    while (person.children.length) {
      const child = person.children[0];
      person.remove(child);
      child.geometry?.dispose();
    }
  }

  function rebuildPerson() {
    clearPerson();
    const h = heightCm / 100;
    if (h < 0.03) {
      const disc = new THREE.Mesh(new THREE.CircleGeometry(0.14, 24), accentMat);
      disc.rotation.x = -Math.PI / 2;
      disc.position.y = 0.01;
      person.add(disc);
      return;
    }
    const headR = Math.max(0.035, Math.min(0.12, h * 0.072));
    const eyeY = h * 0.93;
    const shoulderY = h * 0.81;
    const hipY = h * 0.52;
    const torsoH = Math.max(0.06, shoulderY - hipY);
    const legH = Math.max(0.04, hipY - 0.02);
    const armH = Math.max(0.06, h * 0.36);

    const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.02, 16), clothMat);
    foot.position.y = 0.01;
    person.add(foot);

    const legs = new THREE.Mesh(new THREE.CylinderGeometry(h * 0.045, h * 0.05, legH, 12), clothMat);
    legs.position.y = 0.02 + legH / 2;
    person.add(legs);

    const torso = new THREE.Mesh(new THREE.CylinderGeometry(h * 0.07, h * 0.055, torsoH, 14), clothMat);
    torso.position.y = hipY + torsoH / 2;
    person.add(torso);

    const armL = new THREE.Mesh(new THREE.CylinderGeometry(h * 0.018, h * 0.02, armH, 8), clothMat);
    armL.position.set(-h * 0.09, shoulderY - armH * 0.38, 0);
    armL.rotation.z = 0.12;
    const armR = armL.clone();
    armR.position.x = h * 0.09;
    armR.rotation.z = -0.12;
    person.add(armL, armR);

    const head = new THREE.Mesh(new THREE.SphereGeometry(headR, 16, 12), skinMat);
    head.position.y = h - headR;
    person.add(head);

    const sash = new THREE.Mesh(new THREE.TorusGeometry(h * 0.072, 0.012, 8, 18), accentMat);
    sash.rotation.x = Math.PI / 2;
    sash.position.y = shoulderY;
    person.add(sash);

    const eye = new THREE.Mesh(
      new THREE.RingGeometry(0.015, 0.022, 16),
      new THREE.MeshBasicMaterial({ color: 0xffe14d, side: THREE.DoubleSide }),
    );
    eye.position.set(0, eyeY, headR * 0.85);
    person.add(eye);
  }

  const blob = new THREE.Mesh(
    new THREE.CircleGeometry(0.2, 20),
    new THREE.MeshBasicMaterial({
      color: 0x3a2415,
      transparent: true,
      opacity: 0.16,
      depthWrite: false,
    }),
  );
  blob.rotation.x = -Math.PI / 2;
  scene.add(blob);

  const pointsGeo = new THREE.BufferGeometry();
  const COUNT = 40;
  const pos = new Float32Array(COUNT * 3);
  pointsGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const points = new THREE.Points(
    pointsGeo,
    new THREE.PointsMaterial({
      color: 0xffe14d,
      size: 0.04,
      transparent: true,
      opacity: 0.75,
      depthWrite: false,
    }),
  );
  scene.add(points);
  const particles = Array.from({ length: COUNT }, () => ({
    x: 0,
    y: 0,
    z: 0,
    life: Math.random(),
  }));

  const velocity = new THREE.Vector3();
  const wish = new THREE.Vector3();
  const dest = new THREE.Vector3(spawn.x, 0, spawn.z);
  let hasDest = false;
  let waypoints = [];
  const boxes = fixtureAabbs();

  function routeTo(x, z) {
    const from = walkRegion(root.position.x, root.position.z);
    const to = walkRegion(x, z);
    const path = [];
    if (from !== to) {
      if (from === 'locker') path.push(doors.locker.inside, doors.locker.approach, doors.locker.aisle);
      if (from === 'stock') path.push(doors.stock.inside, doors.stock.approach, doors.stock.aisle);
      if (to === 'stock') path.push(doors.stock.aisle, doors.stock.approach, doors.stock.inside);
      if (to === 'locker') path.push(doors.locker.aisle, doors.locker.approach, doors.locker.inside);
    }
    path.push({ x, z });
    return path;
  }

  function overlaps(x, z, b) {
    return x + RADIUS > b.x0 && x - RADIUS < b.x1 && z + RADIUS > b.z0 && z - RADIUS < b.z1
      && Math.hypot(x - Math.max(b.x0, Math.min(x, b.x1)), z - Math.max(b.z0, Math.min(z, b.z1))) < RADIUS;
  }

  function blocked(x, z) {
    if (!onWalkable(x, z)) return true;
    for (const b of boxes) {
      if (b.ghost) continue;
      if (overlaps(x, z, b)) return true;
    }
    return false;
  }

  function collide(nx, nz) {
    const x0 = root.position.x;
    const z0 = root.position.z;
    if (!blocked(nx, nz)) return { x: nx, z: nz };
    if (!blocked(nx, z0)) return { x: nx, z: z0 };
    if (!blocked(x0, nz)) return { x: x0, z: nz };
    return { x: x0, z: z0 };
  }

  return {
    root,
    get position() {
      return root.position;
    },
    setWish(x, z) {
      wish.set(x, 0, z);
    },
    walkTo(x, z) {
      waypoints = routeTo(x, z);
      const first = waypoints.shift();
      dest.set(first.x, 0, first.z);
      hasDest = true;
    },
    clearDest() {
      hasDest = false;
      waypoints = [];
    },
    mode: 'wisp',
    heightCm: 165,
    setMode(next) {
      mode = next === 'height' ? 'height' : 'wisp';
      this.mode = mode;
      const isWisp = mode === 'wisp';
      sprite.visible = isWisp;
      glow.visible = isWisp;
      halo.visible = isWisp;
      points.visible = isWisp;
      person.visible = !isWisp;
      light.intensity = isWisp ? 3.2 : 1.1;
      if (!isWisp) rebuildPerson();
    },
    setHeightCm(cm) {
      heightCm = Math.max(0, Math.min(250, Number(cm) || 0));
      this.heightCm = heightCm;
      if (mode === 'height') rebuildPerson();
    },
    getFocusY() {
      if (mode !== 'height') return 0.7;
      const h = heightCm / 100;
      if (h < 0.05) return 0.35;
      return THREE.MathUtils.clamp(h * 0.55, 0.4, 1.7);
    },
    update(dt, time) {
      if (hasDest) {
        const dx = dest.x - root.position.x;
        const dz = dest.z - root.position.z;
        const d = Math.hypot(dx, dz);
        if (d < 0.14) {
          if (waypoints.length) {
            const nextWp = waypoints.shift();
            dest.set(nextWp.x, 0, nextWp.z);
          } else {
            hasDest = false;
          }
        } else wish.set(dx / d, 0, dz / d);
      }

      const len = wish.length();
      if (len > 1) wish.multiplyScalar(1 / len);
      velocity.lerp(wish, 1 - Math.exp(-10 * dt));
      if (velocity.length() > 0.04) {
        const step = SPEED * dt;
        const next = collide(
          root.position.x + velocity.x * step,
          root.position.z + velocity.z * step,
        );
        root.position.x = next.x;
        root.position.z = next.z;
      }
      if (mode === 'wisp') {
        root.position.y = HOVER + Math.sin(time * 2.4) * 0.05;
        glow.scale.setScalar(1 + Math.sin(time * 3.1) * 0.04);
        halo.scale.setScalar(1 + Math.sin(time * 2.6) * 0.06);
      } else {
        root.position.y = 0;
      }
      blob.position.set(root.position.x, 0.015, root.position.z);

      const arr = points.geometry.attributes.position.array;
      for (let i = 0; i < COUNT; i += 1) {
        const p = particles[i];
        p.life += dt * 0.85;
        if (p.life > 1) {
          p.life = 0;
          p.x = root.position.x + (Math.random() - 0.5) * 0.12;
          p.y = root.position.y - 0.05;
          p.z = root.position.z + (Math.random() - 0.5) * 0.12;
        }
        p.y += dt * 0.2;
        arr[i * 3] = p.x;
        arr[i * 3 + 1] = p.y;
        arr[i * 3 + 2] = p.z;
      }
      points.geometry.attributes.position.needsUpdate = true;
      wish.set(0, 0, 0);
    },
  };
}
