// Generazione degli oggetti, equipaggiamento automatico e riciclo in rottami.
import { SLOTS, SLOT_BY_ID, RARITIES, ITEM_NAMES, RARITY_SUFFIX } from './data.js';
import { pick } from './util.js';

let nextId = 1;

export function itemPower(slot, rarity, ilvl, roll = 1) {
  return Math.max(1, Math.round(SLOT_BY_ID[slot].base * Math.pow(1.1, ilvl - 1) * RARITIES[rarity].mult * roll));
}

export function makeItem(slot, rarity, ilvl, rng = Math.random) {
  const roll = 0.9 + rng() * 0.2;
  return {
    id: `${Date.now().toString(36)}-${(nextId++).toString(36)}`,
    slot,
    rarity,
    ilvl,
    name: pick(ITEM_NAMES[slot], rng) + RARITY_SUFFIX[rarity],
    power: itemPower(slot, rarity, ilvl, roll),
  };
}

// La fortuna sposta il peso verso le rarità più alte.
export function rollRarity(luck = 0, rng = Math.random) {
  const weights = RARITIES.map((r, i) => r.weight * Math.pow(1 + 0.45 * luck, i));
  const total = weights.reduce((a, b) => a + b, 0);
  let x = rng() * total;
  for (let i = 0; i < weights.length; i++) {
    x -= weights[i];
    if (x <= 0) return i;
  }
  return weights.length - 1;
}

export function rollItem(ilvl, luck = 0, rng = Math.random, minRarity = 0) {
  const slot = pick(SLOTS, rng).id;
  const rarity = Math.max(minRarity, rollRarity(luck, rng));
  return makeItem(slot, rarity, Math.max(1, ilvl), rng);
}

export function recycleValue(item) {
  return Math.max(1, Math.round((item.rarity + 1) * (item.rarity + 1) * 2 * (1 + item.ilvl / 8)));
}

export function isUpgrade(state, item) {
  const current = state.equipment[item.slot];
  return !current || item.power > current.power;
}

// Prende un gruppo di oggetti: indossa quelli migliori e ricicla gli altri.
// Restituisce l'elenco con l'esito di ciascuno, per mostrarlo al giocatore.
export function processLoot(state, items) {
  const results = [];
  for (const item of items) {
    state.stats.itemsFound++;
    if (isUpgrade(state, item)) {
      const old = state.equipment[item.slot];
      state.equipment[item.slot] = item;
      if (old) state.scrap += recycleValue(old);
      results.push({ item, outcome: 'equipped', replaced: old });
    } else {
      const value = recycleValue(item);
      state.scrap += value;
      results.push({ item, outcome: 'recycled', value });
    }
  }
  state.lootLog = [...results.map((r) => ({ name: r.item.name, rarity: r.item.rarity, outcome: r.outcome })), ...state.lootLog].slice(0, 30);
  return results;
}
