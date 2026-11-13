import './styles.css';
import './art-direction.css';
import './pwa.js';
import './ui/offlineStatus.js';
import { $, h } from './util.js';
import { initInput, input } from './input.js';
import { initZoom } from './zoom.js';
import { initAudio } from './audio.js';
import { initGamepad } from './gamepad.js';
import { net, ONLINE } from './net.js';
import { Game } from './game/game.js';
import { Caminho } from './caminho/jogo.js';
import './caminho/caminho.css';
import './remake.css';
import './pixel-ui.css';
import { createHud } from './ui/hud.js';
import { config, setConfig } from './config.js';
import { showAuth, showSelect, showCreator, hideScreens } from './ui/screens.js';

const canvas = $('cv');
initZoom();
initInput(canvas);
initGamepad();
addEventListener('pointerdown', initAudio, { once: true });
addEventListener('keydown', initAudio, { once: true });

let game = null, releaseCharacter = null;
const ui = createHud(exitToSelect);
ui.show(false);

const CLASSICO = new URLSearchParams(location.search).has('classico') || import.meta.env.VITE_MODO === 'classico';
document.documentElement.classList.toggle('remake', !CLASSICO);
async function play(char, modo) {
  // Evita duas abas editando o mesmo personagem ao mesmo tempo.
  if (navigator.locks) {
    const acquired = await new Promise(resolve => {
      navigator.locks.request('peregrinos-play-' + char.id, { ifAvailable: true }, lock => {
        if (!lock) { resolve(false); return; }
        return new Promise(release => { releaseCharacter = release; resolve(true); });
      }).catch(() => resolve(false));
    });
    if (!acquired) { ui.toast('Este personagem já está aberto em outra aba. Feche a outra partida para jogar aqui.', 6000); return; }
  }
  hideScreens();
  if (modo !== 'classico' && !CLASSICO) await escolherControles();
  ui.show(true);
  input.clear();
  // O Caminho (remake em vista lateral) é o jogo; o mundo aberto antigo continua em "Clássico" (ou com ?classico na URL).
  if (modo !== 'classico' && !CLASSICO) {
    game = new Caminho(canvas, char, ui, exitToSelect);
    window.__game = game;
    return;
  }
  const novo = !char.data.stats.playtime;
  game = new Game(canvas, char, ui);
  ui.attach(game);
  ui.online(ONLINE && net.user && net.connected ? 1 : 0);
  window.__game = game; // ajuda na depuração pelo console
  const viu = (() => { try { return localStorage.getItem('peregrinos.controles') === '1'; } catch { return false; } })();
  const boasVindas = () => novo && ui.dialog({
    nome: 'Bem-vindo, ' + char.name + '!',
    texto: 'Você chegou à Cidade de Refúgio. Fale com o Velho Peregrino (logo abaixo da fonte) para receber sua primeira missão.\n\nAo norte da cidade fica o Portão das Dungeons, com as fases de cada semana de estudo. Fora dos muros, vícios e demônios esperam por você.\n\n"Sede fortes no Senhor e na força do seu poder" (Ef 6:10).',
    acoes: [{ label: 'Vamos lá!' }]
  });
  // personagem novo: prólogo narrado (content/cinematicas.js), depois os controles e as boas-vindas
  if (novo || !viu) setTimeout(async () => { if (novo) await game.cinema('prologo'); await ui.controles(); try { localStorage.setItem('peregrinos.controles', '1'); } catch {} boasVindas(); }, 600);
}

// No computador, a primeira partida pergunta como se quer jogar: WASD + mouse ou setas. No celular (toque) e nas telas
// divididas (cada uma com seu controle) não há o que escolher. Depois, dá para trocar em ☰ › Ajustes.
function escolherControles() {
  const q = new URLSearchParams(location.search);
  if (config.esquemaEscolhido || matchMedia('(pointer: coarse)').matches || q.has('quadro') || q.has('pad')) return Promise.resolve();
  const tecla = (t, larga) => h('span', { class: 'esq-tecla' + (larga ? ' larga' : '') }, t);
  const cartao = (id, titulo, desenho, linhas) => h('button', { class: 'esq-card', 'data-esquema': id, onclick: e => e.currentTarget.closest('.modal')._escolhe(id) },
    h('b', {}, titulo), h('div', { class: 'esq-desenho' }, ...desenho), h('ul', {}, ...linhas.map(l => h('li', {}, l))));
  return ui.modal((p, close) => {
    p.classList.add('esquema');
    p.closest('.modal')._escolhe = id => { setConfig('esquema', id); setConfig('teclas', {}); setConfig('esquemaEscolhido', true); close(id); };
    p.append(h('h2', {}, 'Como você quer jogar?'), h('p', { class: 'muted' }, 'Escolha o jeito de segurar o cajado. Dá para trocar depois em ☰ › Ajustes.'),
      h('div', { class: 'esq-opcoes' },
        cartao('wasd', 'Teclado + mouse', [h('div', { class: 'esq-wasd' }, tecla('Q'), tecla('W'), tecla('E'), tecla('A'), tecla('S'), tecla('D')), h('span', { class: 'esq-mouse' }, h('i', {}), h('i', {}))],
          ['A D andam · W ou Espaço pula', 'Mouse esquerdo golpeia, direito solta o especial', 'Q ora · E ergue a lâmpada · F fala', 'Shift é o passo · o mouse mira']),
        cartao('setas', 'Só o teclado (setas)', [h('div', { class: 'esq-setas' }, tecla('↑'), tecla('←'), tecla('↓'), tecla('→')), h('div', { class: 'esq-zxc' }, tecla('Z'), tecla('X'), tecla('C'))],
          ['Setas andam · ↑ pula', 'Z ou X golpeia · S solta o especial', 'A ora · D ergue a lâmpada · E fala', 'C é o passo · as setas miram'])),
      h('p', { class: 'muted esq-pad' }, 'Tem um controle? É só ligar e apertar qualquer botão: ele funciona com qualquer uma das duas.'));
  }, { dismiss: false, wide: true });
}

function exitToSelect() {
  game?.destroy(); releaseCharacter?.(); releaseCharacter = null; game = null; window.__game = null; ui.detach(); ui.show(false);
  start();
}

function select() {
  showSelect(play, () => showCreator(c => play(c), select), async () => { await net.signOut(); showAuth(select); });
}

// ---- Vários jogadores no mesmo aparelho: a tela se divide em quadros, um por controle ----
// Cada quadro é o jogo inteiro, preso a um controle (?pad=N) e ligado aos outros pela mesma sala do "Caminhar juntos".
// O quadro 1 abre a sala; o código aparece no alto para quem quiser entrar de fora (celular, outro PC), até 4 no total.
const TELAS = Math.min(4, +new URLSearchParams(location.search).get('telas') || 0);
function montarTelas(n) {
  document.body.innerHTML = ''; document.body.className = 'telas telas-' + n;
  const barra = document.createElement('div'); barra.className = 'telas-barra';
  const info = document.createElement('span'); info.textContent = 'Jogador 1: escolha o peregrino. Os outros quadros abrem quando a sala estiver pronta; cada jogador entra com a própria conta.';
  const sair = document.createElement('button'); sair.textContent = 'Sair da tela dividida'; sair.onclick = () => { location.href = location.pathname; };
  barra.append(info, sair); document.body.append(barra);
  const grade = document.createElement('div'); grade.className = 'telas-grade'; document.body.append(grade);
  const quadros = [], TELA_ID = Math.random().toString(36).slice(2, 8);
  for (let i = 0; i < n; i++) { const f = document.createElement('iframe'); f.allow = 'gamepad; autoplay; fullscreen'; f.title = 'Jogador ' + (i + 1); if (i === 0) f.src = location.pathname + '?quadro=0&pad=0&tela=' + TELA_ID; else f.srcdoc = '<body style="margin:0;display:grid;place-items:center;height:100vh;background:#05060B;color:#9096AA;font:600 15px system-ui;text-align:center">Jogador ' + (i + 1) + '<br>aguardando o jogador 1 entrar no jogo…</body>'; grade.append(f); quadros.push(f); }
  // quadros que se juntam: todos na mesma área, perto e sem janela aberta → um quadro só; afastou, divide de novo
  const pos = [], vidas = document.createElement('span'); vidas.className = 'telas-vidas'; barra.insertBefore(vidas, sair);
  let juntas = false, vwQuadro = 0, geral = null; // geral: o quadro que mostra uma cena ou uma pergunta para todos
  const manda = m => quadros.forEach(f => { try { f.contentWindow?.postMessage(m, location.origin); } catch {} });
  const avisa = () => manda({ peregrinosJuntas: juntas || geral != null });
  const mostra = () => { const um = juntas || geral != null, topo = geral ?? 0; grade.classList.toggle('juntas', um); quadros.forEach((f, i) => { f.style.zIndex = um && i === topo ? 2 : ''; }); if (geral != null) quadros[geral]?.focus(); };
  // um quadro começou (ou terminou) um evento de todos: a tela vira uma só, a do quadro que o mostra, e os outros esperam
  addEventListener('message', e => {
    const d = e.origin === location.origin && e.data?.peregrinosGeral; if (!d) return;
    // só vale para quem já está no jogo e na mesma área: quem ainda escolhe o peregrino, ou está longe, segue no seu quadro
    const agora = performance.now(), junto = i => i !== d.q && pos[i] && pos[d.q] && agora - pos[i].t < 2000 && pos[i].a === pos[d.q].a;
    if (d.on) { if (!quadros.some((_, i) => junto(i))) return; geral = d.q; } else if (geral === d.q) geral = null; else return;
    mostra(); avisa(); quadros.forEach((f, i) => { if (i !== d.q) try { f.contentWindow?.postMessage({ peregrinosPausa: geral != null && junto(i) }, location.origin); } catch {} });
  });
  addEventListener('message', e => {
    const d = e.origin === location.origin && e.data?.peregrinosPos; if (!d) return;
    d.t = performance.now(); pos[d.q] = d;
    const vivos = pos.filter(p => p && d.t - p.t < 1500);
    vidas.textContent = vivos.map(p => (p.nome || 'J' + (p.q + 1)) + ' ♥ ' + p.hp + '/' + p.max).join('  ·  ');
    if ((vidas.tN = (vidas.tN || 0) + 1) % 2) manda({ peregrinosVidas: vivos.map(p => ({ q: p.q, nome: p.nome, hp: p.hp, max: p.max, oleo: p.oleo })) });
    if (!juntas) vwQuadro = pos[0]?.vw || vwQuadro;
    const larg = vwQuadro * (n === 2 ? 2 : 1), xs = vivos.map(p => p.x), ys = vivos.map(p => p.y);
    const dx = Math.max(...xs) - Math.min(...xs), dy = Math.max(...ys) - Math.min(...ys);
    const todos = vivos.length === n && vivos.every(p => p.livre && p.a === vivos[0].a);
    const quer = todos && larg > 0 && (juntas ? dx < larg * 0.8 && dy < 400 : dx < larg * 0.5 && dy < 260);
    if (quer !== juntas) { juntas = quer; mostra(); avisa(); }
  });
  addEventListener('message', e => {
    if (e.origin !== location.origin || !e.data?.peregrinosSala) return;
    const { peregrinosSala: cod, local } = e.data;
    info.textContent = 'Sala ' + cod + (local ? ' (só neste aparelho: sem internet)' : ' · quem estiver em outro aparelho entra com este código, em Menu › Juntos') + ' · cada quadro usa um controle; o teclado vale para o quadro clicado';
    quadros.forEach((f, i) => { if (i && !f.dataset.ok) { f.dataset.ok = 1; f.removeAttribute('srcdoc'); f.src = location.pathname + '?quadro=' + i + '&pad=' + i + '&tela=' + TELA_ID + '&sala=' + cod + (local ? '&redelocal' : ''); } });
  });
}

async function start() {
  if (TELAS >= 2) return montarTelas(TELAS);
  if (ONLINE) await net.init().catch(() => null);
  if (ONLINE && !net.user) showAuth(select);
  else if (!ONLINE && !sessionStorage.getItem('peregrinos.started')) showAuth(() => { sessionStorage.setItem('peregrinos.started', '1'); select(); });
  else select();
}
start();

// salva ao fechar a aba
addEventListener('visibilitychange', () => { if (document.hidden) game?.save(); });

addEventListener('pagehide', () => { void game?.save(); });
