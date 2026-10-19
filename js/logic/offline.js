// Progressi mentre il gioco è chiuso: si simula la battaglia in modo veloce, senza animazioni.
import { heroStats, enemyFor, enemiesInStage, addXp, resolveFight } from './hero.js';
import { rollItem, processLoot } from './loot.js';
import { DROP_CHANCE } from './battle.js';
import { OFFLINE_CAP_SECONDS } from './data.js';

const MAX_FIGHTS = 60000;

export function simulateOffline(state, seconds, rng = Math.random) {
  const total = Math.min(seconds, OFFLINE_CAP_SECONDS);
  const summary = {
    seconds: total,
    capped: seconds > OFFLINE_CAP_SECONDS,
    kills: 0,
    gold: 0,
    xp: 0,
    levels: 0,
    startStage: state.stage,
    endStage: state.stage,
    drops: [],
  };
  if (total < 1) return summary;

  let t = 0;
  let fights = 0;
  let stats = heroStats(state);
  let heroHp = stats.hp;

  while (t < total && fights < MAX_FIGHTS) {
    fights++;
    const enemy = enemyFor(state.stage, state.killsInStage);
    const r = resolveFight(stats, enemy, heroHp);
    t += r.time + 0.7; // 0.7 s: il nemico che entra in scena
    if (!r.win) {
      state.stage = Math.max(1, state.stage - 1);
      state.killsInStage = 0;
      heroHp = stats.hp;
      t += 1.2;
      continue;
    }
    heroHp = Math.min(stats.hp, heroHp - r.damageTaken + stats.hp * 0.08);
    summary.kills++;
    summary.gold += enemy.gold;
    summary.xp += enemy.xp;
    state.gold += enemy.gold;
    state.stats.kills++;
    if (enemy.boss) state.stats.bossKills++;
    const lv = addXp(state, enemy.xp);
    if (lv > 0) {
      summary.levels += lv;
      stats = heroStats(state);
    }
    if (rng() < DROP_CHANCE * (enemy.boss ? 10 : 1)) {
      const item = rollItem(state.stage, state.lab.portale * 0.2 + (enemy.boss ? 1.5 : 0), rng);
      const [res] = processLoot(state, [item]);
      summary.drops.push(res);
      if (res.outcome === 'equipped') stats = heroStats(state);
    }
    state.killsInStage++;
    if (state.killsInStage >= enemiesInStage(state.stage)) {
      state.stage++;
      state.maxStage = Math.max(state.maxStage, state.stage);
      state.killsInStage = 0;
      heroHp = stats.hp;
    }
  }
  summary.endStage = state.stage;
  return summary;
}
