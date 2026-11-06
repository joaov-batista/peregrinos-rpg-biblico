// Integração local da campanha: UI real, mapas, combate, progresso e arte. Sem contas externas.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');

(async () => {
  const browser = await chromium.launch({ executablePath:'/usr/bin/chromium', headless:true,
    args:['--no-sandbox','--disable-dev-shm-usage'],
    ...(process.env.HTTPS_PROXY ? {proxy:{server:process.env.HTTPS_PROXY,bypass:'127.0.0.1,localhost'}} : {}) });
  try {
    const context = await browser.newContext({ viewport:{width:1440,height:1000} });
    context.setDefaultTimeout(15000);
    await context.route('https://fonts.googleapis.com/**', r=>r.abort());
    await context.addInitScript(()=>{
      localStorage.setItem('peregrinos.config',JSON.stringify({cinemas:false,volMusica:0,volVoz:0,volEfeitos:0}));
      localStorage.setItem('peregrinos.controles','1');sessionStorage.setItem('peregrinos.started','1');
    });
    const page=await context.newPage(), errors=[], failures=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('response',r=>{if(r.url().startsWith('http://127.0.0.1:5180')&&r.status()>=400)failures.push(r.url()+': '+r.status());});
    await page.goto(process.argv[2]||'http://127.0.0.1:5180',{waitUntil:'domcontentloaded'});
    await page.evaluate(async()=>{
      const {net}=await import('/src/net.js'),{newCharData}=await import('/src/game/player.js'),{defaultLook}=await import('/src/data/classes.js');
      const data=newCharData('guerreiro');data.stats.playtime=1;
      await net.createChar({name:'Estudo Jonas',cls:'guerreiro',look:defaultLook(),data});
    });
    await page.reload({waitUntil:'domcontentloaded'});
    await page.getByRole('button',{name:'Jogar',exact:true}).click();
    await page.waitForFunction(()=>window.__game?.running && __game.T>.2);
    await page.evaluate(async()=>{
      const g=__game;g.running=false;g.ui.closeAll();
      window.weeks=(await import('/src/content/index.js')).SEMANAS;
      window.jonas=weeks[1];g.enterSalao();g.render();
      if(g.portais.length!==2 || g.portais.some(p=>p.state==='fechado'))throw Error('Semanas não independentes');
      g.portais[1].fn();g.gateDialog(jonas,1);
    });
    const active=()=>page.locator('#overlay .modal:not(.out)').last();
    const button=label=>active().getByRole('button',{name:label,exact:true});
    await button('História').click();
    await button('✓ História').waitFor();
    await button('Ler estudo completo').click();
    await active().getByText('PARA REFLETIR',{exact:false}).waitFor();
    await button('Continuar a jornada').click();
    await button('Entrar no portão').waitFor();

    const begin=async n=>{
      if(n!==1)await page.evaluate(n=>{__game.gateDialog(jonas,n);},n);
      await button('Entrar no portão').click();
      await button('Entrar sem ler').click();
      await page.waitForFunction(n=>__game.scene==='fase'&&__game.fase.n===n,n);
      await page.evaluate(()=>{__game.ui.closeAll();__game.p.stun=0;__game.p.inv=0;__game.render();});
      assert.equal(await page.evaluate(()=>__game.fase.scale.mode),'historia');
    };
    const answer=async(correct=true)=>{
      await active().locator('.answers').waitFor();
      const text=await page.evaluate(correct=>{
        const title=document.querySelector('#overlay .modal:not(.out) .quiz h3').textContent;
        const f=__game.fase.def,q=[...f.quiz,...f.estacoes].find(q=>q.q===title);
        if(!q)throw Error('Pergunta desconhecida: '+title);
        return q.a[correct?0:1];
      },correct);
      await button(text).click();
      await button('Continuar').click();
      await page.waitForFunction(()=>!__game.ui.blocking);
    };
    const interact=async(kind,index)=>{
      await page.evaluate(({kind,index})=>{
        const g=__game,o=kind==='estacao'?g.fase.estacoes[index]:g.chests[index];
        g.p.x=o.x;g.p.y=o.y;g.updateInteract();
        if(!g.interactTarget)throw Error('Interação ausente');
        g.render();
      },{kind,index});
      await page.keyboard.press('e');
      await page.evaluate(()=>__game.updateInteract());
    };
    for(let n=1;n<=5;n++){
      await begin(n);
      if(n===1){ // Chaves sozinhas não pulam os objetivos.
        for(let i=0;i<3;i++){await interact('chest',i);await answer();}
        assert.equal(await page.evaluate(()=>!!__game.fase.doorOpen),false);
        const before=await page.evaluate(()=>__game.p.hp);
        await interact('estacao',0);await answer(false);
        assert.equal(await page.evaluate(()=>__game.p.hp),before);
        assert.equal(await page.evaluate(()=>__game.fase.jonas.feitas.length),0);
      }
      if(n===3||n===5){
        await interact('estacao',2);
        assert.equal(await page.evaluate(()=>__game.ui.blocking),false);
        assert.equal(await page.evaluate(()=>__game.fase.jonas.feitas.length),0);
      }
      if(n===2||n===3||n===5){
        const hazards=await page.evaluate(async()=>{
          const {tickJonas}=await import('/src/game/jonas-dungeon.js'),g=__game,f=g.fase;
          tickJonas(g,10);const a=f.jonas.aviso;if(!a)throw Error('Aviso ambiental ausente');
          g.p.x=a.x;g.p.y=a.y;g.p.hp=g.st.maxHp;g.p.inv=0;g.p.dodgeT=0;g.p.guard=false;
          tickJonas(g,1);const before=g.p.hp;
          tickJonas(g,.81);const damaged=g.p.hp<before;
          tickJonas(g,12);const b=f.jonas.aviso;g.p.x=b.x;g.p.y=b.y;g.p.inv=0;g.p.dodgeT=.3;
          const hp=g.p.hp;tickJonas(g,1.81);const dodged=g.p.hp===hp;
          g.p.dodgeT=0;return {damaged,dodged};
        });
        assert.deepEqual(hazards,{damaged:true,dodged:true});
      }
      for(let i=0;i<3;i++){await interact('estacao',i);await answer();}
      assert.equal(await page.evaluate(()=>__game.fase.jonas.feitas.length),3);
      if(n!==1)for(let i=0;i<3;i++){await interact('chest',i);await answer();}
      assert.equal(await page.evaluate(()=>__game.fase.doorOpen),true);
      assert.equal(await page.evaluate(()=>__game.fase.built.door.every(d=>!__game.cur.map.solid(d.tx,d.ty))),true);
      const report=await page.evaluate(async()=>{
        const g=__game,f=g.fase,{validarChefe}=await import('/src/game/bossMoves.js');
        const scale=f.scale.level;g.char.level++;g.refreshStats(); // Não fortalece o chefe que ainda vai surgir.
        g.p.x=f.built.boss.x;g.p.y=f.built.boss.y+140;g.updateFase(.016);
        const boss=g.enemies.find(e=>e.id===f.def.chefe);if(!boss)throw Error('Chefe não surgiu');
        if(boss.lv!==scale)throw Error('Escala mudou no meio da fase');
        if(validarChefe(boss.id,boss.d).length)throw Error('Dados inválidos');
        g.enemies=[boss];boss._intro=true;g.p.inv=999;g.p.hp=g.st.maxHp;
        const moves=[];
        for(const hpRatio of [1,.4])for(const move of Object.keys(boss.d.golpes)){
          boss.hp=boss.max*hpRatio;boss.act=move;boss.step=0;boss.stepT=0;
          boss.x=f.built.boss.x;boss.y=f.built.boss.y;g.tele=[];g.hazards=[];g.projs=[];
          for(let i=0;i<220&&boss.act;i++){
            g.T+=.05;g.updateBoss(boss,.05,Math.hypot(g.p.x-boss.x,g.p.y-boss.y));g.updateTele(.05);g.updateProjectiles(.05);
            if(i%10===0)g.render();
          }
          if(boss.act)throw Error('Golpe não terminou: '+move);moves.push(move);
        }
        boss.hp=boss.max;const initial=boss.hp;g.hit(boss,20,0,0,0);
        if(!(boss.hp<initial))throw Error('Chefe não recebe dano');
        boss.hp=1;g.hit(boss,20,0,0,0);
        return {n:f.n,boss:boss.id,scale,moves:moves.length};
      });
      await active().getByRole('heading',{name:await page.evaluate(()=>__game.fase.def.nome),exact:true}).waitFor();
      assert.equal(await page.evaluate(()=>__game.char.data.fases['semana-02'][__game.fase.n].done),true);
      await button('Voltar à sala da semana').click();
      await page.waitForFunction(()=>__game.scene==='salao');
      console.log('PASS',JSON.stringify(report));
    }
    assert.equal(await page.evaluate(()=>__game.char.data.inv.selo_misericordia),1);
    assert.equal(await page.evaluate(()=>!!__game.char.data.fases['semana-01']?.[5]?.done),false);
    await page.evaluate(()=>{__game.char.data.quests.q_daniel={st:'ativa',n:0};});
    // Mensagem obrigatória aparece na vitória mesmo com cutscenes desligadas.
    await page.evaluate(()=>{
      const g=__game;g.enterFase(weeks[0],5);g.faseComplete();
    });
    await active().getByText('Essa foi só uma das faces de Satanás. Ele voltará. Permaneça vigilante e firme na Palavra.',{exact:true}).waitFor();
    await button('Voltar à sala da semana').click();
    await page.waitForFunction(()=>__game.scene==='salao');
    assert.equal(await page.evaluate(()=>__game.char.data.quests.q_daniel.st),'ativa');
    // Repetir a fase final não duplica a recompensa da semana.
    await page.evaluate(()=>{__game.enterFase(jonas,5);__game.faseComplete();});
    await button('Voltar à sala da semana').click();
    await page.waitForFunction(()=>__game.scene==='salao');
    assert.equal(await page.evaluate(()=>__game.char.data.inv.selo_misericordia),1);
    assert.equal(await page.evaluate(()=>__game.char.data.quests.q_daniel.st),'pronta');
    await page.evaluate(()=>{
      __game.texts=[];__game.parts=[];__game.shakeA=0;__game.enterSemana(jonas);__game.render();__game.ui.openMenu('biblia');
    });
    assert.equal(await page.locator('.dungeon-study').count(),5);
    await page.locator('.dungeon-study summary').first().click();
    await page.waitForFunction(()=>!document.querySelector('.modal.out'));
    await page.screenshot({path:'/tmp/peregrinos-jonas-estudo.png',animations:'disabled'});
    await page.evaluate(()=>__game.ui.closeAll());
    // As novas cenas funcionam sem depender de arquivos de narração inexistentes.
    await page.evaluate(()=>{void __game.cinema('semana-02',true);});
    await page.getByRole('button',{name:/Pular/}).click();
    await page.waitForFunction(()=>!__game.ui.blocking);
    // Atlas de apresentação usa exatamente os renderizadores ativos no jogo.
    const atlas=await page.evaluate(async()=>{
      const {drawBoss}=await import('/src/game/boss-art.js');
      const c=document.createElement('canvas');c.width=1500;c.height=430;const g=c.getContext('2d');
      g.fillStyle='#102733';g.fillRect(0,0,c.width,c.height);
      g.font='bold 25px sans-serif';g.textAlign='center';g.fillStyle='#F1DEC0';g.fillText('JONAS · OS CONFLITOS DO CORAÇÃO',750,42);
      Object.entries(jonas.chefes).forEach(([id,d],i)=>{
        drawBoss(g,{id,d,x:150+i*300,y:255,r:70,hp:d.hp,max:d.hp,stun:0},2);
        g.font='bold 17px sans-serif';g.fillStyle='#F1DEC0';g.fillText(d.nome,150+i*300,370);
        g.font='14px sans-serif';g.fillStyle='#91B6BA';g.fillText(d.titulo,150+i*300,397);
      });return c.toDataURL('image/png').split(',')[1];
    });
    fs.writeFileSync('/tmp/peregrinos-jonas-chefes.png',Buffer.from(atlas,'base64'));
    await page.evaluate(async()=>{await __game.save();});
    await page.reload({waitUntil:'domcontentloaded'});
    await page.getByRole('button',{name:'Jogar',exact:true}).click();
    await page.waitForFunction(()=>window.__game?.running);
    assert.equal(await page.evaluate(()=>__game.char.data.fases['semana-02'].semana),true);
    assert.equal(await page.evaluate(()=>__game.char.data.inv.selo_misericordia),1);
    assert.equal(await page.evaluate(()=>__game.char.data.dungeonDifficulty),'historia');
    assert.deepEqual(errors,[]);assert.deepEqual(failures,[]);
    console.log('PASS: cinco fases completas, 15 decisões, portas, chefes, estudo, epílogo e persistência após recarga.');
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
