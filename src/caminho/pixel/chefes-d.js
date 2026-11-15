// Redesenhos: chefes das páginas que estavam genéricos demais ganham silhueta própria e uma pose para cada golpe.
import { R, C, OX as ox, OY as oy, est, TINTA } from './kit.js';

const ROXO = R('#5A3E8A'), ROXOE = R('#2E2048'), PORC = R('#EDE6D8'), ESPELHO = R('#9FC4D8'), PRATA = R('#C8D2DC'), LINGUA = C('#C24058');
const VINHO = R('#8E2B45'), CARMIM = R('#C24058'), VEU = R('#D98AA8'), OURO = R('#D9A63C'), PELE = R('#D9A882'), ESCAMA = R('#3F7A5A'), ESCAMAE = R('#24503A');
const BR = C('#FFFFFF'), AMBAR = C('#FFD23F'), BREU = C('#120C1A'), ROSA = C('#FF8FB8');

const SORRISO = ['..OOOOO', '.OOOOOO', 'OOOOOOO', 'OEEOOOO', 'OOOOOOO', 'OOOOOOO', 'OmOOOOO', 'OOmmOOO', '.OOOmOO', '..OOOOO', '...OOOO'];   // a metade que sorri
const VAZIO = ['EEEEE..', 'EEEEEE.', 'EEEEEEE', 'EEEAEEE', 'EEEEEEE', 'EEEEEEE', 'EEEEEEE', 'EEEEEEE', 'EEEEEE.', 'EEEEE..', 'EEEE...'];     // a metade que não tem rosto
const CACO = ['.L.', 'LMm', 'Mmm', '.m.'];

export const CHEFES_D = {
  /* A MENTIRA (Jo 8:44): duas caras numa máscara só, um manto de cacos de espelho e a língua bifurcada */
  mentira(s, b, Tm) {
    const E = est(b, Tm), cai = E.caido ? 10 : 0, flu = E.flu, cx = ox, topo = oy - 84 + cai + flu, base = oy - 6 + (E.caido ? 4 : 0);
    const tipo = E.tipo, abre = E.prep || tipo === 'copias', cochicha = tipo === 'boato', troca = tipo === 'troca', vira = tipo === 'inverter' && !E.prep, meia = tipo === 'meiaVerdade';
    // o manto: largo embaixo, sem pés (ela não pisa em lugar nenhum), todo costurado de cacos
    s.poli([[cx - 9, topo + 22], [cx + 9, topo + 22], [cx + 24, base], [cx - 24, base]], ROXO[2]);
    s.poli([[cx - 9, topo + 22], [cx - 3, topo + 22], [cx - 12, base], [cx - 24, base]], ROXO[1]); s.poli([[cx + 4, topo + 22], [cx + 9, topo + 22], [cx + 24, base], [cx + 15, base]], ROXO[3]);
    for (let x = -24; x <= 24; x++) { const h = (x * 13 + 300) % 7; s.ret(cx + x, base, 1, 2 + h, x % 2 ? ROXO[1] : ROXOE[2]); }
    for (let i = 0; i < 9; i++) { const k = (i * 37) % 100 / 100, y = topo + 30 + k * (base - topo - 36), l = 6 + (y - topo - 22) / (base - topo - 22) * 14, x = cx + (((i * 53) % 100) / 100 * 2 - 1) * l, brilha = (E.t6 + i * 2) % 9 === 0; s.carimbo(CACO, Math.round(x) - 1, Math.round(y), { L: brilha ? BR : ESPELHO[4], M: ESPELHO[brilha ? 4 : 2], m: ESPELHO[1] }); }
    s.linha(cx, topo + 24, cx - 2, base - 2, 1, ROXOE[1]);
    // a cauda de serpente que escapa por baixo do manto
    for (let k = 0; k < 9; k++) s.bola(cx + 20 + k * 2.2, base + 2 - Math.sin(Tm * 3 + k * 0.7) * 2 - k * 0.4, 2.6 - k * 0.22, 2.2 - k * 0.2, ESCAMA, 0.4, -0.7);
    // ombros e mangas: compridas, sem mãos; de dentro saem dedos de espelho
    for (const sd of [-1, 1]) {
      const o = { x: cx + sd * 9, y: topo + 25 };
      const m = E.caido ? { x: o.x + sd * 9, y: base - 4 } : abre ? { x: o.x + sd * 22, y: topo + 8 - (E.pisca ? 1 : 0) } : cochicha && sd < 0 ? { x: cx - 9, y: topo + 14 } : troca && sd < 0 ? { x: cx - 36, y: topo + 30 } : meia && sd > 0 ? { x: cx + 6, y: topo + 6 } : { x: o.x + sd * 12, y: topo + 50 + Math.round(Math.sin(Tm * 2 + sd) * 2) };
      const c = { x: (o.x + m.x) / 2 + sd * 5, y: (o.y + m.y) / 2 + (abre ? 3 : -2) };
      s.membro(o.x, o.y, c.x, c.y, 5, ROXO); s.membro(c.x, c.y, m.x, m.y, 6, ROXO);
      s.poli([[m.x - 4, m.y - 2], [m.x + 4, m.y - 2], [m.x + sd * 2 + 5, m.y + 9], [m.x + sd * 2 - 5, m.y + 9]], ROXO[1]); // a boca da manga
      for (let d = -1; d <= 1; d++) s.linha(m.x + d * 2, m.y + (abre ? -2 : 4), m.x + d * 3, m.y + (abre ? -8 : 10), 1, (E.t6 + d) % 3 ? ESPELHO[3] : BR);
    }
    // capuz alto, em ponta
    const hx = cx + (E.caido ? 4 : 0), hy = topo + 9 + (E.caido ? 5 : 0);
    s.poli([[hx - 11, hy + 12], [hx + 11, hy + 12], [hx + 9, hy - 6], [hx + 2, hy - 16], [hx - 8, hy - 8]], ROXOE[2]); s.poli([[hx - 11, hy + 12], [hx - 6, hy + 12], [hx - 5, hy - 6], [hx - 8, hy - 8]], ROXOE[1]);
    // a máscara: metade sorri, metade é um buraco. No "inverter" ela gira de cabeça para baixo
    const linhasS = vira ? [...SORRISO].reverse() : SORRISO, linhasV = vira ? [...VAZIO].reverse() : VAZIO, my = hy - 5, desloca = meia && !E.prep ? 4 : 0;
    s.carimbo(linhasS, hx - 7 - desloca, my, { O: PORC[3], E: TINTA, m: C('#8E2B45') });
    s.carimbo(linhasV, hx, my, { E: BREU, A: E.caido ? BREU : E.prep && E.pisca ? BR : AMBAR });
    s.ret(hx - desloca, my, 1, 11, TINTA);
    if (E.f2) { s.linha(hx - 5 - desloca, my + 1, hx - 3 - desloca, my + 5, 1, TINTA); s.px(hx - 4 - desloca, my + 6, TINTA); } // a porcelana racha
    // a língua bifurcada sai do lado sem rosto quando ela fala
    if (!E.caido && (cochicha || E.ataca || (E.prep && E.pisca))) { const lx = hx + 3, ly = my + (vira ? 2 : 8); s.linha(lx, ly, lx + 7, ly + 1, 1, LINGUA); s.px(lx + 8, ly, LINGUA); s.px(lx + 8, ly + 2, LINGUA); }
    // os cacos que a rodeiam: fecham em volta no aviso, espalham nas cópias
    if (!E.caido) for (let i = 0; i < 6; i++) { const a = Tm * (abre ? 2.4 : 1.1) + i * 1.047, r = abre ? 34 : 26, x = cx + Math.cos(a) * r, y = topo + 34 + Math.sin(a) * (abre ? 30 : 9); if (Math.sin(a) > -0.3 || abre) s.carimbo(CACO, Math.round(x) - 1, Math.round(y) - 2, { L: BR, M: PRATA[3], m: PRATA[1] }); }
  },

  /* A IMORALIDADE (Pv 7; Ap 17:4): véu, cálice de ouro, pulseiras; e, do véu para baixo, uma serpente enrolada */
  imoralidade(s, b, Tm) {
    const E = est(b, Tm), cai = E.caido ? 9 : 0, cx = ox, base = oy - 2, topo = oy - 80 + cai + E.flu, tipo = E.tipo;
    const chama = E.prep || tipo === 'encanto', laca = tipo === 'laco' && E.ataca, sopra = tipo === 'beijos', incensa = tipo === 'perfume', bote = tipo === 'cilada';
    // a serpente: três voltas grossas no chão e a cauda que se levanta na cilada
    for (const [dx, dy, rx, ry] of [[0, -6, 27, 8], [-3, -17, 21, 7], [2, -27, 15, 6]]) { s.bola(cx + dx, base + dy, rx, ry, ESCAMA, 0.45, -0.75); for (let x = -rx + 3; x < rx - 2; x += 5) s.px(cx + dx + x, base + dy - 1 + ((x + 60) % 2), ESCAMAE[1]); s.ret(cx + dx - rx + 4, base + dy + ry - 3, rx * 2 - 8, 1, R('#C9B878')[2]); }
    for (let k = 0; k < 10; k++) { const t = k / 9, x = cx + 26 + t * (bote ? 6 : 12), y = base - 8 - t * (bote ? 44 : 14) - Math.sin(Tm * 4 + k * 0.6) * 2; s.bola(x, y, 4 - t * 2.6, 3.4 - t * 2.2, ESCAMA, 0.4, -0.7); if (k === 9) { s.px(x + 1, y - 2, AMBAR); s.px(x - 1, y - 2, AMBAR); } }
    // o corpo sobe da espiral: vestido de púrpura e escarlata, cinto de ouro
    const cintura = base - 32 + cai;
    s.poli([[cx - 7, topo + 26], [cx + 7, topo + 26], [cx + 11, cintura + 4], [cx - 11, cintura + 4]], CARMIM[2]); s.poli([[cx - 7, topo + 26], [cx - 2, topo + 26], [cx - 5, cintura + 4], [cx - 11, cintura + 4]], CARMIM[1]);
    for (let k = 0; k < 4; k++) s.linha(cx - 4 + k * 3, topo + 30, cx - 7 + k * 5, cintura + 3, 1, VINHO[k % 2 ? 1 : 2]);
    s.ret(cx - 9, cintura - 12, 18, 3, OURO[3]); s.ret(cx - 9, cintura - 12, 18, 1, OURO[4]); s.bola(cx, cintura - 10, 2.5, 2.5, R('#8FE8FF'), 0.4, -0.6);
    // braços: pulseiras; uma mão chama, a outra ergue o cálice
    const maoC = { x: 0, y: 0 };
    for (const sd of [-1, 1]) {
      const o = { x: cx + sd * 7, y: topo + 28 };
      const m = E.caido ? { x: o.x + sd * 8, y: cintura } : sd > 0 ? (incensa ? { x: cx + 20, y: topo + 44 + Math.round(Math.sin(Tm * 6) * 4) } : chama ? { x: cx + 15, y: topo + 2 } : { x: cx + 15, y: topo + 22 + E.resp })
        : laca ? { x: cx - 34, y: topo + 30 } : sopra ? { x: cx - 10, y: topo + 16 } : chama ? { x: cx - 24, y: topo + 26 - (E.pisca ? 1 : 0) } : { x: cx - 13, y: topo + 44 + E.resp };
      const c = { x: (o.x + m.x) / 2 + sd * 4, y: (o.y + m.y) / 2 + 3 };
      s.membro(o.x, o.y, c.x, c.y, 3, PELE); s.membro(c.x, c.y, m.x, m.y, 3, PELE);
      for (let k = 0; k < 2; k++) { const t = 0.55 + k * 0.2; s.ret(c.x + (m.x - c.x) * t - 2, c.y + (m.y - c.y) * t - 1, 4, 2, OURO[k ? 4 : 3]); }
      if (sd > 0) { maoC.x = m.x; maoC.y = m.y; } else if (!E.caido) { for (let d = -1; d <= 1; d++) s.linha(m.x, m.y, m.x - 4, m.y + d * 2 - (chama ? 2 : 0), 1, PELE[3]); if (laca) for (let k = 0; k < 8; k++) s.px(m.x - 5 - k * 2, m.y + Math.round(Math.sin(k + Tm * 10) * 2), ROSA); }
    }
    // o cálice de ouro, transbordando (Ap 17:4); no "perfume" ele vira incensário e balança
    if (!E.caido) { const x = Math.round(maoC.x), y = Math.round(maoC.y); s.ret(x - 1, y - 6, 2, 6, OURO[2]); s.ret(x - 3, y - 1, 6, 2, OURO[3]); s.poli([[x - 6, y - 14], [x + 6, y - 14], [x + 3, y - 6], [x - 3, y - 6]], OURO[3]); s.ret(x - 6, y - 14, 12, 1, OURO[4]); s.ret(x - 5, y - 13, 2, 5, OURO[4]); s.ret(x - 4, y - 15, 8, 1, CARMIM[3]);
      for (let k = 0; k < 4; k++) { const t = (Tm * (incensa ? 1.6 : 0.8) + k / 4) % 1; s.px(x - 5 + k * 3 + Math.round(Math.sin(t * 6 + k) * 2), incensa ? y - 16 - t * 22 : y - 13 + t * 12, incensa ? VEU[3 + (k % 2)] : CARMIM[3]); } }
    // a cabeça: diadema, cabelo solto e o véu que cobre o rosto; só os olhos acendem quando ela chama
    const hx = cx + (E.caido ? 4 : sopra ? -2 : 0), hy = topo + 14 + (E.caido ? 6 : 0);
    s.poli([[hx - 9, hy - 6], [hx + 9, hy - 6], [hx + 13, hy + 30 + Math.round(Math.sin(Tm * 2) * 2)], [hx + 6, hy + 14], [hx - 6, hy + 14], [hx - 12, hy + 26]], R('#2A1420')[2]); // cabelo
    s.bola(hx, hy, 8, 9, PELE, 0.45, -0.7);
    s.ret(hx - 8, hy - 8, 16, 3, OURO[3]); s.ret(hx - 8, hy - 8, 16, 1, OURO[4]); for (let k = -2; k <= 2; k++) { s.ret(hx + k * 3, hy - 11 - (k === 0 ? 2 : 0), 1, 3 + (k === 0 ? 2 : 0), OURO[4]); } s.px(hx, hy - 14, ROSA);
    if (E.caido) { s.ret(hx - 5, hy - 1, 4, 1, TINTA); s.ret(hx + 1, hy - 1, 4, 1, TINTA); }
    else { const o = chama || E.f2 ? (E.pisca && E.prep ? BR : ROSA) : TINTA; s.ret(hx - 5, hy - 2, 3, 2, o); s.ret(hx + 2, hy - 2, 3, 2, o); s.px(hx - 6, hy - 3, TINTA); s.px(hx + 5, hy - 3, TINTA); }
    // o véu: do nariz para baixo, quase transparente (pontilhado), esvoaçando
    const sw = Math.round(Math.sin(Tm * 2.6) * 2) + (sopra ? -4 : 0);
    for (let y = 0; y < 16; y++) for (let x = -8 - (y >> 2); x <= 8 + (y >> 2); x++) if ((x + y) % 2 === 0) s.px(hx + x + Math.round(sw * y / 16), hy + 2 + y, VEU[y < 3 ? 4 : 2 + ((x + 40) % 2)]);
    s.ret(hx - 8, hy + 1, 16, 1, VEU[4]);
    if (sopra && E.ataca) for (let k = 0; k < 3; k++) { const x = hx - 14 - k * 6 - (E.t6 % 3) * 2, y = hy + 4 + (k % 2 ? -3 : 2); s.px(x, y, ROSA); s.px(x + 2, y, ROSA); s.px(x + 1, y + 1, ROSA); s.px(x - 1, y - 1, ROSA); s.px(x + 3, y - 1, ROSA); } // beijos
    if (E.f2) { for (let k = 0; k < 3; k++) s.px(hx - 3 + k * 3, hy + 9 + k, BREU); } // o véu rasga: por baixo não há rosto
  }
};
