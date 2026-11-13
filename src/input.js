import { config } from './config.js';
// Teclado + mouse no PC, joystick virtual + botões na tela no celular.
const KEYMAP = {
  KeyZ: 'dodge', KeyX: 'attack', KeyC: 'dash', KeyV: 'skill', // atalhos do Caminho (plataforma)
  KeyJ: 'attack', KeyK: 'skill', Space: 'dodge', ShiftLeft: 'defend', ShiftRight: 'defend', KeyL: 'defend',
  KeyQ: 'item1', Digit1: 'item1', Numpad1: 'item1', Digit2: 'item2', Numpad2: 'item2', KeyR: 'mount', KeyE: 'interact', KeyF: 'interact', KeyI: 'menu', Tab: 'menu', KeyM: 'map', KeyT: 'lock', KeyH: 'botija', Enter: 'chat', Escape: 'escape'
};
// No Caminho, o teclado segue o padrão de Hollow Knight: setas andam, Z pula, X golpeia, C é o passo,
// Padrão: seta para cima pula, Z e X golpeiam, C é o passo, A (segurar) ora, D ergue a lâmpada, S solta o especial, E interage.
const KEYMAP_HK = { ArrowUp: 'dodge', KeyZ: 'attack', KeyX: 'attack', KeyC: 'dash', KeyA: 'botija', KeyD: 'defend', KeyS: 'skill', KeyF: 'skill',
  KeyE: 'interact', Enter: 'interact', KeyQ: 'item2', KeyR: 'item2', Tab: 'map', KeyM: 'map', KeyI: 'menu', Escape: 'escape' };
// Modo WASD + mouse (menu › Ajustes): A D andam, W ou Espaço pula, S abaixa, Q ora, E ergue a lâmpada, Shift é o passo,
// botão esquerdo do mouse golpeia e o direito solta o especial. F interage, R usa o dom.
const KEYMAP_WASD = { KeyW: 'dodge', Space: 'dodge', ShiftLeft: 'dash', ShiftRight: 'dash', KeyQ: 'botija', KeyE: 'defend', KeyF: 'interact', Enter: 'interact',
  KeyR: 'item2', KeyJ: 'attack', KeyK: 'skill', Tab: 'map', KeyM: 'map', KeyI: 'menu', Escape: 'escape' };
const MOVE_WASD = { KeyW: [0, -1], KeyS: [0, 1], KeyA: [-1, 0], KeyD: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] };
export const wasd = () => config.esquema !== 'setas'; // WASD + mouse é o padrão; setas + Z X C fica como opção
const base = () => wasd() ? KEYMAP_WASD : KEYMAP_HK;
const moveHK = () => wasd() ? MOVE_WASD : MOVE_HK;
// teclas escolhidas pelo jogador (menu › Ajustes › Teclas): { ação: código da tecla }
export const ACOES_TECLA = [['dodge', 'Pular'], ['attack', 'Golpear'], ['dash', 'Passo pronto'], ['botija', 'Orar (alma)'], ['defend', 'Lâmpada (vela)'], ['skill', 'Especial'], ['item2', 'Dom'], ['interact', 'Ler e falar']];
export function teclaDe(acao) { const B = base(); return config.teclas?.[acao] || Object.keys(B).find(k => B[k] === acao); }
function mapaHK() {
  const t = config.teclas; if (!t || !Object.keys(t).length) return base();
  const m = { ...base() };
  for (const [acao, cod] of Object.entries(t)) { for (const k of Object.keys(m)) if (m[k] === acao && k !== 'Escape') delete m[k]; }
  for (const [acao, cod] of Object.entries(t)) m[cod] = acao;
  return m;
}
const MOVE_HK = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] };
const MOVE = { KeyW: [0, -1], ArrowUp: [0, -1], KeyS: [0, 1], ArrowDown: [0, 1], KeyA: [-1, 0], ArrowLeft: [-1, 0], KeyD: [1, 0], ArrowRight: [1, 0] };
const BUFFERED = new Set(['dodge', 'defend', 'item1', 'item2', 'botija']);
const BUFFER_MS = 250;

export const input = {
  keys: new Set(), pressed: new Set(), held: new Set(),
  sources: new Map(), pending: new Map(),
  mx: 0, my: 0, mouseAim: false, touch: false,
  stick: { id: null, ox: 0, oy: 0, x: 0, y: 0 },
  enabled: true,
  press(a, source) {
    this.pressed.add(a);
    // Consumíveis podem aguardar a animação curta da esquiva acabar.
    const ms = a === 'item1' || a === 'item2' ? 600 : BUFFER_MS;
    this.pending.set(a, { source, until: BUFFERED.has(a) ? performance.now() + ms : Infinity });
    this.setHeld(a, source, true);
  },
  setHeld(a, source, down) {
    if (down) {
      if (!this.sources.has(a)) this.sources.set(a, new Set());
      this.sources.get(a).add(source); this.held.add(a);
    } else {
      const sources = this.sources.get(a); sources?.delete(source);
      if (!sources?.size) { this.sources.delete(a); this.held.delete(a); }
    }
  },
  release(a, source, cancel = false) {
    this.setHeld(a, source, false);
    if (cancel && this.pending.get(a)?.source === source) { this.pressed.delete(a); this.pending.delete(a); }
  },
  consume(a, ready = true) {
    if (!this.pressed.has(a)) return false;
    if (performance.now() > (this.pending.get(a)?.until ?? Infinity)) {
      this.pressed.delete(a); this.pending.delete(a); return false;
    }
    if (!ready) return false;
    this.pressed.delete(a); this.pending.delete(a); return true;
  },
  isHeld(a) { return this.held.has(a); },
  move() {
    let x = 0, y = 0;
    const M = this.perfil === 'caminho' ? moveHK() : MOVE;
    for (const k of this.keys) if (M[k]) { x += M[k][0]; y += M[k][1]; }
    if (this.stick.id != null) { x = this.stick.x; y = this.stick.y; }
    if (this.pad) { x = this.pad.x; y = this.pad.y; } // analógico do controle (gamepad.js)
    const l = Math.hypot(x, y);
    if (l > 1) { x /= l; y /= l; }
    return { x, y };
  },
  clear() {
    this.pressed.clear(); this.held.clear(); this.sources.clear(); this.pending.clear(); this.keys.clear();
    this.resetPointers?.();
    this.stick.id = null; this.stick.x = this.stick.y = 0;
  }
};

function typing(e) { const t = e.target; return t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable); }

// No celular, dois dedos na tela (um andando, outro num botão) não podem virar "pinça" de zoom, nem dois toques
// seguidos podem ampliar a página: qualquer um dos dois faz o navegador cancelar os toques do jogo.
function travarZoom() {
  const livre = e => !!e.target.closest?.('.panel, #screens, input, textarea, select');
  const emJogo = () => document.body.classList.contains('playing');
  document.addEventListener('touchstart', e => { if (emJogo() && e.touches.length > 1 && !livre(e)) e.preventDefault(); }, { passive: false });
  document.addEventListener('touchmove', e => { if (emJogo() && !livre(e)) e.preventDefault(); }, { passive: false });
  let ultimo = 0; document.addEventListener('touchend', e => { const t = Date.now(); if (emJogo() && t - ultimo < 320 && !livre(e)) e.preventDefault(); ultimo = t; }, { passive: false });
  for (const g of ['gesturestart', 'gesturechange', 'gestureend']) document.addEventListener(g, e => e.preventDefault(), { passive: false });
  document.addEventListener('dblclick', e => { if (emJogo()) e.preventDefault(); });
  // um campo de texto pode ter ampliado a página: ao sair dele, volta ao normal
  document.addEventListener('focusout', () => setTimeout(() => { if (!document.activeElement || document.activeElement === document.body) scrollTo(0, 0); }, 50));
}

export function initInput(canvas) {
  travarZoom();
  addEventListener('keydown', e => {
    if (typing(e) || !document.body.classList.contains('playing')) return;
    const hk = input.perfil === 'caminho', a = (hk ? mapaHK() : KEYMAP)[e.code];
    if ((hk ? moveHK() : MOVE)[e.code]) { input.keys.add(e.code); input.mouseAim = false; e.preventDefault(); }
    if (a) { if (!e.repeat) input.press(a, e.code); e.preventDefault(); }
  });
  addEventListener('keyup', e => {
    input.keys.delete(e.code);
    for (const m of [KEYMAP, mapaHK()]) if (m[e.code]) input.release(m[e.code], e.code);
  });
  addEventListener('blur', () => input.clear());
  document.addEventListener('visibilitychange', () => { if (document.hidden) input.clear(); });
  addEventListener('orientationchange', () => input.clear());
  canvas.addEventListener('mousemove', e => { input.mx = e.clientX; input.my = e.clientY; input.mouseAim = true; });
  canvas.addEventListener('mousedown', e => {
    input.mx = e.clientX; input.my = e.clientY; input.mouseAim = true;
    if (e.button === 0) input.press('attack', 'mouse');
    if (e.button === 2) input.press('skill', 'mouse');
    if (e.button === 1) { e.preventDefault(); input.press('lock', 'mouse'); }
  });
  addEventListener('mouseup', e => { const a = ['attack', 'lock', 'skill'][e.button]; if (a) input.release(a, 'mouse'); });
  canvas.addEventListener('contextmenu', e => e.preventDefault());

  // joystick: qualquer toque na metade esquerda da tela
  const stickEl = document.getElementById('stick'), knob = document.getElementById('knob');
  const R = 52;
  const place = () => {
    stickEl.style.left = input.stick.ox + 'px'; stickEl.style.top = input.stick.oy + 'px';
    knob.style.transform = `translate(${input.stick.x * R}px, ${input.stick.y * R}px)`;
  };
  canvas.addEventListener('pointerdown', e => {
    if (e.pointerType === 'mouse') return;
    // Cancela o mouse sintético do toque e mantém cada dedo no seu controle.
    e.preventDefault(); input.mouseAim = false;
    input.touch = true; document.body.classList.add('touch');
    if (e.clientX < innerWidth * 0.5 && input.stick.id == null) {
      input.stick.id = e.pointerId; input.stick.ox = e.clientX; input.stick.oy = e.clientY; input.stick.x = input.stick.y = 0;
      stickEl.classList.add('on'); place();
      canvas.setPointerCapture?.(e.pointerId);
    }
  });
  addEventListener('pointermove', e => {
    if (e.pointerId !== input.stick.id) return;
    let dx = e.clientX - input.stick.ox, dy = e.clientY - input.stick.oy;
    const l = Math.hypot(dx, dy);
    if (l > R) { input.stick.ox += dx - dx / l * R; input.stick.oy += dy - dy / l * R; dx = dx / l * R; dy = dy / l * R; }
    input.stick.x = dx / R; input.stick.y = dy / R;
    if (Math.hypot(input.stick.x, input.stick.y) < 0.15) input.stick.x = input.stick.y = 0;
    place();
  });
  const end = e => { if (e.pointerId === input.stick.id) { input.stick.id = null; input.stick.x = input.stick.y = 0; stickEl.classList.remove('on'); } };
  addEventListener('pointerup', end); addEventListener('pointercancel', end); canvas.addEventListener('lostpointercapture', end);

  // botões de ação na tela
  const pointers = new Map();
  document.querySelectorAll('[data-act]').forEach(b => {
    const a = b.dataset.act;
    b.addEventListener('pointerdown', e => {
      e.preventDefault(); e.stopPropagation(); input.touch = true; input.mouseAim = false;
      pointers.set(e.pointerId, b); input.press(a, 'pointer:' + e.pointerId);
      if (a === 'attack') { input.arrasto = { x: 0, y: 0, ox: e.clientX, oy: e.clientY, id: e.pointerId }; } // arrastar o dedo a partir do botão do golpe aponta o ataque mira
      b.classList.add('down'); b.setPointerCapture?.(e.pointerId);
    });
    if (a === 'attack') b.addEventListener('pointermove', e => { const r = input.arrasto; if (r && r.id === e.pointerId) { r.x = e.clientX - r.ox; r.y = e.clientY - r.oy; } });
    const up = e => {
      if (pointers.get(e.pointerId) !== b) return;
      // Alguns navegadores transferem a captura implícita do ícone para o botão.
      if (e.type === 'lostpointercapture' && b.hasPointerCapture?.(e.pointerId)) return;
      pointers.delete(e.pointerId); if (a === 'attack' && input.arrasto?.id === e.pointerId) setTimeout(() => { if (input.arrasto?.id === e.pointerId) input.arrasto = null; }, 60);
      input.release(a, 'pointer:' + e.pointerId, e.type !== 'pointerup');
      if (![...pointers.values()].includes(b)) b.classList.remove('down');
    };
    b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up); b.addEventListener('lostpointercapture', up);
  });
  input.resetPointers = () => {
    for (const [id, b] of pointers) { b.classList.remove('down'); if (b.hasPointerCapture?.(id)) b.releasePointerCapture(id); }
    if (input.stick.id != null && canvas.hasPointerCapture?.(input.stick.id)) canvas.releasePointerCapture(input.stick.id);
    pointers.clear(); stickEl.classList.remove('on'); knob.style.transform = 'translate(0px, 0px)';
  };
  if (matchMedia('(pointer: coarse)').matches) { input.touch = true; document.body.classList.add('touch'); }
}
