// A sala da célula com várias pessoas (rodar com o servidor ligado: npm run dev, depois node tests/celula-browser.cjs).
// Tudo no mesmo navegador, pela ligação local entre abas (?redelocal): um telão (o líder) e três jogadores.
// Confere: entrar pelo link, a votação aparecer para todos com o jogo congelado, a maioria decidir, o selo acender para
// quem está na página, o erro chamar monstros para todos, o fruto disputado ir para um só, os fantasmas e o placar.
// Depois, uma sala SEM telão: o anfitrião (um jogador) fecha a aba e outro assume, sem perder ninguém.
const { chromium } = require('playwright');
const URL = process.env.URL || 'http://127.0.0.1:5180/celula.html', SHOTS = process.env.SHOTS || '';
const ok = (c, m) => { console.log((c ? 'ok  ' : 'FALHA ') + m); if (!c) process.exitCode = 1; };
const espera = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1280, height: 720 } });
  await ctx.route('https://fonts.googleapis.com/**', r => r.abort());
  await ctx.addInitScript(() => localStorage.setItem('peregrinos.config', JSON.stringify({ volMusica: 0, volVoz: 0, volEfeitos: 0, vozNavegador: false, cinemas: false, esquemaEscolhido: true })));
  const erros = [];
  const pagina = async () => { const p = await ctx.newPage(); p.on('pageerror', e => erros.push(e.message)); return p; };
  const personagem = async (p, nome) => p.evaluate(async nome => { const { newCharData } = await import('/src/game/player.js'), { defaultLook } = await import('/src/data/classes.js');
    const c = { id: 'cel-' + nome, name: nome, cls: 'guerreiro', look: defaultLook(), level: 1, score: 0, data: newCharData('guerreiro') }; c.data.stats.playtime = 1; c.data.caminho = { visto: { pagina: 1 } };
    localStorage.setItem('peregrinos.celula.celula-escolheu', JSON.stringify(c)); }, nome);

  // ---- o telão do líder ----
  const tel = await pagina(); await tel.goto(URL + '?redelocal'); await tel.click('text=abrir o telão');
  await tel.waitForSelector('.cel-telao'); const cod = await tel.evaluate(() => __celula.rede.codigo);
  ok(/^[A-Z0-9]{5}$/.test(cod), 'telão abriu a sala ' + cod);

  // ---- três jogadores pelo link ----
  const nomes = ['Ana', 'Bia', 'Caio'], js = [];
  for (const n of nomes) {
    const p = await pagina(); await p.goto(URL + '?sala=' + cod + '&redelocal'); await personagem(p, n); await p.reload();
    await p.click('text=Continuar como'); await p.click('.cel-card:nth-child(3) button'); await p.waitForSelector('text=Começar!', { timeout: 10000 }); await p.click('text=Começar!');
    for (let i = 0; i < 20 && !(await p.evaluate(() => !!window.__game?.running)); i++) await espera(300);
    await p.evaluate(() => __game.ui.closeAll?.()); js.push(p);
  }
  await espera(2500);
  ok(await tel.evaluate(() => __celula.rede.total) === 3, 'o telão vê 3 peregrinos (o telão não conta)');
  ok((await js[0].evaluate(() => __celula.rede.placar().map(x => x.nome))).length === 3, 'o placar do jogador tem os 3');
  // todos na mesma página, perto um do outro: os fantasmas aparecem
  for (const p of js) await p.evaluate(() => { const g = __game; g.ui.closeAll?.(); g.p.x = g.N.inicio.x + 60; });
  await espera(1500);
  const fant = await js[1].evaluate(() => __game.outros.filter(o => o.fantasma).map(o => o.nome));
  ok(fant.length === 2, 'Bia vê os fantasmas de ' + fant.join(' e '));
  if (SHOTS) await js[1].screenshot({ path: SHOTS + '/20-fantasmas.png' });

  // ---- votação: Ana abre um rolo; todos veem, todos congelam ----
  await js[0].evaluate(() => { const g = __game, ob = g.objs.find(o => o.tipo === 'rolo' && o.n === 0); g.usar(ob); });
  await espera(500); await js[0].locator('#overlay button').first().click().catch(() => {}); // "Li. Quero responder"
  await espera(800);
  const vendo = await Promise.all([tel, ...js].map(p => p.locator('.cel-voto').count()));
  ok(vendo.every(n => n === 1), 'a pergunta apareceu nas 4 telas');
  const congel = await Promise.all(js.map(p => p.evaluate(() => __game.pausaGeral)));
  ok(congel.every(Boolean), 'o jogo congelou para os 3');
  if (SHOTS) await tel.screenshot({ path: SHOTS + '/21-telao-voto.png' });
  let certa = await tel.evaluate(() => __celula.rede.quiz.pac.certa);
  await js[0].keyboard.press(String(certa + 1)); await js[1].keyboard.press(String(certa + 1)); await js[2].keyboard.press(String((certa + 1) % 4 + 1));
  await espera(1500);
  if (SHOTS) await tel.screenshot({ path: SHOTS + '/22-telao-revela.png' });
  if (SHOTS) await js[2].screenshot({ path: SHOTS + '/23-jogador-revela.png' });
  await espera(5200);
  const selos = await Promise.all(js.map(p => p.evaluate(() => __game.cm.selos[__game.area].slice())));
  ok(selos.every(s => s.includes(0)), 'maioria certa (2 x 1): o selo 1 acendeu para os 3 ' + JSON.stringify(selos));
  ok((await Promise.all(js.map(p => p.evaluate(() => __game.pausaGeral)))).every(v => !v), 'o jogo voltou a andar para todos');
  const pts = await tel.evaluate(() => __celula.rede.placar().map(x => x.nome + ':' + x.pts).join(' '));
  ok(/Ana:100/.test(pts) && /Bia:100/.test(pts) && /Caio:0/.test(pts), 'pontos para quem votou certo: ' + pts);

  // ---- a sala erra: monstros para todos ----
  const antes = await Promise.all(js.map(p => p.evaluate(() => __game.inimigos.filter(e => e.hp > 0).length)));
  await js[1].evaluate(() => { const g = __game, ob = g.objs.find(o => o.tipo === 'rolo' && o.n === 1); g.p.x = ob.x; g.usar(ob); });
  await espera(500); await js[1].locator('#overlay button').first().click().catch(() => {}); await espera(800);
  certa = await tel.evaluate(() => __celula.rede.quiz.pac.certa); const errada = (certa + 1) % 4 + 1, outra = (certa + 2) % 4 + 1;
  await js[0].keyboard.press(String(errada)); await js[1].keyboard.press(String(errada)); await js[2].keyboard.press(String(outra));
  await espera(7200);
  const depois = await Promise.all(js.map(p => p.evaluate(() => __game.inimigos.filter(e => e.hp > 0).length)));
  ok(depois.every((n, i) => n >= antes[i] + 3), 'errou: monstros para os 3 (' + antes.join(',') + ' → ' + depois.join(',') + ')');
  ok((await js[1].evaluate(() => __game.cm.selos[__game.area].includes(1))) === false, 'o selo 2 continua apagado');

  // ---- empate é erro ----
  const r = await tel.evaluate(async () => { const { apurar } = await import('/src/celula/rede.js'); return [apurar([1, 1, 0, 0], 0).certo, apurar([2, 1, 0, 0], 0).certo, apurar([0, 0, 0, 0], 0).certo]; });
  ok(r[0] === false && r[1] === true && r[2] === false, 'apuração: empate e ninguém votar contam como erro');

  // ---- fila: duas pessoas abrem rolos ao mesmo tempo → uma votação por vez ----
  await js[0].evaluate(() => { const g = __game; __celula.rede.pedirVotacao({ q: 'Teste A?', op: ['a', 'b', 'c', 'd'], certa: 0 }, { area: g.area, rolo: 1, titulo: 'Rolo 2' }); });
  await js[2].evaluate(() => { const g = __game; __celula.rede.pedirVotacao({ q: 'Teste C?', op: ['a', 'b', 'c', 'd'], certa: 0 }, { area: g.area, rolo: 1, titulo: 'Rolo 2' }); });
  await espera(800);
  ok(await tel.evaluate(() => __celula.rede.quiz?.q === undefined && __celula.rede.quiz?.pac.q === 'Teste A?' && __celula.rede.fila.length === 1), 'a segunda pergunta espera na fila');
  for (const p of js) await p.keyboard.press('1'); await espera(7000);
  ok(await tel.evaluate(() => __celula.rede.quiz?.pac.q === 'Teste C?'), 'terminada a primeira, a segunda começa');
  for (const p of js) await p.keyboard.press('1'); await espera(7000);

  // ---- o fruto disputado: Ana e Caio pegam o mesmo ao mesmo tempo ----
  const ganhos0 = await Promise.all(js.map(p => p.evaluate(() => __game.char.data.celula.frutos)));
  const k = await js[0].evaluate(() => __game.objs.find(o => o.tipo === 'frutoCel' && !o.pego).k);
  await Promise.all([js[0], js[2]].map(p => p.evaluate(k => { const g = __game, ob = g.objs.find(o => o.k === k); g.evento.pegarFruto(g, ob); ob.pedido = true; }, k)));
  await espera(1500);
  const dono = await tel.evaluate(k => __celula.rede.frutos[k], k);
  const pegos = await Promise.all(js.map(p => p.evaluate(k => __game.objs.find(o => o.k === k)?.pego, k)));
  const ganhos = await Promise.all(js.map(p => p.evaluate(() => __game.char.data.celula.frutos)));
  ok(!!dono && pegos.every(Boolean), 'o fruto sumiu para todos e ficou com ' + dono);
  const ganhou = ganhos.map((n, i) => n - ganhos0[i]);
  ok(ganhou.filter(n => n > 0).length === 1 && ganhou[nomes.indexOf(dono)] === 1, 'só ' + dono + ' ganhou o fruto disputado (' + ganhou.join(',') + ')');

  // ---- chefe vencido: o placar do telão anda ----
  await js[2].evaluate(async () => { const g = __game; g.cm.selos[g.area] = [0, 1]; g.conferirPorta(true); const A = g.N.arena; g.p.x = A.x0 + 130; g.p.y = A.chao - 2; });
  for (let i = 0; i < 30 && !(await js[2].evaluate(() => !!__game.chefe)); i++) { await espera(300); await js[2].evaluate(() => __game.ui.closeAll?.()); }
  await js[2].evaluate(() => { const b = __game.chefe; b.hp = 1; __game.atingirJa(b, 9999, b.x - 10, {}); });
  for (let i = 0; i < 40; i++) { await espera(400); await js[2].locator('.cel-epica, #overlay button').first().click({ timeout: 200 }).catch(() => {}); if (await js[2].evaluate(() => __game.area === 'celula-escolheu:2')) break; }
  ok(await js[2].evaluate(() => __game.area) === 'celula-escolheu:2', 'Caio venceu a Rejeição e foi para a página 2');
  await espera(2500);
  const placarTel = await tel.evaluate(() => __celula.rede.placar()[0]);
  ok(placarTel.nome === 'Caio' && placarTel.chefes === 1, 'o telão mostra Caio em 1º com 1 chefe');
  if (SHOTS) await tel.screenshot({ path: SHOTS + '/24-telao-placar.png' });

  // ---- sala sem telão: o anfitrião cai e outro assume ----
  for (const p of [tel, ...js]) await p.close();
  const cod2 = 'TESTE'.replace(/[^A-Z0-9]/g, '').slice(0, 5); const ps = [];
  for (const n of ['Davi', 'Eva', 'Fil']) {
    const p = await pagina(); await p.goto(URL + '?sala=Q' + 'RT34' + '&redelocal'); await personagem(p, n); await p.reload();
    await p.click('text=Continuar como'); await p.click('.cel-card:nth-child(3) button'); await p.waitForSelector('text=Começar!', { timeout: 10000 }); await p.click('text=Começar!');
    for (let i = 0; i < 20 && !(await p.evaluate(() => !!window.__game?.running)); i++) await espera(300);
    ps.push(p); await espera(400);
  }
  await espera(2000);
  ok(await ps[0].evaluate(() => __celula.rede.anfitriao) && await ps[2].evaluate(() => __celula.rede.total) === 3, 'Davi segura a sala e Fil vê os 3');
  await ps[0].close(); await espera(13000);
  const anf = await Promise.all(ps.slice(1).map(p => p.evaluate(() => __celula.rede.anfitriao)));
  const tot = await Promise.all(ps.slice(1).map(p => p.evaluate(() => __celula.rede.total)));
  ok(anf.filter(Boolean).length === 1, 'depois que Davi saiu, um só virou o anfitrião (' + anf.join(',') + ')');
  ok(tot.every(n => n === 2), 'Eva e Fil continuam juntos na sala (' + tot.join(',') + ')');
  ok(!erros.length, 'nenhum erro de página' + (erros.length ? ': ' + erros.slice(0, 4).join(' | ') : ''));
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
