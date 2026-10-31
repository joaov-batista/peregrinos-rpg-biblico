const { chromium } = require('playwright');
const assert = require('node:assert/strict');

(async () => {
  const url = process.argv[2] || 'http://127.0.0.1:5180';
  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium', headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
    ...(process.env.HTTPS_PROXY ? { proxy: { server: process.env.HTTPS_PROXY, bypass: '127.0.0.1,localhost' } } : {})
  });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  const errors = [], failedLocal = [], externalFailures = new Set();
  page.on('pageerror', e => errors.push(e.message));
  page.on('requestfailed', r => {
    const target = new URL(r.url());
    if (target.origin === url) {
      if (r.failure()?.errorText !== 'net::ERR_ABORTED') failedLocal.push(target.pathname + ': ' + r.failure()?.errorText);
    } else externalFailures.add(target.hostname);
  });
  page.on('response', r => {
    if (r.status() >= 400 && new URL(r.url()).origin === url) failedLocal.push(new URL(r.url()).pathname + ': ' + r.status());
  });
  try {
    const response = await page.goto(url, { waitUntil: 'domcontentloaded' });
    assert.equal(response.status(), 200);
    assert.equal(await page.title(), 'Peregrinos');
    await page.getByRole('button', { name: 'Começar a jornada', exact: true }).click();
    await page.getByRole('heading', { name: 'Escolha sua vocação' }).waitFor();
    await page.getByRole('button', { name: 'Continuar', exact: true }).click();
    await page.getByRole('heading', { name: 'Dê forma ao seu peregrino' }).waitFor();
    await page.getByRole('button', { name: 'Continuar', exact: true }).click();
    await page.getByRole('textbox', { name: 'Nome do peregrino' }).fill('Teste Nuvem');
    await page.getByRole('button', { name: 'Começar a jornada', exact: true }).click();
    await page.waitForFunction(() => window.__game?.running);
    await page.getByRole('button', { name: /Pular/ }).click();
    await page.getByRole('button', { name: 'Entendi, vamos jogar!' }).click();
    await page.getByRole('button', { name: 'Vamos lá!' }).click();
    const before = await page.evaluate(() => ({ x: __game.p.x, y: __game.p.y, t: __game.T }));
    await page.keyboard.down('d');
    await page.waitForFunction(({ x, y }) => Math.hypot(__game.p.x - x, __game.p.y - y) > 8, before);
    await page.keyboard.up('d');
    await page.keyboard.press('j');
    await page.waitForFunction(() => __game.p.combo > 0);
    await page.getByRole('button', { name: 'Menu', exact: true }).click();
    await page.getByRole('heading', { name: 'Personagem', exact: true }).waitFor();
    await page.getByRole('button', { name: 'Ajuda', exact: true }).click();
    await page.getByRole('button', { name: 'Salvar e sair', exact: true }).click();
    await page.getByRole('button', { name: 'Jogar', exact: true }).waitFor();
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('peregrinos.local.v1')));
    assert.equal(saved.chars.length, 1);
    assert.equal(saved.chars[0].name, 'Teste Nuvem');
    assert.ok(saved.chars[0].data.stats.playtime > 0);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'Jogar', exact: true }).click();
    await page.waitForFunction(() => window.__game?.running && __game.T > 0);
    assert.equal(await page.evaluate(() => __game.char.name), 'Teste Nuvem');
    await page.getByRole('button', { name: 'Menu', exact: true }).click();
    await page.getByRole('button', { name: 'Missões', exact: true }).click();
    await page.getByRole('heading', { name: 'Sua jornada — desafio crescente' }).waitFor();
    await page.getByRole('button', { name: 'Fechar', exact: true }).click();
    const mechanics = await page.evaluate(async () => {
      const { blocks, tickExpedition, expeditionInteractions } = await import('/src/game/expeditions.js');
      const { SEMANA_ATUAL } = await import('/src/content/index.js');
      const { validarChefe } = await import('/src/game/bossMoves.js');
      const { BOSSES } = await import('/src/data/bestiary.js');
      const { T, TS } = await import('/src/game/world.js');
      const G = window.__game, passed = [];
      const check = (ok, name) => { if (!ok) throw new Error(name); passed.push(name); };
      G.running = false; G.ui.closeAll();
      for (const [id, b] of Object.entries(BOSSES)) if (b.fases) check(validarChefe(id, b).length === 0, 'dados válidos: ' + id);
      let b = G.makeBoss('leviata', G.p.x + 100, G.p.y);
      G.enemies = [b]; const hp = b.hp;
      G.hit(b, 99999, 0, 0, 40); check(b.hp === hp, 'Leviatã imune a ataque comum');
      G.hit(b, 1, 0, 0, 0, 'reflect'); check(b.hp < hp, 'jato refletido fere Leviatã');
      const hp2 = b.hp; G.hit(b, 1, 0, 0, 0, 'spear'); check(b.hp < hp2, 'lança temporária fere Leviatã');
      b = G.makeBoss('behemote', G.p.x + 100, G.p.y); G.enemies = [b];
      for (let i = 0; i < 8; i++) G.hit(b, 1, 0, 0, 40);
      check(b.shellOpen === 6, 'oito impactos abrem a carcaça');
      const open = G.dmgCalc(2, b).dmg; b.shellOpen = 0;
      check(open > G.dmgCalc(2, b).dmg, 'carcaça reduz dano até quebrar');
      G.char.data.quests.q_leviata = { st: 'ativa', n: 0 };
      const m = G.cur.map;
      let water;
      for (let y = 30; y < 64 && !water; y++) for (let x = 128; x < 160 && !water; x++) if (m.get(x,y) === T.WATER && !blocks(G, { id: 'leviata' }, x*TS+16, y*TS+16, 9)) water = { x:x*TS+16, y:y*TS+16 };
      check(!!water, 'mar navegável');
      G.p.boat = true; Object.assign(G.p, water);
      check(!blocks(G, G.p, water.x, water.y, 9), 'barco atravessa água');
      G.p.inv = 0; G.p.dodgeT = 1; G.p.hp = G.st.maxHp;
      G.damagePlayer(1, { id:'leviata', x:water.x+100, y:water.y }); check(G.p.boat, 'esquiva protege barco');
      G.p.dodgeT = 0; G.p.guard = false;
      G.damagePlayer(1, { id:'leviata', x:water.x+100, y:water.y }); check(!G.p.boat && G.p.swimming, 'golpe derruba do barco');
      G.spears = { n:3, until:G.T-1 }; tickExpedition(G, 0.1); check(!G.spears, 'lanças expiram');
      G.p.inv = 0; G.p.hp = G.st.maxHp; G.char.data.gold = 321;
      G.damagePlayer(99999, { id:'mamom', x:G.p.x+100, y:G.p.y }); check(G.char.data.gold === 0, 'Mamom rouba todo o ouro ao matar');
      G.ui.closeAll(); G.p.dead = false; G.p.hp = G.st.maxHp;
      G.char.data.secrets = []; delete G.char.data.quests.q_ecos; delete G.char.data.quests.q_lampada;
      for (let n = 1; n <= 5; n++) {
        G.enterFase(SEMANA_ATUAL, n); G.ui.closeAll();
        const spot = G.chests[G.chests.length-1]; Object.assign(G.p, { x:spot.x, y:spot.y });
        const interactions = []; expeditionInteractions(G, (o,d,label,fn) => interactions.push({label,fn}));
        const secret = interactions.find(x => x.label.includes('inscrição')); check(!!secret, 'easter egg na fase ' + n); secret.fn(); G.ui.closeAll();
        const again = []; expeditionInteractions(G, (o,d,label) => again.push(label)); check(!again.some(x => x.includes('inscrição')), 'eco não repete recompensa ' + n);
      }
      check(G.char.data.inv.selo_vigilia === 1 && G.char.data.inv.sandalias_viajante === 1, 'duas recompensas secretas');
      G.enterWorld(false); G.ui.closeAll(); G.p.inv = 999; G.p.dodgeT = 0;
      for (const [id, def] of Object.entries(BOSSES)) {
        if (!def.golpes) continue;
        for (const move of Object.keys(def.golpes)) {
          const boss = G.makeBoss(id, G.p.x + 120, G.p.y); boss.engaged = true; boss._intro = true;
          boss.act = move; boss.step = 0; boss.stepT = 0;
          G.enemies = [boss]; G.tele = []; G.hazards = []; G.projs = [];
          for (let frame = 0; frame < 100 && boss.act; frame++) {
            G.T += .05; G.updateBoss(boss, .05, Math.hypot(G.p.x - boss.x, G.p.y - boss.y)); G.updateTele(.05); G.updateProjectiles(.05);
            if (frame % 20 === 0) G.render();
          }
          check(!boss.act, 'golpe termina e renderiza: ' + id + '/' + move);
        }
      }
      G.enterWorld(false); G.ui.closeAll();
      const seaBoss = G.enemies.find(e => e.id === 'leviata');
      const startSea = {x:seaBoss.x, y:seaBoss.y};
      const { CHALLENGE_RULES } = await import('/src/game/bossChallenges.js');
      for (let i = 0; i < 100; i++) {
        const ax = G.p.x - seaBoss.x, ay = G.p.y - seaBoss.y, dist = Math.hypot(ax, ay);
        CHALLENGE_RULES.mar(G, seaBoss, {}, .05, {p:G.p, ax, ay, dist});
      }
      check(Math.hypot(seaBoss.x-startSea.x, seaBoss.y-startSea.y)>10, 'Leviatã navega na costa real');
      const beforeNetwork = seaBoss.hp;
      G.receberGolpe({ id:seaBoss.nid, d:999999, a:0, k:0, ps:0, de:'teste' });
      check(seaBoss.hp === beforeNetwork, 'rede também rejeita golpe comum no Leviatã');
      G.receberGolpe({ id:seaBoss.nid, d:999999, challenge:'spear', a:0, k:0, ps:0, de:'teste' });
      check(seaBoss.hp < beforeNetwork, 'rede aplica lança temporária');
      const victim = G.npcs.find(n => n.missao === 'q_desanimo'); delete G.char.data.quests.q_desanimo; delete G.char.data.quests.q_preguica;
      G.talk(victim); check(document.body.innerText.includes('Antes, conclua: Vença a Preguiça'), 'pré-requisito aparece no diálogo'); G.ui.closeAll();
      G.char.data.quests.q_preguica = {st:'feita', n:5}; G.talk(victim);
      check([...document.querySelectorAll('button')].some(b => b.textContent.includes('Missão: Não desista!')), 'conclusão libera próxima missão'); G.ui.closeAll();
      G.save(); return passed;
    });
    console.log(JSON.stringify({ mechanics }, null, 2));
    assert.deepEqual(errors, [], 'Erros JavaScript');
    assert.deepEqual(failedLocal, [], 'Recursos locais com falha');
    console.log(JSON.stringify({ status: 'passed', url, checks: ['HTTP', 'criação em três etapas', 'prólogo e controles', 'movimento', 'ataque', 'inventário', 'salvar e sair', 'persistência após recarga'], javascriptErrors: errors, localResourceErrors: failedLocal, externalFailures: [...externalFailures] }, null, 2));
  } catch (e) {
    console.error(JSON.stringify({ status: 'failed', message: e.message, javascriptErrors: errors, localResourceErrors: failedLocal, externalFailures: [...externalFailures], visibleText: (await page.locator('body').innerText()).slice(-3500) }, null, 2));
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})().catch(e => { console.error(e); process.exitCode = 1; });
