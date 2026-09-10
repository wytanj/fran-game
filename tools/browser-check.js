/**
 * Headless smoke test: boots the game, plays one scripted run, screenshots
 * each beat into tools/shots/, and fails on any page error.
 *
 *   npm run dev            # in one terminal (port 5174)
 *   npm run browser        # in another
 *
 * Puppeteer is resolved from this repo if installed (`npm i -D puppeteer`),
 * otherwise from the sibling ../fran-zone checkout, which already has it.
 * Software GL runs at a few frames per second, so every beat waits on game
 * state rather than wall-clock time.
 */
import { mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
function resolvePuppeteer() {
  for (const base of [process.cwd(), path.resolve(process.cwd(), '..', 'fran-zone')]) {
    try {
      return require.resolve('puppeteer', { paths: [base] });
    } catch {
      /* try next */
    }
  }
  throw new Error('puppeteer not found: npm i -D puppeteer, or clone ../fran-zone');
}
const puppeteer = (await import(pathToFileURL(resolvePuppeteer()).href)).default;

const url = process.env.FRAN_GAME_URL || 'http://127.0.0.1:5174/?noshadow=1';
const outDir = path.resolve('tools/shots');
await mkdir(outDir, { recursive: true });

const browser = await puppeteer.launch({
  headless: 'new',
  args: ['--no-sandbox', '--enable-unsafe-swiftshader', '--use-gl=swiftshader', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage();
page.setDefaultTimeout(90000);
await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });

const errors = [];
const logs = [];
page.on('pageerror', (err) => errors.push(String(err)));
page.on('console', (msg) => {
  const text = msg.text();
  if (msg.type() === 'error') errors.push(text);
  else logs.push(`${msg.type()}: ${text}`);
});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const shot = (name) => page.screenshot({ path: path.join(outDir, `${name}.png`) });
const state = () =>
  page.evaluate(() => {
    const g = window.__franGame;
    return {
      state: g.run.state,
      banked: g.run.banked,
      timeLeft: g.run.timeLeft,
      haul: g.run.haul.count,
      hidden: g.run.hide.hidden,
      taken: g.run.pickups.takenCount,
      items: g.run.pickups.items.length,
      faces: g.run.pickups.faces.size,
      spots: g.run.spots.map((s) => `${s.id}@(${s.x.toFixed(2)},${s.z.toFixed(2)})`),
      pos: [g.wisp.position.x.toFixed(2), g.wisp.position.z.toFixed(2)],
    };
  });
/** Poll a predicate over window.__franGame; resolves true or false on timeout. */
async function until(fnBody, timeout = 60000) {
  try {
    await page.waitForFunction(`(() => { const g = window.__franGame; return ${fnBody}; })()`, { timeout, polling: 100 });
    return true;
  } catch {
    return false;
  }
}

const checks = [];
function expect(label, ok, extra = '') {
  checks.push({ label, ok });
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}${extra ? ` · ${extra}` : ''}`);
}

await page.goto(url, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => Boolean(window.__franGame?.run));
await sleep(800);
await shot('01-card');
let s = await state();
expect('boots to framing card', s.state === 'idle');
expect('registry has gondola props', s.items > 500, `${s.items} props on ${s.faces} faces`);
expect('at least 4 hide spots', s.spots.length >= 4, s.spots.join(' '));

await page.click('#btn-start');
expect('start begins a run', await until("g.run.state === 'playing' && g.run.timeLeft > 55"));
await shot('02-run-start');

// Keyboard moves Wisp (camera-relative, so any key just needs to change position).
const before = await state();
await page.keyboard.down('a');
const moved = await until(
  `Math.hypot(g.wisp.position.x - ${before.pos[0]}, g.wisp.position.z - ${before.pos[1]}) > 0.2`,
  30000,
);
await page.keyboard.up('a');
s = await state();
expect('WASD moves Wisp', moved, `${before.pos} → ${s.pos}`);

// Stand by gondola NL's north face and hold Yoink.
await page.evaluate(() => window.__franGame.wisp.root.position.set(6.5, 0.62, 1.85));
await page.keyboard.down(' ');
const yoinked = await until('g.run.haul.count >= 6');
s = await state();
expect('holding Space yoinks props', yoinked, `${s.haul} loose, ${s.taken} taken off the shelf`);
await shot('03-yoink');

// Keep yoinking to feel the slowdown.
const heavy = await until('g.run.haul.count >= 10');
await page.keyboard.up(' ');
const slow = await page.evaluate(() => window.__franGame.run.haul.speedScale);
s = await state();
expect('haul slows Wisp', heavy && slow < 1, `${s.haul} loose → speed ×${slow.toFixed(2)}`);
await shot('04-haul');

// Teleport into a hide spot, stand still, scoff.
const spot = await page.evaluate(() => {
  const g = window.__franGame;
  const sp = g.run.spots.find((x) => x.id === 'NM-w') || g.run.spots[0];
  g.wisp.root.position.set(sp.x, 0.62, sp.z);
  return sp;
});
expect(`hides in ${spot.id}`, await until('g.run.hide.hidden === true'));
await shot('05-hide');
const scoffedSome = await until('g.run.banked > 0');
const scoffedAll = await until('g.run.haul.count === 0');
s = await state();
expect('scoffing banks score', scoffedSome && scoffedAll, `banked ${s.banked}, ${s.haul} loose left`);
await shot('06-scoff');

// Fast-forward to last call, then time out.
await page.evaluate(() => window.__franGame.run.skipTo(10.8));
const lastcall = await until("document.querySelector('#timer').parentElement.classList.contains('is-lastcall')");
expect('last call at 10 s', lastcall);
await shot('07-lastcall');
await page.evaluate(() => window.__franGame.run.skipTo(0.3));
expect('timer ends the run', await until("g.run.state === 'results'"));
s = await state();
const resultsVisible = await page.$eval('#results', (el) => !el.hidden);
const resultsScore = await page.$eval('#results-score', (el) => Number(el.textContent));
expect('results sheet shows banked', resultsVisible && resultsScore === s.banked, `score ${resultsScore}`);
await shot('08-results');
expect('props float back to the shelf', await until('g.run.pickups.takenCount === 0', 10000));

const best = await page.evaluate(() => JSON.parse(localStorage.getItem('fran-game.best') || 'null'));
expect('local best saved', best && best.score === resultsScore, JSON.stringify(best));

await page.click('#btn-again');
expect(
  'run again restarts fast',
  await until("g.run.state === 'playing' && g.run.timeLeft > 55 && g.run.banked === 0 && g.run.haul.count === 0", 5000),
);
await shot('09-again');

// Copy guardrails: never the words on the avoid-list.
const html = await page.content();
const banned = ['steal', 'shoplift', 'theft', 'loss prevention'].filter((w) => html.toLowerCase().includes(w));
expect('UI copy avoids steal / shoplift / theft', banned.length === 0, banned.join(', '));

await browser.close();

const failed = checks.filter((c) => !c.ok);
if (errors.length) {
  console.error('\nPage errors:');
  for (const e of errors) console.error(`  ${e}`);
}
const warn = logs.filter((l) => l.startsWith('warn') && !l.includes('GL Driver') && !l.includes('THREE.Clock'));
if (warn.length) {
  console.log('\nWarnings:');
  for (const w of warn) console.log(`  ${w}`);
}
console.log(`\n${checks.length - failed.length}/${checks.length} checks passed, ${errors.length} page errors`);
process.exit(failed.length || errors.length ? 1 : 0);
