// Funzioni di supporto condivise (nessun accesso al DOM, usabili anche nei test).

const SUFFIXES = ['', 'K', 'M', 'B', 'T', 'aa', 'ab', 'ac', 'ad'];

export function fmt(n) {
  if (!isFinite(n)) return '∞';
  if (Math.abs(n) < 1000) return String(Math.floor(n));
  let i = 0;
  while (Math.abs(n) >= 1000 && i < SUFFIXES.length - 1) {
    n /= 1000;
    i++;
  }
  return (n >= 100 ? n.toFixed(0) : n >= 10 ? n.toFixed(1) : n.toFixed(2)) + SUFFIXES[i];
}

export function fmtTime(seconds) {
  seconds = Math.max(0, Math.ceil(seconds));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`;
  if (m > 0) return `${m}m ${String(s).padStart(2, '0')}s`;
  return `${s}s`;
}

export function randInt(min, max, rng = Math.random) {
  return min + Math.floor(rng() * (max - min + 1));
}

export function pick(list, rng = Math.random) {
  return list[Math.floor(rng() * list.length)];
}

export function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

// Generatore pseudo-casuale con seme, per test ripetibili.
export function seededRng(seed = 1) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function stageLabel(stage) {
  const zone = Math.floor((stage - 1) / 10) + 1;
  const sub = ((stage - 1) % 10) + 1;
  return `${zone}-${sub}`;
}

export function isBossStage(stage) {
  return stage % 10 === 0;
}
