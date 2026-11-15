// Depois do Conselho Zelote: os zelotes passam a vender o que é deles e entregam uma investigação.
// "Tem gente definhando na aldeia." Três sinais para achar, uma dedução para fazer e, no fundo da cisterna,
// o que estava consumindo as pessoas: a Raiz de Amargura (Hb 12:15). Ficção do Refúgio; os versículos são os do texto.
import { h } from '../util.js';
import { sfx } from '../audio.js';
import { RELIQUIAS, ARMAS_ALT } from './dados.js';
import { DOS_ZELOTES, valorTroca, rarDe, especiaisDe, ESPECIAIS } from './arsenal.js';
import { T, CW, CH } from './nivel.js';

export const inv = G => (G.cm.inv = G.cm.inv || { est: 0, pistas: {} }); // est: 0 = não começou · 1 = investigando · 2 = a fenda está aberta · 3 = a raiz foi arrancada
const PISTAS = {
  porta: { sala: 3, cy: 0, col: 6, nome: 'A porta arranhada', texto: 'A porta da estalagem tem riscos fundos, do lado de DENTRO. Ninguém tentou entrar: alguém tentou sair, e desistiu.\n\nNo batente, uma coisa escura e fina como cabelo, grudada na madeira. Tem cheiro de fel.\n\nNão é fome. Quem tem fome sai de casa.' },
  oliveira: { sala: 5, cy: 0, col: 22, nome: 'A oliveira seca', texto: 'A última oliveira do olival secou de um lado só. No pé dela, a terra foi revirada de baixo para cima.\n\nUma raiz preta, que não é de oliveira, sobe pelo tronco e some para dentro do chão, na direção da aldeia.\n\nNão é doença de árvore. Isto veio de baixo.' },
  agua: { sala: 4, cy: 1, col: 15, nome: 'A água amarga', texto: 'A água da cisterna está amarga. Você prova na ponta do dedo e cospe.\n\n"Não puderam beber as águas de Mara, porque eram amargas" (Êx 15:23).\n\nDo fundo sobem fios escuros, como os da porta e os da oliveira. Todos vêm do mesmo lugar: daqui de baixo.' }
};
const nPistas = G => Object.keys(inv(G).pistas).length;

// o que a investigação põe no Refúgio: os sinais, e depois a fenda no fundo da cisterna
export function missaoNoRefugio(G) {
  if (G.area !== 'refugio') return; const s = inv(G); G.objs = G.objs.filter(o => !o.daMissao);
  const em = (d, o) => G.objs.push({ daMissao: true, x: (d.sala * CW + d.col) * T + 16, y: (d.cy * CH + 16) * T, ...o });
  if (s.est === 1) for (const [id, d] of Object.entries(PISTAS)) if (!s.pistas[id]) em(d, { tipo: 'pista', id, nome: d.nome, luz: 60 });
  if (s.est >= 2) em({ sala: 4, cy: 1, col: 19 }, { tipo: 'portal', area: 'raiz', rotulo: 'A fenda da raiz', luz: 80 });
}
export function rotuloMissao(ob) { return ob.tipo === 'pista' ? 'Examinar' : ob.tipo === 'portal' && ob.area === 'raiz' ? 'Descer' : undefined; }
export async function usarMissao(G, ob) {
  const s = inv(G);
  if (ob.tipo === 'pista') { const d = PISTAS[ob.id]; s.pistas[ob.id] = 1; ob.fora = true; G.objs = G.objs.filter(o => o !== ob); sfx('key'); G.efeito('coleta', ob.x, ob.y - 20); G.salvar();
    await G.ui.dialog({ nome: d.nome + ' · sinal ' + nPistas(G) + ' de 3', texto: d.texto, acoes: [{ label: 'Anotar' }], cls: 'fala-narra', voz: false });
    G.ui.toast(nPistas(G) >= 3 ? 'Três sinais. Volte a um zelote e diga o que você acha que é.' : 'Investigação: ' + nPistas(G) + ' de 3 sinais. ' + (s.pistas.porta ? '' : 'Olhe o Bairro. ') + (s.pistas.oliveira ? '' : 'Olhe o fim do olival. ') + (s.pistas.agua ? '' : 'Olhe a cisterna.'), 7000); return true; }
  if (ob.tipo === 'portal' && ob.area === 'raiz') { await G.ui.dialog({ nome: ob.rotulo, texto: s.est >= 3 ? 'A fenda está seca. A raiz foi arrancada, mas o buraco ficou: para lembrar.' : 'No fundo da cisterna, uma fenda na pedra, da largura de um homem. Os fios pretos saem todos dali.\n\nLá embaixo alguma coisa respira devagar, como quem rumina há muitos anos.\n\n"Nenhuma raiz de amargura, brotando, vos perturbe, e por meio dela muitos sejam contaminados" (Hb 12:15).', acoes: [{ label: 'Descer', fn: () => G.entrar('raiz') }, { label: 'Agora não' }], cls: 'fala-narra', voz: false }); return true; }
  return false;
}

// a conversa com um zelote depois do conselho: a loja, a missão, ou só o que ele tem a dizer
export async function zeloteDepois(G, ob, fala) {
  const s = inv(G), cm = G.cm, diz = (t, acoes) => G.ui.dialog({ nome: ob.nome, look: ob.look, texto: t, acoes });
  const missao = async () => {
    if (s.est === 0) { await diz('Você venceu os três. Então escute, porque isto a gente não conta a qualquer um.\n\nTem gente definhando na aldeia. Não é fome, não é peste. Param de sair de casa. Param de falar. Ficam olhando para trás, para uma coisa que alguém fez a eles há vinte anos.', [{ label: 'E vocês sabem o que é?' }]);
      await diz('Sabemos o cheiro. É o mesmo que comeu a gente por dentro. Mas uma coisa é ter, outra é achar onde ela mora.\n\nAche três sinais. Dizem que há um no BAIRRO, um no fim do OLIVAL e um na CISTERNA, debaixo do pátio. Depois volte e me diga o nome da coisa.', [{ label: 'Eu investigo' }]);
      s.est = 1; G.salvar(); missaoNoRefugio(G); sfx('key'); return G.ui.toast('Investigação: ache três sinais (Bairro, fim do Olival, Cisterna).', 7000); }
    if (s.est === 1 && nPistas(G) < 3) return diz('Sinais: ' + nPistas(G) + ' de 3. Bairro, fim do olival, cisterna. Olhe para o que está fora do lugar.', [{ label: 'Vou olhar' }]);
    if (s.est === 1) { const certo = 'A amargura' === await diz('Três sinais: uma porta arranhada por dentro, uma raiz preta que veio de baixo, e a água amarga.\n\nEntão diga, estrangeiro. O que está consumindo a aldeia?', [{ label: 'A fome' }, { label: 'A amargura' }, { label: 'O medo' }]);
      if (!certo) return diz('Não. Quem tem fome sai de casa, e quem tem medo tranca a porta por dentro e não a arranha.\n\nPense no gosto da água. Pense no que cresce escondido e contamina muitos (Hb 12:15).', [{ label: 'Vou pensar' }]);
      s.est = 2; G.salvar(); missaoNoRefugio(G); sfx('level');
      return diz('A amargura. É. Uma RAIZ dela.\n\nNós três a regamos por anos sem saber que era a mesma planta. Ela mora no fundo da cisterna: a fenda está aberta para quem sabe o que procura.\n\nNós não podemos ir, estrangeiro. Ela nos conhece pelo nome. Vá você.', [{ label: 'Eu vou' }]); }
    if (s.est === 2) return diz('A fenda fica no fundo da cisterna, debaixo do Pátio das provas. Leve azeite. E não escute o que ela disser: ela só sabe repetir o que já doeu.', [{ label: 'Certo' }]);
    return diz('Arrancada. Eu senti daqui, como quem tira um espinho velho.\n\nA água da cisterna voltou a ser doce. Moisés jogou um lenho na água amarga e ela ficou doce (Êx 15:25). Eu nunca tinha entendido essa história.', [{ label: 'Paz' }]);
  };
  await diz(fala, [{ label: 'O que vocês vendem?', fn: () => lojaZelote(G) }, { label: s.est === 0 ? 'Tem trabalho para mim?' : s.est >= 3 ? 'E a raiz?' : 'A investigação', fn: missao }, { label: 'Seguir caminho' }]);
}

// a loja dos zelotes: a arma do conselho (uma por vocação), três relíquias e maná
export function lojaZelote(G) {
  const c = G.char, cm = G.cm, tipo = G.tipoArma, A = ARMAS_ALT[tipo]?.zelote; cm.armas = cm.armas || {}; cm.armaAlt = cm.armaAlt || {};
  return G.ui.modal((p, close) => {
    p.classList.add('cm-menu'); const lista = h('div', {});
    const linha = (titulo, sub, preco, tem, fn) => h('button', { class: 'fase-row cm-rel' + (tem ? ' on' : ''), disabled: tem || c.data.gold < preco, onclick: () => { if (tem || c.data.gold < preco) return; c.data.gold -= preco; sfx('coin'); fn(); G.salvar(); desenha(); } }, h('span', { class: 'cm-ico' }, tem ? '✓' : '◆'), h('div', {}, h('b', {}, titulo + (tem ? ' (seu)' : ' — ' + preco + ' denários')), h('small', {}, sub)));
    const desenha = () => {
      lista.replaceChildren(h('p', { class: 'muted' }, 'Você tem ' + Math.floor(c.data.gold) + ' denários. O que é do conselho só se vende a quem venceu o conselho.'));
      if (A) { const naMao = cm.armaAlt[c.cls] === 'zelote', volta = valorTroca(ARMAS_ALT[tipo][cm.armaAlt[c.cls]]), preco = Math.max(0, A.zelote - volta);
        lista.append(linha(rarDe(A).marca + ' ' + A.nome, A.desc + ' · ' + especiaisDe(A).map(k => ESPECIAIS[k].nome).join(' + ') + (volta && !naMao ? ' · a sua arma atual entra na troca (−' + volta + ')' : ''), preco, naMao, () => { cm.armas[c.cls + ':zelote'] = 2; cm.armaAlt[c.cls] = 'zelote'; G.equiparArma(); G.ui.toast('Agora é sua: ' + A.nome + '.', 4000); })); }
      for (const id of DOS_ZELOTES) { const R = RELIQUIAS[id]; lista.append(linha(rarDe(R).marca + ' ' + R.nome, R.desc + ' · ' + R.ref, R.zelote, cm.reliquias.includes(id), () => G.ganhar(id))); }
      lista.append(linha('Pão da resistência', 'Uma porção de maná (a cada três, um fôlego a mais).', 260, (cm.manaZelote || 0) >= 2, () => { cm.mana = (cm.mana || 0) + 1; cm.manaZelote = (cm.manaZelote || 0) + 1; G.p.vidaMax = G.vidaMax(); }));
    };
    p.append(h('div', { class: 'p-head' }, h('h3', {}, 'As coisas do conselho'), h('button', { class: 'x', onclick: () => close(), 'aria-label': 'Fechar' }, '✕')), h('p', { class: 'fala-balcao' }, 'Não é caridade, estrangeiro. É respeito. Escolha.'), lista);
    desenha();
  }, { wide: true });
}

// a raiz foi arrancada
export async function venceuRaiz(G) {
  const s = inv(G), primeira = s.est < 3; s.est = 3; G.xp(700); G.pontos(3500); G.char.data.gold += primeira ? 500 : 120; G.salvar();
  await G.ui.dialog({ nome: 'A raiz se solta', texto: 'A coisa não grita quando cai. Só murcha, devagar, como uma planta que alguém finalmente parou de regar.\n\nNo lugar onde ela estava cravada, a pedra chora água limpa.\n\n"Longe de vós toda amargura, cólera, ira… Sede uns para com os outros benignos, perdoando-vos uns aos outros, como também Deus, em Cristo, vos perdoou" (Ef 4:31-32).', acoes: [{ label: 'Amém' }], cls: 'fala-narra', voz: false });
  if (primeira) await G.ganhar('lenho_mara');
}
