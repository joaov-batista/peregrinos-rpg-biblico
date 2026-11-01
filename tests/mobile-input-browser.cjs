// Contatos reais via CDP: joystick + ações, incluindo toque entre quadros.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium', headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
    ...(process.env.HTTPS_PROXY ? { proxy: { server: process.env.HTTPS_PROXY, bypass: '127.0.0.1,localhost' } } : {})
  });
  try {
    const context = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
    const page = await context.newPage(), errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.route('https://fonts.googleapis.com/**', r => r.abort());
    await page.goto(process.argv[2] || 'http://127.0.0.1:5180', { waitUntil: 'domcontentloaded' });
    await page.evaluate(async () => {
      const { net } = await import('/src/net.js'), { newCharData } = await import('/src/game/player.js'), { defaultLook } = await import('/src/data/classes.js');
      const data = newCharData('guerreiro'); data.stats.playtime = 1;
      await net.createChar({ name: 'Teste multitoque', cls: 'guerreiro', look: defaultLook(), data });
      sessionStorage.setItem('peregrinos.started', '1'); localStorage.setItem('peregrinos.controles', '1');
      localStorage.setItem('peregrinos.config', JSON.stringify({ cinemas: false }));
    });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'Jogar', exact: true }).click();
    await page.waitForFunction(() => window.__game?.running);
    await page.evaluate(async () => {
      __game.running = false;
      window.I = (await import('/src/input.js')).input; I.clear();
      window.ghostMouse = 0;
      document.querySelector('canvas#cv').addEventListener('mousedown', () => ghostMouse++);
    });
    const cdp = await context.newCDPSession(page);
    const touch = (type, points) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: points.map(p => ({ ...p, radiusX: 3, radiusY: 3, force: 1 })) });
    const point = async (act, id = 2, offset = 0) => {
      const b = await page.locator('[data-act=' + act + ']').boundingBox();
      return { id, x: b.x + b.width / 2 + offset, y: b.y + b.height / 2 };
    };
    const move = { id: 1, x: 110, y: 285 };
    await touch('touchStart', [move]); move.x = 170; await touch('touchMove', [move]);
    assert.equal(await page.evaluate(() => I.move().x), 1);
    // Soltar escudo antes de o jogo atualizar ainda deve produzir defesa.
    const shield = await point('defend');
    await touch('touchStart', [move, shield]); await touch('touchEnd', [shield]);
    assert.equal(await page.evaluate(() => { __game.updatePlayer(.016); return __game.p.guard && __game.p.moving; }), true);
    assert.equal(await page.evaluate(() => { __game.updatePlayer(.016); return __game.p.guard; }), false);
    console.log('OK: andar + toque rápido no escudo entre quadros');

    await page.evaluate(() => { __game.p.dodgeCd = .05; __game.p.sta = 100; });
    const dodge = await point('dodge');
    await touch('touchStart', [move, dodge]); await touch('touchEnd', [dodge]);
    assert.equal(await page.evaluate(() => { __game.updatePlayer(.016); return __game.p.dodgeT > 0; }), false);
    assert.equal(await page.evaluate(() => { __game.updatePlayer(.05); return __game.p.dodgeT > 0 && __game.p.dvx > 0 && __game.p.sta < 100; }), true);
    console.log('OK: esquiva andando aguarda fim do intervalo e gasta fôlego');

    await page.evaluate(() => { __game.p.dodgeT = 0; __game.p.hp = 10; __game.p.itemCd = 0; });
    const bread = await point('item1');
    await touch('touchStart', [move, bread]); await touch('touchEnd', [bread]);
    assert.deepEqual(await page.evaluate(() => { __game.updatePlayer(.016); return { healed: __game.p.hp >= 55, bread: __game.char.data.inv.pao, moving: __game.p.moving }; }), { healed: true, bread: 3, moving: true });
    await page.evaluate(() => __game.updatePlayer(.016));
    assert.equal(await page.evaluate(() => __game.char.data.inv.pao), 3);
    console.log('OK: pão andando cura e consome exatamente uma unidade');

    // Três dedos: soltar uma das duas pressões no escudo não cancela a outra.
    const shield2 = await point('defend', 3, 10);
    await touch('touchStart', [move, shield]); await touch('touchStart', [move, shield, shield2]);
    await touch('touchEnd', [shield]);
    assert.equal(await page.evaluate(() => I.isHeld('defend') && I.move().x === 1 && document.querySelector('[data-act=defend]').classList.contains('down')), true);
    await touch('touchEnd', [shield2]);
    assert.equal(await page.evaluate(() => I.isHeld('defend')), false);
    await touch('touchEnd', []);
    assert.equal(await page.evaluate(() => ghostMouse), 0);
    console.log('OK: dedos independentes, sem ataque fantasma do joystick');

    // Interrupção do app limpa os contatos e o visual, inclusive comandos pendentes.
    await touch('touchStart', [move, shield]);
    await page.evaluate(() => dispatchEvent(new Event('blur')));
    assert.equal(await page.evaluate(() => I.held.size === 0 && I.pressed.size === 0 && I.stick.id === null && !document.querySelector('.act.down') && !document.querySelector('#stick.on')), true);
    await touch('touchEnd', []);
    await touch('touchStart', [move, shield]); await touch('touchCancel', []);
    assert.equal(await page.evaluate(() => I.held.size === 0 && I.stick.id === null && !I.consume('defend')), true);
    console.log('OK: cancelamento/interrupção limpa controles');

    await page.keyboard.down('ShiftLeft'); await page.keyboard.down('ShiftRight'); await page.keyboard.up('ShiftLeft');
    assert.equal(await page.evaluate(() => I.isHeld('defend')), true);
    await page.keyboard.up('ShiftRight');
    assert.equal(await page.evaluate(() => I.isHeld('defend')), false);
    // Área inteira do botão, texto central inclusive, abre o diálogo real.
    for (const [rx, ry] of [[.5, .5], [.08, .2], [.92, .2], [.08, .8], [.92, .8]]) {
      await page.evaluate(() => {
        const g = __game, n = g.npcs.find(n => n.id === 'jonas');
        g.p.x = n.x - 20; g.p.y = n.y; g.updateInteract();
      });
      const b = await page.locator('#aInteract').boundingBox();
      const t = { id: 2, x: b.x + b.width * rx, y: b.y + b.height * ry };
      assert.equal(await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.id, t), 'aInteract');
      await touch('touchStart', [t]); await touch('touchEnd', [t]);
      await page.evaluate(() => __game.updateInteract());
      assert.equal(await page.evaluate(() => __game.ui.blocking), true);
      await page.evaluate(() => { __game.ui.closeAll(); });
      await page.waitForFunction(() => !document.querySelector('#overlay .modal'));
    }
    console.log('OK: falar tocando centro e quatro cantos do botão');

    await page.evaluate(async () => {
      const { SEMANA_ATUAL } = await import('/src/content/index.js');
      const g = __game; g.enterFase(SEMANA_ATUAL, 1); g.ui.closeAll();
      g.p.x = g.chests[0].x; g.p.y = g.chests[0].y; g.updateInteract();
    });
    await page.waitForFunction(() => !document.querySelector('#overlay .modal'));
    const chest = await point('interact');
    await touch('touchStart', [chest]); await touch('touchEnd', [chest]);
    await page.evaluate(() => __game.updateInteract());
    await page.getByText('Baú da Fase 1', { exact: true }).waitFor();
    await page.evaluate(() => { __game.ui.closeAll(); __game.updateFase(.016); });
    await page.waitForFunction(() => !document.querySelector('#overlay .modal'));
    console.log('OK: abrir baú tocando no texto central');

    await page.locator('#bQuestToggle').tap();
    assert.equal(await page.locator('#missionDetails').isVisible(), false);
    assert.equal(await page.locator('#bQuestToggle').getAttribute('aria-expanded'), 'false');
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('peregrinos.config')).esconderMissao), true);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'Jogar', exact: true }).click();
    await page.waitForFunction(() => window.__game?.running);
    assert.equal(await page.locator('#missionDetails').isVisible(), false);
    await page.locator('#bQuestToggle').tap();
    assert.equal(await page.locator('#bQuestToggle').getAttribute('aria-expanded'), 'true');
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('peregrinos.config')).esconderMissao), false);
    console.log('OK: recolher/mostrar missão; preferência mantida ao reabrir');
    assert.deepEqual(errors, []);
    console.log('OK: teclado com duas teclas de defesa; sem erros no navegador');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
