// O tempo nas cidades e no campo (Refúgio, sítio, Sardes, a clareira, o vale): cada quarto do dia tem o seu,
// sorteado pelo dia (todos na mesma região veem o mesmo). Sol na maior parte; às vezes nublado, garoa, chuva,
// e de vez em quando tempestade. A chuva é para ser bonita: duas camadas de gotas, respingos no chão, poças que
// tremem e refletem, uma névoa baixa, o barulho manso, uma música mais lenta; quando passa, de dia, o arco-íris.
// Em algumas noites limpas, chuva de meteoros (e, bem no meio da galáxia, quem olha com calma vê dois olhos).
// No Natal, neve: o chão e os telhados ficam brancos e a aldeia se enfeita.
import { sfx, music, somDaChuva } from '../audio.js';
import { DIA } from './moradores.js';
import { T, CW, tileEm, SOLIDO, PONTE } from './nivel.js';

const h = n => { let x = Math.imul((n | 0) ^ 0x9E3779B9, 0x85EBCA6B); x ^= x >>> 13; x = Math.imul(x, 0xC2B2AE35); x ^= x >>> 16; return (x >>> 0) / 4294967296; };
export const quarto = G => Math.floor((G.cm.relogio || 0) / (DIA / 4));
const noiteN = G => Math.floor(((G.cm.relogio || 0) + DIA * 0.3) / DIA); // a noite conta a partir do fim da tarde
export const aoArLivre = G => { const d = G.def || {}; return !!(d.aberto && !d.interior && !d.treino && d.id !== 'getsemani'); };
const regiao = G => G.area === 'sardes' ? 977 : 3; // do outro lado do mar, o céu é outro

// o Natal: de 18 de dezembro a 6 de janeiro (ou quando o jogo pede, para testar)
export function ehNatal(G) { if (G?.cm?.natalForcado) return true; const d = new Date(), m = d.getMonth() + 1, dd = d.getDate(); return (m === 12 && dd >= 18) || (m === 1 && dd <= 6); }

export function tempoAgora(G) {
  if (G.cm.tempoForcado) return G.cm.tempoForcado;
  const r = h(quarto(G) * 7 + regiao(G));
  if (ehNatal(G)) return r < 0.62 ? 'neve' : r < 0.8 ? 'nublado' : 'sol';
  return r < 0.5 ? 'sol' : r < 0.66 ? 'nublado' : r < 0.76 ? 'garoa' : r < 0.9 ? 'chuva' : 'tempestade';
}
export const chovendo = G => ['garoa', 'chuva', 'tempestade'].includes(tempoAgora(G));
export const ehTempestade = G => tempoAgora(G) === 'tempestade';
// a chuva de meteoros: algumas noites limpas por mês
export const noiteDeMeteoros = G => G.cm.meteorosForcado || (!chovendo(G) && !ehNatal(G) && h(noiteN(G) * 31 + 5) < 0.18);

/* ---------------- a cada quadro ---------------- */
export function passoTempo(G, dt) {
  const fora = aoArLivre(G), t = fora ? tempoAgora(G) : 'sol';
  const alvo = !fora ? 0 : { sol: 0, nublado: 0.12, garoa: 0.32, chuva: 0.7, tempestade: 1, neve: 0 }[t] + (G.levi ? 0.3 : 0);
  G.chuvaK = (G.chuvaK || 0) + (alvo - (G.chuvaK || 0)) * Math.min(1, dt * 0.5);
  G.neveK = (G.neveK || 0) + ((fora && t === 'neve' ? 1 : 0) - (G.neveK || 0)) * Math.min(1, dt * 0.5);
  if (!fora) { G.chuvaK = 0; G.neveK = 0; G.raioT = 0; } // debaixo de um teto não chove (nem neva)
  somDaChuva(G.chuvaK > 0.05 ? G.chuvaK : 0);
  // a música fica mais mansa enquanto chove (no Refúgio, no sítio e em Sardes)
  const mansa = G.chuvaK > 0.45 && !G.levi && !G.luta && !G.cenaPraia && G.def?.paz;
  if (mansa && !G.musicaChuva) { G.musicaChuva = true; music('mundo', 'chuva'); }
  else if (!mansa && G.musicaChuva && G.chuvaK < 0.3) { G.musicaChuva = false; if (!G.levi && !G.cenaPraia) G.musicaDaArea?.(); }
  // o arco-íris: a chuva passou e é de dia
  const L = G.luzDoDiaAgora; if (G.choveuK == null) G.choveuK = 0;
  if (G.chuvaK > 0.4) G.choveuK = 1; else if (G.choveuK === 1 && G.chuvaK < 0.12) { G.choveuK = 0; if (fora && (G.luzDoDiaD ?? 1) > 0.35) { G.arcoT = 70; G.aliancaT = 2.5; } }
  if (G.arcoT > 0) G.arcoT -= dt;
  if (G.aliancaT > 0 && (G.aliancaT -= dt) <= 0) { if (G.arcoT > 8 && !G.ui.blocking && !G.luta && !G.levi && !G.cenaPraia && !G.p.morto) momentoDaAlianca(G); else if (G.arcoT > 8) G.aliancaT = 1; }
  if (G.raioT > 0) G.raioT -= dt;
  if (fora && t === 'tempestade') { G.trovaoT = (G.trovaoT ?? 4) - dt;
    if (G.trovaoT <= 0) { G.trovaoT = (G.levi ? 3 : 7) + Math.random() * 8; G.raioT = 0.35; G.raioX = Math.random(); G.clarao = Math.max(G.clarao || 0, 0.22); setTimeout(() => sfx('trovao'), 200 + Math.random() * 700); } }
  // os meteoros: avisa uma vez por noite
  const nn = noiteN(G); if (fora && noiteDeMeteoros(G) && G.ceuEscuro && G.cm.meteorosAviso !== nn) { G.cm.meteorosAviso = nn; G.ui.toast('☄ Chuva de meteoros esta noite. Olhe para o céu… com calma.', 6500); }
  void L;
}

/* ---------------- o arco-íris: lembrar a aliança ---------------- */
// "Porei o meu arco nas nuvens; ele será por sinal da aliança entre mim e a terra" (Gn 9:13). Na primeira vez, o peregrino
// para e lembra (uma cena curta); depois, cada arco-íris traz um versículo diferente e um pouco de luz para a lâmpada.
const ALIANCA = [
  ['"O arco estará nas nuvens; e eu o verei, para me lembrar da aliança eterna" (Gn 9:16).', 'Ele vê o arco também. E lembra.'],
  ['"As águas não se tornarão mais em dilúvio para destruir toda a carne" (Gn 9:15).', 'A chuva passou. A promessa ficou.'],
  ['"Como o aspecto do arco que aparece na nuvem em dia de chuva, assim era o resplendor ao redor" (Ez 1:28).', 'Ezequiel viu a glória com as cores da chuva.'],
  ['"Ao redor do trono há um arco-íris semelhante, na aparência, à esmeralda" (Ap 4:3).', 'O mesmo arco está em volta do trono.'],
  ['"Enquanto durar a terra, não deixará de haver sementeira e ceifa, frio e calor, verão e inverno, dia e noite" (Gn 8:22).', 'Tudo segue o seu tempo. Você também.']
];
async function momentoDaAlianca(G) {
  const cm = G.cm, p = G.p, luz = () => { p.oleo = G.oleoMax(); p.vida = p.vidaMax; sfx('heal'); G.fx.anel(p.x, p.y - 26, '#FFE9A8', 90); for (const c of ['#E24A4A', '#F2944A', '#F2D24A', '#6ACB5A', '#4A9AE2', '#9A5AC2']) G.fx.sobe(p.x, p.y - 10, 3, c); };
  if (!cm.alianca) {
    await G.ui.dialog({ nome: 'Depois da chuva', texto: 'As nuvens se abrem e, de um lado ao outro do céu, aparece o arco. Você para no meio do caminho.\n\nFoi assim, depois do dilúvio, que Deus falou com Noé e com os filhos dele, e com cada bicho que saiu da arca.', acoes: [{ label: 'Continuar' }], cls: 'fala-narra', voz: false });
    const r = await G.ui.dialog({ nome: 'A aliança', texto: '"Porei o meu arco nas nuvens, e ele será por sinal da aliança entre mim e a terra. E acontecerá que, quando eu trouxer nuvens sobre a terra, aparecerá o arco nas nuvens. Então me lembrarei da minha aliança" (Gn 9:13-15).\n\nNão é você quem precisa lembrar Deus. É Ele quem diz: eu vou lembrar.', acoes: [{ label: 'Lembrar a aliança' }, { label: 'Ficar olhando o arco' }], cls: 'fala-narra', voz: false });
    cm.alianca = 1; luz(); G.textoEm(p.x, p.y - 96, r === 'Lembrar a aliança' ? '"Eu me lembrarei" (Gn 9:15)' : 'o arco continua lá', '#FFE9A8', 13);
    G.ovo?.('arco', 'O arco nas nuvens: a aliança lembrada (Gn 9:13).'); G.salvar(); return;
  }
  const [vers, eco] = ALIANCA[(cm.alianca - 1) % ALIANCA.length]; cm.alianca++;
  p.oleo = Math.min(G.oleoMax(), p.oleo + 30); sfx('magic'); G.fx.anel(p.x, p.y - 26, '#FFE9A8', 70);
  G.textos.push({ x: p.x, y: p.y - 150, txt: '🌈 ' + vers, cor: '#FFF1D6', tam: 12, t: 7 }); G.textos.push({ x: p.x, y: p.y - 128, txt: eco, cor: '#C9D8EC', tam: 11, t: 7 });
  G.salvar();
}

/* ---------------- o céu (no fundo, atrás de tudo) ---------------- */
// chamada pelo desenho do céu (mundo.js), com a escuridão da noite (0 de dia, 1 noite fechada)
export function pintarCeuDoTempo(g, G, vw, dy, cx, noite) {
  G.ceuEscuro = noite > 0.6; G.luzDoDiaD = 1 - noite;
  const k = G.chuvaK || 0; if (k > 0.05) { g.globalAlpha = Math.min(0.55, k * 0.5); g.fillStyle = '#5A6474'; g.fillRect(0, dy, vw, 400); g.globalAlpha = 1; } // céu fechado
  if (G.arcoT > 0 && noite < 0.4) { const a = Math.min(1, G.arcoT / 8, (70 - G.arcoT) / 4) * 0.33 * (1 - noite), cxA = Math.round(vw * 0.62 - cx * 0.03), cyA = dy + 230, R = 190;
    const cores = ['#E24A4A', '#F2944A', '#F2D24A', '#6ACB5A', '#4A9AE2', '#6A5AD2', '#9A5AC2'];
    for (let i = 0; i < cores.length; i++) { g.strokeStyle = cores[i]; g.globalAlpha = a; g.lineWidth = 3; g.beginPath(); g.arc(cxA, cyA, R - i * 3, Math.PI * 1.08, Math.PI * 1.92); g.stroke(); } g.globalAlpha = 1; }
  if (noite > 0.3 && aoArLivre(G) && noiteDeMeteoros(G)) pintarMeteoros(g, G, vw, dy, cx, (noite - 0.3) / 0.7);
  if (G.neveK > 0.05 || (ehNatal(G) && aoArLivre(G))) { // no Natal, a estrela de Belém, grande e quieta, sobre a aldeia
    const sx = Math.round(vw * 0.8 - cx * 0.01), sy = dy + 34, b = 0.6 + 0.4 * Math.sin(G.T * 1.2), a = 0.35 + noite * 0.65;
    g.globalAlpha = a * 0.25; g.fillStyle = '#FFF2C0'; g.beginPath(); g.arc(sx, sy, 9 + b * 2, 0, 6.29); g.fill(); g.globalAlpha = a; g.fillStyle = '#FFF8E0';
    g.fillRect(sx - 1, sy - 9, 2, 18); g.fillRect(sx - 7, sy - 1, 14, 2); g.fillRect(sx - 3, sy - 3, 6, 6); g.fillRect(sx, sy + 9, 1, 8); g.globalAlpha = 1; }
}
// a galáxia, as estrelas cadentes e, escondidos nela, dois olhos que piscam devagar (quase ninguém vai ver)
function pintarMeteoros(g, G, vw, dy, cx, k) {
  const Tm = G.T, par = cx * 0.015;
  // a faixa da galáxia: poeira e estrelas miúdas numa diagonal
  for (let i = 0; i < 900; i++) { const u = h(i * 3 + 1), v = h(i * 7 + 2), x = Math.round(((u * vw * 1.3 - par) % vw + vw) % vw), base = dy + 20 + (x / vw) * 70, y = Math.round(base + (v - 0.5) * (30 + 26 * Math.sin(x * 0.02)));
    g.globalAlpha = k * (0.08 + h(i) * 0.22) * (0.8 + 0.2 * Math.sin(Tm * 2 + i)); g.fillStyle = i % 9 ? '#C9D4F2' : '#F2D8E8'; g.fillRect(x, y, 1, 1); }
  // os olhos: no meio da galáxia, duas amêndoas de estrelas, quase da cor do céu; piscam a cada tanto
  { const ex = Math.round(vw * 0.5 - par), ey = Math.round(dy + 20 + 0.5 * 70), pisca = (Tm % 47) > 46.6 ? 0.2 : 1, a = k * 0.13;
    for (const lado of [-1, 1]) { const ox = ex + lado * 15;
      for (let i = -9; i <= 9; i++) { const al = Math.round(Math.sqrt(Math.max(0, 1 - (i / 9) ** 2)) * 4 * pisca); g.globalAlpha = a; g.fillStyle = '#E8EEFF'; g.fillRect(ox + i, ey - al, 1, 1); g.fillRect(ox + i, ey + al, 1, 1); }
      g.globalAlpha = a * 1.8 * pisca; g.fillStyle = '#FFF4D6'; g.fillRect(ox - 1, ey - 1, 3, 3); g.globalAlpha = a * 0.6 * pisca; g.fillRect(ox - 3, ey - 2, 7, 5); } }
  // as estrelas cadentes: um risco que corre na diagonal e some
  for (let i = 0; i < 4; i++) { const P = 1.3 + i * 0.55, c = Math.floor((Tm + i * 0.77) / P), u = ((Tm + i * 0.77) % P) / 0.7; if (u > 1) continue;
    const x0 = h(c * 13 + i) * vw * 1.2 - 40, y0 = dy + 8 + h(c * 5 + i) * 70, L = 24 + h(c) * 30, x = x0 + u * 90, y = y0 + u * 40;
    for (let j = 0; j < L; j++) { g.globalAlpha = k * (1 - j / L) * (1 - u * 0.6); g.fillStyle = j < 3 ? '#FFFFFF' : '#BFD4FF'; g.fillRect(Math.round(x - j * 0.9), Math.round(y - j * 0.4), 1, 1); } }
  g.globalAlpha = 1;
}

/* ---------------- o chão (logo depois dos blocos): neve, poças ---------------- */
export function pintarChaoDoTempo(g, G, vw, vh, cx, cy, Tm) {
  if (!aoArLivre(G)) return;
  const N = G.N, TL = 16, tx0 = Math.max(0, Math.floor(cx / TL)), tx1 = Math.min(N.w - 1, Math.ceil((cx + vw) / TL)), ty0 = Math.max(1, Math.floor(cy / TL)), ty1 = Math.min(N.h - 1, Math.ceil((cy + vh) / TL));
  const nk = G.neveK > 0.05 ? Math.min(1, G.neveK * 1.3) : ehNatal(G) ? 0.8 : 0;
  if (nk > 0) { // a neve que assentou: em cima de cada bloco que tem ar por cima
    for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) { const t = tileEm(N, tx, ty), cima = tileEm(N, tx, ty - 1); if ((t !== SOLIDO && t !== PONTE) || cima === SOLIDO || cima === PONTE) continue;
      const x = tx * TL - cx, y = ty * TL - cy, r = h(tx * 31 + ty); g.globalAlpha = nk; g.fillStyle = '#F4F8FF'; g.fillRect(x, y - 2, TL, 3); g.fillStyle = '#DCE6F4'; g.fillRect(x, y + 1, TL, 1);
      if (r > 0.5) { g.fillStyle = '#F4F8FF'; g.fillRect(x + Math.round(r * 10), y - 3, 4, 1); } if (t === SOLIDO && r > 0.8) { g.fillStyle = '#F4F8FF'; g.fillRect(x + 3, y + 2, 1, 2); } }
    g.globalAlpha = 1; }
  if (ehNatal(G)) { // os varais de luzes do Natal, de um poste ao outro, piscando em cores
    for (const l of N.luzes) { if (!l.poste) continue; const x0 = Math.round(l.x / 2 - cx), y0 = Math.round(l.y / 2 - cy) + 2, x1 = x0 + 15 * TL; if (x1 < 0 || x0 > vw) continue;
      for (let i = 0; i <= 60; i++) { const u = i / 60, x = Math.round(x0 + (x1 - x0) * u), y = Math.round(y0 + Math.sin(u * Math.PI) * 14); g.fillStyle = '#2A3A2A'; g.fillRect(x, y, 1, 1);
        if (i % 4 === 2) { const c = ['#FF4A4A', '#FFD84A', '#4AE27A', '#4AA8FF', '#FF8AE2'][(i / 4 | 0) % 5], on = (Math.floor(Tm * 2) + i) % 3 !== 0; g.fillStyle = on ? c : '#3A3440'; g.fillRect(x, y + 1, 2, 2); if (on) { g.globalAlpha = 0.25; g.fillRect(x - 1, y, 4, 4); g.globalAlpha = 1; } } } } }
  const k = G.chuvaK || 0; if (k < 0.2) return;
  // as poças: no chão de cada sala, umas manchas que refletem o céu e tremem com as gotas
  const chao = 16;
  for (let tx = tx0; tx <= tx1; tx++) { if (h(tx * 17 + 3) > 0.16) continue; if (tileEm(N, tx, chao) !== SOLIDO || tileEm(N, tx, chao - 1) === SOLIDO) continue;
    const x = tx * TL - cx + 2, y = chao * TL - cy, w = 10 + Math.round(h(tx) * 14); g.globalAlpha = Math.min(1, (k - 0.2) * 1.6) * 0.7; g.fillStyle = '#5A6A84'; g.fillRect(x, y, w, 2); g.fillStyle = '#9AB0CC'; g.fillRect(x + 1, y, w - 2, 1);
    for (let i = 0; i < 2; i++) { const P = 0.9 + i * 0.4, u = ((Tm + tx * 0.37 + i * 0.5) % P) / P, rr = Math.round(u * 5); g.globalAlpha = (1 - u) * 0.8 * k; g.fillStyle = '#E8F0FF'; const ox = x + Math.round(h(tx + i * 9 + Math.floor((Tm + tx * 0.37) / P)) * w); g.fillRect(ox - rr, y, 1, 1); g.fillRect(ox + rr, y, 1, 1); } }
  g.globalAlpha = 1;
}

/* ---------------- por cima de tudo: gotas, neve caindo, névoa, raio ---------------- */
export function pintarTempo(g, G, vw, vh, cx, Tm, cy = 0) {
  if (!aoArLivre(G)) return;
  const k = G.chuvaK || 0, nk = G.neveK || 0;
  if (k > 0.02) {
    g.fillStyle = '#1A2230'; g.globalAlpha = Math.min(0.32, k * 0.28); g.fillRect(0, 0, vw, vh); // o dia fica cinza-azulado, de lembrança
    // as gotas de longe: finas, lentas, claras
    const nl = Math.round(40 + k * 120); g.fillStyle = '#C9D8EC';
    for (let i = 0; i < nl; i++) { const r = h(i * 3 + 1), r2 = h(i * 5 + 2), vel = 160 + r * 60, x = ((r * vw * 1.4 - Tm * vel * 0.18 - cx * 0.3) % vw + vw) % vw, y = (r2 * vh + Tm * vel) % vh; g.globalAlpha = 0.18 + r2 * 0.15; g.fillRect(Math.round(x), Math.round(y), 1, 2); }
    // as gotas de perto: riscos mais longos, um pouco inclinados
    const np = Math.round(k * 110); g.fillStyle = '#E4EEFA';
    for (let i = 0; i < np; i++) { const r = h(i * 11 + 7), r2 = h(i * 13 + 5), vel = 380 + r * 140, x = ((r * vw * 1.4 - Tm * vel * 0.3 - cx * 0.9) % vw + vw) % vw, y = (r2 * vh + Tm * vel) % vh;
      g.globalAlpha = 0.3 + r2 * 0.35; for (let j = 0; j < 6; j++) g.fillRect(Math.round(x - j * 0.35), Math.round(y + j), 1, 1); }
    // os respingos no chão: coroinhas que abrem e somem
    const chao = 16 * 16 - cy; g.fillStyle = '#E8F0FF';
    for (let i = 0; i < Math.round(k * 26); i++) { const P = 0.35 + h(i) * 0.3, c = Math.floor((Tm + i * 0.13) / P), u = ((Tm + i * 0.13) % P) / P, x = Math.round(h(c * 7 + i) * vw); g.globalAlpha = (1 - u) * 0.8;
      g.fillRect(x - Math.round(u * 3), chao - 1 - Math.round(Math.sin(u * 3.1) * 3), 1, 1); g.fillRect(x + Math.round(u * 3), chao - 1 - Math.round(Math.sin(u * 3.1) * 3), 1, 1); if (u < 0.3) g.fillRect(x, chao - 2, 1, 1); }
    // a névoa baixa, rente ao chão
    const gr = g.createLinearGradient(0, chao - 40, 0, chao + 6); gr.addColorStop(0, 'rgba(200,214,230,0)'); gr.addColorStop(1, 'rgba(200,214,230,' + (0.16 * k).toFixed(3) + ')'); g.globalAlpha = 1; g.fillStyle = gr; g.fillRect(0, chao - 40, vw, 46);
    g.globalAlpha = 1; }
  if (nk > 0.02) { // a neve caindo: flocos grandes e pequenos, que balançam
    for (let i = 0; i < Math.round(nk * 170); i++) { const r = h(i * 3 + 9), r2 = h(i * 7 + 4), perto = i % 4 === 0, vel = perto ? 34 + r * 20 : 16 + r * 12, x = ((r * vw * 1.3 + Math.sin(Tm * (0.6 + r) + i) * 8 - cx * (perto ? 0.8 : 0.3)) % vw + vw) % vw, y = (r2 * vh + Tm * vel) % vh;
      g.globalAlpha = (perto ? 0.9 : 0.55) * nk; g.fillStyle = '#FFFFFF'; g.fillRect(Math.round(x), Math.round(y), perto ? 2 : 1, perto ? 2 : 1); }
    g.globalAlpha = nk * 0.08; g.fillStyle = '#DCE8FF'; g.fillRect(0, 0, vw, vh); g.globalAlpha = 1; }
  if (G.raioT > 0) { const a = G.raioT / 0.35; g.fillStyle = '#E8F0FF'; g.globalAlpha = a * 0.35; g.fillRect(0, 0, vw, vh); g.globalAlpha = a;
    let x = Math.round(G.raioX * vw), y = 0; g.fillStyle = '#FFFFFF'; while (y < vh * 0.62) { const nx = x + Math.round((h(y * 13 + Math.floor(G.raioX * 999)) - 0.5) * 14); for (let j = 0; j < 6; j++) g.fillRect(Math.round(x + (nx - x) * j / 6), y + j, 2, 1); x = nx; y += 6; }
    g.globalAlpha = 1; }
}
