import * as THREE from 'three';
import { onWalkable } from '../store/layout.js';

/**
 * WASD / arrows / left stick to move, Space or the Yoink button (hold) to
 * yoink, click or tap the floor to walk there. Camera-relative, fixed view.
 */
export function createInput(canvas, camera, view, { onWalkTo } = {}) {
  const keys = new Set();
  const joy = { x: 0, z: 0 };
  let yoinkKey = false;
  let yoinkBtn = false;
  let enabled = false;

  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const floor = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const hit = new THREE.Vector3();
  const down = { x: 0, y: 0, id: null };

  const MOVE_KEYS = new Set(['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright']);

  window.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    if (k === ' ' || k === 'spacebar') {
      if (e.target instanceof HTMLButtonElement) return;
      yoinkKey = true;
      e.preventDefault();
      return;
    }
    if (MOVE_KEYS.has(k)) {
      keys.add(k);
      if (k.startsWith('arrow')) e.preventDefault();
    }
  });
  window.addEventListener('keyup', (e) => {
    const k = e.key.toLowerCase();
    if (k === ' ' || k === 'spacebar') yoinkKey = false;
    keys.delete(k);
  });
  window.addEventListener('blur', () => {
    keys.clear();
    yoinkKey = false;
    yoinkBtn = false;
  });

  const btn = document.getElementById('btn-yoink');
  if (btn) {
    const hold = (e) => {
      e.preventDefault();
      yoinkBtn = true;
      btn.classList.add('is-held');
      try {
        btn.setPointerCapture(e.pointerId);
      } catch {
        /* no-op */
      }
    };
    const release = () => {
      yoinkBtn = false;
      btn.classList.remove('is-held');
    };
    btn.addEventListener('pointerdown', hold);
    btn.addEventListener('pointerup', release);
    btn.addEventListener('pointercancel', release);
    btn.addEventListener('lostpointercapture', release);
    btn.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  bindJoystick(joy);

  canvas.addEventListener('pointerdown', (e) => {
    down.x = e.clientX;
    down.y = e.clientY;
    down.id = e.pointerId;
  });
  canvas.addEventListener('pointerup', (e) => {
    if (!enabled || e.pointerId !== down.id) return;
    if (Math.hypot(e.clientX - down.x, e.clientY - down.y) > 8) return;
    const rect = canvas.getBoundingClientRect();
    ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    ray.setFromCamera(ndc, camera);
    if (ray.ray.intersectPlane(floor, hit) && onWalkable(hit.x, hit.z)) onWalkTo?.(hit.x, hit.z);
  });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());

  const out = new THREE.Vector3();

  /** Camera-relative wish direction in world XZ, or null when idle. */
  function wish() {
    if (!enabled) return null;
    let x = joy.x;
    let z = joy.z;
    if (keys.has('w') || keys.has('arrowup')) z += 1;
    if (keys.has('s') || keys.has('arrowdown')) z -= 1;
    if (keys.has('a') || keys.has('arrowleft')) x -= 1;
    if (keys.has('d') || keys.has('arrowright')) x += 1;
    if (x === 0 && z === 0) return null;
    out.set(0, 0, 0);
    out.addScaledVector(view.right, x);
    out.addScaledVector(view.fwd, z);
    if (out.lengthSq() > 1) out.normalize();
    return { x: out.x, z: out.z };
  }

  return {
    wish,
    get yoink() {
      return enabled && (yoinkKey || yoinkBtn);
    },
    get anyMove() {
      return keys.size > 0 || joy.x !== 0 || joy.z !== 0;
    },
    setEnabled(v) {
      enabled = !!v;
      if (!v) {
        keys.clear();
        yoinkKey = false;
      }
    },
  };
}

function bindJoystick(joy) {
  const root = document.getElementById('joystick');
  const knob = document.getElementById('joystick-knob');
  if (!root || !knob) return;
  const base = root.querySelector('.joystick-base');
  let active = false;
  let rest = 36;

  function setFrom(e) {
    const rect = base.getBoundingClientRect();
    rest = rect.width / 2 - knob.offsetWidth / 2;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let dx = e.clientX - cx;
    let dy = e.clientY - cy;
    const max = rect.width / 2 - 8;
    const len = Math.hypot(dx, dy) || 1;
    if (len > max) {
      dx = (dx / len) * max;
      dy = (dy / len) * max;
    }
    knob.style.left = `${rest + dx}px`;
    knob.style.top = `${rest + dy}px`;
    joy.x = dx / max;
    joy.z = -dy / max;
  }

  function clear() {
    active = false;
    knob.style.left = `${rest}px`;
    knob.style.top = `${rest}px`;
    joy.x = 0;
    joy.z = 0;
  }

  base.addEventListener('pointerdown', (e) => {
    active = true;
    base.setPointerCapture(e.pointerId);
    setFrom(e);
  });
  base.addEventListener('pointermove', (e) => {
    if (active) setFrom(e);
  });
  base.addEventListener('pointerup', clear);
  base.addEventListener('pointercancel', clear);
}
