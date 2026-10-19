// Difesa del Varco: tower defense a ondate, la parte del gioco comandata dal giocatore.
import { TOWERS, TOWER_BY_ID, DEFENSE_WAVES } from './data.js';
import { rollItem, processLoot } from './loot.js';

export const DEF_W = 360;
export const DEF_H = 560;

export const PATH = [
  [180, -20], [180, 70], [60, 70], [60, 190], [300, 190], [300, 310], [80, 310], [80, 420], [180, 420], [180, 515],
];

export const SPOTS = [
  [120, 30], [250, 50], [115, 130], [20, 130], [180, 140], [250, 250], [345, 250], [180, 250],
  [140, 365], [30, 365], [240, 365], [130, 470], [235, 470], [345, 130],
];

const SEGMENTS = (() => {
  const segs = [];
  let total = 0;
  for (let i = 0; i < PATH.length - 1; i++) {
    const [x1, y1] = PATH[i];
    const [x2, y2] = PATH[i + 1];
    const len = Math.hypot(x2 - x1, y2 - y1);
    segs.push({ x1, y1, x2, y2, len, start: total });
    total += len;
  }
  return { segs, total };
})();

export const PATH_LENGTH = SEGMENTS.total;

export function pointAt(dist) {
  for (const s of SEGMENTS.segs) {
    if (dist <= s.start + s.len) {
      const p = (dist - s.start) / s.len;
      return [s.x1 + (s.x2 - s.x1) * p, s.y1 + (s.y2 - s.y1) * p];
    }
  }
  const last = PATH[PATH.length - 1];
  return [last[0], last[1]];
}

const ENEMY_TYPES = {
  mutante: { hp: 1, speed: 40, bounty: 6, size: 0.42 },
  ratto: { hp: 0.6, speed: 66, bounty: 5, size: 0.38 },
  robot: { hp: 2.8, speed: 27, bounty: 12, size: 0.42 },
  boss: { hp: 22, speed: 22, bounty: 80, size: 0.55, lives: 5 },
};

export function waveList(wave) {
  const list = [];
  const count = 7 + wave * 3;
  for (let i = 0; i < count; i++) {
    let kind = 'mutante';
    if (wave >= 2 && i % 3 === 1) kind = 'ratto';
    if (wave >= 3 && i % 5 === 4) kind = 'robot';
    list.push(kind);
  }
  if (wave === DEFENSE_WAVES) list.push('boss');
  return list;
}

export class DefenseGame {
  constructor(state) {
    this.state = state;
    this.money = 130;
    this.lives = 10;
    this.wave = 0;
    this.phase = 'build'; // build | wave | won | lost
    this.towers = [];
    this.enemies = [];
    this.shots = [];
    this.effects = [];
    this.queue = [];
    this.spawnTimer = 0;
    this.time = 0;
    this.dmgMult = 1 + 0.15 * state.lab.torrette;
  }

  towerAt(spotIndex) {
    return this.towers.find((t) => t.spot === spotIndex);
  }

  build(spotIndex, typeId) {
    const def = TOWER_BY_ID[typeId];
    if (this.towerAt(spotIndex) || this.money < def.cost) return false;
    this.money -= def.cost;
    const [x, y] = SPOTS[spotIndex];
    this.towers.push({ spot: spotIndex, type: typeId, level: 1, x, y, cooldown: 0, spent: def.cost, angle: -Math.PI / 2 });
    return true;
  }

  upgradeCost(tower) {
    return tower.level >= 3 ? Infinity : Math.round(TOWER_BY_ID[tower.type].cost * (tower.level + 0.5));
  }

  upgrade(tower) {
    const cost = this.upgradeCost(tower);
    if (this.money < cost) return false;
    this.money -= cost;
    tower.spent += cost;
    tower.level++;
    return true;
  }

  sell(tower) {
    this.money += Math.round(tower.spent * 0.6);
    this.towers = this.towers.filter((t) => t !== tower);
  }

  towerStats(tower) {
    const d = TOWER_BY_ID[tower.type];
    const lv = tower.level - 1;
    return {
      ...d,
      dmg: d.dmg * Math.pow(1.7, lv) * this.dmgMult,
      range: d.range + lv * 8,
      rate: d.rate * Math.pow(0.88, lv),
    };
  }

  startWave() {
    if (this.phase !== 'build' || this.wave >= DEFENSE_WAVES) return false;
    this.wave++;
    this.queue = waveList(this.wave);
    this.spawnTimer = 0;
    this.phase = 'wave';
    return true;
  }

  spawn(kind) {
    const t = ENEMY_TYPES[kind];
    const hp = 26 * Math.pow(1.45, this.wave - 1) * t.hp;
    this.enemies.push({ kind, dist: 0, hp, maxHp: hp, speed: t.speed, bounty: t.bounty, size: t.size, lives: t.lives || 1, slow: 0, hurt: 0 });
  }

  update(dt) {
    this.time += dt;
    if (this.phase !== 'wave') return;

    if (this.queue.length) {
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0) {
        this.spawn(this.queue.shift());
        this.spawnTimer = 0.85;
      }
    }

    for (const e of this.enemies) {
      e.slow = Math.max(0, e.slow - dt);
      e.hurt = Math.max(0, e.hurt - dt);
      e.dist += e.speed * (e.slow > 0 ? 0.5 : 1) * dt;
      const [x, y] = pointAt(e.dist);
      e.x = x;
      e.y = y;
      if (e.dist >= PATH_LENGTH) {
        e.dead = true;
        this.lives -= e.lives;
        this.effects.push({ kind: 'leak', x, y, life: 0.6 });
      }
    }

    for (const tw of this.towers) {
      tw.cooldown -= dt;
      if (tw.cooldown > 0) continue;
      const st = this.towerStats(tw);
      let target = null;
      for (const e of this.enemies) {
        if (e.dead || e.x === undefined) continue;
        if (Math.hypot(e.x - tw.x, e.y - tw.y) <= st.range && (!target || e.dist > target.dist)) target = e;
      }
      if (!target) continue;
      tw.cooldown = st.rate;
      tw.angle = Math.atan2(target.y - tw.y, target.x - tw.x);
      this.shots.push({ x: tw.x, y: tw.y, target, dmg: st.dmg, splash: st.splash, slow: st.slow, color: st.color, speed: 340 });
    }

    for (const s of this.shots) {
      const t = s.target;
      const dx = t.x - s.x;
      const dy = t.y - s.y;
      const d = Math.hypot(dx, dy);
      const step = s.speed * dt;
      if (d <= step || t.dead) {
        s.done = true;
        if (t.dead) continue;
        if (s.splash) {
          this.effects.push({ kind: 'boom', x: t.x, y: t.y, r: s.splash, life: 0.35 });
          for (const e of this.enemies) if (!e.dead && Math.hypot(e.x - t.x, e.y - t.y) <= s.splash) this.damage(e, s.dmg);
        } else {
          this.damage(t, s.dmg);
          if (s.slow) t.slow = 1.6;
        }
      } else {
        s.x += (dx / d) * step;
        s.y += (dy / d) * step;
      }
    }

    this.shots = this.shots.filter((s) => !s.done);
    this.enemies = this.enemies.filter((e) => !e.dead);
    this.effects = this.effects.filter((f) => (f.life -= dt) > 0);

    if (this.lives <= 0) {
      this.lives = 0;
      this.phase = 'lost';
    } else if (!this.queue.length && !this.enemies.length) {
      this.money += 25 + this.wave * 10;
      this.phase = this.wave >= DEFENSE_WAVES ? 'won' : 'build';
    }
  }

  damage(e, dmg) {
    e.hp -= dmg;
    e.hurt = 0.1;
    if (e.hp <= 0 && !e.dead) {
      e.dead = true;
      this.money += e.bounty;
      this.effects.push({ kind: 'coin', x: e.x, y: e.y, text: '+' + e.bounty, life: 0.7 });
    }
  }

  wavesCleared() {
    if (this.phase === 'won') return DEFENSE_WAVES;
    return Math.max(0, this.wave - (this.phase === 'build' ? 0 : 1));
  }
}

// Premi al termine della partita. Più ondate superate, più bottino.
export function grantDefenseRewards(state, wavesCleared, rng = Math.random) {
  const gems = wavesCleared * 2;
  const scrap = Math.round(wavesCleared * 15 * (1 + state.maxStage / 10));
  state.gems += gems;
  state.scrap += scrap;
  const items = [];
  if (wavesCleared >= 3) items.push(rollItem(state.maxStage, 2, rng, 1));
  if (wavesCleared >= DEFENSE_WAVES) {
    items.push(rollItem(state.maxStage + 2, 3, rng, 2));
    items.push(rollItem(state.maxStage + 2, 3, rng, 3));
  }
  const results = processLoot(state, items);
  state.defense.bestWave = Math.max(state.defense.bestWave, wavesCleared);
  state.defense.runs++;
  return { gems, scrap, results };
}

export { TOWERS };
