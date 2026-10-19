// Avvio del gioco: carica il salvataggio, calcola i progressi offline e fa girare il ciclo principale.
import { newState, loadFromStorage, saveToStorage, refreshDailyKeys } from './logic/state.js';
import { simulateOffline } from './logic/offline.js';
import { expeditionReady } from './logic/expedition.js';
import { BattleSim } from './logic/battle.js';
import { BattleView } from './ui/battle-view.js';
import { App } from './ui/app.js';

const OFFLINE_THRESHOLD = 30; // secondi di assenza oltre i quali si calcolano i progressi offline
const SAVE_EVERY = 5;

const game = {
  state: loadFromStorage(localStorage) || newState(),
  sim: null,
  save() {
    game.state.lastSeen = Date.now();
    saveToStorage(localStorage, game.state);
  },
  replaceState(s) {
    game.state = s;
    game.sim = new BattleSim(s);
    view.sim = game.sim;
    game.save();
  },
};

let view = null;
let app = null;

function catchUp() {
  const away = (Date.now() - game.state.lastSeen) / 1000;
  if (away < OFFLINE_THRESHOLD) return;
  const summary = simulateOffline(game.state, away);
  game.sim = new BattleSim(game.state);
  view.sim = game.sim;
  app.showOffline(summary, expeditionReady(game.state));
  game.save();
}

refreshDailyKeys(game.state);
game.sim = new BattleSim(game.state);
view = new BattleView(document.getElementById('battle'), game.sim);
app = new App(game);
catchUp();
game.save();

let last = performance.now();
let saveTimer = 0;
function frame(now) {
  let dt = (now - last) / 1000;
  last = now;
  if (dt > 5) {
    // Il telefono era in pausa: recuperiamo come se fossimo stati offline.
    catchUp();
    dt = 0;
  }
  dt = Math.min(dt, 0.1);
  if (!app.defense) {
    game.sim.update(dt);
    view.handle(game.sim.drainEvents());
    view.render(dt);
  }
  app.tick(dt);
  saveTimer += dt;
  if (saveTimer >= SAVE_EVERY) {
    saveTimer = 0;
    game.save();
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') game.save();
  else {
    catchUp();
    last = performance.now();
  }
});
window.addEventListener('pagehide', () => game.save());

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('./sw.js').catch((e) => console.warn('Service worker non registrato', e));
}
