// Chefes de Corinto (Atos 18) e de Jonas em pixel art. Cada pintor recebe o sprite, o chefe e o tempo.
import { R, C, OX as ox, OY as oy, est, manto, braco, olhos, asa, cauda, fiapos, TINTA } from './kit.js';

const OSSO = R('#E4DFCF'), PELE = R('#C9B8A0'), OURO = R('#D9A63C'), FERRO = R('#3A3F4C'), ACO = R('#7F8C9C'), BRONZE = R('#B0763A');
const MUSGO = R('#5E7A56'), LILAS = R('#7A5BA8'), ROXO = R('#3B2A4E'), VINHO = R('#8E2B45'), CARMIM = R('#C24058'), NOITE = R('#232338');
const NUVEM = R('#5C6784'), MAR = R('#1F5A6B'), ALGA = R('#2F6B4F'), AREIA = R('#C9A86A'), SANGUE = R('#A3322B'), VERME = R('#B9A07A'), FOLHA = R('#8A7A3A');
const BR = C('#FFFFFF'), AMBAR = C('#FFD23F'), FOGO = C('#FF7A3C'), RUBI = C('#FF4A5A'), CIANO = C('#8FE8FF');

const MASC2 = ['..OOOOO..', '.OOOOOOO.', 'OOOOoOOOO', 'OEEOoOEEO', 'OOOOoOOOO', 'OOOOoOOOO', '.OmmomMO.', '..OOoOO..', '...OoO...'];
const ELMO = ['....A....', '...AAA...', '..AAAAA..', '.AAAAAAA.', '.AaaaaaA.', 'AAAAAAAAA', 'AaEEaEEaA'];

export const CHEFES_A = {
  // A Procrastinação: um vulto enorme adormecido sobre almofadas, com a ampulheta do "depois" nas costas.
  procrastinacao(s, b, Tm) {
    const E = est(b, Tm), sob = Math.round(E.onda(1.2) * 1.5), desp = E.prep || E.ataca;
    s.bola(ox - 16, oy - 5, 17, 6, ROXO); s.bola(ox + 13, oy - 4, 19, 5, LILAS); s.bola(ox - 2, oy - 8, 14, 5, VINHO);
    // ampulheta
    const ax = ox - 22, ay = oy - 62 + sob;
    s.ret(ax - 7, ay, 15, 2, BRONZE[2]); s.ret(ax - 7, ay + 24, 15, 2, BRONZE[1]); s.ret(ax - 7, ay, 1, 26, BRONZE[1]); s.ret(ax + 7, ay, 1, 26, BRONZE[3]);
    s.poli([[ax - 5, ay + 2], [ax + 5, ay + 2], [ax, ay + 13]], C('#9FC8D6')); s.poli([[ax, ay + 13], [ax + 5, ay + 23], [ax - 5, ay + 23]], C('#7FA9BC'));
    const areia = Math.round((b.hp / b.max) * 7); s.poli([[ax - 4, ay + 9 - areia], [ax + 4, ay + 9 - areia], [ax, ay + 12]], AREIA[3]); s.poli([[ax - 4, ay + 23], [ax + 4, ay + 23], [ax, ay + 15 + areia]], AREIA[2]);
    if (E.t6 % 2) s.px(ax, ay + 14 + E.t6 % 4, AREIA[4]);
    // o corpo: um cobertor remendado que sobe e desce
    s.bola(ox, oy - 26 - sob / 2, 25, 19 + sob, MUSGO, 0.45, -0.7);
    for (let i = -3; i <= 3; i++) { s.px(ox + i * 6, oy - 26 + (i % 2) * 5, MUSGO[0]); s.px(ox + i * 6 + 1, oy - 25 + (i % 2) * 5, MUSGO[4]); }
    s.ret(ox - 12, oy - 22, 8, 7, LILAS[1]); s.ret(ox - 12, oy - 22, 8, 1, LILAS[3]); s.ret(ox + 6, oy - 36, 6, 6, VINHO[2]);
    // cabeça caída, touca e o olho que só abre para adiar você
    const hx = ox + 14 - (desp ? 3 : 0), hy = oy - 45 - sob + (E.caido ? 9 : desp ? -6 : 2);
    s.bola(hx, hy, 9, 8, PELE);
    s.poli([[hx - 9, hy - 3], [hx + 8, hy - 5], [hx - 14, hy - 18 + (desp ? 4 : 0)]], LILAS[2]); s.linha(hx - 9, hy - 3, hx + 8, hy - 5, 2, OSSO[3]); s.bola(hx - 15, hy - 18 + (desp ? 4 : 0) + E.resp, 2.5, 2.5, OSSO);
    if (desp) { s.bola(hx + 3, hy, 3, 3, OSSO); s.ret(hx + 3, hy - 1, 2, 3, E.pisca ? AMBAR : TINTA); } else { s.ret(hx + 1, hy + 1, 5, 1, TINTA); s.px(hx + 6, hy, TINTA); }
    s.ret(hx + 2, hy + 5, 4, 1, PELE[0]);
    if (!desp && !E.caido) for (let i = 0; i < 3; i++) { const k = (Tm * 0.6 + i / 3) % 1; s.ret(hx + 10 + k * 10, hy - 8 - k * 14, 2 + i, 1, CIANO); }
    // braço comprido que se arrasta (e se estende no golpe)
    const m = braco(s, ox + 18, oy - 34 - sob, E.ataca ? ox + 44 : ox + 30, E.ataca ? oy - 30 : oy - 8, 5, MUSGO, PELE, E.ataca ? -3 : 5);
    for (let d = -2; d <= 2; d += 2) s.linha(m.x, m.y, m.x + 5, m.y + d + 1, 1, PELE[3]);
  },

  // A Mentira: duas faces numa só máscara, mangas vazias e a língua bifurcada.
  mentira(s, b, Tm) {
    const E = est(b, Tm), y0 = oy - 8 + E.flu, cx = ox + (E.ataca ? 3 : 0);
    manto(s, cx, y0 - 50, 9, cx - 4 - E.flu, y0, 17, LILAS, 5);
    for (let i = 0; i < 5; i++) s.px(cx - 6 + i * 3, y0 - 40 + i * 7, OURO[3]);
    for (const sd of [-1, 1]) {
      const abre = E.prep ? -20 : E.ataca ? -6 : 4, m = braco(s, cx + sd * 8, y0 - 46, cx + sd * (20 + (E.ataca ? 8 : 0)), y0 - 30 + abre, 5, LILAS, ROXO, 3, sd);
      s.poli([[m.x - 4, m.y], [m.x + 4, m.y], [m.x + sd * 2, m.y + 11 + E.flu]], ROXO[1]); if (E.prep) s.bola(m.x, m.y - 4, 3, 3, R(E.pisca ? '#FFFFFF' : '#C79BFF'));
    }
    const mx = cx - 4, my = y0 - 62 + (E.caido ? 6 : 0);
    s.bola(cx, my + 4, 7, 7, ROXO);
    s.carimbo(MASC2, mx, my, { O: OSSO[3], o: TINTA, E: E.caido ? OSSO[1] : RUBI, m: OSSO[1], M: TINTA });
    s.ret(mx, my + 6, 4, 1, OSSO[4]); // metade que sorri
    if (!E.caido) { const l = E.ataca ? 7 : 3; s.linha(mx + 5, my + 8, mx + 5 + l, my + 9, 1, CARMIM[3]); s.px(mx + 6 + l, my + 8, CARMIM[3]); s.px(mx + 6 + l, my + 10, CARMIM[3]); }
    if (E.f2) { s.px(mx + 6, my + 1, TINTA); s.px(mx + 7, my + 2, TINTA); s.px(mx + 6, my + 3, TINTA); }
  },

  // A Imoralidade: a figura velada com o cálice dourado; sob a barra do vestido, uma cauda de serpente.
  imoralidade(s, b, Tm) {
    const E = est(b, Tm), cx = ox + (E.anda ? 2 : 0), bal = Math.round(E.onda(2) * 2), topo = oy - 60 + E.resp + (E.caido ? 8 : 0);
    cauda(s, ox - 8, oy - 4, 14, -1, Tm, 6, MUSGO, 3, 3);
    manto(s, cx, topo + 10, 8, cx - 3 + bal, oy - 1, 19, VINHO, 0);
    for (let x = -18; x <= 16; x += 2) s.px(cx - 3 + bal + x, oy - 2, OURO[x % 4 ? 2 : 4]);
    s.linha(cx - 7, topo + 22, cx + 7, topo + 22, 2, OURO[2]); s.px(cx, topo + 22, RUBI);
    // véu que cai da cabeça até o chão
    s.poli([[cx - 7, topo - 2], [cx + 3, topo - 4], [cx - 12 - bal, oy - 10], [cx - 22 - bal, oy - 6]], CARMIM[1]);
    for (let y = topo; y < oy - 8; y += 4) s.px(cx - 9 - (y - topo) * 0.22 - bal * ((y - topo) / 60), y, CARMIM[3]);
    s.bola(cx, topo + 3, 6, 7, PELE); s.poli([[cx - 7, topo - 3], [cx + 7, topo - 3], [cx + 6, topo + 2], [cx - 7, topo + 4]], CARMIM[2]); s.ret(cx - 6, topo - 4, 12, 1, OURO[3]);
    if (!E.caido) olhos(s, cx + 1, topo + 4, 3, E.prep ? BR : C('#FF8FB8'));
    // o cálice erguido chama; o outro braço estende a mão
    const cal = braco(s, cx + 7, topo + 13, cx + 15, E.prep ? topo - 4 : topo + 10 + E.resp, 3, VINHO, PELE, 2);
    s.ret(cal.x - 3, cal.y - 7, 7, 4, OURO[3]); s.ret(cal.x - 3, cal.y - 7, 7, 1, OURO[4]); s.ret(cal.x, cal.y - 3, 1, 3, OURO[2]); s.ret(cal.x - 2, cal.y, 5, 1, OURO[1]);
    if (E.prep || b.encanta) for (let i = 0; i < 4; i++) { const k = (Tm * 0.9 + i / 4) % 1; s.px(cal.x + Math.sin(k * 9 + i) * 4, cal.y - 9 - k * 12, C(i % 2 ? '#FF8FB8' : '#FFD9E6')); }
    braco(s, cx - 6, topo + 13, cx + (E.ataca ? 22 : -10), topo + (E.ataca ? 16 : 26), 3, VINHO, PELE, -2);
  },

  // O Acusador: metade anjo de luz, metade sombra; asas rasgadas e o rolo das acusações.
  satanas(s, b, Tm) {
    const E = est(b, Tm), y0 = oy - 6 + E.flu, cx = ox, abre = E.caido ? 0 : E.prep ? 1 : 0.55 + E.bat * 0.12;
    asa(s, cx - 6, y0 - 44, -1, 34, abre, NOITE, 5); asa(s, cx + 6, y0 - 44, 1, 30, abre, R('#D8D2C0'), 5, true);
    manto(s, cx, y0 - 48, 9, cx - 2, y0, 15, NOITE, 6);
    for (let y = y0 - 46; y < y0; y++) { const k = (y - (y0 - 48)) / 48, l = 9 + 6 * k; for (let x = 1; x < l - 1; x++) if ((x + y) % 2 === 0 || x > 3) s.px(cx - 2 * k + x, y, x > l - 4 ? OSSO[4] : OSSO[2]); } // lado de luz
    s.ret(cx - 1, y0 - 47, 1, 46, TINTA);
    const hy = y0 - 58 + (E.caido ? 7 : 0);
    s.bola(cx, hy, 6, 7, NOITE); for (let y = -6; y <= 6; y++) for (let x = 1; x <= 5; x++) if (x * x / 36 + y * y / 49 <= 1) s.px(cx + x, hy + y, OSSO[x > 3 ? 4 : 3]);
    s.poli([[cx - 5, hy - 5], [cx - 9, hy - 14], [cx - 2, hy - 7]], NOITE[1]); // um chifre só, do lado da sombra
    if (!E.caido) { s.px(cx - 3, hy, RUBI); s.px(cx + 3, hy, E.prep ? BR : AMBAR); s.ret(cx + 1, hy + 4, 3, 1, TINTA); }
    if (!E.caido) for (let a = 0; a < 7; a++) s.px(cx + 4 + Math.cos(a * 0.5 - 1.2) * 9, hy - 3 + Math.sin(a * 0.5 - 1.2) * 9, AMBAR);
    // o rolo: aberto e comprido quando acusa
    const m = braco(s, cx + 8, y0 - 42, cx + 20, y0 - 34 - (E.prep ? 12 : 0), 3, OSSO, OSSO, 2), comp = E.prep || E.ataca ? 22 : 9;
    s.ret(m.x - 2, m.y - 2, 5, comp, OSSO[3]); s.ret(m.x - 3, m.y - 3, 7, 2, BRONZE[2]); s.ret(m.x - 3, m.y + comp - 2, 7, 2, BRONZE[1]); for (let y = 1; y < comp - 3; y += 2) s.ret(m.x - 1, m.y + y, 3, 1, TINTA);
    const g = braco(s, cx - 8, y0 - 42, cx - 18 + (E.ataca ? 30 : 0), y0 - 28 - (E.ataca ? 8 : 0), 3, NOITE, NOITE, -2); for (let d = -1; d <= 1; d++) s.linha(g.x, g.y, g.x + (E.ataca ? 5 : -3), g.y + 3 + d * 2, 1, NOITE[3]);
  },

  // A Fuga: um vulto de capa de vela e cordame, sempre de lado, já com um pé no navio para Társis.
  fuga(s, b, Tm) {
    const E = est(b, Tm), corre = E.anda || E.ataca, incl = E.caido ? -3 : corre ? 7 : 2, topo = oy - 50 + E.resp + (E.caido ? 12 : 0), cx = ox + incl;
    const vela = R('#C9C2AE'), vento = Math.round(E.onda(5) * 2);
    s.poli([[cx - 4, topo + 6], [cx + 4, topo + 4], [ox - 30 - (corre ? 8 : 0), topo + 30 + vento], [ox - 12, oy - 6]], vela[2]);
    for (let i = 1; i < 5; i++) s.linha(cx - 3, topo + 6 + i, ox - 30 - (corre ? 8 : 0) + i * 5, topo + 30 + vento + i * 2, 1, vela[i % 2 ? 1 : 3]);
    s.linha(cx - 4, topo + 6, ox - 30 - (corre ? 8 : 0), topo + 30 + vento, 1, BRONZE[1]);
    for (const [dx, av] of [[-4, corre ? (E.passo ? 8 : -8) : -2], [4, corre ? (E.passo ? -8 : 8) : 3]]) { s.membro(ox + dx + incl * 0.4, oy - 22, ox + dx + av, oy - 2 - (corre && av < 0 ? 4 : 0), 4, NOITE); s.ret(ox + dx + av - 1, oy - 3 - (corre && av < 0 ? 4 : 0), 6, 3, BRONZE[1]); }
    manto(s, cx, topo + 8, 7, ox + incl * 0.5, oy - 20, 9, MAR, 2);
    s.linha(cx - 7, topo + 12, cx + 6, topo + 24, 2, AREIA[1]); s.bola(cx - 9, topo + 24, 5, 5, AREIA); // a trouxa de quem foge
    s.bola(cx + 1, topo + 2, 6, 6, NOITE); s.poli([[cx - 6, topo + 3], [cx + 2, topo - 7], [cx + 8, topo + 1], [cx + 6, topo + 6]], MAR[1]); s.linha(cx + 2, topo - 7, cx + 8, topo + 1, 1, MAR[3]);
    if (!E.caido) s.ret(cx + 3, topo + 2, 2, 1, E.prep ? BR : CIANO);
    const m = braco(s, cx + 5, topo + 12, cx + (E.prep ? 2 : E.ataca ? 22 : 12), topo + (E.prep ? 0 : E.ataca ? 14 : 22), 3, MAR, PELE, 2);
    s.linha(m.x, m.y, m.x + (E.ataca ? 12 : 3), m.y - (E.prep ? 10 : 0) + (E.ataca ? 0 : 6), 1, ACO[4]); // o punhal do marinheiro
    if (corre) for (let i = 0; i < 3; i++) s.ret(ox - 34 - i * 6, oy - 12 - i * 9, 5 + i * 2, 1, C('#BFD6E8'));
  },

  // O Pavor: a própria tempestade com olhos de raio; quanto mais perto do golpe, mais ela incha.
  pavor(s, b, Tm) {
    const E = est(b, Tm), y0 = oy - 34 + E.flu, cresce = E.prep ? 3 : 0;
    for (let i = 0; i < 6; i++) { const k = (Tm * 1.4 + i / 6) % 1; s.ret(ox - 20 + i * 8 + Math.sin(i) * 3, y0 + 14 + k * 26, 1, 4, C('#8FB6D6')); }
    for (const sd of [-1, 1]) { const m = braco(s, ox + sd * 16, y0 + 2, ox + sd * (26 + (E.ataca ? 6 : 0)), y0 + (E.prep ? -16 : 20), 5, NUVEM, NUVEM, 4, sd); for (let d = -1; d <= 1; d++) s.linha(m.x, m.y, m.x + d * 3, m.y + (E.prep ? -6 : 7), 1, NUVEM[4]); }
    for (const [dx, dy, r] of [[-15, 4, 12], [14, 5, 12], [-8, -8, 13], [9, -9, 12], [0, 2, 16], [0, -15, 9]]) s.bola(ox + dx, y0 + dy + (E.caido ? 6 : 0), r + cresce, r - 2 + cresce, NUVEM, 0.4, -0.75);
    for (let x = -22; x <= 22; x += 4) s.bola(ox + x, y0 + 15 + (x % 8 ? 1 : 0) + (E.caido ? 6 : 0), 3, 2.5, R('#3D4660'));
    const ey = y0 - 3 + (E.caido ? 6 : 0);
    if (E.caido) { s.ret(ox - 9, ey, 5, 1, TINTA); s.ret(ox + 5, ey, 5, 1, TINTA); }
    else for (const sd of [-1, 1]) { s.poli([[ox + sd * 4, ey + 2], [ox + sd * 11, ey - 3], [ox + sd * 11, ey + 3]], E.prep && E.pisca ? BR : AMBAR); s.px(ox + sd * 8, ey, TINTA); }
    s.poli([[ox - 6, ey + 8], [ox + 6, ey + 8], [ox + 3, ey + 12 + (E.ataca ? 4 : 0)], [ox - 3, ey + 12 + (E.ataca ? 4 : 0)]], TINTA);
    if (E.prep || (E.t6 % 9 === 0)) { let x = ox + 6, y = y0 + 14; for (let i = 0; i < 5; i++) { const nx = x + (i % 2 ? -5 : 4), ny = y + 5; s.linha(x, y, nx, ny, 1, i % 2 ? BR : AMBAR); x = nx; y = ny; } }
  },

  // O Desespero: "as algas se enrolaram na minha cabeça" (Jn 2:5). Um afogado em casulo de algas, com uma luz que engana.
  desespero(s, b, Tm) {
    const E = est(b, Tm), y0 = oy - 6 + E.flu, cx = ox;
    for (let i = -2; i <= 2; i++) cauda(s, cx + i * 6, y0 - 10, 9, i < 0 ? -1 : 1, Tm + i, 3, ALGA, 3, 2, 0.9);
    s.bola(cx, y0 - 30 + (E.caido ? 5 : 0), 15, 22, MAR, 0.4, -0.7);
    for (let i = 0; i < 6; i++) { const y = y0 - 48 + i * 7 + (E.caido ? 5 : 0); s.linha(cx - 14, y + (i % 2) * 3, cx + 14, y + 4 - (i % 2) * 3, 2, ALGA[i % 2 ? 2 : 1]); s.px(cx + 6 - i, y + 2, ALGA[4]); }
    const hy = y0 - 50 + (E.caido ? 10 : 0);
    s.bola(cx + 2, hy, 9, 8, R('#9DB4AE')); fiapos(s, cx - 7, cx + 9, hy - 5, 7, Tm * 0.4, ALGA, 3);
    s.linha(cx - 7, hy + 2, cx + 10, hy - 2, 2, ALGA[2]);
    if (E.caido) s.ret(cx + 2, hy + 1, 5, 1, TINTA); else { s.bola(cx + 4, hy + 1, 2.5, 2.5, R('#101820')); s.px(cx + 4, hy + 1, E.prep ? BR : CIANO); }
    s.poli([[cx, hy + 5], [cx + 7, hy + 4], [cx + 4, hy + 7 + (E.ataca ? 3 : 0)]], TINTA);
    // a isca luminosa
    const ix = cx + 18 + E.flu, iy = hy - 12 - (E.prep ? 5 : 0); s.linha(cx + 4, hy - 7, cx + 12, hy - 16, 1, ALGA[1]); s.linha(cx + 12, hy - 16, ix, iy, 1, ALGA[1]);
    s.bola(ix, iy, E.prep ? 4 : 3, E.prep ? 4 : 3, R(E.pisca && E.prep ? '#FFFFFF' : '#8FE8FF')); for (let a = 0; a < 6; a++) s.px(ix + Math.cos(a + Tm * 2) * 6, iy + Math.sin(a + Tm * 2) * 6, CIANO);
    for (const sd of [-1, 1]) { const m = braco(s, cx + sd * 12, y0 - 34, cx + sd * (E.ataca ? 30 : 20), y0 - (E.ataca ? 34 : 14), 3, ALGA, R('#9DB4AE'), 3, sd); s.linha(m.x, m.y, m.x + sd * 3, m.y + 4, 1, ALGA[3]); }
    for (let i = 0; i < 3; i++) { const k = (Tm * 0.5 + i / 3) % 1; s.px(cx - 10 + i * 9, hy - 8 - k * 20, CIANO); }
  },

  // A Violência de Nínive: o guerreiro assírio de elmo cônico, barba trançada, escudo e maça.
  violencia(s, b, Tm) {
    const E = est(b, Tm), inv = E.tipo === 'investida' && E.ataca, incl = inv ? 6 : E.prep ? -3 : 0, baixo = E.caido ? 7 : E.resp - E.pouso * -1, cx = ox + incl, topo = oy - 62 + baixo;
    for (const [dx, lev] of [[-9, E.anda && E.passo ? -3 : 0], [9, E.anda && !E.passo ? -3 : 0]]) { s.membro(ox + dx, oy - 24 + baixo, ox + dx + (inv ? 4 : 0), oy - 6 + lev, 7, BRONZE); s.ret(ox + dx - 5 + (inv ? 4 : 0), oy - 6 + lev, 12, 6, FERRO[2]); s.ret(ox + dx - 5 + (inv ? 4 : 0), oy - 6 + lev, 12, 1, FERRO[4]); }
    // saiote de escamas e couraça
    s.poli([[cx - 16, topo + 34], [cx + 16, topo + 34], [ox + 18, oy - 16 + baixo], [ox - 18, oy - 16 + baixo]], SANGUE[1]);
    for (let y = topo + 36; y < oy - 17 + baixo; y += 3) for (let x = -15 + ((y / 3) & 1) * 2; x < 16; x += 4) s.px(cx + x, y, SANGUE[3]);
    s.bola(cx, topo + 24, 18, 14, BRONZE, 0.5, -0.7); for (let y = -8; y <= 8; y += 4) for (let x = -13 + ((y / 4) & 1) * 3; x <= 13; x += 6) { s.px(cx + x, topo + 24 + y, BRONZE[0]); s.px(cx + x + 1, topo + 24 + y, BRONZE[4]); }
    s.ret(cx - 17, topo + 33, 34, 3, OURO[2]); s.ret(cx - 17, topo + 33, 34, 1, OURO[4]);
    // cabeça, barba e elmo
    const hx = cx + 2, hy = topo + 6;
    s.bola(hx, hy, 7, 7, R('#A9794F')); s.poli([[hx - 5, hy + 2], [hx + 7, hy + 2], [hx + 5, hy + 14], [hx - 2, hy + 14]], NOITE[1]); for (let y = 4; y < 14; y += 2) s.ret(hx - 3, hy + y, 8, 1, NOITE[3]);
    s.carimbo(ELMO, hx - 4, hy - 10, { A: ACO[3], a: ACO[1], E: TINTA }); s.ret(hx, hy - 13, 1, 3, OURO[3]);
    if (!E.caido) olhos(s, hx + 1, hy - 3, 3, E.prep ? BR : RUBI);
    // escudo redondo na frente
    const ex = cx + 17 + (inv ? 4 : 0), ey = topo + 28 + (E.caido ? 8 : 0); s.bola(ex, ey, 9, 12, FERRO, 0.5, -0.7); s.bola(ex, ey, 3, 3, OURO); for (let a = 0; a < 8; a++) s.px(ex + Math.cos(a * 0.785) * 6, ey + Math.sin(a * 0.785) * 9, OURO[3]);
    // a maça: erguida no aviso, descendo no golpe
    const ang = E.caido ? 2.4 : E.prep ? -2.0 : E.ataca ? 0.25 : -0.9 + E.resp * 0.05, sx0 = E.ataca ? cx + 8 : cx - 13, m = braco(s, sx0, topo + 16, sx0 + Math.cos(ang) * 14, topo + 20 + Math.sin(ang) * 14, 5, BRONZE, R('#A9794F'), -2);
    const px = m.x + Math.cos(ang) * 20, py = m.y + Math.sin(ang) * 20; s.linha(m.x, m.y, px, py, 2, R('#6B4A2E')[2]); s.bola(px, py, 6, 6, FERRO); for (let a = 0; a < 6; a++) s.ret(px + Math.cos(a * 1.05) * 7 - 1, py + Math.sin(a * 1.05) * 7 - 1, 2, 2, ACO[4]);
  },

  // O Ressentimento: o verme que secou a planta de Jonas (Jn 4:7), enrolado no que restou dela.
  ressentimento(s, b, Tm) {
    const E = est(b, Tm), ond = a => Math.round(Math.sin(Tm * 1.6 + a) * 2), alto = E.caido ? 26 : E.prep ? 66 : 56;
    // a planta seca
    s.linha(ox - 16, oy, ox - 22, oy - 58, 3, FOLHA[1]); s.linha(ox - 22, oy - 58, ox - 6, oy - 74, 2, FOLHA[1]);
    for (const [x, y, sd] of [[-24, -40, -1], [-20, -56, 1], [-8, -72, 1], [-28, -24, -1]]) s.poli([[ox + x, oy + y], [ox + x + sd * 12, oy + y - 4], [ox + x + sd * 9, oy + y + 6]], FOLHA[y % 3 ? 2 : 1]);
    // o corpo em anéis, do chão até a cabeça
    let px = ox + 14, py = oy - 6;
    s.bola(ox + 4, oy - 6, 20, 7, VERME, 0.4, -0.7); s.bola(ox + 18, oy - 9, 11, 8, VERME, 0.4, -0.7);
    for (let i = 1; i <= 9; i++) { const k = i / 9, x = ox + 12 + Math.sin(k * 3.3) * 12 + ond(i * 0.6) * k + (E.ataca ? k * k * 22 : 0), y = oy - 8 - k * alto + (E.ataca ? k * k * 18 : 0), r = 10 - k * 3; s.bola(x, y, r, r - 1, VERME, 0.5, -0.7); s.linha(x - r + 2, y + r - 3, x + r - 2, y + r - 3, 1, VERME[0]); px = x; py = y; }
    // a cabeça: sem olhos, só a boca que rói
    const abre = E.prep ? 5 : E.ataca ? 3 : E.resp;
    s.bola(px + 3, py - 4, 9, 8, R('#8A5A4A'), 0.5, -0.7);
    if (!E.caido) { s.poli([[px + 5, py - 6 - abre], [px + 14, py - 5 - abre], [px + 8, py - 2]], OSSO[3]); s.poli([[px + 5, py + abre], [px + 14, py - 1 + abre], [px + 8, py - 3]], OSSO[2]); s.ret(px + 6, py - 4, 4, 2, E.pisca && E.prep ? FOGO : SANGUE[1]); }
    for (let a = 0; a < 5; a++) s.px(px - 2 + a * 2, py - 12 - (a % 2), VERME[4]);
    // o sol que castiga: o calor sobe do corpo
    for (let i = 0; i < 4; i++) { const k = (Tm * 0.7 + i / 4) % 1; s.px(ox - 4 + i * 10 + Math.sin(k * 8) * 2, oy - 20 - k * 30, C(i % 2 ? '#FFB05A' : '#FFE08A')); }
  }
};
