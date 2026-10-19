// Spedizioni: Rick apre il portale, Torcio parte in e-bike e torna carico di bottino.
import { EXP_BY_ID } from './data.js';
import { rollItem, processLoot } from './loot.js';
import { randInt } from './util.js';

export function expeditionDuration(state, id) {
  return EXP_BY_ID[id].minutes * 60 * Math.pow(0.92, state.lab.turbo);
}

export function startExpedition(state, id, now = Date.now()) {
  if (state.expedition) return false;
  const seconds = expeditionDuration(state, id);
  state.expedition = { id, start: now, end: now + seconds * 1000 };
  return true;
}

export function expeditionRemaining(state, now = Date.now()) {
  if (!state.expedition) return 0;
  return Math.max(0, (state.expedition.end - now) / 1000);
}

export function expeditionReady(state, now = Date.now()) {
  return !!state.expedition && expeditionRemaining(state, now) <= 0;
}

// 1 gemma ogni 10 minuti che mancano.
export function skipCost(state, now = Date.now()) {
  return Math.max(1, Math.ceil(expeditionRemaining(state, now) / 600));
}

export function skipExpedition(state, now = Date.now()) {
  if (!state.expedition || expeditionReady(state, now)) return false;
  const cost = skipCost(state, now);
  if (state.gems < cost) return false;
  state.gems -= cost;
  state.expedition.end = now;
  return true;
}

export function collectExpedition(state, now = Date.now(), rng = Math.random) {
  if (!expeditionReady(state, now)) return null;
  const exp = EXP_BY_ID[state.expedition.id];
  const luck = exp.luck + state.lab.portale * 0.35;
  const ilvl = state.maxStage + Math.floor(exp.luck);
  const items = [];
  const count = randInt(exp.items[0], exp.items[1], rng);
  for (let i = 0; i < count; i++) items.push(rollItem(ilvl, luck, rng));

  let chest = false;
  let gems = 0;
  if (rng() < exp.chest) {
    // Cassa bonus: 3 oggetti in più, almeno uno raro, e qualche gemma.
    chest = true;
    items.push(rollItem(ilvl, luck + 1, rng, 2));
    items.push(rollItem(ilvl, luck, rng));
    items.push(rollItem(ilvl, luck, rng));
    gems = randInt(2, 5, rng) + Math.floor(exp.luck * 2);
  }

  const gold = Math.round(6 * Math.pow(1.12, state.maxStage - 1) * exp.goldMult * 5);
  state.gold += gold;
  state.gems += gems;
  state.expedition = null;
  state.stats.expeditions++;
  const results = processLoot(state, items);
  return { exp, results, gold, gems, chest };
}
