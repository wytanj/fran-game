import * as THREE from 'three';

const cache = new Map();

export function headerTexture(text, opts = {}) {
  const key = `h:${text}:${opts.w ?? 1024}`;
  if (cache.has(key)) return cache.get(key);

  const w = opts.w ?? 1024;
  const h = opts.h ?? 220;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = opts.bg ?? '#141414';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = opts.fg ?? '#ffe14d';
  ctx.font = `700 ${opts.size ?? 92}px "Barlow Condensed", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, w / 2, h / 2 + 6);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  cache.set(key, tex);
  return tex;
}

export function graffitiTexture() {
  if (cache.has('graffiti')) return cache.get('graffiti');
  const w = 1024;
  const h = 1536;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#d8d3c8';
  ctx.fillRect(0, 0, w, h);

  const phrases = [
    'fran',
    'FRAN',
    'you got this',
    'fran',
    'say it',
    'fran',
    'no bs',
    'fran',
    'stay soft',
    'FRAN',
    'ruthlessly warm',
    'fran',
  ];
  ctx.fillStyle = '#ffe14d';
  ctx.globalAlpha = 0.92;
  for (let i = 0; i < 28; i += 1) {
    const word = phrases[i % phrases.length];
    const x = ((i * 173) % (w - 80)) + 40;
    const y = 80 + ((i * 211) % (h - 140));
    const size = 54 + ((i * 17) % 70);
    const angle = ((i % 7) - 3) * 0.18;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.font = `700 ${size}px Caveat, cursive`;
    ctx.fillText(word, 0, 0);
    ctx.restore();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  cache.set('graffiti', tex);
  return tex;
}

export function logoStripTexture(brands) {
  const key = `logos:${brands.join(',')}`;
  if (cache.has(key)) return cache.get(key);
  const w = 1600;
  const h = 160;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#111';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#ffe14d';
  ctx.font = '600 36px "Barlow Condensed", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const slice = w / brands.length;
  brands.forEach((b, i) => {
    ctx.fillText(b.toLowerCase(), slice * i + slice / 2, h / 2);
  });
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  cache.set(key, tex);
  return tex;
}

export function fasciaTexture() {
  if (cache.has('fascia')) return cache.get('fascia');
  const w = 1600;
  const h = 480;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#b7b7b7';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#ffe14d';
  ctx.font = '800 220px "Barlow Condensed", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('fran', w / 2, h / 2 + 10);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  cache.set('fascia', tex);
  return tex;
}

export function hoseTexture() {
  if (cache.has('hose')) return cache.get('hose');
  const w = 512;
  const h = 640;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#b42318';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#fff';
  ctx.font = '800 48px "Barlow Condensed", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('FIRE', w / 2, 80);
  ctx.fillText('HOSE REEL', w / 2, 130);
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.arc(w / 2, 360, 110, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(w / 2, 250);
  ctx.lineTo(w / 2, 470);
  ctx.moveTo(w / 2 - 110, 360);
  ctx.lineTo(w / 2 + 110, 360);
  ctx.stroke();
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  cache.set('hose', tex);
  return tex;
}
