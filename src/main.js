import './styles.css';
import './art-direction.css';
import './pwa.js';
import './ui/offlineStatus.js';
import { $ } from './util.js';
import { initInput, input } from './input.js';
import { initZoom } from './zoom.js';
import { initAudio } from './audio.js';
import { initGamepad } from './gamepad.js';
import { net, ONLINE } from './net.js';
import { Game } from './game/game.js';
import { Caminho } from './caminho/jogo.js';
import './caminho/caminho.css';
import './remake.css';
import { createHud } from './ui/hud.js';
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
  const quadros = [];
  for (let i = 0; i < n; i++) { const f = document.createElement('iframe'); f.allow = 'gamepad; autoplay; fullscreen'; f.title = 'Jogador ' + (i + 1); if (i === 0) f.src = location.pathname + '?quadro=0&pad=0'; else f.srcdoc = '<body style="margin:0;display:grid;place-items:center;height:100vh;background:#05060B;color:#9096AA;font:600 15px system-ui;text-align:center">Jogador ' + (i + 1) + '<br>aguardando o jogador 1 entrar no jogo…</body>'; grade.append(f); quadros.push(f); }
  // quadros que se juntam: todos na mesma área, perto e sem janela aberta → um quadro só; afastou, divide de novo
  const pos = [], vidas = document.createElement('span'); vidas.className = 'telas-vidas'; barra.insertBefore(vidas, sair);
  let juntas = false, vwQuadro = 0;
  const avisa = () => quadros.forEach(f => { try { f.contentWindow?.postMessage({ peregrinosJuntas: juntas }, location.origin); } catch {} });
  addEventListener('message', e => {
    const d = e.origin === location.origin && e.data?.peregrinosPos; if (!d) return;
    d.t = performance.now(); pos[d.q] = d;
    const vivos = pos.filter(p => p && d.t - p.t < 1500);
    vidas.textContent = vivos.map(p => (p.nome || 'J' + (p.q + 1)) + ' ♥ ' + p.hp + '/' + p.max).join('  ·  ');
    if (!juntas) vwQuadro = pos[0]?.vw || vwQuadro;
    const larg = vwQuadro * (n === 2 ? 2 : 1), xs = vivos.map(p => p.x), ys = vivos.map(p => p.y);
    const dx = Math.max(...xs) - Math.min(...xs), dy = Math.max(...ys) - Math.min(...ys);
    const todos = vivos.length === n && vivos.every(p => p.livre && p.a === vivos[0].a);
    const quer = todos && larg > 0 && (juntas ? dx < larg * 0.8 && dy < 400 : dx < larg * 0.5 && dy < 260);
    if (quer !== juntas) { juntas = quer; grade.classList.toggle('juntas', juntas); avisa(); }
  });
  addEventListener('message', e => {
    if (e.origin !== location.origin || !e.data?.peregrinosSala) return;
    const { peregrinosSala: cod, local } = e.data;
    info.textContent = 'Sala ' + cod + (local ? ' (só neste aparelho: sem internet)' : ' · quem estiver em outro aparelho entra com este código, em Menu › Juntos') + ' · cada quadro usa um controle; o teclado vale para o quadro clicado';
    quadros.forEach((f, i) => { if (i && !f.dataset.ok) { f.dataset.ok = 1; f.removeAttribute('srcdoc'); f.src = location.pathname + '?quadro=' + i + '&pad=' + i + '&sala=' + cod + (local ? '&redelocal' : ''); } });
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
