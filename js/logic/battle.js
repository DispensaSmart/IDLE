// Battaglia automatica in tempo reale. Non disegna niente: produce eventi che la grafica legge.
import { heroStats, enemyFor, enemiesInStage, addXp, SPECIAL_EVERY, SPECIAL_MULT } from './hero.js';
import { rollItem, processLoot } from './loot.js';
import { isBossStage } from './util.js';

export const DROP_CHANCE = 0.06;
const WALK_TIME = 0.7;

export class BattleSim {
  constructor(state, rng = Math.random) {
    this.state = state;
    this.rng = rng;
    this.events = [];
    this.resetHero();
    this.spawnEnemy();
  }

  resetHero() {
    this.stats = heroStats(this.state);
    this.heroHp = this.stats.hp;
    this.heroTimer = 0.3;
    this.specialTimer = SPECIAL_EVERY;
  }

  // Da chiamare quando cambia l'equipaggiamento o un potenziamento.
  refreshStats() {
    const ratio = this.heroHp / this.stats.hp;
    this.stats = heroStats(this.state);
    this.heroHp = Math.min(this.stats.hp, Math.max(1, ratio * this.stats.hp));
  }

  spawnEnemy() {
    this.enemy = enemyFor(this.state.stage, this.state.killsInStage);
    this.enemyTimer = this.enemy.interval;
    this.phase = 'walk';
    this.phaseTime = 0;
  }

  emit(type, data = {}) {
    this.events.push({ type, ...data });
  }

  drainEvents() {
    const out = this.events;
    this.events = [];
    return out;
  }

  update(dt) {
    this.phaseTime += dt;
    if (this.phase === 'walk') {
      if (this.phaseTime >= WALK_TIME) {
        this.phase = 'fight';
        this.phaseTime = 0;
      }
      return;
    }
    if (this.phase === 'down') {
      if (this.phaseTime >= 1.2) {
        this.resetHero();
        this.spawnEnemy();
      }
      return;
    }

    this.heroTimer -= dt;
    this.specialTimer -= dt;
    this.enemyTimer -= dt;

    if (this.specialTimer <= 0) {
      this.specialTimer = SPECIAL_EVERY;
      const dmg = this.stats.atk * SPECIAL_MULT;
      this.enemy.hp -= dmg;
      this.emit('special', { dmg });
    } else if (this.heroTimer <= 0) {
      this.heroTimer += this.stats.interval;
      const crit = this.rng() < this.stats.crit;
      const dmg = this.stats.atk * (crit ? this.stats.critMult : 1) * (0.9 + this.rng() * 0.2);
      this.enemy.hp -= dmg;
      this.emit('hit', { dmg, crit });
    }

    if (this.enemy.hp <= 0) {
      this.onKill();
      return;
    }

    if (this.enemyTimer <= 0) {
      this.enemyTimer += this.enemy.interval;
      const dmg = this.enemy.atk * (0.85 + this.rng() * 0.3);
      this.heroHp -= dmg;
      this.emit('enemyHit', { dmg });
      if (this.heroHp <= 0) {
        this.heroHp = 0;
        this.onHeroDown();
      }
    }
  }

  onKill() {
    const s = this.state;
    const e = this.enemy;
    s.gold += e.gold;
    s.stats.kills++;
    if (e.boss) s.stats.bossKills++;
    const levels = addXp(s, e.xp);
    this.emit('kill', { gold: e.gold, xp: e.xp, boss: e.boss });
    if (levels > 0) {
      this.refreshStats();
      this.emit('levelUp', { level: s.hero.level });
    }
    if (this.rng() < DROP_CHANCE * (e.boss ? 10 : 1)) {
      const item = rollItem(s.stage, s.lab.portale * 0.2 + (e.boss ? 1.5 : 0), this.rng);
      const [result] = processLoot(s, [item]);
      if (result.outcome === 'equipped') this.refreshStats();
      this.emit('drop', { result });
    }
    this.heroHp = Math.min(this.stats.hp, this.heroHp + this.stats.hp * 0.08);
    s.killsInStage++;
    if (s.killsInStage >= enemiesInStage(s.stage)) {
      const cleared = s.stage;
      s.stage++;
      s.maxStage = Math.max(s.maxStage, s.stage);
      s.killsInStage = 0;
      this.heroHp = this.stats.hp;
      this.emit('stageClear', { stage: cleared, boss: isBossStage(cleared) });
    }
    this.spawnEnemy();
  }

  onHeroDown() {
    const s = this.state;
    this.phase = 'down';
    this.phaseTime = 0;
    // Si torna indietro di uno stadio per fare esperienza, come negli idle classici.
    s.stage = Math.max(1, s.stage - 1);
    s.killsInStage = 0;
    this.emit('heroDown', { stage: s.stage });
  }
}
