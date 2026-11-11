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

const CLASSICO = new URLSearchParams(location.search).has('classico');
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

async function start() {
  if (ONLINE) await net.init().catch(() => null);
  if (ONLINE && !net.user) showAuth(select);
  else if (!ONLINE && !sessionStorage.getItem('peregrinos.started')) showAuth(() => { sessionStorage.setItem('peregrinos.started', '1'); select(); });
  else select();
}
start();

// salva ao fechar a aba
addEventListener('visibilitychange', () => { if (document.hidden) game?.save(); });

addEventListener('pagehide', () => { void game?.save(); });
