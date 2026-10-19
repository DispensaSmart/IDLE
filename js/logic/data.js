// Dati di gioco: slot, rarità, spedizioni, laboratorio di Rick, torrette del Varco.

export const SLOTS = [
  { id: 'arma', name: 'Arma', stat: 'atk', base: 6, icon: '🔫' },
  { id: 'elmo', name: 'Elmo', stat: 'hp', base: 35, icon: '⛑️' },
  { id: 'armatura', name: 'Armatura', stat: 'hp', base: 55, icon: '🦺' },
  { id: 'guanti', name: 'Guanti', stat: 'atk', base: 4, icon: '🥊' },
  { id: 'stivali', name: 'Stivali', stat: 'hp', base: 25, icon: '🥾' },
  { id: 'amuleto', name: 'Amuleto', stat: 'atk', base: 3, icon: '🧿' },
  { id: 'anello', name: 'Anello', stat: 'atk', base: 3, icon: '💍' },
  { id: 'reliquia', name: 'Reliquia', stat: 'hp', base: 40, icon: '🔋' },
];

export const SLOT_BY_ID = Object.fromEntries(SLOTS.map((s) => [s.id, s]));

export const RARITIES = [
  { id: 0, name: 'Comune', color: '#9aa3ad', mult: 1, weight: 60 },
  { id: 1, name: 'Non comune', color: '#4cc96b', mult: 1.5, weight: 26 },
  { id: 2, name: 'Raro', color: '#3d9bff', mult: 2.2, weight: 10 },
  { id: 3, name: 'Epico', color: '#b25cff', mult: 3.3, weight: 3.2 },
  { id: 4, name: 'Leggendario', color: '#ff9d1c', mult: 5, weight: 0.7 },
  { id: 5, name: 'Mitico', color: '#ff3b5c', mult: 8, weight: 0.1 },
];

// Nomi generati: [nome base per slot] + [suffisso per rarità].
export const ITEM_NAMES = {
  arma: ['Blaster arrugginito', 'Fucile a plasma', 'Pistola a fotoni', 'Lancia-ioni', 'Cannone da polso'],
  elmo: ['Casco da rottamaio', 'Elmo anti-radiazioni', 'Visore tattico', 'Casco di lamiera', 'Maschera antigas'],
  armatura: ['Corazza di rottami', 'Giubbotto in kevlar', 'Armatura a piastre', 'Tuta schermata', 'Esoscheletro'],
  guanti: ['Guanti da officina', 'Pugni d\'acciaio', 'Guanti magnetici', 'Tirapugni al neon', 'Guanti a energia'],
  stivali: ['Anfibi consumati', 'Stivali anti-acido', 'Stivali gravitazionali', 'Scarponi blindati', 'Stivali a reazione'],
  amuleto: ['Bullone fortunato', 'Chip ciondolo', 'Medaglione al cobalto', 'Cristallo di portale', 'Occhio di drone'],
  anello: ['Anello di filo di rame', 'Anello a induzione', 'Sigillo di batteria', 'Anello quantistico', 'Anello Schwifty'],
  reliquia: ['Batteria di scorta', 'Nucleo di fusione', 'Cella di plutonio', 'Sfera del drago (falsa)', 'Fiala di Rick'],
};

export const RARITY_SUFFIX = ['', '', ' rinforzato', ' dimensionale', ' leggendario', ' di Rick C-137'];

// Spedizioni attraverso i portali di Rick. Bottino "Tanto": 5-10 oggetti più casse bonus.
export const EXPEDITIONS = [
  { id: 'salto', name: 'Salto rapido', desc: 'Dimensione dietro l\'angolo', minutes: 1, items: [5, 6], luck: 0, chest: 0.15, goldMult: 2 },
  { id: 'vicina', name: 'Dimensione vicina', desc: 'Discarica intergalattica', minutes: 15, items: [6, 8], luck: 1, chest: 0.3, goldMult: 8 },
  { id: 'lontana', name: 'Dimensione lontana', desc: 'Pianeta dei mutanti', minutes: 60, items: [7, 9], luck: 2, chest: 0.5, goldMult: 25 },
  { id: 'notte', name: 'Viaggio notturno', desc: 'La Cittadella dei Rick', minutes: 480, items: [8, 10], luck: 3.5, chest: 1, goldMult: 120 },
];

export const EXP_BY_ID = Object.fromEntries(EXPEDITIONS.map((e) => [e.id, e]));

// Laboratorio di Rick: potenziamenti pagati con i rottami.
export const LAB = [
  { id: 'portale', name: 'Portale stabilizzato', desc: '+ fortuna sulla rarità del bottino', icon: '🌀', max: 20, base: 40 },
  { id: 'turbo', name: 'Turbo e-bike', desc: '-8% durata delle spedizioni', icon: '🚲', max: 8, base: 60 },
  { id: 'saiyan', name: 'Siero Saiyan', desc: '+10% attacco di Goku', icon: '💪', max: 50, base: 30 },
  { id: 'scudo', name: 'Scudo al plutonio', desc: '+10% vita di Goku', icon: '🛡️', max: 50, base: 30 },
  { id: 'torrette', name: 'Torrette potenziate', desc: '+15% danno delle torrette nel Varco', icon: '🗼', max: 20, base: 50 },
];

export const LAB_BY_ID = Object.fromEntries(LAB.map((l) => [l.id, l]));

// Potenziamenti di Goku pagati con l'oro.
export const TRAINING = [
  { id: 'atk', name: 'Allenamento forza', desc: '+10% attacco', icon: '👊', base: 25 },
  { id: 'hp', name: 'Allenamento resistenza', desc: '+10% vita', icon: '❤️', base: 25 },
  { id: 'spd', name: 'Allenamento velocità', desc: '+4% velocità d\'attacco', icon: '⚡', base: 60 },
];

// Difesa del Varco: torrette che il giocatore piazza a mano.
export const TOWERS = [
  { id: 'blaster', name: 'Blaster', cost: 40, color: '#3dd6ff', range: 78, rate: 0.45, dmg: 9, desc: 'Colpi rapidi' },
  { id: 'plasma', name: 'Cannone al plasma', cost: 70, color: '#ff7a1a', range: 70, rate: 1.4, dmg: 22, splash: 34, desc: 'Danno ad area' },
  { id: 'crio', name: 'Crio-rallentatore', cost: 55, color: '#a8f0ff', range: 64, rate: 0.9, dmg: 4, slow: 0.45, desc: 'Rallenta i mutanti' },
];

export const TOWER_BY_ID = Object.fromEntries(TOWERS.map((t) => [t.id, t]));

export const DEFENSE_WAVES = 5;
export const DEFENSE_KEYS_PER_DAY = 3;
export const OFFLINE_CAP_SECONDS = 10 * 3600;
