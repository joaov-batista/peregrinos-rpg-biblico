// Caminhar juntos: até 4 peregrinos numa sala aberta por código, sem servidor de jogo.
// Quem abre a sala é o anfitrião; os outros entram com o código e os aparelhos conversam direto (WebRTC, via PeerJS —
// só o "aperto de mão" inicial passa pelo serviço público de sinalização). Cada um guarda o próprio progresso no
// próprio personagem: o que se conquista junto continua valendo quando se volta a caminhar sozinho.
//
// Quem manda no quê:
//  - cada aparelho simula o SEU peregrino (pulo, golpe e vigília respondem na hora, sem atraso de rede);
//  - em cada área, um aparelho é o "dono": simula vícios, chefe, dardos e zonas e manda retratos aos demais;
//  - os outros avisam o dono dos golpes que acertaram; o dano em si mesmo, cada um confere no próprio aparelho.
import { novoHeroi, damp } from './heroi.js';
import { novoVicio } from './bichos.js';
import { novoChefe } from './chefes.js';
import { areaDef } from './dados.js';
import { CLASSES } from '../data/classes.js';

const TELA = typeof location !== 'undefined' ? new URLSearchParams(location.search).get('tela') || '' : '';
const LETRAS = 'ACDEFGHJKLMNPQRTUVWXY34679', PREFIXO = 'peregrinos-caminho-', MAX = 4;
export const novoCodigo = () => Array.from({ length: 5 }, () => LETRAS[Math.random() * LETRAS.length | 0]).join('');
export const limparCodigo = s => (s || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5);

// Mensagens grandes (o retrato de uma luta cheia de dardos) são partidas em pedaços: um canal WebRTC fecha
// se receber de uma vez mais do que aguenta, e era isso que congelava a sala no meio dos chefes.
const LIMITE = 12000, partes = new Map(); let seqPt = 0;
function manda(c, m) {
  const s = JSON.stringify(m); if (s.length <= LIMITE) return c.send(m);
  const k = ++seqPt + Math.random().toString(36).slice(2, 6), n = Math.ceil(s.length / LIMITE);
  for (let i = 0; i < n; i++) c.send({ t: 'pt', k, i, n, s: s.slice(i * LIMITE, (i + 1) * LIMITE) });
}
function junta(m) {
  if (m?.t !== 'pt') return m;
  let p = partes.get(m.k); if (!p) partes.set(m.k, p = { n: m.n, v: [], c: 0, t: performance.now() });
  if (p.v[m.i] == null) { p.v[m.i] = m.s; p.c++; }
  if (p.c < p.n) { if (partes.size > 40) for (const [k, q] of partes) if (performance.now() - q.t > 5000) partes.delete(k); return null; }
  partes.delete(m.k); try { return JSON.parse(p.v.join('')); } catch { return null; }
}
const SEM = new Set(['d', 'v', 'c', 'art', 'hits', 'def', 'capa', 'rastro', 'sx', 'sy', 'sumiu']);
// cópia enxuta para a rede: sem funções, sem referências a definições e sem ciclos
function copia(o, nivel = 0) {
  if (typeof o === 'number') return Math.round(o * 100) / 100;
  if (o == null || typeof o !== 'object') return typeof o === 'function' ? undefined : o;
  if (o instanceof Set || o instanceof Map || nivel > 3) return undefined;
  if (Array.isArray(o)) return o.map(x => copia(x, nivel + 1));
  if (nivel && o.kind) return undefined;
  const r = {};
  for (const k in o) { if (SEM.has(k)) continue; if (k === 'dono') { if (o.dono?.nid) r.dn = o.dono.nid; continue; } const v = copia(o[k], nivel + 1); if (v !== undefined) r[k] = v; }
  return r;
}

/* ---------- transporte ----------
   1) PeerJS (WebRTC direto, com STUN e TURN para atravessar roteadores e redes de celular);
   2) se a ligação direta não abrir, um retransmissor pelo Supabase Realtime (mais lento, mas passa por qualquer rede);
   3) BroadcastChannel (abas do mesmo aparelho, sem internet: ?redelocal e os testes).
   O anfitrião escuta nos três ao mesmo tempo; o convidado tenta o direto e, se falhar, o retransmissor. */
const ICE = { iceServers: [
  { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302', 'stun:stun.cloudflare.com:3478'] },
  { urls: ['turn:openrelay.metered.ca:80', 'turn:openrelay.metered.ca:443', 'turn:openrelay.metered.ca:443?transport=tcp', 'turns:openrelay.metered.ca:443'], username: 'openrelayproject', credential: 'openrelayproject' }
] };
// um "barramento" de mensagens endereçadas (de, para): serve ao BroadcastChannel e ao retransmissor
function barramento(bus, anfitriao, t) {
  const uid = anfitriao ? 'anfitriao' : 'c' + Math.random().toString(36).slice(2, 9), cons = new Map();
  const con = para => ({ send: d => bus.enviar({ de: uid, para, d }), close: () => bus.enviar({ de: uid, para, fim: 1 }), via: bus.via });
  let pronto;
  bus.ouvir(m => {
    if (!m || m.para !== uid) return;
    if (anfitriao) {
      if (m.abre) { const c = con(m.de); cons.set(m.de, c); c.send({ t: 'ok' }); t.entra(c); return; }
      const c = cons.get(m.de); if (!c) return;
      if (m.fim) { cons.delete(m.de); t.sai(c); } else t.msg(c, m.d);
    } else if (m.fim) t.sai(); else if (m.d?.t === 'ok') pronto?.(); else t.msg(null, m.d);
  });
  return {
    abrir: ms => new Promise((ok, erro) => { pronto = ok; bus.enviar({ de: uid, para: 'anfitriao', abre: 1 }); setTimeout(() => erro(new Error('Sala não encontrada.')), ms); }),
    con: anfitriao ? null : con('anfitriao'),
    fechar: () => { if (anfitriao) for (const c of cons.values()) c.close(); else con('anfitriao').close(); }
  };
}
async function retransmissor(nome) {
  const { canalRetransmissao } = await import('../net.js'), r = canalRetransmissao(nome);
  if (!r) return null;
  await r.pronto();
  const ouvintes = []; r.ouvir(m => { for (const f of ouvintes) f(m); });
  return { via: 'retransmissor', enviar: m => r.enviar(m), ouvir: f => ouvintes.push(f), fechar: r.fechar };
}
async function ligar(codigo, anfitriao, local, t) {
  const nome = PREFIXO + codigo;
  if (local) {
    const ch = new BroadcastChannel(nome), ouvintes = [];
    ch.onmessage = ev => { for (const f of ouvintes) f(ev.data); };
    const b = barramento({ via: 'local', enviar: m => ch.postMessage(m), ouvir: f => ouvintes.push(f) }, anfitriao, t);
    if (!anfitriao) await b.abrir(1500);
    const fim = () => { b.fechar(); ch.close(); };
    addEventListener('pagehide', fim, { once: true });
    return { con: b.con, fechar: fim, via: 'local' };
  }
  if (anfitriao) {
    // o retransmissor fica escutando junto, para quem não conseguir a ligação direta
    let rel = null, relB = null; retransmissor(nome).then(r => { if (r) { rel = r; relB = barramento(r, true, t); } }).catch(() => null);
    const { Peer } = await import('peerjs');
    let peer = null;
    try {
      peer = new Peer(nome, { config: ICE, debug: 0 });
      await new Promise((ok, erro) => {
        peer.on('open', ok);
        peer.on('error', e => erro(new Error(e.type === 'unavailable-id' ? 'Esse código já está em uso. Tente abrir de novo.' : 'Sem conexão com o serviço de salas. Confira a internet.')));
        setTimeout(() => erro(new Error('O serviço de salas não respondeu.')), 12000);
      });
    } catch (e) {
      if (e.message.includes('em uso')) throw e;
      try { peer?.destroy(); } catch { /* nada */ } peer = null;
      for (let i = 0; i < 20 && !rel; i++) await new Promise(r => setTimeout(r, 250)); // sem o serviço direto, a sala vive só no retransmissor
      if (!rel) throw e;
    }
    if (peer) {
      peer.on('connection', c => { c.on('open', () => t.entra(c)); c.on('data', d => t.msg(c, d)); c.on('close', () => t.sai(c)); c.on('error', () => t.sai(c)); });
      peer.on('disconnected', () => { try { peer.reconnect(); } catch { /* a sala segue para quem já entrou */ } });
      peer.on('error', () => { /* um convidado que falhou não derruba a sala */ });
    }
    return { con: null, via: peer ? 'direto' : 'retransmissor', fechar: () => { try { peer?.destroy(); } catch { /* nada */ } try { relB?.fechar(); rel?.fechar(); } catch { /* nada */ } } };
  }
  // convidado: primeiro a ligação direta; se não abrir em alguns segundos, o retransmissor
  let falha = null;
  try {
    const { Peer } = await import('peerjs');
    const peer = new Peer({ config: ICE, debug: 0 });
    await new Promise((ok, erro) => { peer.on('open', ok); peer.on('error', e => erro(e)); setTimeout(() => erro(new Error('tempo')), 9000); });
    const c = peer.connect(nome, { reliable: true, serialization: 'json' });
    await new Promise((ok, erro) => { c.on('open', ok); peer.on('error', e => erro(e)); setTimeout(() => erro(new Error('tempo')), 9000); });
    c.on('data', d => t.msg(null, d)); c.on('close', () => t.sai()); c.on('error', () => t.sai());
    peer.on('error', () => { /* depois de aberta, quem cuida é o 'close' */ });
    return { con: c, via: 'direto', fechar: () => peer.destroy() };
  } catch (e) { falha = e; }
  const rel = await retransmissor(nome).catch(() => null);
  if (rel) {
    const b = barramento(rel, false, t);
    try { await b.abrir(6000); return { con: b.con, via: 'retransmissor', fechar: () => { b.fechar(); rel.fechar(); } }; }
    catch { rel.fechar(); }
  }
  throw new Error(falha?.type === 'peer-unavailable' || !rel ? 'Sala não encontrada. Confira o código e se o anfitrião está com a sala aberta (e com o jogo na tela).' : 'A sala não respondeu. Confira a internet dos dois aparelhos e tente de novo.');
}

export class Juntos {
  constructor(G) {
    this.G = G; this.pares = new Map(); this.eu = 0; this.anfitriao = false; this.codigo = ''; this.souDono = true;
    this.tE = 0; this.tW = 0; this.tI = 0; this.semDono = 0; this.fxN = 0; this.seq = (Math.random() * 9e5 | 0) * 1000;
    this.gastos = new Map(); this.mortos = new Set(); this.cons = new Map(); this.mudo = false; this.resp = null;
  }
  info() { const c = this.G.char, A = this.G.arma; return { nome: c.name, look: c.look || {}, cls: c.cls, hab: this.G.hab, tela: TELA, armaCor: A?.lamina || '', armaRar: A?.rar || '' }; }
  // o par joga no mesmo aparelho (outro quadro da tela dividida): eventos de todos não se repetem no meu quadro
  irmao(id) { return !!TELA && this.pares.get(id)?.tela === TELA; }

  static async abrir(G, codigo, local) {
    const mp = new Juntos(G); mp.anfitriao = true; mp.codigo = codigo; mp.local = local;
    mp.rede = await ligar(codigo, true, local, {
      entra: () => { },
      msg: (c, m) => { m = junta(m); if (m) mp.doAnfitriao(c, m); },
      sai: c => { const id = mp.cons.get(c); if (id == null) return; mp.cons.delete(c); mp.saiu(id); mp.enviar({ t: 'sx', id }); }
    });
    return mp;
  }
  static async entrar(G, codigo, local) {
    const mp = new Juntos(G); mp.codigo = codigo; mp.local = local; mp.ultimo = performance.now();
    let ok, erro; const bem = new Promise((a, b) => { ok = a; erro = b; });
    mp.rede = await ligar(codigo, false, local, {
      msg: (_, m) => { m = junta(m); if (!m) return; mp.ultimo = performance.now(); if (m.t === 'bem') { mp.eu = m.id; for (const p of m.pares) mp.chegou(p.id, p, true); ok(); } else if (m.t === 'cheio') erro(new Error('A sala já tem quatro peregrinos.')); else { try { mp.receber(m); } catch (e) { console.error('[juntos]', e); } } },
      sai: () => mp.reconectar()
    });
    manda(mp.rede.con, { t: 'oi', ...mp.info() });
    setTimeout(() => erro(new Error('O anfitrião não respondeu.')), 8000);
    try { await bem; } catch (e) { mp.rede.fechar(); throw e; }
    return mp;
  }

  doAnfitriao(c, m) {
    if (m.t === 'oi') {
      let id = 1; const usados = new Set(this.cons.values()); while (usados.has(id)) id++;
      if (id >= MAX) { manda(c, { t: 'cheio' }); return; }
      this.cons.set(c, id);
      manda(c, { t: 'bem', id, pares: [{ id: 0, ...this.info() }, ...[...this.pares.values()].map(p => ({ id: p.id, nome: p.nome, look: p.look, cls: p.cls, hab: p.hab, tela: p.tela }))] });
      const ch = { t: 'ch', de: id, nome: m.nome, look: m.look, cls: m.cls, hab: m.hab, tela: m.tela };
      for (const [o, oid] of this.cons) if (oid !== id) manda(o, ch);
      this.receber(ch); return;
    }
    const id = this.cons.get(c); if (id == null) return;
    m.de = id; const quem = this.pares.get(id); if (quem) quem.vistoEm = performance.now();
    for (const [o, oid] of this.cons) if (oid !== id) { try { manda(o, m); } catch { /* um par caindo não derruba os outros */ } }
    try { this.receber(m); } catch (e) { console.error('[juntos]', e); }
  }
  enviar(m) {
    // retratos e posições são descartáveis: se a fila de envio encher (rede lenta), pula em vez de acumular atraso
    const leve = m.t === 'w' || m.t === 'e' || m.t === 'fx', cheio = c => leve && (c.dataChannel?.bufferedAmount || 0) > 180000;
    try { if (this.anfitriao) { m.de = 0; for (const c of this.cons.keys()) if (!cheio(c)) manda(c, m); } else if (!cheio(this.rede.con)) manda(this.rede.con, m); } catch { /* conexão caindo: o 'close' cuida */ }
  }
  ev(t, o) { if (this.acompanhado()) this.enviar({ t, a: this.G.area, ...o }); }
  sair() { this.rede?.fechar(); this.fechado = true; if (this.G.mp === this) this.G.mp = null; }
  // a ligação caiu ou ficou muda: tenta entrar de novo na mesma sala antes de desistir
  async reconectar() {
    if (this.fechado || this.religando || this.anfitriao) return; this.religando = true; const G = this.G;
    G.ui.toast('A ligação com a sala caiu. Reconectando…', 4000);
    for (let i = 0; i < 4 && G.running && G.mp === this; i++) {
      try { const novo = await Juntos.entrar(G, this.codigo, this.local); this.fechado = true; try { this.rede.fechar(); } catch { /* já estava fechada */ } G.mp = novo; novo.mudouArea(G.area); G.ui.toast('Reconectado à sala ' + this.codigo + '.', 3500); return; }
      catch { await new Promise(r => setTimeout(r, 2500)); }
    }
    this.religando = false; this.caiu();
  }
  caiu() { if (this.fechado) return; this.sair(); this.G.ui.toast('A sala fechou. Você segue o caminho sozinho; o que conquistou continua com você.', 6000); }

  chegou(id, m, quieto) {
    const h = novoHeroi(0, 0, 5); h.a = null; h.tx = 0; h.ty = 0; h.novo = true;
    this.pares.set(id, { id, nome: m.nome || 'Peregrino', look: m.look || {}, cls: m.cls, hab: m.hab || {}, tela: m.tela || '', arma: CLASSES[m.cls]?.arma || 'espada', armaCor: m.armaCor || '', armaRar: m.armaRar || '', h, visto: 0 });
    if (!quieto) this.G.ui.toast((m.nome || 'Um peregrino') + ' chegou para caminhar junto.', 4000);
  }
  saiu(id) { const p = this.pares.get(id); if (!p) return; this.pares.delete(id); this.G.ui.toast(p.nome + ' deixou a sala.', 3500); }

  /* ---------- quem está comigo e quem simula a área ---------- */
  naArea() { const a = this.G.area, r = []; for (const p of this.pares.values()) if (p.h.a === a) r.push(p); return r; }
  acompanhado() { for (const p of this.pares.values()) if (p.h.a === this.G.area) return true; return false; }
  mudouArea(id) {
    this.mortos.clear(); this.gastos.clear(); this.semDono = 0;
    this.souDono = ![...this.pares.values()].some(p => p.h.a === id && p.h.dn);
  }
  // o alvo de um vício ou chefe: o peregrino vivo mais próximo (o chefe só olha para quem está na arena)
  alvo(e, eu) {
    const G = this.G, A = G.N.arena, chefe = e.kind === 'chefe';
    if (chefe && e.alvoT > G.T && e.alvoH && !e.alvoH.morto && e.alvoH.a === G.area) return e.alvoH;
    let melhor = null, md = 1e9;
    const ve = h => { if (h.morto || (chefe && A && h.x < A.x0)) return; const d = Math.abs(h.x - e.x) + Math.abs(h.y - e.y); if (d < md) { md = d; melhor = h; } };
    if (!G.ausente) ve(eu);
    for (const p of this.naArea()) if (!p.h.au) ve(p.h);
    if (chefe) { e.alvoH = melhor && melhor !== eu ? melhor : null; e.alvoT = G.T + 4; if (melhor === eu) e.alvoT = G.T + 4, e.alvoH = eu, eu.a = G.area; }
    return melhor || eu;
  }
  vivosNaArena(A) { const G = this.G; return [G.eu, ...this.naArea().map(p => p.h)].some(h => !h.morto && h.x > A.x0 - 40); }

  /* ---------- a cada quadro ---------- */
  tick(dt) {
    const G = this.G, la = this.naArea(), agora = performance.now();
    for (const p of this.pares.values()) { const h = p.h; h.x = damp(h.x, h.tx, 22, dt); h.y = damp(h.y, h.ty, 22, dt); }
    for (const [k, t] of this.gastos) if (agora - t > 1500) this.gastos.delete(k);
    // vigia a ligação: quem fica mudo por muito tempo é dado como fora (anfitrião) ou tenta religar (convidado)
    if (!this.anfitriao && this.ultimo && agora - this.ultimo > 7000) this.reconectar();
    if (this.anfitriao && (this.tV = (this.tV || 0) + dt) > 2) { this.tV = 0; for (const [c, id] of [...this.cons]) { const q = this.pares.get(id); if (q && q.vistoEm && agora - q.vistoEm > 10000) { this.cons.delete(c); try { c.close(); } catch { /* */ } this.saiu(id); this.enviar({ t: 'sx', id }); } } }
    this.fxN = Math.max(0, this.fxN - dt * 50);
    // posse da área
    const outros = la.filter(p => p.h.dn);
    if (this.souDono) { if (outros.some(p => p.id < this.eu)) this.souDono = false; }
    else if (outros.length) this.semDono = 0;
    else { this.semDono += dt; if (this.semDono > 0.5 && la.every(p => p.id > this.eu || this.semDono > 1.5)) { this.souDono = true; this.semDono = 0; } }
    if (!this.souDono) for (const e of G.inimigos) if (e.sx != null) { e.x = damp(e.x, e.sx, 24, dt); e.y = damp(e.y, e.sy, 24, dt); }
    if (!this.pares.size) return;
    const calmo = this.rede?.via === 'retransmissor' || this.rede?.con?.via === 'retransmissor';
    if ((this.tE -= dt) <= 0) { this.tE = calmo ? 0.09 : 0.05; this.enviar(this.estado()); }
    if ((this.tI -= dt) <= 0) { this.tI = 5; this.enviar({ t: 'inf', ...this.info() }); }
    if (this.souDono && la.length && (this.tW -= dt) <= 0) { this.tW = calmo ? 0.12 : 0.066; this.enviar(this.mundo()); }
  }
  estado() {
    const G = this.G, p = G.eu, o = { t: 'e', a: G.area, dn: this.souDono ? 1 : 0, au: G.ui.blocking ? 1 : 0 };
    for (const k in p) { const v = p[k]; if (typeof v === 'number') o[k] = Math.round(v * 100) / 100; else if (typeof v === 'boolean') o[k] = v; }
    if (p.atk) o.atk = copia(p.atk);
    const ts = G.tiros.filter(t => t.amigo && !t.nid); if (ts.length) o.ts = ts.map(t => [t.x | 0, t.y | 0, t.vx | 0, t.vy | 0, t.r, t.tipo, t.cor]);
    return o;
  }
  mundo() {
    const G = this.G, id = o => { o.nid = o.nid || ++this.seq; return o; };
    return { t: 'w', a: G.area, i: G.inimigos.map(e => copia(id(e))), ti: G.tiros.filter(t => !t.amigo).slice(-90).map(t => copia(id(t))), z: G.zonas.filter(z => !z.amigo).map(z => copia(id(z))),
      g: { luta: !!G.luta, puxao: G.puxao, ea: G.escuroAlvo || 0, vento: G.vento, congela: !!G.congela, emb: G.emb ? G.N.celulas.indexOf(G.emb.c) : null } };
  }
  aplicarMundo(m) {
    const G = this.G, porId = new Map(); for (const e of G.inimigos) if (e.nid) porId.set(e.nid, e);
    G.inimigos = m.i.filter(s => !this.mortos.has(s.nid) && (s.kind !== 'chefe' || G.N.arena)).map(s => {
      let e = porId.get(s.nid), novo = !e;
      if (novo) e = s.kind === 'chefe' ? novoChefe(s.id, G.N.arena, G.dif) : novoVicio(s.type, s.x, s.y);
      const { x, y, ...r } = s; Object.assign(e, r); e.sx = x; e.sy = y;
      if (!('mov' in s)) e.mov = null; if (!('raios' in s)) e.raios = null;
      if (novo || Math.hypot(e.x - x, e.y - y) > 220) { e.x = x; e.y = y; }
      if (e.kind === 'chefe') { if (e.mov) e.mov.def = e.c.golpes[e.mov.nome]; e.clones = e.clones || []; for (const cl of e.clones) cl.art = cl.art || { ...e.art }; }
      return e;
    });
    G.tiros = G.tiros.filter(t => !t.nid).concat(m.ti.filter(s => !this.gastos.has(s.nid)));
    const zs = new Map(); for (const z of G.zonas) if (z.nid) zs.set(z.nid, z);
    G.zonas = G.zonas.filter(z => !z.nid).concat(m.z.map(s => { const z = zs.get(s.nid) || {}, fez = z.fez; Object.assign(z, s); z.fez = fez; if (!('aviso' in s)) z.aviso = 0; z.dono = s.dn ? G.inimigos.find(e => e.nid === s.dn) : null; return z; }));
    const g = m.g; G.puxao = g.puxao || null; G.escuroAlvo = g.ea; G.vento = g.vento || null; G.congela = g.congela; G.embRemota = g.emb;
    if (g.luta !== !!G.luta) G.lutaRemota(g.luta);
    if (G.luta) G.chefe = G.inimigos.find(e => e.kind === 'chefe') || null;
  }

  /* ---------- efeitos e avisos ---------- */
  fx(f) {
    if (this.mudo || this.fxN > 45 || !this.acompanhado()) return;
    this.fxN += f[0] === 'p' ? 1.5 : 1;
    this.ev('fx', { f: f.map(v => typeof v === 'number' ? Math.round(v) : typeof v === 'string' ? v : null) });
  }
  gasta(t, some) { if (this.souDono) return; this.gastos.set(t.nid, performance.now()); if (some) this.ev('ti', { id: t.nid }); }

  // a pergunta do chefe vai para todos os que estão na área; vale a resposta da maioria (empate conta como acerto)
  async quizJunto(pacote, b) {
    const G = this.G; this.resp = new Map(); this.ev('qz', { p: pacote, b: b.nid });
    G.perguntaDoChefe(b, pacote).then(ok => { this.resp?.set(this.eu, ok); if (this.resp && this.resp.size <= this.naArea().length) G.ui.toast('Esperando os outros peregrinos responderem…', 3000); });
    const t0 = performance.now();
    while (G.running && G.mp === this) {
      const faltam = [this.eu, ...this.naArea().map(p => p.id)].filter(id => !this.resp.has(id));
      if (!faltam.length || performance.now() - t0 > 75000) break;
      await new Promise(r => setTimeout(r, 200));
    }
    const vals = [...this.resp.values()].filter(v => typeof v === 'boolean'), ok = vals.filter(Boolean).length * 2 >= Math.max(1, vals.length);
    this.resp = null; this.ev('qf', { ok });
    return ok;
  }

  // Pergunta por votação: aparece para todos da área; vale a resposta da maioria. No empate, vota-se de novo.
  async votar(q, titulo, fb) {
    const G = this.G;
    for (let rodada = 0; rodada < 3; rodada++) {
      this.resp = new Map(); this.ev('vq', { q, titulo, fb });
      G.emGeral(() => G.ui.quiz(fb ? { ...q, fb, tempo: 10 } : { ...q, tempo: 10 }, titulo + ' · VOTAÇÃO')).then(ok => { this.resp?.set(this.eu, ok); G.ui.toast('Voto dado. Esperando os outros…', 2500); });
      const t0 = performance.now();
      while (G.running && G.mp === this) { const faltam = [this.eu, ...this.naArea().map(p => p.id)].filter(id => !this.resp.has(id)); if (!faltam.length || performance.now() - t0 > 75000) break; await new Promise(r => setTimeout(r, 200)); }
      const vals = [...(this.resp?.values() || [])].filter(v => typeof v === 'boolean'), sim = vals.filter(Boolean).length, nao = vals.length - sim; this.resp = null;
      if (sim !== nao) { const ok = sim > nao; this.ev('vf', { ok }); G.ui.toast(ok ? 'A maioria acertou.' : 'A maioria errou.', 3500); return ok; }
      this.ev('vt'); G.ui.toast('Empate na votação. Conversem: alguém precisa ceder. Votem de novo.', 4500); await new Promise(r => setTimeout(r, 1500));
    }
    this.ev('vf', { ok: false }); return false;
  }

  receber(m) {
    const G = this.G, par = this.pares.get(m.de);
    switch (m.t) {
      case 'ch': if (!par && m.de !== this.eu) this.chegou(m.de, m); return;
      case 'sx': this.saiu(m.id); return;
      case 'inf': if (par) { par.tela = m.tela || ''; par.nome = m.nome; par.look = m.look || {}; par.cls = m.cls; par.hab = m.hab || {}; par.arma = CLASSES[m.cls]?.arma || 'espada'; par.armaCor = m.armaCor || ''; par.armaRar = m.armaRar || ''; } return;
      case 'e': {
        if (!par) return;
        const h = par.h, { t, de, x, y, ...r } = m; Object.assign(h, r); h.atk = m.atk || null; h.ts = m.ts || null; h.tx = x; h.ty = y;
        if (h.novo || Math.hypot(h.x - x, h.y - y) > 240) { h.x = x; h.y = y; h.novo = false; }
        return;
      }
    }
    if (m.a !== G.area || !par) return;
    const ini = id => G.inimigos.find(e => e.nid === id);
    switch (m.t) {
      case 'w': if (m.de < this.eu || !this.souDono) { this.souDono = false; this.semDono = 0; this.aplicarMundo(m); } break;
      case 'g': if (this.souDono) G.golpeRemoto(ini(m.id), m); break;
      case 'pa': { const e = this.souDono && ini(m.id); if (!e) break; if (e.kind === 'chefe') G.postura(e, 34); else { e.stun = 1.5; e.aberto = 1.5; e.vx = m.vx || 0; } break; }
      case 'ti': if (this.souDono) G.tiros = G.tiros.filter(t => t.nid !== m.id); break;
      case 'zp': { const z = this.souDono && G.zonas.find(q => q.nid === m.id); if (z) G.zonaDefendida(z); break; }
      case 'lu': if (this.souDono && G.N.arena && G.def.chefe && !G.luta && !G.chefe) G.iniciarLuta(); break;
      case 'tb': if (this.souDono && G.chefe && !G.chefe.morrendo) G.chefeSeFortalece(G.chefe, par.nome); break;
      case 'mo': { if (this.mortos.has(m.id)) break; const e = ini(m.id); this.mortos.add(m.id); if (e && !e.sumiu) { e.hp = 0; G.matar(e); G.inimigos = G.inimigos.filter(x => x !== e); } break; }
      case 'cc': { const b = ini(m.id) || G.chefe; if (b && !b.fora) { b.remoto = true; G.chefeCaiu(b); } break; }
      case 'qz': { const b = ini(m.b) || G.chefe; if (!b || G.ui.blocking || this.irmao(m.de)) { this.ev('qr', { ok: null }); break; } G.perguntaDoChefe(b, m.p).then(ok => this.ev('qr', { ok })); break; }
      case 'qr': this.resp?.set(m.de, m.ok); break;
      case 'cin': if (!this.irmao(m.de)) G.cinema(m.id, true, true); break;
      case 'vn': G.soprar(+m.d || 2, +m.f || 0, String(m.tx || '').slice(0, 40), true); break;
      case 'vq': if (G.ui.blocking || this.irmao(m.de)) { this.ev('vr', { ok: null }); break; } G.emGeral(() => G.ui.quiz(m.fb ? { ...m.q, fb: m.fb, tempo: 10 } : { ...m.q, tempo: 10 }, m.titulo + ' · VOTAÇÃO')).then(ok => { this.ev('vr', { ok }); G.ui.toast('Voto dado. Esperando os outros…', 2500); }); break;
      case 'vr': this.resp?.set(m.de, m.ok); break;
      case 'vt': G.ui.toast('Empate na votação. Conversem: alguém precisa ceder. Votem de novo.', 4500); break;
      case 'vf': G.ui.toast(m.ok ? 'A maioria acertou.' : 'A maioria errou.', 3500); break;
      case 'ap': G.aplicarLeitura(m); break;
      case 'rs': G.resetT = G.T; break;
      case 'pv': if (m.id === this.eu) G.ganharOleo(11); break;
      case 'eco': G.ui.toast(m.txt, m.d || 4000); break;
      case 'qf': G.respostaDoGrupo(m.ok); break;
      case 'fx': {
        const f = m.f; this.mudo = true;
        try {
          if (f[0] === 'e') G.efeito(f[1], f[2], f[3], f[4]);
          else if (f[0] === 't') G.textoEm(f[1], f[2], f[3], f[4], f[5]);
          else if (f[0] === 'g') G.grito(f[1]);
          else if (f[0] === 'r') G.risco(f[1], f[2], f[3], f[4], f[5], f[6], f[7]);
          else if (f[0] === 'f') { const b = ini(f[1]); if (b) G.fala(b, f[2]); }
          else if (f[0] === 'p' && G.fx[f[1]]) G.fx[f[1]](f[2], f[3], f[4], f[5]);
        } finally { this.mudo = false; }
        break;
      }
    }
  }

  // onde está cada companheiro, para o menu
  lista() { return [...this.pares.values()].map(p => ({ id: p.id, irmao: !!TELA && p.tela === TELA, nome: p.nome, area: p.h.a, onde: p.h.a ? areaDef(p.h.a).nome : '…', vida: p.h.vida, vidaMax: p.h.vidaMax })); }
}
