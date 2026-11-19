// O controlador da fase da célula: o que o Caminho (src/caminho/jogo.js) pergunta ao "evento" quando joga fora do
// mundo normal. Começa direto na página, salva só no aparelho, tem menu próprio e liga o jogo à sala:
//   • rolo aberto → votação da sala inteira (o jogo congela para todos); acertou: o selo acende para quem está na
//     página; errou: monstros para o grupo inteiro (e, em luta, o chefe se cura um pouco);
//   • frutos no chão: o primeiro que pega leva para a célula; somem para todos;
//   • chefe vencido → título épico em pixel (PixelFX) e a próxima página; no fim, DECLARE e o placar da célula.
import { h } from '../util.js';
import { sfx } from '../audio.js';
import { config, setConfig } from '../config.js';
import { T, CW, CH, tileEm, VAZIO, SOLIDO, PONTE } from '../caminho/nivel.js';
import { VICIOS, ehVoador } from '../caminho/bichos.js';
import { abrirVoto } from './votacao.js';
import { pacoteQuiz, apurar } from './rede.js';
import { telaEpica } from './titulo.js';
import { JuntosCelula } from './coop.js';
import { FALSAS } from '../data/bestiary.js';

const FRUTOS_POR_PAGINA = 4;
const fmt = s => { s = Math.round(s); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };

export function criarEvento({ sem, char, rede, salvar, sair, ui }) {
  const d = char.data, E = d.celula = { pagina: 1, chefes: 0, tempo: 0, quedas: 0, fim: false, frutos: 0, ...(d.celula || {}) };
  let G = null, voto = null, mortes0 = 0, hud = null, hudT = 0;
  const pg = () => ({ pagina: E.pagina, chefes: E.chefes, tempo: Math.round(E.tempo), quedas: E.quedas, fim: E.fim });
  const area = n => sem.id + ':' + n;

  // ---------- a sala liga no jogo ----------
  if (rede) {
    rede.aoAviso = txt => ui.toast(txt, 3500);
    rede.aoQuiz = q => mostrarVoto(q);
    rede.aoVotos = vc => voto?.votos(vc);
    rede.aoResultado = m => revelar(m);
    rede.aoFruto = m => sincronizarFrutos(m);
    rede.aoMudar = () => { hudT = 0; if (G?.mp instanceof JuntosCelula) G.mp.sincronizar(); };
    rede.aoJx = m => { if (G?.mp instanceof JuntosCelula && G.running) G.mp.chegouDaSala(m); };
    rede.progresso(pg());
  }

  function mostrarVoto(q) {
    voto?.fechar(); if (G) G.pausaGeral = true; // o tempo congela para todos
    document.body.classList.add('cel-votando');
    voto = abrirVoto({ q, total: rede ? rede.total : 1, onVoto: i => { if (rede) rede.meuVoto(i); else voto.meu = i; } });
    voto.q = q;
  }
  let esperaChefe = null; // o "Está escrito" do chefe: quem é dono da luta espera o resultado da votação da sala
  async function revelar(m) {
    if (m.tipo === 'chefe' && esperaChefe && (!rede || m.dono === rede.id || m.cancelado)) { const r = esperaChefe; esperaChefe = null; setTimeout(() => r(!!m.certo), m.cancelado ? 0 : 5200); }
    const v = voto; if (!v) { aplicar(m); return; }
    if (m.cancelado) { v.fechar(); voto = null; document.body.classList.remove('cel-votando'); if (G) G.pausaGeral = false; return; }
    await v.revelar(m); v.fechar(); if (voto === v) voto = null;
    document.body.classList.remove('cel-votando'); if (G) G.pausaGeral = false;
    aplicar(m);
  }
  // o efeito da votação na MINHA partida
  function aplicar(m) {
    if (!G || !G.running || m.tipo === 'chefe') return; // no chefe, quem aplica é a luta (estaEscrito em jogo.js)
    const st = d.stats;
    if (m.certo) {
      st.quizOk = (st.quizOk || 0) + 1;
      if (G.area === m.area) { const ob = G.objs.find(o => o.tipo === 'rolo' && o.n === m.rolo); const cm = G.cm;
        if (ob && !ob.feito) { ob.feito = true; if (!cm.selos[G.area].includes(ob.n)) cm.selos[G.area].push(ob.n); G.fx.anel(ob.x, ob.y - 30, '#FFE9A8', 120); G.efeito('pilar', ob.x, ob.y); G.ganharOleo(33); G.pontos(80); sfx('key'); G.conferirPorta(); G.salvar();
          G.textoEm(G.p.x, G.p.y - 80, 'SELO ACESO PARA A CÉLULA!', '#FFE9A8', 14); } G.efeito('pilarCeu', G.p.x, G.p.y); G.efeito('cura', G.p.x, G.p.y, 1, { gruda: G.p }); G.clarao = 0.3; }
    } else {
      st.quizErr = (st.quizErr || 0) + 1;
      if (G.area === m.area) { const ob = G.objs.find(o => o.tipo === 'rolo' && o.n === m.rolo); if (ob && (!rede || m.dono === rede.id)) ob.trava = G.T + 6; }
      monstros();
    }
  }
  // errar chama a sombra: vícios em volta de cada peregrino da sala (cada um na sua partida); em luta, o chefe se cura
  function monstros() {
    const p = G.p, N = G.N; if (!G.def?.fase || p.morto) return;
    if (G.luta && G.chefe && !G.chefe.morrendo) { const b = G.chefe; b.hp = Math.min(b.max, b.hp + b.max * 0.08); G.textoEm(b.x, b.y - b.h - 20, 'O ENGANO O FORTALECE', '#FF8A7A', 15); G.tremor?.(10); return; }
    const tipos = G.def.inimigos || ['desanimo'], voadores = Object.keys(VICIOS).filter(ehVoador), n = 3 + (rede && rede.total > 6 ? 1 : 0);
    const cx = Math.floor(p.x / (CW * T)), cy = Math.floor((p.y - 2) / (CH * T)), ox = cx * CW, oy = cy * CH;
    const vazio = (x, y) => tileEm(N, x, y) === VAZIO, chao = (x, y) => { const t = tileEm(N, x, y); return t === SOLIDO || t === PONTE; };
    G.grito?.('A SOMBRA OUVIU O ENGANO!'); sfx('boss'); G.tremor?.(9);
    for (let i = 0, feitos = 0, tent = 0; feitos < n && tent < 80; tent++) {
      const tipo = tipos[i++ % tipos.length], voa = voadores.includes(tipo), tx = ox + 2 + Math.floor(Math.random() * (CW - 4));
      if (Math.abs(tx * T + 16 - p.x) < 110) continue;
      let ty = -1;
      if (voa) { const y = oy + 5 + Math.floor(Math.random() * 5); if (vazio(tx, y) && vazio(tx, y - 1)) ty = y; }
      else for (let y = oy + 15; y > oy + 3; y--) if (vazio(tx, y) && vazio(tx, y - 1) && chao(tx, y + 1)) { ty = y; break; }
      if (ty < 0) continue;
      const v = G.nascer(tipo, tx * T + 16, (ty + 1) * T - (voa ? 16 : 1), false, 1.1); v.stun = 0.6; v.flash = 0.3; v.irado = 6;
      G.efeito('sumico', v.x, v.y - v.h / 2); G.fx.anel(v.x, v.y - v.h / 2, '#FF8A7A', 40); feitos++;
    }
  }

  // ---------- frutos: lugares fixos (os mesmos em todos os aparelhos), no chão de cada sala da página ----------
  function porFrutos(G) {
    const N = G.N, salas = N.celulas.filter(c => c.papel === 'corredor' || c.papel === 'inicio' || c.papel === 'ebenezer').sort((a, b) => a.cx - b.cx);
    const vazio = (x, y) => tileEm(N, x, y) === VAZIO, chao = (x, y) => { const t = tileEm(N, x, y); return t === SOLIDO || t === PONTE; };
    let k = 0;
    for (let i = 0; k < FRUTOS_POR_PAGINA && i < salas.length * 3; i++) {
      const c = salas[i % salas.length], col = [9, 20, 14][Math.floor(i / salas.length) % 3], tx = c.cx * CW + col;
      for (let y = c.cy * CH + 15; y > c.cy * CH + 2; y--) if (vazio(tx, y) && vazio(tx, y - 1) && chao(tx, y + 1)) {
        const chave = G.area + '#' + k; G.objs.push({ tipo: 'frutoCel', x: tx * T + 16, y: (y + 1) * T - 6, k: chave, luz: 70, pego: !!rede?.frutos[chave] || !!(E.frutosSolo || {})[chave] }); k++; break; }
    }
  }
  function sincronizarFrutos(m) {
    if (!G) return;
    for (const ob of G.objs) if (ob.tipo === 'frutoCel' && !ob.pego && rede.frutos[ob.k]) {
      ob.pego = true; G.efeito?.('coleta', ob.x, ob.y - 10);
      if (m && m.k === ob.k) { if (m.nome === char.name && ob.pedido) recompensa(ob); else if (ob.pedido) G.textoEm(ob.x, ob.y - 40, m.nome + ' pegou primeiro!', '#FF8A7A', 12); else G.textoEm(ob.x, ob.y - 40, m.nome + ' pegou', '#9FB8D8', 11); }
    }
    hudT = 0;
  }
  function recompensa(ob) {
    const p = G.p; E.frutos++; sfx('coin'); G.efeito('coleta', ob.x, ob.y - 6); G.fx.anel(ob.x, ob.y - 14, '#FFE9A8', 50);
    if (p.vida < p.vidaMax) { p.vida++; G.textoEm(p.x, p.y - 60, 'FRUTO! +1 fôlego', '#FFE08A', 13); } else { G.ganharOleo(25); G.textoEm(p.x, p.y - 60, 'FRUTO! +azeite', '#FFE08A', 13); }
    G.pontos(30); salvar(char); hudT = 0;
  }

  // ---------- o cartão da sala, no alto da tela ----------
  function pintarHud() {
    if (!hud) { hud = h('button', { id: 'celHud', 'aria-label': 'Placar da célula', onclick: () => placar() }); document.body.append(hud); }
    const tot = rede ? Object.keys(rede.frutos).length : E.frutos, pos = rede ? rede.placar().findIndex(x => x.eu) + 1 : 0;
    hud.replaceChildren(h('b', {}, 'Pág. ' + Math.min(5, E.pagina) + '/5'), h('span', {}, '⏱ ' + fmt(E.tempo)),
      rede ? h('span', {}, '👥 ' + rede.total) : '', rede && pos ? h('span', {}, '🏆 ' + pos + 'º') : '', h('span', {}, '🍇 ' + tot), rede ? h('small', {}, 'sala ' + rede.codigo) : h('small', {}, 'sozinho'));
  }

  async function placar(final) {
    const lista = rede ? rede.placar() : [{ nome: char.name, eu: true, chefes: E.chefes, pagina: E.pagina, tempo: E.tempo, quedas: E.quedas, fim: E.fim, pts: 0, frutos: E.frutos }];
    return ui.modal((p, close) => {
      p.classList.add('cel-placar');
      p.append(h('h2', {}, final ? '🏆 Placar da célula' : '🏆 Placar da sala ' + (rede?.codigo || '')),
        h('p', { class: 'muted' }, 'Quem venceu mais chefes vem primeiro; empatou, vale quem acertou mais votações, caiu menos e foi mais rápido.'),
        h('ol', { class: 'cel-lista' }, ...lista.map((x, i) => h('li', { class: x.eu ? 'eu' : '' }, h('span', { class: 'pos' }, i < 3 ? ['🥇', '🥈', '🥉'][i] : (i + 1) + 'º'), h('b', {}, x.nome),
          h('span', {}, x.fim ? '✦ terminou' : 'pág. ' + Math.min(5, x.pagina)), h('span', {}, '⚔ ' + x.chefes + '/5'), h('span', {}, '⏱ ' + fmt(x.tempo)), h('span', {}, '✝ ' + (x.pts || 0)), h('span', {}, '🍇 ' + (x.frutos || 0)), h('span', {}, '💀 ' + x.quedas)))),
        h('div', { class: 'btn-row' }, h('button', { class: 'btn gold', onclick: () => { sfx('click'); close(); } }, final ? 'Fechar' : 'Voltar ao jogo')));
    }, { wide: true });
  }

  async function convidar() {
    if (!rede) return ui.toast('Você está jogando sozinho. Para jogar com a célula, saia e abra uma sala.', 5000);
    const link = rede.link();
    if (navigator.share) { try { await navigator.share({ title: 'Peregrinos · Jesus me escolheu', text: 'Entra na sala ' + rede.codigo + ' da célula!', url: link }); return; } catch { /* cancelou */ } }
    navigator.clipboard?.writeText(link).then(() => ui.toast('Link copiado! Mande no grupo da célula.', 4000), () => ui.toast(link, 9000));
  }

  function ajustes() {
    return ui.modal((p, close) => {
      p.classList.add('cel-ajustes');
      const faixa = (k, nome, min, txt) => h('label', { class: 'cel-faixa' }, h('b', {}, nome), h('small', {}, txt), h('input', { type: 'range', min, max: 100, step: 5, value: Math.round((config[k] ?? 1) * 100), oninput: e => setConfig(k, +e.target.value / 100) }));
      p.append(h('h2', {}, '⚙ Ajustes'),
        faixa('alphaControles', '👆 Transparência dos botões (celular)', 15, 'Mais para a esquerda = botões mais transparentes. Eles continuam funcionando.'),
        faixa('volMusica', '🎵 Música', 0, ''), faixa('volEfeitos', '🔔 Efeitos', 0, ''), faixa('volVoz', '🎙 Narração', 0, ''),
        h('div', { class: 'btn-row' }, h('button', { class: 'btn gold', onclick: () => { sfx('click'); close(); } }, 'Pronto')));
    }, { wide: false });
  }

  return {
    sem,
    inicio(g) {
      G = g; if (rede) { g.mp = new JuntosCelula(g, rede); rede.coop = true; } // todos na mesma luta
      const cm = g.cm; cm.dif = 'celula'; cm.difEscolhida = 1; cm.visto = { ...cm.visto, intro: 1, tut: 99, bosque: 1 };
      mortes0 = cm.mortes || 0;
      if (E.fim) E.pagina = 1;
      return area(Math.min(5, E.pagina));
    },
    entrou(g, id) { G = g; if (!id.startsWith(sem.id)) return; E.pagina = +id.split(':')[1]; porFrutos(g); rede?.progresso(pg()); hudT = 0; },
    tick(g, dt) {
      G = g; rede?.tick(g, dt);
      if (!g.ui.blocking && !g.pausaGeral && !E.fim) E.tempo += dt;
      if ((g.cm.mortes || 0) !== mortes0) { E.quedas += (g.cm.mortes || 0) - mortes0; mortes0 = g.cm.mortes || 0; rede?.progresso(pg()); }
      if ((hudT -= dt) <= 0) { hudT = 1; pintarHud(); if (rede && Math.random() < 0.2) rede.progresso(pg()); }
    },
    fantasmas(g) { return rede && !g.mp ? rede.fantasmas(g.area) : []; },
    salvar() { return salvar(char); },
    async quizRolo(g, q, ob, titulo) {
      const pac = pacoteQuiz(q);
      if (rede && rede.rede) { rede.pedirVotacao(pac, { area: g.area, rolo: ob.n, titulo }); return; }
      // sozinho: a mesma votação, com um voto só
      const z = { id: 'solo', q: pac.q, op: pac.op, quem: char.name, titulo, resta: 20000 }; mostrarVoto(z);
      const meu = await new Promise(r => { const t0 = Date.now(), iv = setInterval(() => { if (voto?.meu != null || Date.now() - t0 > 20000) { clearInterval(iv); r(voto?.meu ?? -1); } }, 100); });
      const n = pac.op.map((_, i) => i === meu ? 1 : 0), ap = apurar(n, pac.certa);
      await revelar({ id: 'solo', n, votos: pac.op.map((_, i) => i === meu ? [char.name] : []), certa: pac.certa, venc: ap.venc, certo: ap.certo, empate: false, porque: pac.porque, area: g.area, rolo: ob.n, dono: -1 });
    },
    // "Está escrito": a pergunta (ou a mentira do chefe) vira votação da sala; vale para a luta de todos
    votoChefe(g, pacote, b) {
      let pac;
      if (pacote.q) pac = pacoteQuiz(pacote.q);
      else { const a = pacote.acc, falsas = [...(pacote.falsas || []), ...FALSAS.filter(f => !(pacote.falsas || []).includes(f))].slice(0, 3); pac = pacoteQuiz({ q: 'A MENTIRA: "' + a.lie + '" — o que está escrito?', a: ['"' + a.v + '" (' + a.ref + ')', ...falsas.map(f => '"' + f + '"')], porque: a.ref + ': ' + a.v }); }
      return new Promise(res => {
        esperaChefe = res; setTimeout(() => { if (esperaChefe === res) { esperaChefe = null; res(false); } }, 75000); // a sala caiu no meio: a luta não fica presa
        const titulo = 'ESTÁ ESCRITO · ' + b.d.nome;
        if (rede && rede.rede) { if (!rede.pedirVotacao(pac, { area: g.area, rolo: -1, tipo: 'chefe', titulo })) { esperaChefe = null; res(false); } return; }
        const z = { id: 'solo-chefe', q: pac.q, op: pac.op, quem: char.name, titulo, tipo: 'chefe', resta: 20000 }; mostrarVoto(z);
        const t0 = Date.now(), iv = setInterval(() => { if (voto?.meu != null || Date.now() - t0 > 20000) { clearInterval(iv); const meu = voto?.meu ?? -1, n = pac.op.map((_, i) => i === meu ? 1 : 0), ap = apurar(n, pac.certa);
          revelar({ id: 'solo-chefe', tipo: 'chefe', n, votos: pac.op.map((_, i) => i === meu ? [char.name] : []), certa: pac.certa, venc: ap.venc, certo: ap.certo, empate: false, porque: pac.porque, area: g.area, rolo: -1, dono: -1 }); } }, 100);
      });
    },
    pegarFruto(g, ob) {
      if (rede && rede.rede) { rede.pedirFruto(ob.k); setTimeout(() => { if (!ob.pego) ob.pedido = false; }, 3000); return; }
      (E.frutosSolo = E.frutosSolo || {})[ob.k] = 1; ob.pego = true; recompensa(ob);
    },
    // PixelFX nos momentos fortes: a entrada do chefe e a queda dele em cadeia de explosões e luz
    chefeEntrou(g, b) { g.efeito('fumacaNegra', b.x, b.y - 30); g.efeito('baque', b.x, b.y); g.tremor?.(14); g.clarao = 0.35; },
    async explosao(g, b) { const pts = [[-30, -60], [26, -90], [-10, -120], [34, -40], [0, -70]];
      for (let i = 0; i < pts.length; i++) { const [dx, dy] = pts[i]; g.efeito(i % 2 ? 'critico' : 'explosaoFogo', b.x + dx, b.y + dy); g.tremor?.(10); sfx('boss'); await new Promise(r => setTimeout(r, 160)); }
      g.efeito('almas', b.x, b.y); g.efeito('pilarCeu', b.x, b.y); g.clarao = 0.6; },
    async venceu(g, b) {
      await this.explosao(g, b).catch(() => {});
      const n = g.def.fase.n, f = g.def.fase; E.chefes = Math.max(E.chefes, n); E.pagina = n + 1;
      if (n >= sem.fases.length) E.fim = true;
      salvar(char); rede?.progresso(pg()); rede?.aviso('⚔ ' + char.name + ' venceu ' + b.d.nome + '!');
      await telaEpica({ linhas: ['JESUS ME', f.nome.replace(/^Ele me /i, '').toUpperCase()], topo: 'PÁGINA ' + n + ' DE 5 · ' + b.d.nome.toUpperCase() + ' CAIU', sub: f.ref.toUpperCase(), texto: f.versiculo.texto + ' (' + f.versiculo.ref + ')', min: 1600 });
      if (!E.fim) { g.entrar(area(n + 1)); return; }
      await g.cinema('celula-escolheu-fim', true);
      await telaEpica({ linhas: ['DEUS NÃO ERROU', 'AO ME ESCOLHER!'], topo: 'DECLARE', sub: 'ELE ESTÁ COMIGO EM CADA PASSO', texto: 'Você terminou em ' + fmt(E.tempo) + ', com ' + E.quedas + ' quedas e ' + E.frutos + ' frutos. ' + sem.declare, min: 2500, dica: 'toque para ver o placar' });
      await placar(true);
      const r = await ui.dialog({ nome: 'Fim da fase da célula', texto: 'Escolhido, amado, formado, capacitado e enviado.\n\nQuer jogar de novo para melhorar o tempo? (O placar guarda o melhor.)', acoes: [{ label: 'Jogar de novo' }, { label: 'Sair' }] });
      if (r === 'Jogar de novo') { E.melhor = Math.min(E.melhor || 1e9, E.tempo); Object.assign(E, { pagina: 1, chefes: 0, tempo: 0, quedas: 0, fim: false }); g.cm.selos = {}; g.cm.feitas = {}; salvar(char); g.entrar(area(1)); }
      else sair();
    },
    menu(g) {
      return ui.dialog({ nome: '☰ ' + sem.titulo, texto: 'Página ' + Math.min(5, E.pagina) + ' de 5 · ⏱ ' + fmt(E.tempo) + ' · ' + (rede ? 'sala ' + rede.codigo + ' (' + rede.total + ' na sala)' : 'jogando sozinho') + '\n\n' + (g.def.fase?.objetivo || ''),
        acoes: [{ label: '▶ Continuar' }, { label: '🏆 Placar', fn: () => placar() }, { label: '🔗 Convidar', fn: () => convidar() }, { label: '⚙ Ajustes', fn: () => ajustes() }, { label: '🎮 Controles', fn: () => ui.dialog({ nome: 'Como jogar', texto: g.textoControles(), acoes: [{ label: 'Entendi' }] }) },
          ...(g.chefe ? [{ label: '💡 Dica do chefe', fn: () => ui.dialog({ nome: g.chefe.d.nome, texto: g.chefe.c.dica || '', acoes: [{ label: 'Entendi' }] }) }] : []), { label: '🚪 Sair da sala', fn: () => sair() }] });
    },
    fim() { hud?.remove(); hud = null; voto?.fechar(); document.body.classList.remove('cel-votando'); }
  };
}
