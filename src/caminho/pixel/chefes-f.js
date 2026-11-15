// A Raiz de Amargura (Hb 12:15): um coração de raiz preta, com asas de espinheiro, galhos secos por chifres
// e uma máscara pálida que chora fel. Voa, mergulha em diagonal, crava-se no chão.
import { R, C, OX as ox, OY as oy, est, asa, cauda, TINTA } from './kit.js';

const CASCA = R('#2A2620'), CASCAE = R('#14120E'), ESP = R('#3A5A2A'), ASA = R('#2E3A22'), PORC = R('#E4E0C8'), FEL = C('#B8E060'), FELE = C('#6A8A30'), BR = C('#FFFFFF'), BREU = C('#070906');
const MASCARA = ['..OOOOO..', '.OOOOOOO.', 'OOOOOOOOO', 'OEEOOOEEO', 'OEEOOOEEO', 'OOfOOOfOO', '.OfOOOfO.', '.OOfOfOO.', '..OOmOO..', '...OOO...', '....O....'];

export const CHEFES_F = {
  amargura(s, b, Tm) {
    const E = est(b, Tm), t = E.tipo || '', cravada = t === 'raizesAmargas' && E.ataca, rasgo = t === 'rasgoDeEspinho' && (E.ataca || b.corre), chuva = (t === 'chuvaDeFel' || t === 'marDeFel') && !E.prep, leque = t === 'lequeDeEspinhos', abraco = t === 'abracoDaRaiz';
    const cai = E.caido ? 12 : 0, cx = ox + (rasgo ? -6 : 0), cy = oy - 46 + cai + (cravada ? 10 : E.flu), f = b.hp < b.max * 0.62 ? 1 : 0, f3 = b.hp < b.max * 0.3;
    // as asas: galhos de espinheiro com membrana rasgada. Fechadas no rasgo, abertas na chuva
    const abre = E.caido ? 0.05 : rasgo ? 0.1 : chuva || abraco ? 1 : E.prep ? 0.85 : 0.5 + Math.sin(Tm * 5) * 0.22;
    for (const sd of [-1, 1]) { asa(s, cx + sd * 9, cy - 10, sd, 44, abre, ASA, 5); for (let k = 0; k < 5; k++) { const a = (0.2 + k * 0.25) * (0.6 + abre * 0.5), x = cx + sd * (16 + Math.cos(a) * 30), y = cy - 22 - abre * 10 + Math.sin(a) * 34; s.linha(x, y, x + sd * 3, y - 4, 1, ESP[4]); } }
    // as raízes que pendem (ou se cravam no chão)
    for (let k = -2; k <= 2; k++) { if (cravada) { s.membro(cx + k * 5, cy + 14, cx + k * 11, oy - 2, 3, CASCA); s.linha(cx + k * 11, oy - 2, cx + k * 15, oy - 1, 1, CASCAE[2]); } else cauda(s, cx + k * 5, cy + 14, 9 + Math.abs(k) * 2, k < 0 ? -0.4 : 0.4, Tm + k, 3, CASCA, 3, 2.5, rasgo ? 0.4 : 1.6); }
    // o coração: um nó de raiz que pulsa, com veias de fel
    const pulso = Math.floor(Tm * 3) % 2 && !E.caido ? 1 : 0;
    s.bola(cx, cy, 17 + pulso, 20 + pulso, CASCA, 0.45, -0.7);
    for (const [x0, y0, x1, y1] of [[-12, -8, -4, 4], [-4, 4, -8, 14], [10, -10, 4, 2], [4, 2, 9, 13], [-2, -14, 1, -2], [1, -2, -1, 9]]) s.linha(cx + x0, cy + y0, cx + x1, cy + y1, 1, (E.t6 + x0) % 4 === 0 || E.prep ? FEL : FELE);
    for (let k = 0; k < 6; k++) { const a = k * 1.05 + 0.4; s.linha(cx + Math.cos(a) * 15, cy + Math.sin(a) * 18, cx + Math.cos(a) * 21, cy + Math.sin(a) * 24, 1, ESP[3]); } // espinhos no corpo
    if (f) { s.poli([[cx - 3, cy + 2], [cx + 4, cy - 1], [cx + 6, cy + 9], [cx - 1, cy + 12]], BREU); s.px(cx + 1, cy + 5, FEL); s.px(cx + 2, cy + 8, FEL); } // a fenda abre na segunda fase
    // os braços: dois açoites de espinho
    for (const sd of [-1, 1]) { const o = { x: cx + sd * 14, y: cy - 6 }, m = E.caido ? { x: o.x + sd * 8, y: oy - 4 } : cravada ? { x: o.x + sd * 12, y: oy - 3 } : rasgo ? { x: cx - 30, y: cy + 16 + sd * 4 } : leque && sd < 0 ? { x: cx - 36, y: cy - 4 } : chuva || abraco || E.prep ? { x: o.x + sd * 20, y: cy - 34 - (E.pisca ? 1 : 0) } : { x: o.x + sd * 12, y: cy + 20 + Math.round(Math.sin(Tm * 3 + sd) * 3) };
      const c = { x: (o.x + m.x) / 2 + sd * 7, y: (o.y + m.y) / 2 }; s.membro(o.x, o.y, c.x, c.y, 4, CASCA); s.membro(c.x, c.y, m.x, m.y, 3, CASCA); for (let k = 1; k < 4; k++) { const x = c.x + (m.x - c.x) * k / 4, y = c.y + (m.y - c.y) * k / 4; s.linha(x, y, x + sd * 3, y - 3, 1, ESP[4]); } for (let d = -1; d <= 1; d++) s.linha(m.x, m.y, m.x + d * 3 + (rasgo || leque ? -4 : 0), m.y + (chuva || E.prep ? -5 : 5), 1, ESP[4]); }
    // a cabeça: galhos secos por chifres e a máscara que chora fel
    const hx = cx - 4 + (rasgo ? -4 : 0), hy = cy - 34 + (E.caido ? 8 : 0) + (chuva ? -2 : 0);
    s.ret(hx + 2, hy + 9, 6, 6, CASCAE[2]);
    for (const sd of [-1, 1]) { const bx = hx + 4 + sd * 4; s.linha(bx, hy, bx + sd * 7, hy - 12, 2, CASCA[2]); s.linha(bx + sd * 7, hy - 12, bx + sd * 12, hy - 20, 1, CASCA[3]); s.linha(bx + sd * 5, hy - 8, bx + sd * 11, hy - 9, 1, CASCA[3]); s.linha(bx + sd * 7, hy - 12, bx + sd * 4, hy - 19, 1, CASCA[3]); if (f3) s.px(bx + sd * 12, hy - 21, FEL); }
    s.carimbo(MASCARA, hx, hy, { O: PORC[3], E: E.caido ? PORC[1] : BREU, f: FEL, m: TINTA });
    if (!E.caido) { const o = E.prep && E.pisca ? BR : FEL; s.px(hx + 2, hy + 4, o); s.px(hx + 6, hy + 4, o); }
    if (f) { s.linha(hx + 4, hy, hx + 3, hy + 4, 1, TINTA); s.px(hx + 4, hy + 5, TINTA); }
    // o fel que pinga
    for (let k = 0; k < (chuva ? 7 : 3); k++) { const q = (Tm * 1.3 + k / 3) % 1; s.px(hx + 2 + (k % 2) * 4 + (chuva ? (k - 3) * 9 : 0), hy + 8 + q * (chuva ? 50 : 26), FEL); }
    if (rasgo) for (let k = 0; k < 5; k++) s.ret(cx + 18 + k * 6, cy - 20 + k * 6, 8 - k, 1, FEL); // o rastro do rasgo
  }
};
