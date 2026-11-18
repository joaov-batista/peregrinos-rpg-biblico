// A pesca de verdade, no próprio mar: depois do Porto, a margem e o mar aberto. Da pedra da margem ou de dentro do bote.
// Segurar o golpe dá força ao lance; soltar lança a linha e a boia cai na água. As sombras dos peixes rondam a boia;
// quando ela afunda ("!"), golpeie na hora para fisgar. Na briga, segurar recolhe e estica a linha; quando o peixe
// dispara, solte, ou ela arrebenta. Longe da margem é mais fundo: lá andam os grandes e os raros.
import { sfx } from '../audio.js';
import { PEIXES, desenhaPeixe } from './pesca.js';
import { DONS } from './dados.js';
import { periodo } from './moradores.js';
import { T } from './nivel.js';
import { leviataMorde } from './marbravo.js';

const rand = (a, b) => a + Math.random() * (b - a), ISCA = 3;
// as varas (aguentam mais tensão e recolhem mais rápido) e as iscas (cada uma chama um tipo de peixe)
export const VARAS = {
  cedro: { nome: 'Vara de cedro', preco: 0, tol: 1, puxa: 1, desc: 'A que Zebedeu empresta. Serve para o raso.' },
  junco: { nome: 'Vara de junco trançado', preco: 300, tol: 1.25, puxa: 1.15, desc: 'Verga sem quebrar: aguenta um quarto a mais de tensão.' },
  oliveira: { nome: 'Vara de oliveira velha', preco: 900, tol: 1.5, puxa: 1.3, desc: 'Dura e leve. Aguenta metade a mais e recolhe mais rápido.' },
  genesare: { nome: 'Vara de Genesaré', preco: 2200, tol: 1.85, puxa: 1.5, desc: 'A melhor do porto. "Lançai a rede para a banda direita" (Jo 21:6). Para os monstros do fundo.' }
};
export const ISCAS = {
  minhoca: { nome: 'Minhoca', pacote: 0, preco: ISCA, desc: 'A de sempre (3 denários por lance).' },
  pao: { nome: 'Miolo de pão', pacote: 5, preco: 25, morde: 0.55, desc: 'Os peixes mordem bem mais depressa.' },
  lula: { nome: 'Pedaço de lula', pacote: 5, preco: 60, grandes: 2.4, desc: 'Chama os grandes e os monstros do fundo.' },
  luz: { nome: 'Isca de luz', pacote: 3, preco: 110, raros: 3, desc: 'Brilha no fundo: chama o peixe de luz, o de fogo, o da moeda e, de noite, a serpente do mar.' }
};
const RAROS = ['dom', 'lingua', 'moeda', 'serpente'];
const vara = G => VARAS[G.cm.vara === 1 ? 'cedro' : G.cm.vara] || VARAS.cedro;
const agua = G => G.objs.find(o => o.tipo === 'aguaAberta');
const bote = G => G.objs.find(o => o.tipo === 'bote');
const fundura = (A, x) => { const k = Math.max(0, Math.min(1, (x - A.x0) / (A.x1 - A.x0))); return A.esq ? 1 - k : k; }; // longe da beira é mais fundo (a beira da praia fica à direita da água)

// qual peixe morde, conforme a fundura (0 raso, 1 fundo) e a hora
function sortear(G, d) {
  const faixa = d < 0.34 ? 0 : d < 0.67 ? 1 : 2, cedo = periodo(G) === 'manha', noite = periodo(G) === 'noite', I = ISCAS[G.pesca?.isca] || ISCAS.minhoca, lista = Object.entries(PEIXES).filter(([, P]) => P.faixa[0] <= faixa && faixa <= P.faixa[1] && (!P.noite || noite));
  const peso = (k, P) => P.peso * (cedo && (k === 'tilapia' || k === 'bagre' || k === 'dourado') ? 1.8 : 1) * (G.p.noBote && faixa === 2 ? 1.3 : 1) * (I.grandes && (P.monstro || P.forca >= 1.8) ? I.grandes : 1) * (I.raros && RAROS.includes(k) ? I.raros : 1);
  let r = Math.random() * lista.reduce((s, [k, P]) => s + peso(k, P), 0); for (const [k, P] of lista) if ((r -= peso(k, P)) <= 0) return k; return 'sardinha';
}
// o prêmio de cada peixe (o mesmo de sempre: denários, a bolsa, os dons do peixe de luz, a língua de fogo, o 153)
function premiar(G, id, seq) {
  const cm = G.cm, c = G.char, P = PEIXES[id], ds = cm.dons = cm.dons || {}, ps = cm.pescados = cm.pescados || {};
  if (P.lixo) { ps[id] = (ps[id] || 0) + 1; return ['Uma sandália velha. Alguém deixou tudo e seguiu a pé (Mt 4:20).', false]; }
  if (id === 'lingua') { ds.lingua = 1; sfx('level'); return ['Na boca do peixe, uma LÍNGUA DE FOGO (At 2:3).', true]; }
  if (id === 'dom') { const falta = ['tornado', 'raios', 'enchente', 'vento', 'vento'].filter(k => (ds[k] || 0) < (DONS[k].partes || 1));
    if (falta.length) { const k = falta[Math.floor(Math.random() * falta.length)]; ds[k] = (ds[k] || 0) + 1; if (!cm.dom && G.temDom(k)) cm.dom = k; sfx('level'); return ['O peixe de luz trouxe um DOM: ' + DONS[k].nome + '!', true]; }
    c.data.gold += 150; return ['Peixe de luz: +150 denários.', true]; }
  const v = Math.round(rand(P.v[0], P.v[1]) * (1 + Math.min(1, (seq - 1) * 0.25))); c.data.gold += v; ps[id] = (ps[id] || 0) + 1; sfx('coin');
  if (id === 'moeda') return ['Uma moeda na boca do peixe! (Mt 17:27) +' + v, true];
  if (P.monstro) { cm.monstros = (cm.monstros || 0) + 1; if (Math.random() < (id === 'serpente' ? 0.8 : id === 'tubarao' ? 0.45 : 0.2)) setTimeout(() => G.achado({ comum: 30, rara: 50, epica: 20 }, false, true), 900); return [P.nome + '! Um monstro do mar · +' + v + ' denários', true]; }
  cm.peixes = (cm.peixes || 0) + 1; cm.bolsa = cm.bolsa || {}; cm.bolsa.peixe = (cm.bolsa.peixe || 0) + 1; if (cm.peixes === 153) G.ovo('rede', 'Cento e cinquenta e três grandes peixes, e a rede não se rompeu (Jo 21:11).');
  return [P.nome + ' · +' + v + ' denários' + (seq > 1 ? ' · ' + seq + ' seguidos' : ''), true];
}

/* ---------------- a cada quadro, no Refúgio ---------------- */
export function passoPescaViva(G, dt) {
  const A = agua(G), p = G.p, c = G.ctl || {}, S = G.pesca = G.pesca || { est: 'livre', seq: 0, sombras: [] };
  if (!A) { G.naAgua = false; G.pescaTrava = false; return; }
  A.x0 = A.x0 ?? A.x - 16; A.x1 = A.x1 ?? A.x - 16 + (A.ate - A.col + 1) * T; if (A.pierCols && !A.pier) A.pier = [A.x0 - 10, A.x0 + A.pierCols * T]; // o píer: anda-se por cima
  // a água não se anda: fora do bote, para na margem; no bote, fica no mar
  // a água se nada: entrando nela, o peregrino nada (mais devagar, pulinho curto) e pode pescar dali mesmo; no bote, rema
  const beira = A.esq ? A.x1 : A.x0, mar = A.esq ? -1 : 1, dentro = x => (x - beira) * mar > 10, noPier = A.pier && p.x > A.pier[0] && p.x < A.pier[1];
  if (p.noBote) { p.x = Math.max(A.x0 + 30, Math.min(A.x1 - 30, p.x)); if (p.vy < 0) p.vy = 0; }
  else if (!G.nado && dentro(p.x)) p.x = Math.max(A.x0 + 12, Math.min(A.x1 - 12, p.x)); // nadando, até onde o mar do mapa vai
  const nada = !p.noBote && !G.nado && !noPier && dentro(p.x) && p.y >= A.y - 40;
  if (nada && !p.nada) { sfx('splash'); for (let i = 0; i < 10; i++) G.parts.push({ x: p.x + rand(-12, 12), y: A.y - 4, vx: rand(-80, 80), vy: rand(-220, -80), t: 0.5, max: 0.5, r: 1.5, cor: '#DFF6FA', g: 700 }); }
  p.nada = nada; if (nada) { p.pulos = 0; if (p.vy < -420) p.vy = -420; }
  const naBeira = !p.noBote && !nada && (beira - p.x) * mar > -5 && (beira - p.x) * mar < 90 && p.face === mar;
  G.naAgua = (naBeira || p.noBote || nada || noPier) && !!G.cm.vara && !G.nado; if (G.cm.vara === 1) G.cm.vara = 'cedro';
  if (p.noBote && c.interagir && Math.abs(p.x - beira) < 80) { p.noBote = false; p.x = beira - mar * 20; S.est = 'livre'; G.textoEm(p.x, p.y - 70, 'de volta à margem', '#C9D2E0', 11); }
  // as sombras dos peixes: andam debaixo d'água, mais e maiores longe da margem
  while (S.sombras.length < 5) { const x = rand(A.x0 + 20, A.x1 - 20), d = fundura(A, x); S.sombras.push({ x, y: p.y + 8 + d * 14, vx: rand(-20, 20), t: rand(0, 4), tam: 4 + d * 8 + rand(0, 3) }); }
  for (const s of S.sombras) { s.t -= dt; if (s.t <= 0) { s.vx = rand(-24, 24); s.t = rand(1.5, 4); } if (!s.alvo) s.x = Math.max(A.x0 + 10, Math.min(A.x1 - 10, s.x + s.vx * dt)); }
  if (!G.naAgua) { if (S.est !== 'livre') { S.est = 'livre'; } G.pescaTrava = false; return; }
  // a rede de lançar (verso/especial): abre no ar, cai na água, afunda um pouco e volta cheia de peixe miúdo
  const R = S.rede; if (R) { R.t += dt; G.pescaTrava = true; p.atk = null;
    if (R.est === 'voa') { const k = Math.min(1, R.t / 0.7); R.x = p.x + p.face * (20 + k * R.long); R.y = p.y - 40 - Math.sin(k * Math.PI) * 60 + k * 40; R.abre = k; if (k >= 1) { R.est = 'afunda'; R.t = 0; sfx('splash'); for (let i = 0; i < 14; i++) G.parts.push({ x: R.x + rand(-30, 30), y: p.y - 4, vx: rand(-60, 60), vy: rand(-200, -60), t: 0.5, max: 0.5, r: 1.5, cor: '#DFF6FA', g: 700 }); } }
    else if (R.est === 'afunda') { R.y = p.y + Math.min(1, R.t / 2.4) * 10; if (R.t > 2.4) { R.est = 'puxa'; R.t = 0; sfx('dodge'); } }
    else if (R.est === 'puxa') { const k = Math.min(1, R.t / 1.1); R.x += (p.x + p.face * 18 - R.x) * Math.min(1, dt * 4); R.y = p.y - 4 - k * 20; R.abre = 1 - k * 0.7;
      if (k >= 1) { const d = fundura(A, R.x0), n = 2 + Math.floor(Math.random() * 3) + (p.noBote ? 1 : 0) + (d > 0.6 ? 1 : 0), pegos = {}; let ouro = 0;
        for (let i = 0; i < n; i++) { let id = sortear(G, d), P = PEIXES[id]; if (P.monstro || RAROS.includes(id) || P.forca >= 1.8) id = Math.random() < 0.5 ? 'sardinha' : 'tilapia'; if (!PEIXES[id]) id = 'sardinha'; const [, ] = premiar(G, id, 1); pegos[id] = (pegos[id] || 0) + 1; }
        void ouro; G.textoEm(p.x, p.y - 96, 'a rede voltou: ' + Object.entries(pegos).map(([k, q]) => q + ' ' + (PEIXES[k]?.nome || k).toLowerCase()).join(', '), '#FFE9A8', 12); sfx('coin'); S.rede = null; S.redeCd = 8; G.salvar(); } }
    return; }
  if (S.redeCd > 0) S.redeCd -= dt;
  if (c.verso && G.cm.rede && S.est === 'livre' && !(S.redeCd > 0)) { S.rede = { est: 'voa', t: 0, x: p.x, y: p.y - 40, abre: 0, long: p.noBote ? 150 : 110 }; S.rede.x0 = p.x + p.face * (20 + S.rede.long); sfx('swing'); G.textoEm(p.x, p.y - 70, '"Lançai a rede"', '#C9D2E0', 11); return; }
  else if (c.verso && G.cm.rede && S.redeCd > 0 && S.est === 'livre') G.textoEm(p.x, p.y - 70, 'a rede ainda está molhada', '#C9D2E0', 10);
  G.pescaTrava = S.est !== 'livre'; p.atk = null;
  const solto = !c.atkSeg, aperto = c.atk;
  switch (S.est) {
    case 'livre': if (c.atkSeg) { if (G.char.data.gold < ISCA) { if (!(S.avisoT > G.T)) { S.avisoT = G.T + 2; G.textoEm(p.x, p.y - 70, 'sem isca (3 denários)', '#FF8A7A', 11); } break; } S.est = 'forca'; S.f = 0; S.ft = 0; } break;
    case 'forca': S.ft += dt; S.f = 0.5 - 0.5 * Math.cos(S.ft * 3.2); if (solto) { const sel = G.cm.isca || 'minhoca', est = G.cm.iscas = G.cm.iscas || {}; if (sel !== 'minhoca' && est[sel] > 0) { est[sel]--; S.isca = sel; } else { G.char.data.gold -= ISCA; S.isca = 'minhoca'; if (sel !== 'minhoca') { G.cm.isca = 'minhoca'; G.textoEm(p.x, p.y - 84, 'acabou a isca: minhoca', '#C9D2E0', 10); } } const alvo = Math.max(A.x0 + 16, Math.min(A.x1 - 16, p.x + p.face * (50 + S.f * 340))); S.est = 'voo'; S.v = 0; S.bx = p.x + p.face * 14; S.by = p.y - 36; S.alvo = alvo; sfx('swing'); } break;
    case 'voo': { S.v += dt / 0.55; const k = Math.min(1, S.v); S.bx = (p.x + p.face * 14) + (S.alvo - (p.x + p.face * 14)) * k; S.by = (p.y - 36) + (p.y - 2 - (p.y - 36)) * k - Math.sin(k * Math.PI) * 50; if (k >= 1) { S.est = 'espera'; S.esp = rand(2.2, 5.5) * (ISCAS[S.isca]?.morde || 1) * ((G.cm.iscaMar || 0) > 0 ? 0.35 : 1); S.bx = S.alvo; S.by = p.y - 2; sfx('step'); for (let i = 0; i < 6; i++) G.parts.push({ x: S.bx, y: S.by, vx: rand(-40, 40), vy: rand(-80, -30), t: 0.4, max: 0.4, r: 1.5, cor: '#BFF0F8', g: 300 }); } break; }
    case 'espera': { S.esp -= dt; const sm = S.sombras.reduce((m, s) => Math.abs(s.x - S.bx) < Math.abs(m.x - S.bx) ? s : m, S.sombras[0]); sm.alvo = true; sm.x += Math.sign(S.bx - sm.x) * Math.min(Math.abs(S.bx - sm.x), 30 * dt);
      if (aperto) { S.est = 'livre'; sm.alvo = false; G.textoEm(p.x, p.y - 70, 'cedo demais', '#C9D2E0', 11); break; }
      if (S.esp <= 0 && leviataMorde(G, fundura(A, S.bx))) { S.est = 'livre'; sm.alvo = false; break; }
      if (S.esp <= 0) { S.est = 'mordida'; S.m = 0.85; S.peixe = sortear(G, fundura(A, S.bx)); S.som = sm; sfx('click'); } break; }
    case 'mordida': S.m -= dt; if (aperto) { S.mar = (G.cm.iscaMar || 0) > 0; if (S.mar) G.cm.iscaMar--; S.est = 'briga'; S.dist = 1; S.tens = 0.15; S.disp = 0; S.dispT = rand(1, 2.2); sfx('hit'); G.tremor(3); G.textoEm(S.bx, S.by - 20, 'FISGOU!', '#FFE9A8', 13); }
      else if (S.m <= 0) { S.est = 'espera'; S.esp = rand(2, 5); if (S.som) { S.som.alvo = false; S.som.vx = rand(-40, 40); } G.textoEm(S.bx, S.by - 20, 'escapou', '#C9D2E0', 11); } break;
    case 'briga': { const P = PEIXES[S.peixe], fz = P.forca; S.dispT -= dt; if (S.dispT <= 0) { S.disp = S.disp > 0 ? 0 : rand(0.5, 1); S.dispT = S.disp > 0 ? S.disp : rand(0.9, 2.2); if (S.disp > 0) sfx('dodge'); }
      const disparando = S.disp > 0 && S.dispT > 0;
      const V0 = vara(G), V = S.mar ? { ...V0, tol: V0.tol * 1.5, puxa: V0.puxa * 1.25 } : V0, M = P.monstro; if (M) { S.manhaT = (S.manhaT ?? rand(1.5, 2.5)) - dt; if (S.cego > 0) S.cego -= dt; }
      if (M && S.manhaT <= 0) { S.manhaT = rand(1.6, 2.8); // a manha de cada monstro
        if (M === 'choque' || M === 'serpente') { if (c.atkSeg) S.tens += 0.22 / V.tol; G.textoEm(S.bx, S.by - 16, 'ZZT!', '#FFF27A', 12); sfx('hit'); }
        if (M === 'tinta' || M === 'serpente') { S.cego = 1.6; G.textoEm(S.bx, S.by - 16, 'tinta!', '#C9A6FF', 11); }
        if (M === 'pinca') { S.agarra = 1.4; G.textoEm(S.bx, S.by - 16, 'agarrou na pedra', '#FF9A6A', 11); } }
      if (S.agarra > 0) S.agarra -= dt;
      if (M === 'mordida' && disparando && c.atkSeg && S.tens > 0.55) { S.est = 'livre'; S.seq = 0; sfx('wrong'); G.textoEm(p.x, p.y - 80, 'o tubarão cortou a linha!', '#FF8A7A', 12); if (S.som) S.som.alvo = false; break; }
      if (c.atkSeg) { S.dist -= dt * 0.3 / fz * V.puxa * (S.agarra > 0 ? 0.25 : 1); S.tens += dt * (0.22 + fz * 0.16) * (disparando ? 3.2 : 1) / V.tol; } else { S.tens = Math.max(0, S.tens - dt * 0.9); S.dist = Math.min(1, S.dist + dt * 0.028 * fz * (disparando ? 2 : 1)); }
      S.bx = p.x + p.face * (14 + (Math.abs(S.alvo - p.x) - 14) * Math.max(0, S.dist)); S.by = p.y - 2 + (disparando ? Math.sin(G.T * 30) * 2 : 0);
      if (Math.random() < dt * (disparando ? 20 : 5)) G.parts.push({ x: S.bx + rand(-6, 6), y: S.by, vx: rand(-30, 30), vy: rand(-90, -30), t: 0.35, max: 0.35, r: 1.5, cor: '#BFF0F8', g: 300 });
      if (S.tens >= 1) { S.est = 'livre'; S.seq = 0; sfx('wrong'); G.textoEm(p.x, p.y - 80, 'a linha arrebentou', '#FF8A7A', 12); if (S.som) S.som.alvo = false; break; }
      if (S.dist <= 0) { S.seq++; const [txt] = premiar(G, S.peixe, S.seq); S.mostra = { id: S.peixe, t: 2 }; G.textoEm(p.x, p.y - 96, txt, '#FFE9A8', 12); S.est = 'livre'; S.sombras = S.sombras.filter(s => s !== S.som); G.salvar(); }
      break; }
  }
  if (S.mostra) { S.mostra.t -= dt; if (S.mostra.t <= 0) S.mostra = null; }
}

/* ---------------- falar e usar ---------------- */
export function rotuloPescaViva(G, ob) { if (ob.tipo === 'bote') return G.p.noBote ? null : 'Empurrar o bote e subir'; return undefined; }
export async function usarPescaViva(G, ob) {
  if (ob.tipo !== 'bote') return false; const A = agua(G); if (!A) return true;
  if (!G.cm.vara) { await G.ui.dialog({ nome: 'O bote', texto: 'Um bote pequeno, de um remo só. Sem vara não adianta: Zebedeu, no Porto, empresta uma.', acoes: [{ label: 'Ok' }] }); return true; }
  G.p.noBote = true; G.p.x = (A.x0 ?? A.x - 16) + 60; G.p.face = 1; sfx('dodge'); G.textoEm(G.p.x, G.p.y - 70, 'no bote: ande para remar · golpe para pescar · interagir na margem para descer', '#C9D2E0', 11); return true;
}
// Zebedeu empresta a vara (uma vez) e explica onde se pesca
export async function falarZebedeu(G, ob) {
  if (ob.id !== 'zebedeu' && ob.id !== 'pedro') return false;
  if (ob.id === 'pedro' && G.cm.vara) return false;
  const cm = G.cm, c = G.char;
  if (!cm.vara) { cm.vara = 'cedro'; G.salvar();
    await G.ui.dialog({ nome: ob.nome, look: ob.look, texto: 'Tome, uma vara de cedro e um punhado de anzóis. Aqui no cais só se amarra barco. Para pescar, siga o porto até a margem: da pedra dá para pegar sardinha e tilápia; de bote, mar adentro, os grandes… e coisa pior.\n\n"Lançai a rede para a banda direita do barco, e achareis" (Jo 21:6).\n\nSegure o golpe para lançar; quando a boia afundar, golpeie; na briga, solte quando ele puxar.', acoes: [{ label: 'Obrigado' }] }); return true; }
  if (cm.vara === 1) cm.vara = 'cedro';
  const est = cm.iscas = cm.iscas || {}, sel = cm.isca || 'minhoca', reabre = () => setTimeout(() => falarZebedeu(G, ob), 60);
  const acoes = [
    ...Object.entries(VARAS).filter(([k, V]) => V.preco && !(cm.varas || {})[k]).map(([k, V]) => ({ label: V.nome + ' — ' + V.preco, fn: () => { if (c.data.gold < V.preco) return G.ui.toast('Faltam denários.', 2500); c.data.gold -= V.preco; (cm.varas = cm.varas || {})[k] = 1; cm.vara = k; sfx('level'); G.salvar(); G.ui.toast(V.nome + ': ' + V.desc, 5000); reabre(); } })),
    ...(cm.rede ? [] : [{ label: 'Rede de lançar — 350', fn: () => { if (c.data.gold < 350) return G.ui.toast('Faltam denários.', 2500); c.data.gold -= 350; cm.rede = 1; sfx('level'); G.salvar(); G.ui.toast('Rede de lançar: na beira ou no bote, use o ESPECIAL (verso) para lançar. Pega vários peixes miúdos de uma vez.', 7000); reabre(); } }]),
    ...Object.entries(ISCAS).filter(([, I]) => I.pacote).map(([k, I]) => ({ label: I.nome + ' ×' + I.pacote + ' — ' + I.preco + ' (tem ' + (est[k] || 0) + ')', fn: () => { if (c.data.gold < I.preco) return G.ui.toast('Faltam denários.', 2500); c.data.gold -= I.preco; est[k] = (est[k] || 0) + I.pacote; cm.isca = k; sfx('coin'); G.salvar(); reabre(); } })),
    { label: 'Trocar de isca (agora: ' + ISCAS[sel].nome + ')', fn: () => { const ks = Object.keys(ISCAS).filter(k => k === 'minhoca' || est[k] > 0), i = ks.indexOf(sel); cm.isca = ks[(i + 1) % ks.length]; G.salvar(); reabre(); } },
    ...(Object.keys(cm.varas || {}).length ? [{ label: 'Trocar de vara (agora: ' + vara(G).nome + ')', fn: () => { const ks = ['cedro', ...Object.keys(cm.varas)], i = ks.indexOf(cm.vara); cm.vara = ks[(i + 1) % ks.length]; G.salvar(); reabre(); } }] : []),
    { label: 'Até mais' }];
  await G.ui.dialog({ nome: ob.nome + ' · varas e iscas', look: ob.look, texto: '"Lá no fundo tem coisa que não é peixe: enguia que dá choque, polvo que suja a água de tinta, caranguejo que se agarra na pedra, tubarão que corta linha. E de noite… dizem que uma serpente."\n\nVara: ' + vara(G).nome + ' · Isca: ' + ISCAS[sel].nome + ' · Denários: ' + Math.floor(c.data.gold) + (cm.monstros ? '\nMonstros pescados: ' + cm.monstros : ''), acoes });
  return true;
}

/* ---------------- desenho (em pixel de jogo) ---------------- */
export function pintarPescaViva(g, G, X, Y, Tm, desenhaBote) {
  const A = agua(G); if (!A) return; const S = G.pesca, p = G.p;
  if (S) for (const s of S.sombras) { g.globalAlpha = 0.35; g.fillStyle = '#05141E'; const x = X(s.x), y = Y(s.y), w = Math.round(s.tam); g.fillRect(x - w, y, w * 2, Math.max(2, Math.round(w / 3))); g.fillRect(x + (s.vx > 0 ? -w - 2 : w), y, 2, 2); g.globalAlpha = 1; }
  if (p.noBote) desenhaBote(g, X(p.x), Y(p.y));
  if (p.nada && !p.morto && !G.levi) { const x = X(p.x), y = Y(p.y), cobre = p.chao ? 11 : Math.max(0, 11 - Math.round((A.y - p.y) / 2)); // nadando: a água até o peito, e as braçadas
    if (cobre > 0) { for (let i = -10; i <= 10; i++) { const yy = y - cobre + Math.round(Math.sin(i * 0.5 + Tm * 6) * 1); g.fillStyle = '#1F5A72'; g.fillRect(x + i, yy, 1, cobre + 2); g.fillStyle = (i + Math.floor(Tm * 8)) % 5 ? '#5AB0C0' : '#DFF6FA'; g.fillRect(x + i, yy, 1, 1); }
      if (p.chao && Math.abs(p.vx) > 20 && Math.floor(Tm * 8) % 2) { g.fillStyle = '#DFF6FA'; g.fillRect(x + (p.face > 0 ? 8 : -10), y - 12, 3, 2); g.fillRect(x + (p.face > 0 ? -10 : 8), y - 13, 2, 1); } } }
  if (!S || !G.naAgua) return;
  const mx = X(p.x + p.face * 6), my = Y(p.y - 24), tx = X(p.x + p.face * 22), ty = Y(p.y - 44);
  g.fillStyle = '#6B4A2E'; for (let k = 0; k <= 10; k++) g.fillRect(Math.round(mx + (tx - mx) * k / 10), Math.round(my + (ty - my) * k / 10), 1, 1); // a vara
  if (S.est === 'forca') { const bx = X(p.x) - 10, by = Y(p.y - 70); g.fillStyle = '#17121f'; g.fillRect(bx - 1, by - 1, 22, 5); g.fillStyle = '#3A3448'; g.fillRect(bx, by, 20, 3); g.fillStyle = '#FFD86A'; g.fillRect(bx, by, Math.round(20 * S.f), 3); }
  if (['voo', 'espera', 'mordida', 'briga'].includes(S.est)) { const bx = X(S.bx), by = Y(S.by) + (S.est === 'mordida' ? 3 : Math.round(Math.sin(Tm * 3) * 0.8));
    g.fillStyle = 'rgba(230,240,255,0.7)'; for (let k = 0; k <= 16; k++) { const u = k / 16, sag = Math.sin(u * Math.PI) * (S.est === 'briga' ? 2 : 6); g.fillRect(Math.round(tx + (bx - tx) * u), Math.round(ty + (by - ty) * u + sag), 1, 1); }
    g.fillStyle = '#17121f'; g.fillRect(bx - 2, by - 3, 4, 5); g.fillStyle = '#E2463C'; g.fillRect(bx - 1, by - 2, 2, 2); g.fillStyle = '#F4F1E6'; g.fillRect(bx - 1, by, 2, 1);
    if (S.est === 'mordida') { g.fillStyle = '#FFE9A8'; g.fillRect(bx - 1, by - 12, 2, 5); g.fillRect(bx - 1, by - 6, 2, 1); } }
  if (S.est === 'briga' && S.cego > 0) { const bx = X(p.x) - 13, by = Y(p.y - 74); g.fillStyle = '#2A1A30'; g.fillRect(bx - 1, by - 1, 28, 6); g.fillStyle = '#5A3A6A'; g.fillRect(bx + 3, by + 1, 20, 2); }
  else if (S.est === 'briga') { const bx = X(p.x) - 13, by = Y(p.y - 74); g.fillStyle = '#17121f'; g.fillRect(bx - 1, by - 1, 28, 6); g.fillStyle = '#2A3448'; g.fillRect(bx, by, 26, 4); g.fillStyle = S.tens > 0.75 ? '#E2463C' : S.tens > 0.45 ? '#F2C14E' : '#7FD08A'; g.fillRect(bx, by, Math.round(26 * Math.min(1, S.tens)), 4);
    g.fillStyle = '#BFF0F8'; g.fillRect(bx, by + 6, Math.round(26 * (1 - Math.max(0, S.dist))), 1); }
  if (S.rede) { const R = S.rede, x = X(R.x), y = Y(R.y), r = Math.round(4 + R.abre * 22), hx = X(p.x + p.face * 10), hy = Y(p.y - 30);
    g.fillStyle = 'rgba(220,210,170,0.7)'; for (let k = 0; k <= 12; k++) g.fillRect(Math.round(hx + (x - hx) * k / 12), Math.round(hy + (y - r * 0.3 - hy) * k / 12), 1, 1); // a corda
    g.fillStyle = '#C9B88A'; for (let i = -r; i <= r; i += 3) { const a = Math.round(Math.sqrt(Math.max(0, r * r - i * i)) * 0.55); for (let j = -a; j <= a; j += 3) g.fillRect(x + i, y + j * (R.est === 'voa' ? 1 : 0.4), 1, 1); }
    g.fillStyle = '#8A8490'; for (let i = -r; i <= r; i += 5) g.fillRect(x + i, y + Math.round(Math.sqrt(Math.max(0, r * r - i * i)) * (R.est === 'voa' ? 0.55 : 0.22)), 2, 2); // os chumbinhos na borda
    if (R.est === 'puxa') for (let i = 0; i < 4; i++) { g.fillStyle = '#A9C4D0'; g.fillRect(x - 6 + i * 4, y + 1 + (Math.floor(Tm * 12 + i) % 2), 3, 1); } }
  if (S.mostra) desenhaPeixe(g, S.mostra.id, X(p.x), Y(p.y - 60) - Math.round((2 - S.mostra.t) * 6), p.face, Tm);
  if (S.est === 'livre' && !(S.dicaT > G.T)) { S.dicaT = G.T + 0.01; }
}
