import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newState, hydrate, serialize, refreshDailyKeys } from '../js/logic/state.js';
import { BattleSim } from '../js/logic/battle.js';
import { simulateOffline } from '../js/logic/offline.js';
import { startExpedition, collectExpedition, expeditionReady, skipExpedition } from '../js/logic/expedition.js';
import { processLoot, makeItem, rollRarity } from '../js/logic/loot.js';
import { buyTraining, heroStats } from '../js/logic/hero.js';
import { DefenseGame, grantDefenseRewards } from '../js/logic/defense.js';
import { seededRng } from '../js/logic/util.js';
import { DEFENSE_KEYS_PER_DAY, OFFLINE_CAP_SECONDS } from '../js/logic/data.js';

test('la battaglia automatica fa avanzare Goku', () => {
  const s = newState(0);
  const sim = new BattleSim(s, seededRng(1));
  for (let i = 0; i < 600; i++) sim.update(0.1); // 60 secondi
  assert.ok(s.stage > 1, `stadio ${s.stage}`);
  assert.ok(s.gold > 0);
  assert.ok(s.stats.kills > 5);
});

test('i progressi offline danno oro e rispettano il limite di 10 ore', () => {
  const s = newState(0);
  const sum = simulateOffline(s, 24 * 3600, seededRng(2));
  assert.equal(sum.seconds, OFFLINE_CAP_SECONDS);
  assert.ok(sum.capped);
  assert.ok(sum.kills > 100);
  assert.ok(s.gold > 0);
  assert.ok(s.maxStage > 5);
});

test('una spedizione porta tanto bottino (almeno 5 oggetti)', () => {
  const s = newState(0);
  assert.ok(startExpedition(s, 'vicina', 0));
  assert.equal(startExpedition(s, 'salto', 0), false, 'una sola spedizione alla volta');
  assert.equal(expeditionReady(s, 1000), false);
  const res = collectExpedition(s, 16 * 60 * 1000, seededRng(3));
  assert.ok(res.results.length >= 5 && res.results.length <= 11, `${res.results.length} oggetti`);
  assert.equal(s.expedition, null);
  assert.ok(s.gold > 0);
});

test('il viaggio notturno ha sempre la cassa bonus', () => {
  const s = newState(0);
  startExpedition(s, 'notte', 0);
  const res = collectExpedition(s, 9 * 3600 * 1000, seededRng(4));
  assert.ok(res.chest);
  assert.ok(res.results.length >= 11);
  assert.ok(res.results.some((r) => r.item.rarity >= 2));
});

test('saltare la spedizione costa gemme', () => {
  const s = newState(0);
  startExpedition(s, 'salto', 0);
  const gems = s.gems;
  assert.ok(skipExpedition(s, 0));
  assert.ok(s.gems < gems);
  assert.ok(expeditionReady(s, 0));
});

test('l\'equipaggiamento migliore viene indossato e il resto riciclato', () => {
  const s = newState(0);
  const weak = makeItem('arma', 0, 1, () => 0);
  const strong = makeItem('arma', 4, 5, () => 0.5);
  const atkBefore = heroStats(s).atk;
  const [r1, r2] = processLoot(s, [strong, weak]);
  assert.equal(r1.outcome, 'equipped');
  assert.equal(r2.outcome, 'recycled');
  assert.equal(s.equipment.arma.id, strong.id);
  assert.ok(heroStats(s).atk > atkBefore);
  assert.ok(s.scrap > 0);
});

test('la fortuna aumenta la rarità media', () => {
  const avg = (luck) => {
    const rng = seededRng(9);
    let sum = 0;
    for (let i = 0; i < 4000; i++) sum += rollRarity(luck, rng);
    return sum / 4000;
  };
  assert.ok(avg(4) > avg(0));
});

test('l\'allenamento costa oro e aumenta l\'attacco', () => {
  const s = newState(0);
  assert.equal(buyTraining(s, 'atk'), false);
  s.gold = 1000;
  const before = heroStats(s).atk;
  assert.ok(buyTraining(s, 'atk'));
  assert.ok(heroStats(s).atk > before);
  assert.ok(s.gold < 1000);
});

test('il salvataggio si ricarica uguale e riempie i campi mancanti', () => {
  const s = newState(0);
  s.gold = 1234;
  s.stage = 17;
  const back = hydrate(JSON.parse(serialize(s)), 0);
  assert.equal(back.gold, 1234);
  assert.equal(back.stage, 17);
  const old = JSON.parse(serialize(s));
  delete old.lab;
  assert.equal(hydrate(old, 0).lab.portale, 0);
});

test('le chiavi del Varco si ricaricano il giorno dopo', () => {
  const day1 = new Date(2026, 9, 19, 12).getTime();
  const s = newState(day1);
  s.defense.keys = 0;
  refreshDailyKeys(s, day1 + 3600 * 1000);
  assert.equal(s.defense.keys, 0);
  refreshDailyKeys(s, day1 + 24 * 3600 * 1000);
  assert.equal(s.defense.keys, DEFENSE_KEYS_PER_DAY);
});

test('la Difesa del Varco si può vincere con qualche torretta ben potenziata', () => {
  const s = newState(0);
  const g = new DefenseGame(s);
  const plan = [[2, 'blaster'], [7, 'plasma'], [8, 'crio']];
  let k = 0;
  while (g.phase !== 'won' && g.phase !== 'lost') {
    if (g.phase === 'build') {
      let spent = true;
      while (spent) {
        spent = false;
        if (k < plan.length && g.build(...plan[k])) { k++; spent = true; continue; }
        for (const t of g.towers) if (g.upgrade(t)) { spent = true; break; }
      }
      g.startWave();
    }
    g.update(0.05);
  }
  assert.equal(g.phase, 'won');
  const rewards = grantDefenseRewards(s, g.wavesCleared(), seededRng(5));
  assert.ok(rewards.gems > 0);
  assert.equal(rewards.results.length, 3);
  assert.equal(s.defense.bestWave, 5);
});

test('senza torrette il Varco cade', () => {
  const g = new DefenseGame(newState(0));
  while (g.phase !== 'lost' && g.phase !== 'won') {
    if (g.phase === 'build') g.startWave();
    g.update(0.05);
  }
  assert.equal(g.phase, 'lost');
});
