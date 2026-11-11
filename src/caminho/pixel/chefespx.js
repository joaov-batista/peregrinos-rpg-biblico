// Chefes redesenhados em pixel art. Cada um é pintado pose a pose no mesmo rasterizador do peregrino
// (rampas de cor, luz de cima e da frente, contorno de tinta). Mamom é o primeiro: o rei-cofre de Corinto.
// Um chefe sem desenho aqui continua com a arte antiga até ser redesenhado (ver docs/ARTE-PIXEL.md).
import { Sprite, rampa, cor, TINTA, BRANCO } from './raster.js';
import { CHEFES_A } from './chefes-a.js';
import { CHEFES_B } from './chefes-b.js';

const PINTORES = { ...CHEFES_A, ...CHEFES_B };

const OURO = rampa('#D9A63C'), OUROE = rampa('#8A6A2C'), OSSO = rampa('#E4DFCF'), MANTO = rampa('#3B2A4E'), ACO = rampa('#7F8C9C'), FERRO = rampa('#3A3F4C');
const COROA = ['L.....L.....L', 'G.....G.....G', 'GG...GGG...GG', 'GGG.GGGGG.GGG', 'GgGGGGrGGGGgG', 'GGrGGGGGGGrGG', 'LLLLLLLLLLLLL', 'ggggggggggggg'];
const MASCARA = ['...OOOOOOO...', '..OOOOOOOLL..', '.OOOOOOOOOLL.', '.OOOOOOOOOOL.', 'oOEEEOOOEEEOO', 'oOEEEOOOEEEOO', 'oOOEEOOOEEOOO', 'oOOOOOoOOOOOO', '.oOOOOoOOOOO.', '.oOOoOoOoOOO.', '..oOoOoOoOO..', '...ooOOOoo...', '....ooooo....'];
const FECHADURA = ['.EEE.', 'EEEEE', 'EEEEE', '.EEE.', '..E..', '.EEE.', '.EEE.'];
const GARRA = ['O.O.O', 'OOOOO', 'oOOOo', '.ooo.'];

const quadro = new Sprite(120, 112);
export const CHEFES_PX = {
  mamom: { ax: 60, ay: 104, pinta(s, b, Tm, G) {
    const ox = 60, oy = 104, t = Math.floor(Tm * 6), resp = [0, 0, 1, 1][t % 4], tipo = b.mov?.def.tipo, prep = b.tele > 0, caido = b.quebrado > 0 || b.tonto > 0;
    const noAr = !b.chao && !caido, corre = tipo === 'investida' && b.art.step === 2, anda = Math.abs(b.vx) > 8 && !corre ? Math.floor(Tm * 5) % 2 : 0;
    let incl = corre ? 6 : prep ? -3 : caido ? 2 : 0, baixo = caido ? 6 : noAr ? -2 : resp, ry = 20 + (noAr ? 2 : 0) - (caido ? 3 : 0) + (b.pousou > 0 ? -3 : 0), rx = 23 + (b.pousou > 0 ? 3 : 0) - (noAr ? 1 : 0);
    const cy = oy - 34 + baixo + (b.pousou > 0 ? 3 : 0), cx = ox + incl;
    // manto atrás, com a barra rasgada
    const bal = corre ? -10 : Math.round(Math.sin(Tm * 2) * 2);
    s.poli([[cx - 20, cy - 22], [cx + 18, cy - 22], [ox + 30 + bal, oy - 2], [ox - 34 + bal, oy - 2]], MANTO[1]);
    for (let x = -34; x <= 30; x++) { const xx = ox + x + bal; if ((x + 40) % 6 < 3) s.ret(xx, oy - 2, 1, 2 + ((x + 40) % 5 === 0 ? 2 : 0), MANTO[1]); if (x % 9 === 0) s.linha(cx + x * 0.5, cy - 20, xx, oy - 3, 1, MANTO[0]); }
    s.linha(cx - 20, cy - 22, ox - 34 + bal, oy - 2, 1, MANTO[2]);
    // pés
    for (const [dx, lev] of [[-11, anda ? -2 : 0], [9, anda ? 0 : (corre ? -2 : 0)]]) { s.ret(ox + dx - 5 + (corre ? 3 : 0), oy - 6 + lev, 11, 6, FERRO[2]); s.ret(ox + dx - 5 + (corre ? 3 : 0), oy - 6 + lev, 11, 1, FERRO[3]); s.ret(ox + dx + 3 + (corre ? 3 : 0), oy - 3 + lev, 4, 3, FERRO[1]); }
    // o corpo é um cofre: cintas de ferro, rebites e a fechadura
    s.bola(cx, cy, rx, ry, OURO, 0.55, -0.65);
    for (let j = -2; j <= 2; j++) { const y = cy + j * 7; const lg = Math.round(rx * Math.sqrt(Math.max(0, 1 - Math.pow((y - cy) / ry, 2)))); for (let x = -lg + 1; x < lg; x++) s.px(cx + x, y, x > lg * 0.5 ? OUROE[3] : x < -lg * 0.6 ? OUROE[0] : OUROE[1]); for (let x = -lg + 4; x < lg - 2; x += 7) s.px(cx + x, y - 1, OURO[4]); }
    for (let y = -ry + 3; y < ry - 2; y++) { s.px(cx - 9, cy + y, OUROE[1]); s.px(cx + 9, cy + y, OUROE[2]); }
    const brilho = prep ? cor(Math.floor(Tm * 14) % 2 ? '#FFF3C4' : '#FFB84A') : TINTA;
    s.carimbo(FECHADURA, cx - 2, cy - 4, { E: brilho }); s.ret(cx - 4, cy - 6, 9, 1, OURO[4]); s.ret(cx - 5, cy - 5, 1, 9, OURO[3]); s.ret(cx + 5, cy - 5, 1, 9, OURO[1]);
    // ombreiras
    for (const sd of [-1, 1]) s.bola(cx + sd * (rx - 4), cy - ry + 6, 7, 5.5, ACO, 0.5, -0.7);
    // braços: erguidos no aviso, estendidos na investida, caídos quando quebrantado
    for (const sd of [-1, 1]) {
      const ombro = { x: cx + sd * (rx - 3), y: cy - ry + 8 };
      const mao = prep ? { x: ombro.x + sd * 9, y: ombro.y - 16 - (Math.floor(Tm * 12) % 2) } : corre ? { x: cx + 26 + (sd > 0 ? 4 : -4), y: cy - 2 + sd * 6 } : caido ? { x: ombro.x + sd * 5, y: oy - 8 } : { x: ombro.x + sd * 8, y: cy + 8 + resp };
      const cot = { x: (ombro.x + mao.x) / 2 + sd * 4, y: (ombro.y + mao.y) / 2 + 2 };
      s.membro(ombro.x, ombro.y, cot.x, cot.y, 4, MANTO); s.membro(cot.x, cot.y, mao.x, mao.y, 3, OUROE);
      s.carimbo(GARRA, Math.round(mao.x) - 2, Math.round(mao.y) - 1, { O: OSSO[3], o: OSSO[1] });
      // corrente com moeda no pulso
      const pend = Math.round(Math.sin(Tm * 3 + sd) * 2) - (corre ? 5 : 0);
      for (let k = 1; k <= 7; k++) s.px(mao.x + pend * k / 7, mao.y + 3 + k, k % 2 ? OUROE[2] : OUROE[0]);
      s.bola(mao.x + pend, mao.y + 12, 2.4, 2.4, OURO);
    }
    // máscara de porcelana e a coroa que flutua
    const mx = cx - 6 + (corre ? 4 : 0), my = cy - ry - 13 + (caido ? 6 : 0) + (prep ? -1 : 0);
    s.ret(mx + 3, my + 11, 7, 5, MANTO[0]);
    s.carimbo(MASCARA, mx, my, { O: OSSO[3], o: OSSO[1], L: OSSO[4], E: TINTA });
    if (b.hp < b.max * 0.6) { for (const [dx, dy] of [[7, 0], [6, 1], [7, 2], [6, 3], [7, 4], [8, 5]]) s.px(mx + dx, my + dy, TINTA); } // rachadura a partir da segunda fase
    if (!caido) { const o = cor(prep ? '#FFFFFF' : '#FFD23F'); s.px(mx + 3, my + 5, o); s.px(mx + 9, my + 5, o); }
    const cb = caido ? 4 : Math.round(Math.sin(Tm * 2.4) * 1.5) - 3;
    s.carimbo(COROA, mx + (caido ? 4 : 0), my - 9 + cb, { G: OURO[3], g: OURO[1], L: OURO[4], r: cor('#D0465A') }, 1, caido ? 0.5 : 0);
    // moedas que orbitam (somem quando ele cai)
    if (!caido) for (let i = 0; i < 4; i++) { const a = Tm * 1.3 + i * 1.57, z = Math.sin(a); if (z > -0.2) s.bola(cx + Math.cos(a) * 36, cy - 6 + z * 7, 2.2, 2.6 - Math.abs(Math.cos(a * 2)) * 1.2, OURO); }
  } }
};

// Quadro pronto de um chefe (ou null se ainda não foi redesenhado)
export function quadroChefe(b, Tm, G) {
  const def = CHEFES_PX[b.id] || (PINTORES[b.id] && { ax: 60, ay: 104, pinta: PINTORES[b.id] }); if (!def) return null;
  const s = quadro.limpa(); def.pinta(s, b, Tm, G);
  if (b.flash > 0) s.tinge(BRANCO);
  if (b.morrendo > 0) s.dissolve(1 - b.morrendo / 1.7, 3);
  if ((b.alpha ?? 1) < 1) s.dissolve(1 - b.alpha, 2);
  s.contorno(TINTA);
  return { s, ax: def.ax, ay: def.ay };
}
