// Bundle de produção: entrada do app instalado, cache offline e multitoque.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');

(async () => {
  const root = path.resolve('dist');
  const server = http.createServer((req, res) => {
    const pathname = new URL(req.url, 'http://local').pathname;
    const file = path.join(root, pathname === '/' ? 'index.html' : pathname);
    if (!file.startsWith(root + '/') || !fs.existsSync(file)) { res.writeHead(404); res.end(); return; }
    const type = { '.js': 'application/javascript', '.html': 'text/html', '.css': 'text/css', '.webmanifest': 'application/manifest+json', '.mp3': 'audio/mpeg', '.png': 'image/png', '.svg': 'image/svg+xml' }[path.extname(file)] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-cache' }); fs.createReadStream(file).pipe(res);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + server.address().port;
  const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'], ...(process.env.HTTPS_PROXY ? { proxy: { server: process.env.HTTPS_PROXY, bypass: '127.0.0.1,localhost' } } : {}) });
  try {
    const { newCharData } = await import('../src/game/player.js'), { defaultLook } = await import('../src/data/classes.js');
    const data = newCharData('guerreiro'); data.stats.playtime = 1;
    const character = { id: 'mobile-pwa', name: 'Teste PWA', cls: 'guerreiro', look: defaultLook(), data, level: 1, score: 0, week_score: 0 };
    const context = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
    await context.route('https://fonts.googleapis.com/**', r => r.abort());
    await context.addInitScript(character => {
      if (!localStorage.getItem('peregrinos.local.v1')) localStorage.setItem('peregrinos.local.v1', JSON.stringify({ chars: [character] }));
      sessionStorage.setItem('peregrinos.started', '1'); localStorage.setItem('peregrinos.controles', '1');
      if (!localStorage.getItem('peregrinos.config')) localStorage.setItem('peregrinos.config', JSON.stringify({ cinemas: false }));
    }, character);
    let page = await context.newPage();
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.goto(base + '/?app=1', { waitUntil: 'load' });
    await page.waitForFunction(() => document.querySelector('#offlineStatus')?.textContent.includes('Offline pronto'));
    await context.setOffline(true); await page.close();
    page = await context.newPage(); page.on('pageerror', e => errors.push(e.message));
    await page.goto(base + '/?app=1', { waitUntil: 'load' });
    assert.equal(await page.evaluate(() => !!navigator.serviceWorker.controller), true);
    await page.getByRole('button', { name: 'Jogar', exact: true }).click();
    await page.waitForFunction(() => window.__game?.running);
    await page.evaluate(() => { __game.running = false; });
    const cdp = await context.newCDPSession(page);
    const touch = (type, points) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: points.map(p => ({ ...p, radiusX: 3, radiusY: 3, force: 1 })) });
    const walk = { id: 1, x: 110, y: 285 };
    await touch('touchStart', [walk]); walk.x = 170; await touch('touchMove', [walk]);
    const tap = async act => {
      const b = await page.locator('[data-act=' + act + ']').boundingBox();
      const t = { id: 2, x: b.x + b.width / 2, y: b.y + b.height / 2 };
      await touch('touchStart', [walk, t]); await touch('touchEnd', [t]);
    };
    await tap('defend');
    assert.equal(await page.evaluate(() => { __game.updatePlayer(.016); return __game.p.guard && __game.p.moving; }), true);
    await page.evaluate(() => { __game.p.dodgeCd = 0; __game.p.sta = 100; });
    await tap('dodge');
    assert.equal(await page.evaluate(() => { __game.updatePlayer(.016); return __game.p.dodgeT > 0 && __game.p.dvx > 0; }), true);
    await page.evaluate(() => { __game.p.dodgeT = 0; __game.p.hp = 10; __game.p.itemCd = 0; });
    await tap('item1');
    assert.equal(await page.evaluate(() => { __game.updatePlayer(.016); return __game.p.hp >= 55 && __game.char.data.inv.pao === 3; }), true);
    await page.evaluate(() => {
      const g = __game, n = g.npcs.find(n => n.id === 'jonas');
      g.p.x = n.x - 20; g.p.y = n.y; g.updateInteract();
    });
    await tap('interact');
    await page.evaluate(() => __game.updateInteract());
    assert.equal(await page.evaluate(() => __game.ui.blocking), true);
    await touch('touchEnd', []);
    await page.evaluate(() => { __game.ui.closeAll(); });
    await page.waitForFunction(() => !document.querySelector('#overlay .modal'));
    await page.locator('#bQuestToggle').tap();
    assert.equal(await page.locator('#missionDetails').isVisible(), false);
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('peregrinos.config')).esconderMissao), true);
    assert.deepEqual(errors, []);
    console.log('OK: PWA de produção reaberto offline; andar + escudo/esquiva/pão/falar; recolher missão');
  } finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
})().catch(e => { console.error(e); process.exitCode = 1; });
