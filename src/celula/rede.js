// A sala da célula: quantos peregrinos vierem, pelo mesmo link. Cada um joga a PRÓPRIA partida (sem atraso de rede);
// a sala junta o que é divertido fazer junto:
//   • VOTAÇÃO DOS ROLOS (como Kahoot / Among Us): alguém abre um rolo → a pergunta aparece para TODOS, o jogo congela para
//     todos, cada um vota, a sala vê os votos chegando; no fim aparece quem votou em quê. Vale a maioria (empate = erro).
//     Acertou: o selo do rolo vale para todos que estão naquela página. Errou: monstros para o grupo inteiro.
//   • FRUTOS NO CHÃO: cada página tem frutos; quem pega primeiro pega para a célula (some para todos). O anfitrião decide.
//   • os outros aparecem como "fantasmas" (meio transparentes, com o nome) na mesma página, e o placar da célula.
// Quem manda é o ANFITRIÃO: de preferência o TELÃO do líder (um PC ou TV que só segura a sala e mostra o placar e as
// votações em tela grande, sem jogar). Sem telão, o primeiro que abriu o link segura a sala enquanto joga; se ele cair,
// os outros religam e o primeiro que não acha ninguém vira o anfitrião (com o placar que já tinha).
// Estabilidade: tudo o que o anfitrião faz roda por mensagens e por setInterval (não depende do desenho da tela, que o
// navegador pausa em segundo plano); mensagens grandes vão em pedaços; filas cheias descartam posições, nunca votos.
import { ligar, manda, junta, novoCodigo, limparCodigo } from '../caminho/juntos.js';
import { novoHeroi, damp } from '../caminho/heroi.js';
import { CLASSES } from '../data/classes.js';

const PREFIXO = 'peregrinos-celula-', MAX_FANTASMAS = 12, HZ = 0.2, VOTO_S = 20, REVELA_S = 5, GERACOES = 6;
// a sala tem "gerações": quando o anfitrião cai (o celular foi para o WhatsApp e o sistema congelou a aba), quem assume abre
// a geração seguinte com o mesmo código, sem esperar o servidor soltar o nome antigo. Quem chega pelo link procura da 0 em diante.
const nomeSala = (cod, g) => cod + (g ? '-' + g : '');
export { novoCodigo, limparCodigo };

// o retrato enxuto do peregrino: só o que o desenho precisa (posição, pose, golpe, lâmpada)
const NUM = ['x', 'y', 'vx', 'vy', 'face', 'vig', 'dashT', 'orando', 'lampA', 'desliza', 'passo', 'vida', 'vidaMax', 'sq', 'stunT', 'oleoFrac', 'inv'];
function retrato(p) {
  const r = [];
  for (const k of NUM) { const v = p[k]; r.push(typeof v === 'number' ? Math.round(v * 10) / 10 : 0); }
  r.push((p.chao ? 1 : 0) | (p.lamp ? 2 : 0) | (p.morto ? 4 : 0) | (p.rasteiro ? 8 : 0));
  r.push(p.atk ? [p.atk.dir || 'lado', Math.round((p.atk.t || 0) * 100) / 100, p.atk.dur || 0.3, p.atk.face || p.face] : 0);
  return r;
}
function aplicar(h, r) {
  NUM.forEach((k, i) => { h[k] = r[i]; });
  const b = r[NUM.length]; h.chao = !!(b & 1); h.lamp = !!(b & 2); h.morto = !!(b & 4); h.rasteiro = !!(b & 8);
  const a = r[NUM.length + 1]; h.atk = a ? { dir: a[0], t: a[1], dur: a[2], face: a[3], semCaixa: true } : null;
}
const embaralha = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };

// uma pergunta pronta para a votação: opções embaralhadas e o índice da certa
export function pacoteQuiz(q) { const op = embaralha(q.a); return { q: q.q, op, certa: op.indexOf(q.a[0]), porque: q.porque || '' }; }
// a apuração: a mais votada vence; empate ou ninguém votou = erro (é para pensar junto, não chutar)
export function apurar(n, certa) {
  const max = Math.max(0, ...n), topo = n.map((v, i) => v === max ? i : -1).filter(i => i >= 0);
  const venc = max > 0 && topo.length === 1 ? topo[0] : -1;
  return { venc, certo: venc === certa, empate: max > 0 && topo.length > 1 };
}

export class Rede {
  constructor(eu, o = {}) {
    this.eu = eu; // { nome, look, cls }
    this.telao = !!o.telao; // o telão do líder: segura a sala, não joga e não vota
    this.id = -1; this.anfitriao = false; this.codigo = ''; this.local = false; this.fechado = false;
    this.lista = new Map(); // id → { id, nome, look, cls, pg, visto, pts, telao }
    this.fant = new Map(); // id → { h (herói interpolado), a, t, r }
    this.cons = new Map(); // (anfitrião) conexão → id
    this.prox = 1; this.meuPg = {}; this.ultimo = performance.now();
    this.frutos = {}; // 'area#k' → nome de quem pegou
    this.fila = []; this.quiz = null; this.nQuiz = 0; // (anfitrião) votações
    this.aoAviso = null; this.aoMudar = null; this.aoQuiz = null; this.aoVotos = null; this.aoResultado = null; this.aoFruto = null;
    this.ger = 0; this.coop = false; this.aoJx = null; this.areaDe = new Map(); this.nE = new Map(); this.tPulso = performance.now();
    this.relogio = setInterval(() => this.pulso(), 200); // independente do desenho: segue mesmo com a aba em segundo plano
  }
  get total() { return [...this.lista.values()].filter(q => !q.telao).length; }
  link() { return location.origin + location.pathname + '?sala=' + this.codigo + (this.local ? '&redelocal' : ''); }

  // entra na sala do código; se ninguém estiver nela, abre (vira o anfitrião). O telão só abre.
  async conectar(codigo, local = false) {
    this.codigo = limparCodigo(codigo) || novoCodigo(); this.local = local;
    if (this.telao) { await this.abrir(); return this; }
    for (let tentativa = 0; tentativa < 3; tentativa++) {
      if (await this.procurar(0)) return this;
      for (let g = 0; g < GERACOES; g++) { try { await this.abrir(g); return this; } catch (e) { if (!/em uso/.test(e.message || '')) { if (tentativa === 2) throw e; break; } } } // o nome está preso por um anfitrião congelado: a geração seguinte
      await new Promise(r => setTimeout(r, 500 + Math.random() * 1200)); // espera um pouco: outro pode estar virando o anfitrião
    }
    throw new Error('Não deu para entrar na sala.');
  }
  // procura a sala da geração g em diante; entra na primeira que responder
  async procurar(g0) { for (let g = g0; g < GERACOES; g++) { if (this.fechado) return false; try { await this.entrar(g); return true; } catch { /* não há anfitrião nesta geração */ } } return false; }
  async abrir(g = this.ger) {
    const antes = new Map(this.lista);
    this.rede = await ligar(nomeSala(this.codigo, g), true, this.local, {
      entra: () => {},
      msg: (c, m) => { m = junta(m); if (!m) return; try { this.doAnfitriao(c, m); } catch (e) { console.error('[celula]', e); } },
      sai: c => { const id = this.cons.get(c); if (id == null) return; this.cons.delete(c); this.saiu(id); this.paraTodos({ t: 'sx', id }); this.conferirVotos(); }
    }, PREFIXO);
    this.anfitriao = true; this.ger = g; this.id = 0; this.lista.clear(); this.fant.clear(); this.areaDe.clear(); this.tPulso = performance.now();
    this.lista.set(0, { id: 0, ...this.eu, telao: this.telao, pg: this.meuPg, pts: antes.get(this.id)?.pts || 0, visto: performance.now() });
    this.prox = Math.max(1, ...[...antes.keys()].map(k => k + 1)) + 50; // ids novos não colidem com os que voltam
    this.aoMudar?.();
  }
  async entrar(g = this.ger) {
    let ok, erro; const bem = new Promise((a, b) => { ok = a; erro = b; });
    const rede = await ligar(nomeSala(this.codigo, g), false, this.local, {
      msg: (_, m) => { if (this.rede !== rede && m?.t !== 'bem') return; m = junta(m); if (!m) return; this.ultimo = performance.now(); if (m.t === 'bem') { this.rede = rede; this.id = m.id; this.ger = m.ger ?? g; ok(); } try { this.receber(m); } catch (e) { console.error('[celula]', e); } },
      sai: () => { if (this.rede === rede) this.religar(); }
    }, PREFIXO);
    this.rede = rede;
    manda(rede.con, { t: 'oi', ...this.eu, pg: this.meuPg, pts: this.lista.get(this.id)?.pts || 0 });
    const tempo = setTimeout(() => erro(new Error('O anfitrião não respondeu.')), 8000);
    try { await bem; } catch (e) { try { rede.fechar(); } catch { /* */ } if (this.rede === rede) this.rede = null; throw e; } finally { clearTimeout(tempo); }
    this.anfitriao = false; this.ultimo = performance.now();
  }
  // A sala caiu (o anfitrião saiu ou a internet piscou). Para não nascerem dois anfitriões, há uma ordem: o primeiro da
  // lista (o mais antigo na sala, fora o anfitrião que caiu e o telão) tenta abrir na hora; os outros esperam a vez dele e
  // entram. Só se ninguém aparecer por várias rodadas é que os outros tentam abrir também. Insiste por até 2 minutos.
  async religar(exAnfitriao = false) {
    if (this.fechado || this.religando || (this.anfitriao && !exAnfitriao)) return; this.religando = true;
    this.aoAviso?.('A sala piscou. Reconectando…');
    const quiz = this.quizLocal; if (quiz) { this.quizLocal = null; this.aoResultado?.({ id: quiz.id, cancelado: true }); } // a votação que estava na tela termina sem efeito
    const fila = [...this.lista.values()].filter(q => q.id !== 0 && !q.telao).map(q => q.id).sort((a, b) => a - b);
    const vez = exAnfitriao ? 99 : Math.max(0, fila.indexOf(this.id)), t0 = Date.now(), g = this.ger + 1;
    try { this.rede?.fechar(); } catch { /* */ } this.rede = null; this.anfitriao = false;
    this.fant.clear(); this.cons.clear();
    for (let rodada = 0; !this.fechado && Date.now() - t0 < 120000; rodada++) {
      try {
        if (vez === 0 || rodada >= 3 + Math.min(vez, 6) * 2) { try { await this.abrir(g + Math.floor(rodada / 8)); } catch (e) { if (!/em uso/.test(e.message || '')) throw e; if (!await this.procurar(g)) throw e; } }
        else { await new Promise(r => setTimeout(r, 1200 + Math.min(vez, 8) * 700)); if (!await this.procurar(exAnfitriao ? 0 : g)) throw new Error('ninguém ainda'); }
        this.religando = false; this.aoAviso?.(this.anfitriao ? 'Você agora segura a sala ' + this.codigo + '.' : 'De volta à sala ' + this.codigo + '.'); this.aoMudar?.(); return;
      } catch { await new Promise(r => setTimeout(r, 1200 + Math.random() * 1000)); }
    }
    this.religando = false;
    if (!this.fechado) this.aoAviso?.('Sem sala por enquanto: você continua jogando sozinho.');
  }
  sair() { this.fechado = true; clearInterval(this.relogio); clearTimeout(this.tQuiz); try { this.rede?.fechar(); } catch { /* */ } }

  // ---------- anfitrião ----------
  doAnfitriao(c, m) {
    if (m.t === 'oi') {
      const id = this.prox++; this.cons.set(c, id);
      const q = { id, nome: String(m.nome || 'Peregrino').slice(0, 16), look: m.look || {}, cls: m.cls, pg: m.pg || {}, pts: m.pts || 0, visto: performance.now() };
      this.lista.set(id, q);
      manda(c, { t: 'bem', id, ger: this.ger, l: this.rol(), fr: this.frutos, qz: this.quiz && this.quizParaRede(), vc: this.quiz && this.contagem() });
      this.paraTodos({ t: 'ch', q: this.ficha(q) }, c);
      this.aoAviso?.(q.nome + ' entrou na sala.'); this.aoMudar?.();
      return;
    }
    const id = this.cons.get(c); if (id == null) return;
    const q = this.lista.get(id); if (q) q.visto = performance.now();
    switch (m.t) {
      case 'p': this.posicao(id, m.a, m.r); break;
      case 'pg': if (q) q.pg = m.pg; this.paraTodos({ t: 'pg', id, pg: m.pg }, c); this.aoMudar?.(); break;
      case 'av': { const txt = String(m.txt || '').slice(0, 120); this.paraTodos({ t: 'av', txt }, c); this.aoAviso?.(txt); break; }
      case 'qz?': this.pedirQuiz(id, m); break;
      case 'vt': this.votar(id, m.id, m.i); break;
      case 'fr?': this.pegarFruto(id, m.k, c); break;
      case 'jx': this.retransmitir(id, m.m, c); break;
    }
  }
  paraTodos(m, menos) { for (const c of this.cons.keys()) if (c !== menos) { try { manda(c, m); } catch { /* um caindo não derruba os outros */ } } }
  ficha(q) { return { id: q.id, nome: q.nome, look: q.look, cls: q.cls, pg: q.pg, pts: q.pts || 0, telao: !!q.telao }; }
  rol() { return [...this.lista.values()].map(q => this.ficha(q)); }
  // o batimento: a cada 200 ms (mesmo em segundo plano); posições em lotes, presença, quem sumiu, a votação em curso
  pulso() {
    if (this.fechado || !this.rede) return;
    const agora = performance.now(), parado = agora - this.tPulso; this.tPulso = agora;
    // o anfitrião ficou congelado (o celular foi para outro app): os outros já escolheram outro. Devolve o posto e entra como convidado.
    if (this.anfitriao && !this.telao && parado > 6000 && this.cons.size + (this.lista.size - 1) > 0) { this.religar(true); return; }
    if (this.anfitriao) {
      this.lotes();
      if ((this.nP = (this.nP || 0) + 1) % 10 === 0) { // a cada 2 s: o placar inteiro (também serve de "estou vivo")
        for (const [c, id] of [...this.cons]) { const q = this.lista.get(id); if (q && agora - q.visto > 15000) { this.cons.delete(c); try { c.close(); } catch { /* */ } this.saiu(id); this.paraTodos({ t: 'sx', id }); this.conferirVotos(); } }
        this.paraTodos({ t: 'rol', l: this.rol(), fr: this.frutos });
      }
    } else {
      if ((this.nP = (this.nP || 0) + 1) % 10 === 0) try { manda(this.rede.con, { t: 'vivo' }); } catch { /* */ }
      if (agora - this.ultimo > 9000) { this.ultimo = agora; this.religar(); }
    }
  }

  // ---------- todos ----------
  receber(m) {
    switch (m.t) {
      case 'bem': this.lista.clear(); for (const q of m.l) this.lista.set(q.id, { ...q, visto: performance.now() }); this.lista.set(this.id, { id: this.id, ...this.eu, pg: this.meuPg, pts: this.lista.get(this.id)?.pts || 0 });
        this.frutos = m.fr || {}; this.aoFruto?.(null); if (m.qz) this.chegouQuiz(m.qz, m.vc); this.aoMudar?.(); break;
      case 'rol': { const meus = this.lista.get(this.id); this.lista.clear(); for (const q of m.l) this.lista.set(q.id, { ...q, visto: performance.now() }); if (meus && !this.lista.has(this.id)) this.lista.set(this.id, meus);
        const novos = Object.keys(m.fr || {}).some(k => !this.frutos[k]); this.frutos = m.fr || {}; if (novos) this.aoFruto?.(null); this.aoMudar?.(); break; }
      case 'ch': this.lista.set(m.q.id, { ...m.q, visto: performance.now() }); this.aoAviso?.(m.q.nome + ' entrou na sala.'); this.aoMudar?.(); break;
      case 'sx': this.saiu(m.id); break;
      case 'pg': { const q = this.lista.get(m.id); if (q) { q.pg = m.pg; this.aoMudar?.(); } break; }
      case 'av': this.aoAviso?.(m.txt); break;
      case 'ps': for (const [id, a, r] of m.l) if (id !== this.id) this.posicao(id, a, r); break;
      case 'qz': this.chegouQuiz(m.q); break;
      case 'vc': if (this.quizLocal?.id === m.id) this.aoVotos?.(m); break;
      case 'qr': this.resultado(m); break;
      case 'fr': this.frutos[m.k] = m.nome; this.aoFruto?.(m); break;
      case 'fila': this.aoAviso?.(m.txt); break;
      case 'jx': this.aoJx?.(m.m); break;
    }
  }
  saiu(id) { const q = this.lista.get(id); if (!q) return; this.lista.delete(id); this.fant.delete(id); this.aoAviso?.(q.nome + ' saiu da sala.'); this.aoMudar?.(); }
  posicao(id, a, r) {
    let f = this.fant.get(id); if (!f) { f = { h: novoHeroi(r[0], r[1], 5), a, t: 0 }; f.h.tx = r[0]; f.h.ty = r[1]; this.fant.set(id, f); }
    const longe = f.a !== a || Math.hypot(f.h.x - r[0], f.h.y - r[1]) > 300;
    f.a = a; f.t = performance.now(); f.r = r; const x = f.h.x, y = f.h.y; aplicar(f.h, r); f.h.tx = r[0]; f.h.ty = r[1];
    if (!longe) { f.h.x = x; f.h.y = y; }
  }
  progresso(pg) {
    this.meuPg = pg; const q = this.lista.get(this.id); if (q) q.pg = pg;
    try { if (this.anfitriao) this.paraTodos({ t: 'pg', id: 0, pg }); else if (this.rede?.con) manda(this.rede.con, { t: 'pg', pg }); } catch { /* */ }
    this.aoMudar?.();
  }
  aviso(txt) { try { if (this.anfitriao) this.paraTodos({ t: 'av', txt }); else if (this.rede?.con) manda(this.rede.con, { t: 'av', txt }); } catch { /* */ } }

  // a cada quadro do jogo: manda o meu retrato e interpola os fantasmas
  tick(G, dt) {
    const agora = performance.now();
    for (const f of this.fant.values()) { f.h.x = damp(f.h.x, f.h.tx, 14, dt); f.h.y = damp(f.h.y, f.h.ty, 14, dt); }
    for (const [id, f] of this.fant) if (agora - f.t > 4000) this.fant.delete(id);
    if (!this.rede || this.fechado || !G) return;
    if ((this.tE = (this.tE || 0) - dt) <= 0) {
      this.tE = HZ; if (this.coop) return; const r = retrato(G.eu || G.p), a = G.area;
      if (this.anfitriao) this.posicao(0, a, r); else { try { if ((this.rede.con?.dataChannel?.bufferedAmount || 0) < 64000) manda(this.rede.con, { t: 'p', a, r }); } catch { /* */ } }
    }
  }
  lotes() {
    const porArea = new Map(), agora = performance.now();
    for (const [id, f] of this.fant) { if (agora - f.t > 1500 || !f.r) continue; if (!porArea.has(f.a)) porArea.set(f.a, []); porArea.get(f.a).push([id, f.a, f.r]); }
    for (const [c, id] of this.cons) {
      const minha = this.fant.get(id); if (!minha) continue;
      const l = (porArea.get(minha.a) || []).filter(x => x[0] !== id).slice(0, MAX_FANTASMAS); if (!l.length) continue;
      try { if ((c.dataChannel?.bufferedAmount || 0) < 120000) manda(c, { t: 'ps', l }); } catch { /* */ }
    }
  }
  fantasmas(area) {
    const r = []; let n = 0;
    for (const [id, f] of this.fant) {
      if (id === this.id || f.a !== area || f.h.morto) continue; const q = this.lista.get(id); if (!q) continue;
      r.push({ corpo: f.h, look: q.look, cls: q.cls, arma: CLASSES[q.cls]?.arma || 'espada', hab: {}, nome: q.nome, fantasma: true });
      if (++n >= MAX_FANTASMAS) break;
    }
    return r;
  }
  placar() {
    return [...this.lista.values()].filter(q => !q.telao).map(q => ({ id: q.id, nome: q.nome, cls: q.cls, look: q.look, eu: q.id === this.id, chefes: q.pg?.chefes || 0, pagina: q.pg?.pagina || 1, tempo: q.pg?.tempo || 0, quedas: q.pg?.quedas || 0, fim: !!q.pg?.fim, pts: q.pts || 0, frutos: Object.values(this.frutos).filter(n => n === q.nome).length }))
      .sort((a, b) => b.chefes - a.chefes || (a.fim && b.fim ? a.tempo - b.tempo : 0) || b.pts - a.pts || a.quedas - b.quedas || a.tempo - b.tempo);
  }

  // ---------- o co-op (src/celula/coop.js): mensagens do "Caminhar juntos", retransmitidas pelo anfitrião ----------
  // O retrato de cada um ('e') vai para todos (para todos saberem em que página cada um está), mas só 4 vezes por segundo para
  // quem está noutra página; o resto (o mundo da área, golpes, efeitos) só vai para quem está na mesma página.
  jx(m) {
    if (this.anfitriao) this.retransmitir(this.id, m, null);
    else if (this.rede?.con) { const leve = m.t === 'w' || m.t === 'e' || m.t === 'fx'; if (leve && (this.rede.con.dataChannel?.bufferedAmount || 0) > 150000) return; try { manda(this.rede.con, { t: 'jx', m }); } catch { /* */ } }
  }
  retransmitir(de, m, origem) {
    if (!m || typeof m !== 'object') return; m.de = de;
    if (m.t === 'e' && m.a) this.areaDe.set(de, m.a);
    const n = (this.nE.get(de) || 0) + 1; this.nE.set(de, n);
    const env = { t: 'jx', m };
    for (const [c, id] of this.cons) {
      if (c === origem || this.lista.get(id)?.telao) continue;
      const mesma = !m.a || this.areaDe.get(id) === m.a || !this.areaDe.has(id);
      if (!mesma && (m.t !== 'e' || n % 3)) continue;
      const leve = m.t === 'w' || m.t === 'e' || m.t === 'fx'; if (leve && (c.dataChannel?.bufferedAmount || 0) > 200000) continue;
      try { manda(c, env); } catch { /* */ }
    }
    if (de !== this.id && !this.telao) this.aoJx?.(m);
  }

  // ---------- frutos: o primeiro que pede leva ----------
  pedirFruto(k) {
    if (this.frutos[k]) return;
    if (this.anfitriao) this.pegarFruto(0, k, null); else try { manda(this.rede.con, { t: 'fr?', k }); } catch { /* */ }
  }
  pegarFruto(id, k, c) {
    if (this.frutos[k]) { if (c) manda(c, { t: 'fr', k, nome: this.frutos[k] }); return; } // já era de outro: o pedido volta com o nome de quem levou
    const nome = this.lista.get(id)?.nome || '?'; this.frutos[k] = nome;
    const m = { t: 'fr', k, nome }; this.paraTodos(m); this.aoFruto?.(m); this.aoMudar?.();
  }

  // ---------- a votação ----------
  // alguém abriu um rolo: entra na fila; uma votação por vez, para todos
  pedirVotacao(pac, extra) {
    const m = { t: 'qz?', pac, ...extra };
    if (this.anfitriao) this.pedirQuiz(this.id, m); else try { manda(this.rede.con, m); } catch { return false; }
    return true;
  }
  pedirQuiz(id, m) {
    const quem = this.lista.get(id)?.nome || 'Alguém';
    if (m.tipo !== 'chefe' && ((this.quiz && this.quiz.dono === id && this.quiz.tipo !== 'chefe') || this.fila.some(f => f.dono === id && f.tipo !== 'chefe'))) return; // um rolo por vez por peregrino (a pergunta do chefe sempre entra)
    this.fila.push({ dono: id, quem, pac: m.pac, area: m.area, rolo: m.rolo, tipo: m.tipo || 'rolo', titulo: String(m.titulo || '').slice(0, 80) });
    if (this.quiz) { const c = [...this.cons].find(([, i]) => i === id)?.[0]; const txt = 'Na fila da votação: espere a pergunta de ' + this.quiz.quem + ' terminar.'; if (c) manda(c, { t: 'fila', txt }); else if (id === this.id) this.aoAviso?.(txt); }
    else this.proximoQuiz();
  }
  proximoQuiz() {
    const f = this.fila.shift(); if (!f) return;
    this.quiz = { ...f, id: ++this.nQuiz + '-' + Date.now() % 100000, votos: new Map(), ate: Date.now() + VOTO_S * 1000 };
    const m = this.quizParaRede(); this.paraTodos({ t: 'qz', q: m }); this.chegouQuiz(m);
    clearTimeout(this.tQuiz); this.tQuiz = setTimeout(() => this.encerrar(), VOTO_S * 1000 + 300);
  }
  quizParaRede() { const z = this.quiz; return { id: z.id, quem: z.quem, dono: z.dono, area: z.area, rolo: z.rolo, tipo: z.tipo, titulo: z.titulo, q: z.pac.q, op: z.pac.op, resta: Math.max(0, z.ate - Date.now()) }; }
  contagem() { const z = this.quiz, n = z.pac.op.map(() => 0); for (const i of z.votos.values()) if (n[i] != null) n[i]++; return { t: 'vc', id: z.id, n, votaram: z.votos.size, total: this.total }; }
  votar(id, qid, i) {
    const z = this.quiz; if (!z || z.id !== qid || z.votos.has(id) || this.lista.get(id)?.telao || !(i >= 0 && i < z.pac.op.length)) return;
    z.votos.set(id, i); const c = this.contagem(); this.paraTodos(c); this.aoVotos?.(c);
    this.conferirVotos();
  }
  conferirVotos() { const z = this.quiz; if (z && z.votos.size >= this.total && this.total > 0) { clearTimeout(this.tQuiz); this.tQuiz = setTimeout(() => this.encerrar(), 900); } }
  encerrar() {
    const z = this.quiz; if (!z) return; this.quiz = null;
    const n = z.pac.op.map(() => 0); for (const i of z.votos.values()) n[i]++;
    const r = apurar(n, z.pac.certa), votos = z.pac.op.map(() => []);
    for (const [id, i] of z.votos) { const q = this.lista.get(id); if (!q) continue; votos[i].push(q.nome); if (i === z.pac.certa) q.pts = (q.pts || 0) + 100; }
    const m = { t: 'qr', id: z.id, n, votos, certa: z.pac.certa, venc: r.venc, certo: r.certo, empate: r.empate, porque: z.pac.porque, area: z.area, rolo: z.rolo, tipo: z.tipo, dono: z.dono, quem: z.quem };
    this.paraTodos(m); this.resultado(m);
    setTimeout(() => this.proximoQuiz(), REVELA_S * 1000 + 600); // a próxima pergunta só depois de todos verem o resultado
  }
  // aparece para mim (jogador ou telão)
  chegouQuiz(q, vc) { this.quizLocal = q; this.aoQuiz?.(q); if (vc) this.aoVotos?.(vc); }
  meuVoto(i) { const z = this.quizLocal; if (!z || this.telao) return; if (this.anfitriao) this.votar(this.id, z.id, i); else try { manda(this.rede.con, { t: 'vt', id: z.id, i }); } catch { /* */ } }
  resultado(m) { if (this.quizLocal?.id === m.id) this.quizLocal = null; this.aoResultado?.(m); }
}
