// A tela da votação (estilo Kahoot na pergunta, estilo Among Us na revelação): a pergunta grande, quatro cores com
// formas, o relógio, quantos já votaram; no fim, as barras, quem votou em quê e se a célula acertou.
// Responde ao toque, ao mouse, às teclas 1–4 e ao controle (A, B, X, Y = as quatro respostas, na ordem da tela).
import { h } from '../util.js';
import { sfx } from '../audio.js';

const CORES = [['#E2304A', '▲'], ['#2F6FE0', '◆'], ['#E6A817', '●'], ['#2BA84A', '■']];

export function abrirVoto({ q, telao = false, onVoto, total = 1 }) {
  let votei = -1, fim = false;
  const segs = h('b', { class: 'cv-segs' }, '20'), barra = h('i'), cont = h('span', { class: 'cv-cont' }, '0/' + total + ' votaram');
  const opcoes = q.op.map((txt, i) => h('button', { class: 'cv-op', style: '--c:' + CORES[i % 4][0], 'data-i': i, disabled: telao, onclick: () => escolhe(i) },
    h('span', { class: 'cv-forma' }, CORES[i % 4][1]), h('span', { class: 'cv-txt' }, txt), h('span', { class: 'cv-tecla' }, String(i + 1)), h('div', { class: 'cv-barra' }, h('i')), h('div', { class: 'cv-nomes' })));
  const banner = h('div', { class: 'cv-banner' });
  const caixa = h('div', { class: 'cel-voto' + (telao ? ' telao' : ''), role: 'dialog', 'aria-label': 'Votação da célula' },
    h('div', { class: 'cv-topo' }, h('span', { class: 'cv-tag' }, '🗳 VOTAÇÃO DA CÉLULA'), h('span', { class: 'cv-quem' }, (q.quem || 'Alguém') + ' abriu ' + (q.titulo || 'um rolo')), segs),
    h('div', { class: 'cv-tempo' }, barra),
    h('h2', { class: 'cv-q' }, q.q),
    h('div', { class: 'cv-ops' }, ...opcoes),
    h('div', { class: 'cv-rodape' }, cont, h('span', { class: 'cv-dica' }, telao ? 'Votem no celular! Vale a maioria. Empate é erro.' : 'O jogo está congelado para todos. Vale a maioria: empate é erro. Errar chama monstros para o grupo!')),
    banner);
  document.body.append(caixa); sfx('boss');
  const fimEm = Date.now() + (q.resta ?? 20000), dur = q.resta ?? 20000;
  const relogio = setInterval(() => { const r = Math.max(0, fimEm - Date.now()); segs.textContent = String(Math.ceil(r / 1000)); barra.style.width = (r / dur * 100) + '%'; if (r < 5000 && !fim && Math.ceil(r / 1000) !== relogio.ult) { relogio.ult = Math.ceil(r / 1000); sfx('click'); } caixa.classList.toggle('pressa', r < 5000); }, 100);
  function escolhe(i) { if (telao || fim || votei >= 0 || !(i >= 0 && i < q.op.length)) return; votei = i; sfx('key'); opcoes[i].classList.add('meu'); caixa.classList.add('votou'); onVoto?.(i); }
  const tecla = e => { const n = +e.key; if (n >= 1 && n <= 4) { e.preventDefault(); e.stopPropagation(); escolhe(n - 1); } else if (!fim) { e.stopPropagation(); } };
  addEventListener('keydown', tecla, true);
  let antes = null; // o botão que já estava apertado quando a votação abriu não vale como voto
  const pad = setInterval(() => { const gp = [...(navigator.getGamepads?.() || [])].find(Boolean); if (!gp) return; const agora = [0, 1, 2, 3].map(b => !!gp.buttons[b]?.pressed); if (antes) agora.forEach((v, i) => { if (v && !antes[i]) escolhe(i); }); antes = agora; }, 60);
  return {
    votos(vc) { cont.textContent = vc.votaram + '/' + vc.total + ' votaram'; if (vc.votaram) cont.classList.add('pulsa'); setTimeout(() => cont.classList.remove('pulsa'), 250); },
    // a revelação: barras, nomes (quem votou em quê), a certa marcada, e o veredito da célula
    revelar(m) {
      fim = true; clearInterval(relogio); clearInterval(pad); caixa.classList.add('revela');
      const max = Math.max(1, ...m.n);
      opcoes.forEach((b, i) => { b.disabled = true; b.querySelector('.cv-barra i').style.width = (m.n[i] / max * 100) + '%'; b.querySelector('.cv-nomes').replaceChildren(...(m.votos[i] || []).map(n => h('span', { class: 'cv-nome' }, n)), m.n[i] && !(m.votos[i] || []).length ? h('span', {}, m.n[i] + ' voto(s)') : '');
        b.classList.toggle('certa', i === m.certa); b.classList.toggle('vencedora', i === m.venc); });
      banner.replaceChildren(h('b', {}, m.certo ? 'ACERTAMOS! ✦' : m.empate ? 'EMPATE… CONTA COMO ERRO!' : m.venc < 0 ? 'NINGUÉM VOTOU…' : 'ERRAMOS!'),
        h('small', {}, m.certo ? 'O selo se acende para quem está nesta página. Quem votou certo ganha +100.' : 'Os vícios vêm atrás do grupo inteiro. Leiam de novo e tentem outra vez!'),
        m.porque ? h('p', {}, '📖 ' + m.porque) : '');
      banner.classList.add(m.certo ? 'ok' : 'erro'); sfx(m.certo ? 'level' : 'wrong');
      return new Promise(r => setTimeout(r, telao ? 7000 : 5000));
    },
    fechar() { fim = true; clearInterval(relogio); clearInterval(pad); removeEventListener('keydown', tecla, true); caixa.remove(); }
  };
}
