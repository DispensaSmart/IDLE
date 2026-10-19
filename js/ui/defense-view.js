// Schermata della Difesa del Varco: disegno e tocchi del giocatore.
import { DefenseGame, DEF_W, DEF_H, PATH, SPOTS, grantDefenseRewards } from '../logic/defense.js';
import { TOWERS, TOWER_BY_ID, DEFENSE_WAVES } from '../logic/data.js';
import { drawEnemy, drawPortal, drawTorcio, drawRick } from './draw.js';

export class DefenseView {
  constructor(root, state, { onExit, onRewards }) {
    this.root = root;
    this.state = state;
    this.onExit = onExit;
    this.onRewards = onRewards;
    this.game = new DefenseGame(state);
    this.speed = 1;
    this.selected = null; // indice della piazzola selezionata
    this.finished = false;
    this.build();
  }

  build() {
    this.root.innerHTML = `
      <div class="def-top">
        <button class="btn small ghost" data-act="exit">✕ Esci</button>
        <div class="def-stat">🌊 <b data-k="wave"></b></div>
        <div class="def-stat">❤️ <b data-k="lives"></b></div>
        <div class="def-stat">🪙 <b data-k="money"></b></div>
        <button class="btn small ghost" data-act="speed">x1</button>
      </div>
      <div class="def-stage"><canvas></canvas><div class="def-pop hidden"></div></div>
      <div class="def-bottom">
        <div class="def-hint" data-k="hint"></div>
        <button class="btn primary" data-act="start">▶ Avvia ondata</button>
      </div>`;
    this.canvas = this.root.querySelector('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.pop = this.root.querySelector('.def-pop');
    this.dpr = Math.min(window.devicePixelRatio || 1, 3);
    this.canvas.width = DEF_W * this.dpr;
    this.canvas.height = DEF_H * this.dpr;

    this.root.addEventListener('click', (ev) => {
      const act = ev.target.closest('[data-act]')?.dataset.act;
      if (!act) return;
      if (act === 'exit') this.exit();
      if (act === 'speed') {
        this.speed = this.speed === 1 ? 2 : 1;
        ev.target.textContent = 'x' + this.speed;
      }
      if (act === 'start') this.game.startWave();
      if (act === 'build') {
        this.game.build(this.selected, ev.target.closest('[data-act]').dataset.type);
        this.closePop();
      }
      if (act === 'upgrade') {
        this.game.upgrade(this.game.towerAt(this.selected));
        this.openPop(this.selected);
      }
      if (act === 'sell') {
        this.game.sell(this.game.towerAt(this.selected));
        this.closePop();
      }
      if (act === 'close') this.closePop();
    });
    this.canvas.addEventListener('pointerdown', (ev) => this.tap(ev));
  }

  tap(ev) {
    const rect = this.canvas.getBoundingClientRect();
    const x = ((ev.clientX - rect.left) / rect.width) * DEF_W;
    const y = ((ev.clientY - rect.top) / rect.height) * DEF_H;
    let best = -1;
    let bestD = 26;
    SPOTS.forEach(([sx, sy], i) => {
      const d = Math.hypot(sx - x, sy - y);
      if (d < bestD) {
        best = i;
        bestD = d;
      }
    });
    if (best < 0 || this.game.phase === 'won' || this.game.phase === 'lost') return this.closePop();
    this.openPop(best);
  }

  openPop(i) {
    this.selected = i;
    const g = this.game;
    const tower = g.towerAt(i);
    let html;
    if (!tower) {
      html = `<div class="pop-title">Costruisci torretta</div>` +
        TOWERS.map((t) => `<button class="pop-opt" data-act="build" data-type="${t.id}" ${g.money < t.cost ? 'disabled' : ''}>
          <span class="dot" style="background:${t.color}"></span><span><b>${t.name}</b><small>${t.desc}</small></span><span class="cost">🪙${t.cost}</span></button>`).join('');
    } else {
      const st = g.towerStats(tower);
      const cost = g.upgradeCost(tower);
      html = `<div class="pop-title">${st.name} · Liv. ${tower.level}</div>
        <div class="pop-info">Danno ${Math.round(st.dmg)} · Raggio ${Math.round(st.range)}</div>
        <button class="pop-opt" data-act="upgrade" ${cost === Infinity || g.money < cost ? 'disabled' : ''}>
          <span>⬆</span><span><b>${cost === Infinity ? 'Livello massimo' : 'Potenzia'}</b></span><span class="cost">${cost === Infinity ? '' : '🪙' + cost}</span></button>
        <button class="pop-opt" data-act="sell"><span>♻</span><span><b>Vendi</b></span><span class="cost">🪙${Math.round(tower.spent * 0.6)}</span></button>`;
    }
    html += `<button class="pop-close" data-act="close">Chiudi</button>`;
    this.pop.innerHTML = html;
    const [sx, sy] = SPOTS[i];
    this.pop.style.left = `${Math.min(62, Math.max(2, (sx / DEF_W) * 100 - 18))}%`;
    this.pop.style.top = `${(sy / DEF_H) * 100 + (sy > DEF_H * 0.6 ? -40 : 5)}%`;
    this.pop.classList.remove('hidden');
  }

  closePop() {
    this.selected = null;
    this.pop.classList.add('hidden');
  }

  exit() {
    const unused = this.game.wave === 0;
    if (!this.finished && !unused) this.finish();
    this.onExit(unused);
  }

  finish() {
    if (this.finished) return;
    this.finished = true;
    const cleared = this.game.wavesCleared();
    const rewards = grantDefenseRewards(this.state, cleared);
    this.onRewards(cleared, rewards, this.game.phase === 'won');
  }

  update(dt) {
    const g = this.game;
    for (let i = 0; i < this.speed; i++) g.update(Math.min(dt, 0.05));
    if ((g.phase === 'won' || g.phase === 'lost') && !this.finished) this.finish();
    this.root.querySelector('[data-k="wave"]').textContent = `${g.wave}/${DEFENSE_WAVES}`;
    this.root.querySelector('[data-k="lives"]').textContent = g.lives;
    this.root.querySelector('[data-k="money"]').textContent = g.money;
    const startBtn = this.root.querySelector('[data-act="start"]');
    startBtn.disabled = g.phase !== 'build';
    startBtn.textContent = g.phase === 'wave' ? 'Ondata in corso…' : g.wave === 0 ? '▶ Avvia la prima ondata' : '▶ Prossima ondata';
    const hint = this.root.querySelector('[data-k="hint"]');
    hint.textContent = g.phase === 'build'
      ? 'Tocca un cerchio per piazzare o potenziare una torretta.'
      : g.phase === 'wave' ? 'Difendi il Varco! I mutanti non devono passare.' : '';
    this.render();
  }

  render() {
    const ctx = this.ctx;
    const g = this.game;
    const t = g.time;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    // terreno
    const bg = ctx.createLinearGradient(0, 0, 0, DEF_H);
    bg.addColorStop(0, '#3b3029');
    bg.addColorStop(1, '#231b17');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, DEF_W, DEF_H);
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    for (let i = 0; i < 40; i++) ctx.fillRect((i * 97) % DEF_W, (i * 53) % DEF_H, 14, 3);

    // strada
    for (const [w, c] of [[34, '#1a1310'], [28, '#6b5443']]) {
      ctx.strokeStyle = c;
      ctx.lineWidth = w;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      PATH.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.stroke();
    }

    // il Varco da difendere, con Rick e Torcio
    drawPortal(ctx, 180, 530, 30, t);
    drawRick(ctx, 120, 552, 0.45, { t });
    drawTorcio(ctx, 246, 552, 0.5, { t, bike: false, wave: true, flip: true });

    // piazzole
    SPOTS.forEach(([x, y], i) => {
      if (g.towerAt(i)) return;
      ctx.strokeStyle = this.selected === i ? '#7dff6a' : 'rgba(255,255,255,0.45)';
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(x, y, 15, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
      if (g.phase === 'build') {
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.font = '700 14px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText('+', x, y + 5);
      }
    });

    // torrette
    for (const tw of g.towers) {
      const st = g.towerStats(tw);
      if (this.selected === tw.spot) {
        ctx.fillStyle = 'rgba(125,255,106,0.12)';
        ctx.beginPath(); ctx.arc(tw.x, tw.y, st.range, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = '#2a2a31';
      ctx.strokeStyle = '#111';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.roundRect(tw.x - 14, tw.y - 14, 28, 28, 6); ctx.fill(); ctx.stroke();
      ctx.save();
      ctx.translate(tw.x, tw.y);
      ctx.rotate(tw.angle);
      ctx.fillStyle = st.color;
      ctx.fillRect(0, -3.5, tw.type === 'plasma' ? 18 : 15, 7);
      ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.restore();
      for (let l = 0; l < tw.level; l++) {
        ctx.fillStyle = '#ffd84d';
        ctx.beginPath(); ctx.arc(tw.x - 8 + l * 8, tw.y + 19, 2.6, 0, Math.PI * 2); ctx.fill();
      }
    }

    // mutanti
    const kinds = { mutante: 'mutante', ratto: 'ratto', robot: 'robot', boss: 'boss' };
    for (const e of g.enemies) {
      if (e.x === undefined) continue;
      if (e.slow > 0) {
        ctx.fillStyle = 'rgba(168,240,255,0.35)';
        ctx.beginPath(); ctx.arc(e.x, e.y - 6, 13, 0, Math.PI * 2); ctx.fill();
      }
      drawEnemy(ctx, e.x, e.y + 8, e.size, kinds[e.kind], { t: t + e.dist * 0.01, hurt: e.hurt });
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(e.x - 12, e.y - 30 * e.size * 1.8, 24, 4);
      ctx.fillStyle = e.kind === 'boss' ? '#c25cff' : '#ff5c5c';
      ctx.fillRect(e.x - 12, e.y - 30 * e.size * 1.8, 24 * Math.max(0, e.hp / e.maxHp), 4);
    }

    // proiettili ed effetti
    for (const s of g.shots) {
      ctx.fillStyle = s.color;
      ctx.beginPath(); ctx.arc(s.x, s.y, s.splash ? 4.5 : 3, 0, Math.PI * 2); ctx.fill();
    }
    for (const f of g.effects) {
      if (f.kind === 'boom') {
        ctx.fillStyle = `rgba(255,140,40,${f.life * 2})`;
        ctx.beginPath(); ctx.arc(f.x, f.y, f.r * (1.2 - f.life), 0, Math.PI * 2); ctx.fill();
      } else if (f.kind === 'coin') {
        ctx.fillStyle = '#ffd84d';
        ctx.font = '800 12px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText(f.text, f.x, f.y - 20 - (0.7 - f.life) * 30);
      } else if (f.kind === 'leak') {
        ctx.fillStyle = `rgba(255,60,60,${f.life})`;
        ctx.beginPath(); ctx.arc(f.x, f.y, 30 * (1 - f.life), 0, Math.PI * 2); ctx.fill();
      }
    }

    if (g.phase === 'won' || g.phase === 'lost') {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, DEF_W, DEF_H);
      ctx.fillStyle = g.phase === 'won' ? '#7dff6a' : '#ff7a7a';
      ctx.font = '900 26px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(g.phase === 'won' ? 'VARCO DIFESO!' : 'IL VARCO È CADUTO', DEF_W / 2, DEF_H / 2);
    }
  }
}
