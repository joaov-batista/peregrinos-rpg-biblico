const { chromium } = require('playwright');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({ executablePath:'/usr/bin/chromium', headless:true, args:['--no-sandbox','--disable-dev-shm-usage','--disable-background-timer-throttling','--disable-renderer-backgrounding'], ...(process.env.HTTPS_PROXY ? {proxy:{server:process.env.HTTPS_PROXY,bypass:'127.0.0.1,localhost'}}:{}) });
  const errors = [];
  const pages = [];
  let closing = false;
  try {
    for (const driver of [true, false]) {
      const ctx = await browser.newContext({viewport:{width:1280,height:900}}), page = await ctx.newPage(); pages.push(page);
      await page.route('https://fonts.googleapis.com/**', r => r.abort());
      page.on('pageerror', e => errors.push(e.message)); page.setDefaultTimeout(15000);
      await page.goto('http://127.0.0.1:5180', {waitUntil:'domcontentloaded'});
      await page.evaluate(async driver => {
        const { net } = await import('/src/net.js'); const {newCharData} = await import('/src/game/player.js'); const {defaultLook} = await import('/src/data/classes.js');
        const data = newCharData('guerreiro'); data.stats.playtime = 1; if (driver) data.eq.pet = 'cavalo';
        await net.createChar({name:driver?'Teste Cavalo':'Teste Garupa',cls:'guerreiro',look:defaultLook(),data});
        sessionStorage.setItem('peregrinos.started','1'); localStorage.setItem('peregrinos.controles','1'); localStorage.setItem('peregrinos.config', JSON.stringify({cinemas:false}));
      }, driver);
      await page.reload({waitUntil:'domcontentloaded'}); await page.getByRole('button',{name:'Jogar',exact:true}).click();
      await page.waitForFunction(() => window.__game?.running);
    }
    console.log('Dois jogos iniciados');
    for (let i=0;i<2;i++) {
      const page=pages[i], peer=pages[1-i];
      await page.exposeFunction('rideTestSend', async (kind, m) => {
        if (closing || peer.isClosed()) return;
        await peer.evaluate(({kind,m}) => { const G=window.__game; if(kind==='pos')G.onNetPos(m);else G.onNetEv(m); },{kind,m});
      });
      await page.evaluate(() => {
        const G=window.__game;
        G.enemies=[]; G.updateWorld=()=>{}; G.netTick=()=>{};
        G.net={send:m=>window.rideTestSend('pos',m),ev:m=>m.t.startsWith('horse-')?window.rideTestSend('ev',m):null,leave(){}};
      });
    }
    const [a,b]=pages;
    await a.evaluate(()=>{__game.toggleMount();__game.rideBroadcast();}); await b.evaluate(()=>__game.rideBroadcast());
    await b.waitForFunction(()=>[...__game.others.values()].some(o=>__game.canAskRide(o)), null, {timeout:15000});
    await b.evaluate(()=>{__game.ui.playerCard([...__game.others.values()][0]);});
    console.log('Enviando pedido');
    await b.getByRole('button',{name:'🐎 Pedir carona',exact:true}).click();
    await a.getByRole('button',{name:'Levar passageiro',exact:true}).click();
    await b.waitForFunction(()=>!!__game.rideDriver);
    await a.waitForFunction(()=>__game.ridePassenger?.confirmed);
    console.log('Passageiro embarcado');
    const before=await a.evaluate(()=>__game.p.x);
    await a.keyboard.down('d'); await a.waitForFunction(x=>__game.p.x>x+60,before); await a.keyboard.up('d');
    await b.waitForFunction(()=>{const o=[...__game.others.values()][0];return o&&Math.abs(__game.p.x-o.x)<2});
    assert.ok((await b.evaluate(()=>__game.p.x))>before+30);
    await b.keyboard.press('r'); await b.waitForFunction(()=>!__game.rideDriver); await a.waitForFunction(()=>!__game.ridePassenger);
    assert.equal(await a.evaluate(()=>!!__game.p.mounted),true);
    // Reembarque e queda por dano no condutor.
    await b.waitForFunction(()=>[...__game.others.values()].some(o=>__game.canAskRide(o)), null, {timeout:15000});
    await b.evaluate(()=>{__game.ui.playerCard([...__game.others.values()][0]);});
    console.log('Enviando pedido');
    await b.getByRole('button',{name:'🐎 Pedir carona',exact:true}).click(); await a.getByRole('button',{name:'Levar passageiro',exact:true}).click();
    await b.waitForFunction(()=>!!__game.rideDriver);
    await a.evaluate(()=>{__game.p.inv=0;__game.p.dodgeT=0;__game.damagePlayer(12,{x:__game.p.x-100,y:__game.p.y});});
    await b.waitForFunction(()=>!__game.rideDriver); assert.equal(await a.evaluate(()=>!!__game.p.mounted),false);
    assert.deepEqual(errors,[]);
    console.log('PASS: dois clientes, pedir/aceitar carona, deslocamento, R para descer, reembarque, queda do condutor e renderização sem erros.');
  } finally { closing=true; await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;});
