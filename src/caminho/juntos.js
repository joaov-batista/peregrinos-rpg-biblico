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

const LETRAS = 'ACDEFGHJKLMNPQRTUVWXY34679', PREFIXO = 'peregrinos-caminho-', MAX = 4;
export const novoCodigo = () => Array.from({ length: 5 }, () => LETRAS[Math.random() * LETRAS.length | 0]).join('');
export const limparCodigo = s => (s || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5);

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

/* ---------- transporte: PeerJS (internet) ou BroadcastChannel (abas do mesmo aparelho, usado nos testes) ---------- */
async function ligar(codigo, anfitriao, local, t) {
  const nome = PREFIXO + codigo;
  if (local) {
    const ch = new BroadcastChannel(nome), uid = anfitriao ? 'anfitriao' : 'c' + Math.random().toString(36).slice(2, 9), cons = new Map();
    const con = para => ({ send: d => ch.postMessage({ de: uid, para, d }), close: () => ch.postMessage({ de: uid, para, fim: 1 }) });
    let pronto;
    ch.onmessage = ev => {
      const m = ev.data; if (m.para !== uid) return;
      if (anfitriao) {
        if (m.abre) { const c = con(m.de); cons.set(m.de, c); c.send({ t: 'ok' }); t.entra(c); return; }
        const c = cons.get(m.de); if (!c) return;
        if (m.fim) { cons.delete(m.de); t.sai(c); } else t.msg(c, m.d);
      } else if (m.fim) t.sai(); else if (m.d?.t === 'ok') pronto?.(); else t.msg(null, m.d);
    };
    if (!anfitriao) {
      const p = new Promise((ok, erro) => { pronto = ok; setTimeout(() => erro(new Error('Sala não encontrada.')), 1500); });
      ch.postMessage({ de: uid, para: 'anfitriao', abre: 1 }); await p;
    }
    const fim = () => { if (anfitriao) for (const c of cons.values()) c.close(); else con('anfitriao').close(); ch.close(); };
    addEventListener('pagehide', fim, { once: true });
    return { con: anfitriao ? null : con('anfitriao'), fechar: fim };
  }
  const { Peer } = await import('peerjs');
  const peer = anfitriao ? new Peer(nome) : new Peer();
  await new Promise((ok, erro) => {
    peer.on('open', ok);
    peer.on('error', e => erro(new Error(e.type === 'unavailable-id' ? 'Esse código já está em uso. Tente abrir de novo.' : e.type === 'peer-unavailable' ? 'Sala não encontrada. Confira o código e se o anfitrião está com a sala aberta.' : 'Sem conexão com o serviço de salas. Confira a internet.')));
    setTimeout(() => erro(new Error('O serviço de salas não respondeu.')), 15000);
  });
  if (anfitriao) {
    peer.on('connection', c => { c.on('open', () => t.entra(c)); c.on('data', d => t.msg(c, d)); c.on('close', () => t.sai(c)); c.on('error', () => t.sai(c)); });
    peer.on('disconnected', () => { try { peer.reconnect(); } catch { /* a sala segue para quem já entrou */ } });
    return { con: null, fechar: () => peer.destroy() };
  }
  const c = peer.connect(nome, { reliable: true, serialization: 'json' });
  await new Promise((ok, erro) => {
    c.on('open', ok); peer.on('error', e => erro(new Error(e.type === 'peer-unavailable' ? 'Sala não encontrada. Confira o código e se o anfitrião está com a sala aberta.' : 'Não foi possível entrar na sala.')));
    setTimeout(() => erro(new Error('A sala não respondeu.')), 15000);
  });
  c.on('data', d => t.msg(null, d)); c.on('close', () => t.sai()); c.on('error', () => t.sai());
  return { con: c, fechar: () => peer.destroy() };
}

export class Juntos {
  constructor(G) {
    this.G = G; this.pares = new Map(); this.eu = 0; this.anfitriao = false; this.codigo = ''; this.souDono = true;
    this.tE = 0; this.tW = 0; this.tI = 0; this.semDono = 0; this.fxN = 0; this.seq = (Math.random() * 9e5 | 0) * 1000;
    this.gastos = new Map(); this.mortos = new Set(); this.cons = new Map(); this.mudo = false; this.resp = null;
  }
  info() { const c = this.G.char; return { nome: c.name, look: c.look || {}, cls: c.cls, hab: this.G.hab }; }

  static async abrir(G, codigo, local) {
    const mp = new Juntos(G); mp.anfitriao = true; mp.codigo = codigo;
    mp.rede = await ligar(codigo, true, local, {
      entra: () => { },
      msg: (c, m) => mp.doAnfitriao(c, m),
      sai: c => { const id = mp.cons.get(c); if (id == null) return; mp.cons.delete(c); mp.saiu(id); mp.enviar({ t: 'sx', id }); }
    });
    return mp;
  }
  static async entrar(G, codigo, local) {
    const mp = new Juntos(G); mp.codigo = codigo;
    let ok, erro; const bem = new Promise((a, b) => { ok = a; erro = b; });
    mp.rede = await ligar(codigo, false, local, {
      msg: (_, m) => { if (m.t === 'bem') { mp.eu = m.id; for (const p of m.pares) mp.chegou(p.id, p, true); ok(); } else if (m.t === 'cheio') erro(new Error('A sala já tem quatro peregrinos.')); else mp.receber(m); },
      sai: () => mp.caiu()
    });
    mp.rede.con.send({ t: 'oi', ...mp.info() });
    setTimeout(() => erro(new Error('O anfitrião não respondeu.')), 8000);
    try { await bem; } catch (e) { mp.rede.fechar(); throw e; }
    return mp;
  }

  doAnfitriao(c, m) {
    if (m.t === 'oi') {
      let id = 1; const usados = new Set(this.cons.values()); while (usados.has(id)) id++;
      if (id >= MAX) { c.send({ t: 'cheio' }); return; }
      this.cons.set(c, id);
      c.send({ t: 'bem', id, pares: [{ id: 0, ...this.info() }, ...[...this.pares.values()].map(p => ({ id: p.id, nome: p.nome, look: p.look, cls: p.cls, hab: p.hab }))] });
      const ch = { t: 'ch', de: id, nome: m.nome, look: m.look, cls: m.cls, hab: m.hab };
      for (const [o, oid] of this.cons) if (oid !== id) o.send(ch);
      this.receber(ch); return;
    }
    const id = this.cons.get(c); if (id == null) return;
    m.de = id;
    for (const [o, oid] of this.cons) if (oid !== id) o.send(m);
    this.receber(m);
  }
  enviar(m) {
    try { if (this.anfitriao) { m.de = 0; for (const c of this.cons.keys()) c.send(m); } else this.rede.con.send(m); } catch { /* conexão caindo: o 'close' cuida */ }
  }
  ev(t, o) { if (this.acompanhado()) this.enviar({ t, a: this.G.area, ...o }); }
  sair() { this.rede?.fechar(); this.fechado = true; if (this.G.mp === this) this.G.mp = null; }
  caiu() { if (this.fechado) return; this.sair(); this.G.ui.toast('A sala fechou. Você segue o caminho sozinho; o que conquistou continua com você.', 6000); }

  chegou(id, m, quieto) {
    const h = novoHeroi(0, 0, 5); h.a = null; h.tx = 0; h.ty = 0; h.novo = true;
    this.pares.set(id, { id, nome: m.nome || 'Peregrino', look: m.look || {}, cls: m.cls, hab: m.hab || {}, arma: CLASSES[m.cls]?.arma || 'espada', h, visto: 0 });
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
    this.fxN = Math.max(0, this.fxN - dt * 50);
    // posse da área
    const outros = la.filter(p => p.h.dn);
    if (this.souDono) { if (outros.some(p => p.id < this.eu)) this.souDono = false; }
    else if (outros.length) this.semDono = 0;
    else { this.semDono += dt; if (this.semDono > 0.5 && la.every(p => p.id > this.eu || this.semDono > 1.5)) { this.souDono = true; this.semDono = 0; } }
    if (!this.souDono) for (const e of G.inimigos) if (e.sx != null) { e.x = damp(e.x, e.sx, 24, dt); e.y = damp(e.y, e.sy, 24, dt); }
    if (!this.pares.size) return;
    if ((this.tE -= dt) <= 0) { this.tE = 0.05; this.enviar(this.estado()); }
    if ((this.tI -= dt) <= 0) { this.tI = 5; this.enviar({ t: 'inf', ...this.info() }); }
    if (this.souDono && la.length && (this.tW -= dt) <= 0) { this.tW = 0.066; this.enviar(this.mundo()); }
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
    return { t: 'w', a: G.area, i: G.inimigos.map(e => copia(id(e))), ti: G.tiros.filter(t => !t.amigo).map(t => copia(id(t))), z: G.zonas.filter(z => !z.amigo).map(z => copia(id(z))),
      g: { luta: !!G.luta, puxao: G.puxao, ea: G.escuroAlvo || 0, vento: G.vento, congela: !!G.congela } };
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
    const g = m.g; G.puxao = g.puxao || null; G.escuroAlvo = g.ea; G.vento = g.vento || null; G.congela = g.congela;
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

  receber(m) {
    const G = this.G, par = this.pares.get(m.de);
    switch (m.t) {
      case 'ch': if (!par && m.de !== this.eu) this.chegou(m.de, m); return;
      case 'sx': this.saiu(m.id); return;
      case 'inf': if (par) { par.nome = m.nome; par.look = m.look || {}; par.cls = m.cls; par.hab = m.hab || {}; par.arma = CLASSES[m.cls]?.arma || 'espada'; } return;
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
      case 'qz': { const b = ini(m.b) || G.chefe; if (!b || G.ui.blocking) { this.ev('qr', { ok: null }); break; } G.perguntaDoChefe(b, m.p).then(ok => this.ev('qr', { ok })); break; }
      case 'qr': this.resp?.set(m.de, m.ok); break;
      case 'qf': G.respostaDoGrupo(m.ok); break;
      case 'fx': {
        const f = m.f; this.mudo = true;
        try {
          if (f[0] === 'e') G.efeito(f[1], f[2], f[3], f[4]);
          else if (f[0] === 't') G.textoEm(f[1], f[2], f[3], f[4], f[5]);
          else if (f[0] === 'g') G.grito(f[1]);
          else if (f[0] === 'f') { const b = ini(f[1]); if (b) G.fala(b, f[2]); }
          else if (f[0] === 'p' && G.fx[f[1]]) G.fx[f[1]](f[2], f[3], f[4], f[5]);
        } finally { this.mudo = false; }
        break;
      }
    }
  }

  // onde está cada companheiro, para o menu
  lista() { return [...this.pares.values()].map(p => ({ id: p.id, nome: p.nome, area: p.h.a, onde: p.h.a ? areaDef(p.h.a).nome : '…', vida: p.h.vida, vidaMax: p.h.vidaMax })); }
}
