// A vitrine: a mesma janela para todas as lojas do caminho. Em cima, o vendedor (retrato numa moldura, o nome na fita
// e a fala num pergaminho) e a bolsa; embaixo, as cartas dos itens em bolsos de couro e, ao lado, a ficha do escolhido
// num rolo: o ícone grande, o nome, a raridade e a referência, a descrição, o preço e o botão.
// itens: { chave, icone (Node), nome, sub, desc, preco, cor, estado: 'comprar'|'seu'|'usando'|'trancado'|'gratis', acao: { rot, fn, perigo }, extra }
import { h } from '../util.js';
import { sfx } from '../audio.js';
import { quadroPessoa } from './pixel/humano.js';
import { iconeItem } from './pixel/icones.js';

function retrato(look) {
  const cv = h('canvas', { width: 96, height: 88, class: 'vt-retrato' }); if (!look) return cv;
  const g = cv.getContext('2d'); g.imageSmoothingEnabled = false; let t0 = performance.now();
  const anima = () => { if (!cv.isConnected && performance.now() - t0 > 600) return; g.clearRect(0, 0, 96, 88); const s = quadroPessoa(look, (performance.now() - t0) / 1000, 'vitrine-' + (look.tunic || '') + (look.hair || '')); if (s) g.drawImage(s.tela(), 0, 0, s.w, s.h, -24, -12, s.w * 3, s.h * 3); /* meio corpo, de perto */ requestAnimationFrame(anima); };
  requestAnimationFrame(anima); return cv;
}
const moeda = n => h('span', { class: 'vt-preco' }, iconeItem('denarios', 16), String(n));

export function vitrine(G, o) {
  const c = G.char;
  return G.ui.modal((p, close) => {
    p.classList.add('cm-menu', 'vitrine');
    const bolsa = h('div', { class: 'vt-bolsa' }), grade = h('div', { class: 'vt-grade' }), ficha = h('div', { class: 'vt-ficha' });
    let sel = null, confirmar = null;
    const mostra = it => {
      if (!it) { ficha.replaceChildren(h('p', { class: 'vt-vazio' }, o.dica || 'Toque num item para ver o que ele faz.')); return; }
      const pode = it.preco == null || c.data.gold >= it.preco;
      const big = it.icone.cloneNode ? (() => { const x = it.icone.cloneNode(true); if (x.getContext && it.icone.getContext) x.getContext('2d').drawImage(it.icone, 0, 0); return x; })() : it.icone;
      big.classList?.add('vt-big');
      const botao = confirmar === it.chave && it.confirma ? it.confirma : it.acao && it.estado !== 'trancado' ? h('button', { class: 'btn ' + (it.acao.perigo ? 'danger' : 'gold'), disabled: it.acao.desliga || (it.estado === 'comprar' && !pode), onclick: () => { sfx('click'); if (it.confirma) { confirmar = it.chave; mostra(it); return; } it.acao.fn(); desenha(); } }, it.acao.rot) : null;
      if (it.oculto) { ficha.replaceChildren(h('p', { class: 'vt-vazio' }, it.trava || 'Ainda não descoberto.')); return; }
      ficha.replaceChildren(h('div', { class: 'vt-topo' }, h('div', { class: 'vt-icone-g' }, big), h('div', {}, h('h4', {}, it.nome), it.sub ? h('small', {}, it.cor ? h('i', { class: 'vt-rar', style: 'background:' + it.cor }) : '', it.sub) : '')),
        h('p', { class: 'vt-desc' }, it.desc || ''), it.extra || '',
        h('div', { class: 'vt-acao' }, it.preco != null && it.estado === 'comprar' ? h('span', { class: 'vt-custa' + (pode ? '' : ' falta') }, 'Custa ', moeda(it.preco), pode ? '' : ' · faltam ' + Math.ceil(it.preco - c.data.gold)) : it.estado === 'seu' ? h('span', { class: 'vt-custa' }, 'Já é seu') : it.estado === 'usando' ? h('span', { class: 'vt-custa' }, 'Em uso') : it.estado === 'trancado' ? h('span', { class: 'vt-custa falta' }, it.trava || 'Ainda não') : '', botao || ''));
    };
    const desenha = () => {
      bolsa.replaceChildren(iconeItem('denarios', 22), h('b', {}, String(Math.floor(c.data.gold))), h('small', {}, o.bolsa ? o.bolsa() : 'denários'));
      const secs = o.secoes(); grade.replaceChildren(); let achou = null;
      for (const s of secs) {
        if (!s.itens.length) continue;
        grade.append(h('h4', { class: 'vt-sec' }, s.titulo));
        const linha = h('div', { class: 'vt-linha' });
        for (const it of s.itens) {
          if (sel === it.chave) achou = it;
          const b = h('button', { class: 'vt-carta vt-' + (it.estado || 'comprar') + (sel === it.chave ? ' sel' : '') + (it.preco != null && it.estado === 'comprar' && c.data.gold < it.preco ? ' caro' : ''), style: it.cor ? '--rar:' + it.cor : '', onclick: () => { sfx('click'); sel = it.chave; confirmar = null; desenha(); }, ondblclick: () => { if (it.acao && !it.confirma && it.estado !== 'trancado' && (it.preco == null || c.data.gold >= it.preco)) { it.acao.fn(); desenha(); } } },
            h('span', { class: 'vt-ico' }, it.oculto ? h('span', { class: 'vt-tranca' }, '?') : it.icone),
            h('span', { class: 'vt-nome' }, it.oculto ? '???' : it.nome),
            it.estado === 'comprar' && it.preco != null ? moeda(it.preco) : h('span', { class: 'vt-selo' }, it.selo ? it.selo : it.estado === 'usando' ? 'em uso' : it.estado === 'seu' ? 'seu' : it.estado === 'gratis' ? 'de graça' : it.estado === 'trancado' ? 'trancado' : ''));
          linha.append(b);
        }
        grade.append(linha);
      }
      mostra(achou);
    };
    p.append(h('div', { class: 'p-head' }, h('h3', {}, o.titulo), h('button', { class: 'x', onclick: () => { o.aoFechar?.(); close(); }, 'aria-label': 'Fechar' }, '✕')),
      h('div', { class: 'vt-balcao' }, h('div', { class: 'vt-moldura' }, o.look ? retrato(o.look) : o.icone ? (o.icone.classList?.add('vt-big'), o.icone) : retrato(null)), h('div', { class: 'vt-fala' }, h('b', { class: 'vt-dono' }, o.dono || o.titulo), h('p', {}, o.fala || '')), bolsa),
      o.aviso ? h('p', { class: 'vt-aviso' }, o.aviso) : '',
      h('div', { class: 'vt-corpo' }, grade, ficha));
    desenha();
    o.api && (o.api.desenha = desenha, o.api.fechar = close);
  }, { wide: true });
}
