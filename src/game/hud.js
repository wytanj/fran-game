import * as THREE from 'three';

/**
 * Game HUD: timer top-left, banked top-right, haul bottom-centre, Yoink
 * bottom-right, stick bottom-left. Plus toasts, 3D-anchored popups, the
 * framing card and the results sheet. No inspect, height, grid or plan.
 */
const CAT_COLOR = {
  skincare: '#e8d5c4',
  serum: '#c47a3a',
  makeup: '#8b1e3f',
  hair: '#5bbfe0',
  cleanser: '#9ad0c2',
  suncare: '#ffe14d',
  mask: '#7fb36b',
  theme: '#f2d2ae',
};

export function createHud() {
  const $ = (id) => document.getElementById(id);
  const tl = $('timer').parentElement;
  const timerEl = $('timer');
  const scoreEl = $('score');
  const bestEl = $('best');
  const haulEl = $('haul');
  const stackEl = $('haul-stack');
  const countEl = $('haul-count');
  const hintEl = $('hint');
  const toastsEl = $('toasts');
  const popupsEl = $('popups');
  const vignette = $('vignette');
  const card = $('card');
  const results = $('results');

  const popups = [];
  const v = new THREE.Vector3();
  let lastTimer = -1;
  let lastHint = '';

  function setTimer(sec) {
    const n = Math.max(0, Math.ceil(sec));
    if (n !== lastTimer) {
      timerEl.textContent = String(n);
      lastTimer = n;
    }
    tl.classList.toggle('is-lastcall', sec > 0 && sec <= 10);
  }

  function setBanked(n, bump = false) {
    scoreEl.textContent = String(n);
    if (bump) {
      scoreEl.classList.add('is-bump');
      setTimeout(() => scoreEl.classList.remove('is-bump'), 130);
    }
  }

  function setBest(n) {
    bestEl.textContent = `Best · ${n}`;
  }

  function setHaul(entries, slow) {
    countEl.textContent = String(entries.length);
    const show = entries.slice(-12);
    if (stackEl.childElementCount !== show.length) {
      stackEl.innerHTML = '';
      for (const e of show) {
        const bar = document.createElement('i');
        bar.style.background = CAT_COLOR[e.item.category] ?? '#c4a070';
        stackEl.appendChild(bar);
      }
    }
    haulEl.classList.toggle('is-slow', slow);
  }

  function setHidden(on) {
    haulEl.classList.toggle('is-hidden', on);
  }

  function hint(text) {
    if (text === lastHint) return;
    lastHint = text;
    hintEl.textContent = text;
  }

  function toast(text, good = false) {
    const el = document.createElement('div');
    el.className = `toast${good ? ' is-good' : ''}`;
    el.textContent = text;
    toastsEl.appendChild(el);
    while (toastsEl.childElementCount > 3) toastsEl.firstElementChild.remove();
    setTimeout(() => el.remove(), 2300);
  }

  function popup(world, text, kind = '') {
    const el = document.createElement('div');
    el.className = `popup${kind ? ` is-${kind}` : ''}`;
    el.textContent = text;
    popupsEl.appendChild(el);
    popups.push({ el, pos: world.clone(), t: 0, life: kind === 'bonus' ? 1.5 : 0.9 });
  }

  function updatePopups(camera, dt) {
    const w = window.innerWidth;
    const h = window.innerHeight;
    for (let i = popups.length - 1; i >= 0; i -= 1) {
      const p = popups[i];
      p.t += dt;
      if (p.t >= p.life) {
        p.el.remove();
        popups.splice(i, 1);
        continue;
      }
      p.pos.y += dt * 0.6;
      v.copy(p.pos).project(camera);
      p.el.style.left = `${((v.x + 1) / 2) * w}px`;
      p.el.style.top = `${((1 - v.y) / 2) * h}px`;
      p.el.style.opacity = String(1 - Math.max(0, (p.t - p.life * 0.6) / (p.life * 0.4)));
    }
  }

  function setLastCall(on) {
    vignette.classList.toggle('is-on', on);
  }

  function showCard(best) {
    const line = $('card-best');
    line.textContent = best > 0 ? `Your best on this phone · ${best}` : 'First run. Nobody is watching. Probably.';
    card.hidden = false;
    results.hidden = true;
  }

  function showResults(data) {
    $('results-kicker').textContent = data.kicker;
    $('results-title').textContent = data.title;
    $('results-score').textContent = String(data.banked);
    const rows = $('results-rows');
    rows.innerHTML = '';
    for (const [label, value] of data.rows) {
      const li = document.createElement('li');
      const span = document.createElement('span');
      span.textContent = label;
      const b = document.createElement('b');
      b.textContent = String(value);
      li.append(span, b);
      rows.appendChild(li);
    }
    const bestLine = $('results-best');
    bestLine.textContent = data.newBest ? `New best on this phone · ${data.best}` : `Best on this phone · ${data.best}`;
    bestLine.classList.toggle('is-new', !!data.newBest);
    results.hidden = false;
    card.hidden = true;
    setTimeout(() => $('btn-again')?.focus(), 50);
  }

  function hideOverlays() {
    card.hidden = true;
    results.hidden = true;
  }

  function bind({ onStart, onAgain }) {
    $('btn-start')?.addEventListener('click', onStart);
    $('btn-again')?.addEventListener('click', onAgain);
    window.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      if (!card.hidden) onStart();
      else if (!results.hidden) onAgain();
    });
  }

  return {
    setTimer,
    setBanked,
    setBest,
    setHaul,
    setHidden,
    hint,
    toast,
    popup,
    updatePopups,
    setLastCall,
    showCard,
    showResults,
    hideOverlays,
    bind,
  };
}
