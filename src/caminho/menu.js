// Janelas do Caminho: menu de pausa (Jornada, Armadura, Relíquias, Mapa, Bíblia, Ajustes), escolha de página e a loja da Lídia.
import { h } from '../util.js';
import { sfx, setMuted, audio } from '../audio.js';
import { config, setConfig } from '../config.js';
import { CINEMAS } from '../content/cinematicas.js';
import { TODAS } from '../content/index.js';
import { faseProg } from '../game/player.js';
import { L, R, U, D } from './nivel.js';
import { ARMADURA, RELIQUIAS, DIFICULDADES, FORJA } from './dados.js';
import { CLASSES } from '../data/classes.js';
import { ENEMIES, BOSSES } from '../data/bestiary.js';
import { VICIOS } from './bichos.js';
import { quadroVicio } from './pixel/viciospx.js';
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
        quadro('⚔', true, true, () => mostra((cls.nome || 'Peregrino') + ' · ' + (cls.arma || 'espada'), fio ? FORJA[fio - 1].nome : 'Fio comum', (fio ? FORJA[fio - 1].desc : 'Tubalcaim, no Refúgio, pode melhorar o fio da sua arma.') + '\n\nEspecial: ' + (cls.skill?.nome || 'Verso') + '.')),
        quadro('◉', true, false, () => mostra('Denários', Math.floor(c.data.gold) + ' na bolsa', 'Caem dos vícios e dos vasos. Se você cair, a sacola fica no chão até você buscá-la.')),
        quadro('✦', cm.mana > 0, false, () => mostra('Maná escondido', cm.mana + ' porções', 'A cada três porções, um fôlego a mais (Ap 2:17).')),
        quadro('●', cm.pedras > 0, false, () => mostra('Pedras lisas do ribeiro', cm.pedras + ' de 5', 'Com as cinco, o Vale de Elá se abre (1Sm 17:40).'))]);
      sec('Armadura de Deus · ' + Object.keys(cm.hab).length + ' de 6', Object.values(ARMADURA).map(a => quadro(a.icone, cm.hab[a.hab], cm.hab[a.hab], () => mostra(a.nome, a.ref, cm.hab[a.hab] ? a.poder + '\n\n' + a.desc : 'Ainda não é sua. Um chefe de Corinto a guarda.'))));
      const usar = id => { const R = RELIQUIAS[id], on = cm.eq.includes(id); if (R.passiva) return; if (on) cm.eq.splice(cm.eq.indexOf(id), 1); else if (cm.eq.length < G.espacos()) cm.eq.push(id); else return G.ui.toast('Sem espaço: guarde outra relíquia primeiro.'); G.p.vidaMax = G.vidaMax(); G.p.vida = Math.min(G.p.vida, G.p.vidaMax); G.salvar(); desenha(); };
      sec('Relíquias · ' + cm.eq.length + ' de ' + G.espacos() + ' vestidas', cm.reliquias.length ? cm.reliquias.map(id => { const R = RELIQUIAS[id], on = cm.eq.includes(id) || R.passiva; return quadro(R.icone, true, on, () => mostra(R.nome, R.ref + (R.passiva ? ' · sempre ativa' : on ? ' · vestida' : ' · guardada'), R.desc, R.passiva ? '' : h('button', { class: 'btn', onclick: () => usar(id) }, cm.eq.includes(id) ? 'Guardar' : 'Vestir')), () => usar(id)); }) : [h('p', { class: 'muted' }, 'Nenhuma ainda. Vêm dos chefes de Jonas e de Daniel, dos gigantes, da Lídia e, às vezes, do Mercador.')]);
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
      const N = G.N, cv = h('canvas', { width: 560, height: 220, class: 'cm-mapa' }), g = cv.getContext('2d');
      const s = Math.min(540 / N.cols / 30, 200 / N.rows / 17), w = 30 * s, hh = 17 * s, ox = (560 - N.cols * w) / 2, oy = (220 - N.rows * hh) / 2;
      const pc = { x: Math.floor(G.p.x / 32 / 30), y: Math.floor(G.p.y / 32 / 17) };
      for (const cel of N.celulas) {
        const x = ox + cel.cx * w, y = oy + cel.cy * hh;
        g.fillStyle = cel.papel === 'arena' ? '#5E2A2A' : cel.papel === 'rolo' ? '#4A4326' : cel.papel === 'ebenezer' ? '#2E4A46' : '#1F2A38'; g.fillRect(x + 2, y + 2, w - 4, hh - 4);
        g.strokeStyle = '#C9B88A'; g.lineWidth = 1.5; g.strokeRect(x + 2, y + 2, w - 4, hh - 4);
        g.fillStyle = '#C9B88A';
        if (cel.mask & R) g.fillRect(x + w - 3, y + hh * 0.6, 6, 5); if (cel.mask & D) g.fillRect(x + w / 2 - 3, y + hh - 3, 6, 6);
        g.font = '14px sans-serif'; g.textAlign = 'center';
        const ic = cel.papel === 'arena' ? '☠' : cel.papel === 'rolo' ? '📜' : cel.papel === 'ebenezer' ? '🪨' : cel.papel === 'tesouro' ? '✦' : cel.papel === 'inicio' ? '⌂' : '';
        if (ic) g.fillText(ic, x + w / 2, y + hh / 2 + 5);
        if (cel.cx === pc.x && cel.cy === pc.y) { g.strokeStyle = '#FFE9A8'; g.lineWidth = 3; g.strokeRect(x + 4, y + 4, w - 8, hh - 8); }
      }
      return [t(G.def.nome + ' — a sala com a borda clara é onde você está.', 'muted'), cv, t('⌂ início · 📜 rolo · 🪨 Ebenézer · ✦ tesouro · ☠ chefe', 'hint')];
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
      for (const [id, d] of Object.entries(DIFICULDADES)) out.push(h('button', { class: 'fase-row cm-rel' + (cm.dif === id ? ' on' : ''), onclick: () => { cm.dif = id; sfx('click'); G.p.vidaMax = G.vidaMax(); G.p.vida = Math.min(G.p.vida, G.p.vidaMax); G.salvar(); desenha(); } }, h('div', {}, h('b', {}, d.nome + (cm.dif === id ? ' ✓' : '')), h('small', {}, d.desc))));
      const alterna = (k, nome) => h('button', { class: 'chip-btn' + (config[k] !== false ? ' on' : ''), onclick: () => { setConfig(k, config[k] === false); desenha(); } }, nome + ': ' + (config[k] !== false ? 'ligado' : 'desligado'));
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
      lista.replaceChildren(h('p', { class: 'muted' }, 'Você tem ◉ ' + Math.floor(c.data.gold) + ' denários.'));
      for (const [id, r] of Object.entries(RELIQUIAS)) {
        if (!r.preco) continue;
        const tem = cm.reliquias.includes(id);
        lista.append(h('button', { class: 'fase-row cm-rel' + (tem ? ' on' : ''), disabled: tem || c.data.gold < r.preco, onclick: () => { c.data.gold -= r.preco; cm.reliquias.push(id); if (cm.eq.length < G.espacos()) cm.eq.push(id); sfx('coin'); G.salvar(); desenha(); } },
          h('span', { class: 'cm-ico' }, r.icone), h('div', {}, h('b', {}, r.nome + (tem ? ' ✓' : ' — ◉ ' + r.preco)), h('small', {}, r.desc + ' · ' + r.ref))));
      }
      const preco = 150 + cm.mana * 60;
      lista.append(h('button', { class: 'fase-row cm-rel', disabled: c.data.gold < preco || (cm.manaLoja || 0) >= 3, onclick: () => { c.data.gold -= preco; cm.manaLoja = (cm.manaLoja || 0) + 1; close(); G.ganhar('mana'); } },
        h('span', { class: 'cm-ico' }, '🍯'), h('div', {}, h('b', {}, 'Porção de maná — ◉ ' + preco), h('small', {}, (cm.manaLoja || 0) >= 3 ? 'Acabou. O resto está escondido pelo caminho.' : 'A cada três porções, um fôlego a mais. (' + (3 - (cm.manaLoja || 0)) + ' à venda)'))));
    };
    p.append(h('div', { class: 'p-head' }, h('h3', {}, 'Lídia, vendedora de púrpura'), h('button', { class: 'x', onclick: () => close(), 'aria-label': 'Fechar' }, '✕')),
      h('p', {}, '"O Senhor lhe abriu o coração" (At 16:14). Minha casa é sua casa, peregrino. O que posso lhe oferecer para o caminho?'), lista);
    desenha();
  }, { wide: true });
}
// Tubalcaim: o fio da arma, um degrau por vez
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
