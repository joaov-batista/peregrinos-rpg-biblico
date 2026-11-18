// Rodar com o servidor de desenvolvimento ligado (npm run dev): node tests/moedas-juntos-browser.cjs
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1280, height: 720 } });
  await ctx.route('https://fonts.googleapis.com/**', r => r.abort());
  await ctx.addInitScript(() => { localStorage.setItem('peregrinos.config', JSON.stringify({ cinemas: false, volMusica: 0, volVoz: 0, volEfeitos: 0 })); localStorage.setItem('peregrinos.controles', '1'); sessionStorage.setItem('peregrinos.started', '1'); });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://127.0.0.1:5180', { waitUntil: 'domcontentloaded' });
  await p.evaluate(async () => { const { net } = await import('/src/net.js'), { newCharData } = await import('/src/game/player.js'), { defaultLook } = await import('/src/data/classes.js'); const d = newCharData('guerreiro'); d.stats.playtime = 1; await net.createChar({ name: 'Moeda', cls: 'guerreiro', look: defaultLook(), data: d }); });
  await p.reload({ waitUntil: 'domcontentloaded' });
  for (let i = 0; i < 20 && !(await p.evaluate(() => !!window.__game?.running)); i++) { await p.waitForTimeout(700); await p.locator('#overlay button, #screens button').first().click({ timeout: 1000 }).catch(() => {}); }
  const r = await p.evaluate(async () => {
    const g = __game, espera = ms => new Promise(r => setTimeout(r, ms)), res = {}, enviados = [];
    const { Juntos } = await import('/src/caminho/juntos.js');
    g.ui.closeAll?.(); g.entrar('semana-01:1', { quieto: true }); await espera(300); g.ui.closeAll?.(); const A = g.N.arena; g.p.x = A.x0 + 200; g.p.y = A.chao - 2; await g.iniciarLuta(); g.ui.closeAll?.();
    const b = g.chefe; b.mov = null; b.espera = 999;
    // 1) convidado: a zona chega pela rede JÁ ATIVA (aviso negativo) — a moeda precisa nascer mesmo assim, uma vez só
    g.mp = { souDono: false, acompanhado: () => true, fx() {}, ev: (t, o) => enviados.push([t, o]), gasta() {}, tick() {}, naArea: () => [], vivosNaArena: () => true, alvo: (e, p) => p, sair() {}, mudouArea() {} };
    g.zonas.push(JSON.parse(JSON.stringify({ tipo: 'col', x: A.x0 + 600, w: 50, aviso: -0.05, dur: 0.3, cor: '#FFD23F', tentacao: true, cid: 'teste-1', nid: 77 })));
    await espera(150); res.nasceuJaAtiva = g.moedas.filter(m => m.cid === 'teste-1').length;
    g.zonas.push(JSON.parse(JSON.stringify({ tipo: 'col', x: A.x0 + 600, w: 50, aviso: -0.05, dur: 0.3, cor: '#FFD23F', tentacao: true, cid: 'teste-1', nid: 78 }))); // a mesma zona de novo, noutro retrato
    await espera(150); res.naoDuplicou = g.moedas.filter(m => m.cid === 'teste-1').length === 1;
    // 2) a Ganância recolheu a moeda no aparelho do dono: chega o aviso pela rede e ela some aqui
    const J = Object.create(Juntos.prototype); J.G = g; J.pares = new Map([['dono', {}]]); J.souDono = false; J.eu = 'eu';
    J.receber({ t: 'mc', a: g.area, de: 'dono', id: 'teste-1' }); await espera(80);
    res.sumiuNoConvidado = g.moedas.every(m => m.cid !== 'teste-1');
    // e não renasce se a zona ainda vier num retrato atrasado
    g.zonas.push({ tipo: 'col', x: A.x0 + 600, w: 50, aviso: -0.05, dur: 0.3, cor: '#FFD23F', tentacao: true, cid: 'teste-1', nid: 79 }); await espera(150);
    res.naoRenasceu = g.moedas.every(m => m.cid !== 'teste-1');
    // 3) no dono: quando a Ganância recolhe, avisa todos
    g.mp.souDono = true; enviados.length = 0; g.moedas.push({ x: b.x + 4, y: A.chao - 6, vx: 0, vy: 0, t: 1, v: 5, maldita: true, cid: 'teste-2' });
    const { ESTILOS } = await import('/src/caminho/estilos.js'); ESTILOS.mamom.mover(g, b, 1 / 60);
    res.donoAvisou = enviados.some(([t, o]) => t === 'mc' && o.id === 'teste-2'); res.sumiuNoDono = g.moedas.every(m => m.cid !== 'teste-2');
    // 4) quem apanha uma moeda maldita também avisa todos
    enviados.length = 0; g.moedas.push({ x: g.p.x, y: g.p.y - 20, vx: 0, vy: 0, t: 1, v: 5, maldita: true, cid: 'teste-3' }); await espera(100);
    res.apanharAvisa = enviados.some(([t, o]) => t === 'mc' && o.id === 'teste-3');
    g.mp = null; return res;
  });
  console.log(JSON.stringify(r, null, 1), errs);
  await b.close();
})();
