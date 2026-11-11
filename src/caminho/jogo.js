// O Caminho — remake de Peregrinos em vista lateral.
// Um peregrino, uma lâmpada e um Livro com as páginas cobertas de sombra. Cada área é uma passagem bíblica:
// os rolos precisam ser lidos (e entendidos) para abrir a porta do chefe, e cada chefe guarda uma peça da Armadura de Deus.
import { rand, clamp, lerp, TAU, pick, shuffle, weekId, h } from '../util.js';
import { input } from '../input.js';
import { config } from '../config.js';
import { sfx, music, audio } from '../audio.js';
import { vibrar } from '../gamepad.js';
import { net } from '../net.js';
import { viewSize } from '../zoom.js';
import { CLASSES } from '../data/classes.js';
import { BOSSES, ACUSACOES, FALSAS } from '../data/bestiary.js';
import { CINEMAS, CINEMA_CHEFE } from '../content/cinematicas.js';
import { TODAS } from '../content/index.js';
import { xpNeed, MAX_LEVEL, faseProg } from '../game/player.js';
import { drawPerson } from '../game/character-art.js';
import { T, CW, CH, gerarNivel, tileEm, ESPINHO, OCULTO, FALSA } from './nivel.js';
import { solido } from './corpo.js';
import { novoHeroi, atualizarHeroi, desenharHeroi, ARMAS, OLEO_USO, damp } from './heroi.js';
import { novoVicio, atualizarVicio, desenharVicio, vulneravel } from './bichos.js';
import { CHEFES, novoChefe, atualizarChefe, desenharChefe, danoNoChefe } from './chefes.js';
import { ARMADURA, RELIQUIAS, MUNDO, DIFICULDADES, areaDef, novoCaminho, semanaDe } from './dados.js';
import { tema, pintarFundo, pintarBlocos, pintarEnfeites, pintarLampioes, pintarLuz, corA } from './cena.js';
import { desenharObjeto } from './objetos.js';
import { abrirMenu, escolherFase, loja } from './menu.js';

const caixa = e => ({ x: e.x - e.w / 2, y: e.y - e.h, w: e.w, h: e.h });
const toca = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

export class Caminho {
  constructor(canvas, char, ui, onExit) {
    this.cv = canvas; this.g = canvas.getContext('2d'); this.char = char; this.ui = ui; this.onExit = onExit;
    const d = char.data;
    this.cm = d.caminho = { ...novoCaminho(), ...(d.caminho || {}) };
    d.cinemas = d.cinemas || []; d.verses = d.verses || []; d.licoes = d.licoes || []; d.kills = d.kills || {}; d.revisar = d.revisar || [];
    this.hab = this.cm.hab;
    this.T = 0; this.running = true; this.last = performance.now(); this.hitstop = 0; this.tremorA = 0; this.escuro = 0.4; this.escuroAlvo = 0;
    this.lentidao = 1; this.lentidaoAlvo = 1; this.fade = 1; this.luzCv = document.createElement('canvas');
    this.vista = { W: 0, H: 0, Z: 1, cam: { x: 0, y: 0 } };
    this.fx = criarFx(this);
    this.tipoArma = CLASSES[char.cls]?.arma || 'espada'; this.arma = ARMAS[this.tipoArma] || ARMAS.espada;
    this.onResize = () => this.resize(); addEventListener('resize', this.onResize); this.resize();
    document.body.classList.add('caminho'); input.perfil = 'caminho';
    this.botao = h('button', { id: 'cmMenu', 'aria-label': 'Menu', title: 'Menu (Esc)', onclick: () => this.menu() }, '☰');
    document.body.append(this.botao);
    this.padAntes = input.padAcoes; input.padAcoes = { menu: () => this.menu(), mapa: () => this.menu('mapa') };
    for (const [act, nome] of Object.entries({ dodge: 'Pular', lock: 'Passo Pronto', defend: 'Vigília', botija: 'Orar', skill: CLASSES[char.cls]?.skill.nome || 'Verso', attack: 'Golpe' })) { const b = document.querySelector(`[data-act="${act}"]`); if (b) { b.dataset.name = nome; b.title = nome; } }
    this.icones = [];
    for (const [act, simb] of Object.entries({ dodge: '⤒', lock: '»', defend: '🪔', botija: '🙏' })) { const b = document.querySelector(`[data-act="${act}"]`); if (b) { this.icones.push([b, [...b.childNodes], b.hidden]); b.replaceChildren(simb); b.hidden = false; } }
    this.entrar(this.cm.ebenezer?.area || 'refugio', { ebenezer: true });
    this.raf = requestAnimationFrame(t => this.loop(t));
  }

  destroy() {
    this.running = false; cancelAnimationFrame(this.raf); removeEventListener('resize', this.onResize);
    for (const [b, filhos, oculto] of this.icones) { b.replaceChildren(...filhos); b.hidden = oculto; }
    document.body.classList.remove('caminho', 'cm-dash'); input.perfil = null; input.padAcoes = this.padAntes; this.botao.remove(); music(null); this.ui.bossBar(null); this.ui.setInteract(null);
  }

  get dif() { return DIFICULDADES[this.cm.dif] || DIFICULDADES.provacao; }
  tem(rel) { return this.cm.eq.includes(rel) || (RELIQUIAS[rel]?.passiva && this.cm.reliquias.includes(rel)); }
  vidaMax() { return Math.max(3, 5 + (this.hab.couraca ? 2 : 0) + Math.floor(this.cm.mana / 3) + (this.tem('osso_bronze') ? 1 : 0) + this.dif.vidas); }
  oleoMax() { return this.tem('odre_novo') ? 132 : 99; }
  espacos() { return this.cm.reliquias.includes('coroa_restituida') ? 4 : 3; }
  danoBase() { return 10 * (1 + Math.min(0.6, (this.char.level - 1) * 0.03)); }
  raioLuz() { const o = this.p.oleo / this.oleoMax(), b = (this.tem('lamparina_abismo') ? 150 : 105) + o * 95; return b * (1 + this.p.lampA * 0.6); }

  resize() {
    const { W, H } = viewSize(), dpr = Math.min(2, devicePixelRatio || 1);
    this.cv.width = Math.round(W * dpr); this.cv.height = Math.round(H * dpr); this.cv.style.width = W + 'px'; this.cv.style.height = H + 'px';
    this.dpr = dpr; this.vista.W = W; this.vista.H = H; this.vista.Z = clamp(H / (CH * T), 0.5, 2.6);
  }

  async cinema(id, forcar = false) {
    const vistas = this.char.data.cinemas;
    if (!CINEMAS[id] || (!forcar && (vistas.includes(id) || config.cinemas === false))) return false;
    if (!vistas.includes(id)) vistas.push(id);
    const antes = audio.modo; music('cinema');
    await this.ui.cinema(id, { look: this.char.look });
    if (this.running) music(antes);
    return true;
  }

  /* ================= Áreas ================= */
  entrar(id, o = {}) {
    const def = areaDef(id), cm = this.cm;
    this.area = id; this.def = def; this.tm = tema(def.tema);
    const N = this.N = gerarNivel(def);
    N.revel = new Float32Array(N.w * N.h); N.desfeita = new Set(); N.portaAberta = false;
    this.inimigos = []; this.tiros = []; this.zonas = []; this.moedas = []; this.parts = []; this.textos = []; this.chefe = null; this.puxao = null; this.pecado = null;
    this.escuroAlvo = 0; this.lentidaoAlvo = 1; this.peso = 0; this.luta = false; this.venceu = false; this.usados = {}; this.perto = null;
    cm.selos[id] = cm.selos[id] || []; cm.est[id] = cm.est[id] || []; cm.seg[id] = cm.seg[id] || [];
    // objetos da área
    this.objs = N.objs.filter(ob => !(ob.tipo === 'segredo' && cm.seg[id].includes(ob.n)));
    for (const ob of this.objs) {
      if (ob.tipo === 'rolo') { ob.feito = cm.selos[id].includes(ob.n); ob.luz = 110; }
      if (ob.tipo === 'estacao') { ob.dados = def.estacoes[ob.n]; ob.feito = cm.est[id].includes(ob.dados.id); ob.luz = 90; }
      if (ob.tipo === 'npc' && def.npcs && !ob.nome) Object.assign(ob, def.npcs[ob.n]);
      if (ob.tipo === 'ebenezer') ob.luz = 150;
      if (ob.tipo === 'portal' || ob.tipo === 'segredo') ob.luz = 80;
    }
    if (cm.sacola?.area === id) this.objs.push({ tipo: 'sacola', x: cm.sacola.x, y: cm.sacola.y, luz: 70 });
    this.povoar();
    // onde o peregrino aparece
    let pos = N.inicio;
    const eb = this.objs.find(ob => ob.tipo === 'ebenezer');
    if (o.ebenezer && cm.ebenezer?.area === id && eb) pos = { x: eb.x - 40, y: eb.y };
    else if (o.portal) { const pt = this.objs.find(ob => ob.tipo === 'portal' && (ob.semana === o.portal || ob.mundo === o.portal)); if (pt) pos = { x: pt.x, y: pt.y }; }
    const antigo = this.p;
    this.p = novoHeroi(pos.x, pos.y - 1, this.vidaMax());
    this.p.oleo = o.manter && antigo ? antigo.oleo : Math.min(this.oleoMax(), OLEO_USO);
    if (o.manter && antigo) this.p.vida = Math.min(this.p.vidaMax, antigo.vida);
    this.usouSelo = false; this.usouCepa = false;
    this.vista.cam.x = pos.x - this.vista.W / this.vista.Z / 2; this.vista.cam.y = this.camYAlvo(this.vista.H / this.vista.Z); this.prenderCam();
    this.conferirPorta(true);
    this.fade = 1; this.t0 = this.T; this.ok = 0; this.err = 0; this.mortosAqui = 0;
    music(def.paz ? 'mundo' : 'fase');
    this.ui.bossBar(null);
    this.ui.banner(def.sem ? def.sem.titulo.toUpperCase() : 'PEREGRINOS', def.nome, def.sub);
    if (!o.quieto) this.chegada(def);
    this.salvar();
  }

  async chegada(def) {
    if (def.fase) { await this.cinema(def.sem.id); await this.cinema(def.sem.id + '-fase-' + def.fase.n); }
    else if (def.id === 'refugio' && !this.cm.visto.intro) {
      this.cm.visto.intro = 1;
      await this.cinema('caminho-prologo');
      await this.ui.dialog({ nome: 'Como caminhar', texto: this.textoControles(), acoes: [{ label: 'Entendi' }] });
    }
  }
  textoControles() {
    return input.touch
      ? 'Arraste o dedo à esquerda para andar. Botões: ⤒ pular · ⚔ golpear (com o direcional para cima ou para baixo) · 🛡 erguer a lâmpada (vigília) · 🫙 orar e recuperar um fôlego.\n\nErguer a lâmpada no instante do golpe é a DEFESA PERFEITA.'
      : 'A / D ou setas: andar · Espaço (ou Z): pular · J (ou X, ou clique): golpear — segure ↑ ou ↓ para golpear para cima e para baixo · Shift (ou L): erguer a lâmpada · H (ou Q): orar · K: verso da sua vocação · C: passo pronto (quando tiver os Calçados) · E: ler e falar · Esc: menu.\n\nErguer a lâmpada no instante do golpe é a DEFESA PERFEITA: devolve dardos e quebra a postura dos chefes. A luz também revela o que está escondido.';
  }

  // os vícios da área (voltam a cada descanso numa Pedra de Ebenézer)
  povoar() {
    const def = this.def;
    this.inimigos = this.inimigos.filter(e => e.kind === 'chefe');
    if (!def.inimigos) return;
    const esc = 1 + (def.fase?.nivel || 1) * 0.05, voadores = ['distracao', 'duvida', 'medo', 'vaidade'];
    this.N.spawns.forEach((s, i) => { const tipos = def.inimigos.filter(t => !!s.voa === voadores.includes(t)), lista = tipos.length ? tipos : def.inimigos; this.nascer(lista[i % lista.length], s.x, s.y + 14, false, esc); });
  }
  nascer(tipo, x, y, daLuta, esc = 1) { const e = novoVicio(tipo, x, y, esc); e.daLuta = daLuta; this.inimigos.push(e); return e; }

  conferirPorta(quieto) {
    const d = this.def, cm = this.cm;
    if (!d.chefe) return;
    const ok = !d.fase || (cm.selos[this.area].length >= (d.rolos || 3) && (d.estacoes || []).every(e => cm.est[this.area].includes(e.id)));
    if (ok && !this.N.portaAberta && !this.luta) { this.N.portaAberta = true; if (!quieto) { sfx('gate'); this.ui.toast('Os três selos brilham. A porta do chefe se abriu.', 4500); this.tremor(5); } }
  }

  /* ================= Laço ================= */
  loop(now) {
    if (!this.running) return;
    const dt = Math.min(0.033, (now - this.last) / 1000); this.last = now;
    if (!this.ui.blocking && !document.hidden) this.update(dt);
    this.render();
    this.raf = requestAnimationFrame(t => this.loop(t));
  }

  lerControles() {
    const m = input.move(), c = this.ctl = {};
    c.mx = Math.abs(m.x) > 0.3 ? Math.sign(m.x) : 0; c.my = Math.abs(m.y) > 0.45 ? Math.sign(m.y) : 0;
    c.pulo = input.consume('dodge'); c.puloSeg = input.isHeld('dodge');
    c.atk = input.consume('attack'); c.atkSeg = input.isHeld('attack');
    c.dash = input.consume('dash') || input.consume('lock');
    c.lampP = input.consume('defend'); c.lamp = input.isHeld('defend');
    c.orar = input.isHeld('botija') || input.isHeld('item1'); input.consume('botija'); input.consume('item1');
    c.verso = input.consume('skill'); c.interagir = input.consume('interact');
    if (input.consume('menu') || input.consume('escape')) this.menu();
    if (input.consume('map')) this.menu('mapa');
    for (const a of ['item2', 'mount', 'chat']) input.consume(a);
  }

  update(dt) {
    this.lerControles();
    this.fade = Math.max(0, this.fade - dt * 1.6);
    if (this.hitstop > 0) { this.hitstop -= dt; this.atualizarFx(dt * 0.2); return; }
    this.T += dt; this.char.data.stats.playtime = (this.char.data.stats.playtime || 0) + dt;
    const p = this.p, N = this.N;
    this.escuro = damp(this.escuro, Math.max(this.tm.escuro, this.escuroAlvo || 0), 2, dt);
    this.lentidao = damp(this.lentidao, this.lentidaoAlvo * (1 - Math.min(0.3, this.peso * 0.06)) * (this.tem('sandalias_mensageiro') ? 1.1 : 1), 6, dt);
    p.oleoFrac = p.oleo / this.oleoMax(); document.body.classList.toggle('cm-dash', !!this.hab.calcados);
    if (this.tem('orvalho_ceu') && p.oleo < OLEO_USO) p.oleo = Math.min(OLEO_USO, p.oleo + 1.6 * dt);
    if (p.morto) { this.mortoT -= dt; if (this.mortoT <= 0) this.renascer(); }
    else {
      if (this.puxao && !p.dashT) p.x += Math.sign(this.puxao.x - p.x) * this.puxao.f * dt * (Math.abs(this.puxao.x - p.x) > 30 ? 1 : 0);
      if (this.tem('cinto_compaixao') && p.orando > 0) p.orando += dt * 0.45;
      atualizarHeroi(this, dt);
      if (p.investida > 0) { p.investida -= dt; this.golpear(caixa({ ...p, w: 46 }), this.danoBase() * 2.4, this.investidaAtk); }
    }
    // a lâmpada revela
    if (p.lamp) this.revelar();
    for (let i = 0; i < N.revel.length; i++) if (N.revel[i] > 0) N.revel[i] -= dt;
    // vícios e chefe
    for (const e of this.inimigos) {
      if (e.kind === 'chefe') atualizarChefe(this, e, dt);
      else if (Math.abs(e.x - p.x) < 900 && Math.abs(e.y - p.y) < 560) atualizarVicio(this, e, dt);
      if (!p.morto && e.hp > 0 && !e.morrendo && !(e.alpha < 0.5) && (e.kind !== 'vicio' || e.vista > 0.5) && toca(caixa(p), encolhe(caixa(e), e.kind === 'chefe' ? 0.72 : 0.8))) {
        const r = this.ferirHeroi(e.kind === 'chefe' && e.perigo ? 1 : 1, e);
        if (r === true && e.ai === 'ladrao' && !e.fugindo) { const q = Math.min(this.char.data.gold, 15); this.char.data.gold -= q; e.roubo = q; e.fugindo = 5; if (q) this.textoEm(p.x, p.y - 50, '−' + q + ' denários!', '#FFD23F'); }
      }
    }
    this.inimigos = this.inimigos.filter(e => e.kind === 'chefe' ? !e.fora : e.hp > 0 || (!e.sumiu && this.matar(e), false));
    this.atualizarTiros(dt); this.atualizarZonas(dt); this.atualizarMoedas(dt); this.atualizarFx(dt);
    if (this.pecado) this.atualizarPecado(dt);
    this.gatilhos(); this.interacoes();
    // câmera
    const v = this.vista, vw = v.W / v.Z, vh = v.H / v.Z;
    v.cam.x = damp(v.cam.x, p.x + p.face * 46 - vw / 2, 6, dt); v.cam.y = damp(v.cam.y, this.camYAlvo(vh), 6, dt); this.prenderCam();
    this.tremorA = Math.max(0, this.tremorA - dt * 34);
    if (this.chefe) this.ui.bossBar(this.chefe.d.nome, Math.max(0, this.chefe.hp / this.chefe.max), this.chefe.d.titulo, this.chefe.post / 100);
    this.salvaT = (this.salvaT || 0) + dt; if (this.salvaT > 40) { this.salvaT = 0; this.salvar(); }
  }

  // a câmera se alinha à sala (cada sala tem a altura da tela) e só desliza nos poços
  camYAlvo(vh) {
    const p = this.p, sala = CH * T, topo = Math.floor((p.y - 2) / sala) * sala;
    return topo + (sala - vh) / 2 + clamp((p.y - 40 - topo - sala / 2) * 0.0, -40, 40);
  }
  prenderCam() {
    const v = this.vista, vw = v.W / v.Z, vh = v.H / v.Z, N = this.N;
    let x0 = 0, x1 = N.w * T - vw;
    if (this.luta && N.arena) { x0 = N.arena.x0 - T; x1 = N.arena.x1 + T - vw; if (x1 < x0) x0 = x1 = (x0 + x1) / 2; }
    if (x1 < x0) { x0 = x1 = (N.w * T - vw) / 2; }
    v.cam.x = clamp(v.cam.x, x0, x1); v.cam.y = clamp(v.cam.y, 0, Math.max(0, N.h * T - vh));
  }

  revelar() {
    const p = this.p, N = this.N, r = this.raioLuz(), tx0 = Math.floor((p.x - r) / T), tx1 = Math.floor((p.x + r) / T), ty0 = Math.floor((p.y - 20 - r) / T), ty1 = Math.floor((p.y - 20 + r) / T);
    for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) {
      const t = tileEm(N, tx, ty); if (t !== OCULTO && t !== FALSA) continue;
      if (Math.hypot(tx * T + 16 - p.x, ty * T + 16 - (p.y - 20)) > r) continue;
      const i = ty * N.w + tx;
      if (t === OCULTO) { if (!(N.revel[i] > 0)) sfx('click'); N.revel[i] = 3.2; }
      else if (!N.desfeita.has(i)) { N.desfeita.add(i); this.fx.po(tx * T + 16, ty * T + 16, 8, this.tm.acento); sfx('magic'); }
    }
  }

  /* ================= Combate ================= */
  tremor(a) { if (config.tremor !== false) this.tremorA = Math.max(this.tremorA, a); }
  textoEm(x, y, txt, cor = '#fff', tam = 14) { this.textos.push({ x, y, txt, cor, tam, t: 1.3 }); }
  fala(b, txt) { this.textos.push({ x: b.x, y: b.y - b.h - 16, txt: '“' + txt + '”', cor: '#F2E9D0', tam: 13, t: 2.4, fixo: b }); }
  grito(txt) { this.gritoTxt = { txt, t: 2.6 }; }
  postura(b, n) { if (b.quebrado > 0) return; b.post = Math.min(100, b.post + n); b.postT = 2.2; if (b.post >= 100) { b.quebrado = 3.4; b.mov = null; this.textoEm(b.x, b.y - b.h - 20, 'QUEBRANTADO!', '#FFE9A8', 20); sfx('crit'); this.tremor(10); this.hitstop = 0.12; this.limparPerigos(); } }
  limparPerigos() { this.tiros = this.tiros.filter(t => t.amigo); this.zonas = []; }

  // aplica um golpe do peregrino em tudo o que a caixa toca
  golpear(cx, dano, atk) {
    let acertou = false; const p = this.p;
    if (atk.dir === 'cima' && this.tem('olhos_ceu')) dano *= 1.6;
    for (const e of this.inimigos) {
      if (atk.hits.has(e) || e.hp <= 0 || e.morrendo) continue;
      if (e.kind === 'chefe') for (const cl of e.clones) if (!atk.hits.has(cl) && toca(cx, { x: cl.x - e.w / 2, y: cl.y - e.h, w: e.w, h: e.h })) {
        atk.hits.add(cl); cl.t = 0; acertou = true; sfx('wrong'); this.fx.po(cl.x, cl.y - e.h / 2, 16, e.d.cor || '#C79BFF');
        for (let i = 0; i < 6; i++) this.tiros.push({ x: cl.x, y: cl.y - e.h / 2, vx: Math.cos(i * TAU / 6) * 220, vy: Math.sin(i * TAU / 6) * 220, r: 7, vida: 3, cor: e.d.cor || '#C79BFF', tipo: 'bola' });
        this.textoEm(cl.x, cl.y - e.h, 'Era mentira!', '#C79BFF');
      }
      if (!toca(cx, caixa(e))) continue;
      atk.hits.add(e);
      if (this.atingir(e, dano, p.x, atk)) acertou = true;
    }
    for (const ob of this.objs) if (ob.tipo === 'vaso' && !ob.quebrado && toca(cx, { x: ob.x - 11, y: ob.y - 24, w: 22, h: 24 })) {
      ob.quebrado = true; acertou = true; sfx('hit'); this.fx.po(ob.x, ob.y - 10, 10, '#B79A6E'); this.soltarMoedas(ob.x, ob.y - 12, Math.floor(rand(2, 6)));
      const st = this.char.data.stats; st.vasos = (st.vasos || 0) + 1;
      if (st.vasos === 153) this.ovo('peixes', '153 vasos quebrados… como os 153 grandes peixes da rede que não se rompeu (Jo 21:11).');
      if (this.tem('cinco_paes') && Math.random() < 0.12 && p.vida < p.vidaMax) { p.vida++; sfx('heal'); this.textoEm(ob.x, ob.y - 30, '+1 fôlego', '#FFE9A8'); }
    }
    for (const t of this.tiros) if (!t.amigo && t.tipo === 'bola' && toca(cx, { x: t.x - t.r, y: t.y - t.r, w: t.r * 2, h: t.r * 2 })) { t.vida = 0; this.fx.po(t.x, t.y, 5, t.cor); this.ganharOleo(3); sfx('block'); acertou = true; }
    if (atk.dir === 'baixo' && !acertou) { // quicar em espinhos
      for (let x = cx.x; x <= cx.x + cx.w; x += 12) if (tileEm(this.N, Math.floor(x / T), Math.floor((cx.y + cx.h) / T)) === ESPINHO) { acertou = true; sfx('block'); break; }
    }
    return acertou;
  }

  atingir(e, dano, deX, atk = {}) {
    const p = this.p, dir = Math.sign(e.x - deX) || 1;
    if (e.kind === 'chefe') {
      if (e.semDano > 0 || e.alpha < 0.5) return false;
      const forte = e.exposto > 0 || e.quebrado > 0 || e.tonto > 0;
      let d = danoNoChefe(e, dano, this.tipoArma) * (forte && this.tem('pedra_lisa') ? 1.4 : 1);
      if (e.c.fases[e.fase].golpes.includes('voz') && e.id === 'babilonia') d *= 0.25; // a voz do céu: não é hora de bater
      e.hp -= d; e.flash = 0.1; e.semGolpe = 0; this.postura(e, atk.carga ? 20 : 3);
      if (e.clones.length) { for (const cl of e.clones) this.fx.po(cl.x, cl.y - e.h / 2, 12, e.d.cor || '#C79BFF'); e.clones = []; this.postura(e, 30); this.textoEm(e.x, e.y - e.h - 12, 'A verdadeira!', '#FFE9A8'); sfx('right'); }
      this.fx.faisca(e.x - dir * e.w * 0.3, clamp(p.y - 22, e.y - e.h, e.y), forte ? 12 : 6, forte ? '#FFE9A8' : '#fff');
      if (config.numerosDano !== false) this.textoEm(e.x + rand(-14, 14), e.y - e.h - 4, String(Math.round(d)), forte ? '#FFE9A8' : '#E6E0CF', forte ? 17 : 13);
      this.ganharOleo(atk.semOleo ? 0 : 11); sfx(forte ? 'crit' : 'hit'); this.hitstop = forte ? 0.07 : 0.04; this.tremor(forte ? 6 : 2.5);
      if (e.hp <= 0) { e.hp = 0; e.morrendo = 1.7; e.mov = null; e.raios = null; e.clones = []; this.limparPerigos(); this.puxao = null; this.hitstop = 0.3; this.tremor(16); sfx('boss'); for (const v of this.inimigos) if (v.kind === 'vicio') v.hp = 0, v.sumiu = false; }
      return true;
    }
    if (!vulneravel(e, deX)) { sfx('block'); this.fx.faisca(e.x - dir * e.r, e.y - e.h / 2, 5, '#C79BFF'); if (e.ai === 'guarda') this.textoEm(e.x, e.y - e.h - 8, 'pelas costas!', '#C79BFF', 11); return true; }
    e.hp -= dano; e.flash = 0.12; e.stun = Math.max(e.stun, 0.2); e.estado = 'idle'; e.tele = 0;
    const k = (this.arma.empurra || 1) * (e.ai === 'guarda' ? 0.35 : 1);
    if (atk.dir === 'cima') { e.vy = -260 * k; } else if (atk.dir === 'baixo') { e.vy = 160; } else { e.vx = dir * 250 * k; if (!e.voa) e.vy = -150 * k; e.chao = false; }
    this.fx.faisca(e.x, e.y - e.h / 2, 7, '#fff'); this.ganharOleo(atk.semOleo ? 0 : 11); sfx('hit'); this.hitstop = 0.035; this.tremor(2);
    return true;
  }

  ganharOleo(n) { const p = this.p; p.oleo = Math.min(this.oleoMax(), p.oleo + n * this.dif.oleo * (this.tem('purpura_lidia') ? 1.35 : 1)); }

  matar(e) {
    const c = this.char, d = e.d;
    e.sumiu = true; sfx('kill'); this.fx.po(e.x, e.y - e.h / 2, 16, d.cor || '#8E98BE'); this.fx.anel(e.x, e.y - e.h / 2, d.cor || '#fff', 44);
    if (e.daLuta) return;
    this.soltarMoedas(e.x, e.y - e.h / 2, Math.max(1, Math.round((d.ouro || 4) / 3)) + (e.roubo || 0));
    c.data.stats.kills++; c.data.kills[e.type] = (c.data.kills[e.type] || 0) + 1; this.xp(d.xp || 8); this.pontos(10);
    if (c.data.kills[e.type] === 1 && d.licao) this.ui.toast(d.nome + ' vencida pela primeira vez: ' + d.licao, 5200);
  }

  soltarMoedas(x, y, n) { for (let i = 0; i < n; i++) this.moedas.push({ x, y, vx: rand(-150, 150), vy: rand(-330, -140), t: 0, v: 1 }); }
  xp(n) { const c = this.char; if (c.level >= MAX_LEVEL) return; c.data.xp += n; let up = false; while (c.data.xp >= xpNeed(c.level) && c.level < MAX_LEVEL) { c.data.xp -= xpNeed(c.level); c.level++; up = true; } if (up) { sfx('level'); this.ui.toast('Nível ' + c.level + ' de peregrino: seus golpes ficaram um pouco mais firmes.'); } }
  pontos(n) { this.char.score += n; this.char.week_score += n; }

  ferirHeroi(n, origem, o = {}) {
    const p = this.p;
    if (p.morto || p.inv > 0 || this.fade > 0.5) return false;
    if (p.vig > 0 && !o.espinho && !o.semDefesa) {
      p.inv = 0.4; this.ganharOleo(this.hab.escudo ? 30 : 20); sfx('parry'); vibrar(90, 0.5);
      this.fx.anel(p.x + p.face * 12, p.y - 26, '#FFE9A8', 54); this.fx.faisca(p.x + p.face * 14, p.y - 28, 12, '#FFE9A8'); this.hitstop = 0.09; this.tremor(5);
      this.textoEm(p.x, p.y - 56, 'VIGIAI!', '#FFE9A8', 15);
      if (origem?.kind === 'chefe') this.postura(origem, 34);
      else if (origem?.kind === 'vicio') { origem.stun = 1.5; origem.vx = Math.sign(origem.x - p.x) * 240; origem.aberto = 1.5; }
      o.aoDefender?.();
      return 'parry';
    }
    p.vida -= n; p.inv = this.tem('manto_marinheiro') ? 1.7 : 1.15; p.stunT = 0.24; p.orando = 0; p.carga = 0; p.atk = null; p.dashT = 0;
    if (!this.tem('manto_marinheiro') && !o.espinho) { const dir = origem ? Math.sign(p.x - origem.x) || 1 : -p.face; p.vx = dir * 300; p.vy = -330; p.chao = false; }
    sfx('hurt'); this.ui.hurt(); vibrar(170, 0.8); this.hitstop = 0.13; this.tremor(10); this.fx.faisca(p.x, p.y - 22, 10, '#FF6B5A');
    if (o.espinho && p.vida > 0) { p.x = p.seguro.x; p.y = p.seguro.y; p.vx = p.vy = 0; this.fade = 0.7; }
    if (p.vida === 1 && this.tem('cepa_raizes') && !this.usouCepa) { this.usouCepa = true; p.oleo = Math.max(p.oleo, OLEO_USO); this.textoEm(p.x, p.y - 60, 'A cepa ficou na terra', '#B8E6A0'); }
    if (p.vida <= 0) {
      if (this.tem('selo_misericordia') && !this.usouSelo) { this.usouSelo = true; p.vida = 1; p.inv = 2; this.fx.anel(p.x, p.y - 20, '#fff', 90); sfx('heal'); this.ui.toast('"Do Senhor vem a salvação" (Jn 2:9). O Selo da Misericórdia sustentou você.'); }
      else this.cair();
    }
    return true;
  }

  cair() {
    const p = this.p, c = this.char, cm = this.cm;
    p.morto = true; p.vida = 0; this.mortoT = 1.9; c.data.stats.deaths++; cm.mortes++; this.mortosAqui++;
    sfx('boss'); this.fx.po(p.x, p.y - 20, 30, '#E6E0CF'); this.tremor(14);
    // a sacola de talentos fica onde você caiu; cair de novo antes de buscá-la a perde
    if (c.data.gold > 0) { cm.sacola = { area: this.area, x: p.seguro.x, y: p.seguro.y, gold: c.data.gold }; c.data.gold = 0; } else if (cm.sacola) cm.sacola = null;
    this.ui.bossBar(null);
  }
  renascer() {
    const eb = this.cm.ebenezer;
    this.entrar(this.area, { ebenezer: eb?.area === this.area, quieto: true });
    const dica = this.def.chefe && this.mortosAqui >= 2 ? CHEFES[this.def.chefe]?.dica : null;
    this.ui.toast(dica ? 'Dica: ' + dica : '"O justo cai sete vezes e se levanta" (Pv 24:16). Sua sacola ficou onde você caiu.', 6500);
  }

  // o verso da vocação: gasta azeite
  verso() {
    const p = this.p, base = this.danoBase(), cls = this.char.cls;
    p.oleo -= OLEO_USO; sfx('magic'); this.tremor(4);
    const perto = this.inimigos.filter(e => e.hp > 0).sort((a, b) => Math.abs(a.x - p.x) - Math.abs(b.x - p.x))[0];
    const atk = { dir: 'lado', hits: new Set(), semOleo: true, carga: true };
    const tiro = (o) => this.tiros.push({ x: p.x + p.face * 14, y: p.y - 24, vy: 0, r: 7, amigo: true, vida: 0.8, cor: '#FFF1BE', tipo: 'pedra', ...o });
    switch (cls) {
      case 'pastor': for (let i = -2; i <= 2; i++) tiro({ vx: p.face * 520 * Math.cos(i * 0.16), vy: 520 * Math.sin(i * 0.16) - 30, dano: base * 1.1, g: 300 }); break;
      case 'profeta': { const x = perto && Math.abs(perto.x - p.x) < 340 ? perto.x : p.x + p.face * 150; this.zonas.push({ tipo: 'col', x, w: 70, aviso: 0.25, dur: 0.3, cor: '#FFB05A', amigo: base * 3.4, y0: p.y - 400, y1: p.y + 60 }); break; }
      case 'levita': this.fx.anel(p.x, p.y - 22, '#CDE7ED', 150); this.golpear({ x: p.x - 140, y: p.y - 150, w: 280, h: 190 }, base * 1.7, atk); this.tiros = this.tiros.filter(t => t.amigo || Math.hypot(t.x - p.x, t.y - p.y) > 170); for (const e of this.inimigos) if (e.kind === 'vicio' && Math.abs(e.x - p.x) < 160) e.stun = 1.1; break;
      case 'zelote': p.dashT = 0.26; p.dashDir = p.face; p.inv = Math.max(p.inv, 0.4); p.investida = 0.26; this.investidaAtk = atk; break;
      case 'valente': tiro({ vx: p.face * 700, dano: base * 3, fura: true, r: 9, vida: 0.7, tipo: 'onda' }); break;
      case 'juiz': this.fx.faisca(p.x + p.face * 110, p.y - 22, 14, '#FFF1BE'); this.golpear({ x: p.face > 0 ? p.x : p.x - 230, y: p.y - 44, w: 230, h: 44 }, base * 2.6, atk); break;
      default: this.fx.anel(p.x, p.y - 22, '#FFF1BE', 100); this.golpear({ x: p.x - 96, y: p.y - 100, w: 192, h: 120 }, base * 2.7, atk);
    }
    this.textoEm(p.x, p.y - 58, CLASSES[cls]?.skill.nome || 'Verso', '#FFF1BE', 12);
  }

  atualizarTiros(dt) {
    const p = this.p, N = this.N, pc = caixa(p);
    for (const t of this.tiros) {
      t.vida -= dt; if (t.g) t.vy += t.g * dt; t.x += t.vx * dt; t.y += t.vy * dt;
      if (!t.fixo && !t.fura && solido(N, Math.floor(t.x / T), Math.floor(t.y / T))) { t.vida = 0; this.fx.po(t.x, t.y, 3, t.cor); continue; }
      if (t.fixo && N.arena && (t.x < N.arena.x0 || t.x > N.arena.x1)) { t.vida = 0; continue; }
      if (t.amigo) {
        t.hits = t.hits || new Set();
        for (const e of this.inimigos) if (e.hp > 0 && !e.morrendo && !t.hits.has(e) && toca({ x: t.x - t.r, y: t.y - t.r, w: t.r * 2, h: t.r * 2 }, caixa(e))) {
          t.hits.add(e); if (this.atingir(e, t.dano, t.x - t.vx, { dir: 'lado', carga: t.tipo === 'onda', semOleo: t.tipo !== 'pedra' }) && !t.fura) { t.vida = 0; break; }
        }
      } else if (!p.morto && toca({ x: t.x - t.r * 0.7, y: t.y - t.r * (t.tipo === 'choque' ? 1.6 : 0.7), w: t.r * 1.4, h: t.r * (t.tipo === 'choque' ? 2.2 : 1.4) }, pc)) {
        const r = this.ferirHeroi(1, { x: t.x - t.vx * 0.1, y: t.y });
        if (r === 'parry' && t.tipo !== 'choque') { t.amigo = true; t.vx *= -1.5; t.vy *= -1.5; t.dano = this.danoBase() * (this.hab.escudo ? 3 : 1.5); t.vida = 2; t.cor = '#FFF1BE'; t.g = 0; }
        else if (r) t.vida = t.tipo === 'choque' ? t.vida : 0;
      }
    }
    this.tiros = this.tiros.filter(t => t.vida > 0);
  }

  atualizarZonas(dt) {
    const p = this.p, A = this.N.arena, pc = caixa(p);
    for (const z of this.zonas) {
      if (z.aviso > 0) { z.aviso -= dt; if (z.aviso <= 0) { z.ativa = true; if (z.tipo !== 'poca') { sfx('hit'); this.tremor(z.tipo === 'col' ? 3 : 4); } if (z.tentacao && A) this.moedas.push({ x: z.x, y: A.chao - 30, vx: 0, vy: -120, t: 0, v: 5, maldita: true }); } continue; }
      z.dur -= dt;
      let r;
      if (z.tipo === 'col') r = { x: z.x - z.w / 2, y: z.y0 ?? (A ? A.y0 : p.y - 600), w: z.w, h: (z.y1 ?? (A ? A.chao : p.y + 100)) - (z.y0 ?? (A ? A.y0 : p.y - 600)) };
      else if (z.tipo === 'circ') r = null; else r = { x: z.x, y: z.y, w: z.w, h: z.h };
      if (z.amigo) { if (!z.fez) { z.fez = true; this.golpear(r, z.amigo, { dir: 'lado', hits: new Set(), semOleo: true, carga: true }); } continue; }
      const dentro = r ? toca(r, pc) : Math.hypot(p.x - z.x, p.y - 19 - z.y) < z.r + 8;
      if (dentro && !p.morto) {
        if (z.efeito === 'sono') { if (p.stunT <= 0 && !z.fez) { z.fez = true; p.stunT = 1.25; p.vx = 0; this.textoEm(p.x, p.y - 56, 'zzz… "Até quando ficarás deitado?" (Pv 6:9)', '#A5CDCE', 12); sfx('wrong'); } }
        else {
          const res = this.ferirHeroi(1, z.dono || { x: z.tipo === 'circ' ? z.x : p.x - p.face, y: p.y }, { semDefesa: z.tipo === 'poca' });
          if (res === 'parry' && z.lanca && z.dono) { if (z.expoe) { z.dono.exposto = 3.2; this.textoEm(z.dono.x, z.dono.y - z.dono.h - 22, 'A TESTA ESTÁ EXPOSTA!', '#FFE9A8', 17); } z.dur = 0; }
          if (res === true && z.efeito === 'empurra') { p.vx = Math.sign(p.x - z.x) * 520; p.vy = -380; }
        }
      }
    }
    this.zonas = this.zonas.filter(z => z.aviso > 0 || z.dur > 0);
  }

  atualizarMoedas(dt) {
    const p = this.p, d = this.char.data;
    for (const m of this.moedas) {
      m.t += dt; m.vy += 1500 * dt;
      const dist = Math.hypot(p.x - m.x, p.y - 20 - m.y);
      if (!m.maldita && m.t > 0.35 && dist < 110 && !p.morto) { m.vx += (p.x - m.x) / dist * 2600 * dt; m.vy += (p.y - 20 - m.y) / dist * 2600 * dt; }
      m.x += m.vx * dt; m.y += m.vy * dt;
      if (solido(this.N, Math.floor(m.x / T), Math.floor((m.y + 5) / T)) && m.vy > 0) { m.y = Math.floor((m.y + 5) / T) * T - 5; m.vy *= -0.4; m.vx *= 0.7; }
      if (solido(this.N, Math.floor((m.x + Math.sign(m.vx) * 5) / T), Math.floor(m.y / T))) m.vx *= -0.5;
      if (dist < 20 && m.t > 0.3 && !p.morto) {
        m.pego = true; const v = Math.round(m.v * (this.tem('tijolo_humilde') ? 1.3 : 1)) || 1; d.gold += v; sfx('coin');
        if (m.maldita) { this.peso++; this.textoEm(p.x, p.y - 54, '+' + v + ' denários… e um peso a mais', '#FFD23F', 12); }
      }
      if (m.t > (m.maldita ? 9 : 14)) m.pego = true;
    }
    this.moedas = this.moedas.filter(m => !m.pego);
  }

  /* ================= Encontros ================= */
  gatilhos() {
    const p = this.p, N = this.N, A = N.arena, d = this.def;
    if (A && d.chefe && !this.luta && !this.chefe && !this.venceu && !p.morto && p.x > A.x0 + 76) this.iniciarLuta();
    if (!A || this.luta) return;
  }

  async iniciarLuta() {
    const d = this.def, A = this.N.arena;
    this.luta = true; this.N.portaAberta = false; sfx('gate'); this.tremor(8);
    await this.cinema(CINEMA_CHEFE[d.chefe] || 'chefe-' + d.chefe);
    const b = novoChefe(d.chefe, A, this.dif);
    this.inimigos.push(b); this.chefe = b; music('chefe'); sfx('boss');
    this.ui.banner(b.d.titulo || 'Chefe', b.d.nome, b.d.ref);
    if (b.d.intro) this.fala(b, b.d.intro.replace(/\*/g, ''));
  }

  // "Está escrito": a luta para e o chefe acusa. A resposta certa o quebranta; a errada o fortalece.
  async estaEscrito(b) {
    const f = this.def.fase, st = this.char.data.stats;
    let ok;
    if (b.c.acusacoes || !f) {
      const acc = pick(ACUSACOES); ok = await this.ui.verseBattle(acc, shuffle(FALSAS.slice()).slice(0, 2));
      if (ok && !this.char.data.verses.includes(acc.ref)) this.char.data.verses.push(acc.ref);
    } else {
      const q = this.sortearPergunta(f);
      ok = await this.ui.quiz({ ...q, fb: ['Está escrito! O chefe está quebrantado.', 'O chefe se fortalece com o seu engano.'] }, 'ESTÁ ESCRITO · ' + b.d.nome);
      this.revisao(q, ok);
    }
    if (!this.running || b.hp <= 0) return;
    if (ok) {
      st.quizOk++; this.ok++; this.pontos(150);
      const dano = b.max * 0.08 * (this.tem('anel_beltessazar') ? 2 : 1); b.hp = Math.max(1, b.hp - dano); b.post = 0; b.quebrado = 3.6;
      this.p.oleo = this.oleoMax(); this.textoEm(b.x, b.y - b.h - 20, 'ESTÁ ESCRITO!', '#FFE9A8', 22); this.fx.anel(b.x, b.y - b.h / 2, '#FFE9A8', 160); this.tremor(12); sfx('right');
    } else {
      st.quizErr++; this.err++; b.hp = Math.min(b.max, b.hp + b.max * 0.06); b.furia = 10; sfx('wrong');
      this.textoEm(b.x, b.y - b.h - 20, 'O engano o fortalece', '#FF8A7A', 16);
    }
  }
  sortearPergunta(f) {
    const k = f.n, u = this.usados[k] = this.usados[k] || [];
    let op = f.quiz.filter(q => !u.includes(q.q)); if (!op.length) { u.length = 0; op = f.quiz; }
    const q = pick(op); u.push(q.q); return q;
  }
  revisao(q, ok) {
    const r = this.char.data.revisar, i = r.findIndex(x => x.q === q.q);
    if (ok) { if (i >= 0) r.splice(i, 1); return; }
    if (i < 0) { r.push({ q: q.q, certa: q.a[0], porque: q.porque || '' }); if (r.length > 40) r.shift(); }
  }

  async chefeCaiu(b) {
    const d = this.def, cm = this.cm, c = this.char;
    b.fora = true; this.chefe = null; this.luta = false; this.venceu = true; this.N.portaAberta = true; this.escuroAlvo = 0; this.lentidaoAlvo = 1; this.peso = 0;
    this.ui.bossBar(null); music('fase'); sfx('level');
    this.fx.anel(b.x, b.y - b.h / 2, '#FFE9A8', 260); this.soltarMoedas(b.x, b.y - b.h / 2, 18);
    cm.chefes[b.id] = (cm.chefes[b.id] || 0) + 1; c.data.stats.bosses = c.data.stats.bosses || {}; c.data.stats.bosses[b.id] = (c.data.stats.bosses[b.id] || 0) + 1;
    this.p.vida = this.p.vidaMax;
    await this.ui.dialog({ nome: b.d.nome + ' caiu', texto: b.d.derrota || 'A sombra se desfaz.', acoes: [{ label: 'Amém' }] });
    if (d.fase) await this.faseCompleta();
    else if (d.mundo) { const m = MUNDO[d.mundo]; this.xp(300); this.pontos(1500); await this.ganhar(m.premio); }
    const A = this.N.arena;
    this.objs.push({ tipo: 'saida', x: A.cx, y: A.chao, luz: 130 });
    this.salvar();
  }

  async faseCompleta() {
    const d = this.def, f = d.fase, sem = d.sem, c = this.char, cm = this.cm;
    const prog = faseProg(c, sem.id), first = !prog[f.n]?.done, secs = Math.round(this.T - this.t0);
    const pts = 500 * f.n + Math.max(0, 900 - secs) + this.ok * 50 - this.err * 25 - this.mortosAqui * 40;
    prog[f.n] = { done: true, best: Math.max(prog[f.n]?.best || 0, pts), time: Math.min(prog[f.n]?.time || 99999, secs) };
    this.pontos(Math.max(100, first ? pts : Math.round(pts * 0.3))); this.xp(120 * f.n); c.data.gold += first ? 60 * f.n : 15 * f.n;
    if (!c.data.verses.includes(f.versiculo.ref)) c.data.verses.push(f.versiculo.ref);
    if (!c.data.licoes.includes(sem.id + ':' + f.n)) c.data.licoes.push(sem.id + ':' + f.n);
    cm.feitas[this.area] = true;
    for (const it of this.N.segredosFora || []) await this.ganhar(it);
    await this.ganhar(f.recompensa);
    if (f.epilogo) await this.ui.dialog({ nome: 'Epílogo', texto: f.epilogo, acoes: [{ label: 'Continuar' }] });
    if (sem.fases.every(x => prog[x.n]?.done) && !prog.semana) { prog.semana = true; this.pontos(3000); await this.ganhar(sem.recompensaSemana); await this.cinema(sem.id + '-fim'); }
  }

  // entrega uma peça da armadura, uma relíquia, maná ou pedra lisa
  async ganhar(id) {
    const cm = this.cm, p = this.p;
    if (!id) return;
    if (id === 'bolsa') { this.soltarMoedas(p.x, p.y - 30, 14); return; }
    if (id === 'mana') {
      cm.mana++; sfx('key');
      const falta = 3 - cm.mana % 3;
      await this.ui.dialog({ nome: 'Maná escondido', texto: '"Ao vencedor darei do maná escondido" (Ap 2:17).\n\n' + (falta === 3 ? 'Três porções: você ganhou um fôlego a mais!' : 'Faltam ' + falta + ' para ganhar um fôlego a mais.'), acoes: [{ label: 'Guardar' }] });
      if (falta === 3) { p.vidaMax = this.vidaMax(); p.vida = p.vidaMax; }
      return;
    }
    if (id === 'pedra') {
      cm.pedras++; sfx('key');
      await this.ui.dialog({ nome: 'Pedra lisa do ribeiro (' + cm.pedras + '/5)', texto: '"Escolheu para si cinco pedras lisas do ribeiro" (1Sm 17:40).\n\n' + (cm.pedras >= 5 ? 'Você tem as cinco. O Vale de Elá espera, a leste do Refúgio.' : 'Há uma em cada área de Corinto. Quando tiver as cinco, procure o rei Saul no Refúgio.'), acoes: [{ label: 'Guardar' }] });
      return;
    }
    const A = ARMADURA[id];
    if (A) {
      if (cm.hab[A.hab]) return;
      cm.hab[A.hab] = true; sfx('level'); this.fx.anel(p.x, p.y - 20, '#FFE9A8', 220);
      if (A.hab === 'couraca') { p.vidaMax = this.vidaMax(); p.vida = p.vidaMax; }
      await this.ui.dialog({ nome: A.icone + ' ' + A.nome, texto: 'ARMADURA DE DEUS · ' + A.ref + '\n\nNovo poder: ' + A.poder + '\n\n' + A.desc + '\n\n' + Object.keys(cm.hab).length + ' de 6 peças.', acoes: [{ label: 'Vestir' }] });
      if (Object.keys(cm.hab).length === 6) this.ui.toast('Você vestiu toda a Armadura de Deus (Ef 6:13). Algo espera à porta, no fim do Refúgio…', 7000);
      return;
    }
    const R = RELIQUIAS[id];
    if (!R || cm.reliquias.includes(id)) { if (R) this.soltarMoedas(p.x, p.y - 30, 20); return; }
    cm.reliquias.push(id); if (cm.eq.length < this.espacos() && !R.passiva) cm.eq.push(id); sfx('key');
    p.vidaMax = this.vidaMax();
    await this.ui.dialog({ nome: R.icone + ' ' + R.nome, texto: 'RELÍQUIA · ' + R.ref + '\n\n' + R.desc + '\n\n' + (cm.eq.includes(id) ? 'Já está com você.' : R.passiva ? '' : 'Equipe no menu › Relíquias.'), acoes: [{ label: 'Guardar' }] });
  }

  ovo(id, texto) { if (this.cm.ovos.includes(id)) return false; this.cm.ovos.push(id); sfx('right'); this.pontos(200); this.ui.toast('✦ ' + texto, 7500); return true; }

  /* ================= Interações ================= */
  interacoes() {
    const p = this.p; let perto = null, pd = 58;
    if (p.morto) { this.ui.setInteract(null); return; }
    for (const ob of this.objs) {
      const dd = Math.hypot(ob.x - p.x, ob.y - 20 - (p.y - 20));
      if (ob.tipo === 'segredo' && dd < 30) { ob.fora = true; this.cm.seg[this.area].push(ob.n); this.ganhar(ob.item); continue; }
      if (ob.tipo === 'sacola' && dd < 30) { ob.fora = true; const s = this.cm.sacola; if (s) { this.char.data.gold += s.gold; this.textoEm(p.x, p.y - 56, '+' + s.gold + ' denários recuperados', '#FFD23F'); sfx('coin'); this.cm.sacola = null; } continue; }
      const rot = this.rotulo(ob); if (rot && dd < pd) { pd = dd; perto = ob; perto.rot = rot; }
    }
    this.objs = this.objs.filter(ob => !ob.fora);
    this.perto = perto;
    this.ui.setInteract(perto && input.touch ? perto.rot : null);
    if (perto && this.ctl.interagir) this.usar(perto);
  }
  rotulo(ob) {
    switch (ob.tipo) {
      case 'rolo': return ob.feito ? 'Reler o rolo' : ob.trava > this.T ? null : 'Ler o rolo';
      case 'estacao': return ob.feito ? null : ob.dados.nome;
      case 'npc': return 'Falar';
      case 'ebenezer': return 'Descansar';
      case 'portal': return 'Entrar';
      case 'saida': return 'Seguir caminho';
      case 'querubim': case 'porta-pecado': return 'Olhar';
    }
    return null;
  }

  async usar(ob) {
    const d = this.def, cm = this.cm, f = d.fase, p = this.p;
    p.vx = 0; sfx('click');
    switch (ob.tipo) {
      case 'rolo': {
        const trecho = f.estudo?.[ob.n] ? '\n\n' + f.estudo[ob.n] : '';
        await this.ui.dialog({ nome: '📜 Rolo ' + (ob.n + 1) + ' de 3 · ' + f.ref, texto: (ob.n === 0 ? f.licao : ob.n === 1 ? '“' + f.versiculo.texto + '”\n— ' + f.versiculo.ref : f.reflexao ? 'PARA REFLETIR\n' + f.reflexao : f.licao) + trecho, acoes: [{ label: ob.feito ? 'Fechar' : 'Li. Quero responder' }] });
        if (ob.feito || !this.running) return;
        const q = this.sortearPergunta(f);
        const ok = await this.ui.quiz({ ...q, fb: ['Certo! O selo deste rolo se acende.', 'Releia com calma: o rolo se fecha por alguns instantes.'] }, 'Rolo ' + (ob.n + 1) + ' · ' + f.ref);
        this.revisao(q, ok);
        const st = this.char.data.stats;
        if (ok) { st.quizOk++; this.ok++; ob.feito = true; cm.selos[this.area].push(ob.n); this.pontos(50); sfx('key'); this.fx.anel(ob.x, ob.y - 30, '#FFE9A8', 90); this.ganharOleo(33); this.conferirPorta(); this.salvar(); }
        else { st.quizErr++; this.err++; ob.trava = this.T + 5; }
        break;
      }
      case 'estacao': {
        const e = ob.dados, ok = await this.ui.quiz(e, e.nome + ' · ' + f.ref);
        this.revisao(e, ok);
        if (ok) { ob.feito = true; cm.est[this.area].push(e.id); this.pontos(40); this.char.data.stats.quizOk++; this.ok++; this.fx.anel(ob.x, ob.y - 30, '#93E4CC', 90); this.ganharOleo(20); this.conferirPorta(); this.salvar(); }
        else { this.char.data.stats.quizErr++; this.err++; }
        break;
      }
      case 'npc': await this.falar(ob); break;
      case 'ebenezer': {
        const primeira = !cm.ebenezer;
        cm.ebenezer = { area: this.area }; if (!this.luta) this.povoar(); p.vida = p.vidaMax; p.oleo = Math.max(p.oleo, OLEO_USO); this.usouSelo = this.usouCepa = false; sfx('heal'); this.fx.anel(ob.x, ob.y - 30, '#FFE9A8', 120); this.salvar();
        if (primeira) this.ovo('ebenezer', '"Até aqui nos ajudou o Senhor" (1Sm 7:12). As Pedras de Ebenézer guardam o seu caminho.');
        const acoes = [{ label: 'Levantar' }];
        if (this.area !== 'refugio') acoes.push({ label: 'Voltar ao Refúgio', fn: () => this.entrar('refugio', { ebenezer: false }) });
        acoes.push({ label: 'Relíquias', fn: () => this.menu('reliquias') });
        await this.ui.dialog({ nome: 'Pedra de Ebenézer', texto: 'Você descansa. Fôlegos refeitos; os vícios da área voltam a rondar.\n\nDaqui você recomeça se cair.', acoes });
        break;
      }
      case 'portal':
        if (ob.semana) escolherFase(this, semanaDe(ob.semana));
        else {
          const m = MUNDO[ob.mundo], falta = (m.pede.pedras && cm.pedras < m.pede.pedras) || (m.pede.hab && !cm.hab[m.pede.hab]);
          if (falta) await this.ui.dialog({ nome: m.nome, texto: m.ref + '\n\n' + m.porque, acoes: [{ label: 'Voltar' }] });
          else await this.ui.dialog({ nome: m.nome, texto: m.ref + '\n\n' + (BOSSES[m.chefe].intro || '').replace(/\*/g, '') + (cm.chefes[m.chefe] ? '\n\nVencido ' + cm.chefes[m.chefe] + ' vez(es).' : ''), acoes: [{ label: 'Entrar', fn: () => this.entrar('mundo:' + ob.mundo) }, { label: 'Agora não' }] });
        }
        break;
      case 'saida': {
        if (d.fase) { const prox = d.sem.fases[d.fase.n]; if (prox) await this.ui.dialog({ nome: 'O caminho continua', texto: 'Próxima página: ' + prox.nome + ' (' + prox.ref + ')', acoes: [{ label: 'Seguir', fn: () => this.entrar(d.sem.id + ':' + prox.n) }, { label: 'Voltar ao Refúgio', fn: () => this.entrar('refugio', { portal: d.sem.id }) }] }); else this.entrar('refugio', { portal: d.sem.id }); }
        else this.entrar('refugio', { portal: d.mundo });
        break;
      }
      case 'querubim': this.ovo('querubim', 'Um querubim e uma espada flamejante guardam o caminho da árvore da vida (Gn 3:24). Por aqui não se volta: o caminho de volta é outro.'); await this.ui.dialog({ nome: 'A leste do jardim', texto: 'A espada de fogo se revolve sem ruído. Atrás dela, um verde que você nunca viu e de que, estranhamente, sente saudade.\n\n"E pôs querubins ao oriente do jardim do Éden" (Gn 3:24).', acoes: [{ label: 'Recuar' }] }); break;
      case 'porta-pecado': await this.portaDoPecado(ob); break;
    }
  }

  async falar(ob) {
    const cm = this.cm, c = this.char;
    const n = cm.falas[ob.id || ob.nome] = (cm.falas[ob.id || ob.nome] || 0) + 1;
    let texto;
    switch (ob.id) {
      case 'velho': {
        const hab = Object.keys(cm.hab).length;
        texto = n === 1 ? 'Então ainda há quem carregue uma lâmpada.\n\nO Livro não foi queimado, peregrino: foi esquecido. Cada página que ninguém lê, a sombra cobre — e o que a sombra cobre ganha corpo. Mamom, a Mentira, o Pavor… são páginas não lidas andando por aí.\n\n"Lâmpada para os meus pés é a tua palavra" (Sl 119:105). Leia, entenda, e a luz volta.'
          : hab < 6 ? 'Comece por Corinto, no primeiro portal. Cada sombra de lá guarda uma peça da Armadura de Deus (Ef 6): com elas você alcança o que hoje não alcança.\n\nPeças vestidas: ' + hab + ' de 6.\n\nE lembre: a lâmpada não serve só para ver. Erga-a no instante do golpe.'
            : 'Armadura completa… "depois de terdes vencido tudo, permanecei inabaláveis" (Ef 6:13).\n\nHá uma porta no fim da aldeia que nenhuma espada abre. Você vai entender quando chegar lá.';
        break;
      }
      case 'lidia': return loja(this);
      case 'zaqueu':
        if (this.ovo('zaqueu', 'Zaqueu subiu num sicômoro para ver Jesus — e desceu depressa (Lc 19:4-6).')) { c.data.gold += 60; texto = 'Você subiu até aqui só para me ver? Eu subi para ver outro.\n\n"Zaqueu, desce depressa, pois me convém ficar hoje em tua casa."\n\nTome: metade do que tenho dou aos pobres. (+60 denários)'; }
        else texto = 'Se defraudei alguém, restituo quatro vezes mais. Hoje houve salvação nesta casa (Lc 19:8-9).';
        break;
      case 'jumenta':
        if (n < 3) texto = '…\n\n(Ela olha para você. Parece que ia dizer alguma coisa.)';
        else if (this.ovo('jumenta', 'A jumenta de Balaão falou (Nm 22:28).')) { c.data.gold += 22; texto = '"Que te fiz eu, para me espancares já três vezes?"\n\n…Brincadeira. Você só me cutucou. Mas eu já vi um anjo no caminho quando meu dono não viu nada (Nm 22:23). Tome 22 denários, pelo capítulo.'; }
        else texto = 'Nem todo mundo que fala vê. Nem todo mundo que vê fala.';
        break;
      case 'saul': texto = cm.chefes.golias ? 'Saul feriu os seus milhares… e você, o gigante. (1Sm 18:7)' : 'O filisteu desafia as fileiras há quarenta dias (1Sm 17:16). Ninguém desce ao vale.\n\nUm pastor uma vez escolheu cinco pedras lisas do ribeiro. Você tem ' + cm.pedras + ' de 5: procure-as nos cantos escondidos de Corinto — a lâmpada mostra onde.'; break;
      default: texto = ob.falas ? ob.falas[(n - 1) % ob.falas.length] : '…';
    }
    await this.ui.dialog({ nome: ob.nome, look: ob.look, texto, acoes: [{ label: 'Continuar' }] });
  }

  /* ---- "O pecado jaz à porta" (Gn 4:7): o encontro que não se vence pela força ---- */
  async portaDoPecado(ob) {
    const cm = this.cm, hab = Object.keys(cm.hab).length;
    if (cm.ovos.includes('graca')) return this.ui.dialog({ nome: 'A porta', texto: 'A porta está aberta e vazia. Entra luz por ela.\n\n"Onde abundou o pecado, superabundou a graça" (Rm 5:20).', acoes: [{ label: 'Amém' }] });
    if (hab < 6) return this.ui.dialog({ nome: 'A porta', texto: 'Uma porta sem trinco. Algo respira do outro lado.\n\n"O pecado jaz à porta; o seu desejo será contra ti, mas a ti cumpre dominá-lo" (Gn 4:7).\n\n(Volte com a armadura completa.)', acoes: [{ label: 'Recuar' }] });
    await this.ui.dialog({ nome: '???', texto: 'A porta se abre sozinha.\n\n— Armadura inteira. Bonita. E mesmo assim você me conhece: eu estava em cada chefe que você venceu… e em você, antes deles.', acoes: [{ label: 'Erguer a espada' }] });
    this.pecado = { x: ob.x, y: ob.y - 40, t: 0, graca: 0, cd: 2.2, art: { id: 'pecado', r: 34 } };
    this.escuroAlvo = 0.9; music('chefe');
  }
  atualizarPecado(dt) {
    const s = this.pecado, p = this.p; s.t += dt; s.cd -= dt;
    s.x = damp(s.x, p.x - p.face * 90, 1.6, dt); s.y = damp(s.y, p.y - 6, 1.6, dt);
    if (p.atk && Math.abs(p.x - s.x) < 110 && !s.avisou) { s.avisou = true; this.textoEm(s.x, s.y - 90, 'A espada atravessa a sombra.', '#EF6981', 13); this.ui.toast('"Não há um justo, nem um sequer" (Rm 3:10). Força não basta. Ajoelhe-se: ore (H).', 7000); }
    if (s.cd <= 0 && !p.morto) { s.cd = 2.4; this.zonas.push({ tipo: 'circ', x: p.x, y: p.y - 18, r: 50, aviso: 0.9, dur: 0.2, cor: '#EF6981' }); }
    // aqui a oração não custa azeite: é o próprio caminho
    if (this.ctl.orar && p.chao) { s.graca += dt; p.orando = Math.max(p.orando, 0.3); p.vx = 0; if (Math.random() < dt * 20) this.fx.sobe(p.x + rand(-30, 30), p.y, 1, '#FFE9A8'); }
    if (s.graca >= 4) {
      this.pecado = null; this.escuroAlvo = 0; this.zonas = []; music('mundo'); this.fx.anel(p.x, p.y - 20, '#fff', 400); sfx('level'); this.tremor(10);
      this.cm.ovos.push('graca'); this.cm.mana += 3; p.vidaMax = this.vidaMax(); p.vida = p.vidaMax; this.pontos(5000);
      this.ui.dialog({ nome: 'Graça', texto: 'Você não o venceu. Alguém o venceu por você.\n\n"Pela graça sois salvos, mediante a fé; e isto não vem de vós; é dom de Deus; não de obras, para que ninguém se glorie" (Ef 2:8-9).\n\nA armadura sempre foi um presente. (+1 fôlego)', acoes: [{ label: 'Amém' }] });
      this.salvar();
    }
  }

  menu(aba) { if (!this.ui.blocking) abrirMenu(this, aba); }

  salvar() {
    const c = this.char; c.data.hp = null; c.week_id = c.week_id || weekId();
    return net.saveChar(c);
  }
  save() { return this.salvar(); }

  /* ================= Efeitos ================= */
  atualizarFx(dt) {
    for (const q of this.parts) { q.t -= dt; q.x += q.vx * dt; q.y += q.vy * dt; q.vy += (q.g ?? 500) * dt; }
    this.parts = this.parts.filter(q => q.t > 0);
    for (const t of this.textos) { t.t -= dt; if (!t.fixo) t.y -= 26 * dt; }
    this.textos = this.textos.filter(t => t.t > 0);
    if (this.gritoTxt) { this.gritoTxt.t -= dt; if (this.gritoTxt.t <= 0) this.gritoTxt = null; }
  }

  /* ================= Desenho ================= */
  render() {
    const g = this.g, v = this.vista, p = this.p, Tm = this.T;
    g.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    pintarFundo(g, this);
    g.save();
    const tx = this.tremorA ? rand(-1, 1) * this.tremorA * 0.5 : 0, ty = this.tremorA ? rand(-1, 1) * this.tremorA * 0.5 : 0;
    g.scale(v.Z, v.Z); g.translate(-v.cam.x + tx, -v.cam.y + ty);
    pintarEnfeites(g, this); pintarLampioes(g, this);
    for (const ob of this.objs) if (Math.abs(ob.x - p.x) < 1100) desenharObjeto(g, ob, this);
    pintarBlocos(g, this);
    this.pintarZonas(g);
    for (const e of this.inimigos) { if (Math.abs(e.x - p.x) > 1100) continue; if (e.kind === 'chefe') desenharChefe(g, e, Tm, this); else desenharVicio(g, e, Tm); }
    if (this.pecado) this.pintarPecado(g);
    for (const m of this.moedas) { g.fillStyle = m.maldita ? '#C9962B' : '#FFD23F'; g.strokeStyle = '#080F19'; g.lineWidth = 1; g.beginPath(); g.ellipse(m.x, m.y, 4.2 * Math.abs(Math.cos(m.t * 9)) + 1, m.maldita ? 6 : 4.5, 0, 0, TAU); g.fill(); g.stroke(); }
    if (!p.morto) desenharHeroi(g, p, this.char.look || {}, this.arma, this.tipoArma, Tm, this.hab);
    for (const t of this.tiros) this.pintarTiro(g, t);
    for (const q of this.parts) { g.globalAlpha = Math.min(1, q.t / q.max * 1.4); g.fillStyle = q.cor; if (q.anel) { g.strokeStyle = q.cor; g.lineWidth = 3 * q.t / q.max; g.beginPath(); g.arc(q.x, q.y, q.r * (1 - q.t / q.max), 0, TAU); g.stroke(); } else { g.beginPath(); g.arc(q.x, q.y, q.r, 0, TAU); g.fill(); } }
    g.globalAlpha = 1;
    g.textAlign = 'center'; g.lineJoin = 'round';
    for (const t of this.textos) { const x = t.fixo ? t.fixo.x : t.x, y = t.fixo ? t.fixo.y - t.fixo.h - 16 : t.y; g.globalAlpha = Math.min(1, t.t * 2); g.font = `800 ${t.tam}px Alegreya Sans, sans-serif`; g.lineWidth = 3.5; g.strokeStyle = 'rgba(8,15,25,.9)'; g.strokeText(t.txt, x, y); g.fillStyle = t.cor; g.fillText(t.txt, x, y); }
    g.globalAlpha = 1;
    // etiqueta do que dá para usar
    if (this.perto && !input.touch) { const ob = this.perto, txt = (document.body.classList.contains('pad') ? 'Y' : 'E') + ' · ' + ob.rot; g.font = '800 12px Alegreya Sans, sans-serif'; const w = g.measureText(txt).width + 16, y = ob.y - (ob.tipo === 'npc' ? 76 : 92); g.fillStyle = 'rgba(8,15,25,.85)'; g.fillRect(ob.x - w / 2, y - 14, w, 20); g.fillStyle = '#F2E9D0'; g.fillText(txt, ob.x, y); }
    g.restore();
    pintarLuz(g, this);
    this.pintarClima(g);
    this.pintarHud(g);
    if (this.gritoTxt) { const a = Math.min(1, this.gritoTxt.t, (2.6 - this.gritoTxt.t) * 4); g.globalAlpha = a; g.textAlign = 'center'; g.font = `900 ${Math.min(34, v.W / 24)}px Cinzel, serif`; g.lineWidth = 6; g.strokeStyle = 'rgba(8,5,10,.9)'; g.strokeText(this.gritoTxt.txt, v.W / 2, v.H * 0.3); g.fillStyle = '#F4D9A0'; g.fillText(this.gritoTxt.txt, v.W / 2, v.H * 0.3); g.globalAlpha = 1; }
    const f = Math.max(this.fade, p.morto ? clamp(1.2 - this.mortoT, 0, 1) : 0);
    if (f > 0) { g.fillStyle = `rgba(4,6,10,${f})`; g.fillRect(0, 0, v.W, v.H); }
  }

  pintarTiro(g, t) {
    if (t.tipo === 'choque') { g.fillStyle = corA(t.cor, 0.85); g.beginPath(); g.moveTo(t.x - 16, t.y + 13); g.quadraticCurveTo(t.x + Math.sign(t.vx) * 4, t.y - 30, t.x + Math.sign(t.vx) * 18, t.y + 13); g.fill(); g.fillStyle = 'rgba(255,255,255,.7)'; g.fillRect(t.x - 2, t.y - 12, 3, 8); return; }
    if (t.tipo === 'onda') { g.save(); g.translate(t.x, t.y); g.scale(Math.sign(t.vx), 1); g.fillStyle = 'rgba(255,241,190,.9)'; g.shadowColor = '#FFF1BE'; g.shadowBlur = 16; g.beginPath(); g.arc(0, 0, t.r * 1.5, -1.2, 1.2); g.arc(-t.r * 0.6, 0, t.r * 1.3, 1.1, -1.1, true); g.fill(); g.restore(); return; }
    const gr = g.createRadialGradient(t.x, t.y, 0, t.x, t.y, t.r * 2.2); gr.addColorStop(0, '#fff'); gr.addColorStop(0.35, t.cor); gr.addColorStop(1, corA(t.cor, 0));
    g.fillStyle = gr; g.beginPath(); g.arc(t.x, t.y, t.r * 2.2, 0, TAU); g.fill();
    g.fillStyle = t.amigo ? '#FFF7DC' : t.cor; g.strokeStyle = '#080F19'; g.lineWidth = 1.3; g.beginPath(); g.arc(t.x, t.y, t.r * 0.8, 0, TAU); g.fill(); g.stroke();
  }

  pintarZonas(g) {
    const A = this.N.arena, p = this.p, Tm = this.T;
    for (const z of this.zonas) {
      const cor = z.cor.startsWith('#') ? z.cor : `rgb(${z.cor})`, ativa = z.aviso <= 0, a = ativa ? 0.85 : 0.14 + 0.2 * Math.abs(Math.sin(Tm * 16));
      g.save();
      if (z.tipo === 'circ') {
        g.fillStyle = corA(z.cor.startsWith('#') ? z.cor : '#ffffff', ativa ? 0.7 : 0.13); g.beginPath(); g.arc(z.x, z.y, z.r, 0, TAU); g.fill();
        g.strokeStyle = cor; g.lineWidth = 2; g.stroke();
        if (!ativa) { g.beginPath(); g.arc(z.x, z.y, z.r * clamp(1 - z.aviso / 0.9, 0, 1), 0, TAU); g.stroke(); }
      } else {
        const y0 = z.tipo === 'col' ? (z.y0 ?? (A ? A.y0 : p.y - 600)) : z.y, y1 = z.tipo === 'col' ? (z.y1 ?? (A ? A.chao : p.y + 100)) : z.y + z.h, x = z.tipo === 'col' ? z.x - z.w / 2 : z.x;
        g.globalAlpha = z.tipo === 'poca' && ativa ? 0.6 + 0.15 * Math.sin(Tm * 8) : a; g.fillStyle = cor;
        if (z.tipo === 'col' && ativa) { const gr = g.createLinearGradient(x, 0, x + z.w, 0); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, '#fff'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillRect(x, y0, z.w, y1 - y0); g.fillStyle = gr; }
        if (z.tipo !== 'ret' || ativa) g.fillRect(x, y0, z.w, y1 - y0);
        if (!ativa) { g.globalAlpha = 0.8; g.strokeStyle = cor; g.lineWidth = 1.5; g.setLineDash([6, 6]); g.strokeRect(x, y0, z.w, y1 - y0); if (z.tipo === 'faixa') { g.setLineDash([]); g.font = '800 13px Alegreya Sans, sans-serif'; g.fillStyle = '#fff'; g.textAlign = 'center'; g.fillText(z.baixo ? '▲ PULE ▲' : '▼ FIQUE NO CHÃO ▼', (A ? A.cx : p.x), z.baixo ? y0 - 8 : y1 + 16); } }
      }
      g.restore();
    }
  }

  pintarPecado(g) {
    const s = this.pecado, Tm = this.T;
    g.save(); g.translate(s.x, s.y);
    g.fillStyle = 'rgba(5,4,10,.92)'; g.beginPath(); g.moveTo(-26, 40); g.quadraticCurveTo(-34, -30, 0, -74); g.quadraticCurveTo(34, -30, 26, 40);
    for (let i = 4; i >= -4; i--) g.lineTo(i * 6.5, 40 + (i % 2 ? 9 : 0) + Math.sin(Tm * 5 + i) * 3);
    g.fill();
    g.fillStyle = '#EF6981'; g.beginPath(); g.ellipse(-7, -38, 2.4, 3.6, 0, 0, TAU); g.ellipse(7, -38, 2.4, 3.6, 0, 0, TAU); g.fill();
    g.restore();
    const v = this.vista; g.save(); g.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    const w = 240, x = v.W / 2 - w / 2, y = v.H - 70; g.fillStyle = 'rgba(8,15,25,.8)'; g.fillRect(x - 3, y - 3, w + 6, 16); g.fillStyle = '#FFE9A8'; g.fillRect(x, y, w * Math.min(1, s.graca / 4), 10);
    g.font = '800 12px Alegreya Sans, sans-serif'; g.textAlign = 'center'; g.fillStyle = '#F2E9D0'; g.fillText('Graça', v.W / 2, y - 8); g.restore();
  }

  // partículas do clima, em espaço de tela
  pintarClima(g) {
    const v = this.vista, tipo = this.tm.part, Tm = this.T, n = tipo === 'chuva' ? 70 : 34;
    for (let i = 0; i < n; i++) {
      const a = i * 12.9898, r = (Math.sin(a) * 43758.5453) % 1, r2 = (Math.sin(a * 1.7) * 24634.6345) % 1, fr = Math.abs(r), fr2 = Math.abs(r2);
      let x, y, s = 1.5 + fr2 * 2;
      switch (tipo) {
        case 'chuva': x = (fr * v.W * 1.3 - Tm * 190 - v.cam.x * 0.4) % v.W; y = (fr2 * v.H + Tm * (620 + fr * 300)) % v.H; g.strokeStyle = 'rgba(190,220,240,.28)'; g.lineWidth = 1; g.beginPath(); g.moveTo((x + v.W) % v.W, y); g.lineTo((x + v.W) % v.W - 5, y + 16); g.stroke(); continue;
        case 'brasa': case 'vagalume': case 'bolha': x = fr * v.W + Math.sin(Tm * (0.5 + fr2) + i) * 30 - v.cam.x * 0.25; y = v.H - ((fr2 * v.H + Tm * (18 + fr * 30)) % v.H); g.fillStyle = corA(this.tm.acento, 0.25 + 0.35 * Math.abs(Math.sin(Tm * 2 + i))); break;
        case 'estrela': x = fr * v.W - v.cam.x * 0.1; y = fr2 * v.H * 0.7; g.fillStyle = corA(this.tm.acento, 0.15 + 0.3 * Math.abs(Math.sin(Tm + i))); s *= 0.7; break;
        default: x = fr * v.W * 1.2 + Tm * (14 + fr2 * 22) * (tipo === 'areia' ? 5 : 1) - v.cam.x * 0.3; y = (fr2 * v.H + Tm * (tipo === 'folha' || tipo === 'petala' || tipo === 'orvalho' ? 26 + fr * 20 : 6) + Math.sin(Tm + i) * 12) % v.H; g.fillStyle = corA(this.tm.acento, tipo === 'po' ? 0.16 : 0.34);
      }
      x = ((x % v.W) + v.W) % v.W;
      g.beginPath(); if (tipo === 'folha' || tipo === 'petala') g.ellipse(x, y, s * 1.8, s * 0.8, Tm + i, 0, TAU); else g.arc(x, y, s * 0.8, 0, TAU); g.fill();
    }
    // vinheta
    const vg = g.createRadialGradient(v.W / 2, v.H / 2, v.H * 0.45, v.W / 2, v.H / 2, v.H * 0.95); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(2,4,8,.5)');
    g.fillStyle = vg; g.fillRect(0, 0, v.W, v.H);
  }

  pintarHud(g) {
    const p = this.p, v = this.vista, cm = this.cm, d = this.def, Tm = this.T, x0 = 18, y0 = 20;
    // fôlegos: chamas
    for (let i = 0; i < p.vidaMax; i++) {
      const x = x0 + 54 + i * 22, cheio = i < p.vida, tre = cheio ? Math.sin(Tm * 9 + i) * 1 : 0;
      g.fillStyle = 'rgba(8,15,25,.75)'; g.beginPath(); g.ellipse(x, y0 + 9, 8, 10, 0, 0, TAU); g.fill();
      g.fillStyle = cheio ? '#FFE9A8' : '#3A4350'; g.beginPath(); g.moveTo(x, y0 - 2 + tre); g.quadraticCurveTo(x + 7, y0 + 8, x, y0 + 16); g.quadraticCurveTo(x - 7, y0 + 8, x, y0 - 2 + tre); g.fill();
      if (cheio) { g.fillStyle = '#FF9F4A'; g.beginPath(); g.ellipse(x, y0 + 11, 2.6, 4, 0, 0, TAU); g.fill(); }
    }
    // azeite: botija
    const of = p.oleo / this.oleoMax(), cx = x0 + 22, cy = y0 + 18;
    g.fillStyle = 'rgba(8,15,25,.85)'; g.strokeStyle = '#C9B88A'; g.lineWidth = 2; g.beginPath(); g.arc(cx, cy, 20, 0, TAU); g.fill(); g.stroke();
    g.save(); g.beginPath(); g.arc(cx, cy, 17, 0, TAU); g.clip(); g.fillStyle = p.oleo >= OLEO_USO ? '#F2C14E' : '#8A7436'; g.fillRect(cx - 18, cy + 17 - 34 * of + Math.sin(Tm * 3) * 0.8, 36, 36); g.restore();
    for (let k = 1; k < Math.round(this.oleoMax() / OLEO_USO); k++) { const yy = cy + 17 - 34 * k * OLEO_USO / this.oleoMax(); g.fillStyle = 'rgba(8,15,25,.6)'; g.fillRect(cx - 16, yy, 32, 1.5); }
    g.textAlign = 'left'; g.font = '800 13px Alegreya Sans, sans-serif'; g.fillStyle = '#F2E9D0'; g.strokeStyle = 'rgba(8,15,25,.85)'; g.lineWidth = 3;
    const linha = (txt, y) => { g.strokeText(txt, x0 + 54, y); g.fillText(txt, x0 + 54, y); };
    linha('◉ ' + Math.floor(this.char.data.gold) + (cm.sacola ? '   (sacola caída: ' + cm.sacola.gold + ')' : ''), y0 + 44);
    if (d.fase) {
      const rol = cm.selos[this.area].length, est = d.estacoes ? '   ✦ ' + cm.est[this.area].length + '/' + d.estacoes.length : '';
      linha('📜 ' + rol + '/3' + est + (this.N.portaAberta && !this.venceu ? '   → porta aberta' : ''), y0 + 62);
    }
    if (this.peso) linha('Peso de Mamom ×' + this.peso, y0 + 80);
    // bússola do chamado
    if (this.tem('bussola_chamado') && d.fase && !this.luta) {
      const alvo = this.objs.find(ob => (ob.tipo === 'rolo' || ob.tipo === 'estacao') && !ob.feito) || (this.N.porta && !this.venceu ? this.N.porta : null);
      if (alvo) { const a = Math.atan2(alvo.y - p.y, alvo.x - p.x), bx = v.W / 2 + Math.cos(a) * 70, by = v.H * 0.5 + Math.sin(a) * 70; g.save(); g.translate(bx, by); g.rotate(a); g.fillStyle = 'rgba(121,217,205,.8)'; g.beginPath(); g.moveTo(10, 0); g.lineTo(-6, -6); g.lineTo(-2, 0); g.lineTo(-6, 6); g.closePath(); g.fill(); g.restore(); }
    }
  }
}

const encolhe = (c, f) => ({ x: c.x + c.w * (1 - f) / 2, y: c.y + c.h * (1 - f) / 2, w: c.w * f, h: c.h * f });

function criarFx(G) {
  const add = o => { if (G.parts.length < 420) G.parts.push({ max: o.t, ...o }); };
  return {
    po(x, y, n, cor) { for (let i = 0; i < n; i++) add({ x: x + rand(-6, 6), y: y + rand(-4, 2), vx: rand(-90, 90), vy: rand(-110, -10), t: rand(0.25, 0.6), r: rand(1.5, 3.4), cor, g: 240 }); },
    faisca(x, y, n, cor) { for (let i = 0; i < n; i++) { const a = rand(0, TAU), s = rand(120, 380); add({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, t: rand(0.12, 0.3), r: rand(1.2, 2.6), cor, g: 0 }); } },
    sobe(x, y, n, cor) { for (let i = 0; i < n; i++) add({ x: x + rand(-14, 14), y: y - rand(0, 30), vx: rand(-12, 12), vy: rand(-90, -40), t: rand(0.5, 1), r: rand(1.4, 2.6), cor, g: -30 }); },
    anel(x, y, cor, r) { add({ x, y, vx: 0, vy: 0, t: 0.42, r, cor, anel: true, g: 0 }); },
    asas(x, y) { for (const s of [-1, 1]) for (let i = 0; i < 5; i++) add({ x: x + s * (6 + i * 4), y: y + i * 2, vx: s * rand(40, 120), vy: rand(20, 90), t: rand(0.25, 0.5), r: rand(2, 3.5), cor: '#F2F0E4', g: 200 }); }
  };
}
export { lerp };
