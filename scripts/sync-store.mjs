/**
 * Vendor the Bugis+ store from the sibling fran-zone checkout.
 *
 * Copies src/store/**, src/brand.js, src/wisp.js, public/textures/** (plus the
 * wordmark PNGs) into this repo and writes src/store/SYNC.md with the source
 * commit. The game never edits these files: changes land in fran-zone first,
 * then `npm run sync-store` pulls them down.
 *
 *   FRAN_ZONE_DIR=../somewhere npm run sync-store   # override the source
 */
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const here = dirname(fileURLToPath(import.meta.url));
const game = resolve(here, '..');
const source = resolve(process.env.FRAN_ZONE_DIR || join(game, '..', 'fran-zone'));

if (!existsSync(join(source, 'src', 'store', 'layout.js'))) {
  console.error(`sync-store: no fran-zone checkout at ${source}`);
  console.error('Clone it next to this repo, or set FRAN_ZONE_DIR.');
  process.exit(1);
}

const dirs = ['src/store', 'public/textures'];
const files = ['src/brand.js', 'src/wisp.js', 'public/logo-2c.png', 'public/logo-2c-white.png', 'public/logo-2c-yellow.png'];

const copied = [];
for (const dir of dirs) {
  const from = join(source, dir);
  const to = join(game, dir);
  if (!existsSync(from)) {
    console.warn(`sync-store: skip missing ${dir}`);
    continue;
  }
  rmSync(to, { recursive: true, force: true });
  mkdirSync(dirname(to), { recursive: true });
  cpSync(from, to, { recursive: true });
  for (const f of walk(to)) copied.push(relative(game, f).split(sep).join('/'));
}
for (const file of files) {
  const from = join(source, file);
  if (!existsSync(from)) {
    console.warn(`sync-store: skip missing ${file}`);
    continue;
  }
  const to = join(game, file);
  mkdirSync(dirname(to), { recursive: true });
  cpSync(from, to);
  copied.push(file);
}

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

function git(args) {
  try {
    return execSync(`git ${args}`, { cwd: source, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch {
    return '';
  }
}

const hash = git('rev-parse HEAD') || 'unknown';
const when = git('log -1 --format=%cI') || 'unknown';
const subject = git('log -1 --format=%s') || '';
const dirty = git('status --porcelain') ? ' (working tree had uncommitted changes)' : '';
const remote = git('remote get-url origin') || '';

const md = `# Vendored store — do not edit here

These files are copied verbatim from the sibling \`fran-zone\` checkout by
\`npm run sync-store\`. Fix things upstream in fran-zone, then re-sync.

- **Source:** ${remote || source}
- **Commit:** \`${hash}\`${dirty}
- **Committed:** ${when}
- **Subject:** ${subject}
- **Synced:** ${new Date().toISOString()}

## Files

${copied.sort().map((f) => `- \`${f}\``).join('\n')}
`;
writeFileSync(join(game, 'src', 'store', 'SYNC.md'), md);
console.log(`sync-store: ${copied.length} files from fran-zone@${hash.slice(0, 10)}${dirty}`);
