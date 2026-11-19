// O mapa em camadas laterais: cada região é um panorama de lado (os lugares como silhuetas sobre o chão, o nome
// embaixo, poucos marcadores), e as regiões ficam uma ao lado da outra: ◀ ▶ ou as abas trocam de camada.
// Tocar num lugar mostra o que tem ali. O que ainda não foi visitado fica em névoa.
import { h } from '../util.js';
import { RX } from './dados.js';
import { sfx } from '../audio.js';
import { areaDef, MUNDO } from './dados.js';
import { TODAS } from '../content/index.js';
import { sitioId } from './sitio.js';

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
    else if (o.tipo === 'aguaAberta') out.push({ k: 'poco', t: 'Água funda: nadar e pescar' });
    else if (o.tipo === 'bote') out.push({ k: 'portal', t: 'Bote: remar mar adentro' });
    else if (o.tipo === 'bancoPraia') out.push({ k: 'casa', t: 'Banco da praia: sentar e ver a vista' });
    else if (o.tipo === 'portaoCidade') out.push({ k: 'portal', t: 'Portão do Refúgio' });
  }
  return out;
}
// os lugares de uma área (cada sala da planta é um lugar)
const lugaresDe = (area, filtro = () => true) => {
  const def = areaDef(area); return (def.planta || []).map((c, i) => ({ ...c, cx: c.cx ?? i, cy: c.cy ?? 0, area })).filter(filtro).map(c => ({ area, cx: c.cx, cy: c.cy, nome: c.nome || def.nome, deco: c.deco, coisas: coisas(c) }));
};
// as quatro salas da trilha do treino são um lugar só no mapa: a trilha
const juntaTrilha = L => { const t = L.filter(c => c.cx < RX), r = L.filter(c => c.cx >= RX); return t.length ? [{ ...t[0], nome: 'A trilha do treino', cx: RX - 1, trilha: true, coisas: t.flatMap(c => c.coisas) }, ...r] : r; };
function camadas(G) {
  const v = G.cm.visitou || {}, foi = a => !!v[a] || G.area === a, sid = G.def?.sitio ? G.area : G.area?.startsWith?.('casa:') ? 'sitio:' + G.area.slice(5) : sitioId(G);
  return [
    { id: 'refugio', nome: 'Refúgio', sub: 'A aldeia, a céu aberto', lugares: juntaTrilha(lugaresDe('refugio', c => c.cy === 0 && c.cx < 7 + RX)), ver: true, chao: '#3A4A2E', ceu: ['#1A2744', '#3B4B6B'] },
    { id: 'subsolo', nome: 'Subsolo', sub: 'Os salões de pedra, debaixo da aldeia', lugares: lugaresDe('refugio', c => c.cy === 1), ver: true, chao: '#2A2638', ceu: ['#0E0C16', '#1E1A2C'] },
    { id: 'mata', nome: 'Bosque e mata', sub: 'O caminho de chegada e as trilhas da mata', ver: true, chao: '#24361F', ceu: ['#0A1418', '#1E3A32'],
      lugares: [{ area: 'clareira', nome: 'Clareira das Provas', ver: foi('clareira'), coisas: [{ k: 'portal', t: 'Arena, ondas e o Conselho' }] },
        { area: 'floresta', nome: 'Floresta Escura', ver: foi('floresta'), coisas: [{ k: 'gente', t: 'Só a lâmpada mostra o chão' }] }, { area: 'getsemani', nome: 'Getsêmani', ver: foi('getsemani'), coisas: [{ k: 'casa', t: G.cm.getsemani ? 'O jardim, de manhã' : 'Um jardim de oliveiras' }] }] },
    { id: 'sitio', nome: 'Sítio e praia', sub: 'A sua terra, fora do portão: a casa, a lavoura, o pasto e o mar', ver: true, chao: '#3A4A2A', ceu: ['#1A2E44', '#5A7A9A'],
      lugares: lugaresDe(sid).flatMap(L => /estrada/i.test(L.nome) ? [{ ...L, nome: 'A estrada' }] : /^a casa$/i.test(L.nome) ? [L, { area: 'casa:' + sid.slice(6), nome: 'Dentro de casa', coisas: [{ k: 'casa', t: 'Cama: cochilar ou dormir até de manhã' }, { k: 'casa', t: 'Mesa: a ceia' }, { k: 'vela', t: 'Lareira: +1 fôlego' }] }] : [L]) },
    { id: 'mar', nome: 'Porto e mar', sub: 'Onde o Refúgio encontra o mar', ver: true, chao: '#1F3A4A', ceu: ['#0E1A30', '#2E4A6A'],
      lugares: [...lugaresDe('refugio', c => c.cy === 0 && c.cx >= 7 + RX), { area: 'mar', nome: 'A travessia', ver: foi('sardes'), coisas: [{ k: 'portal', t: 'Três dias de mar até Sardes' }] }] },
    { id: 'sardes', nome: 'Sardes', sub: 'A cidade que perdeu a luz', ver: foi('sardes'), chao: '#26222E', ceu: ['#05060C', '#2A2438'], lugares: lugaresDe('sardes') },
    { id: 'vale', nome: 'Vale da Mentira', sub: 'O que assusta aqui não existe', ver: foi('vale'), chao: '#2A1A30', ceu: ['#0A0618', '#5A2E5E'], lugares: lugaresDe('vale') }
  ];
}
// em que camada e lugar o peregrino está agora
function ondeEstou(G) {
  const cx = Math.floor(G.p.x / 960), cy = Math.floor((G.p.y - 2) / 544);
  if (G.area === 'refugio') return cy === 1 ? { cam: 'subsolo', cx, cy } : cx >= 7 + RX ? { cam: 'mar', cx, cy } : { cam: 'refugio', cx, cy };
  if (G.def?.sitio || G.area?.startsWith?.('casa:')) return { cam: 'sitio', cx, cy, area: G.area };
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
    // o pergaminho: papel de couro com manchas largas, a aguada do céu da região, os montes a bico de pena e a borda queimada
    const W = 720, H = 200, chao = 124, n = Math.max(1, C.lugares.length), passo = W / n;
    pergaminho(g, W, H, C);
    g.fillStyle = TINTA_M; g.fillRect(0, chao, W, 1); for (let x = 3; x < W - 3; x += 5) if (hm(x, 9) > 0.4) g.fillRect(x, chao - 1 - (hm(x, 3) > 0.7 ? 1 : 0), 1, 1); // a linha do chão com capim
    g.fillStyle = 'rgba(58,38,20,.5)'; for (let y = chao + 4; y < chao + 12; y += 3) for (let x = 6 + (y % 2) * 3; x < W - 6; x += 7) g.fillRect(x, y, 3, 1); // hachura do chão
    g.fillStyle = '#8A6A44'; for (let x = passo / 2; x < W - passo / 2; x += 9) g.fillRect(Math.round(x), chao + 16, 4, 2); // o caminho pontilhado que liga os lugares
    caixas = [];
    C.lugares.forEach((L, k) => {
      const x = Math.round(passo * k + passo / 2), ver = C.ver && L.ver !== false, euAqui = aqui && aqui.cam === C.id && (L.area ? L.area === (aqui.area || G.area) && (L.cx == null || (L.cx === aqui.cx && L.cy === aqui.cy)) : false);
      silhueta(g, x, chao, L, ver, C.id);
      // nome
      g.font = '16px "Jersey 15", monospace'; g.textAlign = 'center'; g.fillStyle = ver ? (euAqui ? '#8E2B2B' : TINTA_M) : '#9A8462';
      const nome = ver ? L.nome : '???', max = Math.max(8, Math.floor(passo * 2 / 8)), ny = chao + (n > 6 && k % 2 ? 50 : 36); g.fillText(nome.length > max ? nome.slice(0, max - 1) + '…' : nome, x, ny); // com muitos lugares, os nomes se alternam em duas linhas
      // marcadores: gente, loja, portal (só o que interessa, em uma linha)
      if (ver) { const kinds = ['loja', 'gente', 'portal'].filter(t => L.coisas.some(c => c.k === t)), cor = { loja: '#E8C873', gente: '#9BE0B4', portal: '#7FE0E8' };
        kinds.forEach((t, j) => { const mx = x - (kinds.length - 1) * 7 + j * 14, my = chao + (n > 6 && k % 2 ? 64 : 64); g.fillStyle = TINTA_M; g.fillRect(mx - 5, my - 5, 10, 10); g.fillStyle = cor[t]; g.fillRect(mx - 4, my - 4, 8, 8); g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(mx - 4, my - 4, 8, 2); }); }
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

const TINTA_M = '#3A2614';
const hm = (x, y) => { let n = (x * 374761393 + y * 668265263) | 0; n = (n ^ (n >>> 13)) * 1274126177; return ((n ^ (n >>> 16)) >>> 0) / 4294967295; };
let papel = null;
function pergaminho(g, W, H, C) {
  if (!papel) { papel = document.createElement('canvas'); papel.width = W; papel.height = H; const p = papel.getContext('2d');
    p.fillStyle = '#DCC79C'; p.fillRect(0, 0, W, H);
    for (let i = 0; i < 60; i++) { const x = hm(i, 1) * W, y = hm(i, 2) * H, r = 10 + hm(i, 3) * 40; p.fillStyle = hm(i, 4) > 0.5 ? 'rgba(170,135,80,.10)' : 'rgba(250,236,200,.12)'; p.beginPath(); p.ellipse(x, y, r * 1.6, r, 0, 0, 7); p.fill(); } // manchas largas, como couro curtido
    for (let i = 0; i < 260; i++) { p.fillStyle = 'rgba(120,90,50,.18)'; p.fillRect(Math.floor(hm(i, 7) * W), Math.floor(hm(i, 8) * H), 1 + Math.floor(hm(i, 9) * 3), 1); } // fibras
    for (let d = 0; d < 8; d++) { p.fillStyle = d < 2 ? '#5A3A1E' : d < 4 ? 'rgba(120,80,40,.55)' : 'rgba(150,110,60,' + (0.3 - d * 0.03).toFixed(2) + ')'; p.fillRect(d, d, W - d * 2, 1); p.fillRect(d, H - 1 - d, W - d * 2, 1); p.fillRect(d, d, 1, H - d * 2); p.fillRect(W - 1 - d, d, 1, H - d * 2); } } // a borda queimada
  g.drawImage(papel, 0, 0);
  const ce = g.createLinearGradient(0, 0, 0, 124); ce.addColorStop(0, C.ceu[1]); ce.addColorStop(1, 'rgba(0,0,0,0)'); g.globalAlpha = 0.16; g.fillStyle = ce; g.fillRect(8, 8, W - 16, 116); g.globalAlpha = 1; // a aguada do céu
  g.fillStyle = 'rgba(58,38,20,.55)'; let yAnt = 0;
  for (let x = 10; x < W - 10; x++) { const y = 124 - 34 - Math.round(Math.sin(x * 0.013) * 16 + Math.sin(x * 0.037 + 1) * 7); g.fillRect(x, y, 1, 1); if (yAnt && Math.abs(y - yAnt) > 1) g.fillRect(x, Math.min(y, yAnt), 1, Math.abs(y - yAnt)); yAnt = y; if (x % 4 === 0) for (let k = 3; k < 12; k += 4) g.fillRect(x + (k % 3), y + k, 1, 2); } // os montes a bico de pena, com hachura
}

// silhuetas por tipo de lugar (pelo nome ou pelo cenário da sala), em pixel
function silhueta(g, x, chao, L, ver, cam) {
  const n = (L.nome || '').toLowerCase(), tinta = TINTA_M, luz = '#E8B040', pedra = '#A89A80', mad = '#7A5634', folha = '#6E8A4A';
  const ret = (a, b, w, hh, c) => { g.fillStyle = c; g.fillRect(Math.round(a), Math.round(b), Math.round(w), Math.round(hh)); };
  const casa = (cx, w, hh) => { ret(cx - w / 2 - 2, chao - hh - 2, w + 4, hh + 2, tinta); ret(cx - w / 2, chao - hh, w, hh, '#C9A878'); ret(cx + w / 2 - 4, chao - hh, 4, hh, '#A88A5E'); ret(cx - 4, chao - 14, 8, 14, tinta); ret(cx + w / 4 - 3, chao - hh + 8, 6, 6, luz); };
  const arvore = (cx, hh) => { ret(cx - 2, chao - hh / 2, 4, hh / 2, mad); ret(cx - hh / 3 - 1, chao - hh - 1, hh * 2 / 3 + 2, hh / 2 + 2, tinta); ret(cx - hh / 3, chao - hh, hh * 2 / 3, hh / 2, folha); ret(cx - hh / 3, chao - hh, hh * 2 / 3, 2, '#8EAA62'); };
  const arco = (cx, w, hh) => { ret(cx - w / 2 - 3, chao - hh - 3, w + 6, hh + 3, tinta); ret(cx - w / 2, chao - hh, w, hh, pedra); ret(cx - w / 4, chao - hh * 0.65, w / 2, hh * 0.65, '#4A3420'); };
  if (!ver) { g.fillStyle = 'rgba(58,38,20,.28)'; for (let yy = chao - 56; yy < chao; yy += 3) for (let xx = x - 30 + (yy % 2) * 2; xx < x + 30; xx += 5) g.fillRect(xx, yy, 3, 1); g.fillStyle = '#7A6040'; g.font = '30px "Jersey 15", monospace'; g.textAlign = 'center'; g.fillText('?', x, chao - 18); return; }
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
  if (/bosque|floresta|mata|clareira|trilha/.test(n)) { arvore(x - 24, 70); arvore(x + 20, 58); if (/trilha/.test(n)) { ret(x - 4, chao - 22, 2, 22, mad); ret(x - 12, chao - 24, 18, 7, tinta); ret(x - 11, chao - 23, 16, 5, '#C9A878'); } if (/clareira/.test(n)) ret(x - 10, chao - 30, 20, 30, pedra); return; }
  if (/templo/.test(n)) { ret(x - 40, chao - 70, 80, 70, tinta); ret(x - 38, chao - 68, 76, 68, pedra); ret(x - 10, chao - 40, 20, 40, '#05060B'); ret(x - 44, chao - 78, 88, 8, pedra); return; }
  if (cam === 'vale') { g.fillStyle = pedra; g.beginPath(); g.moveTo(x - 44, chao); g.lineTo(x - 20, chao - 70); g.lineTo(x, chao - 40); g.lineTo(x + 24, chao - 84); g.lineTo(x + 44, chao); g.fill(); if (/covil|dragão/.test(n)) ret(x + 10, chao - 50, 10, 6, '#E2463C'); return; }
  const onda = (a, w) => { for (let k = 0; k < w; k += 12) { ret(a + k, chao - 3 - ((k / 12) % 2) * 2, 8, 2, '#7FD4E4'); ret(a + k + 2, chao - 1, 6, 1, '#2E6B80'); } };
  if (cam === 'sitio' || cam === 'mar') {
    if (/margem|mar aberto|alto-mar|mar adentro|^o mar$/.test(n)) { ret(x - 44, chao - 6, 88, 6, '#1C4A5E'); onda(x - 44, 88); if (/alto|adentro/.test(n)) { ret(x - 2, chao - 40, 2, 32, mad); ret(x, chao - 38, 14, 18, '#E8E2CF'); ret(x - 14, chao - 10, 30, 5, mad); } else ret(x - 10, chao - 14, 22, 6, mad); return; }
    if (/praia/.test(n)) { ret(x - 44, chao - 6, 88, 6, '#C9B07A'); onda(x - 44, 30); ret(x + 6, chao - 14, 24, 3, mad); ret(x + 8, chao - 11, 2, 5, mad); ret(x + 26, chao - 11, 2, 5, mad); ret(x - 18, chao - 12, 22, 6, mad); return; } // a areia, o banco e o bote
    if (/pasto/.test(n)) { for (let k = -40; k <= 40; k += 16) ret(x + k, chao - 16, 3, 16, mad); ret(x - 40, chao - 12, 83, 2, mad); ret(x - 12, chao - 22, 16, 10, '#E8E2CF'); ret(x + 2, chao - 26, 6, 6, '#E8E2CF'); ret(x + 14, chao - 18, 12, 8, '#E8E2CF'); return; }
    if (/lavoura/.test(n)) { for (let k = -36; k <= 36; k += 12) { ret(x + k - 1, chao - 4, 8, 4, '#5A3A22'); ret(x + k, chao - 14 - (k % 24 ? 0 : 4), 6, 10, folha); } return; }
    if (/estrada/.test(n)) { ret(x - 44, chao - 3, 88, 3, '#8A6A4A'); ret(x + 10, chao - 60, 30, 60, tinta); ret(x + 12, chao - 58, 26, 58, pedra); ret(x + 18, chao - 34, 14, 34, '#05060B'); for (let k = 0; k < 3; k++) ret(x + 12 + k * 10, chao - 64, 6, 6, pedra); arvore(x - 26, 50); return; } // o portão do Refúgio
    if (/casa/.test(n)) { casa(x, 56, 48); ret(x + 14, chao - 62, 8, 14, tinta); ret(x + 16, chao - 60, 4, 12, '#8A6A4A'); if (/dentro/.test(n)) ret(x - 20, chao - 12, 12, 8, '#FF9A3C'); return; }
  }
  casa(x - 18, 40, 44); casa(x + 22, 34, 34); // ruas de Sardes e o que mais vier
}
function estrela(g, x, y) { const P = ['..X..', '.XXX.', 'XXXXX', '.XXX.', 'X...X']; g.fillStyle = '#05060B'; g.fillRect(x - 8, y - 2, 16, 14); g.fillStyle = '#FFD23F'; P.forEach((l, r) => [...l].forEach((c, k) => { if (c === 'X') g.fillRect(x - 5 + k * 2, y + r * 2, 2, 2); })); }
function pino(g, x, y) { g.fillStyle = '#05060B'; g.fillRect(x - 7, y - 1, 14, 16); g.fillStyle = '#FFFFFF'; g.fillRect(x - 6, y, 12, 10); g.fillStyle = '#E8C873'; g.fillRect(x - 4, y + 2, 8, 6); g.fillStyle = '#FFFFFF'; g.fillRect(x - 2, y + 10, 4, 4); }
