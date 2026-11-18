// O jeito de lutar de cada chefe: como ele se move, como pensa, como o palco muda e os golpes que só ele tem.
// Nenhum golpe se repete entre chefes: cada um nasce do texto (as moedas de Mamom, o relógio da Procrastinação,
// a árvore cortada de Daniel 4, o rio que o Beemote bebe…). Os golpes recebem (G, b, m, dt) e devolvem true ao terminar;
// m = { t, e, def } (tempo no golpe, etapa e parâmetros). Tudo sempre avisado: dá para aprender e vencer sem levar dano.
// Jogando juntos, só o aparelho "dono" roda os golpes; o que mexe no corpo de um peregrino (puxar, prender, trocar de lugar,
// pesar, escorregar) vai numa zona, num dardo ou no palco do chefe, que todos recebem, e cada aparelho aplica no seu peregrino
// (efeitoNoJogador em jogo.js e o "jogador" de cada estilo).
import { rand, clamp, TAU } from '../util.js';
import { sfx } from '../audio.js';

/* ---------------- peças comuns (não são golpes: são o barro de que os golpes são feitos) ---------------- */
export const bala = (G, x, y, a, vel, o = {}) => { const t = { x, y, vx: Math.cos(a) * vel, vy: Math.sin(a) * vel, r: 8, vida: 4.5, cor: '#FFD23F', tipo: 'bola', ...o }; G.tiros.push(t); return t; };
export const centro = b => ({ x: b.x, y: b.y - b.h * 0.55 });
const angulo = (x, y, G) => Math.atan2(G.p.y - 20 - y, G.p.x - x);
const av = (G, s) => s * G.dif.aviso;
const vel = (G, v) => v * G.dif.vel;
let nMoeda = 0;
const zona = (G, z) => { if (z.tentacao && !z.cid) z.cid = 'm' + (++nMoeda) + Math.random().toString(36).slice(2, 7); G.zonas.push(z); return z; }; // a moeda maldita leva uma identidade igual em todos os aparelhos
const muro = (G, x, y, w, h, o = {}) => zona(G, { tipo: 'muro', x, y, w, h, aviso: 0.8, dur: 0.3, cor: '#FFFFFF', ...o });
const vivo = (G, t) => t && t.vida > 0 && G.tiros.includes(t);
const prepara = b => { b.vx *= 0.85; b.art.step = 1; b.tele = 1; };
const ataca = b => { b.art.step = 2; b.art.artAttack = (b.art.artAttack || 0) + 1; };
const guiar = (t, ax, ay, k, dt) => { const v = Math.hypot(t.vx, t.vy) || 1, a = Math.atan2(t.vy, t.vx), alvo = Math.atan2(ay - t.y, ax - t.x); let d = alvo - a; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; const na = a + clamp(d, -k * dt, k * dt); t.vx = Math.cos(na) * v; t.vy = Math.sin(na) * v; };
export function choque(G, b, cor = '#C9D2C4', v = 330) {
  const y = G.N.arena.chao;
  for (const s of [-1, 1]) G.tiros.push({ x: b.x + s * b.w / 2, y: y - 13, vx: s * vel(G, v), vy: 0, r: 13, vida: 2.4, cor, tipo: 'choque', fixo: true });
  G.tremor(7); sfx('block'); G.fx.po(b.x, y, 14, cor); b.pousou = 0.2;
}
const perto = (G, b) => Math.abs(G.p.x - b.x);
const noAr = G => !G.p.chao;
const deCostas = (G, b) => Math.sign(G.p.face) !== Math.sign(b.x - G.p.x);
const fase = b => b.fase || 0;

/* ======================================================================================================
   CORINTO (Atos 18)
   ====================================================================================================== */
const mamom = {
  // cobiça: se há moeda maldita no chão, vai buscá-la (e se recupera com ela); senão, persegue devagar
  mover(G, b, dt) {
    const A = G.N.arena, m = G.moedas.filter(q => q.maldita && q.x > A.x0 && q.x < A.x1).sort((a, c) => Math.abs(a.x - b.x) - Math.abs(c.x - b.x))[0];
    const alvo = m ? m.x : G.p.x, dx = alvo - b.x; b.face = Math.sign(dx) || b.face;
    b.vx = Math.abs(dx) > (m ? 8 : b.w * 0.7) ? b.face * (b.c.vel || 70) * (m ? 1.5 : 1) * (1 + fase(b) * 0.15) : 0;
    if (m && Math.abs(m.x - b.x) < 24) { if (G.moedaSumiu) G.moedaSumiu(m); else m.pego = true; G.moedas.splice(G.moedas.indexOf(m), 1); b.hp = Math.min(b.max, b.hp + b.max * 0.012); G.fx.sobe(b.x, b.y - 40, 6, '#FFD23F'); G.textoEm(b.x, b.y - b.h - 8, '+ouro', '#FFD23F', 11); sfx('coin'); }
  },
  // o ouro se amontoa nos cantos conforme ele perde vida; o brilho das pilhas cresce
  palco(G, b, dt) { const k = 1 - b.hp / b.max; b.cen.ouro = k; if (Math.random() < dt * (1 + k * 4)) G.parts.push({ x: rand(G.N.arena.x0, G.N.arena.x1), y: G.N.arena.chao - rand(2, 10 + k * 50), vx: 0, vy: -10, t: 0.5, max: 0.5, r: 1.2, cor: '#FFF3C4', g: 0 }); },
  pref: { cofre: (G, b) => perto(G, b) > 260 ? 2 : 0.6, moedao: G => noAr(G) ? 0.4 : 1.4, preco: (G, b) => perto(G, b) < 200 ? 1.6 : 1, ganancia: (G, b) => perto(G, b) > 180 ? 1.8 : 0.5 },
  golpes: {
    // o cofre se abre e puxa: tudo vai para ele; moedas espirradas caem em arco por cima
    cofre(G, b, m, dt) {
      if (m.e === 0) { prepara(b); if (m.t === 0) G.fala(b, 'Venha… tudo isto é seu.'); if (m.t > av(G, 0.75)) { m.e = 1; m.t0 = m.t; sfx('magic'); G.efeito('slamOuro', b.x, G.N.arena.chao); } return false; }
      ataca(b); b.vx = 0; G.puxao = { x: b.x, f: 150 + fase(b) * 40 };
      if ((m.prox ?? 0) <= m.t) { m.prox = m.t + 0.13; const c = centro(b); bala(G, c.x, c.y - 10, -Math.PI / 2 + rand(-0.9, 0.9), vel(G, rand(260, 420)), { g: 620, cor: '#FFD23F', r: 6 }); }
      if (m.t - m.t0 > 1.7 + fase(b) * 0.4) { G.puxao = null; return true; }
      return false;
    },
    // a moeda gigante rola pelo chão, bate na parede e volta: pule por cima
    moedao(G, b, m, dt) {
      const A = G.N.arena;
      if (m.e === 0) { prepara(b); if (m.t > av(G, 0.7)) { m.e = 1; const d = Math.sign(G.p.x - b.x) || 1; m.c = G.tiros[G.tiros.push({ x: b.x + d * 40, y: A.chao - 26, vx: d * vel(G, 380), vy: 0, r: 24, vida: 6, cor: '#FFD23F', tipo: 'bola', fura: true }) - 1]; m.batidas = 0; sfx('dodge'); ataca(b); } return false; }
      const c = m.c; if (!vivo(G, c)) return true;
      if ((c.x < A.x0 + 26 && c.vx < 0) || (c.x > A.x1 - 26 && c.vx > 0)) { c.vx *= -1.15; m.batidas++; G.tremor(5); sfx('block'); G.fx.po(c.x, c.y, 10, '#FFD23F'); }
      if (m.batidas > fase(b)) { c.vida = Math.min(c.vida, 0.8); return true; }
      return m.t > 5;
    },
    // "tudo tem preço": colunas de ouro caem no lugar onde você ESTAVA, uma atrás da outra
    preco(G, b, m) {
      prepara(b); const n = 4 + fase(b) * 2;
      if (m.t === 0) { m.n = 0; m.prox = 0.3; G.fala(b, 'Tudo tem preço!'); }
      if (m.t >= m.prox && m.n < n) { m.n++; m.prox = m.t + 0.38; zona(G, { tipo: 'col', x: clamp(G.p.x, G.N.arena.x0 + 30, G.N.arena.x1 - 30), w: 50, aviso: av(G, 0.7), dur: 0.25, cor: '#FFD23F', tentacao: m.n % 2 === 0 }); sfx('coin'); }
      return m.n >= n && m.t > m.prox + 0.8;
    },
    // avança espalhando moedas malditas pelo caminho: quem apanha fica pesado
    ganancia(G, b, m, dt) {
      const A = G.N.arena;
      if (m.e === 0) { if (m.t === 0) b.face = Math.sign(G.p.x - b.x) || 1; prepara(b); b.vx = 0; if (m.t > av(G, 0.65)) { m.e = 1; m.t0 = m.t; m.ux = b.x; sfx('dodge'); } return false; }
      if (m.e === 1) {
        ataca(b); b.corre = true; b.perigo = true; b.vx = b.face * vel(G, 560);
        if (Math.abs(b.x - m.ux) > 70) { m.ux = b.x; zona(G, { tipo: 'circ', x: b.x, y: A.chao - 20, r: 1, aviso: 0.02, dur: 0.3, cor: '#FFD23F', isca: true, tentacao: true }); } // a moeda nasce em todos os aparelhos (a zona dura mais que o intervalo da rede)
        if (b.parede === b.face || b.x < A.x0 + b.w / 2 + 6 || b.x > A.x1 - b.w / 2 - 6 || m.t - m.t0 > 1.8) { b.vx = 0; b.corre = false; b.perigo = false; G.efeito('slamOuro', b.x + b.face * b.w / 2, A.chao); G.tremor(9); sfx('block'); m.e = 2; m.t0 = m.t; }
        return false;
      }
      return m.t - m.t0 > 0.6;
    },
    // as pilhas de ouro desabam dos dois cantos ao mesmo tempo: duas ondas baixas que se cruzam
    avalanche(G, b, m, dt) {
      const A = G.N.arena;
      if (m.e === 0) { prepara(b); if (m.t === 0) { G.fala(b, 'SIRVA A MIM!'); b.cen.treme = 1; } if (m.t > av(G, 1)) { m.e = 1; m.z = [-1, 1].map(s => muro(G, s < 0 ? A.x0 : A.x1 - 70, A.chao - 34, 70, 34, { aviso: 0, dur: 4, cor: '#FFD23F', dir: -s })); sfx('boss'); G.tremor(8); } return false; }
      ataca(b); b.cen.treme = 0;
      for (const z of m.z) z.x += z.dir * vel(G, 240) * dt;
      if (m.z[0].x > A.x1 || m.t > 5.5) { for (const z of m.z) z.dur = 0; return true; }
      return false;
    }
  }
};

const procrastinacao = {
  // não persegue ninguém: se você chega perto ela boceja e se arrasta para longe, devagar
  mover(G, b, dt) { const A = G.N.arena, dx = G.p.x - b.x; b.face = Math.sign(dx) || b.face; const fugir = Math.abs(dx) < 170; b.vx = fugir ? -b.face * 28 : 0; if (fugir && Math.random() < dt * 0.8) G.fala(b, '…ainda não…'); b.x = clamp(b.x, A.x0 + 80, A.x1 - 80); },
  // o relógio gigante ao fundo: os ponteiros andam para trás enquanto ela se cura
  palco(G, b, dt) { const curando = (b.semGolpe || 0) > (b.c.regras?.regenera?.apos || 2); b.cen.horas = (b.cen.horas || 0) + dt * (curando ? -2.5 : 0.35 + fase(b) * 0.4); b.cen.volta = curando ? 1 : 0; },
  pref: { relogio: (G, b) => perto(G, b) < 260 ? 1.6 : 1, soneca: (G, b) => perto(G, b) < 200 ? 2 : 0.3, ampulheta: (G, b) => perto(G, b) > 250 ? 1.8 : 0.8, adiar: () => 1.2, tiquetaque: G => noAr(G) ? 0.6 : 1.3 },
  golpes: {
    // os ponteiros do relógio giram e varrem a arena (só ela tem relógio)
    relogio(G, b, m, dt) {
      const d = m.def; b.vx = 0; b.art.step = 1;
      if (m.t === 0) { b.raios = { a: rand(0, TAU), n: d.n || 2, giro: (d.giro || 1) * G.dif.vel, aviso: av(G, 0.95), len: 560 }; sfx('magic'); }
      const r = b.raios; if (!r) return true;
      r.aviso -= dt; if (r.aviso <= 0) r.a += r.giro * dt;
      if (m.t > (d.dur || 3.6) + 0.95) { b.raios = null; return true; }
      return false;
    },
    // a soneca: um círculo de sono em volta dela; quem fica dentro adormece
    soneca(G, b, m) { b.vx = 0; prepara(b); if (m.t === 0) { G.fala(b, 'Descanse só um pouquinho…'); zona(G, { tipo: 'circ', x: b.x, y: b.y - 40, r: m.def.raio || 170, aviso: av(G, 1.25), dur: 0.2, cor: '#A5CDCE', efeito: 'sono' }); } return m.t > 1.6; },
    // a ampulheta vira sobre você: um fio de areia te segue, lento, até cair inteiro
    ampulheta(G, b, m, dt) {
      prepara(b);
      if (m.t === 0) { m.z = zona(G, { tipo: 'col', x: G.p.x, w: 40, aviso: av(G, 0.7), dur: 2.6 + fase(b) * 0.6, cor: '#E6D29A' }); G.fala(b, 'Amanhã… amanhã…'); sfx('magic'); }
      if (m.z.dur > 0) m.z.x += clamp(G.p.x - m.z.x, -1, 1) * vel(G, 70 + fase(b) * 30) * dt;
      if (m.z.aviso <= 0 && Math.random() < dt * 30) G.parts.push({ x: m.z.x + rand(-14, 14), y: G.N.arena.chao - 4, vx: rand(-60, 60), vy: -80, t: 0.4, max: 0.4, r: 1.3, cor: '#E6D29A', g: 300 });
      return m.z.dur <= 0 || m.t > 5;
    },
    // "depois eu faço": os dardos param no ar… e voltam todos de uma vez
    adiar(G, b, m, dt) {
      const c = centro(b);
      if (m.e === 0) { prepara(b); if (m.t > av(G, 0.6)) { m.e = 1; m.t0 = m.t; const n = 7 + fase(b) * 2; m.bs = []; for (let i = 0; i < n; i++) m.bs.push(bala(G, c.x, c.y, -Math.PI / 2 + (i - (n - 1) / 2) * 0.32, vel(G, 260), { cor: '#A5CDCE', vida: 6, fura: true })); sfx('shoot'); } return false; }
      ataca(b); const dt0 = m.t - m.t0;
      if (dt0 > 0.4 && !m.parou) { m.parou = true; for (const t of m.bs) { t.vx = 0; t.vy = 0; } sfx('click'); G.textoEm(c.x, c.y - 60, 'depois…', '#A5CDCE', 13); }
      if (dt0 > 1.6 && !m.foi) { m.foi = true; for (const t of m.bs) if (vivo(G, t)) { const a = angulo(t.x, t.y, G); t.vx = Math.cos(a) * vel(G, 330); t.vy = Math.sin(a) * vel(G, 330); t.fura = false; } sfx('shoot'); }
      return dt0 > 2.2;
    },
    // tique-taque: metade do chão, depois a outra, cada vez mais rápido
    tiquetaque(G, b, m) {
      const A = G.N.arena, n = 4 + fase(b) * 2, meio = (A.x0 + A.x1) / 2;
      if (m.t === 0) { m.n = 0; m.prox = 0.2; }
      prepara(b);
      if (m.t >= m.prox && m.n < n) { const lado = (m.n + (G.p.x > meio ? 1 : 0)) % 2; muro(G, lado ? meio : A.x0, A.chao - 40, meio - A.x0, 40, { aviso: av(G, Math.max(0.45, 0.85 - m.n * 0.07)), dur: 0.2, cor: '#A5CDCE' }); m.n++; m.prox = m.t + Math.max(0.5, 0.95 - m.n * 0.08); sfx(m.n % 2 ? 'click' : 'key'); }
      return m.n >= n && m.t > m.prox + 0.5;
    }
  }
};

const mentira = {
  // espelho: ela flutua sempre do lado oposto da arena, refletindo você
  mover(G, b, dt) { const A = G.N.arena, tx = clamp(2 * A.cx - G.p.x, A.x0 + 80, A.x1 - 80), ty = A.chao - b.c.voa + Math.sin(b.t * 1.4) * 22; b.face = Math.sign(G.p.x - b.x) || b.face; b.vx = clamp((tx - b.x) * 2, -(b.c.vel || 90) * 1.4, (b.c.vel || 90) * 1.4); b.y += clamp(ty - b.y, -1, 1) * 140 * dt; },
  // espelhos falsos no fundo: mostram o reflexo dela, e a cada fase mais deles se acendem
  palco(G, b, dt) { b.cen.espelhos = 2 + fase(b) * 2; b.cen.inv = G.invertido > 0 ? 1 : 0; },
  pref: { copias: (G, b) => b.clones.length ? 0 : 1.2, meiaVerdade: () => 1.2, inverter: G => G.invertido > 0 ? 0 : 1, troca: (G, b) => perto(G, b) > 300 ? 1.5 : 0.5, boato: () => 1 },
  golpes: {
    // cópias: só a luz da lâmpada denuncia as falsas
    copias(G, b, m) {
      const A = G.N.arena, n = m.def.n || 3; b.vx = 0;
      if (m.e === 0) { b.alpha = Math.max(0, 1 - m.t / 0.35); b.semDano = 0.2; if (m.t > 0.35) {
        m.e = 1; m.t0 = m.t; b.clones = [];
        const vagas = Array.from({ length: n + 1 }, (_, i) => ({ x: A.x0 + 70 + i * (A.x1 - A.x0 - 140) / n, y: A.chao - b.c.voa - (i % 2) * 70 })), real = Math.floor(rand(0, n + 1));
        vagas.forEach((v, i) => { if (i === real) { b.x = v.x; b.y = v.y; } else b.clones.push({ x: v.x, y: v.y, t: 6.5, alpha: 0, art: { ...b.art } }); });
        G.grito('Qual é o verdadeiro?'); sfx('magic'); G.efeito('fumacaRoxa', b.x, b.y);
      } return false; }
      const dt0 = m.t - m.t0;
      if (m.e === 1) { b.alpha = Math.min(1, dt0 / 0.4); for (const c of b.clones) c.alpha = b.alpha; b.tele = 1; if (dt0 > av(G, 1.25)) { m.e = 2; m.t0 = m.t; for (const o of [b, ...b.clones]) { const cx = o.x, cy = o.y - b.h * 0.55, a = Math.atan2(G.p.y - 20 - cy, G.p.x - cx); bala(G, cx, cy, a, vel(G, 270), { cor: '#C79BFF' }); } sfx('shoot'); } return false; }
      return dt0 > 1.2;
    },
    // meia-verdade: bolhas brancas, inofensivas na aparência… que mudam de cor e vêm atrás de você
    meiaVerdade(G, b, m, dt) {
      const c = centro(b);
      if (m.e === 0) { prepara(b); if (m.t > av(G, 0.55)) { m.e = 1; m.t0 = m.t; const n = 5 + fase(b) * 2; m.bs = []; for (let i = 0; i < n; i++) m.bs.push(bala(G, c.x, c.y, i / n * TAU, vel(G, 90), { cor: '#F4F1E6', r: 7, vida: 5, fura: true })); sfx('magic'); } return false; }
      ataca(b); const dt0 = m.t - m.t0;
      if (dt0 > 0.9 && !m.virou) { m.virou = true; for (const t of m.bs) if (vivo(G, t)) { t.cor = '#C79BFF'; const a = angulo(t.x, t.y, G); t.vx = Math.cos(a) * vel(G, 300); t.vy = Math.sin(a) * vel(G, 300); t.fura = false; } G.textoEm(c.x, c.y - 50, 'era mentira!', '#C79BFF', 13); sfx('shoot'); }
      return dt0 > 1.5;
    },
    // a palavra torta: um círculo que, se te pega, troca esquerda e direita por alguns segundos
    inverter(G, b, m) { prepara(b); if (m.t === 0) { G.fala(b, 'Esquerda é direita…'); zona(G, { tipo: 'circ', x: G.p.x, y: G.p.y - 20, r: 70, aviso: av(G, 0.95), dur: 0.25, cor: '#C79BFF', efeito: 'inverte' }); sfx('magic'); } return m.t > 1.4; },
    // a troca: uma linha liga vocês dois… e de repente você está onde ela estava
    troca(G, b, m) {
      prepara(b);
      const A = G.N.arena;
      if (m.t === 0) { m.z = zona(G, { tipo: 'circ', x: G.p.x, y: G.p.y - 20, r: 64, aviso: av(G, 1.05), dur: 0.12, cor: '#C79BFF', efeito: 'troca', tx: clamp(b.x, A.x0 + 30, A.x1 - 30) }); b.cen.laco = { x: m.z.x, y: m.z.y }; G.fala(b, 'Quem é quem?'); }
      if (m.t > av(G, 1.05) && !m.fez) {
        m.fez = true; b.cen.laco = 0; const px = m.z.x; G.efeito('fumacaRoxa', b.x, b.y); G.efeito('fumacaRoxa', px, m.z.y);
        b.x = clamp(px, A.x0 + 80, A.x1 - 80); sfx('magic'); G.clarao = 0.12;
        const c = centro(b); for (let i = -1; i <= 1; i++) bala(G, c.x, c.y, angulo(c.x, c.y, G) + i * 0.3, vel(G, 250), { cor: '#C79BFF' });
      }
      return m.t > 1.8;
    },
    // o boato corre e serpenteia: uma fila de dardos que ondula enquanto avança
    boato(G, b, m, dt) {
      const c = centro(b);
      if (m.t === 0) { m.n = 0; m.prox = 0.45; m.bs = []; m.dir = Math.sign(G.p.x - b.x) || 1; }
      prepara(b);
      if (m.t >= m.prox && m.n < 10 + fase(b) * 3) { m.n++; m.prox = m.t + 0.09; m.bs.push(bala(G, c.x, c.y, m.dir > 0 ? 0 : Math.PI, vel(G, 240), { cor: '#C79BFF', r: 6, nasc: m.t })); sfx('click'); }
      for (const t of m.bs) if (vivo(G, t)) t.vy = Math.cos((m.t - t.nasc) * 7) * 170;
      return m.n >= 10 + fase(b) * 3 && m.t > m.prox + 1.6;
    }
  }
};

const imoralidade = {
  // insinuante: vem chegando devagar e para a um passo, balançando; nunca dá as costas
  mover(G, b, dt) { const dx = G.p.x - b.x; b.face = Math.sign(dx) || b.face; b.vx = Math.abs(dx) > 150 ? b.face * (b.c.vel || 55) : Math.sin(b.t * 2) * 20; },
  // a névoa rosada sobe do chão a cada fase e as pétalas caem
  palco(G, b, dt) { b.cen.nevoa = 0.25 + fase(b) * 0.3; if (Math.random() < dt * 6) G.parts.push({ x: rand(G.N.arena.x0, G.N.arena.x1), y: G.N.arena.y0 + 10, vx: rand(-20, 20), vy: 40, t: 3, max: 3, r: 1.4, cor: '#FF8FB8', g: 0 }); },
  pref: { encanto: (G, b) => perto(G, b) < 300 ? 1.4 : 0.6, laco: (G, b) => perto(G, b) < 280 ? 1.6 : 0.4, perfume: () => 1, beijos: (G, b) => perto(G, b) > 220 ? 1.5 : 0.7, cilada: G => noAr(G) ? 0.5 : 1.2 },
  golpes: {
    // o encanto puxa: fugir (de verdade) a deixa exposta — "Fugi da imoralidade" (1Co 6:18)
    encanto(G, b, m) {
      const d = m.def; b.vx = 0; b.art.step = 1; b.art.talk = true;
      if (m.t === 0) { G.fala(b, 'Chegue mais perto…'); m.fugiu = false; sfx('magic'); }
      G.puxao = { x: b.x, f: 210 }; b.encanta = true;
      if (G.p.dashT > 0 && Math.sign(G.p.dashDir) === Math.sign(G.p.x - b.x)) m.fugiu = true;
      if (m.t > (d.dur || 2.4)) { b.encanta = false; b.art.talk = false; G.puxao = null; if (m.fugiu || Math.abs(G.p.x - b.x) > 300) { G.postura(b, 55); b.exposto = 2.6; G.textoEm(b.x, b.y - b.h - 12, 'Você fugiu! Ela está exposta', '#FFE9A8'); sfx('parry'); } return true; }
      return false;
    },
    // o laço de fita: estala na altura do peito; quem é pego é arrastado para ela
    laco(G, b, m) {
      if (m.e === 0) { if (m.t === 0) b.face = Math.sign(G.p.x - b.x) || 1; prepara(b); if (m.t === 0) { const w = 300; m.z = muro(G, b.face > 0 ? b.x : b.x - w, b.y - 56, w, 18, { aviso: av(G, 0.7), dur: 0.22, cor: '#FF8FB8', efeito: 'puxa', px: b.x, forca: 520, msg: 'preso no laço!' }); } if (m.t > av(G, 0.7)) { m.e = 1; m.t0 = m.t; ataca(b); sfx('swing'); } return false; }
      return m.t - m.t0 > 0.7;
    },
    // o perfume: nuvens doces que vão atrás de você, devagar, sem pressa
    perfume(G, b, m, dt) {
      prepara(b);
      if (m.t === 0) { m.zs = [-1, 0, 1].slice(0, 2 + fase(b)).map(i => zona(G, { tipo: 'circ', x: b.x + i * 90, y: b.y - 40, r: 46, aviso: av(G, 0.6), dur: 3.4, cor: '#FFB3D0' })); sfx('magic'); }
      for (const z of m.zs) if (z.dur > 0) { z.x += clamp(G.p.x - z.x, -1, 1) * vel(G, 85) * dt; z.y += clamp(G.p.y - 20 - z.y, -1, 1) * 40 * dt; }
      return m.zs.every(z => z.dur <= 0) || m.t > 5;
    },
    // beijos: corações que fazem curva e procuram você por um instante
    beijos(G, b, m, dt) {
      const c = centro(b);
      if (m.e === 0) { prepara(b); if (m.t > av(G, 0.55)) { m.e = 1; m.t0 = m.t; const n = 4 + fase(b); m.bs = []; for (let i = 0; i < n; i++) m.bs.push(bala(G, c.x, c.y, -Math.PI / 2 + (i - (n - 1) / 2) * 0.55, vel(G, 230), { cor: '#FF5E9A', r: 7 })); sfx('shoot'); } return false; }
      ataca(b); const dt0 = m.t - m.t0;
      if (dt0 < 1.3) for (const t of m.bs) if (vivo(G, t)) guiar(t, G.p.x, G.p.y - 20, 2.2, dt);
      return dt0 > 1.4;
    },
    // a cilada: armadilhas escondidas no chão — a lâmpada mostra onde estão
    cilada(G, b, m) {
      const A = G.N.arena;
      if (m.t === 0) { for (let i = 0; i < 3 + fase(b); i++) { const x = clamp(G.p.x + (i - 1) * 150 + rand(-30, 30), A.x0 + 50, A.x1 - 90); muro(G, x, A.chao - 24, 80, 24, { aviso: av(G, 1.5), dur: 0.35, cor: '#FF5E9A', oculta: true }); } G.fala(b, 'Ninguém está olhando…'); }
      prepara(b); return m.t > av(G, 1.5) + 0.6;
    }
  }
};

const satanas = {
  // "anda em derredor, bramando como leão" (1Pe 5:8): ronda a arena numa elipse, sem parar
  mover(G, b, dt) { const A = G.N.arena, w = (A.x1 - A.x0) * 0.38, a = (b.cen.ronda = (b.cen.ronda || 0) + dt * (0.55 + fase(b) * 0.12)), tx = A.cx + Math.cos(a) * w, ty = A.chao - b.c.voa - Math.sin(a) * 70; b.vx = clamp((tx - b.x) * 3, -260, 260); b.y += clamp(ty - b.y, -1, 1) * 200 * dt; b.face = Math.sign(G.p.x - b.x) || b.face; },
  // o fogo sobe nas bordas a cada fase e o céu racha; braseiros acesos nos cantos
  palco(G, b, dt) { const A = G.N.arena; b.cen.fogo = 0.2 + fase(b) * 0.27; b.cen.br = (b.cen.br || 0) - dt; if (b.cen.br <= 0) { b.cen.br = 1.4; G.efeito('braseiro', A.x0 + 24, A.chao, 1, { atras: true }); G.efeito('braseiro', A.x1 - 24, A.chao, 1, { atras: true }); } if (fase(b) >= 3 && Math.random() < dt * 14) G.parts.push({ x: rand(A.x0, A.x1), y: A.y0, vx: rand(-10, 10), vy: 50, t: 4, max: 4, r: 1.2, cor: '#5A4A4A', g: 0 }); },
  pref: { dardos: () => 1.2, acusacao: () => 1, abismo: G => noAr(G) ? 0.4 : 1.2, cadeias: (G, b) => perto(G, b) < 300 ? 1.3 : 0.8, leao: (G, b) => perto(G, b) > 200 ? 1.6 : 0.6 },
  golpes: {
    // os dardos inflamados do maligno (Ef 6:16): chegam pelas bordas, na sua altura — erga a lâmpada como escudo
    dardos(G, b, m) {
      const A = G.N.arena, n = 5 + fase(b) * 2;
      if (m.t === 0) { m.n = 0; m.prox = av(G, 0.5); G.fala(b, 'Nenhum escudo vai te guardar!'); }
      prepara(b);
      if (m.t >= m.prox && m.n < n) { const lado = m.n % 2 ? 1 : -1, x = lado < 0 ? A.x0 + 6 : A.x1 - 6; bala(G, x, G.p.y - 22, lado < 0 ? 0 : Math.PI, vel(G, 380), { cor: '#FF5A3C', tipo: 'fogo', r: 8 }); G.fx.po(x, G.p.y - 22, 6, '#FF8A2A'); m.n++; m.prox = m.t + 0.42; sfx('shoot'); }
      return m.n >= n && m.t > m.prox + 0.8;
    },
    // a acusação desce de ponta a ponta da arena, letra por letra: C-U-L-P-A-D-O
    acusacao(G, b, m) {
      const A = G.N.arena, L = 'CULPADO', dir = m.def.dir || (G.p.x > A.cx ? -1 : 1);
      if (m.t === 0) { m.n = 0; m.prox = 0.2; G.grito('CULPADO!'); }
      prepara(b);
      if (m.t >= m.prox && m.n < L.length) { const k = dir > 0 ? m.n : L.length - 1 - m.n, x = A.x0 + 60 + k * (A.x1 - A.x0 - 120) / (L.length - 1); zona(G, { tipo: 'col', x, w: 64, aviso: av(G, 0.8), dur: 0.3, cor: '#FF5A3C', letra: L[k] }); m.n++; m.prox = m.t + 0.2; sfx('hit'); }
      return m.n >= L.length && m.t > m.prox + 1;
    },
    // o abismo se abre: o chão inteiro queima — só as plataformas seguram
    abismo(G, b, m) { const A = G.N.arena; prepara(b); if (m.t === 0) { muro(G, A.x0, A.chao - 22, A.x1 - A.x0, 22, { aviso: av(G, 1.35), dur: 1.4 + fase(b) * 0.3, cor: '#FF5A3C', lava: true }); G.fala(b, 'Desça comigo!'); G.tremor(6); } if (m.t > av(G, 1.35) && !m.fez) { m.fez = true; G.efeito('explosaoFogo', A.cx, A.chao); G.tremor(12); } return m.t > av(G, 1.35) + 1.5 + fase(b) * 0.3; },
    // as cadeias rompem o chão em pares, de você para fora
    cadeias(G, b, m) {
      const A = G.N.arena, px = m.px ?? (m.px = G.p.x), n = 3 + fase(b);
      if (m.t === 0) { m.n = 0; m.prox = 0.15; }
      prepara(b);
      if (m.t >= m.prox && m.n < n) { for (const s of m.n ? [-1, 1] : [0]) zona(G, { tipo: 'col', x: clamp(px + s * m.n * 80, A.x0 + 20, A.x1 - 20), w: 30, y0: A.chao - 150, aviso: av(G, 0.65), dur: 0.35, cor: '#9A8A8A', corrente: true }); m.n++; m.prox = m.t + 0.22; sfx('block'); }
      return m.n >= n && m.t > m.prox + 0.8;
    },
    // o leão salta: um bote em diagonal, do alto até onde você estava, e o chão explode em fogo
    leao(G, b, m, dt) {
      const A = G.N.arena;
      if (m.e === 0) { prepara(b); b.vx = 0; if (m.t === 0) { G.fala(b, 'RRRAAAH!'); m.alvo = { x: clamp(G.p.x, A.x0 + 60, A.x1 - 60) }; zona(G, { tipo: 'circ', x: m.alvo.x, y: A.chao - 30, r: 80, aviso: av(G, 0.9), dur: 0.01, cor: '#FF5A3C', isca: true }); } if (m.t > av(G, 0.9)) { m.e = 1; m.t0 = m.t; m.x0 = b.x; m.y0 = b.y; sfx('dodge'); } return false; }
      if (m.e === 1) { ataca(b); b.perigo = true; const k = clamp((m.t - m.t0) / 0.42, 0, 1); b.x = m.x0 + (m.alvo.x - m.x0) * k; b.y = m.y0 + (A.chao - m.y0) * k * k; if (k >= 1) { m.e = 2; m.t0 = m.t; b.perigo = false; G.efeito('explosaoFogo', b.x, A.chao); choque(G, b, '#FF8A2A', 300); G.tremor(12); } return false; }
      if (m.t - m.t0 > 1) { b.y -= 300 * dt; if (b.y <= A.chao - b.c.voa) return true; }
      return m.t - m.t0 > 2.5;
    }
  }
};

/* ======================================================================================================
   JONAS
   ====================================================================================================== */
const fuga = {
  // ele sempre corre para o outro lado; encurralado, pula por cima de você
  mover(G, b, dt) {
    const A = G.N.arena, dx = G.p.x - b.x, encurralado = b.x < A.x0 + 90 || b.x > A.x1 - 90;
    b.face = -Math.sign(dx) || b.face; b.vx = Math.abs(dx) < 340 ? b.face * (b.c.vel || 110) : 0;
    if (encurralado && Math.abs(dx) < 160 && b.chao) { b.vy = -880; b.vx = Math.sign(dx) * 420; b.chao = false; G.fala(b, 'Para longe!'); }
  },
  // o convés inclina, cada vez mais: você escorrega para o lado mais baixo
  palco(G, b, dt) { b.cen.incl = Math.sin(b.t * 0.55) * (0.35 + fase(b) * 0.45); },
  jogador(G, b, p, dt) { if (p.chao && !(p.dashT > 0)) p.x += (b.cen.incl || 0) * 70 * dt; },
  pref: { bilhetes: (G, b) => perto(G, b) > 200 ? 1.4 : 0.8, outroNavio: () => 1.1, ancora: () => 1, corda: G => noAr(G) ? 0.5 : 1.2 },
  golpes: {
    // passagens para Társis: cartas que vão… e voltam para a mão dele, como bumerangue
    bilhetes(G, b, m, dt) {
      const c = centro(b);
      if (m.e === 0) { prepara(b); if (m.t > av(G, 0.5)) { m.e = 1; m.t0 = m.t; const a0 = angulo(c.x, c.y, G), n = 3 + fase(b) * 2; m.bs = []; for (let i = 0; i < n; i++) m.bs.push(bala(G, c.x, c.y, a0 + (i - (n - 1) / 2) * 0.28, vel(G, 380), { cor: '#79D9CD', r: 6, vida: 4, fura: true })); sfx('shoot'); } return false; }
      ataca(b); const dt0 = m.t - m.t0;
      for (const t of m.bs) if (vivo(G, t)) { if (dt0 < 0.75) { t.vx *= 1 - 1.6 * dt; t.vy *= 1 - 1.6 * dt; } else guiar(t, b.x, b.y - b.h * 0.55, 9, dt), t.vx *= 1 + 2.4 * dt, t.vy *= 1 + 2.4 * dt; if (dt0 > 0.9 && Math.hypot(t.x - b.x, t.y - b.y + b.h * 0.55) < 30) t.vida = 0; }
      return dt0 > 2.4 || m.bs.every(t => !vivo(G, t));
    },
    // "sempre há outro navio": some por um lado da arena e atravessa correndo, vindo do outro
    outroNavio(G, b, m, dt) {
      const A = G.N.arena;
      if (m.e === 0) { b.face = b.x > A.cx ? 1 : -1; b.vx = b.face * 300; b.alpha = Math.max(0, 1 - m.t / 0.5); b.semDano = 0.2; if (m.t === 0) G.fala(b, 'Sempre há outro navio…'); if (m.t > 0.5) { m.e = 1; m.t0 = m.t; b.face *= -1; b.x = b.face > 0 ? A.x0 + b.w / 2 + 2 : A.x1 - b.w / 2 - 2; b.vx = 0; zona(G, { tipo: 'muro', x: A.x0, y: A.chao - 60, w: A.x1 - A.x0, h: 60, aviso: av(G, 0.8), dur: 0.01, cor: '#79D9CD', isca: true }); } return false; }
      if (m.e === 1) { b.semDano = 0.2; b.alpha = 0.3; if (m.t - m.t0 > av(G, 0.8)) { m.e = 2; m.t0 = m.t; b.alpha = 1; sfx('dodge'); } return false; }
      ataca(b); b.corre = true; b.perigo = true; b.vx = b.face * vel(G, 620);
      if ((b.face > 0 && b.x > A.x1 - b.w / 2 - 8) || (b.face < 0 && b.x < A.x0 + b.w / 2 + 8) || m.t - m.t0 > 2) { b.corre = false; b.perigo = false; b.vx = 0; G.efeito('pouso', b.x, A.chao); return true; }
      return false;
    },
    // a âncora cai sobre você e depois é arrastada de volta pelo chão, presa à corrente
    ancora(G, b, m, dt) {
      const A = G.N.arena;
      if (m.e === 0) { prepara(b); if (m.t === 0) { m.x = clamp(G.p.x, A.x0 + 40, A.x1 - 40); zona(G, { tipo: 'col', x: m.x, w: 56, aviso: av(G, 0.8), dur: 0.25, cor: '#6E7F8A' }); } if (m.t > av(G, 0.8)) { m.e = 1; m.t0 = m.t; G.efeito('pouso', m.x, A.chao); G.tremor(9); m.z = muro(G, m.x - 24, A.chao - 30, 48, 30, { aviso: 0.35, dur: 3, cor: '#6E7F8A', ancora: true }); } return false; }
      ataca(b); const d = Math.sign(b.x - m.z.x); if (m.z.aviso <= 0) m.z.x += d * vel(G, 260) * dt;
      b.cen.corrente = { x: m.z.x + 24, y: A.chao - 15 };
      if (Math.abs(m.z.x + 24 - b.x) < 30 || m.t > 4.5) { m.z.dur = 0; b.cen.corrente = null; return true; }
      return false;
    },
    // a corda do mastro balança de um lado ao outro, na altura do peito
    corda(G, b, m, dt) {
      const A = G.N.arena, L = (A.x1 - A.x0) * 0.42;
      if (m.t === 0) { m.z = muro(G, A.cx - 15, A.chao - 110, 30, 70, { aviso: av(G, 0.9), dur: 3 + fase(b), cor: '#B49C65' }); G.fala(b, 'Segurem as cordas!'); }
      prepara(b); const k = Math.max(0, m.t - av(G, 0.9));
      m.z.x = A.cx - 15 + Math.sin(k * (1.7 + fase(b) * 0.4)) * L; b.cen.corda = { x: m.z.x + 15, y: m.z.y };
      if (m.z.dur <= 0) { b.cen.corda = null; return true; }
      return false;
    }
  }
};

const pavor = {
  // tempestade: pisca de um ponto a outro do céu, nunca está onde você espera
  mover(G, b, dt) {
    const A = G.N.arena; b.cen.salto = (b.cen.salto ?? 1.4) - dt;
    if (b.cen.salto <= 0) { b.cen.salto = rand(1, 1.8) - fase(b) * 0.3; G.efeito('fumacaNegra', b.x, b.y - 20); b.x = clamp(G.p.x + rand(-260, 260), A.x0 + 80, A.x1 - 80); b.y = A.chao - b.c.voa - rand(0, 70); G.clarao = 0.06; }
    b.vx = Math.sin(b.t * 7) * 40; b.face = Math.sign(G.p.x - b.x) || b.face;
  },
  // relâmpagos iluminam o céu de tempos em tempos; o mar sobe pelo costado
  palco(G, b, dt) { b.cen.flash = Math.max(0, (b.cen.flash || 0) - dt); if (Math.random() < dt * (0.25 + fase(b) * 0.3)) { b.cen.flash = 0.25; b.cen.raioX = rand(G.N.arena.x0, G.N.arena.x1); G.clarao = 0.1; sfx('hit'); } b.cen.mar = 0.3 + fase(b) * 0.4; },
  pref: { relampago: () => 1.2, vagalhao: (G, b) => 1, rajada: (G, b) => 0.9, granizo: () => 1 },
  golpes: {
    // a nuvem segue você; o raio cai em garfo: um no meio, dois dos lados
    relampago(G, b, m, dt) {
      const A = G.N.arena, n = 2 + fase(b);
      if (m.t === 0) { m.n = 0; m.prox = 0; }
      prepara(b);
      if (m.t >= m.prox && m.n < n) { const x = clamp(G.p.x, A.x0 + 60, A.x1 - 60); zona(G, { tipo: 'col', x, w: 40, aviso: av(G, 0.75), dur: 0.2, cor: '#F4E6AE' }); for (const s of [-1, 1]) zona(G, { tipo: 'col', x: clamp(x + s * 110, A.x0 + 20, A.x1 - 20), w: 30, aviso: av(G, 1.05), dur: 0.2, cor: '#F4E6AE' }); m.n++; m.prox = m.t + 1.2; b.cen.nuvem = x; }
      if (b.cen.nuvem != null) b.cen.nuvem += (G.p.x - b.cen.nuvem) * dt * 2;
      if (m.n >= n && m.t > m.prox) { b.cen.nuvem = null; return true; }
      return false;
    },
    // o vagalhão atravessa o convés como uma parede d'água: suba nas plataformas
    vagalhao(G, b, m, dt) {
      const A = G.N.arena;
      if (m.e === 0) { prepara(b); if (m.t === 0) { m.dir = G.p.x > A.cx ? -1 : 1; G.grito('VAGALHÃO!'); } if (m.t > av(G, 1.2)) { m.e = 1; m.z = muro(G, m.dir > 0 ? A.x0 : A.x1 - 70, A.chao - 70, 70, 70, { aviso: 0, dur: 5, cor: '120,210,245', onda: true }); G.tremor(8); sfx('boss'); } return false; }
      ataca(b); m.z.x += m.dir * vel(G, 330) * dt; if (Math.random() < dt * 40) G.parts.push({ x: m.z.x + 35, y: A.chao - 70, vx: rand(-60, 60), vy: rand(-200, -80), t: 0.6, max: 0.6, r: 1.6, cor: '#BFF0F8', g: 400 });
      if (m.z.x < A.x0 - 80 || m.z.x > A.x1 + 10) { m.z.dur = 0; return true; }
      return m.t > 6;
    },
    // a rajada empurra você para a amurada enquanto a espuma vem rasteira
    rajada(G, b, m) {
      const A = G.N.arena;
      if (m.t === 0) { const f = G.p.x > A.cx ? 1 : -1; G.soprar(2.2 + fase(b) * 0.5, f * (380 + fase(b) * 120), 'o vento te arrasta!'); m.n = 0; m.prox = 0.4; m.f = f; }
      prepara(b);
      if (m.t >= m.prox && m.n < 4 + fase(b) * 2) { m.n++; m.prox = m.t + 0.35; const x = m.f > 0 ? A.x0 + 10 : A.x1 - 10; G.tiros.push({ x, y: A.chao - 10, vx: m.f * vel(G, 300), vy: 0, r: 9, vida: 3.5, cor: '#BFF0F8', tipo: 'choque', fixo: true }); }
      return m.t > 2.6 + fase(b) * 0.5;
    },
    // o granizo: pedras de gelo caem em lugares sorteados e quicam uma vez
    granizo(G, b, m, dt) {
      const A = G.N.arena, n = 12 + fase(b) * 6;
      if (m.t === 0) { m.n = 0; m.prox = 0.3; m.bs = []; }
      prepara(b);
      if (m.t >= m.prox && m.n < n) { m.n++; m.prox = m.t + 0.11; const x = rand(A.x0 + 20, A.x1 - 20); m.bs.push(bala(G, x, A.y0 + 4, Math.PI / 2, vel(G, 80), { g: 520, cor: '#DDF4FF', r: 6, fura: true, quique: 1 })); }
      for (const t of m.bs) if (vivo(G, t) && t.y > A.chao - 8 && t.vy > 0) { if (t.quique-- > 0) { t.vy *= -0.45; t.vx = rand(-90, 90); G.fx.po(t.x, A.chao - 4, 3, '#DDF4FF'); } else t.vida = 0; }
      return m.n >= n && m.t > m.prox + 1.4;
    }
  }
};

const desespero = {
  // respira: sobe e desce devagar, sempre sobre você, como uma onda funda
  mover(G, b, dt) { const A = G.N.arena, ty = A.chao - b.c.voa + Math.sin(b.t * 0.9) * 70; b.vx = clamp((G.p.x - b.x) * 1.6, -(b.c.vel || 80), b.c.vel || 80); b.y += clamp(ty - b.y, -1, 1) * 160 * dt; b.face = Math.sign(G.p.x - b.x) || b.face; },
  // o ventre se fecha: as paredes de carne avançam a cada fase e empurram você para o meio
  palco(G, b, dt) {
    b.cen.aperto = Math.min(0.2, (b.cen.aperto || 0) + dt * 0.004 * (1 + fase(b)));
  },
  jogador(G, b, p) { const A = G.N.arena, lim = (A.x1 - A.x0) * (b.cen.aperto || 0); if (p.x < A.x0 + lim + 14) p.x = A.x0 + lim + 14; if (p.x > A.x1 - lim - 14) p.x = A.x1 - lim - 14; },
  pref: { eco: () => 1.1, algas: G => noAr(G) ? 0.4 : 1.2, trevas: (G, b) => G.escuroAlvo > 0.8 ? 0 : 1, peso: () => 1 },
  golpes: {
    // o eco do clamor: uma esfera que ricocheteia nas paredes do ventre, várias vezes
    eco(G, b, m, dt) {
      const A = G.N.arena, c = centro(b), lim = (A.x1 - A.x0) * (b.cen.aperto || 0);
      if (m.e === 0) { prepara(b); if (m.t > av(G, 0.6)) { m.e = 1; m.bs = [0, 1, -1].slice(0, 2 + Math.min(1, fase(b))).map(i => bala(G, c.x, c.y, angulo(c.x, c.y, G) + i * 0.45, vel(G, 380), { cor: '#B6A0E6', r: 11, vida: 7, fura: true, bate: 5 })); sfx('magic'); } return false; }
      ataca(b);
      for (const t of m.bs) if (vivo(G, t)) {
        if ((t.x < A.x0 + lim + 10 && t.vx < 0) || (t.x > A.x1 - lim - 10 && t.vx > 0)) { t.vx *= -1; t.bate--; sfx('click'); G.fx.anel(t.x, t.y, '#B6A0E6', 30); }
        if ((t.y < A.y0 + 10 && t.vy < 0) || (t.y > A.chao - 10 && t.vy > 0)) { t.vy *= -1; t.bate--; sfx('click'); }
        if (t.bate < 0) t.vida = 0;
      }
      return m.bs.every(t => !vivo(G, t)) || m.t > 7;
    },
    // as algas enrolaram-se à minha cabeça (Jn 2:5): brotam do chão em volta de você
    algas(G, b, m) {
      const A = G.N.arena;
      if (m.t === 0) { const x = G.p.x; for (const s of [-1, 0, 1]) zona(G, { tipo: 'col', x: clamp(x + s * 70, A.x0 + 20, A.x1 - 20), w: 26, y0: A.chao - 120, aviso: av(G, 0.75 + Math.abs(s) * 0.25), dur: 0.9, cor: '#3F8A6A', alga: true }); G.fala(b, 'As algas te prendem…'); }
      prepara(b); return m.t > av(G, 1) + 1;
    },
    // trevas: a luz some e dardos fracos vêm das bordas — só a lâmpada os mostra
    trevas(G, b, m, dt) {
      const A = G.N.arena, n = 8 + fase(b) * 4;
      if (m.t === 0) { G.escuroAlvo = 0.95; m.n = 0; m.prox = 0.8; G.fala(b, 'Aqui ninguém vê você…'); }
      prepara(b); G.escuroAlvo = 0.95;
      if (m.t >= m.prox && m.n < n) { m.n++; m.prox = m.t + 0.24; const lado = m.n % 2 ? -1 : 1, x = lado < 0 ? A.x0 + 10 : A.x1 - 10, y = rand(A.chao - 160, A.chao - 20); bala(G, x, y, angulo(x, y, G), vel(G, 200), { cor: '#4A3E66', r: 6 }); }
      return m.n >= n && m.t > m.prox + 0.8;
    },
    // pesos de culpa caem com aviso longo e ficam no chão um tempo, atrapalhando o caminho
    peso(G, b, m) {
      const A = G.N.arena, n = 2 + fase(b);
      if (m.t === 0) { m.n = 0; m.prox = 0; }
      prepara(b);
      if (m.t >= m.prox && m.n < n) { m.n++; m.prox = m.t + 0.6; const x = clamp(G.p.x, A.x0 + 40, A.x1 - 80); muro(G, x - 30, A.chao - 46, 60, 46, { aviso: av(G, 1.1), dur: 2.6, cor: '143,120,200', peso: true }); }
      return m.n >= n && m.t > m.prox + 1.4;
    }
  }
};

const violencia = {
  // brutamontes: anda aos trancos — passos curtos e rápidos, para, bufa, avança de novo
  mover(G, b, dt) { const dx = G.p.x - b.x; b.face = Math.sign(dx) || b.face; const ciclo = (b.t * 1.3) % 1; b.vx = Math.abs(dx) > b.w * 0.8 && ciclo < 0.45 ? b.face * (b.c.vel || 60) * 2.6 : 0; if (ciclo < 0.02 && Math.random() < 0.3) G.fx.po(b.x, b.y, 4, '#E9AD7F'); },
  // os muros de Nínive racham e caem pedaços a cada fase; o fogo pega nas janelas
  palco(G, b, dt) { b.cen.ruina = fase(b); if (Math.random() < dt * (0.4 + fase(b) * 0.8)) { const A = G.N.arena, x = rand(A.x0, A.x1); G.parts.push({ x, y: A.y0 + 10, vx: 0, vy: 60, t: 2, max: 2, r: 2.2, cor: '#8A6A4A', g: 500 }); } },
  pref: { correntePuxa: (G, b) => perto(G, b) > 160 && perto(G, b) < 360 ? 1.8 : 0.5, pedregulho: (G, b) => perto(G, b) > 240 ? 1.5 : 0.7, pisoteio: (G, b) => perto(G, b) < 300 ? 1.3 : 0.8, furia: (G, b) => perto(G, b) < 160 ? 2 : 0.3 },
  golpes: {
    // a corrente é lançada reta; se te acerta, ele puxa você para perto
    correntePuxa(G, b, m, dt) {
      const c = centro(b);
      if (m.e === 0) { if (m.t === 0) b.face = Math.sign(G.p.x - b.x) || 1; prepara(b); if (m.t > av(G, 0.6)) { m.e = 1; m.t0 = m.t; m.c = bala(G, c.x, c.y, b.face > 0 ? 0 : Math.PI, vel(G, 520), { cor: '#B8B0A0', r: 9, tipo: 'lanca', fura: true, vida: 2, puxa: { x: b.x, forca: 600, msg: 'arrastado!' } }); sfx('swing'); } return false; }
      ataca(b); const dt0 = m.t - m.t0;
      if (vivo(G, m.c)) { b.cen.corrente = { x: m.c.x, y: m.c.y }; if (dt0 > 0.55 && m.c.vx * b.face > 0) { m.c.vx *= -1; } if (m.c.vx * b.face < 0 && Math.abs(m.c.x - b.x) < 30) m.c.vida = 0; }
      if (dt0 > 1.4 || (!vivo(G, m.c) && dt0 > 0.3)) { b.cen.corrente = null; return true; }
      return false;
    },
    // atira um pedregulho em arco; ao bater no chão, ele se parte em três que rolam
    pedregulho(G, b, m) {
      const A = G.N.arena, c = centro(b);
      if (m.e === 0) { prepara(b); if (m.t > av(G, 0.7)) { m.e = 1; const dx = G.p.x - c.x, tv = 0.95; m.p = G.tiros[G.tiros.push({ x: c.x, y: c.y - 30, vx: dx / tv, vy: -470, g: 800, r: 16, vida: 4, cor: '#9A7A5A', tipo: 'bola', fura: true }) - 1]; sfx('swing'); ataca(b); } return false; }
      if (vivo(G, m.p) && m.p.y >= A.chao - 16) { m.p.vida = 0; G.efeito('slamPedra', m.p.x, A.chao); G.tremor(7); for (const s of [-1, 1]) G.tiros.push({ x: m.p.x, y: A.chao - 10, vx: s * vel(G, 240), vy: 0, r: 8, vida: 2.4, cor: '#9A7A5A', tipo: 'choque', fixo: true }); bala(G, m.p.x, A.chao - 20, -Math.PI / 2, vel(G, 520), { g: 900, cor: '#9A7A5A', r: 8 }); return true; }
      return !vivo(G, m.p) || m.t > 4;
    },
    // três pisões avançando: a cada um, o chão racha um pouco mais à frente
    pisoteio(G, b, m, dt) {
      const A = G.N.arena, n = 3 + fase(b);
      if (m.t === 0) { m.n = 0; m.prox = av(G, 0.45); b.face = Math.sign(G.p.x - b.x) || 1; }
      prepara(b); b.vx = 0;
      if (m.t >= m.prox && m.n < n) { m.n++; m.prox = m.t + 0.55; b.x = clamp(b.x + b.face * 60, A.x0 + b.w / 2, A.x1 - b.w / 2); G.efeito('pouso', b.x, A.chao); G.tremor(7); sfx('block'); const x = b.x + b.face * (b.w / 2 + 10); muro(G, b.face > 0 ? x : x - 120, A.chao - 22, 120, 22, { aviso: 0.12, dur: 0.25, cor: '#E9AD7F' }); }
      return m.n >= n && m.t > m.prox;
    },
    // a fúria: gira as correntes em volta do corpo enquanto anda até você
    furia(G, b, m, dt) {
      if (m.t === 0) { m.z = zona(G, { tipo: 'circ', x: b.x, y: b.y - 40, r: 110, aviso: av(G, 0.7), dur: 1.6 + fase(b) * 0.5, cor: '#B8B0A0' }); G.fala(b, 'NADA MUDA!'); }
      ataca(b); m.z.x = b.x; m.z.y = b.y - 40; b.vx = m.z.aviso <= 0 ? Math.sign(G.p.x - b.x) * vel(G, 120) : 0; b.cen.gira = m.z.aviso <= 0 ? 1 : 0;
      if (m.z.dur <= 0) { b.cen.gira = 0; return true; }
      return false;
    }
  }
};

const ressentimento = {
  // enraizado: não anda; de tempos em tempos afunda na terra e brota do lado mais longe de você
  mover(G, b, dt) {
    const A = G.N.arena; b.vx = 0; b.face = Math.sign(G.p.x - b.x) || b.face; b.cen.cava = (b.cen.cava ?? 7) - dt;
    if (b.cen.cava <= 0 && !b.mov) { b.cen.cava = 7 - fase(b) * 1.5; G.efeito('slamAreia', b.x, A.chao); b.x = G.p.x > A.cx ? A.x0 + 90 : A.x1 - 90; G.efeito('slamAreia', b.x, A.chao); G.tremor(5); sfx('block'); }
  },
  // a aboboreira cresce e dá sombra; a cada fase o verme a seca um pouco (Jn 4:6-7)
  palco(G, b, dt) { const A = G.N.arena; b.cen.planta = b.cen.planta ?? (A.x0 + (A.x1 - A.x0) * 0.5); b.cen.folhas = Math.max(0.25, 1 - fase(b) * 0.45); b.cen.calor = 0.2 + fase(b) * 0.4; },
  pref: { espinheiro: () => 1.2, verme: () => 1, sol: (G, b) => b.cen.ultimoSol > 0 ? 0 : 1.3, ventoOriental: () => 0.9 },
  golpes: {
    // espinhos brotam do chão numa fila, dele até você
    espinheiro(G, b, m) {
      const A = G.N.arena, d = Math.sign(G.p.x - b.x) || 1, n = 7 + fase(b) * 3;
      if (m.t === 0) { m.n = 0; m.prox = av(G, 0.4); m.d = d; }
      prepara(b);
      if (m.t >= m.prox && m.n < n) { m.n++; m.prox = m.t + 0.07; const x = b.x + m.d * (b.w / 2 + m.n * 52); if (x > A.x0 && x < A.x1) zona(G, { tipo: 'col', x, w: 30, y0: A.chao - 70, aviso: av(G, 0.45), dur: 0.35, cor: '#D6C77B', espinho: true }); }
      return m.n >= n && m.t > m.prox + 0.8;
    },
    // o verme cava por baixo do chão, segue você… e salta (Jn 4:7)
    verme(G, b, m, dt) {
      const A = G.N.arena;
      if (m.e === 0) { if (m.t === 0) { m.x = b.x; G.fala(b, 'Que seque tudo!'); } prepara(b); m.x += clamp(G.p.x - m.x, -1, 1) * vel(G, 230) * dt; b.cen.verme = m.x; if (Math.random() < dt * 25) G.fx.po(m.x, A.chao - 2, 1, '#8A6A3A'); if (m.t > 1.6 + fase(b) * 0.4) { m.e = 1; m.t0 = m.t; zona(G, { tipo: 'col', x: m.x, w: 46, y0: A.chao - 120, aviso: av(G, 0.45), dur: 0.3, cor: '#C9A16C' }); } return false; }
      if (m.t - m.t0 > av(G, 0.45) && !m.saltou) { m.saltou = true; b.cen.verme = null; G.efeito('slamAreia', m.x, A.chao); for (let i = 0; i < 4; i++) bala(G, m.x, A.chao - 30, -Math.PI / 2 + (i - 1.5) * 0.5, vel(G, 330), { g: 700, cor: '#C9A16C', r: 6 }); }
      return m.t - m.t0 > 1.1;
    },
    // o sol abrasador (Jn 4:8): queima tudo, menos a sombra da aboboreira — corra para baixo dela
    sol(G, b, m) {
      const A = G.N.arena, x = b.cen.planta, meia = 70 * (b.cen.folhas || 1);
      if (m.t === 0) { G.grito('O SOL BATE NA SUA CABEÇA!'); for (const [x0, x1] of [[A.x0, x - meia], [x + meia, A.x1]]) if (x1 > x0) muro(G, x0, A.y0, x1 - x0, A.chao - A.y0, { aviso: av(G, 1.5), dur: 0.5, cor: '255,190,90', sol: true }); b.cen.ultimoSol = 1; b.cen.brilho = 1; }
      prepara(b); if (m.t > av(G, 1.5) + 0.6) { b.cen.brilho = 0; return true; }
      return false;
    },
    // o vento oriental, calmoso (Jn 4:8): empurra para longe da sombra, com poeira rasteira
    ventoOriental(G, b, m) {
      const A = G.N.arena;
      if (m.t === 0) { const f = G.p.x > b.cen.planta ? 1 : -1; G.soprar(2.4 + fase(b) * 0.4, f * 420, 'vento oriental, calmoso!'); m.n = 0; m.prox = 0.3; m.f = f; b.cen.ultimoSol = 0; }
      prepara(b);
      if (m.t >= m.prox && m.n < 5 + fase(b) * 2) { m.n++; m.prox = m.t + 0.32; const x = m.f > 0 ? A.x0 + 10 : A.x1 - 10; bala(G, x, A.chao - rand(14, 60), m.f > 0 ? 0 : Math.PI, vel(G, 340), { cor: '#E9BB7A', r: 6 }); }
      return m.t > 2.6 + fase(b) * 0.4;
    }
  }
};

/* ======================================================================================================
   DANIEL 4
   ====================================================================================================== */
const encantadores = {
  // tripés: muda de um tripé a outro numa nuvem de fumaça, em rodízio
  mover(G, b, dt) {
    const A = G.N.arena, W = A.x1 - A.x0, tripes = [0.2, 0.5, 0.8].map(k => A.x0 + W * k); b.cen.tripes = tripes; b.cen.troca = (b.cen.troca ?? 4) - dt;
    if (b.cen.troca <= 0 && !b.mov) { b.cen.troca = 4.5 - fase(b); b.cen.i = ((b.cen.i ?? 1) + 1 + (Math.random() < 0.5 ? 1 : 0)) % 3; G.efeito('fumacaRoxa', b.x, b.y); b.x = tripes[b.cen.i]; G.efeito('fumacaRoxa', b.x, b.y); sfx('magic'); }
    b.vx = 0; b.y += clamp(A.chao - b.c.voa + Math.sin(b.t * 1.6) * 12 - b.y, -1, 1) * 100 * dt; b.face = Math.sign(G.p.x - b.x) || b.face;
  },
  // a roda do zodíaco gira no céu, mais rápida a cada fase
  palco(G, b, dt) { b.cen.roda = (b.cen.roda || 0) + dt * (0.15 + fase(b) * 0.2); },
  pref: { constelacao: () => 1.2, adivinhacao: G => noAr(G) ? 0.5 : 1.1, cometa: () => 1, caldeirao: (G, b) => perto(G, b) > 200 ? 1.4 : 0.7 },
  golpes: {
    // as estrelas se ligam em linhas: quando a constelação se acende, as linhas queimam
    constelacao(G, b, m) {
      const A = G.N.arena, n = 4 + fase(b);
      if (m.t === 0) { m.pts = Array.from({ length: n }, () => ({ x: rand(A.x0 + 40, A.x1 - 40), y: rand(A.y0 + 60, A.chao - 30) })); b.cen.estrelas = m.pts; b.cen.acesa = 0; G.fala(b, 'Nós lemos as estrelas!'); sfx('magic'); }
      prepara(b);
      if (m.t > av(G, 1.2) && !m.fez) { m.fez = true; b.cen.acesa = 1; sfx('hit'); G.clarao = 0.06;
        for (let i = 0; i < m.pts.length - 1; i++) { const a = m.pts[i], c = m.pts[i + 1], L = Math.hypot(c.x - a.x, c.y - a.y); for (let d = 0; d < L; d += 22) G.tiros.push({ x: a.x + (c.x - a.x) * d / L, y: a.y + (c.y - a.y) * d / L, vx: 0, vy: 0, r: 7, vida: 0.45, cor: '#B9C7F5', tipo: 'bola', fura: true }); } }
      if (m.t > av(G, 1.2) + 0.5) { b.cen.estrelas = null; return true; }
      return false;
    },
    // três sinais no chão: dois explodem; o verdadeiro abrigo só a lâmpada revela
    adivinhacao(G, b, m) {
      const A = G.N.arena;
      if (m.t === 0) { const xs = [-1, 0, 1].map(s => clamp(G.p.x + s * 170, A.x0 + 70, A.x1 - 70)), salvo = Math.floor(rand(0, 3)); xs.forEach((x, i) => zona(G, { tipo: 'circ', x, y: A.chao - 30, r: 64, aviso: av(G, 1.7), dur: 0.3, cor: '#B9C7F5', isca: i === salvo, sinal: true })); G.fala(b, 'Qual destes é o seu destino?'); }
      prepara(b); return m.t > av(G, 1.7) + 0.6;
    },
    // o cometa atravessa o céu em diagonal e deixa um rastro de brasas que caem
    cometa(G, b, m, dt) {
      const A = G.N.arena;
      if (m.e === 0) { prepara(b); if (m.t === 0) { m.dir = Math.random() < 0.5 ? 1 : -1; m.x0 = m.dir > 0 ? A.x0 : A.x1; m.x1 = clamp(G.p.x + m.dir * 100, A.x0, A.x1); zona(G, { tipo: 'col', x: m.x1, w: 60, aviso: av(G, 0.9), dur: 0.01, cor: '#B9C7F5', isca: true }); } if (m.t > av(G, 0.9)) { m.e = 1; m.t0 = m.t; m.c = G.tiros[G.tiros.push({ x: m.x0, y: A.y0, vx: (m.x1 - m.x0) / 0.7, vy: (A.chao - A.y0) / 0.7, r: 14, vida: 0.7, cor: '#DDE6FF', tipo: 'bola', fura: true }) - 1]; sfx('dodge'); } return false; }
      ataca(b); if (vivo(G, m.c) && Math.random() < dt * 40) G.tiros.push({ x: m.c.x, y: m.c.y, vx: rand(-20, 20), vy: 30, g: 200, r: 5, vida: 1.4, cor: '#9FB0F0', tipo: 'bola' });
      if (!vivo(G, m.c) && !m.bateu) { m.bateu = true; G.efeito('slamMagia', m.x1, A.chao); G.tremor(9); }
      return m.t - m.t0 > 1.6;
    },
    // o caldeirão borbulha e atira poções em arco; onde caem, fica uma poça
    caldeirao(G, b, m) {
      const A = G.N.arena, c = centro(b), n = 2 + fase(b);
      if (m.t === 0) { m.n = 0; m.prox = av(G, 0.5); m.bs = []; }
      prepara(b);
      if (m.t >= m.prox && m.n < n) { m.n++; m.prox = m.t + 0.5; const tx = clamp(G.p.x + (m.n - 1 - (n - 1) / 2) * 120, A.x0 + 40, A.x1 - 40), tv = 0.85; m.bs.push(G.tiros[G.tiros.push({ x: c.x, y: c.y, vx: (tx - c.x) / tv, vy: -420, g: 760, r: 8, vida: 3, cor: ['#7FD9A0', '#C79BFF', '#FFB05A'][m.n % 3], tipo: 'bola', fura: true }) - 1]); sfx('shoot'); }
      for (const t of m.bs) if (vivo(G, t) && t.y > A.chao - 8) { t.vida = 0; zona(G, { tipo: 'poca', x: t.x - 46, y: A.chao - 14, w: 92, h: 14, aviso: 0.4, dur: 2.6, cor: '120,130,190' }); G.fx.po(t.x, A.chao - 6, 8, t.cor); }
      return m.n >= n && m.bs.every(t => !vivo(G, t)) && m.t > m.prox;
    }
  }
};

const jugo = {
  // capataz: fica a distância de chicote — recua se você chega, avança se você foge
  mover(G, b, dt) { const dx = G.p.x - b.x, d = Math.abs(dx); b.face = Math.sign(dx) || b.face; b.vx = d < 200 ? -b.face * (b.c.vel || 58) : d > 320 ? b.face * (b.c.vel || 58) : 0; },
  // a muralha de tijolos cresce ao fundo: cada golpe dele assenta mais uma fileira
  palco(G, b, dt) { b.cen.tijolos = Math.min(14, (b.cen.tijolos || 2) + dt * (0.12 + fase(b) * 0.08)); },
  pref: { chicote: (G, b) => perto(G, b) < 340 ? 1.6 : 0.5, amarras: (G, b) => b.cen.amarra ? 0 : 1, tijolos: () => 1, cangalha: () => 0.9 },
  golpes: {
    // o chicote estala duas vezes: primeiro na altura do peito, depois rente ao chão
    chicote(G, b, m) {
      const A = G.N.arena, w = 330;
      if (m.t === 0) { b.face = Math.sign(G.p.x - b.x) || 1; const x = b.face > 0 ? b.x : b.x - w; muro(G, x, b.y - 70, w, 26, { aviso: av(G, 0.7), dur: 0.18, cor: '#C98E62' }); muro(G, x, A.chao - 22, w, 22, { aviso: av(G, 1.25), dur: 0.18, cor: '#C98E62' }); G.fala(b, 'Trabalhem!'); }
      if (m.t < av(G, 0.7)) prepara(b); else ataca(b);
      if (m.t > av(G, 0.7) && !m.e1) { m.e1 = true; sfx('swing'); G.efeito('estalo', b.x + b.face * w, b.y - 60, b.face); }
      if (m.t > av(G, 1.25) && !m.e2) { m.e2 = true; sfx('swing'); G.efeito('estalo', b.x + b.face * w, A.chao - 12, b.face); }
      return m.t > av(G, 1.25) + 0.5;
    },
    // as amarras: uma corrente prende você a ele; não dá para se afastar, e ele arrasta
    amarras(G, b, m, dt) {
      if (m.e === 0) { prepara(b); if (m.t === 0) zona(G, { tipo: 'circ', x: G.p.x, y: G.p.y - 20, r: 64, aviso: av(G, 0.9), dur: 0.15, cor: '#8A7A6A', efeito: 'amarra', dur2: 3 + fase(b) }); if (m.t > av(G, 0.9)) { m.e = 1; m.t0 = m.t; b.cen.amarra = 1; sfx('block'); } return false; }
      // quem foi pego fica preso ao chefe (efeitoNoJogador, em cada aparelho); ele recua arrastando
      ataca(b); b.vx = -Math.sign(G.p.x - b.x) * vel(G, 50);
      if (m.t - m.t0 > 3 + fase(b)) { b.cen.amarra = 0; return true; }
      return false;
    },
    // os tijolos vêm pulando pelo chão, um atrás do outro
    tijolos(G, b, m, dt) {
      const A = G.N.arena, n = 3 + fase(b) * 2, d = Math.sign(G.p.x - b.x) || 1;
      if (m.t === 0) { m.n = 0; m.prox = av(G, 0.5); m.bs = []; m.d = d; }
      prepara(b);
      if (m.t >= m.prox && m.n < n) { m.n++; m.prox = m.t + 0.32; m.bs.push(G.tiros[G.tiros.push({ x: b.x + m.d * 30, y: A.chao - 20, vx: m.d * vel(G, 230), vy: -360, g: 1100, r: 9, vida: 5, cor: '#C98E62', tipo: 'bola', fura: true }) - 1]); sfx('click'); }
      for (const t of m.bs) if (vivo(G, t)) { if (t.y > A.chao - 9 && t.vy > 0) { t.vy = -380; G.fx.po(t.x, A.chao - 3, 2, '#C98E62'); } if (t.x < A.x0 || t.x > A.x1) t.vida = 0; }
      return m.n >= n && m.bs.every(t => !vivo(G, t));
    },
    // a canga cai sobre os ombros: se pegar, você anda pesado por um tempo — a defesa perfeita a quebra
    cangalha(G, b, m) {
      if (m.t === 0) { m.z = zona(G, { tipo: 'col', x: G.p.x, w: 70, y0: G.N.arena.chao - 220, aviso: av(G, 0.85), dur: 0.2, cor: '#8A5A3A', efeito: 'canga' }); G.fala(b, 'Mais peso!'); }
      prepara(b);
      return m.t > av(G, 0.85) + 0.6;
    }
  }
};

const babilonia = {
  // o trono sobe: a cada fase a torre cresce e ele vê a arena de mais alto (Dn 4:30)
  mover(G, b, dt) { const A = G.N.arena, alvo = A.chao - [0, 70, 130][Math.min(2, fase(b))]; b.vx = 0; b.y += clamp(alvo - b.y, -1, 1) * 60 * dt; b.face = Math.sign(G.p.x - b.x) || b.face; },
  // a cidade se ergue ao fundo; na última fase o céu se abre em luz
  palco(G, b, dt) { b.cen.cidade = Math.min(1, (b.cen.cidade || 0.3) + dt * 0.02); b.cen.ceu = fase(b) >= 2 ? Math.min(1, (b.cen.ceu || 0) + dt * 0.5) : 0; },
  pref: { decreto: () => 1.1, zigurate: () => 1, jardins: () => 1, vozDoCeu: (G, b) => fase(b) >= 2 ? 3 : 0 },
  golpes: {
    // decretos voam pela arena como faixas, em alturas diferentes
    decreto(G, b, m, dt) {
      const A = G.N.arena, n = 2 + fase(b);
      if (m.t === 0) { m.zs = []; for (let i = 0; i < n; i++) { const dir = i % 2 ? -1 : 1, y = A.chao - 30 - ((i * 77) % 140); m.zs.push(muro(G, dir > 0 ? A.x0 - 120 : A.x1, y, 120, 26, { aviso: av(G, 0.9 + i * 0.35), dur: 4, cor: '#FFD67A', dir, decreto: true })); } G.fala(b, 'Assim decreta o rei!'); }
      prepara(b);
      for (const z of m.zs) if (z.aviso <= 0) z.x += z.dir * vel(G, 360) * dt;
      if (m.zs.every(z => z.x > A.x1 + 10 || z.x < A.x0 - 140 || z.dur <= 0) || m.t > 6) { for (const z of m.zs) z.dur = 0; return true; }
      return false;
    },
    // o zigurate: degraus de tijolos caem em escada, de um lado ao outro — fique no degrau que ainda não caiu
    zigurate(G, b, m) {
      const A = G.N.arena, n = 7, dir = m.dir ?? (m.dir = G.p.x > A.cx ? -1 : 1);
      if (m.t === 0) { m.n = 0; m.prox = 0.2; }
      prepara(b);
      if (m.t >= m.prox && m.n < n) { const k = dir > 0 ? m.n : n - 1 - m.n, w = (A.x1 - A.x0) / n; zona(G, { tipo: 'col', x: A.x0 + w * (k + 0.5), w: w - 6, y0: A.chao - 60 - m.n * 18, aviso: av(G, 0.75), dur: 0.3, cor: '#E0B45A' }); m.n++; m.prox = m.t + 0.24; sfx('hit'); }
      return m.n >= n && m.t > m.prox + 0.9;
    },
    // os jardins suspensos: trepadeiras descem do alto e balançam
    jardins(G, b, m, dt) {
      const A = G.N.arena;
      if (m.t === 0) { m.zs = [0.2, 0.45, 0.7, 0.9].slice(0, 2 + fase(b)).map(k => zona(G, { tipo: 'col', x: A.x0 + (A.x1 - A.x0) * k, w: 22, y1: A.chao - 50, aviso: av(G, 0.8), dur: 2.6, cor: '#5FA35A', base: A.x0 + (A.x1 - A.x0) * k })); }
      prepara(b); for (const [i, z] of m.zs.entries()) z.x = z.base + Math.sin(m.t * 2.2 + i) * 60;
      return m.zs.every(z => z.dur <= 0) || m.t > 4.5;
    },
    // "a ti se diz, ó rei" (Dn 4:31): a voz do céu desce em colunas de luz — ele não ataca, só a sentença cai
    vozDoCeu(G, b, m) {
      const A = G.N.arena, n = 5;
      if (m.t === 0) { m.n = 0; m.prox = 0.4; G.grito('O REINO FOI TIRADO DE TI!'); b.semDano = 0; }
      b.vx = 0; b.art.step = 1;
      if (m.t >= m.prox && m.n < n) { const x = clamp(G.p.x + rand(-60, 60), A.x0 + 40, A.x1 - 40); zona(G, { tipo: 'col', x, w: 70, aviso: av(G, 1), dur: 0.35, cor: '#FFFFFF', santo: true, pilar: true }); m.n++; m.prox = m.t + 0.75; }
      return m.n >= n && m.t > m.prox + 1;
    }
  }
};

const fera = {
  // espreita: anda de lá para cá à distância; se você vira as costas, ele dá o bote na hora
  mover(G, b, dt) { const dx = G.p.x - b.x, d = Math.abs(dx); b.face = Math.sign(dx) || b.face; b.vx = d < 220 ? -b.face * (b.c.vel || 130) * 0.6 : d > 300 ? b.face * (b.c.vel || 130) * 0.7 : Math.sin(b.t * 2.4) * 60; if (deCostas(G, b) && d < 380 && !b.mov && b.espera > 0.3) b.espera = 0.3; },
  // sete tempos (Dn 4:23): o céu gira de dia para noite; o capim cresce e o orvalho cai
  palco(G, b, dt) { b.cen.tempo = (b.cen.tempo || 0) + dt * 0.12; b.cen.noite = (Math.sin(b.cen.tempo * TAU) + 1) / 2; b.cen.capim = Math.min(1, (b.cen.capim || 0.2) + dt * 0.01); },
  pref: { bote: (G, b) => deCostas(G, b) ? 4 : perto(G, b) > 200 ? 1.4 : 0.6, garras: (G, b) => perto(G, b) < 260 ? 1.6 : 0.5, rugido: (G, b) => perto(G, b) < 180 ? 1.8 : 0.4, orvalho: (G, b) => b.cen.noite > 0.5 ? 1.5 : 0.6 },
  golpes: {
    // o bote: agacha, mira onde você VAI estar e salta; as garras riscam o chão ao cair
    bote(G, b, m) {
      const A = G.N.arena;
      if (m.e === 0) { prepara(b); b.vx = 0; if (m.t > av(G, deCostas(G, b) ? 0.35 : 0.5)) { m.e = 1; const tx = clamp(G.p.x + G.p.vx * 0.5, A.x0 + b.w, A.x1 - b.w); b.vy = -760; b.vx = (tx - b.x) / 0.74; b.chao = false; m.t0 = m.t; sfx('dodge'); } return false; }
      if (m.e === 1) { ataca(b); b.perigo = true; if (b.chao && m.t - m.t0 > 0.2) { b.vx = 0; m.e = 2; m.t0 = m.t; b.perigo = false; G.efeito('critico', b.x + b.face * 20, A.chao - 20, b.face); G.tremor(6); for (const s of [-1, 1]) muro(G, b.x + (s < 0 ? -120 : 0), A.chao - 18, 120, 18, { aviso: 0.1, dur: 0.2, cor: '#B7C7A0' }); } return false; }
      return m.t - m.t0 > 0.6;
    },
    // as garras cruzadas: dois riscos em X sobre você — o risco pontilhado avisa, depois rasga
    garras(G, b, m, dt) {
      const n = 2 + fase(b) * 2;
      if (m.t === 0) { m.n = 0; m.prox = 0.1; m.riscos = []; b.cen.riscos = m.riscos; }
      prepara(b);
      if (m.t >= m.prox && m.n < n) { m.n++; m.prox = m.t + 0.34; m.riscos.push({ x: G.p.x, y: G.p.y - 24, s: m.n % 2 ? 1 : -1, t: av(G, 0.6) }); sfx('swing'); }
      for (const r of m.riscos) if (r.t > 0 && (r.t -= dt) <= 0) { for (let k = -4; k <= 4; k++) G.tiros.push({ x: r.x + k * 18, y: r.y + r.s * k * 18, vx: 0, vy: 0, r: 7, vida: 0.18, cor: '#B7C7A0', tipo: 'bola', fura: true }); G.efeito('critico', r.x, r.y + 20, r.s); }
      if (m.n >= n && m.riscos.every(r => r.t <= 0) && m.t > m.prox + 0.3) { b.cen.riscos = null; return true; }
      return false;
    },
    // o rugido de fera: empurra para longe e achata o capim
    rugido(G, b, m) { prepara(b); if (m.t === 0) zona(G, { tipo: 'circ', x: b.x, y: b.y - 40, r: 200, aviso: av(G, 0.85), dur: 0.2, cor: '#D5BA88', efeito: 'empurra' }); if (m.t > av(G, 0.85) && !m.fez) { m.fez = true; G.tremor(9); sfx('boss'); b.cen.capim = 0.1; G.efeito('slamPedra', b.x, G.N.arena.chao); } return m.t > 1.5; },
    // o orvalho do céu (Dn 4:25): gotas que caem devagar e se partem em respingos
    orvalho(G, b, m) {
      const A = G.N.arena, n = 6 + fase(b) * 3;
      if (m.t === 0) { m.n = 0; m.prox = 0.2; m.bs = []; }
      prepara(b);
      if (m.t >= m.prox && m.n < n) { m.n++; m.prox = m.t + 0.2; m.bs.push(bala(G, rand(A.x0 + 30, A.x1 - 30), A.y0 + 6, Math.PI / 2, vel(G, 130), { cor: '#A9D6E8', r: 8, fura: true })); }
      for (const t of m.bs) if (vivo(G, t) && t.y > A.chao - 12) { t.vida = 0; for (const s of [-1, 1]) bala(G, t.x, A.chao - 10, s < 0 ? Math.PI * 1.15 : -Math.PI * 0.15, vel(G, 170), { cor: '#A9D6E8', r: 4, g: 500 }); }
      return m.n >= n && m.bs.every(t => !vivo(G, t));
    }
  }
};

const soberba = {
  // majestade: paira no alto, devagar, e nunca recua
  mover(G, b, dt) { const A = G.N.arena, tx = clamp(G.p.x, A.x0 + 100, A.x1 - 100), ty = A.chao - b.c.voa - 30 + Math.sin(b.t * 0.7) * 10; const dx = tx - b.x; b.vx = Math.sign(dx) === b.face || Math.abs(dx) < 4 ? clamp(dx * 0.6, -(b.c.vel || 110) * 0.6, (b.c.vel || 110) * 0.6) : 0; b.y += clamp(ty - b.y, -1, 1) * 80 * dt; if (Math.abs(G.p.x - b.x) > 200) b.face = Math.sign(G.p.x - b.x) || b.face; },
  // a grande árvore de Daniel 4 ao fundo: a cada fase, cortam-lhe os galhos; por fim só o toco com cinta de ferro e bronze
  palco(G, b, dt) { b.cen.arvore = 3 - Math.min(3, fase(b)); if (Math.random() < dt * (1 + fase(b) * 2)) { const A = G.N.arena; G.parts.push({ x: A.cx + rand(-200, 200), y: A.y0 + rand(10, 80), vx: rand(-20, 20), vy: 30, t: 3, max: 3, r: 1.5, cor: '#5F8A4A', g: 30 }); } },
  pref: { coroa: () => 1.1, estatua: G => noAr(G) ? 0.6 : 1.2, edito: () => 1, queda: (G, b) => perto(G, b) < 260 ? 1.4 : 0.8 },
  golpes: {
    // a coroa se desfaz em joias que giram em volta dele… e voam para fora
    coroa(G, b, m, dt) {
      const c = centro(b), n = 6 + fase(b) * 2;
      if (m.t === 0) { m.bs = []; for (let i = 0; i < n; i++) m.bs.push(bala(G, c.x, c.y, 0, 0, { cor: '#F1C96A', r: 7, vida: 6, fura: true, a: i / n * TAU })); sfx('magic'); G.fala(b, 'Contemplem a minha glória!'); }
      prepara(b);
      if (m.t < av(G, 1.5)) { for (const t of m.bs) if (vivo(G, t)) { t.a += dt * 3.2; const r = 40 + m.t * 30; t.x = b.x + Math.cos(t.a) * r; t.y = b.y - b.h * 0.55 + Math.sin(t.a) * r; t.vx = t.vy = 0; } return false; }
      if (!m.foi) { m.foi = true; for (const t of m.bs) if (vivo(G, t)) { t.vx = Math.cos(t.a) * vel(G, 300); t.vy = Math.sin(t.a) * vel(G, 300); t.fura = false; } sfx('shoot'); ataca(b); }
      return m.t > av(G, 1.5) + 0.8;
    },
    // estátuas de ouro brotam do chão debaixo de você, uma, duas, três
    estatua(G, b, m) {
      const A = G.N.arena, n = 2 + fase(b);
      if (m.t === 0) { m.n = 0; m.prox = 0; }
      prepara(b);
      if (m.t >= m.prox && m.n < n) { m.n++; m.prox = m.t + 0.7; zona(G, { tipo: 'col', x: clamp(G.p.x, A.x0 + 40, A.x1 - 40), w: 60, y0: A.chao - 170, aviso: av(G, 0.7), dur: 0.5, cor: '#F1C96A', estatua: true }); }
      return m.n >= n && m.t > m.prox + 0.6;
    },
    // o edito desce como uma faixa de ponta a ponta — só há uma brecha, e ela anda
    edito(G, b, m, dt) {
      const A = G.N.arena, gap = 130;
      if (m.t === 0) { m.g = rand(A.x0 + 60, A.x1 - 60 - gap); m.zs = [muro(G, A.x0, A.y0 + 40, m.g - A.x0, 22, { aviso: av(G, 0.9), dur: 3, cor: '#F1C96A' }), muro(G, m.g + gap, A.y0 + 40, A.x1 - m.g - gap, 22, { aviso: av(G, 0.9), dur: 3, cor: '#F1C96A' })]; G.fala(b, 'Pela força do meu poder!'); }
      prepara(b);
      if (m.t > av(G, 0.9)) { const y = A.y0 + 40 + (m.t - av(G, 0.9)) * vel(G, 190); m.g = clamp(m.g + Math.sin(m.t * 2) * 60 * dt * (1 + fase(b)), A.x0 + 20, A.x1 - gap - 20); m.zs[0].w = m.g - A.x0; m.zs[1].x = m.g + gap; m.zs[1].w = A.x1 - m.g - gap; for (const z of m.zs) z.y = y; if (y > A.chao) { for (const z of m.zs) z.dur = 0; return true; } }
      return m.t > 6;
    },
    // a queda do trono: despenca do alto e o chão estremece duas vezes — "aos que andam na soberba ele pode humilhar"
    queda(G, b, m, dt) {
      const A = G.N.arena, alto = A.chao - b.c.voa;
      if (m.e === 0) { prepara(b); b.vx = 0; if (m.t === 0) { m.x = clamp(G.p.x, A.x0 + 80, A.x1 - 80); zona(G, { tipo: 'col', x: m.x, w: b.w * 1.3, aviso: av(G, 0.85), dur: 0.2, cor: '#F1C96A' }); } b.x += (m.x - b.x) * dt * 3; if (m.t > av(G, 0.85)) { m.e = 1; b.perigo = true; } return false; }
      if (m.e === 1) { ataca(b); b.y += 1300 * dt; if (b.y >= A.chao) { b.y = A.chao; b.perigo = false; m.e = 2; m.t0 = m.t; G.efeito('slamOuro', b.x, A.chao); choque(G, b, '#F1C96A', 300); G.tremor(12); } return false; }
      if (m.e === 2) { if (m.t - m.t0 > 0.55 && !m.dois) { m.dois = true; choque(G, b, '#F1C96A', 380); G.efeito('pouso', b.x, A.chao); } if (m.t - m.t0 > 1.2) m.e = 3; return false; }
      b.y -= 260 * dt; if (b.y <= alto) { b.y = alto; return true; }
      return m.t > 6;
    }
  }
};

/* ======================================================================================================
   CHEFES DO MUNDO
   ====================================================================================================== */
const golias = {
  // o gigante avança sempre, devagar; se você foge para longe, para e afronta (1Sm 17:10)
  mover(G, b, dt) { const dx = G.p.x - b.x, d = Math.abs(dx); b.face = Math.sign(dx) || b.face; if (d > 420) { b.vx = 0; b.cen.afronta = (b.cen.afronta || 0) - dt; if (b.cen.afronta <= 0) { b.cen.afronta = 4; G.fala(b, 'Dai-me um homem, para que pelejemos!'); b.cen.vibra = 1; } } else b.vx = d > b.w * 0.7 ? b.face * (b.c.vel || 66) * (1 + fase(b) * 0.2) : 0; },
  // os exércitos assistem e se agitam; o ribeiro com as cinco pedras lisas brilha ao fundo
  palco(G, b, dt) { b.cen.vibra = Math.max(0, (b.cen.vibra || 0) - dt); },
  pref: { lanca: (G, b) => perto(G, b) < 260 ? 1.8 : 0.5, escudeiro: (G, b) => perto(G, b) > 220 ? 1.4 : 0.6, dardo: (G, b) => perto(G, b) > 260 ? 1.6 : 0.6, desafio: G => G.inimigos.filter(e => e.kind === 'vicio').length < 2 ? 0.8 : 0 },
  golpes: {
    // a lança: a defesa perfeita expõe a testa do gigante (1Sm 17:49)
    lanca(G, b, m) {
      const d = m.def;
      if (m.e === 0) { if (m.t === 0) b.face = Math.sign(G.p.x - b.x) || 1; b.vx = 0; b.art.step = 1; b.art.lanca = 'prep'; b.tele = 1; if (m.t > av(G, 0.72)) { m.e = 1; m.t0 = m.t; b.art.lanca = 'golpe'; sfx('swing'); G.efeito('estocadaLonga', b.x + b.face * 50, b.y - 40, b.face); const w = d.alcance || 230; zona(G, { tipo: 'ret', x: b.face > 0 ? b.x : b.x - w, y: b.y - 54, w, h: 40, aviso: 0, dur: 0.16, cor: '#E5C58A', lanca: true, dono: b, expoe: true }); } return false; }
      if (m.e === 1) { b.art.step = 2; if (m.t - m.t0 > 0.3) { m.e = 2; m.t0 = m.t; b.art.lanca = null; } return false; }
      if (m.t - m.t0 > 0.55) { if ((m.rep = (m.rep || 0) + 1) <= (d.repete || 0)) { m.e = 0; m.t = 0; return false; } return true; }
      return false;
    },
    // o escudeiro ia adiante dele (1Sm 17:7): um escudo enorme avança pela arena, empurrando
    escudeiro(G, b, m, dt) {
      const A = G.N.arena;
      if (m.t === 0) { m.d = Math.sign(G.p.x - b.x) || 1; m.z = muro(G, b.x + m.d * 50 - 22, A.chao - 80, 44, 80, { aviso: av(G, 0.6), dur: 4, cor: '#B8A070', escudo: true }); G.fala(b, 'Vai à frente, escudeiro!'); }
      prepara(b); if (m.z.aviso <= 0) m.z.x += m.d * vel(G, 210) * dt;
      if (m.z.x < A.x0 - 50 || m.z.x > A.x1 + 10 || m.t > 5) { m.z.dur = 0; return true; }
      return false;
    },
    // o dardo de bronze (1Sm 17:6) sobe alto, crava no chão e estoura em lascas
    dardo(G, b, m) {
      const A = G.N.arena, c = centro(b);
      if (m.e === 0) { prepara(b); if (m.t === 0) { m.x = clamp(G.p.x, A.x0 + 30, A.x1 - 30); zona(G, { tipo: 'circ', x: m.x, y: A.chao - 20, r: 40, aviso: av(G, 1.2), dur: 0.01, cor: '#C9B48A', isca: true }); } if (m.t > av(G, 0.3)) { m.e = 1; const tv = av(G, 0.9); m.d = G.tiros[G.tiros.push({ x: c.x, y: c.y - 40, vx: (m.x - c.x) / tv, vy: -(0.5 * 900 * tv) + (A.chao - c.y + 40) / tv, g: 900, r: 8, vida: 4, cor: '#C9B48A', tipo: 'lanca', fura: true }) - 1]; sfx('swing'); ataca(b); } return false; }
      if (vivo(G, m.d) && m.d.y >= A.chao - 8) { m.d.vida = 0; G.efeito('faisca', m.d.x, A.chao - 6); G.tremor(5); for (let i = 0; i < 5 + fase(b) * 2; i++) bala(G, m.d.x, A.chao - 10, -Math.PI / 2 + (i - 2 - fase(b)) * 0.32, vel(G, 380), { g: 760, cor: '#C9B48A', r: 5 }); return true; }
      return !vivo(G, m.d) && m.e === 1 || m.t > 4;
    },
    // o desafio: os filisteus gritam e o medo desce sobre o vale
    desafio(G, b, m) {
      b.vx = 0; prepara(b);
      if (m.t === 0) { G.fala(b, 'Tremam, servos de Saul!'); b.cen.vibra = 2; }
      if (m.t > 0.8 && !m.fez) { m.fez = true; const A = G.N.arena, vivos = G.inimigos.filter(e => e.kind === 'vicio').length; for (let i = 0; i < Math.max(0, Math.min(2, 3 - vivos)); i++) { const x = i % 2 ? A.x0 + 70 : A.x1 - 70; G.nascer('medo', x, A.chao - 4, true); G.efeito('fumacaNegra', x, A.chao); } sfx('boss'); }
      return m.t > 1.3;
    }
  }
};

const behemote = {
  // colosso: anda pesado; as investidas são de parede a parede
  mover(G, b, dt) { const dx = G.p.x - b.x; b.face = Math.sign(dx) || b.face; b.vx = Math.abs(dx) > b.w * 0.6 ? b.face * (b.c.vel || 46) : 0; if (Math.abs(b.vx) > 1 && Math.random() < dt * 3) { G.tremor(2); G.fx.po(b.x - b.face * b.w / 3, b.y, 3, '#A8946E'); } },
  // o rio transborda (Jó 40:23): a água sobe na segunda fase; rachaduras se acumulam no chão
  palco(G, b, dt) { b.cen.rio = fase(b) >= 1 ? Math.min(1, (b.cen.rio || 0) + dt * 0.25) : 0; b.cen.rachas = b.cen.rachas || 0; },
  pref: { investida: (G, b) => perto(G, b) > 200 ? 1.6 : 0.8, terremoto: () => 1, cauda: (G, b) => perto(G, b) < 260 ? 1.6 : 0.5, rio: (G, b) => perto(G, b) > 260 ? 1.4 : 0.6 },
  golpes: {
    // a investida colossal: se bater na parede, fica tonto e o casco se abre
    investida(G, b, m, dt) {
      const A = G.N.arena, d = m.def;
      if (m.e === 0) { if (m.t === 0) { b.face = Math.sign(G.p.x - b.x) || 1; G.fala(b, 'GRRROOOM'); } b.vx = 0; prepara(b); if (Math.random() < dt * 30) G.fx.po(b.x - b.face * 20, b.y, 1, '#C9D2C4'); if (m.t > av(G, 0.72)) { m.e = 1; m.t = 0; sfx('dodge'); } return false; }
      if (m.e === 1) { ataca(b); b.corre = true; b.vx = b.face * vel(G, d.vel || 640); b.perigo = true;
        if (b.parede === b.face || b.x < A.x0 + b.w / 2 + 6 || b.x > A.x1 - b.w / 2 - 6 || m.t > 1.7) { b.vx = 0; b.corre = false; G.efeito('slamPedra', b.x + b.face * b.w / 2, A.chao); G.tremor(12); sfx('block'); m.e = 2; m.t = 0; b.cen.rachas++; if (!(m.rep < (d.repete || 0))) { b.tonto = d.tonto || 2.6; G.textoEm(b.x, b.y - b.h - 10, 'TONTO!', '#FFE9A8'); } } return false; }
      b.perigo = false; if (m.t > 0.5) { if ((m.rep = (m.rep || 0) + 1) <= (d.repete || 0)) { m.e = 0; m.t = 0; return false; } return true; }
      return false;
    },
    // o terremoto: o chão levanta em placas, dele para os dois lados, uma depois da outra
    terremoto(G, b, m) {
      const A = G.N.arena, n = 6 + fase(b) * 2;
      if (m.t === 0) { m.n = 0; m.prox = av(G, 0.6); G.efeito('slamPedra', b.x, A.chao); }
      prepara(b);
      if (m.t >= m.prox && m.n < n) { m.n++; m.prox = m.t + 0.13; for (const s of [-1, 1]) { const x = b.x + s * (b.w / 2 + m.n * 56); if (x > A.x0 && x < A.x1) zona(G, { tipo: 'col', x, w: 50, y0: A.chao - 56, aviso: av(G, 0.4), dur: 0.3, cor: '#A8946E' }); } G.tremor(4); }
      return m.n >= n && m.t > m.prox + 0.6;
    },
    // a cauda como um cedro (Jó 40:17): bate atrás dele e depois passa por cima e bate na frente
    cauda(G, b, m) {
      const A = G.N.arena, w = 170;
      if (m.t === 0) { const atras = b.x - b.face * (b.w / 2 + w / 2), frente = b.x + b.face * (b.w / 2 + w / 2); zona(G, { tipo: 'col', x: clamp(atras, A.x0 + w / 2, A.x1 - w / 2), w, y0: A.chao - 130, aviso: av(G, 0.7), dur: 0.25, cor: '#8A7A50' }); zona(G, { tipo: 'col', x: clamp(frente, A.x0 + w / 2, A.x1 - w / 2), w, y0: A.chao - 130, aviso: av(G, 1.3), dur: 0.25, cor: '#8A7A50' }); }
      if (m.t < av(G, 0.7)) prepara(b); else ataca(b);
      if (m.t > av(G, 0.7) && !m.a) { m.a = true; G.tremor(8); sfx('block'); }
      if (m.t > av(G, 1.3) && !m.b2) { m.b2 = true; G.tremor(10); sfx('block'); G.efeito('slamPedra', b.x + b.face * (b.w / 2 + w / 2), A.chao); }
      return m.t > av(G, 1.3) + 0.6;
    },
    // bebe o rio e o devolve num jato (Jó 40:23): uma faixa d'água que cresce da boca dele
    rio(G, b, m, dt) {
      const A = G.N.arena;
      if (m.e === 0) { if (m.t === 0) { b.face = Math.sign(G.p.x - b.x) || 1; G.fala(b, '…'); } prepara(b); b.vx = 0; if (m.t > av(G, 1)) { m.e = 1; m.t0 = m.t; m.z = muro(G, b.face > 0 ? b.x + b.w / 2 : b.x - b.w / 2, b.y - b.h * 0.45, 0, 34, { aviso: 0, dur: 2, cor: '94,180,232', jato: true }); sfx('magic'); } return false; }
      ataca(b); const L = Math.min(A.x1 - A.x0, (m.t - m.t0) * vel(G, 900)); if (b.face > 0) m.z.w = L; else { m.z.x = b.x - b.w / 2 - L; m.z.w = L; }
      if (Math.random() < dt * 40) G.parts.push({ x: m.z.x + rand(0, m.z.w), y: m.z.y, vx: rand(-40, 40), vy: rand(-120, -40), t: 0.5, max: 0.5, r: 1.6, cor: '#BFF0F8', g: 400 });
      if (m.t - m.t0 > 1.3) { m.z.dur = 0; return true; }
      return false;
    }
  }
};

const leviata = {
  // abissal: nada em arcos largos rente à água, mudando de lado sem aviso
  mover(G, b, dt) { const A = G.N.arena, w = (A.x1 - A.x0) * 0.36, a = (b.cen.nado = (b.cen.nado || 0) + dt * 0.7), tx = A.cx + Math.sin(a) * w, ty = A.chao - b.c.voa - Math.abs(Math.cos(a)) * 40; b.vx = clamp((tx - b.x) * 2, -(b.c.vel || 150), b.c.vel || 150); b.y += clamp(ty - b.y, -1, 1) * 120 * dt; b.face = Math.sign(b.vx) || b.face; },
  // o mar sobe a cada fase e as ondas lavam o convés; a fumaça das narinas escurece o céu
  palco(G, b, dt) { b.cen.mar = 0.2 + fase(b) * 0.35; b.cen.fumo = Math.max(0, (b.cen.fumo || 0) - dt * 0.2); },
  pref: { emergir: () => 1.4, tochas: () => 1, fumaca: (G, b) => b.cen.fumo > 0.4 ? 0 : 0.9, redemoinho: () => 1 },
  golpes: {
    // some no fundo… e irrompe debaixo de você; logo depois fica ao alcance (a couraça abre)
    emergir(G, b, m, dt) {
      const A = G.N.arena;
      if (m.e === 0) { b.vx = 0; b.alpha = Math.max(0, 1 - m.t / 0.4); b.semDano = 0.2; b.y += 160 * dt; if (m.t > 0.4) { m.e = 1; m.t0 = m.t; m.x = clamp(G.p.x, A.x0 + 70, A.x1 - 70); zona(G, { tipo: 'col', x: m.x, w: b.w * 1.1, aviso: av(G, 0.85), dur: 0.35, cor: '#5ED1E8' }); } return false; }
      if (m.e === 1) { b.semDano = 0.2; b.alpha = 0; if (m.t - m.t0 > av(G, 0.85)) { m.e = 2; m.t0 = m.t; b.x = m.x; b.y = A.chao + 40; b.alpha = 1; b.perigo = true; G.efeito('slamMar', b.x, A.chao); G.tremor(10); sfx('dodge'); } return false; }
      if (m.e === 2) { ataca(b); b.y -= 900 * dt; if (b.y <= A.chao - b.c.voa) { b.y = A.chao - b.c.voa; b.perigo = false; b.exposto = 1.4; G.textoEm(b.x, b.y - b.h - 10, 'a couraça abriu!', '#FFE9A8', 14); m.e = 3; m.t0 = m.t; } return false; }
      return m.t - m.t0 > 1.2;
    },
    // "da sua boca saem tochas" (Jó 41:19): bolas de fogo em arco, que quicam no convés
    tochas(G, b, m) {
      const c = centro(b), n = 3 + fase(b) * 2;
      if (m.t === 0) { m.n = 0; m.prox = av(G, 0.5); }
      prepara(b);
      if (m.t >= m.prox && m.n < n) { m.n++; m.prox = m.t + 0.26; const tx = G.p.x + rand(-140, 140), tv = 0.9; bala(G, c.x, c.y, 0, 0, { vx: (tx - c.x) / tv, vy: -380, g: 700, cor: '#FF8A2A', tipo: 'fogo', r: 9 }); sfx('shoot'); }
      return m.n >= n && m.t > m.prox + 0.6;
    },
    // "das suas narinas procede fumaça" (Jó 41:20): nuvens escuras flutuam e escondem o céu
    fumaca(G, b, m, dt) {
      const A = G.N.arena;
      if (m.t === 0) { b.cen.fumo = 1; G.escuroAlvo = 0.5; m.zs = [0, 1, 2].slice(0, 2 + Math.min(1, fase(b))).map(i => zona(G, { tipo: 'circ', x: b.x + (i - 1) * 60, y: b.y - 40, r: 54, aviso: av(G, 0.7), dur: 3.2, cor: '#5A6A78' })); }
      prepara(b); for (const [i, z] of m.zs.entries()) if (z.dur > 0) { z.x += (G.p.x + (i - 1) * 110 - z.x) * dt * 0.7; z.y = Math.min(A.chao - 50, z.y + 20 * dt); }
      if (m.zs.every(z => z.dur <= 0) || m.t > 5) { G.escuroAlvo = 0; return true; }
      return false;
    },
    // o redemoinho: um vórtice num canto puxa tudo para si, com destroços girando em volta
    redemoinho(G, b, m, dt) {
      const A = G.N.arena;
      if (m.t === 0) { m.x = G.p.x > A.cx ? A.x0 + 120 : A.x1 - 120; b.cen.vortice = m.x; m.bs = []; for (let i = 0; i < 4 + fase(b) * 2; i++) m.bs.push(bala(G, m.x, A.chao - 40, 0, 0, { cor: '#8A6A4A', r: 7, vida: 4, fura: true, a: i * TAU / (4 + fase(b) * 2) })); G.fala(b, 'O abismo ferve como uma panela!'); }
      prepara(b);
      if (m.t > av(G, 0.6)) G.puxao = { x: m.x, f: 170 + fase(b) * 40 };
      for (const t of m.bs) if (vivo(G, t)) { t.a += dt * 2.6; const r = 60 + Math.sin(m.t * 1.5) * 50; t.x = m.x + Math.cos(t.a) * r; t.y = A.chao - 40 + Math.sin(t.a) * r * 0.4; t.vx = t.vy = 0; }
      if (m.t > 3 + fase(b) * 0.5) { G.puxao = null; b.cen.vortice = null; for (const t of m.bs) t.vida = 0; return true; }
      return false;
    }
  }
};

/* ======================================================================================================
   A HISTÓRIA DO PEREGRINO: as sombras que cobrem as páginas vivas
   ====================================================================================================== */
// A Escassez (1Rs 17): a seca que dizia à viúva "é o último pão". Não corre: vem devagar, como a fome.
const escassez = {
  mover(G, b, dt) { const dx = G.p.x - b.x; b.face = Math.sign(dx) || b.face; b.vx = Math.abs(dx) > 150 ? b.face * (b.c.vel || 50) * (1 + fase(b) * 0.25) : 0; },
  // quanto mais ela perde, mais a terra racha
  // A seca bebe o azeite da sua lâmpada o tempo todo. Mas, como na casa da viúva, a botija não falta: de tempos em tempos
  // uma botija aparece num canto. Cada peregrino enche o jarro na sua (ninguém tira a do outro).
  jogador(G, b, p, dt) {
    if (p.morto || b.morrendo) return; const A = G.N.arena;
    p.oleo = Math.max(0, p.oleo - 2.4 * dt);
    if (!b.avisoSeca && b.t > 2.5) { b.avisoSeca = true; G.ui?.toast?.('A seca bebe o azeite da sua lâmpada. Procure a botija: ela não falta (1Rs 17:16).', 6500); }
    const bo = b.cen.botija; if (bo && b.botPega !== bo.id && Math.abs(p.x - (A.x0 + bo.k * (A.x1 - A.x0))) < 30 && p.y > A.chao - 70) { b.botPega = bo.id; p.oleo = G.oleoMax(); sfx('heal'); G.efeito('coleta', p.x, p.y - 30); G.fx.anel(p.x, p.y - 24, '#FFD98A', 80); G.textoEm(p.x, p.y - 74, 'o azeite da botija não faltou', '#FFE9A8', 13); }
  },
  palco(G, b, dt) { b.cen.seca = 1 - b.hp / b.max; b.cen.botT = (b.cen.botT ?? 5) - dt; if (b.cen.botT <= 0) { b.cen.botT = 11; b.cen.botija = { k: rand(0.1, 0.9), id: (b.cen.botija?.id || 0) + 1 }; sfx('key'); } if (Math.random() < dt * 3) G.parts.push({ x: rand(G.N.arena.x0, G.N.arena.x1), y: G.N.arena.chao - 2, vx: rand(-20, 20), vy: -rand(20, 50), t: 0.8, max: 0.8, r: 1.4, cor: '#C9A86A', g: 0 }); },
  pref: { rachaduras: (G, b) => perto(G, b) > 200 ? 1.6 : 0.8, poeira: G => noAr(G) ? 0.5 : 1.3, fome: (G, b) => perto(G, b) > 260 ? 2 : 0.4, mirrar: (G, b) => perto(G, b) < 240 ? 1.5 : 0.8 },
  golpes: {
    // a terra racha onde você pisa, uma, duas, três vezes
    rachaduras(G, b, m) { prepara(b); const n = 3 + fase(b); if ((m.prox ?? 0) <= m.t && (m.n || 0) < n) { m.prox = m.t + av(G, 0.55); m.n = (m.n || 0) + 1; zona(G, { tipo: 'col', x: G.p.x - 28, w: 56, aviso: av(G, 0.7), dur: 0.25, cor: '#C9A86A' }); sfx('magic'); if (m.n === 1) G.fala(b, 'Não chove. Não vai chover.'); } return (m.n || 0) >= n && m.t > m.prox + av(G, 0.5); },
    // um poeira de pó que cresce a cada parede em que bate
    poeira(G, b, m) {
      const A = G.N.arena;
      if (m.e === 0) { prepara(b); if (m.t > av(G, 0.7)) { m.e = 1; const d = Math.sign(G.p.x - b.x) || 1; m.c = G.tiros[G.tiros.push({ x: b.x + d * 30, y: A.chao - 12, vx: d * vel(G, 300), vy: 0, r: 10, vida: 9, cor: '#D9B878', tipo: 'bola', fura: true }) - 1]; m.bat = 0; ataca(b); sfx('dodge'); } return false; }
      const c = m.c; if (!vivo(G, c)) return true;
      if ((c.x < A.x0 + c.r && c.vx < 0) || (c.x > A.x1 - c.r && c.vx > 0)) { c.vx *= -1.12; c.r += 7; c.y = A.chao - c.r - 2; m.bat++; G.tremor(4); sfx('block'); G.efeito('slamAreia', c.x, A.chao); if (m.bat >= 3 + fase(b)) { c.vida = 0; G.fx.po(c.x, c.y, 14, '#D9B878'); return true; } }
      return m.t > 9;
    },
    // a fome puxa: uma mão magra agarra e traz para perto, e a boca se fecha em volta
    fome(G, b, m) {
      const c = centro(b);
      if (m.e === 0) { prepara(b); b.vx = 0; if (m.t === 0) G.fala(b, 'É o último punhado. Depois, morrer.'); if (m.t > av(G, 0.6)) { m.e = 1; m.t0 = m.t; bala(G, c.x, c.y, Math.atan2(G.p.y - 24 - c.y, G.p.x - c.x), vel(G, 520), { r: 7, cor: '#B8A078', tipo: 'lanca', vida: 1.4, puxa: { x: b.x, forca: 520, msg: 'a fome puxa!' } }); sfx('swing'); ataca(b); } return false; }
      if (m.e === 1 && m.t - m.t0 > 0.7) { m.e = 2; m.t0 = m.t; zona(G, { tipo: 'circ', x: b.x, y: b.y - 30, r: 120, aviso: av(G, 0.55), dur: 0.2, cor: '#B8433A' }); G.efeito('slamAreia', b.x, G.N.arena.chao); G.tremor(6); }
      return m.e === 2 && m.t - m.t0 > av(G, 0.55) + 0.4;
    },
    // tudo mirra: manchas de terra morta nascem em volta de você e ficam um tempo
    mirrar(G, b, m) { prepara(b); if (m.t === 0) { const A = G.N.arena; for (const dx of [-90, 0, 90]) zona(G, { tipo: 'circ', x: clamp(G.p.x + dx, A.x0 + 40, A.x1 - 40), y: A.chao - 16, r: 40, aviso: av(G, 0.9 + Math.abs(dx) / 300), dur: 1.4 + fase(b) * 0.5, cor: '#8A6A3A' }); sfx('magic'); } return m.t > av(G, 1.3) + 0.5; }
  }
};
// O Desprezo (Mc 10:48): "muitos o repreendiam para que se calasse". Não é um monstro: é uma multidão de costas.
const desprezo = {
  // a multidão não persegue: fecha o caminho. Recua se você chega perto, aperta se você se afasta
  mover(G, b, dt) { const dx = G.p.x - b.x, d = Math.abs(dx); b.face = Math.sign(dx) || b.face; b.vx = d < 130 ? -b.face * (b.c.vel || 60) : d > 330 ? b.face * (b.c.vel || 60) * (1 + fase(b) * 0.2) : 0; },
  // "Mas ele clamava ainda mais" (Mc 10:48): cada golpe que você acerta é um grito a mais. O clamor enche a luz no fim da
  // estrada e se esvai se você se cala; cheio, Alguém para, e a multidão inteira se abre.
  palco(G, b, dt) {
    b.cen.vozes = Math.max(0, (b.cen.vozes || 0) - dt); b.cen.gente = 1 - b.hp / b.max;
    if (b.hpAnt != null && b.hp < b.hpAnt - 0.5 && !(b.quebrado > 0)) b.cen.clamor = Math.min(1, (b.cen.clamor || 0) + 0.075);
    b.hpAnt = b.hp; if (!(b.quebrado > 0) && (b.cen.clamor || 0) < 1) b.cen.clamor = Math.max(0, (b.cen.clamor || 0) - 0.03 * dt);
    if (!b.avisoClamor && b.t > 2.5) { b.avisoClamor = true; G.ui?.toast?.('"Ele clamava ainda mais" (Mc 10:48): não pare de golpear. Cada golpe enche a luz no fim da estrada.', 6500); }
    if (b.cen.clamor >= 1) { b.cen.clamor = 0; b.mov = null; desfazer(G, b); G.limparPerigos(); b.post = 0; b.quebrado = 3; b.postImune = 0; G.clarao = 0.22; G.tremor(10); sfx('right'); G.efeito('pilarCeu', b.x, G.N.arena.chao); G.textoEm(b.x, b.y - b.h - 26, 'JESUS PAROU (Mc 10:49)', '#FFE9A8', 17); }
  },
  pref: { calaTe: (G, b) => perto(G, b) > 220 ? 1.7 : 0.7, empurrao: (G, b) => perto(G, b) < 260 ? 1.6 : 0.6, dedos: G => noAr(G) ? 1.5 : 0.9, atropelo: (G, b) => perto(G, b) < 200 ? 1.4 : 0.9 },
  golpes: {
    // "Cala-te!": ondas de voz, uma rasteira (pule) e uma alta (fique no chão), alternando
    calaTe(G, b, m) {
      const A = G.N.arena, n = 3 + fase(b) * 2; prepara(b); b.vx = 0; if (m.t === 0) { G.fala(b, 'CALA-TE!'); b.cen.vozes = 2; }
      if (m.t > av(G, 0.6) && (m.prox ?? 0) <= m.t && (m.n || 0) < n) { m.prox = m.t + av(G, 0.5); const alta = (m.n || 0) % 2; m.n = (m.n || 0) + 1; G.tiros.push({ x: b.x + b.face * 30, y: A.chao - (alta ? 72 : 16), vx: b.face * vel(G, 330), vy: 0, r: alta ? 12 : 14, vida: 3, cor: '#C9B8E8', tipo: 'som', fixo: true }); sfx('boss'); ataca(b); G.efeito('giroSom', b.x + b.face * 30, A.chao - (alta ? 60 : 4), b.face); G.tremor(3); }
      return (m.n || 0) >= n && m.t > m.prox + 0.3;
    },
    // a multidão avança em bloco e empurra até a parede: pule por cima dos ombros
    empurrao(G, b, m, dt) {
      const A = G.N.arena;
      if (m.t === 0) { m.d = Math.sign(G.p.x - b.x) || 1; m.z = muro(G, b.x + m.d * 40 - 20, A.chao - 92, 40, 92, { aviso: av(G, 0.7), dur: 3.2, cor: '#8A7A9A' }); G.fala(b, 'Não atrapalhe!'); G.efeito('baque', b.x + m.d * 40, A.chao); }
      prepara(b); if (m.z.aviso <= 0) m.z.x += m.d * vel(G, 190) * dt;
      if (m.z.x < A.x0 - 40 || m.z.x > A.x1 || m.t > 4.2) { m.z.dur = 0; return true; }
      return false;
    },
    // dedos apontados: dardos mirados, um de cada canto
    dedos(G, b, m) {
      const A = G.N.arena, n = 4 + fase(b); prepara(b);
      if ((m.prox ?? av(G, 0.5)) <= m.t && (m.n || 0) < n) { m.prox = m.t + av(G, 0.42); const k = m.n || 0; m.n = k + 1; const x = k % 2 ? A.x1 - 30 : A.x0 + 30, y = A.chao - 150 - (k % 3) * 30; bala(G, x, y, Math.atan2(G.p.y - 20 - y, G.p.x - x), vel(G, 360), { r: 6, cor: '#E8D9F4', tipo: 'lanca', vida: 2.5 }); G.fx.anel(x, y, '#E8D9F4', 30); sfx('shoot'); }
      return (m.n || 0) >= n && m.t > m.prox + 0.4;
    },
    // a multidão passa por cima: só um vão fica livre, e a cada vez o vão está noutro lugar
    atropelo(G, b, m) {
      const A = G.N.arena, L = (A.x1 - A.x0) / 6, voltas = 2 + fase(b); prepara(b);
      if ((m.prox ?? 0) <= m.t && (m.n || 0) < voltas) { m.prox = m.t + av(G, 1.2); const k = m.n || 0; m.n = k + 1; const vao = clamp(Math.floor((G.p.x - A.x0) / L) + [1, -1, 2, -2][k % 4], 0, 5); for (let i = 0; i < 6; i++) if (i !== vao) zona(G, { tipo: 'col', x: A.x0 + i * L + 4, w: L - 8, aviso: av(G, 1), dur: 0.22, cor: '#8A7A9A' }); m.cai = m.t + av(G, 1); m.vao = vao; G.tremor(4); sfx('magic'); }
      if (m.cai != null && m.t >= m.cai) { m.cai = null; for (let i = 0; i < 6; i += 2) if (i !== m.vao) G.efeito('slamPedra', A.x0 + (i + 0.5) * L, A.chao); G.tremor(9); sfx('block'); }
      return (m.n || 0) >= voltas && m.t > m.prox + 0.2;
    }
  }
};
// O Cárcere (At 12): duas cadeias, quatro escoltas, um portão de ferro. A prisão não anda: as grades é que se movem.
const carcere = {
  mover(G, b, dt) { const A = G.N.arena; b.cen.lado = b.cen.lado || 1; b.cen.troca = (b.cen.troca ?? 6) - dt; if (b.cen.troca <= 0) { b.cen.troca = 7 - fase(b); b.cen.lado *= -1; } const alvo = b.cen.lado > 0 ? A.x1 - 90 : A.x0 + 90, dx = alvo - b.x; b.vx = Math.abs(dx) > 10 ? Math.sign(dx) * (b.c.vel || 120) : 0; b.face = Math.sign(G.p.x - b.x) || b.face; },
  // "Mas a igreja fazia contínua oração por ele" (At 12:5). Nenhum golpe abre esta prisão sozinho: ficar parado e ORAR enche a
  // vigília (as velas da casa de Maria, ao fundo). Cheia, uma luz resplandece na cela, as cadeias caem e o Cárcere fica quebrantado.
  jogador(G, b, p, dt) {
    if (p.morto || b.morrendo) return;
    if (!b.avisoVigilia && b.t > 2.5) { b.avisoVigilia = true; G.ui?.toast?.('"A igreja fazia contínua oração por ele" (At 12:5): fique parado e ORE. Quando as velas ao fundo se acenderem todas, as cadeias caem.', 8000); }
    b.vigCd = Math.max(0, (b.vigCd || 0) - dt);
    const ora = G.ctl?.orar && p.chao && Math.abs(p.vx) < 30;
    if (ora && b.vigCd <= 0 && !(b.quebrado > 0)) {
      b.vigLocal = (b.vigLocal || 0) + dt / 2.6; if (Math.random() < dt * 12) G.fx.sobe(p.x + rand(-12, 12), p.y - 10, 1, '#FFE9A8');
      if (b.vigLocal >= 1) { b.vigLocal = 0; b.vigCd = 13; G.clarao = 0.28; G.tremor(12); sfx('level'); G.efeito('pilarCeu', b.x, G.N.arena.chao); G.limparPerigos(); G.textoEm(b.x, b.y - b.h - 26, 'AS CADEIAS CAÍRAM (At 12:7)', '#FFE9A8', 17); if (G.souDono()) { b.mov = null; desfazer(G, b); b.post = 0; b.postImune = 0; b.quebrado = 3.2; } else for (let i = 0; i < 2; i++) G.atingir(b, 1, p.x, { testa: true, semOleo: true }); }
    } else b.vigLocal = Math.max(0, (b.vigLocal || 0) - dt * 0.12);
  },
  palco(G, b, dt) { b.cen.grades = 1 - b.hp / b.max; },
  pref: { correntes: G => noAr(G) ? 0.6 : 1.4, escoltas: (G, b) => perto(G, b) > 200 ? 1.5 : 0.9, portao: (G, b) => fase(b) ? 1.3 : 0.8, ronda: (G, b) => perto(G, b) > 300 ? 1.6 : 0.8 },
  golpes: {
    // "preso com duas cadeias" (At 12:6): duas correntes cruzam a cela, uma de cada parede
    correntes(G, b, m) {
      const A = G.N.arena, n = 2 + fase(b); prepara(b);
      if ((m.prox ?? av(G, 0.6)) <= m.t && (m.n || 0) < n) { m.prox = m.t + av(G, 0.95); const k = m.n || 0; m.n = k + 1; for (const [lado, alt] of [[1, 16], [-1, k % 2 ? 76 : 16]]) G.tiros.push({ x: lado > 0 ? A.x0 + 10 : A.x1 - 10, y: A.chao - alt, vx: lado * vel(G, 340), vy: 0, r: 9, vida: 3.2, cor: '#8A8E9A', tipo: 'bola', fixo: true, fura: true }); sfx('gate'); ataca(b); G.efeito('faisca', A.x0 + 12, A.chao - 16, 1); G.efeito('faisca', A.x1 - 12, A.chao - 16, -1); }
      return (m.n || 0) >= n && m.t > m.prox + 0.5;
    },
    // "quatro escoltas de quatro soldados" (At 12:4): as lanças sobem do chão atrás dos seus passos
    escoltas(G, b, m) {
      const A = G.N.arena, n = 4 + fase(b); prepara(b);
      if ((m.prox ?? 0) <= m.t && (m.n || 0) < n) { m.prox = m.t + av(G, 0.38); m.n = (m.n || 0) + 1; const x = clamp(G.p.x + G.p.vx * 0.25, A.x0 + 20, A.x1 - 20); zona(G, { tipo: 'ret', x: x - 12, y: A.chao - 130, w: 24, h: 130, aviso: av(G, 0.6), dur: 0.18, cor: '#C9B48A' }); sfx('swing'); }
      return (m.n || 0) >= n && m.t > m.prox + 0.5;
    },
    // o portão de ferro (At 12:10) desce na cela inteira, menos num vão: o vão iluminado é a saída
    portao(G, b, m) {
      const A = G.N.arena, L = (A.x1 - A.x0) / 5;
      if (m.t === 0) { m.vao = Math.floor(rand(0, 5)); for (let i = 0; i < 5; i++) if (i !== m.vao) zona(G, { tipo: 'col', x: A.x0 + i * L + 3, w: L - 6, aviso: av(G, 1.5), dur: 0.35, cor: '#5A5E6A' }); zona(G, { tipo: 'circ', x: A.x0 + (m.vao + 0.5) * L, y: A.chao - 20, r: 30, aviso: av(G, 1.5), dur: 0.01, cor: '#FFE9A8', isca: true }); G.fala(b, 'Ninguém sai!'); sfx('gate'); }
      prepara(b); if (m.t > av(G, 1.5) && !m.caiu) { m.caiu = true; G.tremor(12); sfx('block'); for (let i = 0; i < 5; i++) if (i !== m.vao) G.efeito('slamPedra', A.x0 + (i + 0.5) * L, A.chao); }
      return m.t > av(G, 1.5) + 0.6;
    },
    // a ronda: a lanterna do carcereiro varre a cela de ponta a ponta; atravesse-a com o passo
    ronda(G, b, m) {
      const A = G.N.arena, L = (A.x1 - A.x0) / 8; if (m.t === 0) { m.d = G.p.x > A.cx ? -1 : 1; m.i = 0; } prepara(b);
      if ((m.prox ?? av(G, 0.4)) <= m.t && m.i < 8) { m.prox = m.t + av(G, 0.26); const col = m.d > 0 ? m.i : 7 - m.i; zona(G, { tipo: 'col', x: A.x0 + col * L + 2, w: L - 4, aviso: av(G, 0.5), dur: 0.15, cor: '#FFE08A' }); m.i++; }
      return m.i >= 8 && m.t > m.prox + 0.5;
    }
  }
};

/* ======================================================================================================
   O CONSELHO ZELOTE: três lutadores. Primeiro um de cada vez, em rodízio; depois duplas que se alternam; por fim os três. Somem entre um golpe e outro (voltam ao trono)
   e reaparecem já no golpe: rasante pelo chão, mergulho do alto ou arremesso de cima da parede. Só se fere quem está na sala.
   Menaém (punhais) luta sozinho; depois Eleazar (lança) e Jair (foice) lutam juntos; no fim, os três de uma vez.
   A vida é uma só, do conselho inteiro: bater em qualquer um deles fere o conselho.
   ====================================================================================================== */
// Os tronos: Menaém à esquerda, Eleazar no meio, Jair à direita (o desenho fica em pixel/palcos.js). Quem não está na sala
// fica sentado no trono dele; ao ser chamado salta do trono até onde o golpe começa, e no fim do golpe salta de volta.
const QUEM_Z = b => b.id === 'conselho' ? (b.cen?.quem || 'menaem') : b.id === 'zeloteFoice' ? 'jair' : 'menaem';
export const tronoZ = (A, quem) => ({ x: A.cx + ({ menaem: -1, eleazar: 0, jair: 1 }[quem] ?? 0) * 128, y: A.chao - 124 });
const arco = (b, x0, y0, x1, y1, k, alto) => { b.x = x0 + (x1 - x0) * k; b.y = y0 + (y1 - y0) * k - Math.sin(k * Math.PI) * alto; };
const noTrono = (G, b, dt = 0) => { b.vx = 0; b.corre = false;
  // na vez dele, entre um golpe e outro, fica na sala: cai até o chão, encara você e espera o próximo golpe
  if (b.naSala && !b.folga && !b.volta) { const A = G.N.arena; b.alpha = 1; b.y = Math.min(A.chao, b.y + 700 * dt); b.face = Math.sign(G.p.x - b.x) || b.face; return; }
  if (b.alpha > 0.5 && !b.volta && !(b.hp <= 0)) b.volta = { t: 0, x0: b.x, y0: b.y };
  const v = b.volta; if (!v) { b.alpha = 0; return; }
  v.t += dt; const k = Math.min(1, v.t / 0.34), d = tronoZ(G.N.arena, QUEM_Z(b)); b.alpha = 1; b.face = Math.sign(d.x - v.x0) || b.face; b.corre = true; arco(b, v.x0, v.y0, d.x, d.y, k, 90);
  if (k >= 1) { b.volta = null; b.naSala = false; b.alpha = 0; b.corre = false; } };
// no começo do golpe: do trono até o ponto de partida (o aviso do golpe continua contando)
function saiDoTrono(G, b, m) {
  if (m.t === 0) { const o = tronoZ(G.N.arena, QUEM_Z(b)), daSala = b.naSala || b.volta; m.sai = { x0: daSala ? m.px0 : o.x, y0: daSala ? m.py0 : o.y, x1: b.x, y1: b.y, alto: daSala ? 50 : 80 }; b.volta = null; sfx('dodge'); }
  const s = m.sai; if (!s) return; const k = Math.min(1, m.t / 0.3); arco(b, s.x0, s.y0, s.x1, s.y1, k, s.alto); b.corre = k < 1; if (k >= 1) { m.sai = null; b.naSala = true; G.efeito('pouso', b.x, b.y); } }
// rasante: aparece num canto, no chão, e cruza a sala inteira. Pule (ou atravesse com o passo)
function zRasante(G, b, m, dt, o) {
  const A = G.N.arena;
  if (m.e === 0) { if (m.t === 0) { m.px0 = b.x; m.py0 = b.y; m.d = G.p.x > A.cx ? 1 : -1; b.x = m.d > 0 ? A.x0 + 46 : A.x1 - 46; b.y = A.chao; b.face = m.d; b.alpha = 1; sfx('swing'); } saiDoTrono(G, b, m); b.alpha = 1; prepara(b); if (m.t > av(G, o.tele)) { m.e = 1; sfx('dodge'); } return false; }
  if (m.e === 1) { ataca(b); b.corre = true; b.x += m.d * vel(G, o.v) * dt; if (Math.random() < dt * 40) G.fx.po(b.x - m.d * 20, b.y - 4, 2, o.cor);
    if ((m.d > 0 && b.x > A.x1 - 56) || (m.d < 0 && b.x < A.x0 + 56)) { b.x = clamp(b.x, A.x0 + 56, A.x1 - 56); b.corre = false; if (o.volta && !m.voltou) { m.voltou = true; m.e = 3; m.t0 = m.t; } else { m.e = 2; m.t0 = m.t; } } return false; }
  if (m.e === 3) { prepara(b); b.face = -m.d; if (m.t - m.t0 > av(G, 0.32)) { m.d *= -1; m.e = 1; sfx('dodge'); } return false; } // vira e volta
  return m.t - m.t0 > o.rec; // fica um instante exposto, sem fôlego
}
// mergulho: aparece no alto, em cima de você, e desce reto com a arma
function zMergulho(G, b, m, dt, o) {
  const A = G.N.arena;
  if (m.e === 0) { if (m.t === 0) { m.px0 = b.x; m.py0 = b.y; b.x = clamp(G.p.x + (o.adianta ? G.p.vx * 0.25 : 0), A.x0 + 40, A.x1 - 40); b.y = A.chao - 236; b.alpha = 1; b.face = Math.sign(G.p.x - b.x) || 1; sfx('magic'); }
    saiDoTrono(G, b, m); b.alpha = 1; prepara(b); if (o.segue && m.t < av(G, o.tele) * 0.65) b.x += clamp(G.p.x - b.x, -1, 1) * vel(G, o.segue) * dt;
    if (!m.marca && m.t > av(G, o.tele) * 0.65) { m.marca = true; zona(G, { tipo: 'circ', x: b.x, y: A.chao - 14, r: 26, aviso: av(G, o.tele) * 0.35 + 0.12, dur: 0.01, cor: o.cor, isca: true }); }
    if (m.t > av(G, o.tele)) { m.e = 1; sfx('swing'); } return false; }
  if (m.e === 1) { ataca(b); b.y += vel(G, o.v) * dt; if (b.y >= A.chao) { b.y = A.chao; m.e = 2; m.t0 = m.t; G.tremor(6); G.efeito('pouso', b.x, A.chao); sfx('block'); o.aoCair?.(G, b, m); } return false; }
  return m.t - m.t0 > o.rec;
}
// da parede: agarra-se no alto do lado mais longe de você e arremessa
function zParede(G, b, m, dt, o) {
  const A = G.N.arena;
  if (m.e === 0) { if (m.t === 0) { m.px0 = b.x; m.py0 = b.y; m.lado = G.p.x > A.cx ? -1 : 1; b.x = m.lado < 0 ? A.x0 + 24 : A.x1 - 24; b.y = A.chao - o.alt; b.face = -m.lado; b.alpha = 1; sfx('swing'); } saiDoTrono(G, b, m); b.alpha = 1; prepara(b); if (m.t > av(G, o.tele)) { m.e = 1; m.n = 0; m.prox = m.t; } return false; }
  b.alpha = 1; if (m.prox <= m.t && m.n < o.n) { m.prox = m.t + o.int; m.n++; o.lanca(G, b, m, -m.lado); ataca(b); sfx('shoot'); }
  return m.n >= o.n && m.t > m.prox + o.rec && (!o.espera || o.espera(G, m));
}
// a foice que vai e volta: sai rente a uma altura, perde força, e volta noutra
const foice = (G, b, m, dir, y0, y1, v) => { const f = bala(G, b.x + dir * 20, y0, 0, 0, { r: 11, cor: '#D9B878', tipo: 'bola', vida: 5, fura: true, fixo: true }); f.vx = dir * vel(G, v); f.zf = { dir, y0, y1, ida: true, x0: f.x, t: 0 }; (m.fs = m.fs || []).push(f); };
const passoFoices = (G, m, dt) => { const A = G.N.arena; for (const f of m.fs || []) if (vivo(G, f)) { const z = f.zf; z.t += dt; if (z.ida) { f.vx -= z.dir * vel(G, 560) * dt; if (f.vx * z.dir <= 0) z.ida = false; } else { f.vx -= z.dir * vel(G, 760) * dt; f.y += (z.y1 - f.y) * Math.min(1, dt * 5); if ((z.dir > 0 && f.x < A.x0 + 30) || (z.dir < 0 && f.x > A.x1 - 30)) f.vida = 0; } } };

// o assassino: some, e aparece JÁ nas suas costas. O aviso é curto: ande para a frente ou pule
function zCostas(G, b, m, dt, o) {
  const A = G.N.arena;
  if (m.e === 0) { if (m.t === 0) { const lado = -(G.p.face || 1); b.x = clamp(G.p.x + lado * 74, A.x0 + 40, A.x1 - 40); b.y = A.chao; b.face = Math.sign(G.p.x - b.x) || 1; m.d = b.face; b.alpha = 1; b.naSala = true; b.volta = null; G.efeito('sumico', b.x, b.y - 30); sfx('dodge'); zona(G, { tipo: 'circ', x: b.x + m.d * 40, y: A.chao - 26, r: 50, aviso: av(G, o.tele), dur: 0.12, cor: o.cor }); }
    b.alpha = 1; prepara(b); if (m.t > av(G, o.tele)) { m.e = 1; m.t0 = m.t; ataca(b); sfx('swing'); b.x = clamp(b.x + m.d * 46, A.x0 + 40, A.x1 - 40); } return false; }
  b.alpha = 1; return m.t - m.t0 > o.rec;
}
// o vidente: brasas que procuram você, devagar, e se apagam sozinhas
const brasa = (G, b, m) => { const f = bala(G, b.x + b.face * 14, b.y - 58, -Math.PI / 2 + (m.n - 2) * 0.7, vel(G, 250), { r: 8, cor: FOGO, tipo: 'bola', vida: 3.4 }); (m.bs = m.bs || []).push(f); };
const passoBrasas = (G, m, dt) => { for (const f of m.bs || []) if (vivo(G, f)) guiar(f, G.p.x, G.p.y - 22, 2.1, dt); };
// o forte: o chão responde. Pedras caem do teto onde a sala rachou
const pedrasDoTeto = (G, b, n) => { const A = G.N.arena; for (let k = 0; k < n; k++) zona(G, { tipo: 'circ', x: clamp(k === 0 ? G.p.x : A.x0 + 60 + Math.random() * (A.x1 - A.x0 - 120), A.x0 + 40, A.x1 - 40), y: A.chao - 20, r: 34, aviso: av(G, 0.6 + k * 0.22), dur: 0.15, cor: LANCA }); };

const PUNHAL = '#C9D2E0', LANCA = '#C9B48A', FOICE = '#D9B878', FOGO = '#FF9A3C';
const GOLPES_MENAEM = new Set(['punhalRasante', 'punhalCadente', 'vaiEVolta', 'punhaisDaParede', 'pelasCostas']), GOLPES_ELEAZAR = new Set(['lancaCadente', 'estocadaZelote', 'lancasDaParede', 'giroDaLanca', 'abaloDoForte']);
const conselho = {
  // entre os golpes ninguém fica na sala: voltam ao trono
  mover(G, b, dt) { noTrono(G, b, dt); },
  // o palco: quem está sentado, quem desceu; os dois companheiros entram na segunda fase, Menaém volta na terceira.
  // A vida é uma só: o que os companheiros apanham sai da vida do conselho.
  // O rodízio do conselho. Fase 1: um de cada vez (Menaém, Eleazar, Jair, e de novo). Fase 2: dois de cada vez, alternando as
  // duplas (Menaém e Eleazar, Eleazar e Jair, Jair e Menaém). Fase 3: os três juntos. O corpo principal é Menaém ou Eleazar na
  // fase 1 e Eleazar daí em diante; Jair é o companheiro zeloteFoice e Menaém, a partir da fase 2, o zelotePunhal.
  // A vida é uma só: o que os companheiros apanham sai da vida do conselho.
  palco(G, b, dt) {
    const f = fase(b), dono = G.souDono?.() !== false, parceiros = !!G.novoParceiro, r = b.cen.rod = b.cen.rod || { i: 0, t: 7, f: 0 };
    if (G.novoParceiro && dono) { b.pars = (b.pars || []).filter(q => G.inimigos.includes(q));
      if (!b.pars.some(q => q.id === 'zeloteFoice')) { const q = G.novoParceiro('zeloteFoice'); if (q) { q.espera = 1; b.pars.push(q); } }
      if (f >= 1 && !b.pars.some(q => q.id === 'zelotePunhal')) { const q = G.novoParceiro('zelotePunhal'); if (q) { q.espera = 1.5; b.pars.push(q); } } }
    const jair = (b.pars || []).find(q => q.id === 'zeloteFoice'), menaemP = (b.pars || []).find(q => q.id === 'zelotePunhal');
    const ordem = parceiros && jair ? ['menaem', 'eleazar', 'jair'] : ['menaem', 'eleazar'], duplas = [['menaem', 'eleazar'], ['eleazar', 'jair'], ['jair', 'menaem']];
    if (r.f !== f) { r.f = f; r.i = 0; r.t = 0; }
    const ocupados = [b, jair, menaemP].some(q => q && q.mov);
    r.t -= dt; if (r.t <= 0 && !ocupados) { r.i++; r.t = f === 0 ? 6.5 : f === 1 ? 8 : 99; }
    const ativos = new Set(f === 0 ? [ordem[r.i % ordem.length]] : f === 1 ? (parceiros && jair ? duplas[r.i % 3] : ['eleazar']) : ['menaem', 'eleazar', 'jair']);
    const quer = f === 0 ? (ativos.has('jair') ? b.cen.quem : [...ativos][0]) : 'eleazar', trocando = quer !== b.cen.quem && (b.naSala || b.volta || b.mov); // quem está na sala volta ao trono antes de o outro descer
    if (!trocando) b.cen.quem = quer;
    b.cen.fase = f;
    const folga = (q, sim) => { if (!q) return; if (q.folga && sim) q.espera = Math.min(q.espera, 0.7); q.folga = !sim; };
    folga(b, !trocando && ativos.has(b.cen.quem)); folga(jair, ativos.has('jair')); folga(menaemP, ativos.has('menaem') && f >= 1);
    for (const q of G.inimigos) if (q.parte && q.hp < q.max) { const d = q.max - q.hp; q.hp = q.max; b.hp -= d; b.flash = 0.1; b.semGolpe = 0; if (b.hp <= 0 && !b.morrendo) { b.x = q.x; b.y = q.y; G.chefeMorre(b); } }
  },
  // o corpo principal só escolhe os golpes de quem ele é agora
  pode(G, b, n) { return (b.cen.quem === 'eleazar' ? GOLPES_ELEAZAR : GOLPES_MENAEM).has(n); },
  pref: { punhalRasante: G => noAr(G) ? 0.5 : 1.4, punhalCadente: G => noAr(G) ? 1.5 : 1, lancaCadente: G => noAr(G) ? 1.5 : 1, estocadaZelote: G => noAr(G) ? 0.5 : 1.3 },
  golpes: {
    /* --- Menaém, os punhais: o mais rápido. Luta sozinho na primeira fase --- */
    punhalRasante(G, b, m, dt) { return zRasante(G, b, m, dt, { tele: 0.5, v: 920, rec: 0.55, cor: PUNHAL }); },
    punhalCadente(G, b, m, dt) { return zMergulho(G, b, m, dt, { tele: 0.55, v: 1150, rec: 0.5, cor: PUNHAL }); },
    vaiEVolta(G, b, m, dt) { return zRasante(G, b, m, dt, { tele: 0.45, v: 860, rec: 0.6, cor: PUNHAL, volta: true }); },
    punhaisDaParede(G, b, m, dt) { return zParede(G, b, m, dt, { tele: 0.5, alt: 150, n: 3, int: 0.26, rec: 0.45, lanca: (G, b) => bala(G, b.x, b.y - 30, Math.atan2(G.p.y - 22 - (b.y - 30), G.p.x - b.x), vel(G, 560), { r: 5, cor: PUNHAL, tipo: 'lanca', vida: 2.2 }) }); },
    pelasCostas(G, b, m, dt) { return zCostas(G, b, m, dt, { tele: 0.46, rec: 0.6, cor: PUNHAL }); },
    /* --- Eleazar, o forte: o mais pesado. Onde ele cai, a sala racha. Entra na segunda fase --- */
    abaloDoForte(G, b, m, dt) { return zMergulho(G, b, m, dt, { tele: 0.8, v: 1400, rec: 0.9, cor: LANCA, segue: 110, aoCair: (G, b) => { G.tremor(14); choque(G, b, LANCA, 380); pedrasDoTeto(G, b, 4); } }); },
    lancaCadente(G, b, m, dt) { return zMergulho(G, b, m, dt, { tele: 0.62, v: 1250, rec: 0.6, cor: LANCA, adianta: true, aoCair: (G, b) => choque(G, b, LANCA, 300) }); },
    estocadaZelote(G, b, m, dt) { return zRasante(G, b, m, dt, { tele: 0.68, v: 1180, rec: 0.7, cor: LANCA }); },
    lancasDaParede(G, b, m, dt) { const A = G.N.arena; return zParede(G, b, m, dt, { tele: 0.55, alt: 120, n: 3, int: 0.42, rec: 0.5, lanca: (G, b, m, dir) => G.tiros.push({ x: b.x, y: A.chao - (m.n % 2 ? 18 : 78), vx: dir * vel(G, 500), vy: 0, r: 7, vida: 3, cor: LANCA, tipo: 'lanca', fixo: true, fura: true }) }); },
    giroDaLanca(G, b, m, dt) { return zMergulho(G, b, m, dt, { tele: 0.7, v: 1000, rec: 0.75, cor: LANCA, segue: 150, aoCair: (G, b) => zona(G, { tipo: 'circ', x: b.x, y: b.y - 24, r: 112, aviso: av(G, 0.34), dur: 0.2, cor: LANCA }) }); }
  }
};
// Jair, o vidente: luta de longe. As foices vão e voltam sozinhas, o fogo desce e as brasas perseguem
const zeloteFoice = {
  mover(G, b, dt) { noTrono(G, b, dt); },
  palco() {},
  pref: { foiceRasteira: G => noAr(G) ? 0.6 : 1.4, foiceAlta: G => noAr(G) ? 1.4 : 0.8 },
  golpes: {
    foiceRasteira(G, b, m, dt) { passoFoices(G, m, dt); const A = G.N.arena; return zParede(G, b, m, dt, { tele: 0.55, alt: 46, n: 1, int: 0.3, rec: 0.5, lanca: (G, b, m, dir) => foice(G, b, m, dir, A.chao - 16, A.chao - 84, 620), espera: (G, m) => !(m.fs || []).some(f => vivo(G, f)) || m.t > 4.5 }); },
    foiceAlta(G, b, m, dt) { passoFoices(G, m, dt); const A = G.N.arena; return zParede(G, b, m, dt, { tele: 0.55, alt: 150, n: 2, int: 0.5, rec: 0.5, lanca: (G, b, m, dir) => foice(G, b, m, dir, A.chao - (m.n % 2 ? 90 : 22), A.chao - (m.n % 2 ? 20 : 96), 580), espera: (G, m) => !(m.fs || []).some(f => vivo(G, f)) || m.t > 5.5 }); },
    /* o vidente: o fogo do zelo cai onde você está (2Rs 1:10), e as brasas procuram você */
    fogoDoZelo(G, b, m, dt) { const A = G.N.arena; return zParede(G, b, m, dt, { tele: 0.6, alt: 0, n: 4, int: 0.42, rec: 0.7, lanca: (G) => { muro(G, clamp(G.p.x + G.p.vx * 0.2, A.x0 + 30, A.x1 - 30) - 24, A.chao - 230, 48, 230, { aviso: av(G, 0.62), dur: 0.3, cor: FOGO }); sfx('magic'); } }); },
    brasasVivas(G, b, m, dt) { passoBrasas(G, m, dt); return zParede(G, b, m, dt, { tele: 0.6, alt: 0, n: 3, int: 0.3, rec: 0.6, lanca: (G, b, m) => brasa(G, b, m), espera: (G, m) => !(m.bs || []).some(f => vivo(G, f)) || m.t > 5 }); },
    ceifar(G, b, m, dt) { return zRasante(G, b, m, dt, { tele: 0.6, v: 840, rec: 0.6, cor: FOICE }); },
    foiceCadente(G, b, m, dt) { return zMergulho(G, b, m, dt, { tele: 0.6, v: 1050, rec: 0.55, cor: FOICE, adianta: true }); }
  }
};
// Menaém de volta, ferido e furioso, na última fase: três de uma vez
const zelotePunhal = {
  mover(G, b, dt) { noTrono(G, b, dt); },
  palco() {},
  pref: { rasgo: G => noAr(G) ? 0.5 : 1.3, boteZelote: G => noAr(G) ? 1.5 : 1 },
  golpes: {
    rasgo(G, b, m, dt) { return zRasante(G, b, m, dt, { tele: 0.55, v: 900, rec: 0.6, cor: PUNHAL }); },
    boteZelote(G, b, m, dt) { return zMergulho(G, b, m, dt, { tele: 0.6, v: 1100, rec: 0.55, cor: PUNHAL }); },
    chuvaDePunhais(G, b, m, dt) { return zParede(G, b, m, dt, { tele: 0.55, alt: 170, n: 4, int: 0.24, rec: 0.5, lanca: (G, b, m) => bala(G, b.x, b.y - 30, Math.atan2(G.p.y - 22 - (b.y - 30), G.p.x - b.x) + (m.n % 2 ? 0.12 : -0.12), vel(G, 520), { r: 5, cor: PUNHAL, tipo: 'lanca', vida: 2.2 }) }); },
    finta(G, b, m, dt) { return zRasante(G, b, m, dt, { tele: 0.4, v: 780, rec: 0.7, cor: PUNHAL, volta: true }); },
    sombraNasCostas(G, b, m, dt) { return zCostas(G, b, m, dt, { tele: 0.5, rec: 0.65, cor: PUNHAL }); }
  }
};

/* ======================================================================================================
   A RAIZ DE AMARGURA (Hb 12:15): o que estava consumindo a aldeia. Voa, mergulha em diagonal, chove fel do alto,
   rasga o chão com raízes e fecha as paredes. Quanto mais ferida, mais o espinheiro toma a sala.
   ====================================================================================================== */
const FEL = '#B8E060', ESPINHO = '#3A5A2A';
const amargura = {
  // paira do lado oposto ao seu, subindo e descendo devagar: nunca fica ao alcance por muito tempo
  mover(G, b, dt) { const A = G.N.arena, lado = G.p.x > A.cx ? -1 : 1, tx = clamp(G.p.x + lado * 210, A.x0 + 70, A.x1 - 70), ty = A.chao - 150 + Math.sin(b.t * 1.7) * 26; b.vx = 0; b.x += (tx - b.x) * Math.min(1, dt * 1.6); b.y += (ty - b.y) * Math.min(1, dt * 2.2); b.face = Math.sign(G.p.x - b.x) || b.face; },
  palco(G, b, dt) { b.cen.espinhos = 1 - b.hp / b.max; b.cen.fase = fase(b); if (Math.random() < dt * (2 + b.cen.espinhos * 8)) G.parts.push({ x: rand(G.N.arena.x0, G.N.arena.x1), y: G.N.arena.y0 + rand(0, 40), vx: rand(-10, 10), vy: rand(20, 60), t: 1.6, max: 1.6, r: 1.3, cor: FEL, g: 30 }); },
  pref: { raizesAmargas: G => noAr(G) ? 0.4 : 1.6, rasgoDeEspinho: (G, b) => perto(G, b) > 240 ? 1.5 : 1, chuvaDeFel: G => noAr(G) ? 1.3 : 0.9, lequeDeEspinhos: (G, b) => perto(G, b) > 200 ? 1.4 : 0.8, marDeFel: G => noAr(G) ? 0.5 : 1.3, abracoDaRaiz: (G, b) => perto(G, b) < 260 ? 1.4 : 0.8 },
  golpes: {
    // DO CHÃO: crava-se no chão e as raízes correm por baixo, uma atrás da outra, na sua direção (nas fases seguintes, para os dois lados)
    raizesAmargas(G, b, m, dt) {
      const A = G.N.arena;
      if (m.e === 0) { prepara(b); b.y += (A.chao - b.y) * Math.min(1, dt * 9); if (m.t === 0) G.fala(b, 'Lembra do que te fizeram?'); if (m.t > av(G, 0.6)) { m.e = 1; b.y = A.chao; m.x0 = b.x; m.d = Math.sign(G.p.x - b.x) || 1; m.i = 0; m.prox = m.t; G.efeito('slamMagia', b.x, A.chao); G.tremor(9); sfx('block'); } return false; }
      ataca(b); const n = 9 + fase(b) * 3;
      if (m.prox <= m.t && m.i < n) { m.prox = m.t + 0.085; m.i++; for (const d of fase(b) ? [m.d, -m.d] : [m.d]) { const x = m.x0 + d * (40 + m.i * 48); if (x > A.x0 + 10 && x < A.x1 - 10) { zona(G, { tipo: 'ret', x: x - 13, y: A.chao - 96, w: 26, h: 96, aviso: av(G, 0.36), dur: 0.22, cor: ESPINHO }); if (m.i % 3 === 0) G.efeito('slamAreia', x, A.chao); } } }
      return m.i >= n && m.t > m.prox + 0.7;
    },
    // EM DIAGONAL: some para um canto do teto e rasga a sala de ponta a ponta, deixando espinhos que caem. Duas, três, quatro vezes
    rasgoDeEspinho(G, b, m, dt) {
      const A = G.N.arena, n = 2 + fase(b);
      if (m.e === 0) { if (m.t0 == null) { m.t0 = m.t; m.k = m.k || 0; m.lado = (m.k % 2 ? 1 : -1) * (G.p.x > A.cx ? -1 : 1); b.x = m.lado < 0 ? A.x0 + 50 : A.x1 - 50; b.y = A.chao - 250; G.efeito('fumacaNegra', b.x, b.y - 30); sfx('magic'); }
        prepara(b); b.face = -m.lado; const ax = clamp(G.p.x, A.x0 + 40, A.x1 - 40); if (!m.marca) { m.marca = true; m.ax = ax; zona(G, { tipo: 'circ', x: ax, y: A.chao - 14, r: 30, aviso: av(G, 0.5), dur: 0.01, cor: FEL, isca: true }); }
        if (m.t - m.t0 > av(G, 0.5)) { m.e = 1; const dx = m.ax - b.x, dy = A.chao - b.y, L = Math.hypot(dx, dy); m.ux = dx / L; m.uy = dy / L; sfx('dodge'); G.efeito('giroRoxo', b.x, b.y - 30, -m.lado); } return false; }
      if (m.e === 1) { ataca(b); b.corre = true; const v = vel(G, 1050); b.x += m.ux * v * dt; b.y += m.uy * v * dt; if ((m.px ?? 0) <= m.t) { m.px = m.t + 0.05; bala(G, b.x, b.y - 30, Math.PI / 2 + rand(-0.5, 0.5), vel(G, 120), { g: 520, r: 5, cor: FEL, vida: 2.2 }); }
        if (b.y >= A.chao) { b.y = A.chao; b.corre = false; m.e = 2; m.t1 = m.t; G.tremor(10); G.efeito('slamMagia', b.x, A.chao); sfx('block'); G.clarao = 0.06; } return false; }
      if (m.t - m.t1 > 0.42) { m.k++; if (m.k < n) { m.e = 0; m.t0 = null; m.marca = false; return false; } return true; }
      return false;
    },
    // DO AR: sobe ao teto, abre as asas e chove fel pela sala inteira, em cortinas que andam
    chuvaDeFel(G, b, m, dt) {
      const A = G.N.arena, L = A.x1 - A.x0;
      if (m.e === 0) { prepara(b); b.x += (A.cx - b.x) * Math.min(1, dt * 4); b.y += (A.chao - 250 - b.y) * Math.min(1, dt * 5); if (m.t === 0) G.fala(b, 'Ninguém pagou pelo que você sofreu.'); if (m.t > av(G, 0.7)) { m.e = 1; m.t0 = m.t; m.i = 0; m.prox = m.t; sfx('magic'); G.efeito('fumacaRoxa', b.x, b.y - 20); } return false; }
      ataca(b); const dur = 2.6 + fase(b) * 0.6;
      if (m.prox <= m.t) { m.prox = m.t + 0.075; m.i++; const fr = ((m.i * 0.137) + Math.sin(m.i * 0.21) * 0.25 + 10) % 1; G.tiros.push({ x: A.x0 + 16 + fr * (L - 32), y: A.y0 + 10, vx: 0, vy: vel(G, 240), g: 420, r: 5, vida: 3, cor: FEL, tipo: 'bola' }); if (m.i % 12 === 0) G.tremor(2); }
      return m.t - m.t0 > dur;
    },
    // EM LEQUE: três rajadas de espinhos abertas em leque, miradas em você, cada uma mais larga
    lequeDeEspinhos(G, b, m, dt) {
      const c = centro(b), n = 3 + fase(b); prepara(b);
      if ((m.prox ?? av(G, 0.5)) <= m.t && (m.n || 0) < n) { m.prox = m.t + av(G, 0.5); const k = m.n || 0; m.n = k + 1; const a0 = Math.atan2(G.p.y - 22 - c.y, G.p.x - c.x), q = 2 + k; for (let i = -q; i <= q; i++) bala(G, c.x, c.y, a0 + i * 0.17, vel(G, 430), { r: 5, cor: ESPINHO, tipo: 'lanca', vida: 3 }); ataca(b); sfx('shoot'); G.efeito('faisca', c.x, c.y, b.face); }
      return (m.n || 0) >= n && m.t > m.prox + 0.4;
    },
    // O MAR DE FEL: o fel sobe pelo chão, metade da sala de cada vez (na última fase, o chão inteiro: suba nas raízes)
    marDeFel(G, b, m, dt) {
      const A = G.N.arena, L = A.x1 - A.x0, voltas = 2 + fase(b); prepara(b);
      if ((m.prox ?? 0) <= m.t && (m.n || 0) < voltas) { m.prox = m.t + av(G, 1.9); const k = m.n || 0; m.n = k + 1; const tudo = fase(b) >= 2 && k === voltas - 1, esq = k % 2 === (G.p.x > A.cx ? 1 : 0);
        zona(G, { tipo: 'ret', x: tudo ? A.x0 : esq ? A.x0 : A.x0 + L / 2, y: A.chao - 22, w: tudo ? L : L / 2, h: 22, aviso: av(G, 1), dur: 0.8, cor: FEL }); sfx('magic'); if (k === 0) G.fala(b, 'Beba. É o que sobrou para você.'); }
      return (m.n || 0) >= voltas && m.t > m.prox + 0.2;
    },
    // O ABRAÇO: duas paredes de espinho saem dos cantos e se fecham no meio. Pule uma delas
    abracoDaRaiz(G, b, m, dt) {
      const A = G.N.arena;
      if (m.t === 0) { m.zs = [-1, 1].map(lado => Object.assign(muro(G, lado < 0 ? A.x0 + 4 : A.x1 - 44, A.chao - 78, 40, 78, { aviso: av(G, 0.75), dur: 3.4, cor: ESPINHO }), { lado })); G.fala(b, 'Fique. Fique comigo.'); sfx('gate'); }
      prepara(b); for (const z of m.zs) if (z.aviso <= 0) z.x -= z.lado * vel(G, 170) * dt;
      if (m.zs[0].x + 40 >= m.zs[1].x || m.t > 4) { for (const z of m.zs) z.dur = 0; G.efeito('slamMagia', (m.zs[0].x + m.zs[1].x) / 2 + 20, A.chao); G.tremor(8); return true; }
      return false;
    }
  }
};

export const ESTILOS = { amargura, conselho, zeloteFoice, zelotePunhal, escassez, desprezo, carcere, mamom, procrastinacao, mentira, imoralidade, satanas, fuga, pavor, desespero, violencia, ressentimento, encantadores, jugo, babilonia, fera, soberba, golias, behemote, leviata };

// o que precisa ser desfeito quando um golpe é interrompido (virada de fase, quebranto, morte)
export function desfazer(G, b) {
  if (b.morrendo && b.id === 'conselho') for (const q of G.inimigos) if (q.parte) { q.fora = true; G.efeito?.('sumico', q.x, q.y - 30); } // caiu o conselho: os companheiros se retiram
  b.raios = null; b.encanta = false; G.puxao = null; b.alpha = 1; b.corre = false; b.perigo = false; b.art.lanca = null;
  if (b.cen) { b.cen.amarra = 0; b.cen.laco = 0; b.cen.corrente = null; b.cen.corda = null; b.cen.verme = null; b.cen.nuvem = null; b.cen.estrelas = null; b.cen.vortice = null; b.cen.gira = 0; b.cen.brilho = 0; b.cen.treme = 0; }
}
