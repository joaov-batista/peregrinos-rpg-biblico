// Dois clientes reais, com transporte local em vez de contas Supabase.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({ executablePath:'/usr/bin/chromium', headless:true,
    args:['--no-sandbox','--disable-dev-shm-usage'],
    ...(process.env.HTTPS_PROXY ? {proxy:{server:process.env.HTTPS_PROXY,bypass:'127.0.0.1,localhost'}} : {}) });
  const pages=[], errors=[]; let closing=false;
  try {
    for (const level of [3,40]) {
      const ctx=await browser.newContext(level===40 ? {viewport:{width:844,height:390},isMobile:true,hasTouch:true,deviceScaleFactor:2} : {}), page=await ctx.newPage();pages.push(page);
      page.setDefaultTimeout(15000);page.on('pageerror',e=>errors.push(e.message));
      await page.route('https://fonts.googleapis.com/**',r=>r.abort());
      await page.goto('http://127.0.0.1:5180',{waitUntil:'domcontentloaded'});
      await page.evaluate(async level=>{
        const {net}=await import('/src/net.js'),{newCharData}=await import('/src/game/player.js'),{defaultLook}=await import('/src/data/classes.js');
        const data=newCharData('guerreiro');data.stats.playtime=1;data.dungeonDifficulty=level===3?'desafio':'historia';
        await net.createChar({name:'Grupo Jonas '+level,cls:'guerreiro',look:defaultLook(),data});
        localStorage.setItem('peregrinos.config',JSON.stringify({cinemas:false,volMusica:0,volVoz:0,volEfeitos:0}));
        localStorage.setItem('peregrinos.controles','1');sessionStorage.setItem('peregrinos.started','1');
      },level);
      await page.reload({waitUntil:'domcontentloaded'});
      await page.getByRole('button',{name:'Jogar',exact:true}).click();
      await page.waitForFunction(()=>window.__game?.running&&__game.T>.2);
      await page.evaluate(async level=>{
        __game.running=false;__game.ui.closeAll();__game.char.level=level;__game.refreshStats();
        window.jonas=(await import('/src/content/index.js')).SEMANAS[1];
      },level);
    }
    const [leader,peer]=pages, ids=await Promise.all(pages.map(p=>p.evaluate(()=>__game.meuId())));
    // No celular, os controles de dificuldade e estudo permanecem acessíveis por toque/rolagem.
    await peer.evaluate(()=>{__game.enterSemana(jonas);__game.render();__game.gateDialog(jonas,1);});
    await peer.getByRole('button',{name:'Ler estudo completo',exact:true}).tap();
    await peer.getByRole('button',{name:'Continuar a jornada',exact:true}).tap();
    await peer.getByRole('button',{name:'Voltar',exact:true}).tap();
    await peer.waitForFunction(()=>!document.querySelector('.modal.out'));
    for (let i=0;i<2;i++) {
      await pages[i].exposeFunction('sendGroupTest',async m=>{
        if(!closing)await pages[1-i].evaluate(m=>__game.onNetEv(m),m);
      });
      await pages[i].evaluate(({ids,i})=>{
        __game.grupo={id:'jonas-test',lider:ids[0],membros:ids.map(id=>({id,name:id}))};
        __game.net={ev:m=>window.sendGroupTest(m),leave(){}};
        __game.souHost=()=>i===0;
      },{ids,i});
    }
    // Um membro que não é o líder não pode iniciar uma transferência de fase.
    await peer.evaluate(ids=>__game.onNetEv({t:'g-fase',de:'outsider',gid:'jonas-test',sem:jonas.id,n:1,run:'wrong'}),ids);
    assert.equal(await peer.evaluate(()=>__game.ui.blocking),false);
    await leader.evaluate(()=>__game.entrarComGrupo(jonas,1));
    await peer.getByRole('button',{name:'Ir com o grupo',exact:true}).click();
    await peer.waitForFunction(()=>__game.scene==='fase');
    const expected={level:3,mode:'desafio'};
    for(const page of pages)assert.deepEqual(await page.evaluate(()=>__game.fase.scale),expected);
    assert.deepEqual(await leader.evaluate(()=>__game.enemies.map(e=>[e.nid,e.max,e.atk])),await peer.evaluate(()=>__game.enemies.map(e=>[e.nid,e.max,e.atk])));
    const run=await leader.evaluate(()=>__game.fase.run);
    assert.equal(await peer.evaluate(()=>__game.fase.run),run);
    // Chaves compartilhadas ainda exigem as três decisões do estudo.
    for(const page of pages)await page.evaluate(()=>{for(let i=0;i<3;i++)__game.receberBau({i,ok:1});});
    assert.equal(await peer.evaluate(()=>!!__game.fase.doorOpen),false);
    // Mensagem de outra partida é ignorada.
    await leader.evaluate(()=>__game.netEnviar({t:'jonas-estacao',id:'chamado',run:'old-run'}));
    assert.equal(await peer.evaluate(()=>__game.fase.jonas.feitas.length),0);
    await peer.evaluate(async()=>{
      const {completeStation}=await import('/src/game/jonas-dungeon.js');
      completeStation(__game.fase,'chamado');
      await __game.netEnviar({t:'jonas-estacao',id:'chamado',run:__game.fase.run});
    });
    await leader.waitForFunction(()=>__game.fase.jonas.feitas.length===1);
    // Snapshot recupera decisões perdidas sem duplicar as já recebidas.
    await leader.evaluate(async()=>{
      const {completeStation}=await import('/src/game/jonas-dungeon.js');
      completeStation(__game.fase,'rota');completeStation(__game.fase,'passo');__game.openDoor();
      __game.proxies.set('peer',{x:__game.p.x,y:__game.p.y});__game.atualizaProxies=()=>{};
      __game.netTick(.2);
    });
    await peer.waitForFunction(()=>__game.fase.doorOpen);
    for(const page of pages)assert.equal(await page.evaluate(()=>__game.fase.jonas.feitas.length),3);
    await leader.evaluate(()=>__game.netTick(.2));
    assert.equal(await peer.evaluate(()=>__game.fase.jonas.feitas.length),3);
    await peer.evaluate(()=>{__game.texts=[];__game.parts=[];__game.render();__game.ui.openMenu('biblia');});
    await peer.locator('.dungeon-study summary').first().tap();
    assert.equal(await peer.locator('.dungeon-study[open]').count(),1);
    assert.equal(await peer.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true);
    await peer.screenshot({path:'/tmp/peregrinos-jonas-mobile.png',animations:'disabled'});
    assert.deepEqual(errors,[]);
    console.log('PASS: desktop + celular, leitura por toque, convite do líder, escala comum (níveis 3/40), decisões compartilhadas, snapshot e porta.');
  } finally {closing=true;await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
