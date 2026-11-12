// Janelas do Caminho: menu de pausa (Jornada, Armadura, Relíquias, Mapa, Bíblia, Ajustes), escolha de página e a loja da Lídia.
import { h } from '../util.js';
import { sfx, setMuted, audio } from '../audio.js';
import { config, setConfig } from '../config.js';
import { ACOES_TECLA, teclaDe } from '../input.js';
import { botaoDe, proximoBotao } from '../gamepad.js';
import { CINEMAS } from '../content/cinematicas.js';
import { TODAS } from '../content/index.js';
import { faseProg } from '../game/player.js';
import { L, R, U, D } from './nivel.js';
import { ARMADURA, RELIQUIAS, DIFICULDADES, FORJA, ARMAS_ALT, PETS, DONS } from './dados.js';
import { LOOK_OPTIONS } from '../data/classes.js';
import { novoHeroi } from './heroi.js';
import { quadroHeroi, AX, AY } from './pixel/humano.js';
import { CLASSES } from '../data/classes.js';
import { ENEMIES, BOSSES } from '../data/bestiary.js';
import { VICIOS } from './bichos.js';
import { quadroVicio } from './pixel/viciospx.js';
import { iconeItem } from './pixel/icones.js';
import { quadroChefe } from './pixel/chefespx.js';
import { CHEFES } from './chefes.js';

const ABAS = [['inventario', 'Inventário'], ['jornada', 'Jornada'], ['bestiario', 'Bestiário'], ['mapa', 'Mapa'], ['biblia', 'Bíblia'], ['juntos', 'Juntos'], ['ajustes', 'Ajustes']];

export function abrirMenu(G, aba = 'inventario') {
  const cm = G.cm, c = G.char;
  return G.ui.modal((p, close) => {
    p.classList.add('cm-menu');
    const corpo = h('div', { class: 'cm-corpo' }), abas = h('div', { class: 'cm-abas' });
    const ir = a => { aba = a; desenha(); };
    const desenha = () => {
      abas.replaceChildren(...ABAS.map(([id, nome]) => h('button', { class: 'chip-btn' + (id === aba ? ' on' : ''), onclick: () => { sfx('click'); ir(id); } }, nome)));
      corpo.replaceChildren(...({ inventario, jornada, bestiario, armadura: inventario, reliquias: inventario, mapa, biblia, juntos, ajustes })[aba]());
    };
    const t = (txt, cls = '') => h('p', { class: cls }, txt);

    function jornada() {
      const d = G.def, out = [h('h4', {}, d.nome), t(d.sub || '', 'muted')];
      if (d.fase) {
        out.push(t(d.fase.objetivo), t('Rolos lidos: ' + cm.selos[G.area].length + ' de 3' + (d.estacoes ? ' · Decisões de estudo: ' + cm.est[G.area].length + ' de ' + d.estacoes.length : '') + '.'));
        if (CHEFES[d.chefe]?.dica && (G.mortosAqui || cm.chefes[d.chefe])) out.push(h('div', { class: 'porque' }, h('b', {}, 'Sobre o chefe'), t(CHEFES[d.chefe].dica)));
      } else if (d.id === 'refugio') out.push(t('Os portais levam às páginas do Livro. Comece por Corinto (Atos 18): cada sombra de lá guarda uma peça da Armadura de Deus.'));
      out.push(h('h4', {}, c.name + ' · ' + 'nível ' + c.level), t('Fôlegos: ' + G.p.vida + '/' + G.p.vidaMax + ' · Maná: ' + cm.mana + ' (a cada 3, um fôlego) · Pedras lisas: ' + cm.pedras + '/5 · Quedas: ' + cm.mortes));
      out.push(t('Pontos: ' + Math.floor(c.score) + ' · Perguntas certas: ' + (c.data.stats.quizOk || 0) + ' · Segredos da Escritura achados: ' + cm.ovos.length, 'muted'));
      out.push(h('div', { class: 'btn-row' }, h('button', { class: 'btn gold', onclick: () => close() }, 'Continuar'),
        G.area !== 'refugio' ? h('button', { class: 'btn', onclick: () => { close(); G.entrar('refugio'); } }, 'Voltar ao Refúgio') : ''));
      return out;
    }
    // caminhar juntos: abrir uma sala e passar o código, ou entrar na sala de alguém
    function juntos() {
      const mp = G.mp, local = new URLSearchParams(location.search).has('redelocal');
      const aviso = h('p', { class: 'muted' }, ''), ocupado = (b, txt) => { b.disabled = true; b.textContent = txt; };
      const falha = e => { aviso.textContent = e.message || 'Não deu certo. Tente de novo.'; desenha(); corpo.append(h('p', { class: 'porque' }, e.message || 'Não deu certo. Tente de novo.')); };
      if (!mp) {
        const campo = h('input', { class: 'cm-codigo', maxlength: 5, placeholder: 'CÓDIGO', autocapitalize: 'characters', autocomplete: 'off', spellcheck: 'false' });
        campo.addEventListener('keydown', e => e.stopPropagation());
        return [h('h4', {}, 'Caminhar juntos'),
          t('Até quatro peregrinos na mesma jornada, cada um no seu aparelho. Um abre a sala e passa o código; os outros entram com ele. Não há conta nem servidor de jogo: os aparelhos conversam direto.'),
          t('O progresso é de cada um. Rolos lidos, peças da armadura e relíquias ficam no seu personagem e continuam valendo quando você caminhar sozinho.', 'muted'),
          h('div', { class: 'btn-row' }, h('button', { class: 'btn gold', onclick: ev => { ocupado(ev.target, 'Abrindo…'); G.abrirSala(local).then(desenha, falha); } }, cm.sala ? 'Abrir a sala ' + cm.sala : 'Abrir uma sala')),
          h('h4', {}, 'Entrar numa sala'),
          h('div', { class: 'btn-row' }, campo, h('button', { class: 'btn', onclick: ev => { const cod = campo.value.trim(); if (cod.length < 5) { aviso.textContent = 'O código tem cinco letras ou números.'; return; } ocupado(ev.target, 'Entrando…'); G.entrarNaSala(cod, local).then(desenha, falha); } }, 'Entrar')),
          aviso];
      }
      const link = location.origin + location.pathname + '?sala=' + mp.codigo, lista = mp.lista();
      const out = [h('h4', {}, 'Sala ' + mp.codigo), h('div', { class: 'cm-sala' }, mp.codigo),
        t(mp.anfitriao ? 'Passe este código aos outros peregrinos. A sala fica aberta enquanto você estiver jogando; da próxima vez, o código será o mesmo.' : 'Você está na sala de outro peregrino. Se ele sair, você segue sozinho, com tudo o que conquistou.', 'muted'),
        h('div', { class: 'btn-row' }, h('button', { class: 'btn', onclick: ev => { navigator.clipboard?.writeText(link).then(() => { ev.target.textContent = 'Link copiado'; }, () => { ev.target.textContent = link; }); } }, 'Copiar o link da sala'))];
      out.push(h('h4', {}, 'Peregrinos (' + (lista.length + 1) + ' de 4)'), h('div', { class: 'fase-row' }, h('span', { class: 'cm-ico' }, '1'), h('div', {}, h('b', {}, c.name + ' (você)'), t(G.def.nome, 'muted'))));
      for (const o of lista) out.push(h('div', { class: 'fase-row' }, h('span', { class: 'cm-ico' }, String(lista.indexOf(o) + 2)), h('div', {}, h('b', {}, o.nome), t(o.onde + (o.vidaMax ? ' · fôlegos ' + Math.max(0, o.vida) + '/' + o.vidaMax : ''), 'muted')),
        o.area && o.area !== G.area ? h('button', { class: 'btn', onclick: () => { close(); G.entrar(o.area); } }, 'Ir até lá') : ''));
      if (!lista.length) out.push(t('Ninguém entrou ainda.', 'muted'));
      out.push(t('Na luta contra um chefe, a pergunta do "Está Escrito" vai para todos e vale a resposta da maioria. Se um peregrino cai, a sombra recupera um pouco de força; a recompensa da página é de quem leu os três rolos.', 'muted'),
        h('div', { class: 'btn-row' }, h('button', { class: 'btn', onclick: () => { G.sairDaSala(); desenha(); } }, mp.anfitriao ? 'Fechar a sala' : 'Sair da sala')));
      return out;
    }
    // Inventário: tudo o que o peregrino carrega, em quadros; à direita, o que é o quadro escolhido.
    function inventario() {
      const det = h('div', { class: 'inv-det' }), grade = h('div', { class: 'inv-grade' }), cls = CLASSES[c.cls] || {};
      const mostra = (nome, sub, desc, acao) => det.replaceChildren(h('h4', {}, nome), h('small', { class: 'muted' }, sub || ''), h('p', {}, desc || ''), acao || '');
      const quadro = (ico, tem, on, aoVer, aoUsar) => { const b = h('button', { class: 'inv-q' + (tem ? '' : ' falta') + (on ? ' on' : ''), onclick: () => { sfx('click'); grade.querySelectorAll('.inv-q').forEach(x => x.classList.remove('sel')); b.classList.add('sel'); aoVer(); }, ondblclick: aoUsar || null }, h('span', {}, tem ? ico : '·')); return b; };
      const sec = (titulo, itens) => grade.append(h('h4', {}, titulo), h('div', { class: 'inv-linha' }, ...itens));
      const fio = cm.fio || 0;
      sec('Arma e bolsa', [
        quadro(iconeItem('arma'), true, true, () => mostra((cls.nome || 'Peregrino') + ' · ' + (cls.arma || 'espada'), fio ? FORJA[fio - 1].nome : 'Fio comum', (fio ? FORJA[fio - 1].desc : 'Tubalcaim, no Refúgio, pode melhorar o fio da sua arma.') + '\n\nEspecial: ' + (cls.skill?.nome || 'Verso') + '.')),
        quadro(iconeItem('denarios'), true, false, () => mostra('Denários', Math.floor(c.data.gold) + ' na bolsa', 'Caem dos vícios e dos vasos. Se você cair, a sacola fica no chão até você buscá-la.')),
        quadro(iconeItem('mana'), cm.mana > 0, false, () => mostra('Maná escondido', cm.mana + ' porções', 'A cada três porções, um fôlego a mais (Ap 2:17).')),
        quadro(iconeItem('pedras'), cm.pedras > 0, false, () => mostra('Pedras lisas do ribeiro', cm.pedras + ' de 5', 'Com as cinco, o Vale de Elá se abre (1Sm 17:40).'))]);
      sec('Armadura de Deus · ' + Object.keys(cm.hab).length + ' de 6', Object.values(ARMADURA).map(a => quadro(iconeItem(a.hab), cm.hab[a.hab], cm.hab[a.hab], () => mostra(a.nome, a.ref, cm.hab[a.hab] ? a.poder + '\n\n' + a.desc : 'Ainda não é sua. Um chefe de Corinto a guarda.'))));
      const usar = id => { const R = RELIQUIAS[id], on = cm.eq.includes(id); if (R.passiva) return; if (on) cm.eq.splice(cm.eq.indexOf(id), 1); else if (cm.eq.length < G.espacos()) cm.eq.push(id); else return G.ui.toast('Sem espaço: guarde outra relíquia primeiro.'); G.p.vidaMax = G.vidaMax(); G.p.vida = Math.min(G.p.vida, G.p.vidaMax); G.salvar(); desenha(); };
      const ds = cm.dons || {};
      sec('Dons · Q usa o escolhido', Object.entries(DONS).map(([id, d]) => { const tem = G.temDom(id), n = ds[id] || 0; return quadro(iconeItem(id), tem || n > 0, cm.dom === id, () => mostra(d.nome, d.ref + (tem ? (cm.dom === id ? ' · escolhido' : '') : d.partes > 1 ? ' · ' + n + ' de ' + d.partes + ' metades' : d.exige ? ' · falta ' + [...d.exige.filter(x => !G.temDom(x)).map(x => DONS[x].nome), ...(ds.lingua ? [] : ['a Língua de Fogo'])].join(', ') : ' · ainda não é seu'), d.desc, tem ? h('button', { class: 'btn', onclick: () => { cm.dom = id; G.salvar(); desenha(); } }, 'Escolher') : '')); }));
      sec('Relíquias · ' + cm.eq.length + ' de ' + G.espacos() + ' vestidas', cm.reliquias.length ? cm.reliquias.map(id => { const R = RELIQUIAS[id], on = cm.eq.includes(id) || R.passiva; return quadro(iconeItem(id), true, on, () => mostra(R.nome, R.ref + (R.passiva ? ' · sempre ativa' : on ? ' · vestida' : ' · guardada'), R.desc, R.passiva ? '' : h('button', { class: 'btn', onclick: () => usar(id) }, cm.eq.includes(id) ? 'Guardar' : 'Vestir')), () => usar(id)); }) : [h('p', { class: 'muted' }, 'Nenhuma ainda. Vêm dos chefes de Jonas e de Daniel, dos gigantes, da Lídia e, às vezes, do Mercador.')]);
      mostra(c.name + ' · nível ' + c.level, 'Fôlegos ' + G.p.vida + '/' + G.p.vidaMax + ' · azeite ' + Math.round(G.p.oleo) + '/' + G.oleoMax(), 'Escolha um quadro para ver o que ele faz. Toque duas vezes numa relíquia para vestir ou guardar.');
      return [h('div', { class: 'inv' }, grade, det)];
    }
    // Bestiário: cada vício e cada chefe vencido, com o que ele ensina; marcos de vitórias rendem prêmios.
    function bestiario() {
      const kills = c.data.kills || {}, bb = cm.bestiario = cm.bestiario || {}, out = [t('Vença para conhecer. Cada marco alcançado tem um prêmio para buscar aqui.', 'muted'), h('h4', {}, 'Vícios')];
      const retrato = q => { const cv = h('canvas', { width: 56, height: 52, class: 'best-cv' }); if (q) cv.getContext('2d').drawImage(q.s.tela(), 0, 0, q.s.w, q.s.h, 0, 0, 56, 52); return cv; };
      for (const tipo of Object.keys(VICIOS)) {
        const d = ENEMIES[tipo] || {}, n = kills[tipo] || 0, feito = bb[tipo] || 0, marcos = [[10, 60], [30, 180], [80, 400]], prox = marcos[feito];
        const e = { type: tipo, tele: 0, stun: 0, flash: 0, vx: 0, estado: 'idle', art: { ph: 0 } };
        const premio = prox && n >= prox[0] ? h('button', { class: 'btn gold', onclick: () => { bb[tipo] = feito + 1; c.data.gold += prox[1]; if (feito === 2) cm.mana++; sfx('coin'); G.salvar(); desenha(); } }, 'Prêmio: ' + prox[1] + (feito === 2 ? ' + maná' : '')) : '';
        out.push(h('div', { class: 'fase-row' + (n ? '' : ' cm-falta') }, n ? retrato(quadroVicio(e, 1)) : h('span', { class: 'cm-ico' }, '?'), h('div', {}, h('b', {}, n ? d.nome || tipo : '???'), h('small', {}, n ? (d.licao || '') + ' · vencido ' + n + ' vez(es)' + (prox ? ' · próximo marco: ' + prox[0] : ' · todos os marcos') : 'Ainda não vencido.')), premio));
      }
      out.push(h('h4', {}, 'Sombras'));
      for (const id of Object.keys(CHEFES)) {
        const d = BOSSES[id] || {}, n = cm.chefes[id] || 0, pago = bb['c:' + id], C = CHEFES[id];
        const b = { id, c: C, hp: 1, max: 1, vx: 0, chao: true, tele: 0, quebrado: 0, tonto: 0, mov: null, art: {}, flash: 0, alpha: 1, clones: [], pousou: 0, exposto: 0, voa: !!C.voa };
        const cv = h('canvas', { width: 60, height: 56, class: 'best-cv' }); if (n) { const q = quadroChefe(b, 1, G); if (q) cv.getContext('2d').drawImage(q.s.tela(), 0, 0, 120, 112, 0, 0, 60, 56); }
        const premio = n && !pago ? h('button', { class: 'btn gold', onclick: () => { bb['c:' + id] = 1; c.data.gold += 150; sfx('coin'); G.salvar(); desenha(); } }, 'Prêmio: 150') : '';
        out.push(h('div', { class: 'fase-row' + (n ? '' : ' cm-falta') }, n ? cv : h('span', { class: 'cm-ico' }, '?'), h('div', {}, h('b', {}, n ? d.nome || id : '???'), h('small', {}, n ? (d.ref || '') + ' · vencido ' + n + ' vez(es). ' + (C.dica || '') : 'Uma página ainda coberta de sombra.')), premio));
      }
      return out;
    }
    function armadura() {
      return [t('"Tomai toda a armadura de Deus, para que possais resistir no dia mau" (Ef 6:13). Cada peça vem de um chefe de Corinto.', 'muted'),
        ...Object.values(ARMADURA).map(a => h('div', { class: 'fase-row' + (cm.hab[a.hab] ? '' : ' cm-falta') }, h('span', { class: 'cm-ico' }, cm.hab[a.hab] ? a.icone : '·'),
          h('div', {}, h('b', {}, a.nome + (cm.hab[a.hab] ? ' — ' + a.poder : '')), h('small', {}, cm.hab[a.hab] ? a.desc : a.ref + ' · ainda não vestida'))))];
    }
    function reliquias() {
      const out = [t('Equipadas: ' + cm.eq.length + ' de ' + G.espacos() + '. Toque para vestir ou guardar.', 'muted')];
      if (!cm.reliquias.length) out.push(t('Nenhuma relíquia ainda. Elas vêm dos chefes de Jonas e de Daniel, dos gigantes do mundo e da Lídia, no Refúgio.'));
      for (const id of cm.reliquias) {
        const r = RELIQUIAS[id], on = cm.eq.includes(id);
        out.push(h('button', { class: 'fase-row cm-rel' + (on ? ' on' : ''), disabled: r.passiva, onclick: () => {
          if (on) cm.eq.splice(cm.eq.indexOf(id), 1); else if (cm.eq.length < G.espacos()) cm.eq.push(id); else return G.ui.toast('Sem espaço: guarde outra relíquia primeiro.');
          sfx('click'); G.p.vidaMax = G.vidaMax(); G.p.vida = Math.min(G.p.vida, G.p.vidaMax); G.salvar(); desenha();
        } }, h('span', { class: 'cm-ico' }, r.icone), h('div', {}, h('b', {}, r.nome + (on ? ' ✓' : r.passiva ? ' (sempre ativa)' : '')), h('small', {}, r.desc + ' · ' + r.ref))));
      }
      return out;
    }
    function mapa() {
      // o mapa é a própria área em miniatura: cada bloco vira um ponto, com marcas para gente, portais, rolos e o chefe
      const N = G.N, s = Math.max(3, Math.min(6, Math.round(840 / N.w))), topo = 16, W = N.w * s, H = N.h * s + topo * N.rows;
      const cv = h('canvas', { width: W, height: H, class: 'cm-mapa' }), g = cv.getContext('2d'); g.imageSmoothingEnabled = false;
      const Y = ty => Math.floor(ty / 17) * topo + topo + ty * s, pc = { x: Math.floor(G.p.x / 32 / 30), y: Math.floor((G.p.y - 2) / 32 / 17) };
      const COR = { 1: '#3A4666', 2: '#B08A4E', 3: '#D8574A', 4: '#3A4666', 5: '#3A4666', 6: '#C9A63C', 7: '#C9A63C' };
      for (const cel of N.celulas) {
        const x0 = cel.cx * 30 * s, y0 = Y(cel.cy * 17), w = 30 * s, hh = 17 * s, aqui = cel.cx === pc.x && cel.cy === pc.y;
        g.fillStyle = cel.ceu ? '#1D2B4A' : cel.papel === 'arena' ? '#3A1C22' : cel.papel === 'ebenezer' ? '#1C3A36' : '#161C2E'; g.fillRect(x0, y0, w, hh);
        if (cel.ceu) { g.fillStyle = '#2A3C63'; g.fillRect(x0, y0 + hh * 0.55, w, hh * 0.45); g.fillStyle = '#F1E9D2'; for (let k = 0; k < 5; k++) g.fillRect(x0 + ((cel.cx * 37 + k * 53) % (w - 2)), y0 + 2 + ((k * 17) % Math.max(1, hh * 0.4 | 0)), 1, 1); }
        g.fillStyle = aqui ? '#FFE9A8' : '#8C93AD'; g.font = '13px "Jersey 15", monospace'; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
        const nome = cel.nome || { inicio: 'Entrada', arena: 'Chefe', ebenezer: 'Ebenézer', tesouro: 'Tesouro', corredor: 'Câmara' }[cel.papel] || '';
        if (nome && g.measureText(nome).width < w + 20) g.fillText(nome, x0 + w / 2, y0 - 4);
      }
      const sala = new Set(N.celulas.map(c => c.cx + ',' + c.cy));
      for (let ty = 0; ty < N.h; ty++) for (let tx = 0; tx < N.w; tx++) { if (!sala.has(Math.floor(tx / 30) + ',' + Math.floor(ty / 17))) continue; const tl = N.tiles[ty * N.w + tx]; if (!tl || (tl === 4 && !(N.revel?.[ty * N.w + tx] > 0)) || (tl === 6 && N.portaAberta)) continue; g.fillStyle = COR[tl]; g.fillRect(tx * s, Y(ty), s, tl === 2 ? Math.max(1, s >> 1) : s); }
      const marca = (o, cor, lg = 2, al = 3) => { const x = Math.floor(o.x / 32) * s + (s >> 1), y = Y(o.y / 32) ; g.fillStyle = '#05060B'; g.fillRect(x - lg - 1, y - al * 2 - 1, lg * 2 + 2, al * 2 + 2); g.fillStyle = cor; g.fillRect(x - lg, y - al * 2, lg * 2, al * 2); };
      for (const o of G.objs) {
        if (o.tipo === 'portal' || o.tipo === 'saida' || o.tipo === 'retorno') marca(o, '#7FE0E8', 3, 4);
        else if (o.tipo === 'npc') marca(o, '#9BE0B4', 2, 3);
        else if (o.tipo === 'casa') marca(o, '#C9A27A', 4, 3);
        else if (o.tipo === 'rolo') marca(o, o.feito ? '#8C93AD' : '#FFE9A8', 2, 3);
        else if (o.tipo === 'estacao') marca(o, o.feito ? '#8C93AD' : '#F0A6D8', 2, 2);
        else if (o.tipo === 'ebenezer') marca(o, '#F1E9D2', 2, 4);
        else if (o.tipo === 'sacola') marca(o, '#FFD23F', 2, 2);
      }
      if (N.arena) marca({ x: N.arena.cx, y: N.arena.chao }, G.cm.feitas?.[G.area] ? '#8C93AD' : '#E2463C', 4, 4);
      if (G.mp) for (const o of G.outros) marca({ x: o.corpo.x, y: o.corpo.y }, '#B8A0FF', 2, 3);
      const eu = () => { const x = Math.floor(G.p.x / 32) * s + (s >> 1), y = Y(G.p.y / 32); g.fillStyle = '#05060B'; g.fillRect(x - 4, y - 11, 8, 11); g.fillStyle = '#fff'; g.fillRect(x - 3, y - 10, 6, 9); g.fillStyle = '#E8C873'; g.fillRect(x - 3, y - 6, 6, 5); };
      eu();
      const leg = (cor, tx) => h('span', {}, h('i', { style: 'background:' + cor }), tx);
      const cx = h('div', { class: 'cm-mapa-cx' }, cv);
      setTimeout(() => { cx.scrollLeft = Math.floor(G.p.x / 32) * s - cx.clientWidth / 2; }, 0);
      return [t(G.def.nome + (G.def.sub ? ' · ' + G.def.sub : ''), 'muted'), cx,
        h('div', { class: 'cm-mapa-leg' }, leg('#fff', 'você'), leg('#9BE0B4', 'gente'), leg('#7FE0E8', 'portal'), leg('#C9A27A', 'casa'), leg('#FFE9A8', 'rolo'), leg('#F1E9D2', 'Ebenézer'), leg('#E2463C', 'chefe'), leg('#B08A4E', 'plataforma'), G.mp ? leg('#B8A0FF', 'companheiro') : '')];
    }
    function biblia() {
      const out = [];
      for (const sem of TODAS) {
        const prog = faseProg(c, sem.id), n = sem.fases.filter(f => prog[f.n]?.done).length;
        out.push(h('h4', {}, sem.titulo + ' · ' + sem.estudo + ' (' + n + '/5)'));
        for (const f of sem.fases) if (prog[f.n]?.done || cm.selos[sem.id + ':' + f.n]?.length) out.push(h('details', { class: 'dungeon-study' }, h('summary', {}, f.n + ' · ' + f.nome + ' — ' + f.ref),
          t(f.licao), t('“' + f.versiculo.texto + '” — ' + f.versiculo.ref, 'muted'), ...(f.estudo || []).map(e => t(e)), f.reflexao ? t('Para refletir: ' + f.reflexao, 'hint') : ''));
      }
      const rev = c.data.revisar || [];
      if (rev.length) { out.push(h('h4', {}, 'Para revisar (' + rev.length + ')')); for (const r of rev) out.push(h('div', { class: 'porque' }, h('b', {}, r.q), t('Resposta: ' + r.certa + (r.porque ? ' — ' + r.porque : '')))); }
      if (out.length <= TODAS.length) out.push(t('As páginas que você ler aparecem aqui, com o estudo completo.', 'muted'));
      return out;
    }
    function ajustes() {
      const out = [h('h4', {}, 'Dificuldade')];
      const nomeTecla = c => (c || '—').replace('Key', '').replace('Arrow', 'Seta ').replace('Up', '↑').replace('Down', '↓').replace('Left', '←').replace('Right', '→').replace('Digit', '');
      const teclas = h('div', { class: 'cfg-teclas' });
      for (const [acao, nome] of ACOES_TECLA) teclas.append(h('button', { class: 'fase-row cm-rel', onclick: ev => { const b = ev.currentTarget; b.querySelector('small').textContent = 'aperte a tecla nova…'; const pega = e => { e.preventDefault(); e.stopPropagation(); removeEventListener('keydown', pega, true); if (e.code !== 'Escape') setConfig('teclas', { ...(config.teclas || {}), [acao]: e.code }); desenha(); }; addEventListener('keydown', pega, true); } },
        h('span', { class: 'cm-ico' }, nomeTecla(teclaDe(acao))), h('div', {}, h('b', {}, nome), h('small', {}, 'Toque para trocar a tecla'))));
      teclas.append(h('button', { class: 'btn sm', onclick: () => { setConfig('teclas', {}); desenha(); } }, 'Voltar às teclas de sempre'));
      for (const [id, d] of Object.entries(DIFICULDADES)) out.push(h('button', { class: 'fase-row cm-rel' + (cm.dif === id ? ' on' : ''), onclick: () => { cm.dif = id; sfx('click'); G.p.vidaMax = G.vidaMax(); G.p.vida = Math.min(G.p.vida, G.p.vidaMax); G.salvar(); desenha(); } }, h('div', {}, h('b', {}, d.nome + (cm.dif === id ? ' ✓' : '')), h('small', {}, d.desc))));
      const alterna = (k, nome) => h('button', { class: 'chip-btn' + (config[k] !== false ? ' on' : ''), onclick: () => { setConfig(k, config[k] === false); desenha(); } }, nome + ': ' + (config[k] !== false ? 'ligado' : 'desligado'));
      out.push(h('h4', {}, 'Teclas (teclado)'), teclas);
      const botoes = h('div', { class: 'cfg-teclas' }), NOMES = ['A / ✕', 'B / ○', 'X / □', 'Y / △', 'LB / L1', 'RB / R1', 'LT / L2', 'RT / R2', 'Select', 'Start', 'L3', 'R3', '↑', '↓', '←', '→'];
      for (const [acao, nome] of ACOES_TECLA) botoes.append(h('button', { class: 'fase-row cm-rel', onclick: async ev => { const sm = ev.currentTarget.querySelector('small'); sm.textContent = 'aperte o botão novo no controle…'; const i = await proximoBotao(); if (i != null) setConfig('botoes', { ...(config.botoes || {}), [acao]: i }); desenha(); } },
        h('span', { class: 'cm-ico' }, NOMES[botaoDe(acao)] || (botaoDe(acao) != null ? 'B' + botaoDe(acao) : '—')), h('div', {}, h('b', {}, nome), h('small', {}, 'Toque e aperte o botão que quer usar'))));
      botoes.append(h('button', { class: 'btn sm', onclick: () => { setConfig('botoes', {}); desenha(); } }, 'Voltar aos botões de sempre'));
      out.push(h('h4', {}, 'Controle'), h('p', { class: 'muted' }, 'Se o seu controle não responde como esperado, escolha aqui o botão de cada ação: funciona com qualquer modelo.'), botoes);
      out.push(h('h4', {}, 'Arte'), h('div', { class: 'cfg-opts' }, h('button', { class: 'chip-btn' + (config.pixel !== false ? ' on' : ''), onclick: () => { setConfig('pixel', config.pixel === false); G.pixel = config.pixel !== false; document.body.classList.toggle('cm-pixel', G.pixel); desenha(); } }, config.pixel !== false ? 'Pixel art (nova)' : 'Vetorial (antiga)')),
        t('A arte em pixel é a nova direção do jogo. Chefes e vícios ainda não redesenhados aparecem com a arte antiga reduzida.', 'muted'));
      out.push(h('h4', {}, 'Jogo'), h('div', { class: 'cfg-opts' }, alterna('cinemas', '🎬 Cutscenes'), alterna('tremor', '📳 Tremor da tela'), alterna('numerosDano', '🔢 Números de dano'),
        h('button', { class: 'chip-btn' + (audio.muted ? '' : ' on'), onclick: () => { setMuted(!audio.muted); desenha(); } }, '🔊 Som: ' + (audio.muted ? 'desligado' : 'ligado'))));
      const vistas = (c.data.cinemas || []).filter(id => CINEMAS[id]);
      if (vistas.length) out.push(h('h4', {}, 'Rever cutscenes'), h('div', { class: 'cfg-opts cine-lista' }, vistas.map(id => h('button', { class: 'chip-btn', onclick: () => { close(); G.cinema(id, true); } }, CINEMAS[id].titulo))));
      out.push(h('h4', {}, 'Controles'), t(G.textoControles(), 'muted cm-pre'));
      out.push(h('div', { class: 'btn-row' }, h('button', { class: 'btn danger', onclick: async () => { await G.salvar(); close(); G.onExit(); } }, 'Salvar e sair')));
      return out;
    }
    p.append(h('div', { class: 'p-head' }, h('h3', {}, 'O Caminho'), h('button', { class: 'x', onclick: () => close(), 'aria-label': 'Fechar' }, '✕')), abas, corpo);
    desenha();
  }, { wide: true });
}

// portal de uma semana: as cinco páginas, em ordem
export function escolherFase(G, sem) {
  const c = G.char, prog = faseProg(c, sem.id);
  return G.ui.modal((p, close) => {
    p.classList.add('cm-menu');
    p.append(h('div', { class: 'p-head' }, h('h3', {}, sem.titulo), h('button', { class: 'x', onclick: () => close(), 'aria-label': 'Fechar' }, '✕')),
      h('p', { class: 'muted' }, sem.estudo + ' — ' + sem.resumo), h('p', { class: 'hint' }, '“' + sem.versiculo.texto + '” — ' + sem.versiculo.ref));
    sem.fases.forEach((f, i) => {
      const aberta = i === 0 || prog[sem.fases[i - 1].n]?.done, feita = prog[f.n]?.done;
      p.append(h('button', { class: 'fase-row cm-rel' + (feita ? ' on' : ''), disabled: !aberta, onclick: () => { sfx('gate'); close(); G.entrar(sem.id + ':' + f.n); } },
        h('span', { class: 'cm-ico' }, feita ? '✓' : aberta ? String(f.n) : '🔒'),
        h('div', {}, h('b', {}, f.nome + ' · ' + f.ref), h('small', {}, aberta ? f.licao : 'Vença a página anterior para abrir.'), feita && prog[f.n].best ? h('small', {}, 'Melhor pontuação: ' + prog[f.n].best) : '')));
    });
  }, { wide: true });
}

export function loja(G) {
  const c = G.char, cm = G.cm;
  return G.ui.modal((p, close) => {
    p.classList.add('cm-menu');
    const lista = h('div', {});
    const desenha = () => {
      lista.replaceChildren(h('p', { class: 'muted' }, 'Você tem ' + Math.floor(c.data.gold) + ' denários.'));
      for (const [id, r] of Object.entries(RELIQUIAS)) {
        if (!r.preco) continue;
        const tem = cm.reliquias.includes(id);
        lista.append(h('button', { class: 'fase-row cm-rel' + (tem ? ' on' : ''), disabled: tem || c.data.gold < r.preco, onclick: () => { c.data.gold -= r.preco; cm.reliquias.push(id); if (cm.eq.length < G.espacos()) cm.eq.push(id); sfx('coin'); G.salvar(); desenha(); } },
          h('span', { class: 'cm-ico' }, iconeItem(id, 26)), h('div', {}, h('b', {}, r.nome + (tem ? ' (seu)' : ' — ' + r.preco + ' denários')), h('small', {}, r.desc + ' · ' + r.ref))));
      }
      const preco = 150 + cm.mana * 60;
      lista.append(h('button', { class: 'fase-row cm-rel', disabled: c.data.gold < preco || (cm.manaLoja || 0) >= 3, onclick: () => { c.data.gold -= preco; cm.manaLoja = (cm.manaLoja || 0) + 1; close(); G.ganhar('mana'); } },
        h('span', { class: 'cm-ico' }, iconeItem('mana', 26)), h('div', {}, h('b', {}, 'Porção de maná — ' + preco + ' denários'), h('small', {}, (cm.manaLoja || 0) >= 3 ? 'Acabou. O resto está escondido pelo caminho.' : 'A cada três porções, um fôlego a mais. (' + (3 - (cm.manaLoja || 0)) + ' à venda)'))));
    };
    p.append(h('div', { class: 'p-head' }, h('h3', {}, 'Lídia, vendedora de púrpura'), h('button', { class: 'x', onclick: () => close(), 'aria-label': 'Fechar' }, '✕')),
      h('p', {}, '"O Senhor lhe abriu o coração" (At 16:14). Minha casa é sua casa, peregrino. O que posso lhe oferecer para o caminho?'), lista);
    desenha();
  }, { wide: true });
}
// Jael: duas armas por vocação; cada uma muda alcance, ritmo e força
export function armeiro(G) {
  const c = G.char, cm = G.cm, tipo = G.tipoArma, ops = ARMAS_ALT[tipo] || {};
  cm.armas = cm.armas || {}; cm.armaAlt = cm.armaAlt || {};
  return G.ui.modal((p, close) => {
    p.classList.add('cm-menu'); const lista = h('div', {});
    const usar = id => { cm.armaAlt[c.cls] = id; G.equiparArma(); sfx('click'); G.salvar(); desenha(); };
    const desenha = () => {
      const atual = cm.armaAlt[c.cls] || null; lista.replaceChildren(h('p', { class: 'muted' }, 'Você tem ' + Math.floor(c.data.gold) + ' denários. As armas são da sua vocação (' + (CLASSES[c.cls]?.nome || '') + ').'));
      lista.append(h('button', { class: 'fase-row cm-rel' + (!atual ? ' on' : ''), onclick: () => usar(null) }, h('span', { class: 'cm-ico' }, '·'), h('div', {}, h('b', {}, 'Arma de sempre' + (!atual ? ' (em uso)' : '')), h('small', {}, 'A que você trouxe para o caminho: equilibrada.'))));
      for (const [id, a] of Object.entries(ops)) { const tem = cm.armas[c.cls + ':' + id];
        lista.append(h('button', { class: 'fase-row cm-rel' + (atual === id ? ' on' : ''), disabled: !tem && c.data.gold < a.preco, onclick: () => { if (!tem) { c.data.gold -= a.preco; cm.armas[c.cls + ':' + id] = 1; sfx('coin'); } usar(id); } },
          h('span', { class: 'cm-ico' }, tem ? '✓' : '◆'), h('div', {}, h('b', {}, a.nome + (atual === id ? ' (em uso)' : tem ? ' (sua)' : ' — ' + a.preco + ' denários')), h('small', {}, a.desc + ' · ' + a.ref)))); }
    };
    p.append(h('div', { class: 'p-head' }, h('h3', {}, 'Jael, a armeira'), h('button', { class: 'x', onclick: () => close(), 'aria-label': 'Fechar' }, '✕')),
      h('p', {}, 'Uma estaca e um martelo já resolveram uma guerra (Jz 4:21). Arma boa é a que combina com a mão. Compre uma vez e troque quando quiser.'), lista);
    desenha();
  }, { wide: true });
}
// Dorcas: capuz, capa, túnica e cabelo, a qualquer hora e de graça
export function guardaRoupa(G) {
  const c = G.char, look = c.look = c.look || {}, boneco = novoHeroi(0, 0, 5); boneco.chao = true;
  const ACESS = [['nenhum', 'Sem nada'], ['capuz', 'Capuz'], ['pontudo', 'Capuz pontudo'], ['faixa', 'Faixa na testa'], ['elmo', 'Elmo de couro']];
  const CAPAS = [...LOOK_OPTIONS.cape.filter(x => x !== 'none'), '#8E2B45', '#2E5E44', '#C9A63C', '#17121f', '#E9E6DC', 'none'], TUNICAS = [...LOOK_OPTIONS.tunic, '#8E2B45', '#2F5FB0', '#3F7A4A', '#C9A63C', '#17121f', '#E9E6DC'];
  return G.ui.modal((p, close) => {
    p.classList.add('cm-menu'); const cv = h('canvas', { width: 200, height: 220, class: 'gr-cv' }), g = cv.getContext('2d'), ops = h('div', { class: 'gr-ops' });
    const pinta = () => { g.clearRect(0, 0, 200, 220); g.imageSmoothingEnabled = false; const q = quadroHeroi(boneco, look, c.cls, G.tipoArma, 1.2, G.hab); g.save(); g.translate(100, 200); g.scale(4, 4); g.drawImage(q.tela(), -AX, -AY); g.restore(); };
    const linha = (nome, lista, chave, rot) => { const i = () => Math.max(0, lista.findIndex(x => (x.id || x[0] || x) === (look[chave] || (chave === 'acessorio' ? 'nenhum' : lista[0])))), muda = d => { const k = (i() + d + lista.length) % lista.length, v = lista[k]; look[chave] = v.id || (Array.isArray(v) ? v[0] : v); sfx('click'); desenha(); };
      const v = lista[i()], txt = rot ? rot(v) : null;
      return h('div', { class: 'gr-linha' }, h('b', {}, nome), h('button', { class: 'btn sm', onclick: () => muda(-1), 'aria-label': nome + ': anterior' }, '‹'), txt ? h('span', {}, txt) : h('i', { class: 'gr-cor', style: 'background:' + (v === 'none' ? 'transparent' : v) }), h('button', { class: 'btn sm', onclick: () => muda(1), 'aria-label': nome + ': próximo' }, '›')); };
    const desenha = () => { ops.replaceChildren(linha('Na cabeça', ACESS, 'acessorio', v => v[1]), linha('Capa', CAPAS, 'cape', v => v === 'none' ? 'Sem capa' : null), linha('Túnica', TUNICAS, 'tunic'), linha('Cabelo', LOOK_OPTIONS.style, 'style', v => v.nome), linha('Cor do cabelo', LOOK_OPTIONS.hair, 'hair'), linha('Corpo', LOOK_OPTIONS.body, 'body', v => v.nome), linha('Pele', LOOK_OPTIONS.skin, 'skin')); pinta(); };
    p.append(h('div', { class: 'p-head' }, h('h3', {}, 'Dorcas, a costureira'), h('button', { class: 'x', onclick: () => { G.salvar(); close(); }, 'aria-label': 'Fechar' }, '✕')),
      h('p', {}, 'As viúvas mostravam as túnicas e os vestidos que eu fazia (At 9:39). Escolha com calma; aqui não se paga nada.'), h('div', { class: 'gr' }, cv, ops),
      h('div', { class: 'btn-row' }, h('button', { class: 'btn gold', onclick: () => { G.salvar(); close(); } }, 'Vestir')));
    desenha();
  }, { wide: true });
}
// Noé: um companheiro para o caminho. Caro: é para quem já juntou bastante.
export function petShop(G) {
  const c = G.char, cm = G.cm; cm.pets = cm.pets || {};
  return G.ui.modal((p, close) => {
    p.classList.add('cm-menu'); const lista = h('div', {});
    const desenha = () => {
      lista.replaceChildren(h('p', { class: 'muted' }, 'Você tem ' + Math.floor(c.data.gold) + ' denários. Um companheiro por vez caminha com você.'));
      lista.append(h('button', { class: 'fase-row cm-rel' + (!cm.pet ? ' on' : ''), onclick: () => { cm.pet = null; G.pet = null; G.salvar(); desenha(); } }, h('span', { class: 'cm-ico' }, '·'), h('div', {}, h('b', {}, 'Caminhar sem companheiro' + (!cm.pet ? ' (assim está)' : '')))));
      for (const [id, a] of Object.entries(PETS)) { const tem = cm.pets[id];
        lista.append(h('button', { class: 'fase-row cm-rel' + (cm.pet === id ? ' on' : ''), disabled: !tem && c.data.gold < a.preco, onclick: () => { if (!tem) { c.data.gold -= a.preco; cm.pets[id] = 1; sfx('level'); } cm.pet = id; G.pet = null; G.salvar(); desenha(); } },
          h('span', { class: 'cm-ico' }, tem ? '✓' : '◆'), h('div', {}, h('b', {}, a.nome + (cm.pet === id ? ' (com você)' : tem ? ' (seu)' : ' — ' + a.preco + ' denários')), h('small', {}, a.desc + ' · ' + a.ref)))); }
    };
    p.append(h('div', { class: 'p-head' }, h('h3', {}, 'Noé, criador de animais'), h('button', { class: 'x', onclick: () => close(), 'aria-label': 'Fechar' }, '✕')),
      h('p', {}, 'De tudo o que vive, dois de cada espécie entraram comigo (Gn 6:19). Estes aqui eu criei para acompanhar gente de caminho. Não são baratos: bicho bom dá trabalho.'), lista);
    desenha();
  }, { wide: true });
}
// Samuel: trocar de vocação (a arma muda; o resto do caminho continua seu)
export function trocarVocacao(G) {
  const c = G.char;
  return G.ui.modal((p, close) => {
    p.classList.add('cm-menu'); const lista = h('div', {});
    for (const [id, C] of Object.entries(CLASSES)) lista.append(h('button', { class: 'fase-row cm-rel' + (c.cls === id ? ' on' : ''), onclick: () => { c.cls = id; G.tipoArma = C.arma || 'espada'; G.equiparArma(); const b = document.querySelector('[data-act="skill"]'); if (b) b.dataset.name = C.skill?.nome || 'Verso'; sfx('level'); G.salvar(); close(); G.ui.toast('Agora você caminha como ' + C.nome + '.', 4000); } },
      h('span', { class: 'cm-ico' }, c.cls === id ? '✓' : '·'), h('div', {}, h('b', {}, C.nome + (c.cls === id ? ' (a sua)' : '')), h('small', {}, (C.arma || 'espada') + ' · especial: ' + (C.skill?.nome || 'Verso') + ' · ' + (C.ref || '')))));
    p.append(h('div', { class: 'p-head' }, h('h3', {}, 'Samuel, o que unge'), h('button', { class: 'x', onclick: () => close(), 'aria-label': 'Fechar' }, '✕')),
      h('p', {}, 'O Senhor não vê como vê o homem (1Sm 16:7). O chamado é um só; o jeito de servir pode mudar. Escolha a vocação com que quer caminhar agora; a armadura, as relíquias e o que você aprendeu ficam.'), lista);
  }, { wide: true });
}
// Simão: pesca de barquinho. Lançar, esperar o puxão, e recolher mantendo a linha na faixa certa.
export function pesca(G) {
  const c = G.char, cm = G.cm;
  return G.ui.modal((p, close) => {
    p.classList.add('cm-menu');
    const cv = h('canvas', { width: 520, height: 230, class: 'pesca-cv' }), g = cv.getContext('2d'), msg = h('p', { class: 'muted' }, 'Cada lance custa 5 denários de isca. Toque em LANÇAR; quando a boia afundar, toque em FISGAR; depois segure RECOLHER só enquanto a marca estiver na faixa clara.');
    const botao = h('button', { class: 'btn gold' }, 'Lançar'); let est = 'pronto', t = 0, espera = 0, marca = 0.5, vel = 0, faixa = 0.5, prog = 0, forca = 1, seg = false, vivo = true, ultimo = performance.now();
    const fim = (txt) => { est = 'pronto'; botao.textContent = 'Lançar'; msg.textContent = txt; G.salvar(); };
    const pegou = () => { const r = Math.random(), ds = cm.dons = cm.dons || {};
      if (r < 0.006 && !ds.lingua) { ds.lingua = 1; sfx('level'); return fim('Na boca do peixe, uma LÍNGUA DE FOGO (At 2:3). Com os quatro dons, ela acende o Fogo do Espírito.'); }
      if (r < 0.04) { const falta = ['tornado', 'raios', 'enchente', 'vento', 'vento'].filter(id => (ds[id] || 0) < (DONS[id].partes || 1)); if (falta.length) { const id = falta[Math.floor(Math.random() * falta.length)]; ds[id] = (ds[id] || 0) + 1; if (!cm.dom && G.temDom(id)) cm.dom = id; sfx('level'); return fim('A rede trouxe um DOM: ' + DONS[id].nome + (DONS[id].partes > 1 && ds[id] < DONS[id].partes ? ' (uma das duas metades)' : '') + '. Veja no inventário.'); } }
      if (r < 0.07) { c.data.gold += 120; sfx('coin'); return fim('Um peixe com uma moeda na boca! (Mt 17:27) +120 denários.'); }
      const v = Math.round(12 + forca * 26); c.data.gold += v; cm.peixes = (cm.peixes || 0) + 1; sfx('coin'); if (cm.peixes === 153) G.ovo('rede', 'Cento e cinquenta e três grandes peixes, e a rede não se rompeu (Jo 21:11).'); fim('Pescou um peixe de ' + (forca > 1.6 ? 'bom tamanho' : 'tamanho comum') + ': +' + v + ' denários. (' + cm.peixes + ' peixes)'); };
    botao.onpointerdown = e => { e.preventDefault(); seg = true; if (est === 'pronto') { if (c.data.gold < 5) return (msg.textContent = 'Faltam denários para a isca.'); c.data.gold -= 5; est = 'espera'; espera = 1.2 + Math.random() * 3; t = 0; botao.textContent = 'Fisgar'; msg.textContent = 'A boia está na água…'; sfx('swing'); }
      else if (est === 'espera') fim('Cedo demais: o peixe nem tinha chegado.'); else if (est === 'puxou') { est = 'recolhe'; marca = 0.5; vel = 0; prog = 0.25; forca = 1 + Math.random() * 1.4; faixa = 0.5; botao.textContent = 'Recolher (segure)'; msg.textContent = 'Segure para puxar a marca para cima; solte para ela descer. Mantenha-a na faixa clara.'; } };
    botao.onpointerup = botao.onpointerleave = () => { seg = false; };
    botao.onkeydown = e => { if (e.code === 'Enter' || e.code === 'Space') { e.preventDefault(); if (!seg) botao.onpointerdown(e); } }; botao.onkeyup = () => { seg = false; };
    const laco = agora => { if (!vivo || !cv.isConnected) return; const dt = Math.min(0.05, (agora - ultimo) / 1000); ultimo = agora; t += dt;
      if (est === 'espera' && t > espera) { est = 'puxou'; t = 0; sfx('click'); msg.textContent = 'FISGUE!'; } else if (est === 'puxou' && t > 0.75) fim('O peixe levou a isca.');
      else if (est === 'recolhe') { vel += (seg ? 2.6 : -2.2) * dt; vel *= 0.97; marca = Math.max(0, Math.min(1, marca + vel * dt)); if (marca <= 0 || marca >= 1) vel = 0; faixa = 0.5 + Math.sin(t * forca * 1.3) * 0.3 + Math.sin(t * 3.1) * 0.06; const dentro = Math.abs(marca - faixa) < 0.13; prog += (dentro ? 0.3 : -0.24 * forca) * dt; if (prog >= 1) pegou(); else if (prog <= 0) fim('A linha arrebentou.'); }
      // cena: céu, mar, barquinho, linha e boia
      g.imageSmoothingEnabled = false; g.fillStyle = '#0D1120'; g.fillRect(0, 0, 520, 230); g.fillStyle = '#1E2440'; g.fillRect(0, 60, 520, 50); g.fillStyle = '#E9E6DC'; g.fillRect(420, 24, 16, 16);
      const T2 = agora / 1000, nivel = 120; for (let x = 0; x < 520; x += 4) { const h1 = Math.round(Math.sin(x * 0.03 + T2 * 1.6) * 3 + Math.sin(x * 0.011 - T2) * 3); g.fillStyle = '#123847'; g.fillRect(x, nivel + h1, 4, 230); g.fillStyle = '#3A9AB0'; g.fillRect(x, nivel + h1, 4, 2); }
      const by = nivel - 14 + Math.round(Math.sin(T2 * 1.6 + 2.4) * 3), bx = 110; g.fillStyle = '#17121f'; g.fillRect(bx - 44, by, 88, 16); g.fillStyle = '#6B4A2E'; g.fillRect(bx - 40, by + 2, 80, 10); g.fillRect(bx - 46, by - 2, 8, 6); g.fillRect(bx + 38, by - 2, 8, 6); g.fillStyle = '#17121f'; g.fillRect(bx - 4, by - 26, 10, 26); g.fillStyle = '#497A80'; g.fillRect(bx - 2, by - 22, 6, 20); g.fillStyle = '#C68B59'; g.fillRect(bx - 2, by - 30, 6, 7);
      const fx2 = est === 'pronto' ? bx + 30 : 330, fy = est === 'pronto' ? by - 30 : nivel + (est === 'puxou' ? 8 : est === 'recolhe' ? 4 + Math.round(Math.sin(T2 * 20) * 3) : Math.round(Math.sin(T2 * 3) * 2)); g.strokeStyle = '#C9C3AE'; g.lineWidth = 1; g.beginPath(); g.moveTo(bx + 4, by - 20); g.lineTo(bx + 34, by - 44); g.lineTo(fx2, fy); g.stroke(); g.fillStyle = '#6B4A2E'; g.fillRect(bx + 4, by - 22, 2, 4);
      if (est !== 'pronto') { g.fillStyle = est === 'puxou' ? '#FF4A5A' : '#E2463C'; g.fillRect(fx2 - 3, fy - 4, 7, 7); g.fillStyle = '#fff'; g.fillRect(fx2 - 3, fy - 4, 7, 2); if (est === 'puxou') { g.fillStyle = '#FFE9A8'; g.font = '700 22px Cinzel, serif'; g.fillText('!', fx2 + 10, fy - 10); } }
      if (est === 'recolhe') { g.fillStyle = '#04050A'; g.fillRect(470, 20, 26, 190); g.fillStyle = 'rgba(190,240,248,.45)'; g.fillRect(470, 20 + (1 - faixa - 0.13) * 190, 26, 0.26 * 190); g.fillStyle = '#FFE9A8'; g.fillRect(466, 20 + (1 - marca) * 190 - 3, 34, 6); g.fillStyle = '#04050A'; g.fillRect(40, 208, 400, 10); g.fillStyle = '#9BE0B4'; g.fillRect(40, 208, 400 * Math.max(0, prog), 10); }
      requestAnimationFrame(laco); };
    requestAnimationFrame(laco);
    p.append(h('div', { class: 'p-head' }, h('h3', {}, 'Simão, o pescador'), h('button', { class: 'x', onclick: () => { vivo = false; close(); }, 'aria-label': 'Fechar' }, '✕')),
      h('p', {}, 'Trabalhamos a noite toda e nada apanhamos; mas, sobre a tua palavra, lançarei as redes (Lc 5:5). O barco é pequeno, o mar é fundo. Às vezes ele devolve coisas que ninguém perdeu.'), cv, msg, h('div', { class: 'btn-row' }, botao));
  }, { wide: true });
}
// Tubalcaim: o fio da arma, um degrau por vez
// Mateus guarda os denários: o que está no tesouro não cai com você
export function banco(G) {
  const c = G.char, cm = G.cm;
  return G.ui.modal((p, close) => {
    p.classList.add('cm-menu');
    const lista = h('div', {});
    const move = n => { n = Math.max(-(cm.banco || 0), Math.min(Math.floor(c.data.gold), n)); if (!n) return; c.data.gold -= n; cm.banco = (cm.banco || 0) + n; sfx('coin'); G.salvar(); desenha(); };
    const linha = (rot, sub, n, ok) => h('button', { class: 'fase-row cm-rel', disabled: !ok, onclick: () => move(n) }, h('span', { class: 'cm-ico' }, iconeItem('denarios', 26)), h('div', {}, h('b', {}, rot), h('small', {}, sub)));
    const desenha = () => { const g = Math.floor(c.data.gold), b = cm.banco || 0;
      lista.replaceChildren(h('p', { class: 'muted' }, 'Na bolsa: ' + g + ' denários · No tesouro: ' + b + ' denários.'),
        linha('Guardar 100', 'Do que está na bolsa.', 100, g >= 1), linha('Guardar tudo', g + ' denários vão para a arca.', g, g >= 1),
        linha('Retirar 100', 'De volta para a bolsa.', -100, b >= 1), linha('Retirar tudo', b + ' denários voltam com você.', -b, b >= 1)); };
    p.append(h('div', { class: 'p-head' }, h('h3', {}, 'A Casa do Tesouro'), h('button', { class: 'x', onclick: () => close(), 'aria-label': 'Fechar' }, '✕')),
      h('p', {}, 'Eu me sentava na coletoria quando ele passou e disse: "Segue-me" (Mt 9:9). Hoje conto moedas dos outros sem ficar com nenhuma. O que você guardar aqui não cai no chão quando você cair.'), lista);
    desenha();
  }, { wide: true });
}
export function forja(G) {
  const c = G.char, cm = G.cm;
  return G.ui.modal((p, close) => {
    p.classList.add('cm-menu'); const lista = h('div', {});
    const desenha = () => {
      const fio = cm.fio || 0; lista.replaceChildren(h('p', { class: 'muted' }, 'Você tem ' + Math.floor(c.data.gold) + ' denários. Fio atual: ' + (fio ? FORJA[fio - 1].nome : 'comum') + '.'));
      FORJA.forEach((f, i) => lista.append(h('button', { class: 'fase-row cm-rel' + (i < fio ? ' on' : ''), disabled: i !== fio || c.data.gold < f.preco, onclick: () => { c.data.gold -= f.preco; cm.fio = i + 1; sfx('level'); G.salvar(); desenha(); } },
        h('span', { class: 'cm-ico' }, i < fio ? '✓' : String(i + 1)), h('div', {}, h('b', {}, f.nome + (i < fio ? '' : ' — ' + f.preco + ' denários')), h('small', {}, f.desc + (i > fio ? ' (forje o anterior primeiro)' : ''))))));
    };
    p.append(h('div', { class: 'p-head' }, h('h3', {}, 'Tubalcaim, o ferreiro'), h('button', { class: 'x', onclick: () => close(), 'aria-label': 'Fechar' }, '✕')),
      h('p', {}, 'Bronze e ferro eu conheço desde antes do dilúvio (Gn 4:22). A mão é sua; o fio, eu melhoro. Vale para qualquer arma: espada, funda, cajado, o que você carrega.'), lista);
    desenha();
  }, { wide: true });
}
// O Mercador da primeira página: às vezes traz uma raridade; quase sempre, não.
export function mercador(G, ob) {
  const c = G.char, cm = G.cm, id = G.mercadorTem, R = id && !cm.reliquias.includes(id) ? RELIQUIAS[id] : null;
  if (!R) return G.ui.dialog({ nome: 'Mercador', look: ob.look, texto: 'Hoje não tenho nada que valha o seu caminho, peregrino. Só ídolos de prata, e esses eu não lhe vendo.\n\nVolte outra hora. Às vezes chega um navio de Társis com coisa rara.', acoes: [{ label: 'Voltar depois' }] });
  const pode = c.data.gold >= R.raro;
  return G.ui.dialog({ nome: 'Mercador', look: ob.look, texto: 'Chegou um navio de Társis. Tenho UMA coisa, e não sei quando volto a ter.\n\n' + R.nome.toUpperCase() + ' · ' + R.ref + '\n' + R.desc + '\n\nPreço: ' + R.raro + ' denários. Você tem ' + Math.floor(c.data.gold) + '.',
    acoes: [pode ? { label: 'Comprar', fn: () => { c.data.gold -= R.raro; G.mercadorTem = null; G.ganhar(id); G.salvar(); } } : { label: 'Não tenho o bastante' }, { label: 'Agora não' }] });
}
export const _ = { L, R, U, D };
