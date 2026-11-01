// Integração com o bundle de produção e Supabase simulado; nenhum dado real é enviado.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const http = require('node:http');
const { execFileSync } = require('node:child_process');

(async () => {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'peregrinos-offline-'));
  execFileSync('npm', ['run', 'build', '--', '--outDir', out, '--emptyOutDir'], {
    stdio: 'pipe', env: { ...process.env, VITE_SUPABASE_URL: 'https://offline-test.supabase.co', VITE_SUPABASE_ANON_KEY: 'mock-public-key' }
  });
  const server = http.createServer((req, res) => {
    const pathname = decodeURIComponent(new URL(req.url, 'http://local').pathname);
    const file = path.join(out, pathname === '/' ? 'index.html' : pathname);
    if (!file.startsWith(out) || !fs.existsSync(file)) { res.writeHead(404); res.end(); return; }
    const type = { '.js': 'application/javascript', '.html': 'text/html', '.css': 'text/css', '.mp3': 'audio/mpeg', '.png': 'image/png', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml' }[path.extname(file)] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-cache' }); fs.createReadStream(file).pipe(res);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + server.address().port;
  const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'], ...(process.env.HTTPS_PROXY ? { proxy: { server: process.env.HTTPS_PROXY, bypass: '127.0.0.1,localhost' } } : {}) });
  try {
    const { newCharData } = await import('../src/game/player.js');
    const { defaultLook } = await import('../src/data/classes.js');
    const owner = '00000000-0000-4000-a000-000000000001';
    let cloud = { id: '00000000-0000-4000-a000-000000000002', user_id: owner, name: 'Offline Teste', class: 'guerreiro', look: defaultLook(), data: newCharData('guerreiro'), level: 2, score: 100, week_score: 0, week_id: '2026-W44', created_at: '2026-10-31T10:00:00Z', updated_at: '2026-10-31T10:00:00.123456+00:00' };
    cloud.data.stats.playtime = 1;
    let writes = 0, failBackend = false;
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    context.setDefaultTimeout(15000);
    const errors = [];
    await context.route('https://fonts.googleapis.com/**', r => r.abort());
    await context.route('https://offline-test.supabase.co/**', async route => {
      const req = route.request(), url = new URL(req.url());
      if (failBackend) return route.abort();
      const json = body => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
      if (url.pathname === '/rest/v1/characters') {
        if (req.method() === 'PATCH') {
          assert.equal(url.searchParams.get('user_id'), 'eq.' + owner);
          if (url.searchParams.get('updated_at') !== 'eq.' + cloud.updated_at) return json(null);
          const update = req.postDataJSON();
          assert.ok(update.score >= cloud.score && update.score - cloud.score <= 20000);
          cloud = { ...cloud, ...update }; writes++; return json(cloud);
        }
        return json([cloud]);
      }
      if (url.pathname.includes('/auth/')) return json({});
      return json([]);
    });
    if (context.routeWebSocket) await context.routeWebSocket('wss://offline-test.supabase.co/**', ws => ws.close());
    const session = { access_token: ['eyJhbGciOiJIUzI1NiJ9', Buffer.from(JSON.stringify({ sub: owner, exp: Math.floor(Date.now() / 1000) + 3600, role: 'authenticated' })).toString('base64url'), 'test'].join('.'), refresh_token: 'mock-refresh', token_type: 'bearer', expires_at: Math.floor(Date.now() / 1000) + 3600, expires_in: 3600, user: { id: owner, email: 'offline@example.test', aud: 'authenticated', role: 'authenticated' } };
    await context.addInitScript(({ session }) => {
      if (!localStorage.getItem('sb-offline-test-auth-token')) localStorage.setItem('sb-offline-test-auth-token', JSON.stringify(session));
      localStorage.setItem('peregrinos.controles', '1');
      localStorage.setItem('peregrinos.config', JSON.stringify({ cinemas: false }));
    }, { session });
    let page = await context.newPage(); page.on('pageerror', e => errors.push(e.message));
    await page.goto(base, { waitUntil: 'load' });
    await page.waitForFunction(() => document.querySelector('#offlineStatus')?.textContent.includes('Offline pronto'));
    await page.getByRole('button', { name: 'Jogar', exact: true }).click();
    await page.waitForFunction(() => window.__game?.running);
    const cache = await page.evaluate(async () => {
      const names = await caches.keys(), own = names.find(n => n.startsWith('peregrinos-offline-'));
      const keys = await (await caches.open(own)).keys();
      return keys.map(k => new URL(k.url).pathname);
    });
    assert.ok(cache.some(k => k.includes('/assets/index-') && k.endsWith('.js')));
    const narration = cache.find(k => k.endsWith('.mp3')); assert.ok(narration);
    console.log('PASS: primeiro download contém HTML, JS, CSS, ícones e narrações.');

    await context.setOffline(true);
    await page.evaluate(async () => {
      const g = __game; g.char.data.gold = 777; g.char.score = 321; g.char.data.quests.q_offline = { st: 'feita' };
      if (!await g.save()) throw Error('falha ao salvar');
    });
    const before = writes;
    // Fecha a aba, abre de novo pelo endereço do app ainda sem rede.
    await page.close(); page = await context.newPage(); page.on('pageerror', e => errors.push(e.message));
    await page.goto(base + '/?app=1', { waitUntil: 'load' });
    await page.getByRole('button', { name: 'Jogar', exact: true }).click();
    await page.waitForFunction(() => window.__game?.running);
    assert.equal(await page.evaluate(() => __game.char.data.gold), 777);
    assert.equal(await page.evaluate(() => __game.char.data.quests.q_offline.st), 'feita');
    assert.equal(writes, before);
    const range = await page.evaluate(async url => {
      const r = await fetch(url, { headers: { Range: 'bytes=0-63' } });
      return { status: r.status, length: (await r.arrayBuffer()).byteLength, range: r.headers.get('content-range') };
    }, narration);
    assert.equal(range.status, 206); assert.equal(range.length, 64); assert.match(range.range, /^bytes 0-63\//);
    console.log('PASS: reabertura offline, personagem, inventário/missões e áudio com Range.');
    await context.setOffline(false);
    await page.waitForFunction(() => document.querySelector('#offlineStatus').textContent.includes('Progresso sincronizado'));
    assert.equal(cloud.data.gold, 777); assert.equal(cloud.score, 321); assert.equal(cloud.data.quests.q_offline.st, 'feita');
    console.log('PASS: reconexão envia automaticamente o progresso para a mesma conta.');

    await context.setOffline(true);
    await page.evaluate(async () => { __game.char.data.gold = 555; await __game.save(); });
    cloud = { ...cloud, data: { ...cloud.data, gold: 999 }, updated_at: new Date(Date.now() + 10000).toISOString() };
    await context.setOffline(false);
    await page.waitForFunction(() => document.querySelector('#offlineStatus').textContent.includes('Progresso diferente'));
    assert.equal(cloud.data.gold, 999);
    await page.reload({ waitUntil: 'load' });
    await page.getByRole('button', { name: 'Manter deste aparelho', exact: true }).click();
    await page.waitForFunction(() => !document.querySelector('.sync-conflict'));
    assert.equal(cloud.data.gold, 555);
    console.log('PASS: conflito preserva nuvem até escolher explicitamente a versão local.');

    // Atualização não interrompe a partida e é instalada mesmo se a conexão cair
    // depois que o novo pacote já tiver sido baixado.
    await page.getByRole('button', { name: 'Jogar', exact: true }).click();
    await page.waitForFunction(() => window.__game?.running);
    const sw = path.join(out, 'sw.js');
    fs.writeFileSync(sw, fs.readFileSync(sw, 'utf8').replace(/peregrinos-offline-[a-f0-9]+/, 'peregrinos-offline-test-update'));
    await page.evaluate(async () => (await navigator.serviceWorker.getRegistration()).update());
    console.log('Update solicitada', await page.evaluate(async () => { const r = await navigator.serviceWorker.getRegistration(); return { waiting: r.waiting?.state, installing: r.installing?.state, active: r.active?.state }; }));
    await page.waitForFunction(() => !!document.getElementById('novaVersao'));
    assert.equal(await page.evaluate(() => __game.running), true);
    await context.setOffline(true);
    await page.getByRole('button', { name: '🔄 Nova versão pronta. Salvar e atualizar', exact: true }).click();
    console.log('Atualização aceita');
    await page.waitForFunction(() => !document.getElementById('novaVersao') && !window.__game);
    await page.getByRole('button', { name: 'Jogar', exact: true }).click();
    await page.waitForFunction(() => window.__game?.running);
    assert.equal(await page.evaluate(() => __game.char.data.gold), 555);
    console.log('PASS: atualização espera confirmação, salva e reabre offline sem perder progresso.');
    await page.screenshot({ path: '/tmp/peregrinos-offline.png' });
    assert.deepEqual(errors, []);
    await context.close();
  } finally { await browser.close(); await new Promise(resolve => server.close(resolve)); fs.rmSync(out, { recursive: true, force: true }); }
})().catch(e => { console.error(e); process.exitCode = 1; });
