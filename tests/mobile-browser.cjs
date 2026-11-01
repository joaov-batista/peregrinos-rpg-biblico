const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
(async () => {
  const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'], ...(process.env.HTTPS_PROXY ? { proxy: { server: process.env.HTTPS_PROXY, bypass: '127.0.0.1,localhost' } } : {}) });
  try {
    const results = {};
    for (const mode of ['before', 'after']) {
      const context = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
      context.setDefaultTimeout(20000);
      await context.route('https://fonts.googleapis.com/**', r => r.abort());
      if (mode === 'before') for (const file of ['src/game/game.js', 'src/game/world.js']) {
        const body = execFileSync('git', ['show', 'HEAD:' + file], { encoding: 'utf8' });
        await context.route('**/' + file + '*', r => r.fulfill({ contentType: 'application/javascript', body }));
      }
      const page = await context.newPage(), errors = [];
      page.on('pageerror', e => errors.push(e.message));
      await page.goto('http://127.0.0.1:5180', { waitUntil: 'domcontentloaded' });
      await page.evaluate(async () => {
        const { net } = await import('/src/net.js');
        const { newCharData } = await import('/src/game/player.js');
        const { defaultLook } = await import('/src/data/classes.js');
        const data = newCharData('guerreiro'); data.stats.playtime = 1;
        const c = await net.createChar({ name: 'Teste Nitidez', cls: 'guerreiro', look: defaultLook(), data });
        sessionStorage.setItem('peregrinos.started', '1'); localStorage.setItem('peregrinos.controles', '1');
        localStorage.setItem('peregrinos.config', JSON.stringify({ cinemas: false, atmosfera: false }));
      });
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.getByRole('button', { name: 'Jogar', exact: true }).click();
      await page.waitForFunction(() => window.__game?.running);
      results[mode] = await page.evaluate(() => {
        const g = __game; g.running = false; g.T = 1;
        g.enemies = Array.from({ length: 500 }, (_, i) => g.makeEnemy('preguica', 100 + i % 30 * 90, 100 + Math.floor(i / 30) * 90));
        let drawn = 0; const original = g.drawEnt;
        g.drawEnt = function (...args) { drawn++; return original.apply(this, args); };
        for (let i = 0; i < 3; i++) g.render();
        const times = []; drawn = 0;
        for (let i = 0; i < 30; i++) { const start = performance.now(); g.render(); times.push(performance.now() - start); }
        times.sort((a, b) => a - b);
        const chunks = [...g.cur.map.cache.values()];
        return { dpr: g.DPR, canvas: [g.cv.width, g.cv.height], css: [g.W, g.H], mapScale: g.cur.map.cacheScale || 1,
          cachedBytes: chunks.reduce((sum, c) => sum + c.width * c.height * 4, 0), enemiesDrawnPerFrame: drawn / 30, medianRenderMs: times[15] };
      });
      await page.screenshot({ path: '/tmp/peregrinos-mobile-' + mode + '.png' });
      if (mode === 'after') {
        assert.equal(results.after.dpr, 3); assert.equal(results.after.canvas[0], 844 * 3);
        assert.ok(results.after.mapScale >= 3); assert.ok(results.after.cachedBytes <= 64 * 1024 * 1024);
        // Rotação recria o canvas na mesma densidade; voltar não acumula chunks de outra escala.
        await page.setViewportSize({ width: 390, height: 844 });
        await page.evaluate(() => { __game.resize(); __game.render(); });
        assert.equal(await page.evaluate(() => __game.cv.width), 390 * 3);
        await page.setViewportSize({ width: 844, height: 390 });
        await page.evaluate(() => { __game.resize(); __game.render(); });
        assert.equal(await page.evaluate(() => __game.cv.width), 844 * 3);
        // O ajuste econômico é explícito, e a preferência persiste.
        await page.evaluate(async () => { const { setConfig } = await import('/src/config.js'); setConfig('imagemNitida', false); __game.resize(); __game.render(); });
        assert.equal(await page.evaluate(() => __game.DPR), 2);
        assert.equal(await page.evaluate(() => __game.cur.map.cacheScale), 1);
      }
      assert.deepEqual(errors, []); await context.close();
    }
    assert.ok(results.after.enemiesDrawnPerFrame < results.before.enemiesDrawnPerFrame / 10);
    console.log(JSON.stringify(results, null, 2));
    console.log('PASS: densidade 3x, mapa nítido, rotação, limite de memória e modo econômico. Tempos medidos em Chromium emulado, não em celular físico.');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
