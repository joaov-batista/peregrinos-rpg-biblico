// Telas fora do jogo: entrar/criar conta, escolher personagem e criar personagem.
import { $, h, fmt } from '../util.js';
import { net, ONLINE } from '../net.js';
import { sfx, initAudio } from '../audio.js';
import { CLASSES } from '../data/classes.js';
import { drawPerson } from '../game/draw.js';
import { mountCreator } from './creator.js';
import { icon } from './icons.js';
import { SEMANA_ATUAL } from '../content/index.js';
import { pwa } from '../pwa.js';
import { ligarCeu, desligarCeu } from './ceu.js';
import { quadroPessoa } from '../caminho/pixel/humano.js';

const scr = () => $('screens');
function screen(...kids) {
  const s = scr(); s.classList.remove('creating'); s.innerHTML = ''; s.hidden = false; ligarCeu();
  s.append(h('div', { class: 'screen' }, ...kids));
}
// floreio sob o título: um losango no centro e volutas para os dois lados
const FLOREIO = '<svg viewBox="0 0 320 34" width="320" height="34" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"><path d="M160 6l7 11-7 11-7-11z"/><path d="M150 17H96c-14 0-20-9-12-14 7-4 13 4 6 8"/><path d="M170 17h54c14 0 20-9 12-14-7-4-13 4-6 8"/><path d="M96 17c-10 0-18 6-30 6S44 17 30 17H6"/><path d="M224 17c10 0 18 6 30 6s22-6 36-6h24"/><path d="M118 17c-4 6-12 9-20 7M202 17c4 6 12 9 20 7"/></g><circle cx="160" cy="17" r="1.8" fill="currentColor"/></svg>';
const logo = () => {
  const remake = document.documentElement.classList.contains('remake'), el = h('div', { class: 'logo' }, h('span', { class: 'cross' }, '✝'), h('h1', {}, 'PEREGRINOS'));
  if (remake) { const f = h('div', { class: 'floreio' }); f.innerHTML = FLOREIO; el.append(f); }
  el.append(h('p', {}, remake ? 'O Caminho' : 'RPG bíblico online'));
  return el;
};

export function showAuth(onDone) {
  let mode = 'entrar';
  const msg = h('p', { class: 'form-msg', role: 'status' });
  const email = h('input', { type: 'email', placeholder: 'seu@email.com', autocomplete: 'email', 'aria-label': 'E-mail' });
  const pass = h('input', { type: 'password', placeholder: 'senha (mín. 6)', autocomplete: 'current-password', 'aria-label': 'Senha' });
  const go = h('button', { class: 'btn gold wide', type: 'submit' }, 'Entrar');
  const tabs = h('div', { class: 'tabs' });
  const setMode = m => {
    mode = m; go.textContent = m === 'entrar' ? 'Entrar' : 'Criar conta';
    pass.autocomplete = m === 'entrar' ? 'current-password' : 'new-password';
    tabs.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.m === m)); msg.textContent = '';
  };
  tabs.append(h('button', { class: 'tab on', type: 'button', 'data-m': 'entrar', onclick: () => setMode('entrar') }, 'Entrar'), h('button', { class: 'tab', type: 'button', 'data-m': 'criar', onclick: () => setMode('criar') }, 'Criar conta'));
  const form = h('form', { class: 'card auth', onsubmit: async e => {
    e.preventDefault(); initAudio(); msg.className = 'form-msg'; msg.textContent = 'Aguarde…'; go.disabled = true;
    try {
      if (mode === 'entrar') { await net.signIn(email.value.trim(), pass.value); onDone(); }
      else {
        const r = await net.signUp(email.value.trim(), pass.value);
        if (r.needsConfirm) { msg.className = 'form-msg ok'; msg.textContent = 'Conta criada! Confirme pelo link enviado ao seu e-mail e depois entre.'; setMode('entrar'); }
        else onDone();
      }
    } catch (err) { msg.className = 'form-msg err'; msg.textContent = err.message; }
    go.disabled = false;
  } });
  if (ONLINE) form.append(tabs, h('label', {}, 'E-mail', email), h('label', {}, 'Senha', pass), go, msg,
    h('div', { class: 'ou-sep', 'aria-hidden': 'true' }, h('span', {}, 'ou')),
    h('button', { class: 'porta-btn sem-conta', type: 'button', onclick: () => { net.user = null; dispatchEvent(new Event('peregrinos-sync')); initAudio(); onDone(); } }, 'Jogar sem conta'),
    h('p', { class: 'sem-conta-nota' }, 'Salva só neste aparelho, sem ranking mundial.'));
  else form.append(h('p', { class: 'muted' }, 'Sua jornada fica salva neste navegador. Crie seu peregrino e descubra a Cidade de Refúgio.'),
    h('button', { class: 'btn gold wide', type: 'button', onclick: () => { initAudio(); onDone(); } }, 'Começar a jornada'));
  const emQuadro = new URLSearchParams(location.search).has('quadro');
  const nQuadro = +new URLSearchParams(location.search).get('quadro');
  const quem = emQuadro ? h('p', { class: 'title' }, 'Jogador ' + (nQuadro + 1) + (ONLINE ? ': entre com a sua conta' : '')) : '';
  const juntos = ''; // o multiplayer (sala por código e tela dividida) fica no saguão, depois do login
  setTimeout(() => scr().querySelector('.screen')?.classList.add('abertura'), 0);
  // aberto por dentro do Instagram, Facebook ou TikTok: lá não dá para instalar, e o salvamento some com facilidade
  const embutido = /Instagram|FBAN|FBAV|FB_IAB|TikTok|musical_ly|Line\//i.test(navigator.userAgent);
  const aviso = embutido && !emQuadro ? h('div', { class: 'porta-aviso', role: 'note' }, h('b', {}, 'Você abriu o jogo por dentro de outro aplicativo.'), h('span', {}, 'Para instalar e não perder o progresso, toque em ⋯ (em cima, à direita) e escolha "Abrir no navegador".')) : '';
  screen(logo(), quem, h('p', { class: 'week' }, 'Um RPG bíblico. Leve a luz com você.'), aviso, form, juntos, emQuadro ? '' : baixarJogo());
}

// Botão "Instalar app" (aparece só quando dá para instalar)
function installButton(msg) {
  const b = h('button', { class: 'btn install', type: 'button', onclick: () => pwa.install(t => { msg.className = 'form-msg ok'; msg.textContent = t; }) }, matchMedia('(pointer: coarse)').matches ? 'Instalar no celular' : 'Baixar para o PC');
  const sync = () => { b.hidden = pwa.installed; }; // sempre à vista: se o navegador não oferecer a instalação, o botão explica como fazer
  sync(); const off = pwa.onChange(() => b.isConnected ? sync() : off());
  return b;
}

// Primeira tela: "Baixar o jogo" com um botão para cada aparelho. Computador e Android usam a instalação do navegador
// (quando ele oferece); senão, e sempre no iPhone, aparece o passo a passo logo abaixo.
const PASSOS = {
  pc: ['Abra o jogo no Chrome ou no Edge.', 'Clique no ícone de instalar (⊕) no fim da barra de endereço, ou no menu ⋮ → "Instalar Peregrinos".', 'Confirme em "Instalar". O jogo ganha um atalho na área de trabalho e abre em janela própria.'],
  android: ['Abra o jogo no Chrome.', 'Toque no menu ⋮ (canto de cima).', 'Escolha "Instalar app" ou "Adicionar à tela inicial" e confirme.', 'Abra pelo ícone do Peregrinos na tela inicial.'],
  iphone: ['Abra o jogo no Safari.', 'Toque em Compartilhar (□↑), na barra de baixo.', 'Role e toque em "Adicionar à Tela de Início".', 'Toque em "Adicionar" e abra pelo ícone do Peregrinos.']
};
function baixarJogo() {
  const android = /android/i.test(navigator.userAgent), celular = pwa.ios || android;
  const ajuda = h('div', { class: 'baixar-ajuda', role: 'status', hidden: true });
  let aberto = '';
  const mostrar = (qual, titulo) => {
    if (aberto === qual && !ajuda.hidden) { ajuda.hidden = true; aberto = ''; return; }
    aberto = qual; ajuda.hidden = false; ajuda.innerHTML = '';
    ajuda.append(h('b', {}, titulo), h('ol', {}, ...PASSOS[qual].map(p => h('li', {}, p))));
  };
  const instalar = async (qual, titulo, aqui) => {
    sfx('click');
    if (aqui && pwa.canPrompt) { ajuda.hidden = true; await pwa.install(t => { ajuda.hidden = false; ajuda.innerHTML = ''; ajuda.append(h('b', {}, t)); }); return; }
    mostrar(qual, titulo);
  };
  const b = (qual, rotulo, titulo, aqui) => h('button', { class: 'porta-btn', type: 'button', 'data-plat': qual, onclick: () => instalar(qual, titulo, aqui) }, rotulo);
  const bloco = h('div', { class: 'tela-div baixar porta-painel' }, h('span', {}, 'Baixar o jogo'),
    h('div', { class: 'baixar-btns' },
      b('pc', 'Computador', 'Instalar no computador', !celular),
      b('android', 'Android', 'Instalar no Android', android),
      b('iphone', 'iPhone', 'Instalar no iPhone', false)),
    ajuda);
  if (pwa.ios) mostrar('iphone', 'Instalar no iPhone'); // no iPhone a instalação é sempre manual: o passo a passo já vem aberto
  const sync = () => { bloco.hidden = pwa.installed; };
  sync(); const off = pwa.onChange(() => bloco.isConnected ? sync() : off());
  return bloco;
}

function miniPortrait(look, cls, size = 80) {
  const c = h('canvas', { width: size * 2, height: size * 2, class: 'portrait' });
  const g = c.getContext('2d');
  if (document.documentElement.classList.contains('remake')) { const q = quadroPessoa({ ...look, cls: null }, 0, 'sel' + JSON.stringify(look || {}).length), k = size * 2 / 24; g.imageSmoothingEnabled = false; g.drawImage(q.tela(), 12, 5, 24, 24, 0, 0, 24 * k, 24 * k); return c; }
  g.scale(2, 2);
  drawPerson(g, size / 2, size * 1.9, size / 28, look, { t: 0, fx: 0.2, fy: 1, semLuz: true }); // busto: cabeça e ombros
  return c;
}

export async function showSelect(onPlay, onNew, onLogout) {
  screen(logo(), h('p', { class: 'muted' }, 'Carregando personagens…'));
  let chars = [];
  try { chars = await net.listChars(); } catch (e) { screen(logo(), h('p', { class: 'form-msg err' }, 'Erro: ' + e.message), h('button', { class: 'btn', onclick: onLogout }, 'Voltar')); return; }
  // quem ainda não tem peregrino: cria um agora. O painel de sala fica à vista, para quem veio jogar com amigos entrar já com o personagem novo
  // primeira vez: um botão só. Jogar com amigos fica recolhido (quem veio por um código de sala já o encontra aberto)
  if (!chars.length) { const comSala = /sala=/.test(location.search); return screen(logo(), h('h2', { class: 'title' }, 'Bem-vindo, peregrino'),
    h('button', { class: 'btn gold criar-primeiro', type: 'button', onclick: () => { sfx('click'); onNew(); } }, 'Criar meu peregrino'),
    h('details', { class: 'saguao-recolhido', open: comSala }, h('summary', {}, 'Jogar com amigos'), saguaoJuntos(true)),
    h('div', { class: 'btn-row' }, h('button', { class: 'btn link', onclick: onLogout }, ONLINE && net.user ? 'Sair da conta' : 'Voltar'))); }
  const list = h('div', { class: 'char-list' });
  for (const c of chars) {
    const conflict = net.conflict(c.id);
    const conflictBox = h('div', { class: 'sync-conflict' });
    if (conflict) {
      const remote = conflict.remote;
      const msg = h('p', { role: 'status' }, `Neste aparelho: nível ${c.level}, ${fmt(c.score)} pontos. ` +
        (remote ? `Na nuvem: nível ${remote.level}, ${fmt(remote.score)} pontos${remote.score > c.score ? ' (a mais avançada)' : remote.score < c.score ? '' : ''}. Fica valendo uma das duas inteira; itens e moedas não são somados.` : 'Este personagem foi apagado na nuvem. Exporte sua cópia antes de descartá-la.'));
      const choose = async choice => {
        try { await net.resolveConflict(c.id, choice); await showSelect(onPlay, onNew, onLogout); }
        catch (e) { msg.textContent = e.message; }
      };
      conflictBox.append(h('b', {}, 'Dois progressos diferentes'), msg,
        h('button', { class: 'btn sm', onclick: () => net.exportChar(c.id) }, 'Exportar cópia'),
        remote ? h('button', { class: 'btn sm', onclick: () => choose('local') }, 'Manter deste aparelho') : '',
        h('button', { class: 'btn sm', onclick: () => choose('cloud') }, remote ? 'Usar progresso da nuvem' : 'Confirmar exclusão da nuvem'));
    }
    list.append(h('div', { class: 'card char-card' },
      miniPortrait(c.look, c.cls),
      h('div', { class: 'info' }, h('b', {}, c.name), h('small', {}, icon(CLASSES[c.cls].arma, 15), ' ' + CLASSES[c.cls].nome + ' · nível ' + c.level), h('small', {}, '⭐ ' + fmt(c.score) + ' pontos')),
      h('div', { class: 'col' },
        h('button', { class: 'btn gold', onclick: () => { sfx('click'); onPlay(c); } }, 'Jogar'),
        h('button', { class: 'btn sm danger', onclick: async e => {
          const b = e.currentTarget;
          if (b.dataset.sure) { try { await net.deleteChar(c.id); showSelect(onPlay, onNew, onLogout); } catch (err) { b.textContent = err.message; delete b.dataset.sure; } }
          else { b.dataset.sure = '1'; b.textContent = 'Tem certeza?'; setTimeout(() => { if (b.isConnected) { delete b.dataset.sure; b.textContent = 'Apagar'; } }, 3000); }
        } }, 'Apagar'))));
    if (conflict) list.append(conflictBox);
  }
  screen(logo(), h('h2', { class: 'title' }, 'Escolha seu peregrino'), list, saguaoJuntos(),
    installButton(h('p', {})),
    h('div', { class: 'btn-row' }, chars.length < 3 ? h('button', { class: 'btn', onclick: onNew }, '+ Novo personagem') : '', h('button', { class: 'btn link', onclick: onLogout }, ONLINE && net.user ? 'Sair da conta' : 'Voltar')));
}

// O saguão do "Caminhar juntos": antes de entrar no jogo dá para escolher abrir uma sala (você é o anfitrião e passa o código)
// ou entrar na sala de alguém. A escolha fica guardada até o jogo começar (jogo.js lê 'peregrinos.sala').
// O multiplayer local (tela dividida) fica recolhido embaixo.
function saguaoJuntos(novo) {
  if (new URLSearchParams(location.search).has('quadro')) return '';
  const CH = 'peregrinos.sala', le = () => { try { return sessionStorage.getItem(CH) || ''; } catch { return ''; } }, poe = v => { try { v ? sessionStorage.setItem(CH, v) : sessionStorage.removeItem(CH); } catch {} };
  const limpa = v => (v || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5);
  const daUrl = limpa(new URLSearchParams(location.search).get('sala')); if (daUrl.length === 5 && !le()) poe('entrar:' + daUrl);
  const nota = h('p', { class: 'saguao-nota', role: 'status' });
  const campo = h('input', { class: 'saguao-codigo', maxlength: 5, placeholder: 'CÓDIGO', autocapitalize: 'characters', autocomplete: 'off', spellcheck: 'false', 'aria-label': 'Código da sala' });
  const bSo = h('button', { class: 'porta-btn', type: 'button', onclick: () => { sfx('click'); poe(''); pinta(); } }, 'Sozinho');
  const bCriar = h('button', { class: 'porta-btn', type: 'button', onclick: () => { sfx('click'); poe('abrir'); pinta(); } }, 'Criar sala');
  const bEntrar = h('button', { class: 'porta-btn', type: 'button', onclick: () => { const c = limpa(campo.value); if (c.length < 5) { nota.textContent = 'O código tem cinco letras ou números.'; campo.focus(); return; } sfx('click'); poe('entrar:' + c); pinta(); } }, 'Entrar na sala');
  campo.addEventListener('input', () => { campo.value = limpa(campo.value); }); campo.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') bEntrar.click(); });
  function pinta() {
    const v = le(), cod = v.startsWith('entrar:') ? v.slice(7) : '';
    bSo.classList.toggle('on', !v); bCriar.classList.toggle('on', v === 'abrir'); bEntrar.classList.toggle('on', !!cod); if (cod) campo.value = cod;
    const como = novo ? 'Crie o seu peregrino' : 'Toque em Jogar num peregrino seu (ou crie um novo)';
    nota.textContent = v === 'abrir' ? 'Você será o anfitrião. ' + como + ': a sala abre e o código aparece para você mandar aos amigos (até 4).'
      : cod ? como + ': você entra direto na sala ' + cod + '.' : 'Cada um no seu aparelho, até 4 peregrinos. Um cria a sala e manda o código; os outros entram com ele.';
  }
  pinta();
  const local = h('details', { class: 'saguao-local' }, h('summary', {}, 'Multiplayer local (mesmo aparelho, tela dividida)'),
    h('div', { class: 'porta-linha' }, ...[2, 3, 4].map(n => h('button', { class: 'porta-btn', type: 'button', 'aria-label': n + ' jogadores', onclick: () => { location.href = location.pathname + '?telas=' + n; } }, h('b', {}, String(n)), ' jogadores'))),
    h('p', { class: 'saguao-nota' }, 'Um controle por jogador. Melhor em computador ou TV.'));
  return h('div', { class: 'tela-div porta-painel saguao' }, h('span', {}, 'Caminhar juntos'), h('div', { class: 'porta-linha' }, bSo, bCriar), h('div', { class: 'porta-linha' }, campo, bEntrar), nota, local);
}

export function showCreator(onCreated, onBack) {
  mountCreator(scr(), onCreated, onBack);
}

export function hideScreens() { scr().hidden = true; scr().innerHTML = ''; desligarCeu(); }
