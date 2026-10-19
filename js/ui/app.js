// Interfaccia principale: barra in alto, pannelli, finestre e menu in basso.
import { SLOTS, RARITIES, EXPEDITIONS, LAB, TRAINING, DEFENSE_KEYS_PER_DAY, DEFENSE_WAVES } from '../logic/data.js';
import { fmt, fmtTime, stageLabel } from '../logic/util.js';
import { heroStats, powerRating, xpToNext, trainingCost, buyTraining, labCost, buyLab } from '../logic/hero.js';
import {
  startExpedition, expeditionRemaining, expeditionReady, skipCost, skipExpedition, collectExpedition, expeditionDuration,
} from '../logic/expedition.js';
import { recycleValue } from '../logic/loot.js';
import { exportSave, importSave, refreshDailyKeys, newState } from '../logic/state.js';
import { drawRick, drawTorcio, drawPortal } from './draw.js';
import { DefenseView } from './defense-view.js';

const TABS = [
  { id: 'eroe', label: 'Goku', icon: '🥋' },
  { id: 'portale', label: 'Portale', icon: '🌀' },
  { id: 'lab', label: 'Lab di Rick', icon: '🧪' },
  { id: 'varco', label: 'Varco', icon: '🛡️' },
  { id: 'altro', label: 'Altro', icon: '⚙️' },
];

const $ = (sel, root = document) => root.querySelector(sel);

export class App {
  constructor(game) {
    this.game = game; // { state, sim, save(), replaceState(s) }
    this.tab = 'eroe';
    this.signature = '';
    this.defense = null;
    this.sceneT = 0;
    this.buildShell();
    this.renderPanel(true);
  }

  get state() {
    return this.game.state;
  }

  buildShell() {
    $('#tabs').innerHTML = TABS.map((t) => `<button data-tab="${t.id}"><span>${t.icon}</span><small>${t.label}</small><i class="badge hidden"></i></button>`).join('');
    $('#tabs').addEventListener('click', (ev) => {
      const b = ev.target.closest('[data-tab]');
      if (!b) return;
      this.tab = b.dataset.tab;
      this.renderPanel(true);
    });
    $('#panel').addEventListener('click', (ev) => this.onAction(ev));
    $('#modal').addEventListener('click', (ev) => {
      if (ev.target.id === 'modal' || ev.target.closest('[data-act="close-modal"]')) this.closeModal();
      else this.onAction(ev);
    });
  }

  // ---------- azioni ----------
  onAction(ev) {
    const el = ev.target.closest('[data-act]');
    if (!el || el.disabled) return;
    const s = this.state;
    const { act, id } = el.dataset;
    switch (act) {
      case 'train':
        if (buyTraining(s, id)) this.afterChange();
        break;
      case 'lab':
        if (buyLab(s, id)) this.afterChange();
        break;
      case 'expedition':
        if (startExpedition(s, id)) {
          this.toast('🌀 Rick apre il portale… Torcio parte in e-bike!');
          this.afterChange();
        }
        break;
      case 'skip':
        if (skipExpedition(s)) this.afterChange();
        break;
      case 'collect': {
        const res = collectExpedition(s);
        if (res) {
          this.game.sim.refreshStats();
          this.showLoot(res);
          this.afterChange();
        }
        break;
      }
      case 'slot':
        this.showItem(id);
        break;
      case 'defense':
        this.openDefense();
        break;
      case 'export':
        this.showExport();
        break;
      case 'import':
        this.doImport();
        break;
      case 'reset':
        if (confirm('Vuoi davvero cancellare tutti i progressi? Non si può annullare.')) {
          this.game.replaceState(newState());
          this.closeModal();
          this.renderPanel(true);
        }
        break;
    }
  }

  afterChange() {
    this.game.sim.refreshStats();
    this.game.save();
    this.renderPanel(true);
  }

  // ---------- aggiornamento continuo ----------
  tick(dt) {
    this.sceneT += dt;
    refreshDailyKeys(this.state);
    if (this.defense) {
      this.defense.update(dt);
      return;
    }
    this.renderHud();
    this.renderPanel(false);
    if (this.tab === 'portale') this.drawPortalScene();
    if (this.tab === 'lab') this.drawRickFace();
    // pallino sul Portale quando il bottino è pronto
    const badge = $('#tabs [data-tab="portale"] .badge');
    badge.classList.toggle('hidden', !(expeditionReady(this.state) || !this.state.expedition));
    badge.textContent = expeditionReady(this.state) ? '!' : '';
    const vbadge = $('#tabs [data-tab="varco"] .badge');
    vbadge.classList.toggle('hidden', this.state.defense.keys <= 0);
    vbadge.textContent = this.state.defense.keys;
    $('#tabs').querySelectorAll('[data-tab]').forEach((b) => b.classList.toggle('active', b.dataset.tab === this.tab));
  }

  renderHud() {
    const s = this.state;
    $('#hud-power').textContent = fmt(powerRating(s));
    $('#hud-gold').textContent = fmt(s.gold);
    $('#hud-scrap').textContent = fmt(s.scrap);
    $('#hud-gems').textContent = fmt(s.gems);
    $('#hud-level').textContent = s.hero.level;
    $('#xp-fill').style.width = `${Math.min(100, (s.hero.xp / xpToNext(s.hero.level)) * 100)}%`;
  }

  // Ricostruisce il pannello solo quando cambia qualcosa di importante,
  // così i pulsanti non spariscono sotto il dito; i numeri si aggiornano a parte.
  renderPanel(force) {
    const s = this.state;
    const sig = this.panelSignature();
    if (force || sig !== this.signature) {
      this.signature = sig;
      $('#panel').innerHTML = this[`panel_${this.tab}`]();
      if (force) $('#panel').scrollTop = 0;
    }
    for (const el of document.querySelectorAll('[data-live]')) {
      const k = el.dataset.live;
      if (k === 'exp-remaining') el.textContent = fmtTime(expeditionRemaining(s));
      if (k === 'exp-progress') {
        const e = s.expedition;
        if (e) el.style.width = `${Math.min(100, ((Date.now() - e.start) / (e.end - e.start)) * 100)}%`;
      }
      if (k === 'skip-cost') el.textContent = skipCost(s);
    }
  }

  panelSignature() {
    const s = this.state;
    const parts = [this.tab, s.hero.level, s.stage];
    if (this.tab === 'eroe') {
      parts.push(TRAINING.map((t) => s.gold >= trainingCost(t.id, s.training[t.id])).join(), JSON.stringify(s.training));
      parts.push(SLOTS.map((x) => s.equipment[x.id]?.id).join());
    }
    if (this.tab === 'portale') parts.push(s.expedition?.id, expeditionReady(s), s.gems >= (s.expedition ? skipCost(s) : 0), s.lootLog.length, s.lootLog[0]?.name);
    if (this.tab === 'lab') parts.push(LAB.map((l) => s.scrap >= labCost(l.id, s.lab[l.id])).join(), JSON.stringify(s.lab));
    if (this.tab === 'varco') parts.push(s.defense.keys, s.defense.bestWave);
    return parts.join('|');
  }

  // ---------- pannelli ----------
  panel_eroe() {
    const s = this.state;
    const st = heroStats(s);
    const slots = SLOTS.map((slot) => {
      const it = s.equipment[slot.id];
      const color = it ? RARITIES[it.rarity].color : '#3a3f4b';
      return `<button class="slot" data-act="slot" data-id="${slot.id}" style="--rc:${color}">
        <span class="slot-icon">${slot.icon}</span>
        <span class="slot-lv">${it ? fmt(it.power) : '—'}</span>
        <span class="slot-name">${slot.name}</span></button>`;
    }).join('');
    const training = TRAINING.map((t) => {
      const cost = trainingCost(t.id, s.training[t.id]);
      return `<button class="row-btn" data-act="train" data-id="${t.id}" ${s.gold < cost ? 'disabled' : ''}>
        <span class="row-icon">${t.icon}</span>
        <span class="row-text"><b>${t.name} <small>Liv. ${s.training[t.id]}</small></b><small>${t.desc}</small></span>
        <span class="row-cost">🪙 ${fmt(cost)}</span></button>`;
    }).join('');
    return `
      <div class="card hero-card">
        <div class="hero-name">Goku <small>Liv. ${s.hero.level}</small></div>
        <div class="stats">
          <div><small>Attacco</small><b>${fmt(st.atk)}</b></div>
          <div><small>Vita</small><b>${fmt(st.hp)}</b></div>
          <div><small>Colpi/s</small><b>${(1 / st.interval).toFixed(2)}</b></div>
          <div><small>Record</small><b>${stageLabel(s.maxStage)}</b></div>
        </div>
      </div>
      <h3>Equipaggiamento <small>si aggiorna da solo</small></h3>
      <div class="slots">${slots}</div>
      <h3>Allenamento</h3>
      ${training}`;
  }

  panel_portale() {
    const s = this.state;
    let body;
    if (s.expedition) {
      const exp = EXPEDITIONS.find((e) => e.id === s.expedition.id);
      if (expeditionReady(s)) {
        body = `<div class="card center glow">
          <div class="big">Torcio è tornato! 🎒</div>
          <p>Dal viaggio <b>${exp.name}</b> ha portato tanto bottino.</p>
          <button class="btn primary big-btn" data-act="collect">Raccogli il bottino</button></div>`;
      } else {
        body = `<div class="card">
          <div class="row-between"><b>${exp.name}</b><span class="muted">${exp.desc}</span></div>
          <div class="progress"><div data-live="exp-progress"></div></div>
          <div class="row-between"><span>Ritorno tra <b data-live="exp-remaining"></b></span>
          <button class="btn small gem" data-act="skip" ${s.gems < skipCost(s) ? 'disabled' : ''}>Salta 💎 <span data-live="skip-cost"></span></button></div>
          <p class="muted small">Puoi chiudere il gioco: la spedizione continua anche offline.</p></div>`;
      }
    } else {
      body = EXPEDITIONS.map((e) => `<button class="row-btn" data-act="expedition" data-id="${e.id}">
        <span class="row-icon">🌀</span>
        <span class="row-text"><b>${e.name}</b><small>${e.desc} · ${e.items[0]}-${e.items[1]} oggetti${e.chest >= 1 ? ' + cassa bonus' : e.chest ? ` · ${Math.round(e.chest * 100)}% cassa bonus` : ''}</small></span>
        <span class="row-cost">⏱ ${fmtTime(expeditionDuration(s, e.id))}</span></button>`).join('');
      body = `<p class="muted">Scegli dove Rick apre il portale. Più lungo è il viaggio, più rari sono gli oggetti.</p>${body}`;
    }
    const log = s.lootLog.slice(0, 8).map((l) => `<li style="color:${RARITIES[l.rarity].color}">${l.outcome === 'equipped' ? '⬆' : '♻'} ${l.name}</li>`).join('');
    return `<canvas id="portal-scene" width="360" height="130"></canvas>
      <h3>Spedizioni di Torcio</h3>${body}
      ${log ? `<h3>Ultimo bottino <small>⬆ indossato · ♻ riciclato in rottami</small></h3><ul class="loot-log">${log}</ul>` : ''}`;
  }

  panel_lab() {
    const s = this.state;
    const rows = LAB.map((l) => {
      const lvl = s.lab[l.id];
      const maxed = lvl >= l.max;
      const cost = labCost(l.id, lvl);
      return `<button class="row-btn" data-act="lab" data-id="${l.id}" ${maxed || s.scrap < cost ? 'disabled' : ''}>
        <span class="row-icon">${l.icon}</span>
        <span class="row-text"><b>${l.name} <small>Liv. ${lvl}/${l.max}</small></b><small>${l.desc}</small></span>
        <span class="row-cost">${maxed ? 'MAX' : '⚙️ ' + fmt(cost)}</span></button>`;
    }).join('');
    return `<div class="card rick-card"><canvas id="rick-face" width="90" height="100"></canvas>
      <p>"Ascolta, Goku, *burp*, con questi rottami ti costruisco roba che neanche a Namecc… pagami in rottami e non fare domande."</p></div>
      <h3>Laboratorio <small>si paga in rottami ⚙️</small></h3>${rows}`;
  }

  panel_varco() {
    const s = this.state;
    return `<div class="card">
      <div class="big">Difesa del Varco</div>
      <p>Il portale principale di Rick si è rotto: da lì escono ondate di mutanti. Piazza le torrette lungo la strada e non farli passare. Qui comandi tu.</p>
      <ul class="plain">
        <li>🌊 ${DEFENSE_WAVES} ondate, l'ultima con il boss</li>
        <li>🎁 Premi: gemme e rottami per ogni ondata, oggetti rari dalla 3ª ondata, due epici se le superi tutte</li>
        <li>🏆 Record: ${s.defense.bestWave}/${DEFENSE_WAVES} ondate</li>
      </ul>
      <div class="row-between"><span>🔑 Chiavi: <b>${s.defense.keys}/${DEFENSE_KEYS_PER_DAY}</b> <small class="muted">(si ricaricano ogni giorno)</small></span></div>
      <button class="btn primary big-btn" data-act="defense" ${s.defense.keys <= 0 ? 'disabled' : ''}>Entra nel Varco (usa 1 🔑)</button>
    </div>`;
  }

  panel_altro() {
    const s = this.state;
    return `<div class="card">
      <h3>Installa sul telefono</h3>
      <p><b>iPhone:</b> apri in Safari, tocca Condividi ⬆️ e poi "Aggiungi alla schermata Home".</p>
      <p><b>Android:</b> apri in Chrome, menu ⋮ e poi "Installa app".</p>
    </div>
    <div class="card">
      <h3>Statistiche</h3>
      <ul class="plain">
        <li>Nemici sconfitti: ${fmt(s.stats.kills)}</li>
        <li>Boss sconfitti: ${fmt(s.stats.bossKills)}</li>
        <li>Oggetti trovati: ${fmt(s.stats.itemsFound)}</li>
        <li>Spedizioni completate: ${fmt(s.stats.expeditions)}</li>
        <li>Partite al Varco: ${fmt(s.defense.runs)}</li>
      </ul>
    </div>
    <div class="card">
      <h3>Salvataggio</h3>
      <p class="muted small">Il gioco salva da solo su questo dispositivo. Per sicurezza (o per passare a un altro telefono) puoi copiare il codice di salvataggio.</p>
      <div class="row-gap"><button class="btn" data-act="export">Copia salvataggio</button><button class="btn" data-act="import">Carica salvataggio</button></div>
      <button class="btn danger" data-act="reset">Ricomincia da zero</button>
    </div>`;
  }

  // ---------- scene animate ----------
  drawPortalScene() {
    const c = $('#portal-scene');
    if (!c) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    if (c.width !== 360 * dpr) {
      c.width = 360 * dpr;
      c.height = 130 * dpr;
    }
    const ctx = c.getContext('2d');
    const t = this.sceneT;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const g = ctx.createLinearGradient(0, 0, 0, 130);
    g.addColorStop(0, '#1d1530');
    g.addColorStop(1, '#3a2a24');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 360, 130);
    ctx.fillStyle = '#2a201b';
    ctx.fillRect(0, 112, 360, 18);
    const s = this.state;
    const exp = s.expedition;
    const ready = expeditionReady(s);
    if (exp && !ready) {
      drawPortal(ctx, 290, 74, 42, t);
      drawRick(ctx, 60, 118, 0.85, { t, shoot: true });
      // Torcio entra nel portale e riappare ogni tanto
      const cycle = (t % 4) / 4;
      if (cycle < 0.6) {
        const x = 110 + cycle / 0.6 * 175;
        ctx.save();
        ctx.globalAlpha = x > 260 ? Math.max(0, 1 - (x - 260) / 25) : 1;
        drawTorcio(ctx, x, 118, 0.8, { t });
        ctx.restore();
      }
    } else if (ready) {
      drawPortal(ctx, 290, 74, 42, t, 0.6);
      drawRick(ctx, 60, 118, 0.85, { t });
      drawTorcio(ctx, 190, 118, 0.85, { t, bike: false, wave: true });
      ctx.font = '28px system-ui';
      ctx.fillText('🎒', 222, 112);
      ctx.fillText('📦', 140, 114 + Math.sin(t * 5) * 2);
    } else {
      drawRick(ctx, 60, 118, 0.85, { t });
      drawTorcio(ctx, 180, 118, 0.85, { t, bike: true });
      ctx.fillStyle = '#fff';
      ctx.font = '700 12px system-ui';
      ctx.fillText('Pronto a partire!', 230, 40);
    }
  }

  drawRickFace() {
    const c = $('#rick-face');
    if (!c) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    if (c.width !== 90 * dpr) {
      c.width = 90 * dpr;
      c.height = 100 * dpr;
    }
    const ctx = c.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, 90, 100);
    drawRick(ctx, 40, 160, 1.45, { t: this.sceneT });
  }

  // ---------- finestre ----------
  openModal(html) {
    $('#modal-body').innerHTML = html;
    $('#modal').classList.remove('hidden');
  }

  closeModal() {
    $('#modal').classList.add('hidden');
  }

  toast(text) {
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = text;
    $('#toasts').appendChild(el);
    setTimeout(() => el.remove(), 2600);
  }

  itemCard(item, extra = '') {
    const r = RARITIES[item.rarity];
    const slot = SLOTS.find((x) => x.id === item.slot);
    return `<div class="item" style="--rc:${r.color}">
      <span class="item-icon">${slot.icon}</span>
      <span class="item-text"><b>${item.name}</b><small>${r.name} · ${slot.stat === 'atk' ? 'Attacco' : 'Vita'} +${fmt(item.power)}</small></span>${extra}</div>`;
  }

  showLoot(res) {
    const rows = res.results
      .sort((a, b) => b.item.rarity - a.item.rarity)
      .map((r) => this.itemCard(r.item, r.outcome === 'equipped'
        ? '<span class="tag up">INDOSSATO</span>'
        : `<span class="tag">♻ ${r.value} ⚙️</span>`))
      .join('');
    const equipped = res.results.filter((r) => r.outcome === 'equipped').length;
    this.openModal(`<div class="modal-title">${res.chest ? '📦 Cassa bonus! ' : ''}Bottino: ${res.exp.name}</div>
      <p class="center">🪙 +${fmt(res.gold)} ${res.gems ? ` · 💎 +${res.gems}` : ''} · ${res.results.length} oggetti, ${equipped} indossati</p>
      <div class="item-list">${rows}</div>
      <button class="btn primary big-btn" data-act="close-modal">Fantastico!</button>`);
  }

  showItem(slotId) {
    const it = this.state.equipment[slotId];
    const slot = SLOTS.find((x) => x.id === slotId);
    if (!it) {
      this.openModal(`<div class="modal-title">${slot.icon} ${slot.name}</div><p class="center">Slot vuoto: manda Torcio in spedizione per trovare qualcosa!</p>
        <button class="btn big-btn" data-act="close-modal">Ok</button>`);
      return;
    }
    this.openModal(`<div class="modal-title">${slot.icon} ${slot.name}</div>${this.itemCard(it)}
      <p class="muted small center">Livello oggetto ${it.ilvl} · varrebbe ${recycleValue(it)} ⚙️ se riciclato.<br>Quando ne trovi uno più forte, Goku lo indossa da solo.</p>
      <button class="btn big-btn" data-act="close-modal">Ok</button>`);
  }

  showOffline(sum, expReady) {
    if (sum.seconds < 60 && !expReady) return;
    const drops = sum.drops.filter((d) => d.outcome === 'equipped').length;
    this.openModal(`<div class="modal-title">Mentre eri via (${fmtTime(sum.seconds)})</div>
      <ul class="plain big-list">
        <li>⚔️ Nemici sconfitti: <b>${fmt(sum.kills)}</b></li>
        <li>🗺️ Zona: <b>${stageLabel(sum.startStage)} → ${stageLabel(sum.endStage)}</b></li>
        <li>🪙 Oro: <b>+${fmt(sum.gold)}</b></li>
        ${sum.levels ? `<li>⭐ Goku è salito di <b>${sum.levels}</b> livelli</li>` : ''}
        ${sum.drops.length ? `<li>🎁 Oggetti trovati: <b>${sum.drops.length}</b> (${drops} indossati)</li>` : ''}
        ${expReady ? '<li>🎒 <b>Torcio è tornato dalla spedizione!</b></li>' : ''}
      </ul>
      ${sum.capped ? '<p class="muted small center">I progressi offline arrivano al massimo a 10 ore.</p>' : ''}
      <button class="btn primary big-btn" data-act="close-modal">Continua</button>`);
  }

  showExport() {
    const code = exportSave(this.state);
    this.openModal(`<div class="modal-title">Codice di salvataggio</div>
      <textarea class="save-box" readonly>${code}</textarea>
      <p class="muted small">Copialo e tienilo da parte (per esempio nelle Note).</p>
      <button class="btn big-btn" data-act="close-modal">Chiudi</button>`);
    const ta = $('.save-box');
    ta.select();
    navigator.clipboard?.writeText(code).then(() => this.toast('Salvataggio copiato'), () => {});
  }

  doImport() {
    const code = prompt('Incolla qui il codice di salvataggio');
    if (!code) return;
    try {
      this.game.replaceState(importSave(code));
      this.toast('Salvataggio caricato');
      this.renderPanel(true);
    } catch (e) {
      alert('Codice non valido');
    }
  }

  // ---------- Difesa del Varco ----------
  openDefense() {
    const s = this.state;
    if (s.defense.keys <= 0) return;
    s.defense.keys--;
    this.game.save();
    const root = $('#defense');
    root.classList.remove('hidden');
    this.defense = new DefenseView(root, s, {
      onExit: (unused) => {
        if (unused) s.defense.keys++;
        this.defense = null;
        root.classList.add('hidden');
        root.innerHTML = '';
        this.game.sim.refreshStats();
        this.game.save();
        this.renderPanel(true);
      },
      onRewards: (cleared, rewards, won) => {
        this.game.save();
        const items = rewards.results.map((r) => this.itemCard(r.item, r.outcome === 'equipped' ? '<span class="tag up">INDOSSATO</span>' : `<span class="tag">♻ ${r.value} ⚙️</span>`)).join('');
        setTimeout(() => this.openModal(`<div class="modal-title">${won ? '🏆 Varco difeso!' : 'Fine della difesa'}</div>
          <p class="center">Ondate superate: <b>${cleared}/${DEFENSE_WAVES}</b></p>
          <p class="center">💎 +${rewards.gems} · ⚙️ +${fmt(rewards.scrap)}</p>
          ${items ? `<div class="item-list">${items}</div>` : ''}
          <button class="btn primary big-btn" data-act="close-modal">Ok</button>`), won ? 900 : 300);
      },
    });
  }
}
