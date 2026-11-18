// Rodar com o servidor de desenvolvimento ligado (npm run dev): node tests/chefes-juntos-browser.cjs
// Um aparelho convidado: não roda a IA do chefe; recebe zonas e dardos copiados (como pela rede) e aplica no seu peregrino.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1280, height: 720 } });
  await ctx.route('https://fonts.googleapis.com/**', r => r.abort());
  await ctx.addInitScript(() => { localStorage.setItem('peregrinos.config', JSON.stringify({ cinemas: false, volMusica: 0, volVoz: 0, volEfeitos: 0 })); localStorage.setItem('peregrinos.controles', '1'); sessionStorage.setItem('peregrinos.started', '1'); });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://127.0.0.1:5180', { waitUntil: 'domcontentloaded' });
  await p.evaluate(async () => { const { net } = await import('/src/net.js'), { newCharData } = await import('/src/game/player.js'), { defaultLook } = await import('/src/data/classes.js'); const d = newCharData('guerreiro'); d.stats.playtime = 1; await net.createChar({ name: 'Convidado', cls: 'guerreiro', look: defaultLook(), data: d }); });
  await p.reload({ waitUntil: 'domcontentloaded' });
  for (let i = 0; i < 20 && !(await p.evaluate(() => !!window.__game?.running)); i++) { await p.waitForTimeout(700); await p.locator('#overlay button, #screens button').first().click({ timeout: 1000 }).catch(() => {}); }
  const r = await p.evaluate(async () => {
    const g = __game, espera = ms => new Promise(r => setTimeout(r, ms)), res = {};
    const luta = async (area, id) => { g.mp = null; g.ui.closeAll?.(); g.chefe = null; g.luta = false; g.venceu = false; g.entrar(area, { quieto: true }); await espera(300); g.ui.closeAll?.(); const A = g.N.arena; g.p.x = A.x0 + 300; g.p.y = A.chao - 2; await g.iniciarLuta(); g.ui.closeAll?.();
      g.mp = { souDono: false, acompanhado: () => true, fx() {}, ev() {}, gasta() {}, tick() {}, naArea: () => [], vivosNaArena: () => true, alvo: (e, p) => p, sair() {} }; // agora este aparelho é convidado
      const b = g.chefe; b.mov = null; b.espera = 999; return b; };
    const chega = (lista, o) => lista.push(JSON.parse(JSON.stringify(o))); // o que a rede entrega: cópia sem referências
    const quadros = async n => { for (let i = 0; i < n; i++) { await espera(16); g.ui.closeAll?.(); } };
    // Jugo: a corrente prende o convidado
    let b = await luta('semana-03:2', 'jugo'); const A = g.N.arena; g.p.inv = 0; g.p.x = b.x - 120; g.p.y = A.chao;
    chega(g.zonas, { tipo: 'circ', x: g.p.x, y: g.p.y - 20, r: 64, aviso: 0.05, dur: 0.3, cor: '#8A7A6A', efeito: 'amarra', dur2: 3, nid: 901 }); b.cen.amarra = 1;
    await quadros(20); res.amarrado = g.amarra > 0; g.p.x = b.x - 500; await quadros(3); res.distanciaPresa = Math.round(Math.abs(g.p.x - b.x));
    // Jugo: a canga pesa
    const peso0 = g.peso || 0; g.p.inv = 0; chega(g.zonas, { tipo: 'col', x: g.p.x, w: 70, y0: A.chao - 220, aviso: 0.05, dur: 0.3, cor: '#8A5A3A', efeito: 'canga', nid: 902 }); await quadros(20); res.canga = (g.peso || 0) > peso0;
    // Violência: o dardo de corrente puxa
    g.amarra = 0; g.p.inv = 0; g.p.x = A.x0 + 200; g.p.vx = 0; chega(g.tiros, { x: g.p.x + 60, y: g.p.y - 20, vx: -300, vy: 0, r: 9, vida: 2, cor: '#B8B0A0', tipo: 'lanca', fura: true, puxa: { x: A.x1 - 100, forca: 600 }, nid: 903 }); await quadros(12); res.puxadoPeloDardo = g.p.vx > 100;
    // Mentira: a troca de lugar
    await quadros(30); g.p.vx = 0; g.p.inv = 0; const alvo = A.x1 - 150; chega(g.zonas, { tipo: 'circ', x: g.p.x, y: g.p.y - 20, r: 64, aviso: 0.05, dur: 0.2, cor: '#C79BFF', efeito: 'troca', tx: alvo, nid: 904 }); await quadros(20); res.trocou = Math.abs(g.p.x - alvo) < 60; res.xTroca = Math.round(g.p.x - alvo);
    // Mentira: palavra torta (inverte)
    g.p.inv = 0; g.invertido = 0; chega(g.zonas, { tipo: 'circ', x: g.p.x, y: g.p.y - 20, r: 70, aviso: 0.05, dur: 0.25, cor: '#C79BFF', efeito: 'inverte', nid: 905 }); await quadros(20); res.invertido = g.invertido > 0;
    // Fugitivo: o convés inclinado faz o convidado escorregar
    b = await luta('semana-02:1', 'fuga'); g.p.inv = 9; g.p.x = g.N.arena.cx; const x0 = g.p.x; b.cen.incl = 0.8; await quadros(40); res.escorregou = g.p.x - x0 > 10;
    // Desespero: as paredes do ventre empurram o convidado
    b = await luta('semana-02:3', 'desespero'); const A2 = g.N.arena; b.cen.aperto = 0.2; g.p.x = A2.x0 + 20; await quadros(5); res.paredeEmpurrou = g.p.x > A2.x0 + (A2.x1 - A2.x0) * 0.2;
    return res;
  });
  console.log(JSON.stringify(r, null, 1), errs);
  await b.close();
})();
