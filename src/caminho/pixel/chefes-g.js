// Os cinco chefes da fase da célula, "Jesus me escolheu" (content/celula-escolheu.js). São as mentiras que o estudo
// desmonta, cada uma com um corpo que se lê de longe: a Rejeição aponta o dedo, o Interesseiro cobra com a balança,
// a Condenação arrasta correntes, a Covardia esconde o rosto (e tem a crista do galo), o Fracasso acusa de asas abertas.
// Mesmo rasterizador e kit dos outros chefes; desenhados olhando para a direita, ancorados em (60, 104).
import { R, C, OX as ox, OY as oy, est, manto, braco, asa, fiapos, TINTA } from './kit.js';

const BR = C('#FFFFFF'), BREU = C('#08060C');

// ---------- A Rejeição: um vulto alto de capuz, máscara riscada com um X e mãos que apontam de dentro do manto ----------
const REJ = R('#4A5070'), REJE = R('#2A2C40'), MASC = R('#D8D4E0'), MAO = R('#9AA0B8'), XR = C('#E0485A');
function rejeicao(s, b, Tm) {
  const E = est(b, Tm), t = E.tipo || '', grita = t === 'calaTe' && E.ataca, corre = t === 'atropelo' && (E.ataca || b.corre), aponta = t === 'dedos';
  const inc = corre ? 7 : E.prep ? -2 : 0, cai = E.caido ? 7 : 0, cx = ox + inc, top = oy - 86 + cai + E.resp;
  // o manto comprido, varrendo o chão
  manto(s, cx, top + 20, 12, ox + (corre ? -4 : 0), oy - 2, 26, REJ, 4);
  // mãos que saem do manto apontando (cada uma para um lado: "todo mundo aponta")
  const mãos = [[-20, 48, -1], [18, 40, 1], [-16, 66, -1], [20, 62, 1]];
  mãos.forEach(([dx, dy, sd], i) => { const tremor = Math.round(Math.sin(Tm * 6 + i) * 1.5), x = cx + dx, y = top + dy + tremor, comp = aponta && !E.prep ? 12 : 7;
    s.membro(x, y, x + sd * comp, y - 2, 2, MAO); s.ret(x + sd * comp - (sd < 0 ? 2 : 0), y - 3, 3, 2, MAO[3]); s.px(x + sd * (comp + 2), y - 3, MAO[4]); });
  // os braços de verdade: um aponta (o dedo da acusação), o outro se ergue no grito
  const ombro = { x: cx + 8, y: top + 26 }, alvo = grita || E.prep ? { x: ombro.x + 6, y: top + 2 } : aponta || corre ? { x: ombro.x + 26, y: top + 24 } : E.caido ? { x: ombro.x + 6, y: oy - 8 } : { x: ombro.x + 10, y: top + 44 };
  const m = braco(s, ombro.x, ombro.y, alvo.x, alvo.y, 4, REJE, MAO, 3, 1);
  s.ret(m.x - 2, m.y - 2, 5, 4, MAO[2]); s.linha(m.x + 2, m.y - 1, m.x + 9, m.y - 2, 2, MAO[3]); s.px(m.x + 10, m.y - 2, MAO[4]); // o indicador
  braco(s, cx - 8, top + 26, cx - 16, top + (E.caido ? 60 : 46), 4, REJE, MAO, -3, -1);
  // o capuz e a máscara
  s.bola(cx + 1, top + 10, 13, 14, REJE); s.bola(cx + 3, top + 12, 9, 10, R('#141420'));
  const mx = cx - 3, my = top + 4;
  s.ret(mx, my, 13, 15, MASC[3]); s.ret(mx, my + 13, 13, 2, MASC[1]); s.ret(mx + 1, my - 1, 11, 1, MASC[4]);
  for (let k = 0; k < 9; k++) { s.px(mx + 2 + k, my + 3 + k * 1.1, XR); s.px(mx + 10 - k, my + 3 + k * 1.1, XR); } // o X: "não escolhido"
  s.ret(mx + 2, my + 5, 2, 2, E.caido ? MASC[1] : BREU); s.ret(mx + 9, my + 5, 2, 2, E.caido ? MASC[1] : BREU);
  if (grita) { s.ret(mx + 4, my + 10, 5, 3, BREU); for (let k = 0; k < 3; k++) s.linha(mx + 16 + k * 5, my + 2 - k * 3, mx + 19 + k * 5, my - 1 - k * 3, 1, MASC[4]); }
  else s.ret(mx + 4, my + 11, 5, 1, MASC[0]);
}

// ---------- O Interesseiro: o mercador do amor que cobra. Corpo de bolsa, coração com etiqueta de preço, balança na mão ----------
const ROXO = R('#5A3A70'), OURO = R('#D9A63C'), PELE = R('#C9A27A'), CORA = R('#D84A6A'), PAPEL = R('#EDE3C8');
function interesseiro(s, b, Tm) {
  const E = est(b, Tm), t = E.tipo || '', corre = t === 'ganancia' || b.corre, pega = t === 'cofre' && E.ataca, joga = (t === 'moedao' || t === 'preco') && E.ataca;
  const cai = E.caido ? 6 : 0, inc = corre ? 6 : 0, cx = ox + inc, cy = oy - 34 + cai + E.resp;
  // pernas curtas e sapatos de bico
  for (const [dx, lev] of [[-9, E.anda && E.passo ? -2 : 0], [8, E.anda && !E.passo ? -2 : 0]]) { s.membro(ox + dx, cy + 14, ox + dx, oy - 4 + lev, 4, ROXO); s.ret(ox + dx - 2, oy - 4 + lev, 9, 4, R('#2A1A30')[2]); }
  // o corpo: uma bolsa de moedas com casaca roxa
  s.bola(cx, cy, 24, 21, ROXO, 0.5, -0.65);
  s.bola(cx + 3, cy + 4, 14, 13, OURO, 0.5, -0.6); for (let k = -1; k <= 1; k++) s.ret(cx - 6 + k * 6, cy - 6, 2, 22, OURO[1]); // a bolsa amarrada
  s.ret(cx - 18, cy - 20, 36, 3, OURO[2]); s.ret(cx - 18, cy - 20, 36, 1, OURO[4]); // a gola dourada
  // o coração com a etiqueta de preço (o amor à venda)
  const bate = Math.floor(Tm * 4) % 2 && !E.caido ? 1 : 0, hx = cx + 4, hy = cy - 8;
  s.bola(hx - 3, hy, 4 + bate, 4 + bate, CORA); s.bola(hx + 3, hy, 4 + bate, 4 + bate, CORA); s.poli([[hx - 7 - bate, hy + 1], [hx + 7 + bate, hy + 1], [hx, hy + 9 + bate]], CORA[2]);
  s.linha(hx + 6, hy - 2, hx + 14, hy - 8, 1, PAPEL[1]); s.ret(hx + 13, hy - 14, 9, 7, PAPEL[3]); s.ret(hx + 14, hy - 12, 2, 1, OURO[1]); s.ret(hx + 17, hy - 12, 4, 1, TINTA); s.ret(hx + 15, hy - 10, 5, 1, TINTA);
  // braços: um segura a balança, o outro estende a mão pedindo
  const pedir = E.prep || pega ? { x: cx + 34, y: cy - 14 } : joga ? { x: cx + 30, y: cy - 30 } : E.caido ? { x: cx + 22, y: oy - 6 } : { x: cx + 26, y: cy + 4 };
  const m = braco(s, cx + 18, cy - 12, pedir.x, pedir.y, 5, ROXO, PELE, 3, 1); s.bola(m.x, m.y, 4, 3, PELE);
  if (E.prep || pega) for (let k = 0; k < 3; k++) s.px(m.x + 3 + k * 2, m.y - 4 - (Math.floor(Tm * 8) + k) % 3, OURO[4]); // os dedos pedindo moedas
  const bal = braco(s, cx - 18, cy - 12, cx - 30, cy - 26 - (E.caido ? -20 : 0), 5, ROXO, PELE, -3, -1);
  const pende = Math.round(Math.sin(Tm * 3) * 3); s.linha(bal.x, bal.y, bal.x, bal.y - 6, 1, OURO[2]); s.linha(bal.x - 10, bal.y - 6 + pende, bal.x + 10, bal.y - 6 - pende, 1, OURO[3]);
  for (const sd of [-1, 1]) { const px = bal.x + sd * 10, py = bal.y - 6 - sd * pende; s.linha(px, py, px - 3, py + 6, 1, OURO[1]); s.linha(px, py, px + 3, py + 6, 1, OURO[1]); s.ret(px - 4, py + 6, 9, 2, OURO[sd < 0 ? 2 : 3]); }
  s.ret(bal.x - 6, bal.y + 1, 3, 2, OURO[4]); // uma moeda num dos pratos
  // a cabeça: máscara dourada sorridente, cartola com cifra
  const hx2 = cx - 1, hy2 = cy - 38 + (E.caido ? 6 : 0);
  s.bola(hx2, hy2, 11, 11, PELE); s.bola(hx2 + 2, hy2, 8, 9, OURO, 0.4, -0.6);
  s.ret(hx2 - 2, hy2 - 3, 3, 2, E.caido ? OURO[1] : BREU); s.ret(hx2 + 5, hy2 - 3, 3, 2, E.caido ? OURO[1] : BREU);
  for (let k = -4; k <= 5; k++) s.px(hx2 + 1 + k, hy2 + 4 + Math.round(Math.abs(k) * -0.35) + (E.caido ? 2 : 0), TINTA); // o sorriso de vendedor
  s.ret(hx2 - 10, hy2 - 12, 22, 3, R('#1E1428')[2]); s.ret(hx2 - 6, hy2 - 26, 14, 14, R('#1E1428')[2]); s.ret(hx2 - 6, hy2 - 16, 14, 2, CORA[2]); s.ret(hx2 - 5, hy2 - 26, 1, 14, R('#1E1428')[3]);
  s.ret(hx2, hy2 - 23, 2, 6, OURO[4]); s.ret(hx2 - 1, hy2 - 22, 4, 1, OURO[4]); s.ret(hx2 - 1, hy2 - 19, 4, 1, OURO[4]);
}

// ---------- A Condenação: um carcereiro enorme, de toga e capuz, enrolado em correntes, com o rol das acusações ----------
const TOGA = R('#3A2A30'), TOGAE = R('#1E1418'), FERRUG = R('#9A5A4A'), BRASA = C('#FF5A3C'), ROL = R('#D8CCA8');
function corrente(s, x0, y0, x1, y1, Tm) { const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 3)); for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n, y = y0 + (y1 - y0) * i / n; s.ret(x - 1, y - 1, 3, 3, FERRUG[(i + Math.floor(Tm * 6)) % 2 ? 2 : 3]); s.px(x, y, FERRUG[0]); } }
function condenacao(s, b, Tm) {
  const E = est(b, Tm), t = E.tipo || '', chicote = t === 'chicote' && E.ataca, ergue = (t === 'tijolos' || t === 'cangalha') && (E.prep || E.ataca), amarra = t === 'amarras';
  const cai = E.caido ? 8 : 0, cx = ox, top = oy - 92 + cai + E.resp;
  // a toga larga até o chão
  manto(s, cx, top + 24, 18, cx, oy - 2, 30, TOGA, 3);
  for (let y = top + 30; y < oy - 4; y += 4) s.px(cx, y, TOGAE[2]);
  // as correntes que cruzam o corpo, e a bola de ferro arrastada
  corrente(s, cx - 18, top + 30, cx + 18, top + 64, Tm); corrente(s, cx + 18, top + 32, cx - 20, top + 70, Tm);
  corrente(s, cx - 22, top + 70, cx - 34, oy - 6, Tm); s.bola(cx - 38, oy - 7, 6, 6, R('#3A3A44'));
  // o rol das acusações pendurado na cintura
  s.ret(cx + 6, top + 60, 10, 22, ROL[3]); s.ret(cx + 6, top + 80, 10, 3, ROL[1]); for (let y = top + 63; y < top + 79; y += 3) s.ret(cx + 8, y, 6, 1, ROL[0]);
  // braços: o direito gira o chicote de corrente; o esquerdo segura o martelo de juiz
  const mao = chicote ? { x: cx + 40, y: top + 40 } : ergue || E.prep ? { x: cx + 18, y: top + 2 } : E.caido ? { x: cx + 22, y: oy - 8 } : { x: cx + 24, y: top + 56 };
  const m = braco(s, cx + 16, top + 30, mao.x, mao.y, 6, TOGA, R('#8A6A5A'), 3, 1);
  s.bola(m.x, m.y, 4, 4, R('#8A6A5A'));
  if (chicote) corrente(s, m.x, m.y, m.x + 30, m.y + 14, Tm); else if (!E.caido) corrente(s, m.x, m.y, m.x + 6, m.y + 18 + Math.round(Math.sin(Tm * 4) * 2), Tm);
  const mz = braco(s, cx - 16, top + 30, cx - 26, top + (ergue ? 6 : 50), 6, TOGA, R('#8A6A5A'), -3, -1);
  s.ret(mz.x - 2, mz.y - 12, 3, 14, R('#5A3A2A')[2]); s.ret(mz.x - 7, mz.y - 18, 13, 7, R('#6A4A3A')[2]); s.ret(mz.x - 7, mz.y - 18, 13, 1, R('#6A4A3A')[4]); // o martelo
  // ombreiras de ferro e o capuz de carrasco com olhos em brasa
  for (const sd of [-1, 1]) s.bola(cx + sd * 16, top + 28, 8, 6, R('#5A5A64'), 0.5, -0.7);
  s.bola(cx, top + 14, 14, 16, TOGAE); s.poli([[cx - 10, top + 2], [cx + 10, top + 2], [cx + 2, top - 10]], TOGAE[2]);
  const brilho = E.caido ? FERRUG[1] : E.prep || E.pisca ? BRASA : C('#FFB070');
  s.ret(cx - 5, top + 12, 3, 2, brilho); s.ret(cx + 4, top + 12, 3, 2, brilho);
  if (amarra && !E.caido) for (let k = 0; k < 5; k++) s.px(cx - 8 + k * 4, top + 22, BRASA);
}

// ---------- A Covardia: um vulto de névoa fria que esconde o rosto nas mãos; na cabeça, a crista do galo ----------
const NEVOA = R('#7FA6C9'), NEVOAE = R('#3A4E6A'), CRISTA = R('#D83A3A'), BICO = R('#E0A83A');
function covardia(s, b, Tm) {
  const E = est(b, Tm), t = E.tipo || '', raio = t === 'relampago' && E.ataca, sopra = (t === 'rajada' || t === 'vagalhao') && E.ataca;
  const tremeX = E.caido ? 0 : Math.round(Math.sin(Tm * 30) * 1), cx = ox + tremeX, cy = oy - 54 + E.flu + (E.caido ? 14 : 0);
  // a cauda de névoa (ela flutua) e penas de galo saindo dela
  for (let k = 0; k < 7; k++) { const a = Math.sin(Tm * 3 + k), y = cy + 18 + k * 5, w = 18 - k * 2.2; s.ret(cx - w + a * 2, y, w * 2, 5, NEVOA[k < 3 ? 2 : 1]); }
  for (let k = 0; k < 4; k++) { const a = -0.9 - k * 0.35 + Math.sin(Tm * 2 + k) * 0.08; s.linha(cx - 14, cy + 22, cx - 14 + Math.cos(a) * 22, cy + 22 + Math.sin(a) * 22, 3, k % 2 ? R('#2E6A4A')[2] : R('#3A2A6A')[2]); } // a cauda do galo
  // o corpo encolhido, ombros para dentro
  s.bola(cx, cy, 20, 22, NEVOA, 0.45, -0.7); s.bola(cx - 4, cy + 4, 12, 14, NEVOAE, 0.4, -0.6);
  // as mãos no rosto (ou abertas no golpe, que ela esconde de novo logo depois)
  const hx = cx + 4, hy = cy - 24;
  s.bola(hx, hy, 12, 12, NEVOA); // a cabeça
  if (raio || sopra || E.prep) { for (const sd of [-1, 1]) { const m = braco(s, cx + sd * 14, cy - 10, cx + sd * 30, cy - 30, 4, NEVOA, NEVOA, 3, sd); s.ret(m.x - 2, m.y - 2, 5, 5, NEVOA[4]); }
    s.ret(hx - 5, hy - 2, 3, 3, BR); s.ret(hx + 3, hy - 2, 3, 3, BR); s.ret(hx - 4, hy - 1, 1, 1, BREU); s.ret(hx + 4, hy - 1, 1, 1, BREU); s.ret(hx - 2, hy + 5, 5, 3, BREU); // olhos arregalados
  } else { for (const sd of [-1, 1]) braco(s, cx + sd * 14, cy - 8, hx + sd * 4, hy + 2, 4, NEVOA, NEVOA, 2, sd); s.ret(hx - 8, hy - 4, 16, 9, NEVOA[3]); for (let k = 0; k < 4; k++) s.ret(hx - 7 + k * 4, hy - 4, 1, 9, NEVOA[1]); } // as mãos cobrindo o rosto
  // o bico que aparece entre os dedos e a crista vermelha
  s.poli([[hx + 9, hy], [hx + 16, hy + 2], [hx + 9, hy + 4]], BICO[2]);
  for (let k = 0; k < 4; k++) s.bola(hx - 6 + k * 4, hy - 13 - (k % 2) * 2, 2.5, 3.5, CRISTA);
  s.bola(hx + 9, hy + 7, 2, 3, CRISTA);
  if (!E.caido && E.pisca) for (let k = 0; k < 3; k++) s.px(cx - 24 + k * 3, cy - 4 + k * 6, NEVOA[4]); // tremendo de frio
  if (raio) for (let k = 0; k < 5; k++) s.px(cx + 30 + k * 3, cy - 30 - (k % 2) * 4, C('#E8F4FF'));
}

// ---------- O Fracasso: o acusador de asas abertas, chifres partidos, o troféu quebrado e o rolo onde escreve "INCAPAZ" ----------
const CARNE = R('#5A1A2A'), CAPA = R('#2A0E18'), ASAS = R('#3A1424'), FOGO = R('#FF6A2A'), TROF = R('#B8A060');
function fracasso(s, b, Tm) {
  const E = est(b, Tm), t = E.tipo || '', acusa = t === 'acusacao', leao = t === 'leao' && (E.ataca || b.corre), dardos = t === 'dardos' && (E.prep || E.ataca);
  const cy = oy - 50 + E.flu + (E.caido ? 14 : 0), cx = ox + (leao ? 6 : 0);
  // as asas
  const abre = E.caido ? 0.1 : leao ? 0.2 : E.prep || dardos ? 1 : 0.55 + Math.sin(Tm * 4) * 0.18;
  for (const sd of [-1, 1]) asa(s, cx + sd * 10, cy - 18, sd, 46, abre, ASAS, 5);
  // a capa e o corpo
  manto(s, cx, cy - 14, 14, cx - (leao ? 6 : 0), oy - 2 - (E.caido ? 0 : 6), 22, CAPA, 3);
  s.bola(cx, cy - 6, 15, 18, CARNE, 0.5, -0.7);
  for (let k = 0; k < 3; k++) s.linha(cx - 8 + k * 2, cy - 14 + k * 6, cx + 6 - k * 2, cy - 12 + k * 6, 1, CARNE[1]); // costelas
  // o braço do rolo: ele escreve "INCAPAZ" (na acusação, desenrola o rolo)
  const ma = braco(s, cx - 13, cy - 16, cx - (acusa ? 30 : 22), cy + (acusa ? -24 : 4), 5, CARNE, CARNE, -3, -1);
  const comp = acusa && !E.prep ? 30 : 12; s.ret(ma.x - 4, ma.y - 2, 8, comp, R('#D8CCA8')[3]); s.ret(ma.x - 5, ma.y - 3, 10, 3, R('#B8A888')[2]); s.ret(ma.x - 5, ma.y + comp - 1, 10, 3, R('#B8A888')[2]);
  if (comp > 20) for (let k = 0; k < 6; k++) s.ret(ma.x - 2, ma.y + 3 + k * 4, 4 + (k % 2), 1, C('#8A1A1A'));
  // o outro braço: o troféu quebrado (a vitória que ele diz que você não terá) ou a mão que lança dardos
  const mb = braco(s, cx + 13, cy - 16, cx + (dardos ? 32 : 24), cy + (dardos ? -26 : 2), 5, CARNE, CARNE, 3, 1);
  if (dardos) { fiapos(s, mb.x - 4, mb.x + 4, mb.y, 8, Tm, FOGO, 2); s.bola(mb.x, mb.y, 4, 4, FOGO); }
  else { s.ret(mb.x - 1, mb.y - 2, 3, 6, TROF[1]); s.poli([[mb.x - 6, mb.y - 12], [mb.x + 6, mb.y - 12], [mb.x + 3, mb.y - 3], [mb.x - 3, mb.y - 3]], TROF[3]); s.ret(mb.x - 1, mb.y - 13, 3, 4, BREU); s.ret(mb.x - 3, mb.y + 4, 7, 2, TROF[2]); } // a taça rachada
  // a cabeça: chifres partidos, olhos em brasa, sorriso torto
  const hx = cx + 1, hy = cy - 34;
  s.bola(hx, hy, 11, 12, CARNE);
  for (const sd of [-1, 1]) { s.linha(hx + sd * 7, hy - 8, hx + sd * 14, hy - 18, 3, R('#3A2A20')[2]); if (sd > 0) s.linha(hx + 14, hy - 18, hx + 16, hy - 24, 2, R('#3A2A20')[3]); } // um chifre inteiro, o outro quebrado
  const olho = E.caido ? CARNE[1] : E.prep ? C('#FFF1A8') : FOGO[3];
  s.ret(hx - 6, hy - 2, 4, 2, olho); s.ret(hx + 3, hy - 2, 4, 2, olho);
  for (let k = -4; k <= 5; k++) s.px(hx + k, hy + 6 - (k > 0 ? 1 : 0) + (E.caido ? 1 : 0), BREU);
  if (!E.caido) s.px(hx + 3, hy + 7, BR);
  if (b.hp < b.max * 0.33 && !E.caido) fiapos(s, hx - 6, hx + 6, hy - 10, 6, Tm, FOGO, 3); // na última fase, a cabeça arde
}

export const CHEFES_G = { rejeicao, interesseiro, condenacao, covardia, fracasso };
