import * as THREE from 'three';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { buildStore } from './store/build.js';
import { createWisp } from './wisp.js';
import { spawn, blockersAt } from './store/layout.js';
import { createRun } from './game/run.js';

/**
 * FRAN GAME boot. Same renderer / scene setup as fran-zone, the frame loop is
 * the run state machine. No plan mode, no orbit, no VM inspect.
 */
async function boot() {
  try {
    await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 2500))]);

    RectAreaLightUniformsLib.init();

    const canvas = document.getElementById('store');
    const params = new URLSearchParams(location.search);
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    const noShadow = params.has('noshadow') || (coarse && !params.has('shadow'));

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: !coarse,
      alpha: false,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, coarse ? 1.5 : 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = !noShadow;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1c1914);
    scene.fog = new THREE.Fog(0x1c1914, 22, 42);

    const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.08, 80);

    const built = buildStore(scene);
    const wisp = createWisp(scene, spawn);
    const run = createRun({ scene, camera, canvas, storeRoot: built.root, wisp });

    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    const clock = new THREE.Clock();
    function frame() {
      const dt = Math.min(clock.getDelta(), 0.05);
      run.update(dt, clock.elapsedTime);
      renderer.render(scene, camera);
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);

    window.__franGame = {
      scene,
      camera,
      renderer,
      wisp,
      run,
      blockersAt,
      walkTo: (x, z) => wisp.walkTo(x, z),
    };
  } catch (err) {
    console.error(err);
    const el = document.getElementById('boot-error');
    if (el) {
      el.hidden = false;
      el.textContent = `Could not start the dream: ${err.message}`;
    }
  }
}

boot();
