// Os vícios em vista lateral. A arte é a mesma do bestiário (game/enemy-art.js); o comportamento é novo:
// cada vício se move de um jeito que conta o que ele é (a Ira investe, o Medo some no escuro, o Orgulho só cai pelas costas).
import { rand, clamp, TAU } from '../util.js';
import { sfx } from '../audio.js';
import { ENEMIES } from '../data/bestiary.js';
import { drawEnemy } from '../game/enemy-art.js';
import { T } from './nivel.js';
import { mover, chaoAbaixo, solido } from './corpo.js';

export const VICIOS = {
  preguica: { ai: 'ronda', golpes: 4, vel: 34, r: 15 },
  distracao: { ai: 'voa', golpes: 2, vel: 120, r: 12 },
  desanimo: { ai: 'bote', golpes: 3, vel: 70, r: 15 },
  inveja: { ai: 'salto', golpes: 3, vel: 90, r: 14 },
  ganancia: { ai: 'ladrao', golpes: 3, vel: 210, r: 13 },
  duvida: { ai: 'atira', golpes: 2, vel: 80, r: 14 },
  ira: { ai: 'carga', golpes: 4, vel: 80, r: 16 },
  medo: { ai: 'sombra', golpes: 2, vel: 70, r: 14 },
  orgulho: { ai: 'guarda', golpes: 7, vel: 46, r: 21 },
  vaidade: { ai: 'pavao', golpes: 4, vel: 115, r: 15 },
  // as criaturas do Vale da Mentira
  serpente: { ai: 'serpente', golpes: 8, vel: 125, r: 17 },
  quimera: { ai: 'quimera', golpes: 8, vel: 110, r: 18 },
  grifo: { ai: 'rapina', golpes: 6, vel: 190, r: 16 },
  basilisco: { ai: 'olhar', golpes: 10, vel: 44, r: 19 },
  dragao: { ai: 'sopro', golpes: 9, vel: 100, r: 20 }
};
// cada vício luta de um jeito só dele (nenhum comportamento é dividido entre dois vícios)
export const ehVoador = tipo => VOADOR.has(VICIOS[tipo]?.ai);
const VOADOR = new Set(['voa', 'atira', 'sombra', 'pavao', 'rapina', 'sopro']);

export function novoVicio(type, x, y, escala = 1) {
  const v = VICIOS[type] || VICIOS.desanimo, d = ENEMIES[type] || {};
  const hp = Math.round(v.golpes * 13 * escala);
  const e = { kind: 'vicio', type, d, v, ai: v.ai, x, y, vx: 0, vy: 0, w: v.r * 1.5, h: v.r * 2.1, r: v.r, hp, max: hp, face: Math.random() < 0.5 ? -1 : 1,
    voa: VOADOR.has(v.ai), t: rand(0, 3), cd: rand(0.6, 1.8), flash: 0, stun: 0, tele: 0, estado: 'idle', ox: x, oy: y, vista: 1, revel: 0,
    art: { type, r: v.r, x, y, ph: rand(0, 6), spd: v.vel, flash: 0, stun: 0, telegraph: 0 } };
  return e;
}

function anda(N, e, dir, vel) {
  const frente = e.x + dir * (e.w / 2 + 5);
  if (e.parede === dir || (e.chao && !chaoAbaixo(N, frente, e.y + 4))) { e.face = -dir; e.vx = 0; return false; }
  e.vx = dir * vel; e.face = dir; return true;
}

export function atualizarVicio(G, e, dt) {
  const p = G.p, N = G.N, v = e.irado > 0 ? (e.vIrado || (e.vIrado = { ...e.v, vel: e.v.vel * 1.75 })) : (e.vBase || (e.vBase = { ...e.v, vel: e.v.vel * 1.3 }));
  if (e.irado > 0) e.irado -= dt;
  e.t += dt; e.flash = Math.max(0, e.flash - dt); e.cd -= dt;
  const dx = p.x - e.x, dy = (p.y - 20) - (e.y - e.h / 2), dist = Math.hypot(dx, dy), dir = Math.sign(dx) || 1;
  const ve = !p.morto && dist < (e.irado > 0 ? 700 : 520) && Math.abs(dy) < 230;
  if (e.stun > 0) {
    e.stun -= dt; e.tele = 0;
    if (e.voa) { e.vx *= Math.pow(0.02, dt); e.vy *= Math.pow(0.02, dt); e.x += e.vx * dt; e.y += e.vy * dt; }
    else { e.vy = Math.min(900, e.vy + 2000 * dt); mover(N, e, dt); if (e.chao) e.vx *= Math.pow(0.001, dt); }
    return;
  }
  switch (e.ai) {
    case 'ronda': { // a Preguiça só anda de um lado para o outro… e, se ninguém bate nela, se recupera deitada (Pv 6:9-10)
      e.semHit = (e.semHit || 0) + dt;
      const teto = Math.max(e.teto || 0, Math.ceil(e.hp / e.max * 3 - 0.001) / 3 * e.max); e.teto = e.semHit > 2.2 ? teto : 0; // só refaz o terço em que está: o que já perdeu de vez não volta
      if (e.semHit > 2.2 && e.hp < teto) { e.vx = 0; e.hp = Math.min(teto, e.hp + e.max * 0.2 * dt); if (Math.random() < dt * 3) G.fx.sobe(e.x, e.y - 20, 1, '#A5CDCE'); if (!e.bocejou) { e.bocejou = true; G.textoEm(e.x, e.y - e.h - 6, 'zzz… só mais um pouco', '#A5CDCE', 10); } }
      else { e.bocejou = false; anda(N, e, e.face, v.vel); }
      break;
    }
    case 'bote':
      if (e.estado === 'prep') { e.vx = 0; e.tele -= dt; if (e.tele <= 0) { e.estado = 'bote'; e.vx = e.face * 390; e.vy = -250; e.cd = 1.7; e.chao = false; } }
      else if (e.estado === 'bote') { if (e.chao && e.vy >= 0) { e.estado = 'idle'; e.vx = 0; } }
      else if (ve && Math.abs(dy) < 70) { if (Math.abs(dx) < 105 && e.cd <= 0) { e.estado = 'prep'; e.tele = 0.42; e.face = dir; } else if (Math.abs(dx) > 30) anda(N, e, dir, v.vel); else e.vx = 0; }
      else anda(N, e, e.face, v.vel * 0.5);
      break;
    case 'salto':
      if (e.estado === 'prep') { e.vx = 0; e.tele -= dt; if (e.tele <= 0) { e.estado = 'ar'; e.vy = -590; e.vx = dir * clamp(Math.abs(dx) * 1.35, 130, 340); e.cd = 1.5; e.chao = false; } }
      else if (e.estado === 'ar') { if (e.chao && e.vy >= 0) { e.estado = 'idle'; e.vx = 0; } }
      else if (ve && e.cd <= 0 && Math.abs(dx) < 300 && e.chao) { e.estado = 'prep'; e.tele = 0.36; e.face = dir; }
      else anda(N, e, e.face, v.vel * 0.6);
      break;
    case 'carga':
      if (e.estado === 'prep') { e.vx = 0; e.tele -= dt; if (e.tele <= 0) { e.estado = 'carga'; e.t2 = 1.3; } }
      else if (e.estado === 'carga') {
        e.vx = e.face * 440; e.t2 -= dt;
        if (e.parede === e.face) { e.stun = 1.1; e.estado = 'idle'; e.cd = 1.4; G.tremor(4); G.fx.po(e.x + e.face * 12, e.y - 12, 8, '#C9D2C4'); sfx('block'); }
        else if (e.t2 <= 0 || (e.chao && !chaoAbaixo(N, e.x + e.face * (e.w / 2 + 6), e.y + 4))) { e.estado = 'idle'; e.vx = 0; e.cd = 1.2; }
      }
      else if (ve && Math.abs(dy) < 56 && e.cd <= 0) { e.estado = 'prep'; e.tele = 0.55; e.face = dir; }
      else anda(N, e, e.face, v.vel * 0.6);
      break;
    case 'ladrao':
      if (e.fugindo) { anda(N, e, -dir, v.vel * 1.15) || (e.vy = e.chao ? -520 : e.vy); e.fugindo -= dt; e.vista = Math.min(1, e.fugindo / 1.5); if (e.fugindo <= 0) { e.hp = 0; e.sumiu = true; } }
      else if (ve) { anda(N, e, dir, v.vel) || (e.chao && (e.vy = -540)); }
      else anda(N, e, e.face, v.vel * 0.3);
      break;
    case 'guarda':
      e.aberto = Math.max(0, (e.aberto || 0) - dt);
      if (e.estado === 'prep') { e.vx = 0; e.tele -= dt; if (e.tele <= 0) { e.estado = 'idle'; e.cd = 2; e.aberto = 0.95; e.art.artAttack = (e.art.artAttack || 0) + 1; sfx('swing'); G.zonas.push({ tipo: 'ret', x: e.x + e.face * 46 - 44, y: e.y - 62, w: 88, h: 64, aviso: 0, dur: 0.14, cor: '#C79BFF' }); } }
      else if (ve && Math.abs(dy) < 60) { e.face = dir; if (Math.abs(dx) < 86 && e.cd <= 0) { e.estado = 'prep'; e.tele = 0.62; } else if (Math.abs(dx) > 60) anda(N, e, dir, v.vel); else e.vx = 0; }
      else e.vx = 0;
      break;
    case 'voa': {
      if (e.estado === 'prep') { e.tele -= dt; e.vx *= 0.9; e.vy *= 0.9; if (e.tele <= 0) { e.estado = 'mergulho'; const d = Math.hypot(e.ax - e.x, e.ay - e.y) || 1; e.vx = (e.ax - e.x) / d * 390; e.vy = (e.ay - e.y) / d * 390; e.t2 = 0.55; } }
      else if (e.estado === 'mergulho') { e.t2 -= dt; if (e.t2 <= 0) { e.estado = 'idle'; e.cd = rand(1.6, 2.6); } }
      else {
        const tx = ve ? p.x + Math.sin(e.t * 1.7) * 90 : e.ox + Math.sin(e.t * 0.8) * 60, ty = ve ? p.y - 96 + Math.sin(e.t * 2.6) * 22 : e.oy + Math.sin(e.t * 1.3) * 18;
        e.vx += clamp(tx - e.x, -1, 1) * 340 * dt + Math.cos(e.t * 5) * 60 * dt; e.vy += clamp(ty - e.y, -1, 1) * 340 * dt;
        const s = Math.hypot(e.vx, e.vy); if (s > v.vel) { e.vx *= v.vel / s; e.vy *= v.vel / s; }
        if (ve && e.cd <= 0 && dist < 260) { e.estado = 'prep'; e.tele = 0.38; e.ax = p.x; e.ay = p.y - 18; }
      }
      break;
    }
    case 'atira': {
      const tx = ve ? p.x - dir * 150 : e.ox + Math.sin(e.t * 0.7) * 40, ty = ve ? p.y - 110 + Math.sin(e.t * 2) * 16 : e.oy;
      e.vx += clamp(tx - e.x, -1, 1) * 260 * dt; e.vy += clamp(ty - e.y, -1, 1) * 260 * dt;
      const s = Math.hypot(e.vx, e.vy); if (s > v.vel) { e.vx *= v.vel / s; e.vy *= v.vel / s; }
      // a Dúvida: a pergunta sai inteira e, no meio do caminho, se divide em duas
      if (e.estado === 'prep') { e.tele -= dt; if (e.tele <= 0) { e.estado = 'idle'; e.cd = rand(1.2, 1.9); const a = Math.atan2(dy, dx); e.duv = G.tiros[G.tiros.push({ x: e.x, y: e.y - e.h / 2, vx: Math.cos(a) * 250, vy: Math.sin(a) * 250, r: 7, vida: 3, cor: e.d.cor || '#8B6AD6', tipo: 'bola' }) - 1]; e.duvT = 0.45; sfx('shoot'); } }
      if (e.duv && (e.duvT -= dt) <= 0) { const t = e.duv; e.duv = null; if (t.vida > 0 && G.tiros.includes(t)) { t.vida = 0; const a = Math.atan2(t.vy, t.vx); for (const s of [-1, 1]) G.tiros.push({ x: t.x, y: t.y, vx: Math.cos(a + s * 0.38) * 260, vy: Math.sin(a + s * 0.38) * 260, r: 6, vida: 2.5, cor: e.d.cor || '#8B6AD6', tipo: 'bola' }); G.fx.po(t.x, t.y, 4, '#8B6AD6'); } }
      else if (ve && e.cd <= 0 && dist < 380) { e.estado = 'prep'; e.tele = 0.55; }
      break;
    }
    case 'sombra': {
      // o Medo só tem corpo sob a luz da lâmpada (ou colado em você)
      const naLuz = p.lamp && dist < G.raioLuz() * 1.05;
      if (naLuz) e.revel = 2.6; else e.revel = Math.max(0, e.revel - dt);
      e.vista = clamp(e.vista + ((e.revel > 0 || dist < 60) ? 4 : -3) * dt, 0.1, 1);
      if (e.estado === 'prep') { e.tele -= dt; e.vx = e.vy = 0; if (e.tele <= 0) { e.estado = 'idle'; e.cd = rand(2.6, 3.6); e.x = p.x - p.face * 70; e.y = p.y - 6; G.fx.po(e.x, e.y - 14, 10, '#4B4E6D'); e.vx = p.face * 260; e.revel = Math.max(e.revel, 0.5); } }
      else { e.vx += clamp(p.x - e.x, -1, 1) * 200 * dt * (ve ? 1 : 0); e.vy += clamp(p.y - 26 - e.y, -1, 1) * 200 * dt * (ve ? 1 : 0); const s = Math.hypot(e.vx, e.vy); if (s > v.vel) { e.vx *= 0.9; e.vy *= 0.9; } if (ve && e.cd <= 0 && dist < 330 && dist > 90) { e.estado = 'prep'; e.tele = 0.5; } }
      break;
    }
    case 'pavao': { // a Vaidade abre a cauda e lança penas em arco, que caem em volta de você
      const lado = e.x < p.x ? -1 : 1, tx = ve ? p.x + lado * 210 : e.ox, ty = ve ? p.y - 130 + Math.sin(e.t * 2.2) * 12 : e.oy;
      e.vx += clamp(tx - e.x, -1, 1) * 260 * dt; e.vy += clamp(ty - e.y, -1, 1) * 260 * dt; const s2 = Math.hypot(e.vx, e.vy); if (s2 > v.vel) { e.vx *= v.vel / s2; e.vy *= v.vel / s2; }
      if (e.estado === 'prep') { e.tele -= dt; e.vx *= 0.9; e.vy *= 0.9; if (e.tele <= 0) { e.estado = 'idle'; e.cd = rand(2, 2.8); const tv = 0.95, g = 620; for (let i = 0; i < 5; i++) { const alvo = p.x + (i - 2) * 58, oy2 = e.y - e.h / 2; G.tiros.push({ x: e.x, y: oy2, vx: (alvo - e.x) / tv, vy: (p.y - 8 - oy2 - 0.5 * g * tv * tv) / tv, g, r: 6, vida: 3, cor: '#E8A0D8', tipo: 'bola' }); } sfx('shoot'); e.art.artAttack = (e.art.artAttack || 0) + 1; } }
      else if (ve && e.cd <= 0 && dist < 440) { e.estado = 'prep'; e.tele = 0.6; G.textoEm(e.x, e.y - e.h - 6, 'olhem para mim!', '#E8A0D8', 10); }
      break;
    }
    case 'rapina': { // o Grifo circula alto e desce num rasante em U, passando por você e subindo do outro lado
      if (e.estado === 'rasante') { e.t2 += dt / 0.95; const k = Math.min(1, e.t2), nx = e.r0.x + (e.r1.x - e.r0.x) * k, ny = e.r0.y + (e.r1.fundo - e.r0.y) * Math.sin(Math.PI * k); e.vx = (nx - e.x) / dt; e.vy = (ny - e.y) / dt; if (k >= 1) { e.estado = 'idle'; e.cd = rand(1.8, 2.6); } }
      else {
        const tx = ve ? p.x + Math.cos(e.t * 1.4) * 170 : e.ox + Math.sin(e.t * 0.8) * 60, ty = ve ? p.y - 210 + Math.sin(e.t * 2.8) * 14 : e.oy;
        e.vx += clamp(tx - e.x, -1, 1) * 380 * dt; e.vy += clamp(ty - e.y, -1, 1) * 380 * dt; const s2 = Math.hypot(e.vx, e.vy); if (s2 > v.vel) { e.vx *= v.vel / s2; e.vy *= v.vel / s2; }
        if (e.estado === 'prep') { e.tele -= dt; e.vx *= 0.85; e.vy *= 0.85; if (e.tele <= 0) { e.estado = 'rasante'; e.t2 = 0; const d = Math.sign(p.x - e.x) || 1; e.r0 = { x: e.x, y: e.y }; e.r1 = { x: p.x + d * Math.abs(p.x - e.x), fundo: p.y - 16 }; sfx('dodge'); } }
        else if (ve && e.cd <= 0 && Math.abs(dx) < 260 && dy > 80) { e.estado = 'prep'; e.tele = 0.45; G.textoEm(e.x, e.y - e.h - 4, 'kreee!', '#E9D9A8', 11); }
      }
      break;
    }
    case 'quimera': { // três cabeças, três jeitos: o leão ruge e empurra, a cabra dá cabeçada, a serpente cospe veneno no chão
      const NOMES = ['leão', 'cabra', 'serpente'];
      if (e.estado === 'prep') { e.vx = 0; e.tele -= dt; if (e.tele <= 0) { const c = e.cabeca || 0; e.estado = c === 1 ? 'cabecada' : 'idle'; e.t2 = 0.5; e.cd = 1.7;
          if (c === 0) { G.zonas.push({ tipo: 'circ', x: e.x, y: e.y - 20, r: 95, aviso: 0, dur: 0.18, cor: '#E0A050', efeito: 'empurra' }); sfx('boss'); G.tremor(4); }
          if (c === 2) { G.zonas.push({ tipo: 'poca', x: p.x - 40, y: e.y - 12, w: 80, h: 12, aviso: 0.4, dur: 2.6, cor: '110,170,80' }); sfx('shoot'); }
          e.cabeca = (c + 1) % 3; } }
      else if (e.estado === 'cabecada') { e.vx = e.face * 400; e.t2 -= dt; if (e.t2 <= 0 || e.parede === e.face) { e.estado = 'idle'; e.vx = 0; if (e.parede === e.face) { e.stun = 0.8; G.tremor(4); } } }
      else if (ve && e.cd <= 0 && Math.abs(dx) < 230 && Math.abs(dy) < 80) { e.estado = 'prep'; e.tele = 0.5; e.face = dir; G.textoEm(e.x, e.y - e.h - 6, NOMES[e.cabeca || 0] + '!', '#E0A050', 10); }
      else anda(N, e, ve ? dir : e.face, v.vel * (ve ? 0.7 : 0.4));
      break;
    }
    case 'serpente': { // a antiga serpente anda escondida sob o chão (sem corpo para ferir); emerge para o bote e fica exposta
      if (!e.estado || e.estado === 'idle') e.estado = 'sob';
      if (e.estado === 'sob') { e.vista = Math.max(0.22, e.vista - dt * 3); if (Math.random() < dt * 14) G.fx.po(e.x, e.y - 2, 1, '#6E5A3A'); if (ve) anda(N, e, dir, v.vel); else anda(N, e, e.face, v.vel * 0.4); if (ve && Math.abs(dx) < 70 && e.cd <= 0) { e.estado = 'sobe'; e.tele = 0.38; e.vx = 0; } }
      else if (e.estado === 'sobe') { e.vx = 0; e.tele -= dt; e.vista = 0.5; if (e.tele <= 0) { e.estado = 'bote'; e.vista = 1; e.vy = -430; e.vx = dir * 170; e.chao = false; sfx('dodge'); } }
      else if (e.estado === 'bote') { if (e.chao && e.vy >= 0) { e.estado = 'exposta'; e.t2 = 1.4; e.vx = 0; } }
      else if (e.estado === 'exposta') { e.vx = 0; e.t2 -= dt; if (e.t2 <= 0) { e.estado = 'sob'; e.cd = 1.3; } }
      break;
    }
    case 'olhar': { // o Basilisco olha em linha reta: quem é visto vira pedra; a luz da lâmpada devolve o olhar
      if (e.estado === 'prep') { e.vx = 0; e.tele -= dt; if (e.tele <= 0) { e.estado = 'idle'; e.cd = 2.4; const w = 380; G.zonas.push({ tipo: 'ret', x: e.face > 0 ? e.x : e.x - w, y: e.y - e.h * 0.75, w, h: 34, aviso: 0, dur: 0.3, cor: '#9FE07A', efeito: 'petrifica', dono: e }); sfx('magic'); } }
      else if (ve && Math.abs(dy) < 70 && e.cd <= 0 && Math.abs(dx) < 360) { e.estado = 'prep'; e.tele = 0.85; e.face = dir; G.textoEm(e.x, e.y - e.h - 6, 'não olhe nos olhos!', '#9FE07A', 10); }
      else if (ve) anda(N, e, dir, v.vel); else e.vx = 0;
      break;
    }
    case 'sopro': { // o Dragão sopra fogo num jato que varre o chão, de onde você está para trás de você
      const lado = e.x < p.x ? -1 : 1, tx = ve ? p.x + lado * 190 : e.ox, ty = ve ? p.y - 150 : e.oy;
      if (e.estado !== 'sopro') { e.vx += clamp(tx - e.x, -1, 1) * 240 * dt; e.vy += clamp(ty - e.y, -1, 1) * 240 * dt; const s2 = Math.hypot(e.vx, e.vy); if (s2 > v.vel) { e.vx *= v.vel / s2; e.vy *= v.vel / s2; } }
      if (e.estado === 'prep') { e.tele -= dt; e.vx *= 0.9; e.vy *= 0.9; if (Math.random() < dt * 20) G.fx.po(e.x, e.y - e.h, 1, '#5A4A4A'); if (e.tele <= 0) { e.estado = 'sopro'; e.t2 = 0; e.a0 = Math.atan2(dy, dx) - lado * -0.35; e.prox = 0; } }
      else if (e.estado === 'sopro') { e.vx *= 0.8; e.vy *= 0.8; e.t2 += dt; if (e.t2 >= e.prox) { e.prox = e.t2 + 0.07; const a = e.a0 + lado * -0.7 * e.t2; G.tiros.push({ x: e.x + Math.cos(a) * 14, y: e.y - e.h / 2, vx: Math.cos(a) * 300, vy: Math.sin(a) * 300, g: 160, r: 7, vida: 1.6, cor: '#FF6A2A', tipo: 'fogo' }); if (Math.floor(e.t2 * 14) % 3 === 0) sfx('shoot'); } if (e.t2 > 1) { e.estado = 'idle'; e.cd = rand(2.2, 3); } }
      else if (ve && e.cd <= 0 && dist < 420) { e.estado = 'prep'; e.tele = 0.7; }
      break;
    }
  }
  if (e.voa) {
    e.x += e.vx * dt; e.y += e.vy * dt;
    // não atravessa paredes
    if (solido(N, Math.floor((e.x + Math.sign(e.vx) * e.r) / T), Math.floor((e.y - e.h / 2) / T))) { e.x -= e.vx * dt; e.vx *= -0.6; }
    if (solido(N, Math.floor(e.x / T), Math.floor((e.y - e.h / 2 + Math.sign(e.vy) * e.r) / T))) { e.y -= e.vy * dt; e.vy *= -0.6; if (e.estado === 'mergulho') e.t2 = 0; }
  } else { e.vy = Math.min(900, e.vy + 2000 * dt); mover(N, e, dt); }
}

// pode ser ferido por este golpe? (orgulho: só pelas costas ou logo depois de errar; medo: só visível)
export function vulneravel(e, deX) {
  if (e.ai === 'sombra') return e.vista > 0.55;
  if (e.ai === 'serpente') return e.estado !== 'sob'; // escondida no chão, não há o que ferir
  if (e.ai === 'guarda') return e.aberto > 0 || e.stun > 0 || Math.sign(e.x - deX) === e.face;
  return true;
}

export function desenharVicio(g, e, Tm) {
  const a = e.art, s = e.r / 16;
  a.x = e.x; a.y = e.y - 15 * s; a.flash = e.flash; a.stun = e.stun; a.telegraph = e.tele > 0 ? e.tele : 0; a.r = e.r;
  g.save(); g.globalAlpha *= e.vista ?? 1;
  drawEnemy(g, a, e.d, Tm);
  if (e.ai === 'guarda' && !(e.aberto > 0) && e.stun <= 0) {
    // escudo voltado para a frente
    g.translate(e.x + e.face * e.r * 0.95, e.y - e.h * 0.5); g.strokeStyle = 'rgba(199,155,255,.75)'; g.lineWidth = 3; g.beginPath(); g.arc(0, 0, e.r * 1.05, -1.1 + (e.face < 0 ? Math.PI : 0), 1.1 + (e.face < 0 ? Math.PI : 0)); g.stroke();
  }
  g.restore();
  if (e.hp < e.max && e.hp > 0) { const w = 26; g.fillStyle = 'rgba(8,15,25,.7)'; g.fillRect(e.x - w / 2, e.y - e.h - 12, w, 3.5); g.fillStyle = '#E6DBC0'; g.fillRect(e.x - w / 2, e.y - e.h - 12, w * e.hp / e.max, 3.5); }
}
export const CIRCULO = TAU;
