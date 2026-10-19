// Disegni dei personaggi in stile cartoon, fatti solo con il codice (nessuna immagine esterna).
// Ogni funzione disegna con i piedi in (x, y); s è la scala (1 = circa 70 px di altezza).

const OUTLINE = '#1b1424';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function fillStroke(ctx, fill, lw = 2) {
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = lw;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
}

function poly(ctx, pts) {
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
}

// ---------- GOKU ----------
// pose: 'idle' | 'attack' | 'special' | 'hurt'; ssj: capelli dorati.
export function drawGoku(ctx, x, y, s = 1, { pose = 'idle', t = 0, ssj = false, flip = false } = {}) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(flip ? -s : s, s);
  const bob = pose === 'idle' ? Math.sin(t * 4) * 1.2 : 0;
  ctx.translate(0, bob);
  if (pose === 'hurt') ctx.rotate(-0.12);

  const skin = '#ffd2a8';
  const gi = '#ff8a1e';
  const blue = '#2350c8';

  // aura quando è in Super Saiyan
  if (ssj) {
    const g = ctx.createRadialGradient(0, -38, 6, 0, -38, 48);
    g.addColorStop(0, 'rgba(255,240,120,0.55)');
    g.addColorStop(1, 'rgba(255,200,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(0, -36, 34, 48 + Math.sin(t * 20) * 3, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // gambe e stivali
  rr(ctx, -12, -26, 10, 20, 3); fillStroke(ctx, gi);
  rr(ctx, 2, -26, 10, 20, 3); fillStroke(ctx, gi);
  rr(ctx, -14, -8, 13, 8, 3); fillStroke(ctx, blue);
  rr(ctx, 1, -8, 14, 8, 3); fillStroke(ctx, blue);
  ctx.fillStyle = '#d8342c';
  ctx.fillRect(-13, -9, 11, 2);
  ctx.fillRect(2, -9, 12, 2);

  // braccio dietro
  const backArm = pose === 'special' ? [[6, -46], [26, -44], [26, -38], [6, -40]] : [[-10, -46], [-16, -30], [-10, -28], [-5, -42]];
  poly(ctx, backArm); fillStroke(ctx, skin);

  // busto
  poly(ctx, [[-14, -50], [14, -50], [12, -26], [-12, -26]]); fillStroke(ctx, gi);
  // maglia blu sotto (scollo a V) e cintura
  poly(ctx, [[-6, -50], [6, -50], [0, -40]]); fillStroke(ctx, blue, 1.5);
  rr(ctx, -13, -29, 26, 5, 2); fillStroke(ctx, blue, 1.5);
  // simbolo sul petto
  ctx.beginPath(); ctx.arc(7, -44, 3.2, 0, Math.PI * 2); fillStroke(ctx, '#fff', 1);
  ctx.fillStyle = OUTLINE; ctx.fillRect(6, -46, 2, 4);

  // braccio davanti
  let arm;
  if (pose === 'attack') arm = [[8, -47], [32, -45], [32, -39], [8, -41]];
  else if (pose === 'special') arm = [[8, -45], [28, -40], [28, -34], [8, -39]];
  else arm = [[9, -47], [15, -30], [10, -28], [5, -43]];
  poly(ctx, arm); fillStroke(ctx, skin);
  // polsino blu
  const wrist = pose === 'attack' ? [26, -46, 5, 8] : pose === 'special' ? [22, -42, 5, 8] : [9, -34, 7, 4];
  rr(ctx, ...wrist, 1); fillStroke(ctx, blue, 1.5);

  if (pose === 'special') {
    const glow = ctx.createRadialGradient(34, -38, 1, 34, -38, 12);
    glow.addColorStop(0, '#ffffff');
    glow.addColorStop(0.4, '#7fe7ff');
    glow.addColorStop(1, 'rgba(60,160,255,0)');
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(34, -38, 12, 0, Math.PI * 2); ctx.fill();
  }

  // testa
  ctx.beginPath(); ctx.ellipse(1, -61, 10, 11, 0, 0, Math.PI * 2); fillStroke(ctx, skin);
  // capelli a punte
  const hair = ssj ? '#ffe03a' : '#1a1a22';
  ctx.fillStyle = hair;
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 2;
  const spikes = ssj
    ? [[-12, -64], [-20, -84], [-6, -72], [-4, -94], [4, -73], [12, -92], [10, -70], [22, -80], [12, -62], [8, -66], [-4, -66]]
    : [[-11, -60], [-24, -68], [-11, -70], [-18, -84], [-5, -74], [0, -90], [5, -73], [16, -84], [10, -68], [20, -70], [11, -62], [6, -67], [-2, -64], [-6, -66]];
  poly(ctx, spikes); ctx.fill(); ctx.stroke();
  // ciuffo sulla fronte
  poly(ctx, [[-2, -68], [4, -60], [6, -68]]); ctx.fill();
  // occhi e bocca
  ctx.fillStyle = OUTLINE;
  ctx.fillRect(3, -62, 2.5, 4);
  ctx.fillRect(8, -62, 2.5, 4);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(2, -64.5); ctx.lineTo(6, -65.5);
  ctx.moveTo(7.5, -65.5); ctx.lineTo(11, -64.5);
  ctx.stroke();
  ctx.beginPath();
  if (pose === 'attack' || pose === 'special') ctx.ellipse(7, -54.5, 2.5, 2, 0, 0, Math.PI * 2);
  else ctx.arc(7, -56, 2.5, 0.2, Math.PI - 0.2);
  pose === 'attack' || pose === 'special' ? ctx.fill() : ctx.stroke();

  ctx.restore();
}

// ---------- RICK ----------
export function drawRick(ctx, x, y, s = 1, { t = 0, shoot = false, flip = false } = {}) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(flip ? -s : s, s);
  const sway = Math.sin(t * 1.6) * 0.03;
  ctx.rotate(sway);

  const skin = '#f3d6c0';
  // gambe (pantaloni marroni) e scarpe
  rr(ctx, -9, -30, 7, 26, 2); fillStroke(ctx, '#7a5634');
  rr(ctx, 2, -30, 7, 26, 2); fillStroke(ctx, '#7a5634');
  rr(ctx, -11, -6, 10, 6, 2); fillStroke(ctx, '#3a2a1e');
  rr(ctx, 1, -6, 11, 6, 2); fillStroke(ctx, '#3a2a1e');
  // camice bianco
  poly(ctx, [[-13, -62], [13, -62], [16, -22], [-16, -22]]); fillStroke(ctx, '#f4f6f8');
  // maglia azzurra
  poly(ctx, [[-6, -62], [6, -62], [5, -32], [-5, -32]]); fillStroke(ctx, '#9fd2f0', 1.5);
  // risvolti del camice
  ctx.strokeStyle = '#aeb6be'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(-6, -62); ctx.lineTo(-3, -48); ctx.moveTo(6, -62); ctx.lineTo(3, -48); ctx.stroke();
  // braccio con la pistola dei portali
  const armEnd = shoot ? [30, -50] : [16, -38];
  ctx.strokeStyle = OUTLINE; ctx.lineWidth = 8; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(9, -58); ctx.lineTo(...armEnd); ctx.stroke();
  ctx.strokeStyle = '#f4f6f8'; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.moveTo(9, -58); ctx.lineTo(...armEnd); ctx.stroke();
  // pistola dei portali
  ctx.save();
  ctx.translate(armEnd[0], armEnd[1]);
  rr(ctx, -2, -4, 14, 7, 2); fillStroke(ctx, '#c9ccd0', 1.5);
  ctx.beginPath(); ctx.arc(10, -0.5, 3, 0, Math.PI * 2); fillStroke(ctx, '#5cff6c', 1.2);
  ctx.restore();
  // collo e testa allungata
  rr(ctx, -3, -68, 6, 7, 2); fillStroke(ctx, skin, 1.5);
  ctx.beginPath(); ctx.ellipse(1, -78, 10, 12, 0, 0, Math.PI * 2); fillStroke(ctx, skin);
  // capelli azzurro-grigi a punte all'indietro
  ctx.fillStyle = '#b9e3f2';
  poly(ctx, [[-8, -88], [-24, -96], [-12, -84], [-26, -84], [-11, -78], [-24, -70], [-9, -72], [-6, -66], [-4, -84], [4, -90], [-4, -96], [-8, -92]]);
  ctx.fill(); ctx.strokeStyle = OUTLINE; ctx.lineWidth = 2; ctx.stroke();
  // monociglio e occhi
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-1, -83); ctx.quadraticCurveTo(5, -86, 11, -82); ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(3, -79, 2.8, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.arc(9, -79, 2.8, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = OUTLINE;
  ctx.fillRect(3, -80, 1.5, 1.5); ctx.fillRect(9, -80, 1.5, 1.5);
  // bocca storta con la bava
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(1, -71); ctx.lineTo(10, -72.5); ctx.stroke();
  ctx.strokeStyle = '#9fe7ff';
  ctx.beginPath(); ctx.moveTo(2, -71); ctx.quadraticCurveTo(3, -67 + Math.sin(t * 3), 1, -66); ctx.stroke();
  ctx.restore();
}

// ---------- TORCIO (minifigure Lego in e-bike) ----------
export function drawTorcio(ctx, x, y, s = 1, { t = 0, bike = true, wave = false, flip = false } = {}) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(flip ? -s : s, s);
  const skin = '#f6c79a';
  const orange = '#ff6a13';

  if (bike) drawEbike(ctx, t);

  const seatY = bike ? -34 : 0;
  ctx.save();
  ctx.translate(bike ? -2 : 0, seatY);
  if (bike) {
    // gambe piegate sui pedali
    const pedal = Math.sin(t * 10) * 4;
    rr(ctx, -8, -24, 16, 8, 2); fillStroke(ctx, '#8a8f94');
    poly(ctx, [[-2, -20], [10, -20], [12, 0 + pedal], [4, 0 + pedal]]); fillStroke(ctx, '#7c8187');
    rr(ctx, 2, -2 + pedal, 12, 6, 1.5); fillStroke(ctx, '#2a6fa8');
  } else {
    // anca e gambe dritte (grigie con bande nere e scarpe blu)
    rr(ctx, -10, -26, 20, 5, 1.5); fillStroke(ctx, '#8a8f94');
    rr(ctx, -10, -21, 9.5, 15, 1.5); fillStroke(ctx, '#7c8187');
    rr(ctx, 0.5, -21, 9.5, 15, 1.5); fillStroke(ctx, '#7c8187');
    ctx.fillStyle = '#2b2b2b'; ctx.fillRect(-10, -12, 9.5, 3); ctx.fillRect(0.5, -12, 9.5, 3);
    rr(ctx, -11, -6, 11, 6, 1.5); fillStroke(ctx, '#2a6fa8');
    rr(ctx, 0, -6, 11, 6, 1.5); fillStroke(ctx, '#2a6fa8');
  }
  // busto trapezoidale: gilet nero con zip e maniche arancioni
  poly(ctx, [[-10, -46], [10, -46], [13, -24], [-13, -24]]); fillStroke(ctx, '#1f1f24');
  ctx.strokeStyle = '#c0c4c8'; ctx.lineWidth = 1.3;
  ctx.beginPath(); ctx.moveTo(0, -46); ctx.lineTo(0, -24); ctx.stroke();
  ctx.strokeStyle = orange; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(-7, -36); ctx.lineTo(-7, -30); ctx.stroke();
  // braccia arancioni e mani a "C"
  const armA = wave ? -0.9 + Math.sin(t * 8) * 0.3 : bike ? -1.1 : 0.15;
  for (const [ax, ang] of [[-11, wave ? armA : 0.15], [11, bike ? armA : -0.15]]) {
    ctx.save();
    ctx.translate(ax, -44);
    ctx.rotate(ang);
    rr(ctx, -3.5, 0, 7, 14, 3); fillStroke(ctx, orange, 1.5);
    ctx.beginPath(); ctx.arc(0, 17, 3.6, 0.6, Math.PI * 2 - 0.6); fillStroke(ctx, skin, 1.5);
    ctx.restore();
  }
  // collo e testa cilindrica
  rr(ctx, -4, -49, 8, 4, 1); fillStroke(ctx, skin, 1.5);
  rr(ctx, -9, -66, 18, 17, 5); fillStroke(ctx, skin);
  // occhi, sopracciglia e sorriso Lego
  ctx.fillStyle = OUTLINE;
  ctx.beginPath(); ctx.arc(-3.5, -58.5, 1.7, 0, Math.PI * 2); ctx.arc(3.5, -58.5, 1.7, 0, Math.PI * 2); ctx.fill();
  ctx.lineWidth = 1.6; ctx.strokeStyle = OUTLINE;
  ctx.beginPath(); ctx.moveTo(-6, -62); ctx.lineTo(-1.5, -61); ctx.moveTo(1.5, -61); ctx.lineTo(6, -62); ctx.stroke();
  ctx.beginPath(); ctx.arc(0, -55, 4, 0.25, Math.PI - 0.25); ctx.stroke();
  // casco arancione in bici, capelli castani corti a piedi
  if (bike) {
    ctx.beginPath(); ctx.ellipse(0, -66, 12, 8, 0, Math.PI, 0); ctx.lineTo(12, -63); ctx.lineTo(-12, -63); ctx.closePath();
    fillStroke(ctx, orange);
    ctx.fillStyle = '#1f1f24';
    ctx.fillRect(-5, -71, 3, 3); ctx.fillRect(1, -71, 3, 3);
  } else {
    ctx.beginPath(); ctx.ellipse(0, -65, 10.5, 5.5, 0, Math.PI, 0); ctx.lineTo(10, -62); ctx.lineTo(-10, -62); ctx.closePath();
    fillStroke(ctx, '#6b3f22');
  }
  ctx.restore();
  ctx.restore();
}

function drawEbike(ctx, t) {
  const spin = t * 8;
  for (const wx of [-22, 24]) {
    ctx.beginPath(); ctx.arc(wx, -12, 12, 0, Math.PI * 2);
    ctx.fillStyle = '#18181c'; ctx.fill();
    ctx.beginPath(); ctx.arc(wx, -12, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#3a3a40'; ctx.fill();
    ctx.strokeStyle = '#8c8c94'; ctx.lineWidth = 1;
    for (let i = 0; i < 4; i++) {
      const a = spin + (i * Math.PI) / 4;
      ctx.beginPath(); ctx.moveTo(wx - Math.cos(a) * 8, -12 - Math.sin(a) * 8); ctx.lineTo(wx + Math.cos(a) * 8, -12 + Math.sin(a) * 8); ctx.stroke();
    }
  }
  // telaio arancione con batteria nera
  ctx.strokeStyle = OUTLINE; ctx.lineWidth = 6; ctx.lineCap = 'round';
  const frame = () => {
    ctx.beginPath();
    ctx.moveTo(-22, -12); ctx.lineTo(-4, -14); ctx.lineTo(16, -34); ctx.lineTo(24, -12);
    ctx.moveTo(-4, -14); ctx.lineTo(-6, -34); ctx.lineTo(16, -34);
    ctx.moveTo(-22, -12); ctx.lineTo(-6, -32);
    ctx.stroke();
  };
  frame();
  ctx.strokeStyle = '#ff6a13'; ctx.lineWidth = 3.5;
  frame();
  ctx.save();
  ctx.translate(5, -26); ctx.rotate(-0.75);
  rr(ctx, -9, -3, 18, 6, 2); fillStroke(ctx, '#1f1f24', 1.2);
  ctx.restore();
  ctx.fillStyle = '#1f1f24';
  ctx.font = 'bold 5px sans-serif';
  // manubrio e sella
  ctx.strokeStyle = '#1f1f24'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(16, -34); ctx.lineTo(14, -42); ctx.lineTo(20, -43); ctx.stroke();
  rr(ctx, -12, -37, 12, 4, 2); fillStroke(ctx, '#1f1f24', 1.2);
}

// ---------- NEMICI ----------
export function drawEnemy(ctx, x, y, s, kind, { t = 0, hurt = 0 } = {}) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  const flash = hurt > 0;
  const bob = Math.sin(t * 5) * 1.5;
  switch (kind) {
    case 'robot': {
      rr(ctx, -12, -10, 8, 10, 2); fillStroke(ctx, '#5b6470');
      rr(ctx, 4, -10, 8, 10, 2); fillStroke(ctx, '#5b6470');
      rr(ctx, -16, -44 + bob, 32, 34, 4); fillStroke(ctx, flash ? '#fff' : '#8d99a6');
      rr(ctx, -11, -62 + bob, 22, 18, 3); fillStroke(ctx, flash ? '#fff' : '#a9b4bf');
      ctx.fillStyle = '#ff3b3b'; ctx.fillRect(-8, -56 + bob, 16, 4);
      ctx.strokeStyle = OUTLINE; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, -62 + bob); ctx.lineTo(0, -70 + bob); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, -72 + bob, 2.5, 0, Math.PI * 2); fillStroke(ctx, '#ffcf3b', 1);
      ctx.fillStyle = '#d9a43b'; ctx.fillRect(-8, -34 + bob, 6, 6); ctx.fillRect(3, -30 + bob, 5, 8);
      break;
    }
    case 'ratto': {
      ctx.beginPath(); ctx.ellipse(0, -16 + bob * 0.5, 22, 14, 0, 0, Math.PI * 2); fillStroke(ctx, flash ? '#fff' : '#7d6a5c');
      ctx.beginPath(); ctx.ellipse(-20, -22, 10, 9, -0.3, 0, Math.PI * 2); fillStroke(ctx, flash ? '#fff' : '#8e7a6b');
      ctx.beginPath(); ctx.arc(-18, -32, 5, 0, Math.PI * 2); fillStroke(ctx, '#e6a3a3', 1.5);
      ctx.fillStyle = '#ff3333'; ctx.beginPath(); ctx.arc(-24, -24, 2.2, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#c47f7f'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(20, -14); ctx.quadraticCurveTo(36, -10, 34, -28); ctx.stroke();
      ctx.fillStyle = '#7dff5a'; ctx.beginPath(); ctx.arc(6, -24, 4, 0, Math.PI * 2); ctx.arc(-4, -12, 3, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'drone': {
      const fy = -40 + Math.sin(t * 3) * 5;
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(0, -2, 14, 3, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = OUTLINE; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-22, fy - 6); ctx.lineTo(22, fy - 6); ctx.stroke();
      ctx.fillStyle = 'rgba(200,220,255,0.6)';
      for (const px of [-22, 22]) { ctx.beginPath(); ctx.ellipse(px, fy - 8, 9, 2 + Math.abs(Math.sin(t * 30)) * 2, 0, 0, Math.PI * 2); ctx.fill(); }
      ctx.beginPath(); ctx.ellipse(0, fy, 16, 10, 0, 0, Math.PI * 2); fillStroke(ctx, flash ? '#fff' : '#3e4658');
      ctx.beginPath(); ctx.arc(-4, fy + 1, 5, 0, Math.PI * 2); fillStroke(ctx, '#ff4d6d', 1.5);
      break;
    }
    case 'boss': {
      // mutante gigante con corna e corona di rottami
      rr(ctx, -20, -18, 14, 18, 4); fillStroke(ctx, '#3f2a5c');
      rr(ctx, 6, -18, 14, 18, 4); fillStroke(ctx, '#3f2a5c');
      ctx.beginPath(); ctx.ellipse(0, -48 + bob, 30, 34, 0, 0, Math.PI * 2); fillStroke(ctx, flash ? '#fff' : '#7a3fb8', 2.5);
      ctx.beginPath(); ctx.ellipse(0, -40 + bob, 18, 18, 0, 0, Math.PI * 2); ctx.fillStyle = '#9c63d6'; ctx.fill();
      poly(ctx, [[-22, -72 + bob], [-34, -98 + bob], [-12, -78 + bob]]); fillStroke(ctx, '#e8dcc8');
      poly(ctx, [[22, -72 + bob], [34, -98 + bob], [12, -78 + bob]]); fillStroke(ctx, '#e8dcc8');
      poly(ctx, [[-12, -80 + bob], [-10, -92 + bob], [-4, -84 + bob], [0, -94 + bob], [4, -84 + bob], [10, -92 + bob], [12, -80 + bob]]); fillStroke(ctx, '#ffcc33');
      ctx.fillStyle = '#ffee55';
      ctx.beginPath(); ctx.arc(-10, -60 + bob, 5, 0, Math.PI * 2); ctx.arc(10, -60 + bob, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = OUTLINE; ctx.fillRect(-11, -62 + bob, 3, 4); ctx.fillRect(9, -62 + bob, 3, 4);
      ctx.fillStyle = '#fff';
      poly(ctx, [[-12, -46 + bob], [12, -46 + bob], [8, -38 + bob], [4, -44 + bob], [0, -38 + bob], [-4, -44 + bob], [-8, -38 + bob]]); ctx.fill();
      break;
    }
    default: {
      // mutante verde con un occhio solo
      rr(ctx, -11, -14, 8, 14, 3); fillStroke(ctx, '#3f7a34');
      rr(ctx, 3, -14, 8, 14, 3); fillStroke(ctx, '#3f7a34');
      ctx.beginPath(); ctx.ellipse(0, -34 + bob, 17, 22, 0, 0, Math.PI * 2); fillStroke(ctx, flash ? '#fff' : '#6fcf4f');
      ctx.strokeStyle = OUTLINE; ctx.lineWidth = 6; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-14, -36 + bob); ctx.lineTo(-26, -26 + bob); ctx.stroke();
      ctx.strokeStyle = '#6fcf4f'; ctx.lineWidth = 3.5;
      ctx.beginPath(); ctx.moveTo(-14, -36 + bob); ctx.lineTo(-26, -26 + bob); ctx.stroke();
      ctx.beginPath(); ctx.arc(-3, -40 + bob, 7, 0, Math.PI * 2); fillStroke(ctx, '#fff', 1.5);
      ctx.fillStyle = '#d3242c'; ctx.beginPath(); ctx.arc(-5, -40 + bob, 3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = OUTLINE; ctx.fillRect(-8, -27 + bob, 10, 3);
      ctx.fillStyle = '#9dff7a'; ctx.beginPath(); ctx.arc(8, -24 + bob, 3, 0, Math.PI * 2); ctx.fill();
    }
  }
  ctx.restore();
}

// ---------- PORTALE ----------
export function drawPortal(ctx, x, y, r, t, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  const g = ctx.createRadialGradient(0, 0, r * 0.1, 0, 0, r);
  g.addColorStop(0, '#eaffd0');
  g.addColorStop(0.35, '#7dff4d');
  g.addColorStop(0.8, '#1fbf3a');
  g.addColorStop(1, 'rgba(20,120,30,0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.ellipse(0, 0, r * 0.75, r, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(220,255,200,0.8)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    const a = t * 3 + (i * Math.PI * 2) / 3;
    ctx.ellipse(0, 0, r * (0.25 + i * 0.15), r * (0.35 + i * 0.2), 0, a, a + 2.4);
    ctx.stroke();
  }
  ctx.restore();
}

// ---------- SFONDO post-apocalittico ----------
const ZONE_SKIES = [
  ['#2b1640', '#a8432c', '#f2a65a'],
  ['#14213d', '#3c6e71', '#c8d96f'],
  ['#3a0d1f', '#9e2a2b', '#e09f3e'],
  ['#0b1d2b', '#40395b', '#b779c9'],
];

export function makeBackground(w, h, zone) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  const sky = ZONE_SKIES[(zone - 1) % ZONE_SKIES.length];
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, sky[0]);
  g.addColorStop(0.6, sky[1]);
  g.addColorStop(1, sky[2]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  // sole malato
  ctx.fillStyle = 'rgba(255,230,160,0.55)';
  ctx.beginPath(); ctx.arc(w * 0.78, h * 0.28, 22, 0, Math.PI * 2); ctx.fill();

  // palazzi in rovina su due piani di profondità
  let seed = zone * 97;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (const [layer, color, base] of [[0, 'rgba(30,18,40,0.55)', h * 0.72], [1, 'rgba(20,12,26,0.9)', h * 0.78]]) {
    let x = -10;
    while (x < w + 10) {
      const bw = 24 + rnd() * 36;
      const bh = (layer ? 50 : 70) + rnd() * (layer ? 60 : 70);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(x, base);
      ctx.lineTo(x, base - bh);
      // tetto spezzato
      const cuts = 2 + Math.floor(rnd() * 3);
      for (let i = 1; i <= cuts; i++) ctx.lineTo(x + (bw * i) / cuts, base - bh + rnd() * 18);
      ctx.lineTo(x + bw, base);
      ctx.closePath();
      ctx.fill();
      if (layer === 1) {
        for (let wy = base - bh + 14; wy < base - 8; wy += 11) {
          for (let wx = x + 5; wx < x + bw - 6; wx += 9) {
            if (rnd() < 0.3) {
              ctx.fillStyle = rnd() < 0.3 ? 'rgba(255,200,90,0.6)' : 'rgba(0,0,0,0.5)';
              ctx.fillRect(wx, wy, 4, 5);
            }
          }
        }
      }
      x += bw + rnd() * 8;
    }
  }
  // terreno
  const gy = h * 0.78;
  const gg = ctx.createLinearGradient(0, gy, 0, h);
  gg.addColorStop(0, '#4a3a33');
  gg.addColorStop(1, '#241b18');
  ctx.fillStyle = gg;
  ctx.fillRect(0, gy, w, h - gy);
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 9; i++) {
    const cx = rnd() * w;
    const cy = gy + 6 + rnd() * (h - gy - 10);
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + 10 + rnd() * 16, cy + rnd() * 4 - 2); ctx.lineTo(cx + 20 + rnd() * 10, cy + rnd() * 6); ctx.stroke();
  }
  // rottami: copertoni e barili
  for (let i = 0; i < 4; i++) {
    const bx = rnd() * w;
    ctx.fillStyle = i % 2 ? '#7a2e1d' : '#2c2c30';
    if (i % 2) ctx.fillRect(bx, gy - 10, 9, 12);
    else { ctx.beginPath(); ctx.ellipse(bx, gy, 9, 4, 0, 0, Math.PI * 2); ctx.fill(); }
  }
  return c;
}
