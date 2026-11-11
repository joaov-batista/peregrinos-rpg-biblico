// Teclado + mouse no PC, joystick virtual + botões na tela no celular.
const KEYMAP = {
  KeyZ: 'dodge', KeyX: 'attack', KeyC: 'dash', KeyV: 'skill', // atalhos do Caminho (plataforma)
  KeyJ: 'attack', KeyK: 'skill', Space: 'dodge', ShiftLeft: 'defend', ShiftRight: 'defend', KeyL: 'defend',
  KeyQ: 'item1', Digit1: 'item1', Numpad1: 'item1', Digit2: 'item2', Numpad2: 'item2', KeyR: 'mount', KeyE: 'interact', KeyF: 'interact', KeyI: 'menu', Tab: 'menu', KeyM: 'map', KeyT: 'lock', KeyH: 'botija', Enter: 'chat', Escape: 'escape'
};
// No Caminho, o teclado segue o padrão de Hollow Knight: setas andam, Z pula, X golpeia, C é o passo,
// A (segurar) ora, S ergue a lâmpada, D solta o especial, seta para cima (ou E) interage, Tab abre o mapa, I o inventário.
const KEYMAP_HK = { KeyZ: 'dodge', Space: 'dodge', KeyX: 'attack', KeyC: 'dash', KeyA: 'botija', KeyS: 'defend', ShiftLeft: 'defend', KeyD: 'skill', KeyF: 'skill',
  ArrowUp: 'interact', KeyE: 'interact', Enter: 'interact', Tab: 'map', KeyM: 'map', KeyI: 'menu', Escape: 'escape' };
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
    const M = this.perfil === 'caminho' ? MOVE_HK : MOVE;
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

export function initInput(canvas) {
  addEventListener('keydown', e => {
    if (typing(e) || !document.body.classList.contains('playing')) return;
    const hk = input.perfil === 'caminho', a = (hk ? KEYMAP_HK : KEYMAP)[e.code];
    if ((hk ? MOVE_HK : MOVE)[e.code]) { input.keys.add(e.code); input.mouseAim = false; e.preventDefault(); }
    if (a) { if (!e.repeat) input.press(a, e.code); e.preventDefault(); }
  });
  addEventListener('keyup', e => {
    input.keys.delete(e.code);
    for (const m of [KEYMAP, KEYMAP_HK]) if (m[e.code]) input.release(m[e.code], e.code);
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
      b.classList.add('down'); b.setPointerCapture?.(e.pointerId);
    });
    const up = e => {
      if (pointers.get(e.pointerId) !== b) return;
      // Alguns navegadores transferem a captura implícita do ícone para o botão.
      if (e.type === 'lostpointercapture' && b.hasPointerCapture?.(e.pointerId)) return;
      pointers.delete(e.pointerId);
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
