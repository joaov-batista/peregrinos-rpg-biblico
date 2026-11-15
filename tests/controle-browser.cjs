// Joga só com o controle (um gamepad de mentira): da primeira tela até entrar no jogo, sem mouse nem teclado.
// Rodar com o servidor de desenvolvimento ligado (npm run dev): node tests/controle-browser.cjs [pasta para capturas]
const { chromium } = require('playwright');
const pasta = process.argv[2];
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1280, height: 720 } });
  await ctx.route('https://fonts.googleapis.com/**', r => r.abort());
  await ctx.addInitScript(() => {
    localStorage.setItem('peregrinos.config', JSON.stringify({ cinemas: false, volMusica: 0, volVoz: 0, volEfeitos: 0 }));
    const gp = window.__pad = { id: 'Falso (STANDARD GAMEPAD)', index: 0, connected: true, mapping: 'standard', timestamp: 0, axes: [0, 0, 0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0, touched: false })) };
    navigator.getGamepads = () => [gp];
    setTimeout(() => dispatchEvent(Object.assign(new Event('gamepadconnected'), { gamepad: gp })), 300);
  });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://127.0.0.1:5180', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(1500);
  let n = 0;
  const aperta = async (i, ms = 90) => { await p.evaluate(i => { __pad.buttons[i] = { pressed: true, value: 1 }; }, i); await p.waitForTimeout(ms); await p.evaluate(i => { __pad.buttons[i] = { pressed: false, value: 0 }; }, i); await p.waitForTimeout(260); };
  const B = { A: 0, B: 1, X: 2, Y: 3, cima: 12, baixo: 13, esq: 14, dir: 15, start: 9, LB: 4, RB: 5 };
  const onde = async (nota) => { const o = await p.evaluate(() => { const a = document.activeElement; const j = [...document.querySelectorAll('#overlay .modal')].pop() || document.getElementById('screens'); return { foco: a ? (a.tagName + '.' + a.className + ' "' + (a.textContent || a.placeholder || a.value || '').trim().slice(0, 40) + '"') : null, tela: (j?.querySelector('h2,h3,.title,.dlg-name')?.textContent || '').slice(0, 50), jogo: !!window.__game?.running, area: window.__game?.area }; }); console.log(String(++n).padStart(2), nota, JSON.stringify(o)); if (pasta) await p.screenshot({ path: pasta + '/' + String(n).padStart(2, '0') + '.png' }); return o; };
  const passos = (process.env.PASSOS || 'A;A;start;start;baixo;A;A;dir;A;dir;A;start;start;A').split(';').filter(Boolean); // padrão: cria um peregrino e entra no jogo
  await onde('início');
  for (const s of passos) { if (s.startsWith('js:')) { console.log('   ', JSON.stringify(await p.evaluate(s.slice(3)).catch(e => 'ERRO ' + e.message))); await p.waitForTimeout(500); await onde('js'); continue; } const [k, vezes = 1] = s.split('*'); for (let i = 0; i < +vezes; i++) await aperta(B[k]); await onde(s); }
  console.log('erros:', errs);
  await b.close();
})();
