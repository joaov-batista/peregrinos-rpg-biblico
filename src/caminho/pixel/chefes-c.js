// As sombras das páginas vivas (a história do peregrino) em pixel art. Cada uma tem uma silhueta que se reconhece de longe:
// a Escassez é um corpo de gravetos com uma botija rachada no lugar da cabeça; o Desprezo é um manto só, com muitas máscaras
// de olhos fechados e uma mão enorme que aponta; o Cárcere é a prisão de Herodes posta de pé, com elmo de legionário.
import { R, C, OX as ox, OY as oy, est, TINTA } from './kit.js';

const BARRO = R('#B8733E'), BARROE = R('#7A4426'), OSSO = R('#E4DFCF'), PELE = R('#9A7A58'), TRAPO = R('#6B5238'), PO = R('#D9B878');
const MANTO = R('#4A4060'), MANTOE = R('#2E2840'), PORC = R('#E8E2D6'), CAPUZ = R('#3A324C'), MAO = R('#C9A888');
const FERRO = R('#4A4E5A'), ACO = R('#8A93A3'), PEDRA = R('#6E6A78'), PEDRAE = R('#454250'), CRISTA = R('#B8322E'), BRONZE = R('#C9963C');
const BR = C('#FFFFFF'), AMBAR = C('#FFD23F'), BRASA = C('#FF5A3C'), LUZ = C('#FFF1BE'), BREU = C('#0D0E14');

const FECHADURA = ['.EEE.', 'EEEEE', 'EEEEE', '.EEE.', '..E..', '.EEE.', '.EEE.'];
const DEDO = ['OO....', 'OOOOOO', 'OOOOOo', 'OOO...', 'OOo...', '.oo...'];        // a mão que aponta (para a esquerda)
const PALMA = ['.O.O.O.', '.O.O.O.', 'OO.O.OO', 'OOOOOOO', 'OOOOOOo', '.OOOOo.', '..OOo..']; // a mão espalmada: "pare"

export const CHEFES_C = {
  /* ------------------------------------------------------------------------------------------------
     A ESCASSEZ (1Rs 17:12): "apenas um punhado de farinha na panela e um pouco de azeite na botija"
     ------------------------------------------------------------------------------------------------ */
  escassez(s, b, Tm) {
    const E = est(b, Tm), cai = E.caido ? 12 : 0, bal = Math.round(Math.sin(Tm * 1.6) * 2), cx = ox + (E.caido ? 4 : 0), quadril = oy - 36 + cai, ombro = quadril - 26 + E.resp;
    const puxa = E.tipo === 'fome', ergue = E.prep || E.tipo === 'rachaduras' || E.tipo === 'mirrar';
    // pernas de graveto, com faixas, e pés chatos
    for (const sd of [-1, 1]) { const px0 = cx + sd * 4, jx = cx + sd * (7 + (E.anda && sd * (E.passo ? 1 : -1) > 0 ? 3 : 0)), py = oy - 2; s.membro(px0, quadril, jx, quadril + 17, 2, PELE); s.membro(jx, quadril + 17, cx + sd * 6, py, 2, PELE); s.ret(jx - 1, quadril + 15, 3, 3, OSSO[2]); s.ret(cx + sd * 6 - (sd < 0 ? 5 : 1), py, 7, 2, PELE[1]); for (let k = 0; k < 3; k++) s.px(cx + sd * 5, quadril + 5 + k * 4, TRAPO[3]); }
    // saiote em trapos
    s.poli([[cx - 7, quadril - 4], [cx + 7, quadril - 4], [cx + 12 + bal, quadril + 16], [cx - 12 + bal, quadril + 16]], TRAPO[2]);
    for (let x = -12; x <= 12; x++) { const h = (x * 7 + 50) % 5; s.ret(cx + x + bal, quadril + 16, 1, 1 + h, TRAPO[x < 0 ? 1 : 2]); if (x % 4 === 0) s.linha(cx + x * 0.6, quadril - 3, cx + x + bal, quadril + 15, 1, TRAPO[0]); }
    // o tronco: uma gaiola de costelas com o ventre fundo
    s.bola(cx, ombro + 11, 9, 13, PELE, 0.45, -0.7);
    s.bola(cx, ombro + 20, 5, 5, R('#3A2A1E'), 0.5, 0.6); // o vazio da barriga
    for (let k = 0; k < 4; k++) { const y = ombro + 4 + k * 4, l = 8 - k; s.ret(cx - l, y, l - 1, 1, PELE[0]); s.ret(cx + 2, y, l - 1, 1, PELE[1]); s.px(cx - l, y - 1, PELE[4]); }
    s.ret(cx, ombro + 2, 1, 16, PELE[4]);
    for (const sd of [-1, 1]) s.bola(cx + sd * 10, ombro + 2, 3, 3, OSSO, 0.4, -0.7); // ombros de osso
    // braços compridos demais
    const maos = [];
    for (const sd of [-1, 1]) {
      const o = { x: cx + sd * 10, y: ombro + 3 };
      const m = E.caido ? { x: o.x + sd * 6, y: oy - 6 } : puxa && sd < 0 ? { x: cx - 44, y: ombro + 6 + bal } : ergue ? { x: cx + sd * 9, y: ombro - 30 - (E.pisca ? 1 : 0) } : { x: cx + sd * 7, y: ombro + 25 + E.resp };
      const c = { x: (o.x + m.x) / 2 + sd * (ergue ? 9 : 6), y: (o.y + m.y) / 2 + (ergue ? 0 : 3) };
      s.membro(o.x, o.y, c.x, c.y, 2, PELE); s.membro(c.x, c.y, m.x, m.y, 2, PELE); s.bola(c.x, c.y, 2, 2, OSSO, 0.4, -0.6);
      for (let d = -1; d <= 1; d++) s.linha(m.x, m.y, m.x + (puxa && sd < 0 ? -4 : d * 2), m.y + (puxa && sd < 0 ? d * 2 : ergue ? -3 : 3), 1, OSSO[3]); // dedos
      maos.push(m);
    }
    // a tigela vazia: no colo quando parada, virada sobre a cabeça quando vai golpear (só cai pó)
    if (!E.caido && !puxa) { const ty = ergue ? ombro - 33 : ombro + 26 + E.resp; s.bola(cx, ty + (ergue ? -1 : 2), 10, 4, BARROE, 0.4, ergue ? 0.8 : -0.8); s.ret(cx - 9, ty + (ergue ? 2 : 0), 19, 1, TINTA); s.ret(cx - 8, ty + (ergue ? 1 : 1), 17, 1, BARRO[4]); if (ergue) for (let k = 0; k < 6; k++) s.px(cx - 7 + ((k * 5 + E.t6 * 3) % 15), ty + 4 + ((E.t6 * 2 + k * 3) % 9), PO[3 + (k % 2)]); else s.px(cx + 2, ty + 1, PO[4]); }
    // a cabeça é a botija: bojo de barro, gargalo, duas alças, a faixa pintada e a rachadura por onde ela olha
    const hx = cx + (E.caido ? 5 : puxa ? -3 : 0), hy = ombro - 15 + (E.caido ? 9 : 0) + (ergue ? 1 : 0);
    s.ret(hx - 3, hy + 13, 6, 4, PELE[1]); // pescoço
    s.bola(hx, hy, 14, 15, BARRO, 0.5, -0.7);
    s.ret(hx - 5, hy - 20, 10, 6, BARRO[2]); s.ret(hx - 5, hy - 20, 2, 6, BARRO[4]); s.ret(hx + 3, hy - 20, 2, 6, BARRO[0]); s.ret(hx - 7, hy - 22, 14, 2, BARRO[3]); s.ret(hx - 4, hy - 21, 8, 1, BREU);
    for (const sd of [-1, 1]) { s.linha(hx + sd * 6, hy - 16, hx + sd * 13, hy - 12, 2, BARROE[2]); s.linha(hx + sd * 13, hy - 12, hx + sd * 12, hy - 5, 2, BARROE[2]); }
    for (let x = -13; x <= 13; x++) { const l = Math.sqrt(Math.max(0, 1 - Math.pow(6 / 15, 2))) * 14; if (Math.abs(x) < l) { s.px(hx + x, hy + 6 + ((x + 20) % 4 < 2 ? 0 : 1), BARROE[1]); s.px(hx + x, hy + 9, BARROE[2]); } }
    const larg = E.f2 ? 8 : 6; // a rachadura cresce na segunda fase
    s.poli([[hx - larg, hy - 6], [hx - 2, hy - 9], [hx + 1, hy - 5], [hx + larg, hy - 8], [hx + larg - 1, hy + 1], [hx + 2, hy + 4], [hx - 1, hy + 1], [hx - larg + 1, hy + 3]], BREU);
    s.linha(hx + larg, hy - 8, hx + 11, hy - 13, 1, BREU); s.linha(hx - larg + 1, hy + 3, hx - 9, hy + 9, 1, BREU); if (E.f2) { s.linha(hx + 2, hy + 4, hx + 5, hy + 12, 1, BREU); s.linha(hx - 2, hy - 9, hx - 4, hy - 14, 1, BREU); }
    if (!E.caido) { const o = E.prep && E.pisca ? BR : AMBAR; s.ret(hx - 5, hy - 4, 2, 3, o); s.ret(hx + 3, hy - 5, 2, 3, o); s.px(hx - 5, hy - 5, LUZ); s.px(hx + 3, hy - 6, LUZ); }
    else { s.ret(hx - 5, hy - 2, 3, 1, BARROE[3]); s.ret(hx + 2, hy - 3, 3, 1, BARROE[3]); }
    // o pó que escorre da boca da botija
    for (let k = 0; k < 4; k++) { const t = (Tm * 0.9 + k / 4) % 1; s.px(hx + 16 - k, hy - 10 + t * 40, PO[2 + (k % 3)]); }
  },

  /* ------------------------------------------------------------------------------------------------
     O DESPREZO (Mc 10:48): "muitos o repreendiam para que se calasse"
     ------------------------------------------------------------------------------------------------ */
  desprezo(s, b, Tm) {
    const E = est(b, Tm), cai = E.caido ? 9 : 0, grita = E.tipo === 'calaTe' || E.ataca, aponta = E.prep || E.tipo === 'dedos', empurra = E.tipo === 'empurrao' || E.tipo === 'atropelo';
    const base = oy - 2, incl = empurra && E.ataca ? -5 : 0;
    // um manto só, do tamanho de uma multidão, com as dobras e a barra em farrapos
    s.poli([[ox - 15 + incl, base - 86 + cai], [ox + 15 + incl, base - 86 + cai], [ox + 37, base], [ox - 37, base]], MANTO[2]);
    s.poli([[ox - 15 + incl, base - 86 + cai], [ox - 8 + incl, base - 86 + cai], [ox - 22, base], [ox - 37, base]], MANTO[1]);
    s.poli([[ox + 9 + incl, base - 86 + cai], [ox + 15 + incl, base - 86 + cai], [ox + 37, base], [ox + 27, base]], MANTO[3]);
    for (let k = -3; k <= 3; k++) s.linha(ox + k * 4 + incl, base - 80 + cai, ox + k * 10, base - 2, 1, k % 2 ? MANTOE[2] : MANTOE[1]);
    for (let x = -37; x <= 37; x++) { const h = (x * 11 + 400) % 6; if (h < 3) s.ret(ox + x, base, 1, 1 + h, MANTO[x < 0 ? 1 : 2]); }
    // os pés de todo mundo, arrastando juntos
    for (let k = 0; k < 9; k++) { const x = ox - 32 + k * 8 + ((E.anda || empurra) && (k + E.passo) % 2 ? 1 : 0); s.ret(x, base + 1 - ((E.anda || empurra) && (k + E.passo) % 2 ? 1 : 0), 4, 2, PELE[1]); }
    // as máscaras: nenhuma olha para você. Olhos fechados, bocas que só se abrem para mandar calar
    const mascara = (mx, my, rx, ry, k, grande) => {
      const sw = Math.round(Math.sin(Tm * 2.3 + k * 1.7) * (grita ? 2 : 1)), x = mx + sw + incl * (my < base - 50 ? 1 : 0.4), y = my + cai + (aponta && grande ? -2 : 0);
      s.bola(x, y - ry * 0.5, rx + 3, ry * 0.9, CAPUZ, 0.4, -0.7); // o capuz
      s.bola(x, y, rx, ry, PORC, 0.45, -0.7);
      if (E.caido) { s.ret(x - rx + 2, y - 1, rx - 2, 1, TINTA); s.ret(x + 1, y - 1, rx - 2, 1, TINTA); s.ret(x - 2, y + ry - 4, 4, 1, TINTA); return; }
      for (const sd of [-1, 1]) { const ex = x + sd * (rx * 0.45); s.linha(ex - 2, y - 2, ex, y - 1, 1, TINTA); s.linha(ex, y - 1, ex + 2, y - 2, 1, TINTA); if (grande) s.px(ex, y - 4, PORC[1]); } // pálpebras baixas
      const abre = grita ? (grande ? 6 : 3 + ((k + E.t6) % 2)) : aponta && E.pisca ? 2 : 0;
      if (abre) { s.bola(x, y + ry * 0.45, grande ? 4 : 2.4, abre * 0.6 + 1, R('#2A1420'), 0.5, 0.8); s.ret(x - 1, y + ry * 0.45 - 1, 2, 1, C('#8E2B45')); } else s.linha(x - (grande ? 4 : 2), y + ry * 0.5, x + (grande ? 4 : 2), y + ry * 0.5 - 1, 1, TINTA);
      if (E.f2 && k % 2 === 0) { s.linha(x + 1, y - ry + 1, x - 1, y - 2, 1, TINTA); s.px(x - 2, y - 1, TINTA); } // rachadas na segunda fase
    };
    [[-24, base - 22, 6, 7, 0], [0, base - 20, 6, 7, 1], [24, base - 22, 6, 7, 2], [-13, base - 42, 6, 7, 3], [13, base - 42, 6, 7, 4], [-22, base - 54, 5, 6, 5], [22, base - 54, 5, 6, 6]].forEach(([x, y, rx, ry, k]) => mascara(ox + x, y, rx, ry, k, false));
    mascara(ox, base - 70, 10, 12, 7, true);
    s.ret(ox - 9 + incl, base - 88 + cai, 18, 2, BRONZE[3]); for (let k = 0; k < 5; k++) s.ret(ox - 8 + k * 4 + incl, base - 91 + cai, 2, 3, BRONZE[k % 2 ? 2 : 4]); // o diadema de quem manda calar
    // a mão: grande demais, erguida em "pare"; no aviso ela desce e aponta para você
    if (!E.caido) {
      const o = { x: ox + 20, y: base - 58 }, m = aponta ? { x: ox - 30, y: base - 52 + (E.pisca ? 0 : 1) } : empurra ? { x: ox - 34, y: base - 36 } : { x: ox + 38, y: base - 88 + E.resp };
      const c = { x: (o.x + m.x) / 2 + (aponta || empurra ? 0 : 8), y: (o.y + m.y) / 2 - (aponta || empurra ? 12 : -4) };
      s.membro(o.x, o.y, c.x, c.y, 6, MANTO); s.membro(c.x, c.y, m.x, m.y, 5, MAO);
      if (aponta) s.carimbo(DEDO.map(l => l.split('').reverse().join('')), Math.round(m.x) - 12, Math.round(m.y) - 3, { O: MAO[3], o: MAO[1] }, 1);
      else if (empurra) { s.bola(m.x - 2, m.y, 5, 7, MAO, 0.4, -0.6); for (let d = -2; d <= 2; d++) s.ret(m.x - 8, m.y + d * 3 - 1, 4, 2, MAO[3]); }
      else s.carimbo(PALMA, Math.round(m.x) - 3, Math.round(m.y) - 8, { O: MAO[3], o: MAO[1] });
    }
  },

  /* ------------------------------------------------------------------------------------------------
     O CÁRCERE (At 12:4-10): a prisão de Herodes posta de pé. Duas cadeias, quatro escoltas, o portão de ferro
     ------------------------------------------------------------------------------------------------ */
  carcere(s, b, Tm) {
    const E = est(b, Tm), cai = E.caido ? 9 : 0, cx = ox, topo = oy - 76 + cai + E.resp, chao = oy - 2, dano = 1 - b.hp / b.max;
    const tipo = E.tipo, estica = tipo === 'correntes' && E.ataca, levanta = E.prep || tipo === 'portao', lanterna = tipo === 'ronda', finca = tipo === 'escoltas' && E.ataca;
    // pernas: dois pilares de pedra com cinta de ferro
    for (const sd of [-1, 1]) { const x = cx + sd * 11 - 6, sobe = E.anda && sd * (E.passo ? 1 : -1) > 0 ? 2 : 0; s.ret(x, chao - 20 + cai - sobe, 12, 20 - cai, PEDRA[2]); s.ret(x, chao - 20 + cai - sobe, 2, 20 - cai, PEDRA[4]); s.ret(x + 10, chao - 20 + cai - sobe, 2, 20 - cai, PEDRA[0]); s.ret(x - 1, chao - 4 - sobe, 14, 4, PEDRAE[2]); s.ret(x, chao - 13 - sobe, 12, 2, FERRO[3]); for (let k = 0; k < 3; k++) s.px(x + 2 + k * 4, chao - 12 - sobe, ACO[4]); s.linha(x + 3, chao - 19 + cai, x + 5, chao - 15, 1, PEDRAE[0]); }
    // o corpo é uma cela: fundo escuro, a luz de quem ora lá dentro, as barras e o arco de pedra
    const y0 = topo + 8, y1 = chao - 20 + cai, lg = 21;
    s.ret(cx - lg, y0, lg * 2, y1 - y0, BREU);
    const luz = 3 + Math.round(dano * 6) + (E.t6 % 2), ly = y0 + 40; // quanto mais ferido, mais a luz de dentro cresce
    s.bola(cx, ly, luz + 3, luz + 2, R('#8A5A1C'), 0.5, -0.5); s.bola(cx, ly, luz, luz, R('#FFD98A'), 0.5, -0.5); s.ret(cx - 1, ly - luz - 2 - (E.t6 % 2), 2, 3, LUZ);
    for (let k = -4; k <= 4; k++) { const x = cx + k * 5, torta = E.f2 && (k === 2 || k === 3) ? Math.round(Math.sin((k + 1) * 1.3) * 3) : 0, quebrada = dano > 0.72 && k === -2;
      for (let y = y0; y < y1; y++) { if (quebrada && y > y0 + 12 && y < y1 - 14) continue; const dx = torta ? Math.round(torta * Math.sin((y - y0) / (y1 - y0) * Math.PI)) : 0; s.px(x + dx, y, ACO[2]); s.px(x + dx - 1, y, ACO[4]); s.px(x + dx + 1, y, ACO[0]); } }
    for (const y of [y0 + 10, y1 - 12]) { s.ret(cx - lg, y, lg * 2, 3, FERRO[2]); s.ret(cx - lg, y, lg * 2, 1, FERRO[4]); for (let k = -4; k <= 4; k++) s.px(cx + k * 5, y + 1, ACO[4]); }
    s.ret(cx - lg - 2, y0 - 2, 3, y1 - y0 + 2, PEDRA[3]); s.ret(cx + lg - 1, y0 - 2, 3, y1 - y0 + 2, PEDRA[1]); s.ret(cx - lg - 3, y1 - 2, lg * 2 + 6, 4, PEDRAE[2]);
    // o arco: sete aduelas e a pedra do meio
    for (let k = -3; k <= 3; k++) { const a = k / 3 * 1.15, x = cx + Math.sin(a) * (lg + 1), y = y0 + 3 - Math.cos(a) * 9; s.bola(x, y, 4.2, 3.6, k ? PEDRA : PEDRAE, 0.5, -0.7); }
    // o cadeado no peito: acende no aviso
    const cad = E.prep && E.pisca ? BR : dano > 0.72 ? LUZ : BRASA;
    s.ret(cx - 6, y0 + 16, 12, 12, FERRO[1]); s.ret(cx - 6, y0 + 16, 12, 1, FERRO[4]); s.ret(cx - 6, y0 + 16, 1, 12, FERRO[3]); s.linha(cx - 4, y0 + 16, cx - 4, y0 + 12, 1, ACO[3]); s.linha(cx + 3, y0 + 16, cx + 3, y0 + 12, 1, ACO[3]); s.ret(cx - 4, y0 + 11, 8, 1, ACO[3]);
    s.carimbo(FECHADURA, cx - 2, y0 + 18, { E: cad });
    // o molho de chaves na cintura
    for (let k = 0; k < 4; k++) { const sw = Math.round(Math.sin(Tm * 3 + k) * 1.5); s.linha(cx + 13 + k * 2, y1 - 8, cx + 13 + k * 2 + sw, y1 - 1, 1, BRONZE[k % 2 ? 2 : 4]); s.px(cx + 13 + k * 2 + sw, y1, BRONZE[4]); s.px(cx + 14 + k * 2 + sw, y1 - 1, BRONZE[3]); } s.bola(cx + 16, y1 - 9, 4, 2.5, BRONZE, 0.4, -0.7);
    // ombros: dois torreões com ameias
    const torre = [];
    for (const sd of [-1, 1]) { const x = cx + sd * (lg + 6), y = y0 - 4; s.ret(x - 6, y, 12, 14, PEDRA[2]); s.ret(x - 6, y, 2, 14, PEDRA[4]); s.ret(x + 4, y, 2, 14, PEDRA[0]); for (let k = 0; k < 3; k++) s.ret(x - 6 + k * 5, y - 3, 3, 3, PEDRA[3]); s.ret(x - 1, y + 4, 2, 5, BREU); s.ret(x - 7, y + 13, 14, 2, PEDRAE[2]); torre.push({ x, y: y + 12 }); }
    // braços: correntes com um grilhão na ponta. Cada golpe tem a sua pose
    torre.forEach((o, i) => { const sd = i ? 1 : -1;
      const m = E.caido ? { x: o.x + sd * 6, y: chao - 3 } : estica ? { x: o.x + sd * 30, y: o.y - 2 } : levanta ? { x: o.x + sd * 6, y: topo - 22 - (E.pisca ? 1 : 0) } : lanterna && sd < 0 ? { x: cx - 46, y: topo + 30 } : finca ? { x: o.x + sd * 4, y: chao - 6 } : { x: o.x + sd * 5, y: o.y + 30 + Math.round(Math.sin(Tm * 2 + i) * 2) };
      const n = 8; for (let k = 1; k <= n; k++) { const t = k / n, barriga = E.caido || estica || levanta ? 0 : Math.sin(t * Math.PI) * sd * 4, x = o.x + (m.x - o.x) * t + barriga, y = o.y + (m.y - o.y) * t + (estica ? Math.sin(t * Math.PI) * 3 : 0); if (k % 2) { s.bola(x, y, 2.6, 2, ACO, 0.4, -0.7); } else { s.ret(x - 1, y - 2, 2, 4, FERRO[3]); } }
      if (lanterna && sd < 0 && !E.caido) { s.ret(m.x - 4, m.y - 2, 9, 11, FERRO[1]); s.ret(m.x - 3, m.y, 7, 7, AMBAR); s.ret(m.x - 1, m.y + 1, 3, 5, LUZ); s.ret(m.x - 5, m.y - 3, 11, 2, FERRO[3]); s.ret(m.x - 1, m.y - 6, 3, 3, FERRO[3]); for (let k = 1; k < 6; k++) s.px(m.x - 6 - k * 3, m.y + 4 + (k % 2), k < 3 ? LUZ : AMBAR); } // a lanterna da ronda
      else { s.bola(m.x, m.y + 4, 6, 6, FERRO, 0.4, -0.7); s.bola(m.x, m.y + 4, 3, 3, R('#15161E'), 0.5, 0.5); s.ret(m.x - 6, m.y + 3, 2, 2, ACO[4]); if (finca) s.linha(m.x, m.y + 8, m.x, m.y + 14, 1, ACO[4]); } // o grilhão aberto
    });
    if (tipo === 'portao' && !E.caido) { const y = topo - 26; s.ret(cx - 30, y, 60, 3, FERRO[2]); s.ret(cx - 30, y, 60, 1, FERRO[4]); for (let k = -5; k <= 5; k++) { s.ret(cx + k * 5.5 - 1, y + 3, 2, 9, ACO[2]); s.poli([[cx + k * 5.5 - 2, y + 12], [cx + k * 5.5 + 2, y + 12], [cx + k * 5.5, y + 16]], ACO[3]); } } // a grade do portão, erguida para cair
    // a cabeça: elmo de legionário, com a crista vermelha atravessada e uma fechadura no lugar do rosto
    const hy = topo - 5 + (E.caido ? 4 : 0), hx = cx + (E.caido ? 3 : 0);
    s.ret(hx - 5, hy + 6, 10, 5, PEDRAE[1]);
    for (let k = -8; k <= 8; k++) { const h = 9 - Math.round(Math.abs(k) * 0.55) + ((k + E.t6) % 2 && !E.caido ? 1 : 0); s.ret(hx + k * 1.5, hy - 12 - h, 2, h, CRISTA[k % 3 === 0 ? 4 : k % 2 ? 2 : 1]); } // a crista
    s.ret(hx - 13, hy - 12, 26, 2, BRONZE[2]);
    s.bola(hx, hy - 3, 12, 10, ACO, 0.45, -0.75);
    s.ret(hx - 12, hy - 3, 24, 2, BRONZE[3]); s.ret(hx - 12, hy - 3, 24, 1, BRONZE[4]); for (let k = -3; k <= 3; k++) s.px(hx + k * 3, hy - 2, BRONZE[1]);
    for (const sd of [-1, 1]) { s.poli([[hx + sd * 12, hy - 1], [hx + sd * 6, hy - 1], [hx + sd * 5, hy + 9], [hx + sd * 10, hy + 7]], ACO[sd < 0 ? 3 : 1]); s.px(hx + sd * 9, hy + 2, ACO[4]); } // guarda-faces
    s.ret(hx - 5, hy - 1, 10, 10, BREU); s.ret(hx - 14, hy + 1, 4, 2, ACO[2]); // a nuca
    if (E.caido) s.ret(hx - 2, hy + 3, 4, 1, FERRO[3]); else s.carimbo(FECHADURA, hx - 2, hy, { E: E.prep && E.pisca ? BR : BRASA });
    if (!E.caido && (E.prep || E.f2)) for (let k = 0; k < 3; k++) s.px(hx - 3 + k * 3, hy + 9 + ((E.t6 + k) % 3), BRASA); // brasas que caem da fechadura
  }
};
