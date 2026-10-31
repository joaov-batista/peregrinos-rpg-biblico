const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage'],...(process.env.HTTPS_PROXY?{proxy:{server:process.env.HTTPS_PROXY,bypass:'127.0.0.1,localhost'}}:{})});
 try {
  const page=await browser.newPage({viewport:{width:1280,height:900}}), errors=[];
  page.on('pageerror',e=>errors.push(e.message)); await page.route('https://fonts.googleapis.com/**',r=>r.abort());
  await page.goto('http://127.0.0.1:5180',{waitUntil:'domcontentloaded'});
  await page.evaluate(async()=>{
   const {net}=await import('/src/net.js'),{newCharData}=await import('/src/game/player.js'),{defaultLook}=await import('/src/data/classes.js');
   const data=newCharData('guerreiro'); data.stats.playtime=1;data.gold=700;
   const c=await net.createChar({name:'Teste Papagaio',cls:'guerreiro',look:defaultLook(),data});c.level=4;await net.saveChar(c);
   sessionStorage.setItem('peregrinos.started','1');localStorage.setItem('peregrinos.controles','1');localStorage.setItem('peregrinos.config',JSON.stringify({cinemas:false}));
  });
  await page.reload({waitUntil:'domcontentloaded'});await page.getByRole('button',{name:'Jogar',exact:true}).click();await page.waitForFunction(()=>window.__game?.running);
  await page.evaluate(()=>{__game.ui.shop('animais');});
  await page.locator('.item-row').filter({hasText:'Papagaio'}).getByRole('button',{name:'🪙 650',exact:true}).click();
  await page.getByRole('button',{name:'Fechar',exact:true}).click();
  await page.waitForFunction(()=>__game.pet?.state==='perched');
  assert.equal(await page.evaluate(()=>__game.char.data.gold),50);
  await page.evaluate(()=>{__game.running=false;__game.render();});
  await page.screenshot({path:'/tmp/papagaio-ombro.png'});
  const result=await page.evaluate(async()=>{
   const G=__game,a=G.pet,e=G.makeEnemy('preguica',G.p.x+90,G.p.y+35);G.enemies=[e];const hp=e.hp;
   G.updatePet(.02);const flight=a.state==='attacking'; G.T+=.1;G.updatePet(.1);G.render();
   for(let i=0;i<200&&e.hp===hp;i++)G.updatePet(.02);
   const damage=hp-e.hp, returning=a.state==='returning';G.enemies=[];
   for(let i=0;i<200&&a.state!=='perched';i++)G.updatePet(.02);
   const landed=a.state==='perched';
   let packet;G.net={send:m=>packet=m};G.lastSent=null;G.sendPos();G.net=null;
   G.drawOther(G.ctx,{id:'peer',x:G.p.x+60,y:G.p.y,fx:1,fy:0,cls:'guerreiro',look:G.char.look,eq:G.char.data.eq,pet:{...packet.pet,x:G.p.x+100,y:G.p.y-50,f:true},name:'Outro',walk:0});
   G.save(); return {flight,damage,returning,landed,packet:packet.pet};
  });
  assert.ok(result.flight&&result.damage>0&&result.returning&&result.landed); assert.equal(result.packet.k,'papagaio');assert.ok(Number.isFinite(result.packet.x));
  await page.reload({waitUntil:'domcontentloaded'});await page.getByRole('button',{name:'Jogar',exact:true}).click();await page.waitForFunction(()=>__game.pet?.kind==='papagaio');
  assert.deepEqual(errors,[]);console.log('PASS: compra, equipamento, ombro, voo, bicada, retorno, estado de rede, desenho remoto e persistência.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
