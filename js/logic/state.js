// Stato di gioco: creazione, salvataggio e caricamento.
import { SLOTS, DEFENSE_KEYS_PER_DAY } from './data.js';
import { makeItem } from './loot.js';

export const SAVE_KEY = 'portale-rotto-save-v1';
export const SAVE_VERSION = 1;

export function newState(now = Date.now()) {
  const equipment = Object.fromEntries(SLOTS.map((s) => [s.id, null]));
  // Si parte con un paio di oggetti base, per non essere a mani nude.
  equipment.arma = makeItem('arma', 0, 1, () => 0.5);
  equipment.armatura = makeItem('armatura', 0, 1, () => 0.5);
  return {
    version: SAVE_VERSION,
    createdAt: now,
    lastSeen: now,
    gold: 0,
    scrap: 0,
    gems: 10,
    stage: 1,
    maxStage: 1,
    killsInStage: 0,
    hero: { level: 1, xp: 0 },
    training: { atk: 0, hp: 0, spd: 0 },
    lab: { portale: 0, turbo: 0, saiyan: 0, scudo: 0, torrette: 0 },
    equipment,
    expedition: null, // { id, start, end }
    lootLog: [],
    defense: { keys: DEFENSE_KEYS_PER_DAY, keyDay: dayKey(now), bestWave: 0, runs: 0 },
    stats: { kills: 0, itemsFound: 0, expeditions: 0, bossKills: 0 },
  };
}

export function dayKey(ts) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

// Ricarica le chiavi del Varco una volta al giorno.
export function refreshDailyKeys(state, now = Date.now()) {
  const today = dayKey(now);
  if (state.defense.keyDay !== today) {
    state.defense.keyDay = today;
    state.defense.keys = Math.max(state.defense.keys, DEFENSE_KEYS_PER_DAY);
  }
}

// Unisce un salvataggio con lo stato di base, così i campi aggiunti in futuro non mancano.
export function hydrate(raw, now = Date.now()) {
  const base = newState(now);
  if (!raw || typeof raw !== 'object') return base;
  const s = { ...base, ...raw };
  for (const key of ['hero', 'training', 'lab', 'defense', 'stats']) {
    s[key] = { ...base[key], ...(raw[key] || {}) };
  }
  s.equipment = { ...Object.fromEntries(SLOTS.map((x) => [x.id, null])), ...(raw.equipment || {}) };
  s.lootLog = Array.isArray(raw.lootLog) ? raw.lootLog.slice(0, 30) : [];
  s.version = SAVE_VERSION;
  return s;
}

export function serialize(state) {
  return JSON.stringify(state);
}

export function exportSave(state) {
  return btoa(unescape(encodeURIComponent(serialize(state))));
}

export function importSave(text, now = Date.now()) {
  const json = decodeURIComponent(escape(atob(text.trim())));
  return hydrate(JSON.parse(json), now);
}

export function loadFromStorage(storage, now = Date.now()) {
  try {
    const raw = storage.getItem(SAVE_KEY);
    if (!raw) return null;
    return hydrate(JSON.parse(raw), now);
  } catch (e) {
    console.warn('Salvataggio illeggibile, si riparte da zero', e);
    return null;
  }
}

export function saveToStorage(storage, state) {
  try {
    storage.setItem(SAVE_KEY, serialize(state));
    return true;
  } catch (e) {
    console.warn('Impossibile salvare', e);
    return false;
  }
}
