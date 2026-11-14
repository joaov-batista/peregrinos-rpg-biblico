// Painel de acessos do Peregrinos: quem está online, quem joga, contas, anônimos, até onde cada um chegou e o que
// as pessoas acham. Lê tudo por uma função do Supabase que só responde a administradores (supabase/painel.sql).
import './painel.css';
import { painelApi } from '../net.js';

const app = document.getElementById('app');
// construtor de elementos: texto entra sempre como texto (nunca como HTML), inclusive o que os jogadores escrevem
function h(tag, attrs = {}, ...filhos) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) { if (v == null || v === false) continue; if (k.startsWith('on')) e.addEventListener(k.slice(2), v); else if (k === 'class') e.className = v; else if (k === 'style') e.style.cssText = v; else e.setAttribute(k, v === true ? '' : v); }
  for (const f of filhos.flat()) if (f != null && f !== false) e.append(f instanceof Node ? f : String(f));
  return e;
}
const svg = (tag, attrs = {}) => { const e = document.createElementNS('http://www.w3.org/2000/svg', tag); for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v); return e; };

// ---- formatação ----
const num = n => Number(n || 0).toLocaleString('pt-BR');
const duracao = s => { s = Math.round(s || 0); if (s < 60) return s ? s + ' s' : '—'; const m = Math.round(s / 60); if (m < 60) return m + ' min'; const hh = Math.floor(m / 60), mm = m % 60; return hh + ' h' + (mm ? ' ' + mm + ' min' : ''); };
const quando = iso => { if (!iso) return '—'; const d = new Date(iso), s = (Date.now() - d) / 1000; if (s < 90) return 'agora'; if (s < 3600) return 'há ' + Math.round(s / 60) + ' min'; if (s < 86400) return 'há ' + Math.round(s / 3600) + ' h'; if (s < 172800) return 'ontem'; return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }); };
const dataHora = iso => iso ? new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—';
const CLASSES = { guerreiro: 'Guerreiro', pastor: 'Pastor', profeta: 'Profeta', levita: 'Levita', zelote: 'Zelote', valente: 'Valente', juiz: 'Juiz' };
const MARCOS = { personagem: 'Criou um personagem', tutorial: 'Terminou o tutorial', mapa: 'Pegou o mapa do Velho', getsemani: 'Encontrou Jesus no Getsêmani', vale: 'Entrou no Vale da Mentira', espirito: 'Conquistou a descida do Espírito', sardes: 'Chegou a Sardes', sardes_luz: 'Restaurou a luz de Sardes', opiniao: 'Deu a opinião' };
const nomeMarco = m => MARCOS[m] || (m.startsWith('fase:') ? 'Fase ' + m.slice(5).replace('semana-0', 'S').replace(':', '·') : m.startsWith('chefe:') ? 'Venceu ' + m.slice(6) : m);
const ordemMarco = m => { const base = ['personagem', 'tutorial', 'mapa']; if (base.includes(m)) return base.indexOf(m); if (m.startsWith('fase:')) return 10 + Number(m.replace(/\D/g, '')) / 1000; if (m.startsWith('chefe:')) return 20; return { getsemani: 30, vale: 31, espirito: 32, sardes: 33, sardes_luz: 34, opiniao: 40 }[m] ?? 50; };

// ---- dica flutuante (hover) ----
const dica = h('div', { class: 'dica', role: 'tooltip' }); document.body.append(dica);
function comDica(el, texto) { el.addEventListener('pointerenter', () => { dica.textContent = texto; dica.classList.add('on'); }); el.addEventListener('pointermove', e => { dica.style.left = Math.min(innerWidth - dica.offsetWidth - 8, e.clientX + 14) + 'px'; dica.style.top = (e.clientY - dica.offsetHeight - 10) + 'px'; }); el.addEventListener('pointerleave', () => dica.classList.remove('on')); return el; }

let dias = 14, timer = null, ultimo = null, filtro = 'todos', busca = '';

/* ================= entrada ================= */
// /painel?demo mostra o painel com dados inventados, para ver como fica antes de ligar o servidor
const DEMO = new URLSearchParams(location.search).has('demo');
function dadosDemo() {
  const agora = Date.now(), dia = 86400000, nomes = ['Ana', 'Davi', 'Rute', 'Elias', 'Miriã', 'Tito', 'Lia', 'Josué', 'Ester', 'Caleb', 'Noemi', 'Samuel'], cls = Object.keys(CLASSES), areas = ['Refúgio', 'Corinto · Fase 2', 'O Vale da Mentira', 'Sardes', 'Getsêmani', 'Jope'];
  const jog = nomes.map((n, i) => ({ visitante: (i * 7919).toString(16).padStart(8, 'a'), email: i % 3 === 0 ? n.toLowerCase() + '@exemplo.com' : null, primeiro: new Date(agora - (i + 1) * dia * 0.9).toISOString(), ultimo: new Date(agora - i * i * 60000).toISOString(), online: i < 3, seg: 600 + i * 1700,
    jogo: { jogando: i !== 2, nome: n, cls: cls[i % cls.length], nivel: 1 + (i % 9), area: areas[i % areas.length], fases: i % 6, chefes: i % 4 }, aparelho: { disp: i % 2 ? 'celular' : 'computador', so: i % 2 ? 'Android' : 'Windows', nav: 'Chrome' },
    marcos: ['personagem', 'tutorial', 'mapa', 'fase:semana-01:1', i % 2 ? 'getsemani' : null, i % 3 ? null : 'sardes'].filter(Boolean) }));
  return { online: 3, jogando: 2, hoje: 9, semana: 31, total: 47, jogaram: 33, anonimos: 22, contas: 11, contas_semana: 4, personagens: 15, tempo_medio: 2460, tempo_total: 81200, nota_media: 4.6,
    aparelhos: { celular: 29, computador: 15, tablet: 3 }, origens: { direto: 21, 'instagram.com': 14, 'whatsapp.com': 8, 'youtube.com': 4 },
    funil: { personagem: 33, tutorial: 27, mapa: 24, 'fase:semana-01:1': 19, 'fase:semana-01:2': 13, 'chefe:mamom': 9, getsemani: 6, vale: 4, sardes: 3, opiniao: 7 },
    por_dia: Array.from({ length: dias }, (_, i) => ({ dia: new Date(agora - (dias - 1 - i) * dia).toISOString().slice(0, 10), visitas: Math.round(3 + i * 0.6 + (i % 3) * 2), jogaram: Math.round(2 + i * 0.4 + (i % 2)) })),
    jogadores: jog, contas_lista: jog.filter(j => j.email).map(j => ({ email: j.email, criada: j.primeiro, ultimo_login: j.ultimo, personagens: [{ nome: j.jogo.nome, classe: j.jogo.cls, nivel: j.jogo.nivel }] })),
    opinioes: [{ nota: 5, texto: 'O encontro no Getsêmani me fez chorar. Lindo demais.', criado: new Date(agora - 3600000).toISOString(), visitante: 'a1b2c3d4', contexto: { nome: 'Rute', area: 'Getsêmani', nivel: 6 } }, { nota: 4, texto: 'Muito bom, mas o chefe da segunda fase é difícil no celular.', criado: new Date(agora - 2 * dia).toISOString(), email: 'davi@exemplo.com', contexto: { nome: 'Davi', area: 'Corinto', nivel: 3 } }] };
}
async function iniciar() {
  if (DEMO) { app.replaceChildren(); montar({ email: 'demonstração' }); return; }
  if (!painelApi.disponivel) return telaAviso('O servidor ainda não está ligado', 'Este painel precisa do Supabase configurado (VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY) e do arquivo supabase/painel.sql executado no projeto. Veja docs/PAINEL.md.');
  let user = null; try { user = await painelApi.usuario(); } catch { /* sem sessão */ }
  if (!user) return telaLogin();
  let admin = false; try { admin = await painelApi.souAdmin(); } catch (e) { return telaAviso('Não foi possível conferir o acesso', (e.message || e) + '\n\nO arquivo supabase/painel.sql já foi executado no projeto?', true); }
  if (!admin) return telaAviso('Esta conta não tem acesso ao painel', 'Entrou como ' + user.email + '. Para liberar, adicione este e-mail na tabela "admins" (fim do arquivo supabase/painel.sql).', true);
  montar(user);
}
function telaLogin(erro) {
  const email = h('input', { type: 'email', placeholder: 'e-mail', autocomplete: 'username', required: true }), senha = h('input', { type: 'password', placeholder: 'senha', autocomplete: 'current-password', required: true });
  const msg = h('p', { class: 'erro' }, erro || '');
  const form = h('form', { class: 'login', onsubmit: async e => { e.preventDefault(); msg.textContent = 'Entrando…'; try { await painelApi.entrar(email.value.trim(), senha.value); iniciar(); } catch (er) { msg.textContent = er.message || 'Não foi possível entrar.'; } } },
    h('h1', {}, 'Peregrinos'), h('p', { class: 'sub' }, 'Painel de acessos · só para administradores'), email, senha, h('button', { class: 'btn ouro', type: 'submit' }, 'Entrar'), msg,
    h('p', { class: 'nota' }, 'Use a mesma conta do jogo. O e-mail precisa estar na lista de administradores.'));
  app.replaceChildren(h('main', { class: 'centro' }, form)); email.focus();
}
function telaAviso(titulo, texto, sair) {
  app.replaceChildren(h('main', { class: 'centro' }, h('div', { class: 'login' }, h('h1', {}, titulo), h('p', { class: 'sub pre' }, texto), sair ? h('button', { class: 'btn', onclick: async () => { await painelApi.sair(); telaLogin(); } }, 'Sair e entrar com outra conta') : '')));
}

/* ================= o painel ================= */
function montar(user) {
  const periodo = h('select', { 'aria-label': 'Período', onchange: e => { dias = +e.target.value; carregar(); } }, ...[7, 14, 30, 90].map(d => h('option', { value: d, selected: d === dias }, 'Últimos ' + d + ' dias')));
  const estado = h('span', { class: 'estado', id: 'estado' }, 'carregando…');
  const topo = h('header', { class: 'topo' },
    h('div', { class: 'marca' }, h('b', {}, 'Peregrinos'), h('span', {}, 'Painel de acessos'), DEMO ? h('span', { class: 'demo' }, 'DEMONSTRAÇÃO · dados inventados') : ''),
    h('div', { class: 'acoes' }, estado, periodo, h('button', { class: 'btn', onclick: () => carregar() }, 'Atualizar'), h('button', { class: 'btn fraco', onclick: async () => { clearInterval(timer); await painelApi.sair(); telaLogin(); } }, 'Sair')));
  app.replaceChildren(topo, h('main', { class: 'painel', id: 'corpo' }, h('p', { class: 'carregando' }, 'Carregando os dados…')));
  carregar(); clearInterval(timer); timer = setInterval(() => { if (!document.hidden) carregar(true); }, 30000);
}
async function carregar(silencioso) {
  const est = document.getElementById('estado'); if (est && !silencioso) est.textContent = 'atualizando…';
  try { ultimo = DEMO ? dadosDemo() : await painelApi.dados(dias); desenhar(ultimo); if (est) est.replaceChildren(h('i', { class: 'vivo' }), 'ao vivo · ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })); }
  catch (e) { if (est) est.textContent = 'erro: ' + (e.message || e); }
}

function desenhar(d) {
  const corpo = document.getElementById('corpo'); if (!corpo) return;
  const rolagem = scrollY;
  corpo.replaceChildren(
    secao(null, blocos(d)),
    h('div', { class: 'duas' }, secao('Visitantes por dia', graficoDias(d.por_dia || [])), secao('Até onde as pessoas chegaram', funil(d))),
    h('div', { class: 'duas' }, secao('Aparelhos', listaBarras(d.aparelhos || {}, Object.values(d.aparelhos || {}).reduce((a, b) => a + b, 0))), secao('De onde vieram', listaBarras(d.origens || {}, Object.values(d.origens || {}).reduce((a, b) => a + b, 0)))),
    secao('Jogadores', tabelaJogadores(d.jogadores || [])),
    secao('O que estão achando' + (d.nota_media ? ' · nota média ' + String(d.nota_media).replace('.', ',') + ' ★' : ''), opinioes(d.opinioes || [])),
    secao('Contas registradas', tabelaContas(d.contas_lista || [])),
    h('footer', { class: 'rodape' }, h('span', {}, 'Os números contam aparelhos (cada navegador recebe um código aleatório). "Online" = ativo nos últimos 2 minutos.'),
      h('button', { class: 'btn fraco', onclick: async e => { e.target.disabled = true; try { const n = await painelApi.limpar(); e.target.textContent = n + ' pulsos antigos apagados'; } catch (er) { e.target.textContent = 'erro: ' + er.message; } } }, 'Limpar pulsos com mais de 60 dias')));
  scrollTo(0, rolagem);
}
const secao = (titulo, ...conteudo) => h('section', { class: 'secao' }, titulo ? h('h2', {}, titulo) : '', ...conteudo);

// ---- os números de cima ----
function blocos(d) {
  const b = (rotulo, valor, nota, destaque) => h('div', { class: 'bloco' + (destaque ? ' destaque' : '') }, h('span', { class: 'rot' }, rotulo), h('b', {}, valor), nota ? h('small', {}, nota) : '');
  return h('div', { class: 'blocos' },
    h('div', { class: 'bloco destaque' }, h('span', { class: 'rot' }, h('i', { class: 'vivo' }), 'Online agora'), h('b', {}, num(d.online)), h('small', {}, num(d.jogando) + ' jogando')),
    b('Visitantes hoje', num(d.hoje)), b('Últimos 7 dias', num(d.semana)), b('Aparelhos no total', num(d.total)),
    b('Jogaram', num(d.jogaram), d.total ? Math.round(100 * d.jogaram / d.total) + '% de quem abriu' : ''),
    b('Sem conta (anônimos)', num(d.anonimos)), b('Contas registradas', num(d.contas), '+' + num(d.contas_semana) + ' nos últimos 7 dias'),
    b('Personagens com conta', num(d.personagens)), b('Tempo médio por pessoa', duracao(d.tempo_medio)), b('Tempo total jogado', duracao(d.tempo_total)),
    b('Opiniões', num((d.opinioes || []).length), d.nota_media ? 'média ' + String(d.nota_media).replace('.', ',') + ' ★' : 'nenhuma ainda'));
}

// ---- barras por dia: duas séries (abriram o jogo / jogaram), uma escala só ----
function graficoDias(lista) {
  if (!lista.length) return h('p', { class: 'vazio' }, 'Sem dados no período.');
  const W = 640, H = 220, M = { e: 34, d: 8, c: 12, b: 26 }, iw = W - M.e - M.d, ih = H - M.c - M.b;
  const max = Math.max(1, ...lista.map(x => Math.max(x.visitas, x.jogaram))), bruto = max / 3, mag = Math.pow(10, Math.floor(Math.log10(bruto))), passo = Math.max(1, [1, 2, 5, 10].map(k => k * mag).find(v => v >= bruto)), topo = passo * 3; // eixo em números redondos
  const s = svg('svg', { viewBox: `0 0 ${W} ${H}`, class: 'grafico', role: 'img', 'aria-label': 'Visitantes e jogadores por dia' });
  for (let k = 0; k <= 3; k++) { const v = topo * k / 3, y = M.c + ih - ih * v / topo; s.append(svg('line', { x1: M.e, x2: W - M.d, y1: y, y2: y, class: 'grade' })); const t = svg('text', { x: M.e - 6, y: y + 4, class: 'eixo', 'text-anchor': 'end' }); t.textContent = Math.round(v); s.append(t); }
  const grupo = iw / lista.length, larg = Math.max(2, Math.min(16, (grupo - 6) / 2));
  lista.forEach((x, i) => {
    const cx = M.e + grupo * i + grupo / 2, dia = new Date(x.dia + 'T12:00:00');
    [['visitas', 'serie1', -1], ['jogaram', 'serie2', 1]].forEach(([k, cls, lado]) => {
      const v = x[k], hgt = ih * v / topo, bx = cx + (lado < 0 ? -larg - 1 : 1), by = M.c + ih - hgt;
      const r = Math.min(4, larg / 2, hgt);
      const p = svg('path', { class: cls, d: hgt <= 0 ? '' : `M${bx},${M.c + ih} V${by + r} Q${bx},${by} ${bx + r},${by} H${bx + larg - r} Q${bx + larg},${by} ${bx + larg},${by + r} V${M.c + ih} Z` });
      s.append(p);
    });
    const alvo = svg('rect', { x: cx - grupo / 2, y: M.c, width: grupo, height: ih, class: 'alvo' }); s.append(alvo);
    comDica(alvo, dia.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' }) + ' · ' + x.visitas + ' abriram · ' + x.jogaram + ' jogaram');
    const cada = Math.ceil(lista.length / 8); if (i % cada === 0 || i === lista.length - 1) { const t = svg('text', { x: cx, y: H - 8, class: 'eixo', 'text-anchor': 'middle' }); t.textContent = dia.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }); s.append(t); }
  });
  s.append(svg('line', { x1: M.e, x2: W - M.d, y1: M.c + ih, y2: M.c + ih, class: 'base' }));
  const legenda = h('div', { class: 'legenda' }, h('span', {}, h('i', { class: 'serie1' }), 'Abriram o jogo'), h('span', {}, h('i', { class: 'serie2' }), 'Jogaram'));
  return h('div', {}, legenda, s);
}

// ---- funil: cada etapa como barra horizontal, do começo para o fim da jornada ----
function funil(d) {
  const f = d.funil || {}, etapas = [['Abriram o jogo', d.total], ['Começaram a jogar', d.jogaram], ...Object.keys(f).sort((a, b) => ordemMarco(a) - ordemMarco(b) || a.localeCompare(b)).map(m => [nomeMarco(m), f[m]])];
  const base = Math.max(1, d.total || 0);
  if (etapas.length <= 2 && !d.total) return h('p', { class: 'vazio' }, 'Ainda não há marcos registrados.');
  return h('div', { class: 'funil' }, ...etapas.map(([rot, n]) => { const pct = Math.round(100 * (n || 0) / base); return comDica(h('div', { class: 'etapa' }, h('span', { class: 'rot' }, rot), h('div', { class: 'trilho' }, h('i', { style: 'width:' + Math.max(pct, n ? 1.5 : 0) + '%' })), h('b', {}, num(n)), h('small', {}, pct + '%')), rot + ': ' + num(n) + ' aparelhos (' + pct + '% de quem abriu)'); }));
}
function listaBarras(obj, total) {
  const itens = Object.entries(obj).sort((a, b) => b[1] - a[1]); if (!itens.length) return h('p', { class: 'vazio' }, 'Sem dados ainda.');
  return h('div', { class: 'funil' }, ...itens.map(([k, n]) => { const pct = Math.round(100 * n / Math.max(1, total)); return h('div', { class: 'etapa' }, h('span', { class: 'rot' }, k), h('div', { class: 'trilho' }, h('i', { style: 'width:' + Math.max(pct, 1.5) + '%' })), h('b', {}, num(n)), h('small', {}, pct + '%')); }));
}

// ---- tabela de jogadores ----
function tabelaJogadores(lista) {
  const caixa = h('div', {});
  const filtros = h('div', { class: 'filtros' },
    h('input', { type: 'search', placeholder: 'Procurar por nome, e-mail, área…', value: busca, oninput: e => { busca = e.target.value.toLowerCase(); pinta(); } }),
    ...[['todos', 'Todos'], ['online', 'Online'], ['conta', 'Com conta'], ['anonimo', 'Anônimos']].map(([id, rot]) => h('button', { class: 'chip' + (filtro === id ? ' on' : ''), onclick: e => { filtro = id; e.target.parentNode.querySelectorAll('.chip').forEach(c => c.classList.toggle('on', c === e.target)); pinta(); } }, rot)),
    h('button', { class: 'btn fraco', onclick: () => exportarCsv(lista) }, 'Exportar CSV'));
  const pinta = () => {
    const vis = lista.filter(j => (filtro === 'todos' || (filtro === 'online' && j.online) || (filtro === 'conta' && j.email) || (filtro === 'anonimo' && !j.email)) &&
      (!busca || [j.jogo?.nome, j.email, j.jogo?.area, j.jogo?.cls, j.visitante].join(' ').toLowerCase().includes(busca)));
    const linhas = vis.map(j => { const g = j.jogo || {}, a = j.aparelho || {}, mc = (j.marcos || []).filter(Boolean).sort((x, y) => ordemMarco(x) - ordemMarco(y));
      return h('tr', {},
        h('td', {}, h('i', { class: 'ponto' + (j.online ? ' on' : ''), title: j.online ? 'online agora' : 'offline' })),
        h('td', {}, h('b', {}, g.nome || '—'), h('small', {}, [CLASSES[g.cls] || g.cls, g.nivel ? 'nível ' + g.nivel : ''].filter(Boolean).join(' · '))),
        h('td', {}, j.email ? h('span', {}, j.email) : h('span', { class: 'anon' }, 'anônimo · ' + j.visitante)),
        h('td', {}, g.area || '—', g.jogando === false ? h('small', {}, 'no menu') : ''),
        h('td', {}, h('small', {}, (g.fases || 0) + ' fases · ' + (g.chefes || 0) + ' chefes'), h('div', { class: 'marcos' }, ...mc.slice(-4).map(m => h('span', { class: 'tag' }, nomeMarco(m))), mc.length > 4 ? h('span', { class: 'tag fraco' }, '+' + (mc.length - 4)) : '')),
        h('td', { class: 'num' }, duracao(j.seg)),
        h('td', {}, h('small', {}, [a.disp, a.so, a.nav].filter(Boolean).join(' · ') || '—')),
        h('td', {}, h('small', {}, dataHora(j.primeiro))),
        h('td', {}, quando(j.ultimo)));
    });
    caixa.replaceChildren(h('p', { class: 'contagem' }, vis.length + ' de ' + lista.length + ' aparelhos'), h('div', { class: 'tabela' }, h('table', {},
      h('thead', {}, h('tr', {}, ...['', 'Personagem', 'Conta', 'Onde está', 'Progresso', 'Tempo jogado', 'Aparelho', 'Primeiro acesso', 'Último acesso'].map(t => h('th', {}, t)))),
      h('tbody', {}, ...(linhas.length ? linhas : [h('tr', {}, h('td', { colspan: 9, class: 'vazio' }, 'Ninguém aqui com esse filtro.'))])))));
  };
  pinta();
  return h('div', {}, filtros, caixa);
}
function exportarCsv(lista) {
  const esc = v => '"' + String(v ?? '').replace(/"/g, '""') + '"';
  const linhas = [['visitante', 'conta', 'personagem', 'classe', 'nivel', 'area', 'fases', 'chefes', 'tempo_seg', 'aparelho', 'sistema', 'navegador', 'primeiro', 'ultimo', 'marcos'].join(',')];
  for (const j of lista) { const g = j.jogo || {}, a = j.aparelho || {}; linhas.push([j.visitante, j.email || 'anônimo', g.nome, g.cls, g.nivel, g.area, g.fases, g.chefes, j.seg, a.disp, a.so, a.nav, j.primeiro, j.ultimo, (j.marcos || []).join(' | ')].map(esc).join(',')); }
  const url = URL.createObjectURL(new Blob(['﻿' + linhas.join('\n')], { type: 'text/csv;charset=utf-8' }));
  const a = h('a', { href: url, download: 'peregrinos-jogadores-' + new Date().toISOString().slice(0, 10) + '.csv' }); a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ---- opiniões ----
function opinioes(lista) {
  if (!lista.length) return h('p', { class: 'vazio' }, 'Ninguém deu opinião ainda. No jogo: ☰ › Ajustes › "Dar minha opinião" (e o convite aparece ao terminar a primeira fase).');
  return h('div', { class: 'opinioes' }, ...lista.map(o => { const c = o.contexto || {};
    return h('article', { class: 'opiniao' }, h('div', { class: 'estrelas', 'aria-label': o.nota + ' de 5' }, '★'.repeat(o.nota), h('span', {}, '★'.repeat(5 - o.nota))),
      h('p', {}, o.texto || h('em', {}, '(sem comentário)')),
      h('small', {}, [o.email || 'anônimo · ' + o.visitante, c.nome, c.area, c.nivel ? 'nível ' + c.nivel : '', quando(o.criado)].filter(Boolean).join(' · ')));
  }));
}
function tabelaContas(lista) {
  if (!lista.length) return h('p', { class: 'vazio' }, 'Nenhuma conta ainda.');
  return h('div', { class: 'tabela' }, h('table', {}, h('thead', {}, h('tr', {}, ...['E-mail', 'Criada', 'Último login', 'Personagens'].map(t => h('th', {}, t)))),
    h('tbody', {}, ...lista.map(u => h('tr', {}, h('td', {}, u.email), h('td', {}, h('small', {}, dataHora(u.criada))), h('td', {}, quando(u.ultimo_login)),
      h('td', {}, (u.personagens || []).length ? (u.personagens || []).map(p => p.nome + ' (' + (CLASSES[p.classe] || p.classe) + ', nv ' + p.nivel + ')').join(' · ') : h('small', {}, 'nenhum')))))));
}

iniciar();
