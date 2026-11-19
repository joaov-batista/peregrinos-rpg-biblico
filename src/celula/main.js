// A sala da célula (/celula): uma página à parte do jogo, aberta por link, sem conta (só o nome), para quantos vierem.
// Abertura épica em pixel (PixelFX) → criar o peregrino → "como você vai jogar?" (celular, teclado ou controle, com a
// transparência dos botões) → a sala (entrar pelo link, criar, ou o TELÃO do líder) → as cinco páginas.
// O peregrino da célula fica só neste aparelho e não mistura com o jogo principal.
import '../styles.css';
import '../art-direction.css';
import { $, h } from '../util.js';
import { initInput, input } from '../input.js';
import { initZoom } from '../zoom.js';
import { initAudio, sfx, music } from '../audio.js';
import { initGamepad, preferirControle } from '../gamepad.js';
import { Caminho } from '../caminho/jogo.js';
import '../caminho/caminho.css';
import { instalarMolduras } from '../ui/molduras.js';
import '../remake.css';
import '../pixel-ui.css';
import './celula.css';
import { createHud } from '../ui/hud.js';
import { config, setConfig } from '../config.js';
import { mountCreator } from '../ui/creator.js';
import { definirJogo } from '../estado.js';
import { EVENTOS } from '../content/index.js';
import { Rede, limparCodigo, novoCodigo } from './rede.js';
import { criarEvento } from './evento.js';
import { montarTitulo } from './titulo.js';
import { abrirVoto } from './votacao.js';

const SEM = EVENTOS.find(s => s.id === 'celula-escolheu');
const CHAVE = 'peregrinos.celula.' + SEM.id, par = new URLSearchParams(location.search);
const LOCAL = par.has('redelocal'); // testes e aparelhos sem internet: abas do mesmo navegador
const canvas = $('cv'); initZoom(); initInput(canvas); initGamepad();
addEventListener('pointerdown', initAudio, { once: true }); addEventListener('keydown', initAudio, { once: true });
document.documentElement.classList.add('remake'); document.body.classList.add('celula'); instalarMolduras();
let game = null, rede = null, titulo = null;
const ui = createHud(() => sairDaPartida()); ui.show(false);
const telas = $('screens');

const lerChar = () => { try { return JSON.parse(localStorage.getItem(CHAVE) || 'null'); } catch { return null; } };
const salvarChar = c => { try { localStorage.setItem(CHAVE, JSON.stringify(c)); return true; } catch { return false; } };
const uid = () => 'cel-' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

function tela(...filhos) { titulo?.parar(); titulo = null; telas.className = ''; telas.hidden = false; telas.replaceChildren(h('div', { class: 'cel-tela' }, ...filhos)); return telas.firstChild; }
const botao = (txt, fn, cls = 'btn gold') => h('button', { class: cls, onclick: e => { sfx('click'); fn(e); } }, txt);

// ---------- 1. a abertura ----------
function abertura() {
  const cod = limparCodigo(par.get('sala') || ''), c = lerChar();
  const cv = h('canvas', { class: 'cel-titulo', 'aria-label': 'Jesus me escolheu' });
  const acoes = h('div', { class: 'cel-acoes' });
  tela(cv, h('div', { class: 'cel-painel' },
    cod ? h('p', { class: 'cel-convite' }, '✉ Você foi convidado para a sala ', h('b', {}, cod)) : h('p', { class: 'cel-convite' }, 'Célula de adolescentes · semana de ' + SEM.semana),
    acoes,
    h('p', { class: 'cel-mini' }, 'Sem conta: só o seu nome. Cinco páginas, cinco chefes e as perguntas são votadas pela sala inteira.')));
  titulo = montarTitulo(cv, { linhas: ['JESUS ME', 'ESCOLHEU'], topo: 'PEREGRINOS NA CÉLULA', sub: 'JOÃO 15:16' });
  if (c) acoes.append(botao('▶ Continuar como ' + c.name, () => controles(c)), botao('Criar outro peregrino', () => criar(), 'btn'));
  else acoes.append(botao('▶ Entrar', () => criar()));
  if (!cod) acoes.append(botao('📺 Sou o líder: abrir o telão', () => telao(), 'btn cel-lider'));
}

// ---------- 2. criar o peregrino (o mesmo criador do jogo, guardado só aqui) ----------
function criar() {
  titulo?.parar(); titulo = null; telas.hidden = false;
  mountCreator(telas, c => { salvarChar(c); controles(c); }, () => abertura(), {
    criar: async d => { const c = { ...d, id: uid(), level: 1, score: 0, week_score: 0, week_id: '', evento: SEM.id }; c.data.stats.playtime = 1; salvarChar(c); return c; }
  });
}

// ---------- 3. como você vai jogar? ----------
function controles(c) {
  const toque = matchMedia('(pointer: coarse)').matches || input.touch;
  const prev = h('div', { class: 'cel-prev-botoes' }, ...['⚔', '⤒', '»', '🪔'].map(t => h('span', {}, t)));
  const faixa = h('input', { type: 'range', min: 15, max: 100, step: 5, value: Math.round((config.alphaControles ?? 1) * 100), 'aria-label': 'Transparência dos botões', oninput: e => { setConfig('alphaControles', +e.target.value / 100); prev.style.opacity = config.alphaControles; } });
  prev.style.opacity = config.alphaControles ?? 1;
  const escolhe = id => { sfx('click');
    if (id === 'controle') { setConfig('modoControle', 'pad'); setConfig('esquema', 'wasd'); preferirControle(); }
    else if (id === 'wasd' || id === 'setas') { setConfig('modoControle', 'teclado'); setConfig('esquema', id); }
    setConfig('teclas', {}); setConfig('esquemaEscolhido', true); sala(c); };
  const cartao = (id, ic, nome, linhas, extra) => h('div', { class: 'cel-card' + (id === 'celular' && toque ? ' sugerido' : '') }, h('span', { class: 'cel-ic' }, ic), h('b', {}, nome), h('ul', {}, ...linhas.map(l => h('li', {}, l))), extra || '', botao('Jogar assim', () => escolhe(id)));
  tela(h('h1', { class: 'cel-h' }, 'Como você vai jogar, ' + c.name + '?'),
    h('div', { class: 'cel-cards' },
      cartao('celular', '📱', 'Celular (toque)', ['Celular deitado', 'Arraste à esquerda para andar', 'Botões à direita'], h('label', { class: 'cel-faixa' }, h('small', {}, 'Transparência dos botões (menos = mais transparente)'), faixa, prev)),
      cartao('wasd', '⌨', 'Teclado + mouse', ['A D andam · W pula', 'Clique golpeia', 'E ergue a lâmpada · F lê']),
      cartao('setas', '⌨', 'Só o teclado (setas)', ['Setas andam · ↑ pula', 'Z ou X golpeia', 'D lâmpada · E lê']),
      cartao('controle', '🎮', 'Controle', ['Xbox, PlayStation ou genérico', 'A pula · X golpeia', 'A B X Y votam no quiz'])),
    h('p', { class: 'cel-mini' }, 'Dá para mudar depois em ☰ › Ajustes. Nas votações: toque, teclas 1–4 ou A B X Y.'));
}

// ---------- 4. a sala ----------
function sala(c) {
  const cod = limparCodigo(par.get('sala') || '');
  if (cod) return conectar(c, cod);
  const campo = h('input', { class: 'cel-cod', maxlength: 5, placeholder: 'CÓDIGO', autocomplete: 'off', oninput: e => { e.target.value = limparCodigo(e.target.value); } });
  tela(h('h1', { class: 'cel-h' }, 'A sala da célula'),
    h('div', { class: 'cel-cards' },
      h('div', { class: 'cel-card' }, h('span', { class: 'cel-ic' }, '✉'), h('b', {}, 'Entrar com código'), h('p', {}, 'Digite o código que o líder mostrou (ou abra o link que mandaram no grupo).'), campo, botao('Entrar', () => { const v = limparCodigo(campo.value); if (v.length === 5) conectar(c, v); else campo.focus(); })),
      h('div', { class: 'cel-card' }, h('span', { class: 'cel-ic' }, '➕'), h('b', {}, 'Criar uma sala'), h('p', {}, 'Você joga e segura a sala. Mande o link para a turma. (Melhor ainda: o líder abre o telão no computador.)'), botao('Criar e jogar', () => conectar(c, novoCodigo()))),
      h('div', { class: 'cel-card' }, h('span', { class: 'cel-ic' }, '🚶'), h('b', {}, 'Jogar sozinho'), h('p', {}, 'Sem sala: as perguntas são só suas.'), botao('Sozinho', () => jogar(c, null), 'btn')))
  );
}
async function conectar(c, cod) {
  const msg = h('p', { class: 'cel-convite' }, 'Entrando na sala ' + cod + '…');
  tela(h('h1', { class: 'cel-h' }, 'Sala ' + cod), msg);
  const r = new Rede({ nome: c.name, look: c.look, cls: c.cls });
  try { await r.conectar(cod, LOCAL); }
  catch (e) { r.sair(); msg.textContent = 'Não deu para entrar: ' + (e.message || 'sem conexão') + ' Você pode jogar sozinho e tentar de novo depois.'; msg.after(h('div', { class: 'cel-acoes' }, botao('Tentar de novo', () => conectar(c, cod)), botao('Jogar sozinho', () => jogar(c, null), 'btn'))); return; }
  rede = r; history.replaceState(null, '', location.pathname + '?sala=' + r.codigo + (LOCAL ? '&redelocal' : ''));
  saguao(c);
}
function saguao(c) {
  const lista = h('ul', { class: 'cel-gente' }), link = rede.link();
  const pinta = () => lista.replaceChildren(...rede.placar().map(x => h('li', { class: x.eu ? 'eu' : '' }, x.nome + (x.eu ? ' (você)' : ''))));
  rede.aoMudar = pinta; rede.aoAviso = () => {}; pinta();
  tela(h('h1', { class: 'cel-h' }, 'Sala ', h('span', { class: 'cel-codigo' }, rede.codigo)),
    h('p', { class: 'cel-convite' }, rede.anfitriao ? 'Você abriu a sala. Deixe o jogo aberto: o seu aparelho segura a sala.' : 'Você entrou! Cada um joga a sua partida; as perguntas dos rolos são votadas por todos.'),
    h('div', { class: 'cel-link' }, h('code', {}, link), botao('Copiar', () => navigator.clipboard?.writeText(link).then(() => ui.toast('Link copiado!', 2500))), navigator.share ? botao('Compartilhar', () => navigator.share({ title: 'Jesus me escolheu', text: 'Entra na sala ' + rede.codigo + '!', url: link }).catch(() => {}), 'btn') : ''),
    h('b', { class: 'cel-sub' }, 'Quem já chegou'), lista,
    h('div', { class: 'cel-acoes' }, botao('▶ Começar!', () => jogar(c, rede))));
}

// ---------- 5. o jogo ----------
async function jogar(c, r) {
  titulo?.parar(); titulo = null; telas.hidden = true; telas.replaceChildren();
  ui.show(true); input.clear(); music(null);
  const ev = criarEvento({ sem: SEM, char: c, rede: r, salvar: salvarChar, sair: () => sairDaPartida(), ui });
  game = new Caminho(canvas, c, ui, () => sairDaPartida(), ev);
  navigator.wakeLock?.request('screen').catch(() => {}); // o celular não apaga no meio da votação
  definirJogo(game);
}
function sairDaPartida() {
  game?.salvar(); game?.destroy(); game = null; definirJogo(null); ui.detach?.(); ui.show(false);
  rede?.sair(); rede = null; history.replaceState(null, '', location.pathname); if (import.meta.env.DEV) window.__celula = { get rede() { return rede; } }; // para os testes de navegador
abertura();
}
addEventListener('visibilitychange', () => { if (document.hidden) game?.salvar(); });
addEventListener('pagehide', () => { game?.salvar(); });

// ---------- o TELÃO do líder: segura a sala sem jogar; mostra o código, o placar e as votações em tela grande ----------
async function telao() {
  const r = new Rede({ nome: '📺 Telão', look: {}, cls: 'guerreiro' }, { telao: true });
  tela(h('h1', { class: 'cel-h' }, 'Abrindo o telão…'));
  try { await r.conectar(novoCodigo(), LOCAL); } catch (e) { r.sair(); tela(h('h1', { class: 'cel-h' }, 'Não deu para abrir'), h('p', {}, e.message || ''), botao('Voltar', () => abertura())); return; }
  rede = r; document.body.classList.add('cel-modo-telao'); navigator.wakeLock?.request('screen').catch(() => {}); // a tela do telão não apaga
  const link = r.link(), feed = h('ul', { class: 'cel-feed' }), corpo = h('tbody'), frutos = h('b', {}, '0'), pessoas = h('b', {}, '0');
  const cv = h('canvas', { class: 'cel-titulo pequeno' });
  tela(h('div', { class: 'cel-telao' },
    h('header', {}, cv, h('div', { class: 'cel-telao-cod' }, h('small', {}, 'ENTRE NA SALA'), h('span', { class: 'cel-codigo grande' }, r.codigo), h('code', {}, link), h('small', {}, 'abra o link (ou ' + location.host + '/celula e digite o código)'))),
    h('div', { class: 'cel-telao-meio' },
      h('section', {}, h('h2', {}, '🏆 Placar · ', pessoas, ' peregrinos · 🍇 ', frutos, ' frutos'),
        h('table', { class: 'cel-tabela' }, h('thead', {}, h('tr', {}, ...['', 'Peregrino', 'Página', 'Chefes', 'Votos certos', 'Frutos', 'Quedas', 'Tempo'].map(t => h('th', {}, t)))), corpo)),
      h('section', {}, h('h2', {}, '📣 Acontecendo'), feed)),
    h('footer', {}, h('span', {}, 'Deixe esta tela aberta: ela segura a sala. As votações aparecem aqui em tela cheia.'), botao('Encerrar a sala', () => { if (confirm('Encerrar a sala para todos?')) { r.sair(); rede = null; document.body.classList.remove('cel-modo-telao'); abertura(); } }, 'btn'))));
  titulo = montarTitulo(cv, { linhas: ['JESUS ME', 'ESCOLHEU'], sub: 'JOÃO 15:16', pilar: false });
  const fmt = s => Math.floor(s / 60) + ':' + String(Math.round(s) % 60).padStart(2, '0');
  const pinta = () => { const l = r.placar(); pessoas.textContent = l.length; frutos.textContent = Object.keys(r.frutos).length;
    corpo.replaceChildren(...l.map((x, i) => h('tr', {}, h('td', {}, i < 3 ? ['🥇', '🥈', '🥉'][i] : (i + 1) + 'º'), h('td', {}, x.nome), h('td', {}, x.fim ? '✦ fim' : Math.min(5, x.pagina) + '/5'), h('td', {}, '⚔ ' + x.chefes), h('td', {}, '✝ ' + x.pts / 100), h('td', {}, '🍇 ' + x.frutos), h('td', {}, '💀 ' + x.quedas), h('td', {}, fmt(x.tempo))))); };
  const conta = txt => { feed.prepend(h('li', {}, txt)); while (feed.children.length > 14) feed.lastChild.remove(); };
  let voto = null;
  r.aoMudar = pinta; r.aoAviso = conta; r.aoFruto = m => { if (m) conta('🍇 ' + m.nome + ' pegou um fruto!'); pinta(); };
  r.aoQuiz = q => { voto?.fechar(); voto = abrirVoto({ q, telao: true, total: r.total }); conta('🗳 ' + q.quem + ' abriu ' + q.titulo); };
  r.aoVotos = vc => voto?.votos(vc);
  r.aoResultado = async m => { const v = voto; if (!v) return; conta(m.certo ? '✦ A célula acertou!' : '✕ A célula errou: monstros!'); await v.revelar(m); v.fechar(); if (voto === v) voto = null; pinta(); };
  pinta(); setInterval(pinta, 2000);
  addEventListener('beforeunload', e => { if (rede === r) { e.preventDefault(); e.returnValue = ''; } });
}

if (import.meta.env.DEV) window.__celula = { get rede() { return rede; } }; // para os testes de navegador
abertura();
