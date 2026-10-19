// Statistiche di Goku, dei nemici, esperienza e costi dei potenziamenti.
import { SLOT_BY_ID, TRAINING, LAB_BY_ID } from './data.js';
import { isBossStage } from './util.js';

export const BASE_ATK = 10;
export const BASE_HP = 100;
export const BASE_INTERVAL = 0.8; // secondi tra un attacco e l'altro
export const CRIT_CHANCE = 0.12;
export const CRIT_MULT = 2;
export const SPECIAL_EVERY = 8; // Kamehameha automatica ogni N secondi
export const SPECIAL_MULT = 5;
export const ENEMIES_PER_STAGE = 5;

export function gearTotals(state) {
  let atk = 0;
  let hp = 0;
  for (const item of Object.values(state.equipment)) {
    if (!item) continue;
    if (SLOT_BY_ID[item.slot].stat === 'atk') atk += item.power;
    else hp += item.power;
  }
  return { atk, hp };
}

export function heroStats(state) {
  const gear = gearTotals(state);
  const lvlMult = 1 + 0.06 * (state.hero.level - 1);
  const atk = (BASE_ATK + gear.atk) * (1 + 0.1 * state.training.atk) * lvlMult * (1 + 0.1 * state.lab.saiyan);
  const hp = (BASE_HP + gear.hp) * (1 + 0.1 * state.training.hp) * lvlMult * (1 + 0.1 * state.lab.scudo);
  const interval = BASE_INTERVAL / (1 + 0.04 * state.training.spd);
  return { atk, hp, interval, crit: CRIT_CHANCE, critMult: CRIT_MULT };
}

// Potenza complessiva, un numero unico da mostrare in alto.
export function powerRating(state) {
  const s = heroStats(state);
  return Math.round((s.atk / s.interval) * 2 + s.hp / 4);
}

export function enemyFor(stage, index = 0) {
  const boss = isBossStage(stage);
  const hp = 40 * Math.pow(1.2, stage - 1) * (boss ? 7 : 1);
  const atk = 5 * Math.pow(1.18, stage - 1) * (boss ? 2 : 1);
  const kinds = ['mutante', 'robot', 'ratto', 'mutante', 'drone'];
  return {
    kind: boss ? 'boss' : kinds[(stage + index) % kinds.length],
    boss,
    maxHp: hp,
    hp,
    atk,
    interval: boss ? 1.5 : 1.2,
    gold: 6 * Math.pow(1.14, stage - 1) * (boss ? 10 : 1),
    xp: 4 * Math.pow(1.09, stage - 1) * (boss ? 8 : 1),
  };
}

export function enemiesInStage(stage) {
  return isBossStage(stage) ? 1 : ENEMIES_PER_STAGE;
}

export function xpToNext(level) {
  return Math.round(25 * Math.pow(1.22, level - 1));
}

// Aggiunge esperienza e restituisce quanti livelli sono stati guadagnati.
export function addXp(state, amount) {
  state.hero.xp += amount;
  let gained = 0;
  while (state.hero.xp >= xpToNext(state.hero.level)) {
    state.hero.xp -= xpToNext(state.hero.level);
    state.hero.level++;
    gained++;
  }
  return gained;
}

export function trainingCost(id, level) {
  const t = TRAINING.find((x) => x.id === id);
  return Math.round(t.base * Math.pow(1.2, level));
}

export function buyTraining(state, id) {
  const cost = trainingCost(id, state.training[id]);
  if (state.gold < cost) return false;
  state.gold -= cost;
  state.training[id]++;
  return true;
}

export function labCost(id, level) {
  return Math.round(LAB_BY_ID[id].base * Math.pow(1.45, level));
}

export function buyLab(state, id) {
  const def = LAB_BY_ID[id];
  const lvl = state.lab[id];
  if (lvl >= def.max) return false;
  const cost = labCost(id, lvl);
  if (state.scrap < cost) return false;
  state.scrap -= cost;
  state.lab[id]++;
  return true;
}

// Risolve uno scontro senza animazioni (usato per i progressi offline).
// Restituisce il tempo impiegato e la vita persa; win=false se Goku non ce la fa.
export function resolveFight(stats, enemy, heroHp) {
  const avgHit = stats.atk * (1 + stats.crit * (stats.critMult - 1));
  const dps = avgHit / stats.interval + (stats.atk * SPECIAL_MULT) / SPECIAL_EVERY;
  const time = enemy.hp / dps;
  const damageTaken = (enemy.atk / enemy.interval) * time;
  if (damageTaken >= heroHp) return { win: false, time: (heroHp / enemy.atk) * enemy.interval, damageTaken: heroHp };
  return { win: true, time, damageTaken };
}
