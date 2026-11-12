// Grava o trailer: um "bot" joga cenas curtas enquanto cartões de texto passam por cima.
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1, recordVideo: { dir: __dirname + '/trailer', size: { width: 1280, height: 720 } } });
  const t0 = Date.now(), page = await ctx.newPage(); page.setDefaultTimeout(20000); const erros = []; page.on('pageerror', e => erros.push(e.message));
  await page.addInitScript(() => { try { localStorage.setItem('peregrinos.config', JSON.stringify({ cinemas: false })); } catch {} });
  await page.goto('http://127.0.0.1:5180'); await page.getByRole('button', { name: /Começar a jornada/ }).click();
  await page.getByRole('heading', { name: 'Escolha sua vocação' }).waitFor(); await page.getByRole('button', { name: /Continuar/ }).click(); await page.getByRole('button', { name: /Continuar/ }).click();
  await page.getByRole('textbox', { name: 'Nome do peregrino' }).fill('Peregrino'); await page.getByRole('button', { name: /Começar a jornada/ }).click();
  await page.waitForFunction(() => window.__game?.running); await page.waitForTimeout(500);
  await page.evaluate(() => {
    const G = window.__game; document.querySelectorAll('#overlay .modal').forEach(x => x.remove()); G.ui.blocking = false;
    G.ui.dialog = async () => {}; G.ui.quiz = async () => true; G.ui.verseBattle = async () => true; G.ui.cinema = async () => {}; G.ui.toast = () => {}; G.cm.visto.tut = 99; G.hab.asas = true;
    const st = document.createElement('style'); st.textContent = `#offlineStatus,#cmMenu,#banner{display:none!important}
      #tr{position:fixed;inset:0;z-index:9999;pointer-events:none;display:grid;place-items:center;text-align:center;font-family:Cinzel,serif;color:#fff}
      #tr .preto{position:absolute;inset:0;background:#05060B;opacity:0;transition:opacity .5s}
      #tr .c{position:relative;opacity:0;transform:translateY(10px);transition:opacity .45s,transform .45s}
      #tr .c.on{opacity:1;transform:none}
      #tr small{display:block;font-size:19px;letter-spacing:.34em;text-transform:uppercase;text-shadow:0 2px 12px #000,0 0 22px #000;margin-top:10px;color:#E9E6DC}
      #tr b{display:block;font-size:92px;font-weight:600;letter-spacing:.16em;padding-left:.16em;text-shadow:0 0 18px rgba(255,255,255,.75),0 0 60px rgba(200,215,255,.5),0 4px 24px #000}
      #tr .logo b{font-size:104px} #tr .logo svg{width:420px;height:auto;filter:drop-shadow(0 0 8px rgba(255,255,255,.8))} #tr i{display:block;font-style:normal;font-size:17px;letter-spacing:.5em;margin-top:14px;color:#C9CCDA}`;
    document.head.append(st);
    const tr = document.createElement('div'); tr.id = 'tr'; tr.innerHTML = '<div class="preto"></div><div class="c"></div>'; document.body.append(tr);
    window.cartao = (grande, pequeno, preto) => { const c = tr.querySelector('.c'); c.classList.remove('on', 'logo'); tr.querySelector('.preto').style.opacity = preto ? 1 : 0; if (grande == null) return; setTimeout(() => { c.innerHTML = '<b>' + grande + '</b><small>' + (pequeno || '') + '</small>'; c.classList.add('on'); }, 180); };
    window.logoFinal = () => { const c = tr.querySelector('.c'); tr.querySelector('.preto').style.opacity = 1; c.className = 'c logo'; c.innerHTML = '<b>PEREGRINOS</b><svg viewBox="0 0 320 34"><g fill="none" stroke="#fff" stroke-width="1.4" stroke-linecap="round"><path d="M160 6l7 11-7 11-7-11z"/><path d="M150 17H96c-14 0-20-9-12-14 7-4 13 4 6 8"/><path d="M170 17h54c14 0 20-9 12-14-7-4-13 4-6 8"/><path d="M96 17c-10 0-18 6-30 6S44 17 30 17H6"/><path d="M224 17c10 0 18 6 30 6s22-6 36-6h24"/></g></svg><i>O CAMINHO</i><small>A Bíblia, jogada. Jogue agora.</small>'; setTimeout(() => c.classList.add('on'), 400); };
    // o bot: vai até o adversário mais próximo, golpeia, pula, usa o passo e o especial
    window.bot = (o = {}) => { G.lerControles = () => { const p = G.p, f = Math.floor(G.T * 60), vivos = G.inimigos.filter(e => e.hp > 0 && !e.morrendo).sort((a, b) => Math.abs(a.x - p.x) - Math.abs(b.x - p.x)), e = vivos[0];
      const dx = e ? e.x - p.x : (o.anda || 1) * 300, alc = (e ? e.w / 2 : 0) + 70, perto = e && Math.abs(dx) < alc && e.y - p.y > -150 && e.y - p.y < 60, acima = e && perto && e.y < p.y - 70;
      const dardo = G.tiros.find(t => !t.amigo && Math.abs(t.x - p.x) < 56 && Math.abs(t.y - (p.y - 28)) < 50);
      G.ctl = { mx: perto ? (f % 50 < 6 ? -Math.sign(dx) : 0) : Math.sign(dx), my: acima ? -1 : (!p.chao && perto && e.y > p.y - 20 ? 1 : 0), pulo: f % 64 === 0 || (acima && f % 30 === 0) || (!!p.parede && p.chao), puloSeg: true,
        atk: !!e && Math.abs(dx) < alc + 40 && f % 13 === 0, atkSeg: false, dash: f % 150 === 90, lampP: !!dardo || (o.lamp && f % 170 === 60), lamp: o.lamp && f % 170 > 60 && f % 170 < 100, orar: false, verso: p.oleo >= 33 && f % 200 === 150, interagir: false }; if (o.inv !== false) p.inv = Math.max(p.inv, 0.3); if (p.vida < 4) p.vida = p.vidaMax; }; };
    window.cena = async (area, o = {}) => { G.entrar(area, { quieto: true }); G.fade = 0.6; G.p.oleo = G.oleoMax(); const A = G.N.arena;
      if (o.chefe && A) { G.p.x = A.x0 + 150; G.p.y = A.chao - 1; G.vista.cam.x = A.x0; await new Promise(r => setTimeout(r, 900)); if (G.chefe) { G.chefe.espera = 0.3; if (o.vida) G.chefe.hp = G.chefe.max * o.vida; } }
      if (o.camara != null) { const c = G.N.celulas.filter(q => q.papel === 'corredor')[o.camara]; G.p.x = (c.cx * 30 + 6) * 32; G.p.y = (c.cy * 17 + 16) * 32 - 1; G.vista.cam.x = c.cx * 30 * 32; if (G.emb) G.emb.t = 0.1; }
      window.bot(o); };
  });
  const ini = (Date.now() - t0) / 1000;
  const E = (fn, ...a) => page.evaluate(fn, ...a), espera = ms => page.waitForTimeout(ms);
  // 1 — abertura em preto
  await E(() => { window.cartao('Há um Livro', 'que foi esquecido', true); }); await espera(3200);
  // 2 — o Refúgio
  await E(() => window.cena('refugio', { lamp: true })); await E(() => window.cartao('CAMINHE', 'com uma lâmpada para os pés')); await espera(4300);
  // 3 — a emboscada
  await E(() => window.cena('semana-01:1', { camara: 0 })); await E(() => window.cartao(null)); await espera(1500); await E(() => window.cartao('ENFRENTE', 'os vícios que guardam cada página')); await espera(3200); await E(() => window.cartao(null)); await espera(2600);
  // 4 — a vigília
  await E(() => { const G = window.__game; window.cena('refugio', { inv: false }); G.cm.visto.tut = 7; G.tutDardo = 0.4; G.p.x += 260; }); await E(() => window.cartao('VIGIE', 'a defesa é só no instante certo')); await espera(5200); await E(() => { window.__game.cm.visto.tut = 99; });
  // 5 — o mar
  await E(() => window.cena('semana-02:2', { camara: 1 })); await E(() => window.cartao('ATRAVESSE', 'a tempestade de Jonas')); await espera(5200);
  // 6 — as sombras
  const chefes = [['semana-01:1', 0.63, 'VENÇA', 'as sombras de Corinto'], ['semana-01:3', 1], ['semana-02:2', 0.63, 'RESISTA', 'ao Pavor, à Mentira, à Soberba'], ['semana-03:3', 1], ['semana-03:4', 0.63], ['mundo:golias', 1, 'DESAFIE', 'os gigantes'], ['mundo:behemote', 1], ['mundo:leviata', 1]];
  for (const [area, vida, g, pq] of chefes) { await E(() => window.cartao(null)); await E(([a, v]) => window.cena(a, { chefe: true, vida: v }), [area, vida]); if (g) await E(([g, pq]) => window.cartao(g, pq), [g, pq]); await espera(g ? 3900 : 3100); }
  // 7 — o título
  await E(() => window.logoFinal()); await espera(5600);
  const fim = (Date.now() - t0) / 1000;
  await ctx.close(); const video = await page.video().path(); await browser.close();
  console.log(JSON.stringify({ video, ini, fim, erros: erros.slice(0, 4) }));
})().catch(e => { console.log('FALHA', e.message.slice(0, 400)); process.exit(1); });
