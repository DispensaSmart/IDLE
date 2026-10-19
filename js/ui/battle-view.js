// Disegna la battaglia automatica leggendo lo stato di BattleSim.
import { drawGoku, drawRick, drawEnemy, makeBackground } from './draw.js';
import { fmt, stageLabel } from '../logic/util.js';
import { enemiesInStage } from '../logic/hero.js';
import { RARITIES } from '../logic/data.js';

export const VIEW_W = 360;
export const VIEW_H = 230;
const GROUND = 196;
const HERO_X = 112;
const ENEMY_X = 262;

export class BattleView {
  constructor(canvas, sim) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.sim = sim;
    this.t = 0;
    this.floaters = [];
    this.heroAnim = { pose: 'idle', time: 0 };
    this.enemyHurt = 0;
    this.beam = 0;
    this.shake = 0;
    this.banner = null;
    this.bgZone = 0;
    this.resize();
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    this.canvas.width = VIEW_W * dpr;
    this.canvas.height = VIEW_H * dpr;
    this.dpr = dpr;
  }

  // Trasforma gli eventi della simulazione in effetti visivi.
  handle(events) {
    for (const e of events) {
      switch (e.type) {
        case 'hit':
          this.heroAnim = { pose: 'attack', time: 0.18 };
          this.enemyHurt = 0.12;
          this.float(fmt(e.dmg), ENEMY_X, 120, e.crit ? '#ffdd33' : '#fff', e.crit ? 18 : 14);
          break;
        case 'special':
          this.heroAnim = { pose: 'special', time: 0.55 };
          this.beam = 0.5;
          this.enemyHurt = 0.4;
          this.shake = 0.3;
          this.float('KAMEHAMEHA!', 180, 70, '#7fe7ff', 16);
          this.float(fmt(e.dmg), ENEMY_X, 110, '#7fe7ff', 20);
          break;
        case 'enemyHit':
          this.heroAnim = { pose: 'hurt', time: 0.15 };
          this.float('-' + fmt(e.dmg), HERO_X, 110, '#ff5c5c', 13);
          break;
        case 'kill':
          this.float('+' + fmt(e.gold) + ' 🪙', ENEMY_X, 90, '#ffd84d', 13);
          break;
        case 'levelUp':
          this.float('LIVELLO ' + e.level + '!', HERO_X, 60, '#7dff6a', 15);
          break;
        case 'drop': {
          const r = e.result;
          const label = r.outcome === 'equipped' ? '⬆ ' + r.item.name : '♻ ' + r.item.name;
          this.float(label, VIEW_W / 2, 40, RARITIES[r.item.rarity].color, 12, 2);
          break;
        }
        case 'stageClear':
          if (e.boss) this.banner = { text: 'BOSS SCONFITTO!', time: 1.6, color: '#ffcc33' };
          break;
        case 'heroDown':
          this.banner = { text: 'Goku si ritira… allenati e riprova!', time: 1.6, color: '#ff7a7a' };
          break;
      }
    }
  }

  float(text, x, y, color, size = 14, life = 1.1) {
    this.floaters.push({ text, x: x + (Math.random() - 0.5) * 20, y, color, size, life, max: life });
  }

  render(dt) {
    this.t += dt;
    const ctx = this.ctx;
    const sim = this.sim;
    const state = sim.state;
    const zone = Math.floor((state.stage - 1) / 10) + 1;
    if (zone !== this.bgZone) {
      this.bg = makeBackground(VIEW_W, VIEW_H, zone);
      this.bgZone = zone;
    }

    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    if (this.shake > 0) {
      this.shake -= dt;
      ctx.translate((Math.random() - 0.5) * 6, (Math.random() - 0.5) * 4);
    }
    ctx.drawImage(this.bg, 0, 0, VIEW_W, VIEW_H);

    // Rick in disparte che osserva
    drawRick(ctx, 38, GROUND - 4, 0.62, { t: this.t });

    // Goku
    this.heroAnim.time -= dt;
    const pose = this.heroAnim.time > 0 ? this.heroAnim.pose : 'idle';
    const lunge = pose === 'attack' ? 14 : 0;
    const down = sim.phase === 'down';
    if (down) {
      ctx.save();
      ctx.globalAlpha = 0.5;
    }
    shadow(ctx, HERO_X + lunge, GROUND, 18);
    drawGoku(ctx, HERO_X + lunge, GROUND, 1, { pose: down ? 'hurt' : pose, t: this.t, ssj: pose === 'special' || state.stage % 10 === 0 });
    if (down) ctx.restore();

    // nemico
    const e = sim.enemy;
    let ex = ENEMY_X;
    if (sim.phase === 'walk') ex = ENEMY_X + (1 - Math.min(1, sim.phaseTime / 0.7)) * 120;
    this.enemyHurt -= dt;
    const es = e.boss ? 1.05 : 0.9;
    shadow(ctx, ex, GROUND, e.boss ? 30 : 18);
    drawEnemy(ctx, ex, GROUND, es, e.kind, { t: this.t, hurt: this.enemyHurt });

    // raggio della Kamehameha
    if (this.beam > 0) {
      this.beam -= dt;
      const a = Math.min(1, this.beam * 4);
      const y = GROUND - 38;
      const grad = ctx.createLinearGradient(0, y - 12, 0, y + 12);
      grad.addColorStop(0, 'rgba(60,160,255,0)');
      grad.addColorStop(0.3, `rgba(120,220,255,${a})`);
      grad.addColorStop(0.5, `rgba(255,255,255,${a})`);
      grad.addColorStop(0.7, `rgba(120,220,255,${a})`);
      grad.addColorStop(1, 'rgba(60,160,255,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(HERO_X + 30, y - 12, ex - HERO_X - 20, 24);
      ctx.fillStyle = `rgba(200,245,255,${a})`;
      ctx.beginPath(); ctx.arc(ex - 4, y, 16, 0, Math.PI * 2); ctx.fill();
    }

    // barre della vita
    bar(ctx, HERO_X - 30, GROUND + 10, 60, 7, sim.heroHp / sim.stats.hp, '#4cd964');
    bar(ctx, ENEMY_X - 32, GROUND + 10, 64, 7, Math.max(0, e.hp) / e.maxHp, e.boss ? '#c25cff' : '#ff5c5c');

    // intestazione dello stadio
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.beginPath(); ctx.roundRect(VIEW_W / 2 - 70, 6, 140, 34, 10); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '800 14px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText((e.boss ? '☠ BOSS ' : 'Zona ') + stageLabel(state.stage), VIEW_W / 2, 22);
    const total = enemiesInStage(state.stage);
    for (let i = 0; i < total; i++) {
      ctx.fillStyle = i < state.killsInStage ? '#7dff6a' : 'rgba(255,255,255,0.3)';
      ctx.beginPath(); ctx.arc(VIEW_W / 2 - (total - 1) * 7 + i * 14, 32, 3.5, 0, Math.PI * 2); ctx.fill();
    }

    // numeri e scritte che salgono
    ctx.textAlign = 'center';
    this.floaters = this.floaters.filter((f) => (f.life -= dt) > 0);
    for (const f of this.floaters) {
      const p = 1 - f.life / f.max;
      ctx.globalAlpha = Math.min(1, f.life * 3);
      ctx.font = `900 ${f.size}px system-ui, sans-serif`;
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(0,0,0,0.7)';
      ctx.strokeText(f.text, f.x, f.y - p * 30);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, f.x, f.y - p * 30);
    }
    ctx.globalAlpha = 1;

    if (this.banner) {
      this.banner.time -= dt;
      if (this.banner.time <= 0) this.banner = null;
      else {
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillRect(0, 84, VIEW_W, 30);
        ctx.fillStyle = this.banner.color;
        ctx.font = '900 15px system-ui, sans-serif';
        ctx.fillText(this.banner.text, VIEW_W / 2, 104);
      }
    }
  }
}

function shadow(ctx, x, y, r) {
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath(); ctx.ellipse(x, y, r, 4, 0, 0, Math.PI * 2); ctx.fill();
}

function bar(ctx, x, y, w, h, ratio, color) {
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.beginPath(); ctx.roundRect(x - 1, y - 1, w + 2, h + 2, 4); ctx.fill();
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.roundRect(x, y, Math.max(0, w * Math.min(1, ratio)), h, 3); ctx.fill();
}
