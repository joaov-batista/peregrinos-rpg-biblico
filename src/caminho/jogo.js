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
import { T, CW, CH, gerarNivel, tileEm, ESPINHO, OCULTO, FALSA, VAZIO, TRANCA, SOLIDO, PONTE } from './nivel.js';
import { solido } from './corpo.js';
import { novoHeroi, atualizarHeroi, desenharHeroi, ARMAS, OLEO_USO, damp } from './heroi.js';
import { novoVicio, atualizarVicio, desenharVicio, vulneravel } from './bichos.js';
import { CHEFES, novoChefe, atualizarChefe, desenharChefe, danoNoChefe } from './chefes.js';
import { ARMADURA, RELIQUIAS, MUNDO, DIFICULDADES, ARMAS_ALT, areaDef, novoCaminho, semanaDe } from './dados.js';
import { tema, pintarFundo, pintarBlocos, pintarEnfeites, pintarLampioes, pintarLuz, corA } from './cena.js';
import { desenharObjeto } from './objetos.js';
import { abrirMenu, escolherFase, loja, forja, mercador, armeiro, guardaRoupa, petShop } from './menu.js';
import { renderPixel } from './pixel/render.js';
import { ECOS_CORINTO } from '../content/ecos-corinto.js';
import { iconePx } from './pixel/icones.js';
import { aquecerEfeitos, soltar, atualizarEfeitos } from './pixel/efeitos.js';
import { Juntos, limparCodigo } from './juntos.js';

// Primeiros passos: [toque, controle, teclado]
const PASSOS = [
  { id: 'andar', titulo: 'ANDAR', txt: ['Arraste o dedo no lado esquerdo da tela.', 'Use o direcional esquerdo.', 'Setas para andar.'] },
  { id: 'pular', titulo: 'SALTO DUPLO', txt: ['Toque em PULAR e, no ar, toque de novo.', 'A (✕) para pular. No ar, aperte de novo.', 'Z para pular. No ar, aperte de novo.'] },
  { id: 'passo', titulo: 'PASSO PRONTO', txt: ['Toque em PASSO: você atravessa o perigo. Ele demora a voltar (as três setas no alto).', 'RT (R2): atravessa o perigo, mas demora a voltar.', 'C: atravessa o perigo. Demora a voltar (as três setas no alto).'] },
  { id: 'golpe', titulo: 'GOLPE', txt: ['Toque em GOLPE. Segurando para cima ou para baixo, o golpe muda de direção.', 'X (□) golpeia; RB (R1) solta o especial. Com o direcional para cima, para baixo ou na diagonal, o golpe muda.', 'X (ou clique) golpeia. Segure ↑ ou ↓ para golpear para cima, para baixo e nas diagonais.'] },
  { id: 'descer', titulo: 'DESCER DE PLATAFORMAS', txt: ['Sobre uma plataforma de madeira, puxe o direcional para BAIXO e ela deixa você passar.', 'Sobre uma plataforma de madeira, segure para baixo.', 'Sobre uma plataforma de madeira, segure ↓.'] },
  { id: 'rasteiro', titulo: 'PASSO RASTEIRO', txt: ['Para BAIXO + PASSO: você atravessa o adversário sem ser ferido.', 'Para baixo + passo: atravessa o adversário sem ser ferido.', '↓ + C: você atravessa o adversário sem ser ferido.'] },
  { id: 'luz', titulo: 'A LÂMPADA · LUZ', txt: ['Segure LÂMPADA: a luz cresce e revela paredes falsas e pisos escondidos.', 'Segure LB (L1): a luz revela paredes falsas e pisos escondidos.', 'Segure S: a luz cresce e revela paredes falsas e pisos escondidos.'] },
  { id: 'vigilia', titulo: 'A LÂMPADA · VIGÍLIA', txt: ['É a sua única defesa. Toque em LÂMPADA no instante em que o dardo chega. Cedo ou tarde demais, não protege.', 'É a sua única defesa. Aperte LB (L1) no instante em que o dardo chega. Cedo ou tarde demais, não protege.', 'É a sua única defesa. Aperte S no instante em que o dardo chega. Cedo ou tarde demais, não protege.'] },
  { id: 'azeite', titulo: 'O AZEITE', txt: ['O jarro no alto é o azeite da lâmpada. Cada golpe certo e cada defesa perfeita o enchem.'] },
  { id: 'orar', titulo: 'ORAR', txt: ['Segure ORAR, parado: gasta um terço do azeite e devolve um fôlego.', 'Segure B (○) ou LT (L2), parado: gasta um terço do azeite e devolve um fôlego.', 'Segure A, parado: gasta um terço do azeite e devolve um fôlego.'] }
];

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
    this.fx = criarFx(this); this.mp = null;
    // arte em pixel (padrão); a arte vetorial antiga fica em Ajustes › Arte
    this.pixel = config.pixel !== false; this.fxPx = []; this.clarao = 0; if (this.pixel) aquecerEfeitos();
    document.body.classList.toggle('cm-pixel', this.pixel);
    this.tipoArma = CLASSES[char.cls]?.arma || 'espada'; this.equiparArma();
    this.onResize = () => this.resize(); addEventListener('resize', this.onResize); this.resize();
    document.body.classList.add('caminho'); input.perfil = 'caminho';
    this.botao = h('button', { id: 'cmMenu', 'aria-label': 'Menu', title: 'Menu (Esc)', onclick: () => this.menu() }, '☰');
    document.body.append(this.botao);
    this.padAntes = input.padAcoes; input.padAcoes = { menu: () => this.menu(), mapa: () => this.menu('mapa') };
    for (const [act, nome] of Object.entries({ dodge: 'Pular', lock: 'Passo', defend: 'Lâmpada', botija: 'Orar', skill: CLASSES[char.cls]?.skill.nome || 'Verso', attack: 'Golpe' })) { const b = document.querySelector(`[data-act="${act}"]`); if (b) { b.dataset.name = nome; b.title = nome; } }
    this.icones = [];
    for (const [act, simb] of Object.entries({ dodge: '⤒', lock: '»', defend: '🪔', botija: '🙏' })) { const b = document.querySelector(`[data-act="${act}"]`); if (b) { this.icones.push([b, [...b.childNodes], b.hidden]); b.replaceChildren(this.pixel ? iconePx({ dodge: 'pular', lock: 'passo', defend: 'lampada', botija: 'orar' }[act]) : simb); b.hidden = false; } }
    if (this.pixel) this.botao.replaceChildren(iconePx('menu', 22));
    this.entrar(this.cm.ebenezer?.area || 'refugio', { ebenezer: true });
    this.raf = requestAnimationFrame(t => this.loop(t));
    const sala = limparCodigo(new URLSearchParams(location.search).get('sala'));
    const par = new URLSearchParams(location.search);
    if (sala.length === 5) this.entrarNaSala(sala, par.has('redelocal')).catch(e => this.ui.toast(e.message, 6000));
    else if (par.get('quadro') === '0' && parent !== window) // tela dividida: o primeiro quadro abre a sala e avisa a página de fora
      this.abrirSala(false).then(cod => ({ cod, local: false }), () => this.abrirSala(true).then(cod => ({ cod, local: true })))
        .then(r => parent.postMessage({ peregrinosSala: r.cod, local: r.local }, location.origin)).catch(e => this.ui.toast(e.message, 6000));
  }

  destroy() {
    this.mp?.sair(); this.running = false; cancelAnimationFrame(this.raf); removeEventListener('resize', this.onResize);
    for (const [b, filhos, oculto] of this.icones) { b.replaceChildren(...filhos); b.hidden = oculto; }
    document.body.classList.remove('caminho', 'cm-dash', 'cm-pixel'); input.perfil = null; input.padAcoes = this.padAntes; this.botao.remove(); music(null); this.ui.bossBar(null); this.ui.setInteract(null);
  }

  // a arma da vocação, com as mudanças da arma comprada no armeiro
  equiparArma() { const base = ARMAS[this.tipoArma] || ARMAS.espada, alt = ARMAS_ALT[this.tipoArma]?.[this.cm.armaAlt?.[this.char.cls]]; this.arma = alt ? { ...base, ...alt } : base; }
  get dif() { return DIFICULDADES[this.cm.dif] || DIFICULDADES.provacao; }
  tem(rel) { return this.cm.eq.includes(rel) || (RELIQUIAS[rel]?.passiva && this.cm.reliquias.includes(rel)); }
  vidaMax() { return Math.max(3, 5 + (this.hab.couraca ? 2 : 0) + Math.floor(this.cm.mana / 3) + (this.tem('osso_bronze') ? 1 : 0) + this.dif.vidas); }
  oleoMax() { return this.tem('odre_novo') ? 132 : 99; }
  espacos() { return 3 + (this.cm.reliquias.includes('coroa_restituida') ? 1 : 0) + (this.cm.reliquias.includes('perola_preco') ? 1 : 0); }
  danoBase() { return 10 * (1 + Math.min(0.6, (this.char.level - 1) * 0.03)) * (1 + [0, 0.12, 0.24, 0.36, 0.5][this.cm.fio || 0]); }
  raioLuz() { const o = this.p.oleo / this.oleoMax(), b = (this.tem('lamparina_abismo') ? 150 : 105) + o * 95; return b * (1 + this.p.lampA * 0.6); }

  resize() {
    const { W, H } = viewSize(), dpr = Math.min(2, devicePixelRatio || 1);
    this.cv.width = Math.round(W * dpr); this.cv.height = Math.round(H * dpr); this.cv.style.width = W + 'px'; this.cv.style.height = H + 'px';
    this.dpr = dpr; this.vista.W = W; this.vista.H = H; this.vista.Z = clamp(H / (CH * T), 0.3, 8);
  }

  async cinema(id, forcar = false, remoto = false) {
    const vistas = this.char.data.cinemas;
    if (!CINEMAS[id] || (!forcar && (vistas.includes(id) || config.cinemas === false))) return false;
    if (remoto && this.ui.blocking) return false;
    if (!remoto) this.mp?.ev('cin', { id }); // juntos, a história aparece para todos de uma vez
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
    if (def.fase?.tema === 'conves') this.fazerBarco(N); // a travessia para Társis: o convés tem vãos por onde o mar entra
    N.revel = new Float32Array(N.w * N.h); N.desfeita = new Set(); N.portaAberta = false;
    this.inimigos = []; this.tiros = []; this.zonas = []; this.moedas = []; this.parts = []; this.textos = []; this.chefe = null; this.puxao = null; this.pecado = null;
    this.escuroAlvo = 0; this.lentidaoAlvo = 1; this.peso = 0; this.luta = false; this.venceu = false; this.vento = null; this.climaT = 6; this.usados = {}; this.perto = null; this.emb = null;
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
    if (def.fase || def.mundo || def.extra) this.objs.push({ tipo: 'retorno', x: N.inicio.x - 72, y: N.inicio.y, luz: 80 });
    if (cm.sacola?.area === id) this.objs.push({ tipo: 'sacola', x: cm.sacola.x, y: cm.sacola.y, luz: 70 });
    this.mp?.mudouArea(id);
    if (this.souDono()) this.povoar();
    // onde o peregrino aparece
    let pos = N.inicio;
    const eb = this.objs.find(ob => ob.tipo === 'ebenezer');
    if (o.ebenezer && cm.ebenezer?.area === id && eb) pos = { x: eb.x - 40, y: eb.y };
    else if (o.portal) { const pt = this.objs.find(ob => ob.tipo === 'portal' && (ob.semana === o.portal || ob.mundo === o.portal)); if (pt) pos = { x: pt.x, y: pt.y }; }
    const antigo = this.p;
    this.p = this.eu = novoHeroi(pos.x, pos.y - 1, this.vidaMax());
    this.p.oleo = o.manter && antigo ? antigo.oleo : Math.min(this.oleoMax(), OLEO_USO);
    if (o.manter && antigo) this.p.vida = Math.min(this.p.vidaMax, antigo.vida);
    this.usouSelo = false; this.usouCepa = false; this.usouTunica = false; this.mercadorTem = Math.random() < 0.3 ? Object.keys(RELIQUIAS).filter(k => RELIQUIAS[k].raro && !cm.reliquias.includes(k))[Math.floor(Math.random() * 3)] || null : null;
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
      this.cm.visto.tut = 0; // os primeiros passos são ensinados fazendo (ver tutorial())
    }
  }
  textoControles() {
    return input.touch
      ? 'Arraste o dedo à esquerda para andar. Botões: pular (duas vezes no ar) · passo pronto, que demora a voltar · golpear (com o direcional para cima ou para baixo) · 🛡 erguer a lâmpada (vigília) · 🫙 orar e recuperar um fôlego.\n\nA lâmpada só defende no instante certo do golpe: é a DEFESA PERFEITA. Cedo ou tarde demais, não protege.'
      : 'Setas: andar · Z: pular (duas vezes no ar) · X: golpear, com ↑ ou ↓ para mudar a direção · C: passo pronto (↓ + C atravessa o adversário) · S: erguer a lâmpada · A (segurar): orar · D: especial da vocação · ↑ ou E: ler e falar · Tab: mapa · I: inventário · Esc: menu.\n\nNo controle: A pula, X golpeia, B (segurar) ora, RT é o passo, LB ergue a lâmpada, RB solta o especial, Y interage.\n\nA lâmpada só defende no instante certo: erguê-la quando o golpe chega é a DEFESA PERFEITA. Cedo ou tarde demais, não protege. A luz também revela o que está escondido.';
  }

  // os vícios da área (voltam a cada descanso numa Pedra de Ebenézer)
  povoar() {
    const def = this.def;
    this.inimigos = this.inimigos.filter(e => e.kind === 'chefe');
    if (!def.inimigos) return;
    const esc = 1 + (def.fase?.nivel || 1) * 0.05, voadores = ['distracao', 'duvida', 'medo', 'vaidade'];
    this.N.spawns.forEach((s, i) => { const tipos = def.inimigos.filter(t => !!s.voa === voadores.includes(t)), lista = tipos.length ? tipos : def.inimigos; this.nascer(lista[i % lista.length], s.x, s.y + 14, false, esc).cel = s.cel; });
  }
  nascer(tipo, x, y, daLuta, esc = 1) { const e = novoVicio(tipo, x, y, esc); e.daLuta = daLuta; this.inimigos.push(e); return e; }

  temSelos() { const d = this.def, cm = this.cm; return !d.fase || (cm.selos[this.area].length >= (d.rolos || 3) && (d.estacoes || []).every(e => cm.est[this.area].includes(e.id))); }
  conferirPorta(quieto) {
    const d = this.def, cm = this.cm;
    if (!d.chefe) return;
    if (this.temSelos() && !this.N.portaAberta && (!this.luta || this.mp)) { this.N.portaAberta = true; if (!quieto) { sfx('gate'); this.ui.toast('Os três selos brilham. A porta do chefe se abriu.', 4500); this.tremor(5); } }
  }

  /* ================= Laço ================= */
  loop(now) {
    if (!this.running) return;
    const dt = Math.min(0.033, (now - this.last) / 1000); this.last = now;
    if (!document.hidden) { if (!this.ui.blocking) this.update(dt); else if (this.mp) this.updateAusente(dt); this.mp?.tick(dt); }
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
    if (this.clarao > 0) this.clarao -= dt; if (this.p.flashT > 0) this.p.flashT -= dt;
    if (this.hitstop > 0) { this.hitstop -= dt; this.atualizarFx(dt * 0.2); atualizarEfeitos(this.fxPx, dt * 0.25); return; }
    atualizarEfeitos(this.fxPx, dt);
    this.T += dt; this.char.data.stats.playtime = (this.char.data.stats.playtime || 0) + dt;
    const p = this.p, N = this.N;
    this.escuro = damp(this.escuro, Math.max(this.tm.escuro, this.escuroAlvo || 0), 2, dt);
    this.lentidao = damp(this.lentidao, this.lentidaoAlvo * (1 - Math.min(0.3, this.peso * 0.06)) * (this.tem('sandalias_mensageiro') ? 1.1 : 1), 6, dt);
    p.oleoFrac = p.oleo / this.oleoMax(); document.body.classList.add('cm-dash');
    if (this.tem('orvalho_ceu') && p.oleo < OLEO_USO) p.oleo = Math.min(OLEO_USO, p.oleo + 1.6 * dt);
    if (p.morto) { this.mortoT -= dt; if (this.mortoT <= 0) this.renascer(); }
    else {
      if (this.puxao && !p.dashT) p.x += Math.sign(this.puxao.x - p.x) * this.puxao.f * dt * (Math.abs(this.puxao.x - p.x) > 30 ? 1 : 0);
      if (this.tem('cinto_compaixao') && p.orando > 0) p.orando += dt * 0.45;
      atualizarHeroi(this, dt);
      if (p.acoite) { p.acoite.t += dt; if (p.acoite.t > p.acoite.dur) p.acoite = null; }
      if (p.investida > 0) { p.investida -= dt; this.golpear(caixa({ ...p, w: 46 }), this.danoBase() * 2.4, this.investidaAtk); }
    }
    // a lâmpada revela
    if (p.lamp) this.revelar();
    for (let i = 0; i < N.revel.length; i++) if (N.revel[i] > 0) N.revel[i] -= dt;
    this.simular(dt);
    this.atualizarTiros(dt); this.atualizarZonas(dt); this.atualizarMoedas(dt); this.atualizarFx(dt);
    if (this.pecado) this.atualizarPecado(dt);
    this.clima(dt); this.gatilhos(); this.emboscadas(dt); this.interacoes(); this.tutorial(dt);
    if (this.def.pvp && this.mp) this.pvp(); if (this.def.desafio) this.desafio(dt);
    this.companheiro(dt); this.ritmo(dt); if (this.def.mundo === 'leviata') this.barco(dt);
    // câmera
    const v = this.vista, vw = v.W / v.Z, vh = v.H / v.Z;
    if (this.N.barco) this.balanco = Math.sin(this.T * 0.9) * 7 + Math.sin(this.T * 2.3) * 2; else this.balanco = 0; // o navio sobe e desce na tempestade
    v.cam.x = damp(v.cam.x, p.x + p.face * 46 - vw / 2, 6, dt); v.cam.y = damp(v.cam.y, this.camYAlvo(vh), 6, dt); this.prenderCam();
    this.tremorA = Math.max(0, this.tremorA - dt * 34);
    if (this.chefe) this.ui.bossBar(this.chefe.d.nome, Math.max(0, this.chefe.hp / this.chefe.max), this.chefe.d.titulo, this.chefe.post / 100);
    this.salvaT = (this.salvaT || 0) + dt; if (this.salvaT > 40) { this.salvaT = 0; this.salvar(); }
  }

  // vícios e chefe. Quem simula é o dono da área; o contato com o MEU peregrino, cada aparelho confere o seu.
  simular(dt) {
    const p = this.eu, mp = this.mp, dono = this.souDono() && !this.congela;
    for (const e of this.inimigos) {
      if (dono) {
        const alvo = this.p = mp ? mp.alvo(e, p) : p;
        if (e.kind === 'chefe') atualizarChefe(this, e, dt);
        else if (Math.abs(e.x - alvo.x) < 900 && Math.abs(e.y - alvo.y) < 560) atualizarVicio(this, e, dt);
        this.p = p;
      }
      if (this.ausente || p.morto) continue;
      if (e.kind === 'chefe' && !e.morrendo) {
        if (e.c.regras?.aura) this.lentidaoAlvo = Math.hypot(p.x - e.x, p.y - e.y) < e.c.regras.aura.raio ? e.c.regras.aura.lentidao : 1;
        if (e.raios && e.raios.aviso <= 0 && p.inv <= 0) { // raios do relógio
          const cx = e.x, cy = e.y - e.h * 0.55, r = e.raios;
          for (let i = 0; i < r.n; i++) { const a = r.a + i * TAU / r.n, ux = Math.cos(a), uy = Math.sin(a), px = p.x - cx, py = p.y - 19 - cy, t = clamp(px * ux + py * uy, 30, r.len); if (Math.hypot(px - ux * t, py - uy * t) < 15) { this.ferirHeroi(1, e); break; } }
        }
      }
      if (e.hp > 0 && !e.morrendo && !(e.alpha < 0.5) && (e.kind !== 'vicio' || e.vista > 0.5) && toca(caixa(p), encolhe(caixa(e), e.kind === 'chefe' ? 0.72 : 0.8))) {
        const r = this.ferirHeroi(1, e);
        if (r === true && e.ai === 'ladrao' && !e.fugindo) { const q = Math.min(this.char.data.gold, 15); this.char.data.gold -= q; e.roubo = q; e.fugindo = 5; if (q) this.textoEm(p.x, p.y - 50, '−' + q + ' denários!', '#FFD23F'); }
      }
    }
    this.inimigos = this.inimigos.filter(e => e.kind === 'chefe' ? !e.fora : e.hp > 0 || (!e.sumiu && this.matar(e), false));
    // juntos: se ninguém vivo ficou na arena, o chefe volta a esperar
    if (mp && dono && this.luta && this.chefe && !this.chefe.morrendo) { this.vazioT = mp.vivosNaArena(this.N.arena) ? 0 : (this.vazioT || 0) + dt; if (this.vazioT > 3) { this.inimigos = this.inimigos.filter(e => e.kind !== 'chefe' && !e.daLuta); this.lutaRemota(false); } }
  }
  // com uma janela aberta numa sala com outros peregrinos, o mundo não para (e quem está lendo não é ferido)
  updateAusente(dt) {
    atualizarEfeitos(this.fxPx, dt); this.atualizarFx(dt);
    if (!this.souDono()) return;
    this.T += dt; this.ausente = true; this.simular(dt); this.atualizarTiros(dt); this.atualizarZonas(dt); this.ausente = false;
  }

  /* ================= Juntos ================= */
  souDono() { return !this.mp || this.mp.souDono; }
  get outros() { const r = []; if (this.mp) for (const o of this.mp.naArea()) if (!o.h.morto) r.push({ corpo: o.h, look: o.look, cls: o.cls, arma: o.arma, hab: o.hab, nome: o.nome }); return r; }
  async abrirSala(local) {
    if (this.mp) return this.mp.codigo;
    const { novoCodigo } = await import('./juntos.js');
    let cod = this.cm.sala || novoCodigo(), mp;
    try { mp = await Juntos.abrir(this, cod, local); } catch (e) { if (!/em uso/.test(e.message)) throw e; cod = novoCodigo(); mp = await Juntos.abrir(this, cod, local); }
    this.mp = mp; this.cm.sala = cod; this.salvar(); return cod;
  }
  async entrarNaSala(cod, local) {
    if (this.mp) this.mp.sair();
    this.mp = await Juntos.entrar(this, limparCodigo(cod), local);
    this.ui.toast('Você entrou na sala ' + this.mp.codigo + '. Seu progresso continua sendo seu.', 5000);
  }
  sairDaSala() { this.mp?.sair(); this.mp = null; }
  // golpe de um companheiro, já calculado no aparelho dele
  golpeRemoto(e, m) {
    if (!e || e.hp <= 0 || e.morrendo) return;
    e.hp -= m.d; e.flash = 0.1; e.semGolpe = 0;
    if (e.kind === 'chefe') { if (m.cl) e.clones = []; if (m.po) this.postura(e, m.po); if (e.hp <= 0) this.chefeMorre(e); }
    else { e.stun = Math.max(e.stun, 0.2); e.estado = 'idle'; e.tele = 0; if (m.vx != null) { e.vx = m.vx; e.vy = m.vy; e.chao = false; } }
  }
  chefeMorre(e) { e.hp = 0; e.morrendo = 1.7; e.mov = null; e.raios = null; e.clones = []; this.limparPerigos(); this.puxao = null; this.hitstop = 0.3; this.tremor(16); sfx('boss'); for (const v of this.inimigos) if (v.kind === 'vicio') v.hp = 0, v.sumiu = false; }
  chefeSeFortalece(b, nome) { b.hp = Math.min(b.max, b.hp + b.max * 0.08); this.textoEm(b.x, b.y - b.h - 20, (nome || 'Um peregrino') + ' caiu: a sombra se fortalece', '#FF8A7A', 13); }
  zonaDefendida(z) { if (z.expoe && z.dono) { z.dono.exposto = 2.3; this.textoEm(z.dono.x, z.dono.y - z.dono.h - 22, 'A TESTA ESTÁ EXPOSTA!', '#FFE9A8', 17); } z.dur = 0; }
  // a luta começou ou se desfez no aparelho do dono da área
  lutaRemota(on) {
    this.luta = on;
    if (on) { music('chefe'); sfx('boss'); const b = this.inimigos.find(e => e.kind === 'chefe'); if (b) { this.chefe = b; this.ui.banner(b.d.titulo || 'Chefe', b.d.nome, b.d.ref); } }
    else { this.chefe = null; this.vazioT = 0; this.limparPerigos(); this.puxao = null; this.escuroAlvo = 0; this.lentidaoAlvo = 1; this.ui.bossBar(null); if (!this.venceu) music(this.def.paz ? 'mundo' : 'fase'); }
  }
  // sem voltar a gerar a área: os outros continuam nela
  reviver() {
    const p = this.eu, eb = this.cm.ebenezer?.area === this.area && this.objs.find(ob => ob.tipo === 'ebenezer'), pos = eb ? { x: eb.x - 40, y: eb.y } : this.N.inicio;
    Object.assign(p, novoHeroi(pos.x, pos.y - 1, this.vidaMax())); p.oleo = Math.min(this.oleoMax(), OLEO_USO); p.inv = 2; this.fade = 1; this.usouSelo = this.usouCepa = false;
    this.vista.cam.x = pos.x - this.vista.W / this.vista.Z / 2; this.vista.cam.y = this.camYAlvo(this.vista.H / this.vista.Z); this.prenderCam();
    this.ui.toast('"O justo cai sete vezes e se levanta" (Pv 24:16). Seus companheiros seguem na luta.', 5000);
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
  efeito(nome, x, y, vira = 1, o) { if (this.pixel) soltar(this.fxPx, nome, x, y, vira, o); this.mp?.fx(['e', nome, x, y, vira]); }
  tremor(a) { if (config.tremor !== false) this.tremorA = Math.max(this.tremorA, a); }
  textoEm(x, y, txt, cor = '#fff', tam = 14) { this.textos.push({ x, y, txt, cor, tam, t: 1.3 }); this.mp?.fx(['t', x, y, txt, cor, tam]); }
  fala(b, txt) { this.textos.push({ x: b.x, y: b.y - b.h - 16, txt: '“' + txt + '”', cor: '#F2E9D0', tam: 13, t: 2.4, fixo: b }); if (b.nid) this.mp?.fx(['f', b.nid, txt]); }
  grito(txt) { this.gritoTxt = { txt, t: 2.6 }; this.mp?.fx(['g', txt]); }
  postura(b, n) { if (b.quebrado > 0) return; b.post = Math.min(100, b.post + n); b.postT = 2.2; if (b.post >= 100) { b.quebrado = 2.5; b.mov = null; this.textoEm(b.x, b.y - b.h - 20, 'QUEBRANTADO!', '#FFE9A8', 20); sfx('crit'); this.tremor(10); this.hitstop = 0.12; this.limparPerigos(); } }
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
    if (this.souDono()) return this.atingirJa(e, dano, deX, atk);
    // numa área simulada por outro aparelho: sinto o golpe aqui e aviso o dono
    const hp0 = e.hp, po0 = e.post || 0, q0 = e.quebrado > 0, cl0 = e.clones?.length;
    const r = this.atingirJa(e, dano, deX, atk);
    if (e.nid && (hp0 !== e.hp || cl0)) this.mp.ev('g', { id: e.nid, d: Math.round((hp0 - e.hp) * 100) / 100, po: e.kind === 'chefe' ? (e.quebrado > 0 && !q0 ? 100 : Math.max(0, e.post - po0)) : 0, cl: cl0 ? 1 : 0, vx: e.kind === 'vicio' ? Math.round(e.vx) : null, vy: Math.round(e.vy || 0) });
    return r;
  }
  atingirJa(e, dano, deX, atk = {}) {
    const p = this.p, dir = Math.sign(e.x - deX) || 1;
    if (e.kind === 'chefe') {
      if (e.semDano > 0 || e.alpha < 0.5) return false;
      const forte = e.exposto > 0 || e.quebrado > 0 || e.tonto > 0;
      let d = danoNoChefe(e, dano, this.tipoArma) * (forte && this.tem('pedra_lisa') ? 1.4 : 1);
      if (e.c.fases[e.fase].golpes.includes('voz') && e.id === 'babilonia') d *= 0.25; // a voz do céu: não é hora de bater
      e.hp -= d; e.flash = 0.1; e.semGolpe = 0; this.postura(e, atk.carga ? 14 : 2);
      if (e.clones.length) { for (const cl of e.clones) this.fx.po(cl.x, cl.y - e.h / 2, 12, e.d.cor || '#C79BFF'); e.clones = []; this.postura(e, 30); this.textoEm(e.x, e.y - e.h - 12, 'A verdadeira!', '#FFE9A8'); sfx('right'); }
      this.fx.faisca(e.x - dir * e.w * 0.3, clamp(p.y - 22, e.y - e.h, e.y), forte ? 12 : 6, forte ? '#FFE9A8' : '#fff'); this.efeito(forte ? 'critico' : 'faiscaLuz', e.x - dir * e.w * 0.3, clamp(p.y - 28, e.y - e.h, e.y), dir);
      if (config.numerosDano !== false) this.textoEm(e.x + rand(-14, 14), e.y - e.h - 4, String(Math.round(d)), forte ? '#FFE9A8' : '#E6E0CF', forte ? 17 : 13);
      this.ganharOleo(atk.semOleo ? 0 : 11); sfx(forte ? 'crit' : 'hit'); this.hitstop = forte ? 0.07 : 0.04; this.tremor(forte ? 6 : 2.5);
      if (e.hp <= 0) this.chefeMorre(e);
      return true;
    }
    if (!vulneravel(e, deX)) { sfx('block'); this.fx.faisca(e.x - dir * e.r, e.y - e.h / 2, 5, '#C79BFF'); if (e.ai === 'guarda') this.textoEm(e.x, e.y - e.h - 8, 'pelas costas!', '#C79BFF', 11); return true; }
    e.hp -= dano; e.flash = 0.12; e.stun = Math.max(e.stun, 0.1); e.estado = 'idle'; e.tele = 0; e.irado = 4; e.cd = Math.min(e.cd, 0.3); // ferido, o vício avança
    const k = (this.arma.empurra || 1) * (e.ai === 'guarda' ? 0.35 : 1);
    if (atk.dir === 'cima') { e.vy = -260 * k; } else if (atk.dir === 'baixo') { e.vy = 160; } else { e.vx = dir * 110 * k; if (!e.voa) e.vy = -90 * k; e.chao = false; }
    this.fx.faisca(e.x, e.y - e.h / 2, 7, '#fff'); this.efeito('faisca', e.x, e.y - e.h / 2, dir); this.ganharOleo(atk.semOleo ? 0 : 11); sfx('hit'); this.hitstop = 0.05; this.tremor(2);
    return true;
  }

  ganharOleo(n) { const p = this.p; p.oleo = Math.min(this.oleoMax(), p.oleo + n * this.dif.oleo * (this.tem('purpura_lidia') ? 1.35 : 1)); }

  matar(e) {
    const c = this.char, d = e.d;
    e.sumiu = true; if (this.mp && e.nid) { this.mp.mortos.add(e.nid); if (this.mp.souDono) this.mp.ev('mo', { id: e.nid }); } sfx('kill'); this.efeito('sumico', e.x, e.y); this.fx.po(e.x, e.y - e.h / 2, 16, d.cor || '#8E98BE'); this.fx.anel(e.x, e.y - e.h / 2, d.cor || '#fff', 44);
    if (e.daLuta) return;
    this.soltarMoedas(e.x, e.y - e.h / 2, Math.max(1, Math.round((d.ouro || 4) / 3)) + (e.roubo || 0) + (e.elite ? 12 : 0));
    c.data.stats.kills++; c.data.kills[e.type] = (c.data.kills[e.type] || 0) + 1; this.xp(d.xp || 8); this.pontos(10);
    if (c.data.kills[e.type] === 1 && d.licao) this.ui.toast(d.nome + ' vencida pela primeira vez: ' + d.licao, 5200);
  }

  soltarMoedas(x, y, n) { for (let i = 0; i < n; i++) this.moedas.push({ x, y, vx: rand(-150, 150), vy: rand(-330, -140), t: 0, v: 1 }); }
  xp(n) { const c = this.char; if (c.level >= MAX_LEVEL) return; c.data.xp += n; let up = false; while (c.data.xp >= xpNeed(c.level) && c.level < MAX_LEVEL) { c.data.xp -= xpNeed(c.level); c.level++; up = true; } if (up) { sfx('level'); this.ui.toast('Nível ' + c.level + ' de peregrino: seus golpes ficaram um pouco mais firmes.'); } }
  pontos(n) { this.char.score += n; this.char.week_score += n; }

  ferirHeroi(n, origem, o = {}) {
    const p = this.p;
    if (this.ausente || p !== this.eu || p.morto || p.inv > 0 || this.fade > 0.5) return false;
    if (p.vig > 0 && !o.espinho && !o.semDefesa) {
      p.inv = 0.4; this.ganharOleo(this.hab.escudo ? 30 : 20); sfx('parry'); vibrar(90, 0.5);
      this.fx.anel(p.x + p.face * 12, p.y - 26, '#FFE9A8', 54); this.fx.faisca(p.x + p.face * 14, p.y - 28, 12, '#FFE9A8'); this.hitstop = 0.09; this.tremor(5);
      this.textoEm(p.x, p.y - 70, 'VIGIAI!', '#FFE9A8', 15); this.efeito('vigilia', p.x + p.face * 14, p.y - 30, p.face); this.clarao = 0.08;
      if (origem?.nid && !this.souDono()) this.mp.ev('pa', { id: origem.nid, vx: Math.sign(origem.x - p.x) * 240 });
      if (origem?.kind === 'chefe') this.postura(origem, 26);
      else if (origem?.kind === 'vicio') { origem.stun = 1.5; origem.vx = Math.sign(origem.x - p.x) * 240; origem.aberto = 1.5; }
      o.aoDefender?.(); this.tutParry = true;
      return 'parry';
    }
    if (this.tem('tunica_sem_costura') && !this.usouTunica && !o.espinho) { this.usouTunica = true; p.inv = 1; this.fx.anel(p.x, p.y - 24, '#F4F1E6', 70); this.textoEm(p.x, p.y - 64, 'A túnica não se rasgou', '#F4F1E6', 12); sfx('block'); return false; }
    if (this.luta && this.chefe?.c.dano) n = Math.max(n, this.chefe.c.dano); // Beemote e Leviatã ferem em dobro
    p.vida -= n; p.inv = this.tem('manto_marinheiro') ? 1.7 : 1.15; p.stunT = 0.24; p.orando = 0; p.carga = 0; p.atk = null; p.dashT = 0;
    if (!this.tem('manto_marinheiro') && !o.espinho) { const dir = origem ? Math.sign(p.x - origem.x) || 1 : -p.face; p.vx = dir * 300; p.vy = -330; p.chao = false; }
    p.flashT = 0.12; sfx('hurt'); this.ui.hurt(); vibrar(170, 0.8); this.hitstop = 0.13; this.tremor(10); this.fx.faisca(p.x, p.y - 22, 10, '#FF6B5A');
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
    if (this.mp && this.luta && this.chefe) { if (this.souDono()) { if (this.mp.acompanhado()) this.chefeSeFortalece(this.chefe, this.char.name); } else this.mp.ev('tb'); }
    // a sacola de talentos fica onde você caiu; cair de novo antes de buscá-la a perde
    if (this.def.extra) { /* nas provas ninguém perde a sacola */ } else if (c.data.gold > 0) { cm.sacola = { area: this.area, x: p.seguro.x, y: p.seguro.y, gold: c.data.gold }; c.data.gold = 0; } else if (cm.sacola) cm.sacola = null;
    this.ui.bossBar(null);
  }
  renascer() {
    if (this.def.desafio) { const n = (this.des?.onda || 1) - 1; this.des = null; this.entrar('refugio', { quieto: true }); return this.ui.toast('Você aguentou ' + n + ' onda(s). Melhor marca: ' + (this.cm.recorde || 0) + '.', 6000); }
    if (this.def.pvp) { this.des = null; return this.reviver(); }
    if (this.mp?.acompanhado()) return this.reviver();
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
      case 'pastor': // cinco pedras lisas do ribeiro, em leque, e um clarão na funda
        this.efeito('coleta', p.x + p.face * 16, p.y - 30, p.face); this.efeito('giroRoxo', p.x, p.y - 4, p.face, { gruda: p });
        for (let i = -2; i <= 2; i++) tiro({ vx: p.face * 600 * Math.cos(i * 0.17), vy: 600 * Math.sin(i * 0.17) - 40, dano: base * 1.2, g: 260, r: 6, vida: 0.9, tipo: 'pedra', brilho: true }); break;
      case 'profeta': { // fogo do céu sobre o altar (1Rs 18:38): coluna, explosão e brasas
        const x = perto && Math.abs(perto.x - p.x) < 380 ? perto.x : p.x + p.face * 150, chao = perto ? perto.y : p.y;
        this.zonas.push({ tipo: 'col', x, w: 78, aviso: 0.22, dur: 0.34, cor: '#FFB05A', amigo: base * 3.6, y0: p.y - 420, y1: p.y + 60 });
        this.efeito('pilar', x, chao); this.efeito('explosaoFogo', x, chao); this.clarao = 0.14; this.tremor(7);
        for (let i = 0; i < 6; i++) tiro({ x: x + rand(-30, 30), y: chao - 20, vx: rand(-260, 260), vy: rand(-420, -220), g: 900, dano: base * 0.5, r: 5, vida: 0.8, tipo: 'fogo' }); break; }
      case 'levita': // o toque da trombeta: três ondas de som para todos os lados
        this.efeito('giroSom', p.x, p.y - 6, p.face, { gruda: p }); this.efeito('vigilia', p.x, p.y - 30, p.face); this.fx.anel(p.x, p.y - 22, '#BFF0F8', 170);
        for (let k = 0; k < 10; k++) { const a = k * TAU / 10; tiro({ x: p.x, y: p.y - 26, vx: Math.cos(a) * 420, vy: Math.sin(a) * 420, dano: base * 0.9, r: 10, r0: 10, vida: 0.4, max: 0.4, tipo: 'som', fura: true }); }
        this.golpear({ x: p.x - 150, y: p.y - 160, w: 300, h: 200 }, base * 1.2, atk); this.tiros = this.tiros.filter(t => t.amigo || Math.hypot(t.x - p.x, t.y - p.y) > 180); for (const e of this.inimigos) if (e.kind === 'vicio' && Math.abs(e.x - p.x) < 170) e.stun = 1.2; break;
      case 'zelote': // investida de punhais: atravessa cortando três vezes
        p.dashT = 0.28; p.dashDir = p.face; p.inv = Math.max(p.inv, 0.42); p.investida = 0.28; this.investidaAtk = atk;
        for (let i = 0; i < 3; i++) this.efeito('corteAdaga', p.x + p.face * (30 + i * 70), p.y - (i % 2 ? 8 : -6), i % 2 ? -p.face : p.face, { vel: 1 - i * 0.18 });
        this.efeito('giroRoxo', p.x, p.y - 4, p.face, { gruda: p }); break;
      case 'valente': // a lança arremessada que atravessa a fileira
        this.efeito('estocadaLonga', p.x, p.y, p.face, { gruda: p }); tiro({ vx: p.face * 780, dano: base * 3.2, fura: true, r: 9, vida: 0.75, tipo: 'lanca' }); p.vx -= p.face * 160; break;
      case 'juiz': // a aguilhada de Sangar: um açoite longo que estala três vezes
        p.acoite = { t: 0, dur: 0.34, face: p.face, alc: 250 };
        for (let i = 1; i <= 3; i++) this.efeito('estalo', p.x + p.face * i * 80, p.y - 26 - (i === 2 ? 10 : 0), p.face, { vel: 1.5 - i * 0.25 });
        this.golpear({ x: p.face > 0 ? p.x : p.x - 250, y: p.y - 52, w: 250, h: 52 }, base * 2.8, atk); break;
      default: this.efeito('giro', p.x, p.y, p.face, { gruda: p }); this.efeito('almas', p.x, p.y, p.face); this.fx.anel(p.x, p.y - 22, '#FFF1BE', 100); this.golpear({ x: p.x - 96, y: p.y - 100, w: 192, h: 120 }, base * 2.7, atk);
    }
    this.textoEm(p.x, p.y - 58, CLASSES[cls]?.skill.nome || 'Verso', '#FFF1BE', 12);
  }

  atualizarTiros(dt) {
    const p = this.p, N = this.N, pc = caixa(p);
    for (const t of this.tiros) {
      t.vida -= dt; if (t.g) t.vy += t.g * dt; t.x += t.vx * dt; t.y += t.vy * dt;
      if (t.tipo === 'som' && t.max) t.r = t.r0 + (1 - t.vida / t.max) * 16;
      if (!t.fixo && !t.fura && solido(N, Math.floor(t.x / T), Math.floor(t.y / T))) { t.vida = 0; this.fx.po(t.x, t.y, 3, t.cor); continue; }
      if (t.fixo && N.arena && (t.x < N.arena.x0 || t.x > N.arena.x1)) { t.vida = 0; continue; }
      if (t.amigo) {
        t.hits = t.hits || new Set();
        for (const e of this.inimigos) if (e.hp > 0 && !e.morrendo && !t.hits.has(e) && toca({ x: t.x - t.r, y: t.y - t.r, w: t.r * 2, h: t.r * 2 }, caixa(e))) {
          t.hits.add(e); if (this.atingir(e, t.dano, t.x - t.vx, { dir: 'lado', carga: t.tipo === 'onda', semOleo: !t.basico && t.tipo !== 'pedra' }) && !t.fura) { t.vida = 0; break; }
        }
      } else if (!p.morto && toca({ x: t.x - t.r * 0.7, y: t.y - t.r * (t.tipo === 'choque' ? 1.6 : 0.7), w: t.r * 1.4, h: t.r * (t.tipo === 'choque' ? 2.2 : 1.4) }, pc)) {
        if (t.treino && !(p.vig > 0)) { t.vida = 0; this.fx.po(t.x, t.y, 5, t.cor); this.textoEm(p.x, p.y - 64, p.lamp ? 'cedo demais' : 'erga a lâmpada quando o dardo chegar', '#C9B88A', 12); continue; }
        const r = this.ferirHeroi(1, { x: t.x - t.vx * 0.1, y: t.y });
        if (r && t.nid && this.mp) { this.mp.gasta(t, t.tipo !== 'choque'); if (r === 'parry' && t.tipo !== 'choque') t.nid = 0; }
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
          if (res === 'parry' && z.lanca && z.dono) { if (z.nid && !this.souDono()) { this.mp.ev('zp', { id: z.nid }); z.dur = 0; } else this.zonaDefendida(z); }
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
      if (!m.maldita && m.t > 0.35 && dist < (this.cm.pet === 'papagaio' ? 330 : 110) && !p.morto) { m.vx += (p.x - m.x) / dist * 2600 * dt; m.vy += (p.y - 20 - m.y) / dist * 2600 * dt; }
      m.x += m.vx * dt; m.y += m.vy * dt;
      if (solido(this.N, Math.floor(m.x / T), Math.floor((m.y + 5) / T)) && m.vy > 0) { m.y = Math.floor((m.y + 5) / T) * T - 5; m.vy *= -0.4; m.vx *= 0.7; }
      if (solido(this.N, Math.floor((m.x + Math.sign(m.vx) * 5) / T), Math.floor(m.y / T))) m.vx *= -0.5;
      if (dist < 20 && m.t > 0.3 && !p.morto) {
        m.pego = true; const v = Math.round(m.v * (this.tem('tijolo_humilde') ? 1.3 : 1) * (this.tem('talento_multiplicado') ? 2 : 1)) || 1; d.gold += v; sfx('coin');
        if (m.maldita) { this.peso++; this.textoEm(p.x, p.y - 54, '+' + v + ' denários… e um peso a mais', '#FFD23F', 12); }
      }
      if (m.t > (m.maldita ? 9 : 14)) m.pego = true;
    }
    this.moedas = this.moedas.filter(m => !m.pego);
  }

  // o clima da área também joga: ondas no convés (Jn 1:4), brasas no tribunal, o vento oriental (Jn 4:8)
  clima(dt) {
    const p = this.p, tipo = this.tm.perigo;
    if (this.vento) { this.vento.t -= dt; if (!p.morto && p.dashT <= 0) p.x += this.vento.f * dt * (p.chao ? 0.55 : 1) * (p.lamp ? 0.4 : 1); if (Math.random() < dt * 40) this.parts.push({ x: p.x + rand(200, 520), y: p.y - rand(0, 300), vx: this.vento.f * 4, vy: rand(-20, 20), t: 0.6, max: 0.6, r: 1.6, cor: this.tm.acento, g: 0 }); if (this.vento.t <= 0) this.vento = null; }
    if ((!tipo && this.tm.deco !== 'mastros') || (this.luta && this.def.mundo !== 'leviata') || this.venceu || p.morto || this.def.paz || this.def.extra) return; // no barco do Leviatã o mar e as lanças não param
    this.climaT = (this.climaT ?? 6) - dt; if (this.climaT > 0) return;
    this.climaT = this.tm.deco === 'mastros' || this.def.mundo === 'leviata' ? rand(4.5, 7) : rand(8, 12);
    const sala = CH * T, ox = Math.floor(p.x / (CW * T)) * CW * T, oy = Math.floor((p.y - 2) / sala) * sala;
    if (tipo === 'onda') { this.zonas.push({ tipo: 'faixa', x: ox + T, w: (CW - 2) * T, y: oy + sala - T - 30, h: 30, aviso: 1.3, dur: 0.35, cor: '120,210,245', baixo: true }); sfx('swing'); }
    else if (tipo === 'brasas') { for (let i = -1; i <= 1; i++) this.zonas.push({ tipo: 'col', x: p.x + i * 120 + rand(-20, 20), w: 40, aviso: 1.1 + (i + 1) * 0.25, dur: 0.22, cor: '#FF5A3C', y0: oy + T, y1: oy + sala - T }); sfx('shoot'); }
    if (this.tm.deco === 'mastros' && this.def.fase && !p.morto) { // no mar de Jonas, lanças e arpões cruzam o convés na altura do peito: pule, abaixe-se com o passo rasteiro ou apare
      const lado = Math.random() < 0.5 ? -1 : 1; this.textoEm(p.x, p.y - 84, 'lanças!', '#FF8A7A', 12); sfx('swing');
      if (this.N.barco && Math.random() < 0.6) { this.vento = { t: 2.6, f: (Math.random() < 0.5 ? -1 : 1) * 135 }; this.textoEm(p.x, p.y - 100, 'o navio aderna!', this.tm.acento, 12); }
      for (let i = 0; i < 3; i++) this.tiros.push({ x: p.x - lado * (520 + i * 150), y: p.y - 30 - (i === 1 ? 44 : 0), vx: lado * 470, vy: 0, r: 7, vida: 3, cor: '#C9B48A', tipo: 'lanca', fura: true });
    }
    else if (tipo === 'vento') { this.vento = { t: 2.4, f: -150 }; this.textoEm(p.x, p.y - 70, 'vento oriental!', this.tm.acento, 12); sfx('dodge'); }
  }

  // Jonas no navio: abre vãos no convés (cair no mar fere e devolve ao último chão firme) e marca a área como travessia.
  fazerBarco(N) {
    N.barco = true; N.pocos = [];
    for (const c of N.celulas) { if (c.papel !== 'corredor') continue; const ox = c.cx * CW, oy = c.cy * CH;
      for (const col of [9, 10, 19, 20]) { const x = ox + col, i = (oy + 16) * N.w + x; if (N.tiles[i] !== SOLIDO || N.tiles[i - N.w] !== VAZIO) continue; N.tiles[i] = VAZIO; if (oy + 17 < N.h) N.tiles[i + N.w] = ESPINHO; N.pocos.push({ x: x * T, y: (oy + 16) * T }); } }
  }

  /* ================= Vida no caminho ================= */
  // o cão ou o papagaio: segue o peregrino e ajuda do seu jeito
  companheiro(dt) {
    const tipo = this.cm.pet, p = this.eu; if (!tipo) { this.pet = null; return; }
    const q = this.pet = this.pet && this.pet.tipo === tipo ? this.pet : { tipo, x: p.x - 30, y: p.y, t: 0, cd: 2, alvo: null, late: 0 };
    q.t += dt; q.cd -= dt; q.late -= dt;
    const voa = tipo === 'papagaio', ax = p.x - p.face * (voa ? 26 : 38), ay = voa ? p.y - 62 + Math.sin(q.t * 3) * 6 : p.y;
    if (q.alvo && q.alvo.hp > 0 && q.mordida > 0) { q.mordida -= dt; q.x = damp(q.x, q.alvo.x, 14, dt); q.y = damp(q.y, q.alvo.y, 14, dt); if (q.mordida <= 0) { this.atingirJa(q.alvo, this.danoBase() * 0.7, q.x - 1, { semOleo: true, hits: new Set(), dir: 'lado' }); this.efeito('faisca', q.alvo.x, q.alvo.y - q.alvo.h / 2); q.alvo = null; } }
    else { q.x = damp(q.x, ax, voa ? 5 : 7, dt); q.y = damp(q.y, ay, voa ? 5 : 12, dt); q.face = Math.abs(ax - q.x) > 4 ? Math.sign(ax - q.x) : p.face; q.anda = Math.abs(ax - q.x) > 6; }
    if (tipo === 'cachorro') {
      if (q.cd <= 0 && this.souDono()) { const e = this.inimigos.filter(v => v.kind === 'vicio' && v.hp > 0 && Math.hypot(v.x - p.x, v.y - p.y) < 190)[0]; if (e) { q.alvo = e; q.mordida = 0.22; q.cd = 2.6; sfx('swing'); } }
      if (q.late <= 0) { q.late = 3.5; const N = this.N, tx = Math.floor(p.x / T), ty = Math.floor(p.y / T); for (let y = ty - 4; y <= ty + 2; y++) for (let x = tx - 6; x <= tx + 6; x++) { const t = tileEm(N, x, y); if ((t === OCULTO || t === FALSA) && !N.desfeita.has(y * N.w + x)) { this.textoEm(q.x, q.y - 26, 'au! au!', '#FFE9A8', 11); sfx('click'); x = 1e9; y = 1e9; } } }
    } else if (this.chefe && this.chefe.tele > 0 && q.cd <= 0) { q.cd = 1.4; this.textoEm(q.x, q.y - 14, 'VIGIAI!', '#B8E6A0', 12); sfx('key'); }
  }
  // Nada de ficar parado: vencer em sequência rende mais; demorar-se numa página traz o Medo para perto.
  ritmo(dt) {
    const p = this.eu, st = this.char.data.stats;
    if (this.seqT > 0) { this.seqT -= dt; if (this.seqT <= 0) this.seq = 0; }
    if (st.kills !== this.killsAntes) { if (this.killsAntes != null && st.kills > this.killsAntes) { this.seq = (this.seq || 0) + 1; this.seqT = 3.2; if (this.seq >= 2) { const bonus = Math.min(8, this.seq); this.char.data.gold += bonus; this.ganharOleo(4 + this.seq); this.textoEm(p.x, p.y - 92, 'SEQUÊNCIA ×' + this.seq + '  +' + bonus, '#FFD23F', 12 + Math.min(6, this.seq)); if (this.seq === 5) sfx('level'); } } this.killsAntes = st.kills; }
    if (!this.def.fase || this.luta || this.emb || p.morto || this.venceu) { this.paradoT = 0; return; }
    this.paradoT = Math.abs(p.vx) > 40 || p.atk || !p.chao ? 0 : (this.paradoT || 0) + dt;
    if (this.paradoT > 7 && this.souDono() && this.inimigos.filter(v => v.hp > 0).length < 14) { this.paradoT = 2; const lado = Math.random() < 0.5 ? -1 : 1, v = this.nascer('medo', p.x + lado * 260, p.y - 90, true, 1 + (this.def.fase.nivel || 1) * 0.05); v.irado = 99; this.efeito('sumico', v.x, v.y); this.textoEm(p.x, p.y - 80, 'quem para, a sombra alcança', '#C79BFF', 12); }
  }
  // O mar do Leviatã: arpões no convés. Golpes comuns mal arranham as escamas; o arpão fere de verdade.
  barco(dt) {
    const A = this.N.arena, p = this.eu; if (!A) return;
    this.arpT = (this.arpT ?? 1) - dt;
    if (this.arpT <= 0 && this.luta) { this.arpT = 7; const n = this.objs.filter(o => o.tipo === 'arpao').length; if (n < 3) { const x = A.x0 + 90 + Math.random() * (A.x1 - A.x0 - 180); this.objs.push({ tipo: 'arpao', x, y: A.chao, luz: 60 }); this.fx.anel(x, A.chao - 16, '#BFF0F8', 40); } }
    for (const o of this.objs) if (o.tipo === 'arpao' && !p.arpao && Math.abs(o.x - p.x) < 26 && Math.abs(o.y - p.y) < 40) { o.fora = true; p.arpao = true; sfx('key'); this.textoEm(p.x, p.y - 70, 'ARPÃO! golpeie para arremessar', '#BFF0F8', 12); }
    if (p.arpao && p.atk && p.atk.t < 0.03) { p.arpao = false; const d = { lado: [1, 0], cima: [0, -1], diagC: [0.7, -0.7], diagB: [0.7, 0.7], baixo: [0, 1], rasteira: [1, 0] }[p.atk.dir] || [1, 0]; this.tiros.push({ x: p.x, y: p.y - 30, vx: p.face * d[0] * 760, vy: d[1] * 760, r: 9, dano: this.danoBase() * 22, amigo: true, vida: 1.2, cor: '#BFF0F8', tipo: 'lanca', fura: false, basico: true }); sfx('shoot'); this.tremor(3); }
  }

  /* ================= Provas do Refúgio ================= */
  // Arena de treino: os golpes dos outros peregrinos da sala me ferem (e eu posso apará-los com a lâmpada).
  pvp() {
    const p = this.eu, eu = caixa(p); if (p.morto) return;
    for (const o of this.mp.naArea()) {
      const h = o.h, a = h.atk; if (h.morto) continue;
      if (a && !a.semCaixa && a.n !== h.feriuN && a.t > 0.03 && a.t < a.dur) {
        const arma = ARMAS[o.arma] || ARMAS.espada, f = a.face || h.face, lado = a.dir === 'lado' || a.dir === 'rasteira';
        const cx = lado ? h.x + f * (arma.alc / 2 + 4) : a.dir === 'cima' || a.dir === 'baixo' ? h.x : h.x + f * arma.alc * 0.5, cy = lado ? h.y - 28 : a.dir === 'cima' || a.dir === 'diagC' ? h.y - 60 - arma.alc * 0.3 : h.y + arma.alc * 0.3, w = lado ? arma.alc : arma.alt + 8, hh = lado ? arma.alt : arma.alc;
        if (toca({ x: cx - w / 2, y: cy - hh / 2, w, h: hh }, eu)) { h.feriuN = a.n; const r = this.ferirHeroi(1, h); if (r === 'parry') this.textoEm(p.x, p.y - 84, 'aparou ' + o.nome, '#FFE9A8', 12); }
      }
      for (const t of h.ts || []) if (Math.hypot(t[0] - p.x, t[1] - (p.y - 26)) < t[4] + 16) this.ferirHeroi(1, { x: t[0], y: t[1] });
    }
  }
  // Desafio das ondas: sem fim; cada onda vencida paga e a próxima vem maior.
  desafio(dt) {
    const p = this.eu, N = this.N; if (p.morto) return;
    const d = this.des = this.des || { onda: 0, t: 2.5 };
    if (this.inimigos.some(v => v.hp > 0)) return;
    d.t -= dt; if (d.t > 0) return;
    if (d.onda > 0) { const premio = 12 + d.onda * 6; this.char.data.gold += premio; this.textoEm(p.x, p.y - 80, '+' + premio + ' denários', '#FFD23F', 13); if (d.onda > (this.cm.recorde || 0)) { this.cm.recorde = d.onda; this.salvar(); } if (d.onda % 5 === 0) { p.vida = Math.min(p.vidaMax, p.vida + 1); this.efeito('cura', p.x, p.y); } }
    d.onda++; d.t = 1.2; this.grito('ONDA ' + d.onda); sfx('boss');
    const tipos = ['desanimo', 'distracao', 'inveja', 'duvida', 'ira', 'ganancia', 'medo', 'vaidade', 'orgulho', 'preguica'], voadores = ['distracao', 'duvida', 'medo', 'vaidade'], n = Math.min(9, 2 + Math.ceil(d.onda * 0.8));
    for (let i = 0; i < n; i++) { const tipo = tipos[(d.onda + i * 3) % Math.min(tipos.length, 2 + d.onda)], x = N.inicio.x + 120 + rand(0, 640); if (Math.abs(x - p.x) < 120) { i--; continue; } const v = this.nascer(tipo, x, N.inicio.y - (voadores.includes(tipo) ? rand(120, 260) : 1), false, 1 + d.onda * 0.07); v.stun = 0.5; v.irado = 99; this.efeito('sumico', v.x, v.y - v.h / 2); }
  }

  /* ================= Primeiros passos ================= */
  // Uma dica por vez, no rodapé; cada uma some quando o jogador FAZ o que ela ensina.
  tutorial(dt) {
    const v = this.cm.visto, p = this.eu;
    if (v.tut == null || v.tut >= PASSOS.length) { this.dicaTxt = null; return; }
    const s = PASSOS[v.tut], modo = input.touch ? 0 : document.body.classList.contains('pad') ? 1 : 2;
    this.tutT = (this.tutT || 0) + dt; this.dicaTxt = { titulo: s.titulo, txt: s.txt[modo] || s.txt[0], n: v.tut + 1, de: PASSOS.length };
    if (s.id === 'andar') this.tutAndou = (this.tutAndou || 0) + Math.abs(p.vx) * dt;
    if (s.id === 'vigilia' && this.area === 'refugio' && !p.morto) { // dardos de treino: não ferem, só ensinam o tempo
      this.tutDardo = (this.tutDardo || 1.2) - dt;
      if (this.tutDardo <= 0) { this.tutDardo = 2.4; const d = p.face || 1; this.tiros.push({ x: p.x + d * 430, y: p.y - 28, vx: -d * 300, vy: 0, r: 7, vida: 3, cor: '#E8D9A8', tipo: 'bola', treino: true, fura: true }); }
    }
    const feito = { andar: this.tutAndou > 220, pular: !p.chao && p.pulos <= 0 && p.vy < 0, passo: p.dashT > 0, golpe: !!p.atk, descer: p.desce > 0 || this.tutT > 9, rasteiro: (p.rasteiro && p.dashT > 0) || this.tutT > 12, luz: p.lampA > 0.8 && this.tutT > 2.5, vigilia: this.tutParry, orar: p.orando > 0.5 || this.tutT > 14, azeite: this.tutT > 8 }[s.id];
    if (feito && this.tutT > 0.8) { v.tut++; this.tutT = 0; this.tutParry = false; sfx('right'); if (v.tut >= PASSOS.length) { this.ui.toast('Você sabe caminhar. O primeiro portal leva a Corinto.', 5000); this.salvar(); } }
  }

  /* ================= Emboscadas ================= */
  // Cada rolo é guardado: ao entrar na câmara as grades descem e os vícios vêm em ondas. Vencidos, o rolo pode ser lido.
  camaraDe(ob) { const c = ob.cel; return c && c.papel === 'corredor' && this.def.fase ? c : null; }
  roloLivre(ob) {
    const c = this.camaraDe(ob); if (!c || c.vencida) return true;
    if (this.souDono()) return false;
    const x0 = c.cx * CW * T, y0 = c.cy * CH * T; // em sala de outro aparelho: livre quando não há grade nem vício na câmara
    return !this.emb && !this.inimigos.some(e => e.hp > 0 && e.x > x0 && e.x < x0 + CW * T && e.y > y0 && e.y < y0 + CH * T);
  }
  trancar(c, fecha) {
    const N = this.N, ox = c.cx * CW, oy = c.cy * CH;
    for (const x of [ox, ox + CW - 1]) for (let y = 13; y <= 15; y++) { const i = (oy + y) * N.w + x; if (fecha ? N.tiles[i] === VAZIO : N.tiles[i] === TRANCA) N.tiles[i] = fecha ? TRANCA : VAZIO; }
  }
  emboscadas(dt) {
    const N = this.N, p = this.eu, f = this.def.fase;
    if (!f || this.luta) return;
    if (!this.souDono()) { // a grade acompanha o que o dono da área manda
      const c = this.embRemota != null ? N.celulas[this.embRemota] : null;
      if (c !== this.embLocal) { if (this.embLocal) this.trancar(this.embLocal, false); if (c) { this.trancar(c, true); sfx('gate'); } this.embLocal = c; }
      return;
    }
    const e = this.emb;
    if (!e) {
      if (p.morto) return;
      const cx = Math.floor(p.x / (CW * T)), cy = Math.floor((p.y - 2) / (CH * T)), c = N.celulas.find(q => q.cx === cx && q.cy === cy);
      if (!c || c.papel !== 'corredor' || c.vencida) return;
      const rolo = this.objs.find(o => o.tipo === 'rolo' && o.cel === c);
      if (!rolo || rolo.feito) { c.vencida = true; return; }
      const lx = p.x - cx * CW * T; if (lx < 4 * T || lx > (CW - 4) * T) return;
      this.emb = { c, onda: 0, total: (f.n >= 4 ? 3 : 2) + (this.cm.dif === 'fornalha' ? 1 : 0), t: 0.9 };
      this.trancar(c, true); sfx('gate'); this.tremor(7); this.grito('Os vícios guardam o rolo');
      return;
    }
    const vivos = this.inimigos.some(v => v.cel === e.c && v.hp > 0);
    if (vivos) return;
    e.t -= dt; if (e.t > 0) return;
    if (e.onda >= e.total) {
      e.c.vencida = true; this.emb = null; this.trancar(e.c, false); sfx('gate'); sfx('right'); this.tremor(5); this.ganharOleo(22);
      const rolo = this.objs.find(o => o.tipo === 'rolo' && o.cel === e.c); if (rolo) { this.fx.anel(rolo.x, rolo.y - 30, '#FFE9A8', 120); this.efeito('pilar', rolo.x, rolo.y); }
      const eco = this.def.sem?.id === 'semana-01' ? ECOS_CORINTO[f.n]?.[rolo ? rolo.n : 0] : null; // na primeira semana, cada câmara vencida conta um pedaço de Atos 18
      this.mp?.ev('eco', { txt: eco || 'A câmara está livre. Leia o rolo.', d: eco ? 11000 : 3500 });
      this.ui.toast(eco || 'A câmara está livre. Leia o rolo.', eco ? 11000 : 3500); return;
    }
    // próxima onda: mais vícios a cada vez, vindos do chão e do ar
    const tipos = this.def.inimigos || ['desanimo'], voadores = ['distracao', 'duvida', 'medo', 'vaidade'], n = 3 + e.onda + (this.mp ? this.mp.naArea().length : 0), ox = e.c.cx * CW, oy = e.c.cy * CH, esc = 1 + (f.nivel || 1) * 0.05;
    const vazio = (tx, ty) => tileEm(N, tx, ty) === VAZIO, chao = (tx, ty) => { const t = tileEm(N, tx, ty); return t === SOLIDO || t === PONTE; };
    for (let i = 0, feitos = 0, tent = 0; feitos < n && tent < 60; tent++) {
      const tipo = tipos[(e.onda * 2 + i) % tipos.length], voa = voadores.includes(tipo), tx = ox + 3 + Math.floor(rand(0, CW - 6));
      if (Math.abs(tx * T + 16 - p.x) < 130) continue;
      let ty = -1;
      if (voa) { const y = oy + 5 + Math.floor(rand(0, 5)); if (vazio(tx, y) && vazio(tx, y - 1)) ty = y; }
      else for (let y = oy + 15; y > oy + 4; y--) if (vazio(tx, y) && vazio(tx, y - 1) && chao(tx, y + 1)) { ty = y; break; }
      if (ty < 0) continue;
      const v = this.nascer(tipo, tx * T + 16, (ty + 1) * T - (voa ? 16 : 1), false, esc); v.cel = e.c; v.stun = 0.5; v.flash = 0.3;
      this.efeito('sumico', v.x, v.y - v.h / 2); this.fx.anel(v.x, v.y - v.h / 2, v.d.cor || '#C79BFF', 40); i++; feitos++;
    }
    if (e.onda === e.total - 1) { const cap = this.inimigos.filter(v => v.cel === e.c && v.hp > 0 && !v.voa)[0] || this.inimigos.filter(v => v.cel === e.c && v.hp > 0)[0]; if (cap) { cap.elite = true; cap.hp = cap.max = Math.round(cap.hp * 2.6); cap.r *= 1.35; cap.w *= 1.35; cap.h *= 1.35; cap.irado = 99; this.textoEm(cap.x, cap.y - cap.h - 10, 'CAPITÃO', '#FF8A7A', 12); } } // a última onda vem com um capitão
    e.onda++; e.t = 0.7; sfx('boss'); this.textoEm(p.x, p.y - 74, 'ONDA ' + e.onda + ' DE ' + e.total, '#FF8A7A', 13);
  }

  /* ================= Encontros ================= */
  gatilhos() {
    const p = this.p, N = this.N, A = N.arena, d = this.def;
    if (A && d.chefe && !this.luta && !this.chefe && !this.venceu && !p.morto && p.x > A.x0 + 76 && this.T > (this.semLutaAte || 0)) { if (this.souDono()) this.iniciarLuta(); else if (this.T > (this.pedeT || 0)) { this.pedeT = this.T + 1; this.mp.ev('lu'); } }
    if (!A || this.luta) return;
  }

  async iniciarLuta() {
    const d = this.def, A = this.N.arena;
    this.luta = true; this.vazioT = 0; sfx('gate'); this.tremor(8);
    const juntos = this.mp?.acompanhado();
    if (!juntos) { this.N.portaAberta = false; await this.cinema(CINEMA_CHEFE[d.chefe] || 'chefe-' + d.chefe); }
    else { this.congela = true; await this.cinema(CINEMA_CHEFE[d.chefe] || 'chefe-' + d.chefe); this.congela = false; } // todos assistem à entrada do chefe; ele espera
    const b = novoChefe(d.chefe, A, this.dif);
    if (juntos) { b.max = b.hp = Math.round(b.hp * (1 + 0.6 * this.mp.naArea().length)); b.art.max = b.max; } // mais peregrinos, mais fôlego na sombra
    this.inimigos.push(b); this.chefe = b; music('chefe'); sfx('boss');
    this.ui.banner(b.d.titulo || 'Chefe', b.d.nome, b.d.ref);
    if (b.d.intro) this.fala(b, b.d.intro.replace(/\*/g, ''));
  }

  // "Está escrito": a luta para e o chefe acusa. A resposta certa o quebranta; a errada o fortalece.
  async estaEscrito(b) {
    this.p = this.eu;
    const f = this.def.fase;
    const pacote = b.c.acusacoes || !f ? { acc: pick(ACUSACOES), falsas: shuffle(FALSAS.slice()).slice(0, 2) } : { q: this.sortearPergunta(f) };
    let ok;
    if (this.mp?.acompanhado()) { this.congela = true; ok = await this.mp.quizJunto(pacote, b); this.congela = false; }
    else { ok = await this.perguntaDoChefe(b, pacote); this.respostaDoGrupo(ok, true); }
    if (!this.running || b.hp <= 0) return;
    if (ok) {
      const dano = b.max * 0.05 * (this.tem('anel_beltessazar') ? 2 : 1); b.hp = Math.max(1, b.hp - dano); b.post = 0; b.quebrado = 2.8;
      this.textoEm(b.x, b.y - b.h - 20, 'ESTÁ ESCRITO!', '#FFE9A8', 22); this.efeito('pilar', b.x, this.N.arena.chao); this.clarao = 0.25; this.fx.anel(b.x, b.y - b.h / 2, '#FFE9A8', 160); this.tremor(12); sfx('right');
    } else {
      b.hp = Math.min(b.max, b.hp + b.max * 0.06); b.furia = 10; sfx('wrong');
      this.textoEm(b.x, b.y - b.h - 20, 'O engano o fortalece', '#FF8A7A', 16);
    }
  }
  // cada peregrino responde no próprio aparelho; os acertos e a revisão são de cada um
  async perguntaDoChefe(b, pacote) {
    const st = this.char.data.stats; let ok;
    if (pacote.acc) { ok = await this.ui.verseBattle(pacote.acc, pacote.falsas); if (ok && !this.char.data.verses.includes(pacote.acc.ref)) this.char.data.verses.push(pacote.acc.ref); }
    else { ok = await this.ui.quiz({ ...pacote.q, fb: ['Está escrito! O chefe está quebrantado.', 'O chefe se fortalece com o seu engano.'] }, 'ESTÁ ESCRITO · ' + b.d.nome); this.revisao(pacote.q, ok); }
    if (ok) { st.quizOk++; this.ok++; this.pontos(150); } else { st.quizErr++; this.err++; }
    return ok;
  }
  respostaDoGrupo(ok, so) { if (ok) this.eu.oleo = this.oleoMax(); if (!so) this.ui.toast(ok ? 'A maioria respondeu certo: o chefe está quebrantado.' : 'A maioria errou: o engano fortalece o chefe.', 4000); }
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
    this.p = this.eu;
    if (this.mp && !b.remoto && b.nid) this.mp.ev('cc', { id: b.nid });
    b.fora = true; this.chefe = null; this.luta = false; this.escuroAlvo = 0; this.lentidaoAlvo = 1; this.peso = 0; this.puxao = null;
    this.ui.bossBar(null); music('fase'); sfx('level');
    // juntos, a vitória só conta para quem leu os rolos desta página
    if (this.mp && !this.temSelos()) { this.ui.toast(b.d.nome + ' caiu, mas a recompensa é de quem leu os três rolos desta página. Leia-os e enfrente-o de novo.', 8000); this.semLutaAte = this.T + 8; return; }
    this.venceu = true; this.N.portaAberta = true;
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
      if (ob.tipo === 'segredo' && dd < 30) { ob.fora = true; this.efeito('coleta', ob.x, ob.y - 10); this.cm.seg[this.area].push(ob.n); this.ganhar(ob.item); continue; }
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
      case 'rolo': return ob.feito ? 'Reler o rolo' : ob.trava > this.T || !this.roloLivre(ob) ? null : 'Ler o rolo';
      case 'estacao': return ob.feito ? null : ob.dados.nome;
      case 'npc': return 'Falar';
      case 'ebenezer': return 'Descansar';
      case 'portal': return 'Entrar';
      case 'saida': return 'Seguir caminho';
      case 'retorno': return 'Voltar ao Refúgio';
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
        cm.ebenezer = { area: this.area }; if (!this.luta && this.souDono()) this.povoar(); p.vida = p.vidaMax; p.oleo = Math.max(p.oleo, OLEO_USO); this.usouSelo = this.usouCepa = false; sfx('heal'); this.fx.anel(ob.x, ob.y - 30, '#FFE9A8', 120); this.salvar();
        if (primeira) this.ovo('ebenezer', '"Até aqui nos ajudou o Senhor" (1Sm 7:12). As Pedras de Ebenézer guardam o seu caminho.');
        const acoes = [{ label: 'Levantar' }];
        if (this.area !== 'refugio') acoes.push({ label: 'Voltar ao Refúgio', fn: () => this.entrar('refugio', { ebenezer: false }) });
        acoes.push({ label: 'Relíquias', fn: () => this.menu('reliquias') });
        await this.ui.dialog({ nome: 'Pedra de Ebenézer', texto: 'Você descansa. Fôlegos refeitos; os vícios da área voltam a rondar.\n\nDaqui você recomeça se cair.', acoes });
        break;
      }
      case 'portal':
        if (ob.area) await this.ui.dialog({ nome: ob.rotulo, texto: ob.area === 'treino' ? 'Um pátio de areia para medir forças com os peregrinos da sua sala. Aqui os golpes de um ferem o outro, mas ninguém perde nada ao cair.\n\nSozinho, serve para treinar os golpes.' : 'As grades se fecham e os vícios vêm em ondas, cada vez mais. Cada onda vencida vale denários.\n\nSua melhor marca: ' + (cm.recorde || 0) + ' ondas.', acoes: [{ label: 'Entrar', fn: () => this.entrar(ob.area) }, { label: 'Agora não' }] });
        else if (ob.semana) escolherFase(this, semanaDe(ob.semana));
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
      case 'retorno': this.entrar('refugio', { portal: d.sem?.id || d.mundo }); break;
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
      case 'ferreiro': return forja(this);
      case 'armeiro': return armeiro(this);
      case 'noe': return petShop(this);
      case 'dorcas': return guardaRoupa(this);
      case 'mestre': texto = 'Ferro com ferro se afia; assim o homem afia o rosto do seu amigo (Pv 27:17).\n\nA arena é para os peregrinos da mesma sala medirem forças. O desafio das ondas é para quem quer saber até onde aguenta. Melhor marca sua: ' + (cm.recorde || 0) + ' ondas.'; break;
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
      default: if (ob.nome === 'Mercador') return mercador(this, ob); texto = ob.falas ? ob.falas[(n - 1) % ob.falas.length] : '…';
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
    if (this.pixel) return renderPixel(this);
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
        if (!ativa) { g.globalAlpha = 0.8; g.strokeStyle = cor; g.lineWidth = 1.5; g.setLineDash([6, 6]); g.strokeRect(x, y0, z.w, y1 - y0); if (z.tipo === 'faixa') { g.setLineDash([]); g.font = '800 13px Alegreya Sans, sans-serif'; g.fillStyle = '#fff'; g.textAlign = 'center'; g.fillText(z.baixo ? '▲ PULE ▲' : '▼ FIQUE NO CHÃO ▼', z.x + z.w / 2, z.baixo ? y0 - 8 : y1 + 16); } }
      }
      g.restore();
    }
  }

  pintarPecado(g, soVulto) {
    const s = this.pecado, Tm = this.T;
    g.save(); g.translate(s.x, s.y);
    g.fillStyle = 'rgba(5,4,10,.92)'; g.beginPath(); g.moveTo(-26, 40); g.quadraticCurveTo(-34, -30, 0, -74); g.quadraticCurveTo(34, -30, 26, 40);
    for (let i = 4; i >= -4; i--) g.lineTo(i * 6.5, 40 + (i % 2 ? 9 : 0) + Math.sin(Tm * 5 + i) * 3);
    g.fill();
    g.fillStyle = '#EF6981'; g.beginPath(); g.ellipse(-7, -38, 2.4, 3.6, 0, 0, TAU); g.ellipse(7, -38, 2.4, 3.6, 0, 0, TAU); g.fill();
    g.restore();
    if (soVulto) return;
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
    faisca(x, y, n, cor) { G.mp?.fx(['p', 'faisca', x, y, n, cor]); for (let i = 0; i < n; i++) { const a = rand(0, TAU), s = rand(120, 380); add({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, t: rand(0.12, 0.3), r: rand(1.2, 2.6), cor, g: 0 }); } },
    sobe(x, y, n, cor) { for (let i = 0; i < n; i++) add({ x: x + rand(-14, 14), y: y - rand(0, 30), vx: rand(-12, 12), vy: rand(-90, -40), t: rand(0.5, 1), r: rand(1.4, 2.6), cor, g: -30 }); },
    anel(x, y, cor, r) { add({ x, y, vx: 0, vy: 0, t: 0.42, r, cor, anel: true, g: 0 }); G.mp?.fx(['p', 'anel', x, y, cor, r]); },
    asas(x, y) { for (const s of [-1, 1]) for (let i = 0; i < 5; i++) add({ x: x + s * (6 + i * 4), y: y + i * 2, vx: s * rand(40, 120), vy: rand(20, 90), t: rand(0.25, 0.5), r: rand(2, 3.5), cor: '#F2F0E4', g: 200 }); }
  };
}
export { lerp };
