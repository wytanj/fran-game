/**
 * Scoring rules (P0) + device-local best.
 *
 *   bottle / tube / packet   1
 *   compact / box            2
 *   scoff 10+ in one hide    +25 % of that scoff
 *   3 categories in a scoff  +10
 */
const KEY = 'fran-game.best';

export const RULES = {
  bigScoffAt: 10,
  bigScoffBonus: 0.25,
  trioCategories: 3,
  trioBonus: 10,
  cap: 600,
};

export function scoffBonuses(session) {
  const out = [];
  if (session.count >= RULES.bigScoffAt) {
    out.push({ label: 'Big scoff', points: Math.round(session.points * RULES.bigScoffBonus) });
  }
  if (session.categories.size >= RULES.trioCategories) {
    out.push({ label: 'Mixed bag', points: RULES.trioBonus });
  }
  return out;
}

export function loadBest() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (raw && typeof raw.score === 'number') return raw;
  } catch {
    /* ignore */
  }
  return { score: 0, items: 0, at: null };
}

export function saveBest(record) {
  try {
    localStorage.setItem(KEY, JSON.stringify(record));
  } catch {
    /* ignore */
  }
}
