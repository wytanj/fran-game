/**
 * Tiny WebAudio synth: enough blips to make yoink / scoff / last call read.
 * Unlocked on the first Start tap. Silent (no-op) if WebAudio is unavailable.
 */
export function createAudio() {
  let ctx = null;
  let master = null;

  function unlock() {
    if (ctx) {
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try {
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.22;
      master.connect(ctx.destination);
    } catch {
      ctx = null;
    }
  }

  function tone({ freq = 440, to = null, type = 'sine', dur = 0.12, gain = 1, at = 0 }) {
    if (!ctx || !master) return;
    const t0 = ctx.currentTime + at;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (to) osc.frequency.exponentialRampToValueAtTime(to, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  return {
    unlock,
    yoink(n = 0) {
      tone({ freq: 520 + Math.min(n, 20) * 22, to: 880 + Math.min(n, 20) * 22, type: 'triangle', dur: 0.09, gain: 0.7 });
    },
    scoff() {
      tone({ freq: 300, to: 160, type: 'square', dur: 0.08, gain: 0.35 });
      tone({ freq: 900, to: 1200, type: 'sine', dur: 0.1, gain: 0.35, at: 0.02 });
    },
    bonus() {
      [523, 659, 784, 1047].forEach((f, i) => tone({ freq: f, type: 'triangle', dur: 0.16, gain: 0.6, at: i * 0.07 }));
    },
    hide() {
      tone({ freq: 400, to: 240, type: 'sine', dur: 0.18, gain: 0.5 });
    },
    tick() {
      tone({ freq: 1400, type: 'square', dur: 0.03, gain: 0.25 });
    },
    end() {
      [660, 520, 392].forEach((f, i) => tone({ freq: f, type: 'triangle', dur: 0.3, gain: 0.6, at: i * 0.16 }));
    },
    bust() {
      // Cute egg-gotcha wobble — dream over, not a siren.
      [520, 390, 260].forEach((f, i) => tone({ freq: f, to: f * 0.7, type: 'triangle', dur: 0.22, gain: 0.7, at: i * 0.12 }));
      tone({ freq: 180, to: 90, type: 'sine', dur: 0.35, gain: 0.45, at: 0.28 });
    },
    go() {
      [392, 523, 784].forEach((f, i) => tone({ freq: f, type: 'triangle', dur: 0.14, gain: 0.6, at: i * 0.08 }));
    },
  };
}
