import { doors, blockersAt } from '../../store/layout.js';

/**
 * Ambient patrol waypoints for jarell the egg.
 * Sales-floor aisle points + BOH door insides; validated with blockersAt at boot.
 * Separate from Glow Guard beats — cute wanderer, not heat.
 */

const RADIUS = 0.2;

/** Open-aisle chill spots on the Bugis+ sales floor (rev FULL 110926). */
export const salesSpecs = [
  { id: 'n-west', x: 4.8, z: 1.35 },
  { id: 'n-mid', x: 10.5, z: 1.35 },
  { id: 'n-east', x: 16.8, z: 1.4 },
  { id: 'm-west', x: 5.2, z: 3.55 },
  { id: 'm-mid', x: 11.0, z: 3.55 },
  { id: 'm-east', x: 16.5, z: 3.5 },
  { id: 's-west', x: 5.0, z: 5.85 },
  { id: 's-mid', x: 11.2, z: 5.9 },
  { id: 's-east', x: 16.8, z: 5.9 },
  { id: 'xp-aisle', x: 14.2, z: 7.4 },
  { id: 'xp-table', x: 13.6, z: 8.5 },
  { id: 'entrance', x: 17.8, z: 3.4 },
  { id: 'queue', x: 4.4, z: 2.8 },
];

/** Back-of-house destinations via stock / locker door waypoints. */
export const bohSpecs = [
  { id: 'stock-door', ...doors.stock.inside },
  { id: 'stock-deep', x: 6.4, z: 8.6 },
  { id: 'stock-jog', x: 9.4, z: 8.4 },
  { id: 'locker-door', ...doors.locker.inside },
  { id: 'locker-pad', x: -1.1, z: 6.1 },
];

function keepClear(list) {
  const out = [];
  for (const p of list) {
    const hits = blockersAt(p.x, p.z, RADIUS);
    if (hits.length) {
      console.warn(
        `[jarell] beat ${p.id} at (${p.x.toFixed(2)}, ${p.z.toFixed(2)}) blocked by ${hits.join(', ')}, skipped`,
      );
      continue;
    }
    out.push({ id: p.id, x: p.x, z: p.z });
  }
  return out;
}

export function resolveJarellBeats() {
  const sales = keepClear(salesSpecs);
  const boh = keepClear(bohSpecs);
  if (!sales.length) console.warn('[jarell] no sales beats resolved');
  return { sales, boh };
}
