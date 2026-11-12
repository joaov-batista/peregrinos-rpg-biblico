// Controle (Xbox, PlayStation e genéricos no layout "standard" do navegador), no estilo Dark Souls:
//   analógico esq.: andar · analógico dir.: mirar · RB/R1: atacar (segurar = golpe forte) · RT/R2: especial
//   LB/L1: defender · LT/L2 ou R3: travar alvo · A/✕: falar/abrir · B/◯: esquiva · X/□: botija · Y/△: montar
//   ◀ ▶: atalhos · ▲ ou Select: mapa · Start: menu
// Com uma janela aberta, o direcional/analógico escolhe o botão, A confirma e B volta.
import { input } from './input.js';
import { config } from './config.js';

const ACOES = { 5: 'attack', 7: 'skill', 4: 'defend', 6: 'lock', 11: 'lock', 0: 'interact', 1: 'dodge', 2: 'botija', 3: 'mount', 14: 'item1', 15: 'item2' };
// no Caminho (plataforma): A pula, X/RB golpeia, B/RT passo pronto, Y fala/lê, LB lâmpada, LT ora, ▲ verso
// como em Hollow Knight: A pula, X golpeia, B (segurar) ora, RT é o passo; LB ergue a lâmpada, RB solta o especial, Y interage; LT também ora
const ACOES_CAMINHO = { 0: 'dodge', 2: 'attack', 1: 'botija', 7: 'dash', 5: 'skill', 3: 'interact', 4: 'defend', 6: 'botija', 10: 'skill', 11: 'item2', 13: 'item2' };
// em tela dividida (?pad=N) cada quadro escuta só o seu controle
const PAD_FIXO = new URLSearchParams(location.search).has('pad') ? +new URLSearchParams(location.search).get('pad') : null;
// botões escolhidos pelo jogador (menu › Ajustes › Controle): { ação: índice do botão }. Serve também para controles fora do padrão.
function mapaPad() { const t = config.botoes; if (!t || !Object.keys(t).length) return ACOES_CAMINHO; const m = { ...ACOES_CAMINHO }; for (const acao of Object.keys(t)) for (const k of Object.keys(m)) if (m[k] === acao) delete m[k]; for (const [acao, i] of Object.entries(t)) m[i] = acao; return m; }
export function botaoDe(acao) { const m = mapaPad(); return Object.keys(m).find(k => m[k] === acao); }
// espera o próximo botão apertado em qualquer controle ligado
export function proximoBotao(ms = 6000) { return new Promise(ok => { const t0 = performance.now(); let solto = false; const olha = () => { const l = [...(navigator.getGamepads?.() || [])].filter(Boolean); let ap = -1; for (const g of l) g.buttons.forEach((b, i) => { if (b.pressed || b.value > 0.5) ap = i; }); if (ap < 0) solto = true; else if (solto) return ok(ap); if (performance.now() - t0 > ms) return ok(null); requestAnimationFrame(olha); }; olha(); }); }
let padAtivo = -1;
const meuControle = () => { const l = [...(navigator.getGamepads?.() || [])].filter(Boolean); if (PAD_FIXO != null) return l[PAD_FIXO]; for (const g of l) if (g.buttons.some(b => b.pressed) || Math.hypot(g.axes[0] || 0, g.axes[1] || 0) > 0.5) padAtivo = g.index; return l.find(g => g.index === padAtivo) || l[0]; }; // fora da tela dividida, vale o controle que foi usado por último
const ZONA = 0.22; // zona morta dos analógicos
let antes = [], nav = { t: 0, dir: null };
export const pad = { conectado: false, nome: '' };

export function initGamepad() {
  addEventListener('gamepadconnected', e => { pad.conectado = true; pad.nome = e.gamepad.id; usarControle(); input.padAvisar?.('🎮 Controle conectado! Aperte Start para o menu.'); });
  addEventListener('gamepaddisconnected', () => { pad.conectado = [...(navigator.getGamepads?.() || [])].some(Boolean); if (!pad.conectado) document.body.classList.remove('pad'); });
  const loop = () => { try { ler(); } catch { /* controle desconectado no meio da leitura */ } requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
}

function usarControle() { input.touch = false; input.mouseAim = false; document.body.classList.add('pad'); document.body.classList.remove('touch'); }

function ler() {
  const gp = meuControle();
  if (!gp) {
    input.pad = null; input.padAim = null;
    for (const [i, a] of Object.entries(ACOES)) input.release(a, 'pad:' + i, true);
    antes = []; return;
  }
  const b = gp.buttons.map(x => x.pressed || x.value > 0.5), ax = gp.axes;
  const borda = i => b[i] && !antes[i];
  if (b.some((x, i) => x && !antes[i]) || Math.hypot(ax[0] || 0, ax[1] || 0) > 0.5) usarControle();
  const janela = topo();
  if (janela) {
    // menus: navegação por foco
    input.pad = null; input.padAim = null;
    for (const [i, a] of Object.entries(ACOES)) input.release(a, 'pad:' + i, true);
    menu(gp, b, borda, janela);
  } else {
    // movimento e mira
    const mx = Math.abs(ax[0]) > ZONA ? ax[0] : 0, my = Math.abs(ax[1]) > ZONA ? ax[1] : 0;
    input.pad = mx || my ? { x: mx, y: my } : null;
    const rx = ax[2] || 0, ry = ax[3] || 0;
    input.padAim = Math.hypot(rx, ry) > 0.4 ? Math.atan2(ry, rx) : null;
    for (const [i, a] of Object.entries(input.perfil === 'caminho' ? mapaPad() : ACOES)) {
      if (b[i] && !antes[i]) input.press(a, 'pad:' + i);
      input.setHeld(a, 'pad:' + i, !!b[i]);
    }
    if (borda(9)) input.padAcoes?.menu?.();
    if (borda(8) || borda(12)) input.padAcoes?.mapa?.();
  }
  antes = b;
}

// janela aberta por cima do jogo (ou as telas de login/personagem)
function topo() {
  const modais = document.querySelectorAll('#overlay .modal');
  if (modais.length) return modais[modais.length - 1];
  const telas = document.getElementById('screens');
  return telas && telas.children.length && !telas.hidden && getComputedStyle(telas).display !== 'none' ? telas : null;
}

function focaveis(raiz) {
  return [...raiz.querySelectorAll('button:not([disabled]), input, [tabindex="0"]')].filter(el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; });
}

// escolhe o botão mais perto na direção apertada
function mover(raiz, dx, dy) {
  const els = focaveis(raiz); if (!els.length) return;
  const at = document.activeElement;
  if (!raiz.contains(at) || !els.includes(at)) { els[0].focus(); return; }
  const r0 = at.getBoundingClientRect(), cx = r0.x + r0.width / 2, cy = r0.y + r0.height / 2;
  let best = null, bs = Infinity;
  for (const el of els) {
    if (el === at) continue;
    const r = el.getBoundingClientRect(), vx = r.x + r.width / 2 - cx, vy = r.y + r.height / 2 - cy;
    const along = vx * dx + vy * dy; if (along <= 4) continue;
    const perp = Math.abs(vx * dy - vy * dx), s = along + perp * 2.5;
    if (s < bs) { bs = s; best = el; }
  }
  (best || at).focus(); (best || at).scrollIntoView?.({ block: 'nearest' });
}

function menu(gp, b, borda, janela) {
  const ax = gp.axes, agora = performance.now();
  let dx = 0, dy = 0;
  if (b[12] || ax[1] < -0.5) dy = -1; else if (b[13] || ax[1] > 0.5) dy = 1;
  else if (b[14] || ax[0] < -0.5) dx = -1; else if (b[15] || ax[0] > 0.5) dx = 1;
  const dir = dx + ',' + dy;
  if (dx || dy) {
    if (dir !== nav.dir || agora > nav.t) { mover(janela, dx, dy); nav.t = agora + (dir !== nav.dir ? 320 : 140); }
  }
  nav.dir = dx || dy ? dir : null;
  if (borda(0)) confirmar(janela);
  if (borda(1) || borda(9)) { if (janela.classList.contains('modal') && !janela.classList.contains('locked')) janela._close?.(); }
}

// o botão que faz sentido começar escolhido: uma resposta, o botão da conversa, o principal — nunca o ✕
function preferido(janela) { return janela.querySelector('.answer:not([disabled]), .btn-row .btn:not([disabled]), .btn.gold:not([disabled]), .forge-primary:not([disabled])') || focaveis(janela).find(el => !el.classList.contains('x')) || focaveis(janela)[0]; }
function confirmar(janela) {
  const at = document.activeElement;
  if (janela.contains(at) && at.click && !at.disabled) return at.click();
  const b = preferido(janela); if (!b) return;
  b.focus({ preventScroll: true }); if (janela.querySelector('.dlg-text') && !janela.querySelector('.answer')) b.click(); // numa conversa, confirmar já segue adiante
}
// Teclado nas janelas (falas, perguntas, lojas, menus, telas de entrada): setas ou WASD escolhem, Enter / Espaço / Z / X / E / F confirmam,
// 1 a 4 respondem direto, Esc fecha. Fica na fase de borbulha: quem captura teclas antes (pesca, troca de teclas) continua mandando.
if (typeof document !== 'undefined') addEventListener('keydown', e => {
  const janela = topo(); if (!janela || e.ctrlKey || e.metaKey || e.altKey) return;
  const alvo = e.target, digitando = alvo && (alvo.tagName === 'INPUT' || alvo.tagName === 'TEXTAREA' || alvo.tagName === 'SELECT' || alvo.isContentEditable);
  const dir = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0], KeyW: [0, -1], KeyS: [0, 1], KeyA: [-1, 0], KeyD: [1, 0] }[e.code];
  if (digitando) { if ((e.code === 'ArrowUp' || e.code === 'ArrowDown') && alvo.tagName !== 'SELECT' && alvo.tagName !== 'TEXTAREA') { e.preventDefault(); mover(janela, 0, dir[1]); } return; }
  if (dir) { e.preventDefault(); return mover(janela, dir[0], dir[1]); }
  if (/^(Digit|Numpad)[1-9]$/.test(e.code)) { const r = [...janela.querySelectorAll('.answer:not([disabled])')][+e.code.slice(-1) - 1]; if (r) { e.preventDefault(); r.click(); } return; }
  if (e.code === 'Escape') { if (janela.classList.contains('modal') && !janela.classList.contains('locked')) { e.preventDefault(); e.stopImmediatePropagation(); janela._close?.(); } return; }
  // Enter e Espaço: o jogo cancela o clique nativo dessas teclas, então a janela confirma por conta própria
  if (['Enter', 'NumpadEnter', 'Space', 'KeyZ', 'KeyX', 'KeyE', 'KeyF', 'KeyJ'].includes(e.code)) { e.preventDefault(); if (!e.repeat) confirmar(janela); }
});
// quando os botões aparecem depois (a fala termina de ser escrita, a pergunta troca), o foco vai para o botão certo
if (typeof document !== 'undefined') setInterval(() => { const janela = topo(); if (!janela) return; const at = document.activeElement; if (at && janela.contains(at) && !at.disabled && at.isConnected) return; if (at && (at.tagName === 'INPUT' || at.tagName === 'TEXTAREA')) return; preferido(janela)?.focus({ preventScroll: true }); }, 250);

// tremida do controle (ou do celular) nos golpes e na defesa perfeita
export function vibrar(ms = 120, forca = 0.6) {
  if (!config.vibrar) return;
  const gp = meuControle();
  if (gp?.vibrationActuator?.playEffect) { gp.vibrationActuator.playEffect('dual-rumble', { duration: ms, strongMagnitude: forca, weakMagnitude: forca * 0.6 }).catch(() => {}); return; }
  if (input.touch && navigator.vibrate) navigator.vibrate(Math.round(ms * 0.6));
}
