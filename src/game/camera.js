import * as THREE from 'three';

/**
 * Fixed three-quarter follow camera. No orbit, no pan, no plan mode:
 * readability beats freedom in a 60 s game.
 */
export const VIEW = { yaw: -Math.PI / 4, pitch: 0.95, dist: 6.5 };

export function createGameCamera(camera, wisp) {
  const look = new THREE.Vector3(wisp.position.x, 0.7, wisp.position.z);
  const fwd = new THREE.Vector3(-Math.sin(VIEW.yaw), 0, -Math.cos(VIEW.yaw)).normalize();
  const right = new THREE.Vector3().crossVectors(fwd, new THREE.Vector3(0, 1, 0)).normalize();

  function apply() {
    const cp = Math.cos(VIEW.pitch);
    const sp = Math.sin(VIEW.pitch);
    camera.position.set(
      look.x + Math.sin(VIEW.yaw) * cp * VIEW.dist,
      look.y + sp * VIEW.dist + 0.55,
      look.z + Math.cos(VIEW.yaw) * cp * VIEW.dist,
    );
    camera.lookAt(look.x, look.y + 0.25, look.z);
  }

  function snap() {
    look.set(wisp.position.x, 0.7, wisp.position.z);
    apply();
  }

  function update(dt) {
    const k = 1 - Math.exp(-6 * dt);
    look.x += (wisp.position.x - look.x) * k;
    look.z += (wisp.position.z - look.z) * k;
    apply();
  }

  snap();
  return { update, snap, fwd, right, look };
}
