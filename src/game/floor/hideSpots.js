import { gondolas, queueFixtures, experience, doors, blockersAt } from '../../store/layout.js';

/**
 * Hide spots keyed to fixture ids, so a plan revision moves them.
 * Each is resolved at boot against the vendored layout and validated with
 * blockersAt(); a spot whose fixture vanished or that now sits inside a
 * fixture is logged and skipped rather than shipped broken.
 */
const END_GAP = 0.45;

export const hideSpotSpecs = [
  { id: 'queue-gap', name: 'Queue rail gap', kind: 'queue' },
  { id: 'SL-w', name: 'SL frost panel', kind: 'gondola-end', fixture: 'SL', end: 'w' },
  { id: 'SR-w', name: 'SR frost panel', kind: 'gondola-end', fixture: 'SR', end: 'w' },
  { id: 'SR-e', name: 'SR frost panel', kind: 'gondola-end', fixture: 'SR', end: 'e' },
  { id: 'NM-w', name: 'NM tower shadow', kind: 'gondola-end', fixture: 'NM', end: 'w' },
  { id: 'SM-w', name: 'SM tower shadow', kind: 'gondola-end', fixture: 'SM', end: 'w' },
  { id: 'table-lip', name: 'Table lip', kind: 'round-west' },
  { id: 'display-table', name: 'Display table', kind: 'table-east' },
  { id: 'stock-door', name: 'Stock doorway', kind: 'door', door: 'stock' },
  { id: 'locker-door', name: 'Locker doorway', kind: 'door', door: 'locker' },
];

function locate(spec) {
  switch (spec.kind) {
    case 'queue': {
      const [a, b] = queueFixtures;
      if (!a || !b) return null;
      return { x: (a.x + b.x) / 2, z: (a.z + b.z) / 2 };
    }
    case 'gondola-end': {
      const g = gondolas.find((item) => item.id === spec.fixture);
      if (!g) return null;
      const dir = spec.end === 'e' ? 1 : -1;
      return { x: g.x + dir * (g.w / 2 + END_GAP), z: g.z };
    }
    case 'round-west':
      if (!experience?.round) return null;
      return { x: experience.round.x - experience.round.r - 0.4, z: experience.round.z };
    case 'table-east':
      if (!experience?.table) return null;
      return { x: experience.table.x + experience.table.w / 2 + 0.42, z: experience.table.z };
    case 'door':
      return doors?.[spec.door]?.approach ?? null;
    default:
      return null;
  }
}

export function resolveHideSpots() {
  const out = [];
  for (const spec of hideSpotSpecs) {
    const at = locate(spec);
    if (!at) {
      console.warn(`[floor] hide spot ${spec.id}: fixture ${spec.fixture ?? spec.kind} missing, skipped`);
      continue;
    }
    const hits = blockersAt(at.x, at.z, 0.3);
    if (hits.length) {
      console.warn(
        `[floor] hide spot ${spec.id} at (${at.x.toFixed(2)}, ${at.z.toFixed(2)}) blocked by ${hits.join(', ')}, skipped`,
      );
      continue;
    }
    out.push({ id: spec.id, name: spec.name, x: at.x, z: at.z, size: 0.7 });
  }
  return out;
}
