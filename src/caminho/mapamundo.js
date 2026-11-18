// O mapa em camadas laterais: cada região é um panorama de lado (os lugares como silhuetas sobre o chão, o nome
// embaixo, poucos marcadores), e as regiões ficam uma ao lado da outra: ◀ ▶ ou as abas trocam de camada.
// Tocar num lugar mostra o que tem ali. O que ainda não foi visitado fica em névoa.
import { h } from '../util.js';
import { sfx } from '../audio.js';
import { areaDef, MUNDO } from './dados.js';
import { TODAS } from '../content/index.js';

const LOJAS = { lidia: 'loja', ferreiro: 'forja', armeiro: 'armas', dorcas: 'roupas', noe: 'animais', mateus: 'banco', mercador: 'loja', zebedeu: 'pesca', viajante: 'loja', barqueiro: 'barco', escriba: 'rolos' };
// o que cada lugar tem, tirado dos próprios objetos da sala
function coisas(cel) {
  const out = [];
  for (const o of cel.objs || []) {
    if (o.tipo === 'npc' && !o.bicho) out.push({ k: LOJAS[o.id] ? 'loja' : 'gente', t: o.nome });
    else if (o.tipo === 'morador' && o.nome) out.push({ k: 'gente', t: o.nome });
    else if (o.tipo === 'portal' && o.semana) { const s = TODAS.find(x => x.id === o.semana); out.push({ k: 'portal', t: 'Página: ' + (s?.estudo || o.semana) }); }
    else if (o.tipo === 'portal' && o.mundo) out.push({ k: 'portal', t: MUNDO[o.mundo]?.nome || o.mundo });
    else if (o.tipo === 'portal' && !o.oculto) out.push({ k: 'portal', t: o.rotulo || 'Passagem' });
    else if (o.tipo === 'casa') out.push({ k: 'casa', t: o.nome });
    else if (o.tipo === 'ebenezer') out.push({ k: 'pedra', t: 'Pedra de Ebenézer (descanso)' });
    else if (o.tipo === 'poco') out.push({ k: 'poco', t: 'Poço (azeite cheio)' });
    else if (o.tipo === 'barco') out.push({ k: 'portal', t: o.volta ? 'Barco de volta ao Refúgio' : 'Barco para Sardes' });
    else if (o.tipo === 'vela') out.push({ k: 'vela', t: 'Vela' });
  }
  return out;
}
// os lugares de uma área (cada sala da planta é um lugar)
const lugaresDe = (area, filtro = () => true) => {
  const def = areaDef(area); return (def.planta || []).map((c, i) => ({ ...c, cx: c.cx ?? i, cy: c.cy ?? 0, area })).filter(filtro).map(c => ({ area, cx: c.cx, cy: c.cy, nome: c.nome || def.nome, deco: c.deco, coisas: coisas(c) }));
};
function camadas(G) {
  const v = G.cm.visitou || {}, foi = a => !!v[a] || G.area === a;
  return [
    { id: 'refugio', nome: 'Refúgio', sub: 'A aldeia, a céu aberto', lugares: lugaresDe('refugio', c => c.cy === 0 && c.cx < 7), ver: true, chao: '#3A4A2E', ceu: ['#1A2744', '#3B4B6B'] },
    { id: 'subsolo', nome: 'Subsolo', sub: 'Os salões de pedra, debaixo da aldeia', lugares: lugaresDe('refugio', c => c.cy === 1), ver: true, chao: '#2A2638', ceu: ['#0E0C16', '#1E1A2C'] },
    { id: 'mata', nome: 'Bosque e mata', sub: 'O caminho de chegada e as trilhas da mata', ver: true, chao: '#24361F', ceu: ['#0A1418', '#1E3A32'],
      lugares: [{ area: 'bosque', nome: 'Bosque do Treino', ver: true, coisas: [{ k: 'gente', t: 'A trilha dos primeiros passos' }] }, { area: 'clareira', nome: 'Clareira das Provas', ver: foi('clareira'), coisas: [{ k: 'portal', t: 'Arena, ondas e o Conselho' }] },
        { area: 'floresta', nome: 'Floresta Escura', ver: foi('floresta'), coisas: [{ k: 'gente', t: 'Só a lâmpada mostra o chão' }] }, { area: 'getsemani', nome: 'Getsêmani', ver: foi('getsemani'), coisas: [{ k: 'casa', t: G.cm.getsemani ? 'O jardim, de manhã' : 'Um jardim de oliveiras' }] }] },
    { id: 'mar', nome: 'Porto e mar', sub: 'Onde o Refúgio encontra o mar', ver: true, chao: '#1F3A4A', ceu: ['#0E1A30', '#2E4A6A'],
      lugares: [...lugaresDe('refugio', c => c.cy === 0 && c.cx === 7), { area: 'mar', nome: 'A travessia', ver: foi('sardes'), coisas: [{ k: 'portal', t: 'Três dias de mar até Sardes' }] }] },
    { id: 'sardes', nome: 'Sardes', sub: 'A cidade que perdeu a luz', ver: foi('sardes'), chao: '#26222E', ceu: ['#05060C', '#2A2438'], lugares: lugaresDe('sardes') },
    { id: 'vale', nome: 'Vale da Mentira', sub: 'O que assusta aqui não existe', ver: foi('vale'), chao: '#2A1A30', ceu: ['#0A0618', '#5A2E5E'], lugares: lugaresDe('vale') }
  ];
}
// em que camada e lugar o peregrino está agora
function ondeEstou(G) {
  const cx = Math.floor(G.p.x / 960), cy = Math.floor((G.p.y - 2) / 544);
  if (G.area === 'refugio') return cy === 1 ? { cam: 'subsolo', cx, cy } : cx === 7 ? { cam: 'mar', cx, cy } : { cam: 'refugio', cx, cy };
  const m = { bosque: 'mata', clareira: 'mata', floresta: 'mata', getsemani: 'mata', sardes: 'sardes', vale: 'vale' }[G.area];
  return m ? { cam: m, cx, cy, area: G.area } : null;
}
export const temMapaMundo = G => !!ondeEstou(G);

export function mapaCamadas(G) {
  const CS = camadas(G), aqui = ondeEstou(G), missao = G.objetivo?.();
  let i = Math.max(0, CS.findIndex(c => c.id === aqui?.cam)), sel = null;
  const abas = h('div', { class: 'mm-abas', role: 'tablist' }), cv = h('canvas', { class: 'mm-cv', width: 720, height: 200 }), info = h('div', { class: 'mm-info' }), titulo = h('div', { class: 'mm-titulo' });
  const g = cv.getContext('2d'); g.imageSmoothingEnabled = false;
  let caixas = [];
  const desenha = () => {
    const C = CS[i]; sel = null;
    abas.replaceChildren(...CS.map((c, k) => h('button', { class: 'mm-aba' + (k === i ? ' on' : '') + (c.ver ? '' : ' nevoa'), role: 'tab', 'aria-selected': k === i, onclick: () => { i = k; sfx('click'); desenha(); } }, c.ver ? c.nome : '???')));
    titulo.replaceChildren(h('b', {}, C.ver ? C.nome : 'Ainda não descoberto'), h('span', {}, C.ver ? C.sub : 'Continue a jornada para chegar aqui.'));
    // fundo: céu, montanhas ao longe, chão
    const W = 720, H = 200, chao = 128, n = Math.max(1, C.lugares.length), passo = W / n;
    const ce = g.createLinearGradient(0, 0, 0, chao); ce.addColorStop(0, C.ceu[0]); ce.addColorStop(1, C.ceu[1]); g.fillStyle = ce; g.fillRect(0, 0, W, H);
    g.fillStyle = 'rgba(0,0,0,.25)'; for (let x = 0; x < W; x += 6) { const y = chao - 40 - Math.round(Math.sin(x * 0.013) * 18 + Math.sin(x * 0.037) * 8); g.fillRect(x, y, 6, chao - y); }
    g.fillStyle = C.chao; g.fillRect(0, chao, W, H - chao); g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(0, chao, W, 2);
    // a trilha que liga os lugares
    g.fillStyle = '#C9B88A'; for (let x = passo / 2; x < W - passo / 2; x += 10) g.fillRect(Math.round(x), chao + 14, 5, 2);
    caixas = [];
    C.lugares.forEach((L, k) => {
      const x = Math.round(passo * k + passo / 2), ver = C.ver && L.ver !== false, euAqui = aqui && aqui.cam === C.id && (L.area ? L.area === (aqui.area || G.area) && (L.cx == null || (L.cx === aqui.cx && L.cy === aqui.cy)) : false);
      silhueta(g, x, chao, L, ver, C.id);
      // nome
      g.font = '16px "Jersey 15", monospace'; g.textAlign = 'center'; g.fillStyle = ver ? (euAqui ? '#FFE9A8' : '#E6E0CF') : '#5A6078';
      const nome = ver ? L.nome : '???'; g.fillText(nome.length > 18 ? nome.slice(0, 17) + '…' : nome, x, chao + 40);
      // marcadores: gente, loja, portal (só o que interessa, em uma linha)
      if (ver) { const kinds = ['loja', 'gente', 'portal'].filter(t => L.coisas.some(c => c.k === t)), cor = { loja: '#E8C873', gente: '#9BE0B4', portal: '#7FE0E8' };
        kinds.forEach((t, j) => { const mx = x - (kinds.length - 1) * 8 + j * 16, my = chao + 56; g.fillStyle = '#05060B'; g.fillRect(mx - 5, my - 5, 10, 10); g.fillStyle = cor[t]; g.fillRect(mx - 4, my - 4, 8, 8); }); }
      // a missão (estrela) e "você está aqui"
      const temMissao = ver && missao && missao.portal && L.area === G.area && C.id === aqui?.cam && Math.floor(missao.portal.x / 960) === L.cx && Math.floor((missao.portal.y - 2) / 544) === L.cy;
      if (temMissao) estrela(g, x + 26, chao - 92);
      if (euAqui) pino(g, x, chao - 96);
      caixas.push({ x0: x - passo / 2, x1: x + passo / 2, L, ver });
    });
    info.replaceChildren(h('p', { class: 'mm-dica' }, C.ver ? 'Toque num lugar para ver o que tem lá.' : ''));
  };
  cv.addEventListener('click', e => {
    const r = cv.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * 720, c = caixas.find(b => x >= b.x0 && x < b.x1); if (!c) return;
    sfx('click'); if (!c.ver) { info.replaceChildren(h('p', { class: 'mm-dica' }, 'Ainda não descoberto.')); return; }
    const icone = { loja: '◆', gente: '●', portal: '▲', casa: '■', pedra: '✚', poco: '◉', vela: '✦' };
    info.replaceChildren(h('b', {}, c.L.nome), h('ul', {}, ...(c.L.coisas.length ? c.L.coisas.slice(0, 8).map(o => h('li', { class: 'mm-' + o.k }, (icone[o.k] || '·') + ' ' + o.t)) : [h('li', {}, 'Um lugar tranquilo.')])));
  });
  const ir = d => { i = (i + d + CS.length) % CS.length; sfx('click'); desenha(); };
  const nav = h('div', { class: 'mm-nav' }, h('button', { class: 'btn sm', onclick: () => ir(-1), 'aria-label': 'Camada anterior' }, '◀'), titulo, h('button', { class: 'btn sm', onclick: () => ir(1), 'aria-label': 'Próxima camada' }, '▶'));
  const legenda = h('div', { class: 'mm-legenda' }, h('span', { class: 'l-loja' }, 'loja'), h('span', { class: 'l-gente' }, 'gente'), h('span', { class: 'l-portal' }, 'passagem'), h('span', { class: 'l-missao' }, 'missão'), h('span', { class: 'l-voce' }, 'você'));
  const raiz = h('div', { class: 'mm', tabindex: 0, onkeydown: e => { if (e.key === 'ArrowLeft') { ir(-1); e.preventDefault(); } if (e.key === 'ArrowRight') { ir(1); e.preventDefault(); } } }, abas, nav, h('div', { class: 'mm-quadro' }, cv), info, legenda);
  desenha(); return raiz;
}

// silhuetas por tipo de lugar (pelo nome ou pelo cenário da sala), em pixel
function silhueta(g, x, chao, L, ver, cam) {
  const n = (L.nome || '').toLowerCase(), tinta = ver ? '#0B0E16' : '#1A1E2C', luz = ver ? '#E8C873' : '#2A3044', pedra = ver ? '#3B4766' : '#232838', mad = ver ? '#6B4A2E' : '#262A38', folha = ver ? '#3F6A3A' : '#232838';
  const ret = (a, b, w, hh, c) => { g.fillStyle = c; g.fillRect(Math.round(a), Math.round(b), Math.round(w), Math.round(hh)); };
  const casa = (cx, w, hh) => { ret(cx - w / 2 - 2, chao - hh - 2, w + 4, hh + 2, tinta); ret(cx - w / 2, chao - hh, w, hh, ver ? '#8A6A4A' : '#2A3044'); ret(cx - 4, chao - 14, 8, 14, tinta); ret(cx + w / 4 - 3, chao - hh + 8, 6, 6, luz); };
  const arvore = (cx, hh) => { ret(cx - 2, chao - hh / 2, 4, hh / 2, mad); ret(cx - hh / 3, chao - hh, hh * 2 / 3, hh / 2, folha); };
  const arco = (cx, w, hh) => { ret(cx - w / 2 - 3, chao - hh - 3, w + 6, hh + 3, tinta); ret(cx - w / 2, chao - hh, w, hh, pedra); ret(cx - w / 4, chao - hh * 0.65, w / 2, hh * 0.65, '#05060B'); };
  if (!ver) { ret(x - 34, chao - 60, 68, 60, '#151926'); g.fillStyle = '#2A3044'; g.font = '30px "Jersey 15", monospace'; g.textAlign = 'center'; g.fillText('?', x, chao - 20); return; }
  if (cam === 'subsolo' || L.deco) { arco(x, 70, 84); ret(x - 40, chao - 92, 80, 8, pedra);
    const d = L.deco; if (d === 'biblioteca') { for (let k = 0; k < 3; k++) ret(x - 14, chao - 50 + k * 10, 28, 3, '#E8D9B0'); }
    else if (d === 'tesouro') { ret(x - 10, chao - 30, 20, 16, '#C9A63C'); ret(x - 2, chao - 26, 4, 6, tinta); }
    else if (d === 'cripta') { ret(x - 8, chao - 40, 16, 12, '#E4DFCF'); ret(x - 5, chao - 36, 3, 3, tinta); ret(x + 2, chao - 36, 3, 3, tinta); }
    else if (d === 'cisterna') { ret(x - 16, chao - 12, 32, 6, '#2E6B80'); ret(x - 16, chao - 12, 32, 1, '#7FD4E4'); }
    else if (d === 'subfases') { ret(x - 7, chao - 34, 14, 14, '#B8322A'); ret(x - 2, chao - 30, 4, 6, tinta); }
    return; }
  if (/praça do poço|poço/.test(n)) { casa(x - 26, 36, 40); ret(x + 10, chao - 18, 24, 18, pedra); ret(x + 10, chao - 30, 2, 12, mad); ret(x + 32, chao - 30, 2, 12, mad); ret(x + 8, chao - 32, 28, 3, mad); return; }
  if (/mercado/.test(n)) { ret(x - 36, chao - 50, 72, 6, '#8E2E5E'); ret(x - 34, chao - 44, 2, 44, mad); ret(x + 32, chao - 44, 2, 44, mad); ret(x - 30, chao - 18, 60, 18, mad); arvore(x + 46, 50); return; }
  if (/armas/.test(n)) { casa(x, 60, 44); ret(x - 40, chao - 40, 3, 40, '#9FB0C0'); ret(x + 37, chao - 40, 3, 40, '#9FB0C0'); return; }
  if (/sinagoga/.test(n)) { /* o salão de telhado em duas águas e a torre do sino */
    ret(x - 36, chao - 40, 72, 40, tinta); ret(x - 34, chao - 38, 68, 38, '#8A7A62'); g.fillStyle = tinta; g.beginPath(); g.moveTo(x - 40, chao - 38); g.lineTo(x - 4, chao - 56); g.lineTo(x + 32, chao - 38); g.fill(); g.fillStyle = '#7A4A36'; g.beginPath(); g.moveTo(x - 36, chao - 39); g.lineTo(x - 4, chao - 53); g.lineTo(x + 28, chao - 39); g.fill();
    for (const wx of [-26, -14, 6, 18]) ret(x + wx, chao - 30, 6, 12, luz); ret(x - 6, chao - 14, 8, 14, tinta);
    ret(x + 24, chao - 70, 14, 70, tinta); ret(x + 26, chao - 68, 10, 68, '#8A7A62'); ret(x + 28, chao - 62, 6, 8, '#C9A63C'); return; }
  if (/bairro/.test(n)) { casa(x - 24, 40, 46); casa(x + 22, 40, 36); return; }
  if (/pátio|provas/.test(n)) { ret(x - 30, chao - 34, 4, 34, mad); ret(x - 36, chao - 30, 16, 4, mad); ret(x + 20, chao - 34, 4, 34, mad); ret(x + 14, chao - 30, 16, 4, mad); ret(x - 6, chao - 10, 12, 10, pedra); return; }
  if (/olival|oliveira|jardim|getsêmani/.test(n)) { arvore(x - 26, 54); arvore(x + 4, 66); arvore(x + 32, 48); return; }
  if (/porto/.test(n)) { ret(x - 40, chao - 6, 80, 6, mad); for (let k = -36; k <= 36; k += 18) ret(x + k, chao - 6, 3, 14, mad); ret(x + 10, chao - 60, 3, 54, mad); ret(x + 13, chao - 56, 22, 30, '#E8E2CF'); ret(x - 6, chao - 18, 40, 12, mad); return; }
  if (/travessia/.test(n)) { for (let k = 0; k < 4; k++) ret(x - 40 + k * 22, chao - 4 - (k % 2) * 3, 16, 2, '#7FD4E4'); ret(x - 16, chao - 20, 32, 10, mad); ret(x - 1, chao - 52, 3, 32, mad); ret(x + 2, chao - 50, 16, 22, '#E8E2CF'); return; }
  if (/bosque|floresta|mata|clareira/.test(n)) { arvore(x - 24, 70); arvore(x + 20, 58); if (/clareira/.test(n)) ret(x - 10, chao - 30, 20, 30, pedra); return; }
  if (/templo/.test(n)) { ret(x - 40, chao - 70, 80, 70, tinta); ret(x - 38, chao - 68, 76, 68, pedra); ret(x - 10, chao - 40, 20, 40, '#05060B'); ret(x - 44, chao - 78, 88, 8, pedra); return; }
  if (cam === 'vale') { g.fillStyle = pedra; g.beginPath(); g.moveTo(x - 44, chao); g.lineTo(x - 20, chao - 70); g.lineTo(x, chao - 40); g.lineTo(x + 24, chao - 84); g.lineTo(x + 44, chao); g.fill(); if (/covil|dragão/.test(n)) ret(x + 10, chao - 50, 10, 6, '#E2463C'); return; }
  casa(x - 18, 40, 44); casa(x + 22, 34, 34); // ruas de Sardes e o que mais vier
}
function estrela(g, x, y) { const P = ['..X..', '.XXX.', 'XXXXX', '.XXX.', 'X...X']; g.fillStyle = '#05060B'; g.fillRect(x - 8, y - 2, 16, 14); g.fillStyle = '#FFD23F'; P.forEach((l, r) => [...l].forEach((c, k) => { if (c === 'X') g.fillRect(x - 5 + k * 2, y + r * 2, 2, 2); })); }
function pino(g, x, y) { g.fillStyle = '#05060B'; g.fillRect(x - 7, y - 1, 14, 16); g.fillStyle = '#FFFFFF'; g.fillRect(x - 6, y, 12, 10); g.fillStyle = '#E8C873'; g.fillRect(x - 4, y + 2, 8, 6); g.fillStyle = '#FFFFFF'; g.fillRect(x - 2, y + 10, 4, 4); }
