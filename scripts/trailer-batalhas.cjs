// Grava as batalhas do trailer quadro a quadro, com o jogo de verdade (nada é montado: é a luta rodando).
// O laço do jogo é parado e cada quadro avança exatamente 1/30 s, então o vídeo sai liso mesmo com a captura lenta.
// Um "bot" joga com os mesmos comandos de quem joga (andar, pular, golpear, passo, lâmpada, especial, dom): lê os avisos
// dos golpes e reage a eles. Também anota tremores, defesas perfeitas e quebrantos para a trilha bater junto.
// Uso: npm run dev (em outro terminal) e depois  node scripts/trailer-batalhas.cjs <pasta de saída>
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const SAIDA = process.argv[2] || path.join(__dirname, 'trailer-quadros');
const FPS = 30;

// as cenas: a mais épica de cada luta, cada uma com uma vocação diferente para mostrar as mecânicas
const CENAS = [
  { area: 'semana-01:1', chefe: 'mamom', cls: 'guerreiro', fase: 0.28, seg: 6.4, golpes: ['moedao', 'avalanche', 'cofre'], titulo: 'MAMOM', sub: 'a moeda gigante rola — pule' },
  { area: 'semana-01:3', chefe: 'mentira', cls: 'profeta', fase: 0.55, seg: 6.4, golpes: ['copias5', 'troca', 'meiaVerdade'], titulo: 'A MENTIRA', sub: 'Profeta · a luz desfaz as cópias' },
  { area: 'semana-01:2', chefe: 'procrastinacao', cls: 'juiz', fase: 0.24, seg: 6.2, golpes: ['relogio4', 'adiar'], titulo: 'PROCRASTINAÇÃO', sub: 'Juiz · o chicote entre os ponteiros' },
  { area: 'mundo:golias', chefe: 'golias', cls: 'pastor', fase: 0.5, seg: 6.8, golpes: ['lanca', 'escudeiro', 'dardo'], titulo: 'GOLIAS', sub: 'Pastor · as Cinco Pedras Lisas' },
  { area: 'semana-03:4', chefe: 'fera', cls: 'valente', fase: 0.45, seg: 6.2, golpes: ['bote', 'garras'], dom: 'tornado', domT: 1.6, titulo: 'A FERA DO CAMPO', sub: 'dom · Redemoinho de fogo (2Rs 2:11)' },
  { area: 'semana-01:5', chefe: 'satanas', cls: 'guerreiro', fase: 0.22, seg: 7.2, golpes: ['dardos', 'abismo', 'leao'], titulo: 'O ACUSADOR', sub: 'erga a lâmpada contra os dardos inflamados' },
  { area: 'semana-03:3', chefe: 'babilonia', cls: 'levita', fase: 0.2, seg: 6.4, golpes: ['vozDoCeu', 'zigurate'], titulo: 'BABILÔNIA', sub: 'Levita · a voz do céu (Dn 4:31)' },
  { area: 'mundo:behemote', chefe: 'behemote', cls: 'zelote', fase: 0.55, seg: 7.2, golpes: ['investida', 'rio', 'cauda'], titulo: 'BEEMOTE', sub: 'Zelote · faça o colosso bater na parede' },
  { area: 'mundo:leviata', chefe: 'leviata', cls: 'valente', fase: 0.28, seg: 7.6, golpes: ['emergir', 'redemoinho', 'tochas'], dom: 'raios', domT: 3.2, titulo: 'LEVIATÃ', sub: 'Valente · espere ele emergir' }
];

(async () => {
  fs.mkdirSync(SAIDA, { recursive: true });
  for (const f of fs.readdirSync(SAIDA)) if (f.endsWith('.jpg')) fs.unlinkSync(path.join(SAIDA, f));
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1.5 });
  await ctx.addInitScript(() => { try { localStorage.setItem('peregrinos.config', JSON.stringify({ cinemas: false, volMusica: 0, volVoz: 0, volEfeitos: 0, esquemaEscolhido: true })); localStorage.setItem('peregrinos.controles', '1'); sessionStorage.setItem('peregrinos.started', '1'); } catch {} });
  const page = await ctx.newPage(); page.setDefaultTimeout(30000); const erros = []; page.on('pageerror', e => erros.push(e.message));
  await page.goto('http://127.0.0.1:5180', { waitUntil: 'domcontentloaded' });
  await page.evaluate(async () => { const { net } = await import('/src/net.js'), { newCharData } = await import('/src/game/player.js'), { defaultLook } = await import('/src/data/classes.js'); const d = newCharData('guerreiro'); d.stats.playtime = 99; d.level = 24; await net.createChar({ name: 'Peregrino', cls: 'guerreiro', look: defaultLook(), data: d }); });
  await page.reload({ waitUntil: 'domcontentloaded' });
  for (let i = 0; i < 25 && !(await page.evaluate(() => !!window.__game?.running)); i++) { await page.waitForTimeout(600); await page.locator('#overlay button, #screens button').first().click({ timeout: 800 }).catch(() => {}); }
  await page.evaluate(async () => {
    const G = window.__game, { CLASSES } = await import('/src/data/classes.js');
    cancelAnimationFrame(G.raf); G.loop = () => {}; // o laço para: cada quadro é avançado à mão
    document.querySelectorAll('#overlay .modal').forEach(x => x.remove()); G.ui.blocking = false;
    G.ui.dialog = async () => {}; G.ui.toast = () => {}; G.cinema = async () => {}; G.perguntaDoChefe = async () => true; G.cm.visto.tut = 99; G.tutEl?.remove();
    Object.assign(G.hab, { asas: true, firmeza: true, lampada: true }); G.cm.dons = { tornado: 1, raios: 1, enchente: 1, vento: 1 };
    const st = document.createElement('style'); st.textContent = '#offlineStatus,#cmTut,.cm-tut,#toasts{display:none!important}'; document.head.append(st);
    // o que a trilha precisa saber, quadro a quadro
    window.quadro = 0; window.eventos = [];
    const tremor = G.tremor.bind(G); G.tremor = a => { if (a >= 5) eventos.push([quadro, 't', a]); return tremor(a); };
    const texto = G.textoEm.bind(G); G.textoEm = (x, y, txt, ...r) => { if (/VIGIAI|QUEBRANTADO|ESTÁ ESCRITO|TONTO/.test(txt)) eventos.push([quadro, 'x', txt]); return texto(x, y, txt, ...r); };
    window.brancos = 0; window.passo = () => { G.update(1 / 30); G.render(); if (G.chefe?.flash > 0) brancos++; quadro++; };
    // o bot joga como gente: decide a cada ~0,15 s (tempo de reação) e segura os comandos entre uma decisão e outra;
    // enquanto o chefe ataca, defende-se (sai das zonas, pula ondas, defende dardos — nem sempre acerta);
    // só entra para bater na brecha (o chefe terminou o golpe, ficou exposto, tonto ou quebrantado), num combo curto, e recua.
    let dec = { mx: 0, ate: -9 }, combo = { n: 0, prox: -9, fim: -9 }, ultPulo = -9, ultVerso = -9, lampAte = -9, domFeito = false, cfg = {};
    const visto = new WeakMap(), viu = (o, T) => { if (!visto.has(o)) visto.set(o, { t: T, reage: Math.random() > 0.12 }); return visto.get(o); }; // às vezes não reage a tempo: leva o golpe
    const caixa = p => ({ x: p.x - 11, y: p.y - 40, w: 22, h: 40 }), toca = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
    G.lerControles = function () {
      const p = G.p, T = G.T, A = G.N.arena, b = G.inimigos.find(e => e.kind === 'chefe' && e.hp > 0 && !e.morrendo), c = { mx: 0, my: 0, pulo: false, puloSeg: true, atk: false, atkSeg: false, dash: false, lampP: false, lamp: false, orar: false, verso: false, interagir: false, dom: false, mira: 0, ladoMouse: 0 };
      if (p.vida <= 1) p.vida = 2; // a cena não termina em morte
      if (T - cfg.t0 < cfg.entrada) { c.mx = 1; G.ctl = c; return; } // entra correndo na arena
      const me = caixa(p); let fugir = 0, urgente = false, pular = false;
      for (const z of G.zonas) {
        if (z.isca && !z.sinal) continue;
        let r; if (z.tipo === 'col') r = { x: z.x - z.w / 2 - 14, y: z.y0 ?? A.y0, w: z.w + 28, h: (z.y1 ?? A.chao) - (z.y0 ?? A.y0) }; else if (z.tipo === 'circ') r = { x: z.x - z.r - 14, y: z.y - z.r, w: z.r * 2 + 28, h: z.r * 2 }; else r = { x: z.x - 10, y: z.y, w: z.w + 20, h: z.h };
        if (!toca(me, r)) continue;
        const v = viu(z, T); if (!v.reage || T - v.t < 0.14) continue;
        if (z.tipo === 'faixa' || (z.tipo === 'muro' && z.h <= 40 && z.y > p.y - 50)) { if ((z.aviso ?? 0) < 0.4 || z.dur > 0.5) pular = true; continue; }
        if (z.tipo !== 'poca' || z.efeito) { const meio = z.tipo === 'col' || z.tipo === 'circ' ? z.x : z.x + z.w / 2; fugir = Math.sign(p.x - meio) || (p.x < (A.x0 + A.x1) / 2 ? 1 : -1); if (p.x < A.x0 + 60) fugir = 1; if (p.x > A.x1 - 60) fugir = -1; urgente = urgente || (z.aviso ?? 0) < 0.3; }
      }
      for (const t of G.tiros) { if (t.amigo) continue; const dx = p.x - t.x, dy = p.y - 22 - t.y, d = Math.hypot(dx, dy), vel = (t.vx * dx + t.vy * dy) / (d || 1); if (d < 130 && vel > 60 && d / vel < 0.24) { const v = viu(t, T); if (!v.reage) continue; if (t.tipo === 'choque') pular = true; else c.lampP = true; } }
      if (b && b.perigo && Math.abs(b.x - p.x) < 260 && Math.sign(b.vx || 0) === Math.sign(p.x - b.x)) { const v = viu(b.mov || b, T); if (v.reage) { if (p.chao && T - ultPulo > 0.4) pular = true; else c.dash = true; } }
      if (b && b.tele > 0 && b.art.lanca === 'prep' && Math.abs(b.x - p.x) < 250) { const v = viu(b.mov, T); if (v.reage && T - v.t > 0.3) c.lampP = true; } // a lança de Golias: a defesa perfeita expõe a testa
      if (b) {
        const longe = ['funda', 'cajado', 'trombeta'].includes(G.tipoArma), alvoY = b.y - b.h * 0.55, dx = b.x - p.x, alc = b.w / 2 + (longe ? 230 : 58);
        const janela = !b.mov || b.exposto > 0 || b.quebrado > 0 || b.tonto > 0;
        if (T >= dec.ate) { // uma decisão nova a cada tempo de reação
          dec.ate = T + 0.12 + Math.random() * 0.1;
          const quer = janela ? alc * 0.75 : (longe ? 290 : 200);
          dec.mx = Math.abs(dx) > quer + 30 ? Math.sign(dx) : Math.abs(dx) < quer - 50 && !janela ? -Math.sign(dx) : 0;
          if (janela && Math.abs(dx) < alc + 30 && combo.n === 0 && T > combo.fim) { combo.n = 2 + (Math.random() < 0.5 ? 1 : 0); combo.prox = T + 0.05; }
          if (janela && (b.exposto > 0 || b.quebrado > 0 || b.tonto > 0) && p.oleo >= 30 && T - ultVerso > 2.5 && Math.abs(dx) < alc + 120) { c.verso = true; ultVerso = T; }
          else if (janela && p.oleo >= 30 && T - ultVerso > 4.5 && Math.random() < 0.35 && Math.abs(dx) < alc + 120) { c.verso = true; ultVerso = T; }
        }
        c.mx = dec.mx; c.ladoMouse = Math.sign(dx) || 1; c.mira = Math.atan2(alvoY - (p.y - 22), dx);
        const alto = alvoY < p.y - 110;
        if (combo.n > 0 && T >= combo.prox) { c.atk = true; combo.n--; combo.prox = T + 0.27 + Math.random() * 0.07; if (combo.n === 0) combo.fim = T + 0.45; if (alto) { c.my = -1; if (p.chao && T - ultPulo > 0.5) pular = true; } }
        if (!janela) combo.n = 0; // o chefe começou outro golpe: larga o combo e se defende
      }
      if (fugir) { combo.n = 0; c.mx = fugir; if (urgente && p.dashCd <= 0) c.dash = true; }
      if (pular && T - ultPulo > 0.25) { c.pulo = true; ultPulo = T; }
      if (!p.chao && T - ultPulo > 0.28 && T - ultPulo < 0.33 && pular) c.pulo = true; // salto duplo
      if (cfg.dom && !domFeito && T - cfg.t0 > cfg.domT) { c.dom = true; domFeito = true; p.oleo = G.oleoMax(); }
      if (c.lampP) lampAte = T + 0.3; c.lamp = T < lampAte; // a defesa perfeita precisa do toque E de segurar a lâmpada
      G.ctl = c;
    };
    window.cena = async o => {
      cfg = { ...o, t0: 0, entrada: 0.7 }; domFeito = false; combo = { n: 0, prox: -9, fim: -9 }; G.char.cls = o.cls; G.tipoArma = CLASSES[o.cls].arma || 'espada'; G.equiparArma(); G.cm.dom = o.dom || null; G.domCd = 0;
      G.chefe = null; G.luta = false; G.venceu = false; G.limparPerigos?.(); G.entrar(o.area, { quieto: true });
      const A = G.N.arena; G.p.x = A.x0 + 40; G.p.y = A.chao - 1; G.p.face = 1; G.p.vx = G.p.vy = 0; G.p.oleo = G.oleoMax(); G.p.vida = G.p.vidaMax; G.fade = 0; G.peso = 0;
      G.inimigos = G.inimigos.filter(e => e.kind === 'chefe'); await G.iniciarLuta(); G.ui.blocking = false; document.querySelectorAll('#overlay .modal').forEach(x => x.remove());
      // a luta começa do começo: vida cheia. Só o repertório de golpes é o da fase que a cena quer mostrar.
      const b = G.chefe; let nf = 0; b.c.fases.forEach((f, i) => { if (o.fase >= f.vida) nf = i; }); b.fase = nf; b.espera = 1.3;
      if (o.golpes) b.c = { ...b.c, fases: b.c.fases.map((f, i) => i === nf ? { ...f, golpes: o.golpes } : f) };
      cfg.t0 = G.T; for (let i = 0; i < 4; i++) { G.update(1 / 30); G.render(); } // a câmera assenta (sem contar quadro: não é gravado)
    };
  });
  const marcas = []; let n = 0;
  const SO = process.env.SO ? process.env.SO.split(',') : null, ESCALA = +(process.env.SEG || 1); // teste rápido: SO=mamom,golias SEG=0.3
  for (const c0 of CENAS.filter(c => !SO || SO.includes(c.chefe))) {
    const c = { ...c0, seg: c0.seg * ESCALA };
    await page.evaluate(o => window.cena(o), c);
    const ini = n;
    for (let f = 0; f < Math.round(c.seg * FPS); f++, n++) {
      await page.evaluate(() => window.passo());
      await page.screenshot({ path: path.join(SAIDA, String(n).padStart(5, '0') + '.jpg'), type: 'jpeg', quality: 93 });
    }
    marcas.push({ ...c, ini, fim: n });
    process.stdout.write(c.chefe + ' ' + (n - ini) + ' quadros\n');
  }
  const eventos = await page.evaluate(() => window.eventos);
  fs.writeFileSync(path.join(SAIDA, 'cenas.json'), JSON.stringify({ fps: FPS, quadros: n, cenas: marcas, eventos, erros }, null, 1));
  console.log(JSON.stringify({ quadros: n, eventos: eventos.length, brancos: await page.evaluate(() => window.brancos), erros: erros.slice(0, 5) }));
  await browser.close();
})().catch(e => { console.log('FALHA', e.message.slice(0, 500)); process.exit(1); });
