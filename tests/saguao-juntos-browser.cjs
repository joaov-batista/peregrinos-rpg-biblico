// O saguão do "Caminhar juntos", de ponta a ponta, com quatro abas (rede local entre abas: ?redelocal):
//   A cria a sala pelo saguão com um peregrino que já existe; B entra pelo código com outro peregrino que já existe;
//   C entra pelo código e CRIA um peregrino novo; D não tem peregrino nenhum (tela de boas-vindas), entra pelo código e cria o seu.
//   Depois: todos se veem, as posições chegam, só um aparelho é o dono da área, um quinto é recusado, um código errado dá erro,
//   um convidado sai sem derrubar a sala, e quando o anfitrião sai a sala fecha para os outros.
// Rodar com o servidor de desenvolvimento ligado: node tests/saguao-juntos-browser.cjs [porta]
const { chromium } = require('playwright');
const URL = 'http://127.0.0.1:' + (process.argv[2] || 5180) + '/?redelocal';
const falhas = []; const confere = (ok, nome, extra = '') => { console.log((ok ? '  ok   ' : '  FALHA ') + nome + (ok ? '' : ' ' + extra)); if (!ok) falhas.push(nome); };
const INIT = () => { localStorage.setItem('peregrinos.config', JSON.stringify({ cinemas: false, volMusica: 0, volVoz: 0, volEfeitos: 0, esquemaEscolhido: true })); sessionStorage.setItem('peregrinos.started', '1'); };
const semente = (p, nomes) => p.evaluate(async nomes => { const { net } = await import('/src/net.js'), { newCharData } = await import('/src/game/player.js'), { defaultLook } = await import('/src/data/classes.js'); for (const n of nomes) { const d = newCharData('guerreiro'); await net.createChar({ name: n, cls: 'guerreiro', look: defaultLook(), data: d }); } }, nomes);
const noJogo = async p => { for (let i = 0; i < 40 && !(await p.evaluate(() => !!window.__game?.running)); i++) await p.waitForTimeout(500); return p.evaluate(() => !!window.__game?.running); };
// fecha conversas e cenas de abertura até o jogo ficar livre (sem tocar no diálogo da sala, que o teste lê antes)
const livre = async p => { for (let i = 0; i < 25; i++) { const t = await p.evaluate(() => { const b = [...document.querySelectorAll('#overlay button')].filter(x => x.offsetParent); if (!b.length) return ''; b[b.length - 1].click(); return 'x'; }); if (!t) break; await p.waitForTimeout(350); } await p.evaluate(() => window.__game?.ui.closeAll?.()); };
const sala = p => p.evaluate(() => { const g = window.__game, mp = g?.mp; return mp ? { cod: mp.codigo, anf: mp.anfitriao, eu: mp.eu, pares: mp.lista().map(o => o.nome).sort(), dono: mp.souDono, area: g.area, nome: g.char.name } : null; });
const esperaSala = async (p, n) => { for (let i = 0; i < 40; i++) { const s = await sala(p); if (s && s.pares.length >= n) return s; await p.waitForTimeout(400); } return sala(p); };
const criar = async (p, nome) => { await p.locator('.forge-primary').click(); await p.waitForTimeout(400); await p.locator('.forge-primary').click(); await p.waitForTimeout(400); await p.locator('#pilgrim-name').fill(nome); await p.locator('.forge-primary').click(); };
const entrarPeloCodigo = async (p, cod) => { await p.locator('.saguao-codigo').fill(cod.toLowerCase()); await p.locator('.saguao .porta-btn', { hasText: 'Entrar na sala' }).click(); await p.waitForTimeout(200); };

(async () => {
  const b = await chromium.launch();
  const abre = async ctx => { const p = await ctx.newPage(); p.erros = []; p.on('pageerror', e => p.erros.push(e.message)); await p.goto(URL, { waitUntil: 'domcontentloaded' }); return p; };
  // um contexto com dois peregrinos guardados (as abas A, B, C e E dividem o mesmo aparelho) e outro, vazio, para quem chega sem nada (D)
  const ctx = await b.newContext({ viewport: { width: 1100, height: 640 } }); await ctx.route('https://fonts.googleapis.com/**', r => r.abort()); await ctx.addInitScript(INIT);
  const A = await abre(ctx); await semente(A, ['Anfitriao', 'Visitante']); await A.reload({ waitUntil: 'domcontentloaded' }); await A.locator('.saguao').waitFor({ timeout: 15000 });

  console.log('1. O saguão');
  confere(await A.locator('.char-card').count() === 2, 'dois peregrinos na lista');
  confere(await A.locator('.saguao-local').evaluate(e => !e.open), 'multiplayer local recolhido');
  confere(await A.locator('.saguao .porta-btn.on').innerText() === 'Sozinho', 'o padrão é jogar sozinho');
  await A.goto(URL.replace('?redelocal', ''), { waitUntil: 'domcontentloaded' }); await A.evaluate(() => sessionStorage.removeItem('peregrinos.started')); await A.reload({ waitUntil: 'domcontentloaded' }); await A.waitForTimeout(2500);
  confere(!/jogadores/.test(await A.evaluate(() => document.querySelector('#screens')?.innerText || '')), 'tela de entrada sem os botões de 2, 3 e 4 jogadores');
  await A.evaluate(() => sessionStorage.setItem('peregrinos.started', '1')); await A.goto(URL, { waitUntil: 'domcontentloaded' }); await A.locator('.saguao').waitFor({ timeout: 15000 });

  console.log('2. A cria a sala pelo saguão, com um peregrino que já existe');
  await A.locator('.saguao .porta-btn', { hasText: 'Criar sala' }).click();
  await A.locator('.char-card', { hasText: 'Anfitriao' }).locator('.btn.gold').click();
  confere(await noJogo(A), 'A entrou no jogo');
  let cod = ''; for (let i = 0; i < 40 && !cod; i++) { await A.waitForTimeout(500); const t = await A.evaluate(() => document.querySelector('#overlay')?.innerText || ''); cod = (t.match(/Sala ([A-Z0-9]{5})/) || [])[1] || ''; if (!cod && t) await A.locator('#overlay button').last().click({ timeout: 700 }).catch(() => {}); }
  confere(!!cod, 'o código aparece na tela', 'sem diálogo da sala');
  let sA = await sala(A); confere(sA && sA.anf && sA.cod === cod, 'A é o anfitrião da sala ' + cod);
  await livre(A);
  confere(await A.evaluate(() => sessionStorage.getItem('peregrinos.sala') == null), 'a escolha do saguão foi consumida');

  console.log('3. B entra pelo código com um peregrino que já existe');
  const B = await abre(ctx); await B.locator('.saguao').waitFor({ timeout: 15000 });
  await B.locator('.saguao .porta-btn', { hasText: 'Entrar na sala' }).click(); await B.waitForTimeout(150);
  confere(/cinco letras/.test(await B.locator('.saguao-nota').first().innerText()), 'código vazio é recusado com aviso');
  await entrarPeloCodigo(B, cod);
  confere(await B.locator('.saguao .porta-btn.on').innerText() === 'Entrar na sala', 'a escolha fica marcada');
  await B.locator('.char-card', { hasText: 'Visitante' }).locator('.btn.gold').click();
  confere(await noJogo(B), 'B entrou no jogo'); let sB = await esperaSala(B, 1); await livre(B);
  confere(sB && sB.cod === cod && !sB.anf && sB.pares.includes('Anfitriao'), 'B está na sala e vê o anfitrião', JSON.stringify(sB));

  console.log('4. C entra pelo código e cria um peregrino novo');
  const C = await abre(ctx); await C.locator('.saguao').waitFor({ timeout: 15000 });
  await entrarPeloCodigo(C, cod); await C.locator('button', { hasText: 'Novo personagem' }).click(); await criar(C, 'Novato');
  confere(await noJogo(C), 'C criou o peregrino e entrou no jogo'); let sC = await esperaSala(C, 2); await livre(C);
  confere(sC && sC.cod === cod && sC.nome === 'Novato' && sC.pares.join() === 'Anfitriao,Visitante', 'C (peregrino novo) está na sala e vê os dois', JSON.stringify(sC));

  console.log('5. D não tem peregrino nenhum: boas-vindas, código, criação');
  const D = await abre(ctx); await D.evaluate(async () => { const { net } = await import('/src/net.js'); window.__lista = net.listChars.bind(net); }); // mesma lista do aparelho: simula o vazio escondendo-a
  await D.evaluate(async () => { const { net } = await import('/src/net.js'); net.listChars = async () => []; const m = await import('/src/ui/screens.js'), { showCreator } = m; await m.showSelect(c => window.__jogar(c), () => showCreator(c => window.__criado(c), () => {}), () => {}); }).catch(() => {});
  confere(await D.locator('.criar-primeiro').count() === 1 && await D.locator('.saguao').count() === 1, 'tela de boas-vindas com o painel de sala');
  await D.close();
  const ctx2 = await b.newContext({ viewport: { width: 1100, height: 640 } }); await ctx2.route('https://fonts.googleapis.com/**', r => r.abort()); await ctx2.addInitScript(INIT);
  const D2 = await abre(ctx2); await D2.locator('.criar-primeiro').waitFor({ timeout: 15000 });
  await entrarPeloCodigo(D2, 'ZZZZ9'); await D2.locator('.criar-primeiro').click(); await criar(D2, 'Sozinho');
  confere(await noJogo(D2), 'aparelho novo: criou o peregrino e entrou no jogo');
  let aviso = ''; for (let i = 0; i < 30 && !/Menu › Juntos/.test(aviso); i++) { await D2.waitForTimeout(500); aviso = await D2.evaluate(() => document.body.innerText); }
  confere(/Menu › Juntos/.test(aviso) && !(await sala(D2)), 'código que não existe: avisa e o jogo segue sozinho');
  await ctx2.close();

  console.log('6. Todos se veem e as posições chegam');
  sA = await esperaSala(A, 2); sB = await esperaSala(B, 2);
  confere(sA.pares.join() === 'Novato,Visitante', 'A vê os dois convidados', JSON.stringify(sA));
  confere(sB.pares.join() === 'Anfitriao,Novato', 'B vê o anfitrião e o novato', JSON.stringify(sB));
  confere(new Set([sA.eu, sB.eu, sC.eu]).size === 3, 'cada um tem um número diferente na sala');
  for (const p of [A, B, C]) await p.evaluate(async () => { const g = __game; if (g.area !== 'refugio') { g.cm.visto.tut = 99; g.entrar('refugio', { quieto: true }); } await new Promise(r => setTimeout(r, 400)); g.ui.closeAll?.(); });
  await B.evaluate(() => { __game.p.x += 260; }); await A.waitForTimeout(1800);
  const xB = await B.evaluate(() => Math.round(__game.p.x)), visto = await A.evaluate(() => { const o = [...__game.mp.pares.values()].find(q => q.nome === 'Visitante'); return o && [o.h.a, Math.round(o.h.x)]; });
  confere(visto && visto[0] === 'refugio' && Math.abs(visto[1] - xB) < 40, 'A recebe a posição de B', JSON.stringify([xB, visto]));
  await A.waitForTimeout(1500);
  const donos = (await Promise.all([A, B, C].map(sala))).map(s => s.dono);
  confere(donos.filter(Boolean).length === 1 && donos[0], 'na mesma área só um aparelho simula o mundo (o anfitrião)', JSON.stringify(donos));

  console.log('7. A sala tem limite e sobrevive à saída de um convidado');
  await semente(C, ['Quarto', 'Quinto']); // um peregrino aberto numa aba fica reservado para ela: os próximos usam outros
  const E = await abre(ctx); await E.locator('.saguao').waitFor({ timeout: 15000 }); await entrarPeloCodigo(E, cod); await E.locator('.char-card', { hasText: 'Quarto' }).locator('.btn.gold').click(); await noJogo(E); await esperaSala(E, 3); await livre(E);
  confere((await sala(E))?.pares.length === 3, 'o quarto peregrino entra');
  const F = await abre(ctx); await F.locator('.saguao').waitFor({ timeout: 15000 }); await entrarPeloCodigo(F, cod); await F.locator('.char-card', { hasText: 'Quinto' }).locator('.btn.gold').click(); await noJogo(F);
  let cheio = ''; for (let i = 0; i < 30 && !/quatro peregrinos/.test(cheio); i++) { await F.waitForTimeout(500); cheio = await F.evaluate(() => document.body.innerText); }
  confere(/quatro peregrinos/.test(cheio) && !(await sala(F)), 'o quinto é recusado: "A sala já tem quatro peregrinos"');
  await F.close(); await E.close(); await B.close();
  let dep = null; for (let i = 0; i < 40; i++) { dep = await sala(A); if (dep.pares.join() === 'Novato') break; await A.waitForTimeout(500); }
  confere(dep.pares.join() === 'Novato' && (await sala(C))?.cod === cod, 'convidados saem e a sala continua para quem ficou', JSON.stringify(dep));

  console.log('8. O anfitrião sai: a sala fecha para os convidados, sem perder o jogo');
  await A.close(); let fechou = false; for (let i = 0; i < 60 && !fechou; i++) { await C.waitForTimeout(500); fechou = !(await sala(C)); }
  confere(fechou && await C.evaluate(() => !!__game.running), 'C segue jogando sozinho depois que a sala fecha');

  console.log('9. O código do anfitrião é o mesmo da próxima vez');
  const A2 = await abre(ctx); await A2.locator('.saguao').waitFor({ timeout: 15000 }); await A2.locator('.saguao .porta-btn', { hasText: 'Criar sala' }).click(); await A2.locator('.char-card', { hasText: 'Anfitriao' }).locator('.btn.gold').click(); await noJogo(A2);
  let s2 = null; for (let i = 0; i < 30 && !s2; i++) { await A2.waitForTimeout(500); s2 = await sala(A2); }
  confere(s2 && s2.cod === cod && s2.anf, 'a sala reabre com o código ' + cod, JSON.stringify(s2));

  const erros = [A2, C].flatMap(p => p.erros);
  confere(!erros.length, 'nenhum erro de página', erros.join(' | '));
  await b.close();
  console.log(falhas.length ? '\n' + falhas.length + ' FALHA(S): ' + falhas.join('; ') : '\nTudo certo.'); process.exit(falhas.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
