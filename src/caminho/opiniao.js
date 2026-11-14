// "O que você está achando?": nota de 1 a 5 e um comentário, que chegam ao painel de acessos.
import { h } from '../util.js';
import { sfx } from '../audio.js';
import { inserirUso, ONLINE } from '../net.js';
import { visitante, marco } from '../telemetria.js';

export function abrirOpiniao(G) {
  return G.ui.modal((p, close) => {
    p.classList.add('cm-menu', 'opiniao-form'); let nota = 0;
    const estrelas = h('div', { class: 'op-estrelas', role: 'radiogroup', 'aria-label': 'Nota de 1 a 5' });
    const pinta = () => estrelas.querySelectorAll('button').forEach((b, i) => { b.classList.toggle('on', i < nota); b.setAttribute('aria-checked', i + 1 === nota); });
    for (let i = 1; i <= 5; i++) estrelas.append(h('button', { class: 'op-estrela', role: 'radio', 'aria-label': i + (i > 1 ? ' estrelas' : ' estrela'), onclick: () => { nota = i; sfx('click'); pinta(); } }, '★'));
    const texto = h('textarea', { maxlength: 1200, rows: 4, placeholder: 'Do que você mais gostou? O que atrapalhou? Alguma ideia? (opcional)' });
    texto.addEventListener('keydown', e => e.stopPropagation());
    const msg = h('p', { class: 'muted' }, ONLINE ? 'Vai direto para quem faz o jogo.' : 'Sem conexão com o servidor agora: a opinião não pode ser enviada.');
    const enviar = h('button', { class: 'btn gold', onclick: async () => {
      if (!nota) { msg.textContent = 'Escolha de 1 a 5 estrelas.'; return; }
      enviar.disabled = true; msg.textContent = 'Enviando…';
      const c = G.char, ok = await inserirUso('opinioes', { visitante: visitante(), nota, texto: texto.value.trim().slice(0, 1200), contexto: { nome: c.name, cls: c.cls, nivel: c.level, area: G.def?.nome || '', aparelho: matchMedia('(pointer: coarse)').matches ? 'toque' : 'computador' } });
      if (ok) { marco('opiniao'); G.cm.visto.opiniao = 1; G.salvar(); sfx('right'); msg.textContent = 'Obrigado! "A palavra dita a seu tempo, quão boa é!" (Pv 15:23)'; setTimeout(close, 1600); }
      else { enviar.disabled = false; msg.textContent = 'Não foi possível enviar agora. Confira a internet e tente de novo.'; }
    } }, 'Enviar');
    p.append(h('div', { class: 'p-head' }, h('h3', {}, 'O que você está achando?'), h('button', { class: 'x', onclick: () => close(), 'aria-label': 'Fechar' }, '✕')),
      h('p', {}, 'O jogo está em teste. A sua opinião ajuda a decidir o que melhorar primeiro.'), estrelas, texto, msg, h('div', { class: 'btn-row' }, enviar, h('button', { class: 'btn', onclick: () => close() }, 'Agora não')));
  }, { wide: true });
}
// o convite aparece uma vez, depois da primeira página completa
export async function conviteOpiniao(G) {
  if (G.cm.visto.convite || G.cm.visto.opiniao || !ONLINE) return; G.cm.visto.convite = 1; G.salvar();
  await G.ui.dialog({ nome: 'Uma pergunta rápida', texto: 'Você acabou de completar a sua primeira página. Pode dizer em poucas palavras o que está achando do jogo?', acoes: [{ label: 'Dar minha opinião', fn: () => abrirOpiniao(G) }, { label: 'Depois' }], voz: false });
}
