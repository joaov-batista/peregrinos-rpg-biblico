const { chromium } = require('playwright');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'], ...(process.env.HTTPS_PROXY ? { proxy: { server: process.env.HTTPS_PROXY, bypass: '127.0.0.1,localhost' } } : {}) });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 }), errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.route('https://fonts.googleapis.com/**', r => r.abort());
    await page.goto('http://127.0.0.1:5180', { waitUntil: 'domcontentloaded' });
    const result = await page.evaluate(async () => {
      const { drawEnemy } = await import('/src/game/enemy-art.js');
      const { drawBoss } = await import('/src/game/boss-art.js');
      const { ENEMIES, BOSSES } = await import('/src/data/bestiary.js');
      const canvas = document.createElement('canvas'); canvas.id = 'monster-sheet';
      canvas.width = 2400; canvas.height = 1600;
      canvas.style.cssText = 'position:fixed;inset:12px;z-index:9999;width:1200px;height:800px;background:#111c27';
      document.body.append(canvas); const ctx = canvas.getContext('2d');
      const actors = [...Object.keys(ENEMIES).map(type => ({ type, kind: 'enemy', d: ENEMIES[type], r: 22, spd: ENEMIES[type].spd })),
        ...Object.keys(BOSSES).map(id => ({ id, kind: 'boss', d: BOSSES[id], r: 31, spd: BOSSES[id].spd || 65 }))];
      actors.forEach((e,i) => Object.assign(e, { x: 120 + (i % 5) * 240, y: 110 + Math.floor(i / 5) * 195, stun: 0, ph: i*.5, artAttack: 0 }));
      const base = actors.map(e => e.x);
      // Detecta NaN em transformações, fonte comum de sprites que somem.
      for (const key of ['translate','scale','rotate','transform']) {
        const fn = ctx[key].bind(ctx); ctx[key] = (...args) => { if (args.some(n => !Number.isFinite(n))) throw Error(key + ': ' + args); return fn(...args); };
      }
      function frame(t, stage) {
        ctx.setTransform(2,0,0,2,0,0); ctx.fillStyle='#111c27'; ctx.fillRect(0,0,1200,800);
        for(let i=0;i<actors.length;i++) {
          const e = actors[i]; e.x = base[i]+Math.sin(t*2)*16;
          e.telegraph=stage==='preparo'?.3:0;e.act=e.kind==='boss'&&stage!=='caminhada'?'pisao':null;e.step=stage==='preparo'?1:stage==='golpe'?2:0;
          if(e.kind==='boss')drawBoss(ctx,e,t);else drawEnemy(ctx,e,e.d,t);
          ctx.fillStyle='#e1d5b5';ctx.font='14px sans-serif';ctx.textAlign='center';ctx.fillText(e.d.nome||e.id,base[i],e.y+55);
          ctx.fillStyle='#8aabb3';ctx.font='11px sans-serif';ctx.fillText(stage,base[i],e.y+72);
        }
      }
      window.monsterFrame = frame; window.monsterActors = actors;
      for(let i=0;i<120;i++) frame(i/60,'caminhada');
      const count=ctx.getImageData(0,0,canvas.width,canvas.height).data.reduce((n,v,i)=>n+(i%4===0&&v>80),0);
      return { count: actors.length, paintedPixels: count };
    });
    assert.ok(result.count >= 18 && result.paintedPixels > 10000);
    await page.locator('#monster-sheet').screenshot({ path: '/tmp/peregrinos-monstros-caminhada.png' });
    await page.evaluate(() => { for(let i=120;i<145;i++) monsterFrame(i/60,'preparo'); });
    await page.locator('#monster-sheet').screenshot({ path: '/tmp/peregrinos-monstros-preparo.png' });
    await page.evaluate(() => { monsterActors.forEach(e=>e.artAttack++);monsterFrame(145/60,'golpe'); });
    await page.locator('#monster-sheet').screenshot({ path: '/tmp/peregrinos-monstros-golpe.png' });
    const netResult = await page.evaluate(async () => {
      const { instalarMundoNet } = await import('/src/game/mundoNet.js');
      class World {}
      instalarMundoNet(World);const w=new World();w.enemies=[];w.worldBosses=[];w.eu={x:0,y:0};w.ui={bossBar(){}};
      w.makeEnemy=(type,x,y)=>({type,x,y,kind:'enemy',spd:100,r:14,d:{ai:'chase'},act:null,step:0});
      const list=x=>[{i:'s0',t:'inveja',x,y:0,h:50,m:50,an:1,ac:'pisao',st:1}];
      w.T=0;w.aplicarSnapshot(list(0));let samples=[];
      for(let f=1;f<=72;f++){w.T=f/60;if(f%9===0)w.aplicarSnapshot(list(w.T*100));w.updateEnemiesCliente(1/60);if(f>=18)samples.push(w.enemies[0].x);}
      const e=w.enemies[0];return { steps:samples.slice(1).map((x,i)=>x-samples[i]),act:e.act,step:e.step,artAct:e.artAct,artStep:e.artStep };
    });
    assert.ok(netResult.steps.every(s=>Math.abs(s-100/60)<1e-6));
    assert.equal(netResult.act,null);assert.equal(netResult.step,0);assert.equal(netResult.artAct,'pisao');
    assert.deepEqual(errors, []);
    console.log('PASS: '+result.count+' monstros/chefes desenhados em caminhada, preparo e golpe; interpolação integrada uniforme; temporizadores do combate preservados.');
  } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;});
