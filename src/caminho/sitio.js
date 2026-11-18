// O sítio do peregrino: plantar, regar e colher; criar galinhas, cabras e ovelhas (e levá-las ao pasto);
// colher azeitonas; pisar uva no lagar, prensar azeite, assar pão; vender pelo cesto. O dia é o do relógio do Refúgio.
// Casado, o cônjuge mora aqui e ajuda: rega e alimenta toda manhã. Cada jogador tem o seu sítio (o id da área leva o nome).
import { sfx } from '../audio.js';
import { ITENS } from '../content/gente.js';
import { PRECO, PLANTAS, ANIMAIS, MAQUINAS, SITIO } from '../content/sitio.js';
import { dia, hora, ganhar, bolsa } from './moradores.js';
import { coracoesDe } from './vida.js';
import { T, CW } from './nivel.js';
import { MORADORES, NOMES_SITIO } from './dados.js';
import { chovendo } from './tempo.js';
import { passoPraia } from './praia.js';
import { passoPescaViva } from './pescaviva.js';

const rand = (a, b) => a + Math.random() * (b - a), pick = a => a[Math.floor(Math.random() * a.length)];
export const limpo = n => String(n || 'peregrino').toLowerCase().replace(/[^a-z0-9]/g, '') || 'peregrino';
// sozinho: "sitio:joao". Com outros peregrinos na sala: "sitio:ana+joao" (todos calculam o mesmo id e se encontram lá)
export function sitioId(G) {
  const eu = limpo(G.char.name); NOMES_SITIO[eu] = G.char.name;
  const outros = G.mp?.lista?.() || []; for (const o of outros) NOMES_SITIO[limpo(o.nome)] = o.nome;
  return 'sitio:' + [...new Set([eu, ...outros.map(o => limpo(o.nome))])].sort().join('+');
}
// qual é a sua fazenda no mapa (o índice da sala do pasto): a praia é a sala 0; as fazendas vêm depois, da última para a primeira
const minhaBase = G => { const d = G.def.donos || [''], k = d.indexOf(limpo(G.char.name)); return k < 0 ? -1 : 2 + (d.length - 1 - k) * 3; }; /* salas 0 e 1: o mar e a praia */
// a vela de casa: "O fogo arderá continuamente sobre o altar; não se apagará" (Lv 6:13). Precisa de azeite para não apagar.
export const VELA_MAX = 7;
export const velaAcesa = G => (G.cm.velaAte ?? 0) > (G.cm.relogio || 0);
export const diasDeVela = G => Math.max(0, ((G.cm.velaAte ?? 0) - (G.cm.relogio || 0)) / 600);
export const alheio = (G, ob) => ob.dono != null && G.def?.donos && ob.dono !== limpo(G.char.name);
export const st = G => (G.cm.sitio = G.cm.sitio || { canteiros: [], animais: [], pomar: [], maq: {}, cesto: {}, sementes: {}, ultimoDia: dia(G), cocho: -1, milho: -1 });
const can = (G, i) => (st(G).canteiros[i] = st(G).canteiros[i] || { estado: 'mato' });
const nomeItem = (k, n) => n > 1 ? ITENS[k].plural : ITENS[k].nome.toLowerCase();

/* ---------------- a virada do dia (roda ao entrar no sítio e a cada quadro lá) ---------------- */
export function viradaDoDia(G) {
  const S = st(G), hoje = dia(G); if (S.ultimoDia >= hoje) return;
  const msgs = [];
  for (let d = S.ultimoDia + 1; d <= hoje; d++) {
    const ontem = d - 1;
    // o cônjuge ajuda: rega e alimenta no dia que passou (se você não fez)
    if (G.cm.conjuge) { for (const c of S.canteiros) if (c && c.estado === 'plantado') c.regado = Math.max(c.regado ?? -1, ontem); S.cocho = Math.max(S.cocho, ontem); S.milho = Math.max(S.milho, ontem); }
    for (const c of S.canteiros) if (c && c.estado === 'plantado' && c.regado === ontem && !c.pronto) { c.cresceu = (c.cresceu || 0) + 1; const P = PLANTAS[c.planta]; if (c.cresceu >= (c.colheu && P.volta ? P.volta : P.dias)) c.pronto = true; }
    for (const a of S.animais) { const A = ANIMAIS[a.tipo], comeu = a.tipo === 'galinha' ? S.milho === ontem : (S.cocho === ontem || a.pastou === ontem);
      if (comeu) { a.dias = (a.dias || 0) + 1 + (a.pastou === ontem ? 1 : 0); a.feliz = Math.min(10, (a.feliz || 3) + (a.pastou === ontem ? 2 : 1)); if (a.dias >= A.cada) { a.pronto = (a.pronto || 0) + 1 + (a.feliz >= 9 && Math.random() < 0.35 ? 1 : 0); a.dias = 0; } }
      else a.feliz = Math.max(0, (a.feliz || 3) - 1); }
    for (const p of S.pomar) if (p) p.pronto = true; // as oliveiras dão de novo a cada dia
    { const acesa = (G.cm.velaAte ?? 0) > d * 600; for (const a of S.animais) a.feliz = Math.max(0, Math.min(10, (a.feliz || 3) + (acesa ? 1 : -1))); if (!acesa && !S.avisouVela) { S.avisouVela = 1; msgs.push('A vela de casa apagou. A casa ficou escura e os bichos, tristes. Reacenda com azeite.'); } if (acesa) S.avisouVela = 0; }
    // o comprador passa de madrugada
    const vend = Object.entries(S.cesto).filter(([, n]) => n > 0); if (vend.length) { let v = 0; for (const [k, n] of vend) v += (PRECO[k] || 3) * n; G.char.data.gold += v; msgs.push(SITIO.pago(v, vend.map(([k, n]) => n + ' ' + nomeItem(k, n)).join(', '))); S.cesto = {}; }
  }
  for (const m of Object.values(S.maq)) if (m && m.prontoDia != null && m.prontoDia <= hoje) m.feito = true;
  if (G.cm.conjuge) msgs.push(SITIO.conjuge(G.objs.find(o => o.id === G.cm.conjuge)?.nome?.split(',')[0] || 'Seu bem'));
  S.ultimoDia = hoje; G.salvar();
  if (msgs.length && G.def.sitio) setTimeout(() => G.ui.toast(msgs.join('\n'), 7000), 800);
}

/* ---------------- ao entrar: os bichos e o cônjuge aparecem ---------------- */
export function sitioAoEntrar(G) {
  const S = st(G); G.objs = G.objs.filter(o => !o.doSitio);
  const base = minhaBase(G); if (base < 0) { setTimeout(() => G.entrar(sitioId(G), { borda: 'direita' }), 0); return; } // o seu sítio não está neste mapa: vai para o certo
  G.sitioBase = base; const sala = n => (n + base) * CW * T;
  if (G.cm.velaAte == null) G.cm.velaAte = (G.cm.relogio || 0) + 2 * 600; // a primeira vela já vem acesa, para dois dias
  for (const o of G.objs) if (alheio(G, o)) { o.alheio = true; if (o.tipo === 'casa') o.id = 'casa_' + o.dono; }
  S.animais.forEach((a, i) => { const quintal = ANIMAIS[a.tipo].lugar === 'quintal', x = quintal ? sala(2) + (4 + (i % 5)) * T : sala(0) + (14 + (i * 3) % 12) * T;
    G.objs.push({ tipo: 'animal', doSitio: true, i, especie: a.tipo, nome: a.nome, x, y: 16 * T, vv: { x, alvo: x, t: rand(0, 3), face: 1, estado: 'parado' }, min: quintal ? sala(2) + 2 * T : sala(0) + 13 * T, max: quintal ? sala(2) + 10 * T : sala(0) + 28 * T }); });
  const cj = G.cm.conjuge, M = cj && MORADORES.find(m => m.id === cj); if (M) G.objs.push({ tipo: 'npc', doSitio: true, conjuge: true, id: 'conj_' + cj, nome: M.nome.split(',')[0], look: M.look, x: sala(2) + 21 * T + 16, y: 16 * T }); /* casados: o cônjuge mora e ajuda aqui */
  viradaDoDia(G);
}

/* ---------------- a cada quadro, no sítio ---------------- */
export function passoSitio(G, dt) {
  viradaDoDia(G);
  const p = G.p, S = st(G);
  passoPraia(G, dt); // o banco da praia
  passoPescaViva(G, dt); // o mar da praia: nadar e pescar
  // no multijogador, conta para os outros como está a sua fazenda (eles a veem do lado da deles)
  if (G.mp && (G.siT = (G.siT || 0) - dt) <= 0) { G.siT = 2.5; const hoje = dia(G);
    G.mp.ev('si', { d: limpo(G.char.name), c: S.canteiros.map(c => c ? [c.estado, c.planta || '', c.pronto ? 1 : 0, c.regado === hoje ? 1 : 0, c.cresceu || 0] : 0), po: S.pomar.map(q => q?.pronto === false ? 0 : 1), m: Object.fromEntries(Object.entries(S.maq).filter(([, v]) => v).map(([k, v]) => [k, v.feito ? 2 : 1])), co: S.cocho === hoje ? 1 : 0, v: velaAcesa(G) ? 1 : 0 }); }
  if (chovendo(G)) { const hoje = dia(G); let reg = 0; for (const c of S.canteiros) if (c && c.estado === 'plantado' && c.regado !== hoje) { c.regado = hoje; reg++; } if (reg) G.textoEm(p.x, p.y - 80, 'a chuva regou a lavoura', '#8FD4F0', 11); }
  for (const o of G.objs) if (o.tipo === 'animal') { const v = o.vv; v.t -= dt;
    if (S.rebanho > 0 && o.especie !== 'galinha') { const alvo = p.x - p.face * (30 + (o.i % 4) * 22), d = alvo - v.x; v.estado = Math.abs(d) > 8 ? 'indo' : 'parado'; v.face = Math.sign(d) || v.face; v.x += Math.sign(d) * Math.min(Math.abs(d), 120 * dt); continue; }
    if (v.estado === 'parado' && v.t <= 0) { v.alvo = Math.max(o.min, Math.min(o.max, v.x + rand(-90, 90))); v.estado = 'indo'; }
    if (v.estado === 'indo') { const d = v.alvo - v.x; if (Math.abs(d) < 3) { v.estado = 'parado'; v.t = rand(1.5, 5); if (Math.random() < 0.3) v.som = 1.2; } else { v.face = Math.sign(d); v.x += v.face * Math.min(Math.abs(d), (o.especie === 'galinha' ? 30 : 22) * dt); } }
    if (v.som > 0) v.som -= dt; }
  // pastoreio: o rebanho segue o peregrino; andar pelo pasto conta
  if (S.rebanho > 0) { S.rebanho -= dt; const noPasto = Math.floor(p.x / (CW * T)) === (G.sitioBase ?? 1); if (noPasto) S.andou = (S.andou || 0) + Math.abs(p.vx) * dt;
    if (S.andou > 900 || S.rebanho <= 0) { const ok = S.andou > 900; S.rebanho = 0; S.andou = 0; if (ok) { for (const a of S.animais) if (a.tipo !== 'galinha') a.pastou = dia(G); sfx('right'); G.ui.toast(SITIO.pastoreou, 4000); G.salvar(); } else G.ui.toast('O rebanho se dispersou. Ande mais pelo pasto da próxima vez.', 3500); } }
}

/* ---------------- rótulos ---------------- */
export function rotuloSitio(G, ob) {
  const hoje = dia(G);
  if (ob.tipo === 'bancoPraia') return G.cenaPraia ? null : 'Sentar no banco e olhar o mar';
  if (ob.alheio) return ['canteiro', 'pomar', 'maquina', 'cocho', 'galinheiro', 'cesto', 'essencias', 'velaCasa'].includes(ob.tipo) ? null : undefined; // a fazenda dos outros: só se olha
  switch (ob.tipo) {
    case 'canteiro': { const c = can(G, ob.idx); return c.estado === 'mato' ? 'Limpar e arar' : c.estado === 'arado' ? 'Plantar' : c.pronto ? 'Colher' : c.regado === hoje ? 'Ver a ' + PLANTAS[c.planta].nome.toLowerCase() : 'Regar'; }
    case 'animal': return 'Cuidar de ' + ob.nome;
    case 'cesto': return 'Cesto de vendas';
    case 'maquina': { const m = st(G).maq[ob.qual]; return m?.feito ? 'Recolher' : m ? 'Ver ' + MAQUINAS[ob.qual].nome.toLowerCase() : 'Usar ' + MAQUINAS[ob.qual].nome.toLowerCase(); }
    case 'pomar': return st(G).pomar[ob.idx]?.pronto !== false ? 'Colher azeitonas' : null;
    case 'cocho': return 'Encher o cocho';
    case 'galinheiro': return 'Jogar grãos às galinhas';
    case 'essencias': return 'Mesa de essências (óleos e perfumes)';
    case 'velaCasa': return velaAcesa(G) ? 'A vela de casa (acesa · ' + Math.ceil(diasDeVela(G)) + ' dia' + (Math.ceil(diasDeVela(G)) > 1 ? 's' : '') + ')' : 'Reacender a vela de casa';
  }
  return undefined;
}

/* ---------------- usar ---------------- */
export async function usarSitio(G, ob) {
  const S = st(G), hoje = dia(G), b = bolsa(G), p = G.p, d = (nome, texto, acoes = [{ label: 'Ok' }]) => G.ui.dialog({ nome, texto, acoes, voz: false });
  if (ob.tipo === 'bancoPraia') { const { sentarNaPraia } = await import('./praia.js'); sentarNaPraia(G, ob); return true; }
  if (ob.alheio) return true;
  if (ob.tipo === 'velaCasa') { const cm = G.cm, agora = cm.relogio || 0, base = Math.max(agora, cm.velaAte ?? 0), b = bolsa(G), dias = diasDeVela(G), cheia = dias >= VELA_MAX - 0.05;
    const poe = n => { cm.velaAte = Math.min(agora + VELA_MAX * 600, base + n * 600); sfx('heal'); G.fx.anel(ob.x, ob.y - 30, '#FFE08A', 40); G.textoEm(ob.x, ob.y - 60, velaAcesa(G) ? 'a vela arde' : '', '#FFE08A', 11); G.salvar(); };
    await G.ui.dialog({ nome: 'A vela de casa', texto: (velaAcesa(G) ? 'A chama está firme. Ainda arde por uns ' + Math.ceil(dias) + ' dia(s).' : 'A vela apagou. A casa está escura.') + '\n\n"O fogo arderá continuamente sobre o altar; não se apagará" (Lv 6:13).\n\nAcesa, os bichos ficam contentes a cada manhã e a sua lâmpada rende mais azeite. Apagada, eles entristecem.', voz: false,
      acoes: [...(cheia ? [] : [...((b.azeite || 0) > 0 ? [{ label: 'Pôr uma botija de azeite (+3 dias)', fn: () => { b.azeite--; poe(3); } }] : []), ...(p.oleo >= 30 ? [{ label: 'Do azeite da lâmpada (30, +1 dia)', fn: () => { p.oleo -= 30; poe(1); } }] : [])]), { label: cheia ? 'Está cheia. Deixar arder' : 'Depois' }] });
    return true; }
  if (ob.tipo === 'essencias') { const { mesaDeEssencias } = await import('./azeites.js'); await mesaDeEssencias(G); return true; }
  switch (ob.tipo) {
    case 'canteiro': { const c = can(G, ob.idx);
      if (c.estado === 'mato') { c.estado = 'arado'; sfx('dodge'); G.fx.po(ob.x, ob.y - 4, 10, '#8A6A44'); G.textoEm(ob.x, ob.y - 40, 'terra arada', '#C9A06A', 11); G.salvar(); return true; }
      if (c.estado === 'arado') { const tem = Object.keys(PLANTAS).filter(k => (S.sementes[k] || 0) > 0);
        if (!tem.length) { await d('Canteiro', SITIO.semSemente); return true; }
        await d('O que plantar?', 'Cada planta precisa ser regada um dia de cada vez.', [...tem.map(k => ({ label: PLANTAS[k].nome + ' (' + S.sementes[k] + ')', fn: () => { S.sementes[k]--; Object.assign(c, { estado: 'plantado', planta: k, cresceu: 0, pronto: false, regado: -1, colheu: 0 }); sfx('coin'); G.textoEm(ob.x, ob.y - 40, 'plantou ' + PLANTAS[k].nome.toLowerCase(), '#B8E6A0', 11); G.salvar(); } })), { label: 'Depois' }]); return true; }
      if (c.pronto) { const P = PLANTAS[c.planta], [it, n] = P.rende; ganhar(G, it, n, ob.x, ob.y - 40); if (P.extra) ganhar(G, P.extra[0], P.extra[1]); sfx('coin'); G.efeito('coleta', ob.x, ob.y - 20);
        if (P.volta) Object.assign(c, { pronto: false, cresceu: 0, colheu: (c.colheu || 0) + 1 }); else Object.assign(c, { estado: 'arado', planta: null, pronto: false }); G.salvar(); return true; }
      if (c.regado !== hoje) { c.regado = hoje; sfx('step'); for (let i = 0; i < 6; i++) G.parts.push({ x: ob.x + rand(-10, 10), y: ob.y - 30, vx: rand(-20, 20), vy: 120, t: 0.4, max: 0.4, r: 1.5, cor: '#8FD4F0', g: 400 }); G.textoEm(ob.x, ob.y - 40, 'regado', '#8FD4F0', 11); G.salvar(); return true; }
      const P = PLANTAS[c.planta], falta = (c.colheu && P.volta ? P.volta : P.dias) - (c.cresceu || 0); await d(P.nome, P.ref + '\n\nJá regada hoje. Faltam ' + falta + ' dia(s) regados.'); return true; }
    case 'animal': { const a = S.animais[ob.i], A = ANIMAIS[a.tipo], acoes = [];
      if (a.pronto > 0) acoes.push({ label: { ovo: 'Recolher os ovos', leite: 'Ordenhar', la: 'Tosquiar' }[A.da], fn: () => { ganhar(G, A.da, a.pronto, ob.vv.x, ob.y - 40); a.pronto = 0; sfx('coin'); G.salvar(); } });
      if (a.tipo !== 'galinha' && !(S.rebanho > 0)) acoes.push({ label: 'Levar o rebanho ao pasto', fn: () => { S.rebanho = 40; S.andou = 0; G.ui.toast(SITIO.pastorear + (G.cm.pet === 'cachorro' ? ' O cão ajuda a juntar.' : ''), 4500); if (G.cm.pet === 'cachorro') S.andou = 300; } });
      acoes.push({ label: 'Fazer carinho', fn: () => { if (a.carinho !== hoje) { a.carinho = hoje; a.feliz = Math.min(10, (a.feliz || 3) + 1); } ob.vv.som = 1.5; G.textoEm(ob.vv.x, ob.y - 40, '♥', '#FF8FB8', 13); G.salvar(); } }, { label: 'Deixar' });
      const humor = (a.feliz || 3) >= 8 ? 'muito contente' : (a.feliz || 3) >= 4 ? 'tranquila' : 'com fome e arisca';
      await d(a.nome + ' · ' + A.nome, 'Está ' + humor + '. ' + (a.pronto > 0 ? 'Tem ' + a.pronto + ' ' + nomeItem(A.da, a.pronto) + ' para você.' : 'Comendo todo dia, dá ' + ITENS[A.da].nome.toLowerCase() + (A.cada > 1 ? ' a cada ' + A.cada + ' dias.' : ' todo dia.')), acoes); return true; }
    case 'cocho': { if (S.cocho === hoje) { await d('O cocho', 'Já está cheio hoje.'); return true; } if ((b.trigo || 0) < 2) { await d('O cocho', 'Precisa de 2 feixes de trigo (ou leve o rebanho ao pasto, que conta como comida).'); return true; } b.trigo -= 2; S.cocho = hoje; sfx('coin'); G.textoEm(ob.x, ob.y - 30, 'cocho cheio', '#E8C24A', 11); G.salvar(); return true; }
    case 'galinheiro': { if (S.milho === hoje) { await d('O galinheiro', 'As galinhas já comeram hoje.'); return true; } if ((b.trigo || 0) < 1) { await d('O galinheiro', 'Precisa de 1 feixe de trigo.'); return true; } b.trigo--; S.milho = hoje; sfx('coin'); G.textoEm(ob.x, ob.y - 40, 'có-có-có!', '#F2E6CC', 11); G.salvar(); return true; }
    case 'pomar': { const pm = S.pomar[ob.idx] = S.pomar[ob.idx] || { pronto: true }; if (pm.pronto === false) return true; pm.pronto = false; ganhar(G, 'azeitona', 3, ob.x, ob.y - 60); sfx('coin'); G.salvar(); return true; }
    case 'cesto': { const tem = Object.keys(ITENS).filter(k => (b[k] || 0) > 0), noCesto = Object.entries(S.cesto).filter(([, n]) => n > 0);
      await d('Cesto de vendas', SITIO.cesto + (noCesto.length ? '\n\nNo cesto: ' + noCesto.map(([k, n]) => n + ' ' + nomeItem(k, n)).join(', ') + '.' : ''), [...tem.map(k => ({ label: 'Pôr ' + b[k] + ' ' + nomeItem(k, b[k]) + ' (' + PRECO[k] * b[k] + ')', fn: () => { S.cesto[k] = (S.cesto[k] || 0) + b[k]; b[k] = 0; sfx('coin'); G.salvar(); } })), { label: 'Fechar' }]); return true; }
    case 'maquina': { const M = MAQUINAS[ob.qual], m = S.maq[ob.qual];
      if (m?.feito) { ganhar(G, M.sai[0], m.n, ob.x, ob.y - 50); S.maq[ob.qual] = null; sfx('level'); G.salvar(); return true; }
      if (m) { await d(M.nome, M.fala + '\n\nTrabalhando… fica pronto amanhã.'); return true; }
      const [ent, q] = M.entra, vezes = Math.floor((b[ent] || 0) / q);
      if (!vezes) { await d(M.nome, M.fala + '\n\nPrecisa de ' + q + ' ' + nomeItem(ent, q) + '.'); return true; }
      if (M.horas === 0) { b[ent] -= vezes * q; ganhar(G, M.sai[0], vezes * M.sai[1], ob.x, ob.y - 50); sfx('level'); G.fx.po(ob.x, ob.y - 30, 8, '#C9A06A'); G.salvar(); return true; }
      await d(M.nome, M.fala, [{ label: 'Pôr ' + vezes * q + ' ' + nomeItem(ent, vezes * q), fn: () => { b[ent] -= vezes * q; S.maq[ob.qual] = { n: vezes * M.sai[1], prontoDia: hoje + 1 }; sfx('dodge'); G.salvar(); } }, { label: 'Depois' }]); return true; }
  }
  return false;
}

/* ---------------- a loja de Eliabe: animais e sementes ---------------- */
export function acoesEliabe(G, ob) {
  if (ob.id !== 'eliabe') return [];
  return [{ label: 'Animais e sementes', fn: () => lojaEliabe(G, ob) }];
}
async function lojaEliabe(G, ob) {
  const S = st(G), c = G.char, desc = coracoesDe(G, 'eliabe') >= 5 ? 0.8 : 1, preco = n => Math.round(n * desc);
  const compra = (rot, custo, fn) => ({ label: rot + ' — ' + preco(custo), fn: () => { if (c.data.gold < preco(custo)) return G.ui.toast('Faltam denários.', 2500); c.data.gold -= preco(custo); fn(); sfx('coin'); G.salvar(); lojaEliabe(G, ob); } });
  const acoes = [...Object.entries(PLANTAS).map(([k, P]) => compra(P.semente + ' (tem ' + (S.sementes[k] || 0) + ')', P.preco, () => { S.sementes[k] = (S.sementes[k] || 0) + (k === 'videira' ? 1 : 3); })),
    ...Object.entries(ANIMAIS).map(([k, A]) => compra(A.nome + ' (tem ' + S.animais.filter(a => a.tipo === k).length + ')', A.preco, () => { const usados = S.animais.filter(a => a.tipo === k).map(a => a.nome), nome = A.nomes.find(n => !usados.includes(n)) || A.nome + ' ' + (usados.length + 1); S.animais.push({ tipo: k, nome, feliz: 4, dias: 0, pronto: 0 }); G.ui.toast(nome + ' vai esperar por você no sítio.', 3500); })),
    { label: 'Só isso' }];
  await G.ui.dialog({ nome: ob.nome, look: ob.look, texto: '"Sementes boas e bichos mansos. O pastor conhece cada um pelo nome" (Jo 10:3).\n\nDenários: ' + Math.floor(c.data.gold) + (desc < 1 ? ' · desconto de amigo' : '') + '\n(Trigo: 3 sementes por compra.)', acoes });
}

// falar com o cônjuge no sítio
export async function falarConjugeSitio(G, ob) {
  if (!ob.conjuge) return false; const S = st(G), hoje = dia(G);
  const linhas = ['Reguei tudo hoje cedo. A videira está bonita.', 'As galinhas puseram bem. Quer ovo cozido?', 'Fica um pouco. O sítio é melhor com você aqui.', 'Levei as ovelhas até a cerca do fundo. Estão mansas.'];
  const acoes = []; if (S.conjDia !== hoje) acoes.push({ label: 'Bom dia, meu bem', fn: () => { S.conjDia = hoje; const it = pick(['ovo', 'leite', 'pao', 'uva', 'trigo']); ganhar(G, it, 2, G.p.x, G.p.y - 80); sfx('right'); G.salvar(); } });
  acoes.push({ label: 'Até mais' });
  await G.ui.dialog({ nome: ob.nome, look: ob.look, texto: '"' + pick(linhas) + '"', acoes }); return true;
}
