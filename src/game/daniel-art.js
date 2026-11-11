// Chefes de Daniel 4: as sombras do coração do rei. Mesmo formato dos demais (g, t, paleta, chefe, movimento).
import { shape, line, oval, gradient, eyes, mask, chain } from './creature-primitives.js';
const TAU = Math.PI * 2;
export const DANIEL_ART = {
  // três sábios sob um só manto de estrelas: nenhum sabe
  encantadores(g, t, C, b, m) {
    shape(g, 'M-34-30 Q0-52 34-30 L42 24 26 36 12 26 0 38-12 26-26 36-42 24Z', gradient(g, '#4A4E8C', '#141833'));
    for (let i = 0; i < 9; i++) { const x = -28 + (i * 37 % 56), y = -22 + (i * 23 % 50); oval(g, x, y, 1.3 + (i % 3) * .5, 1.3 + (i % 3) * .5, i % 2 ? '#E8E2B8' : C.accent, null); }
    line(g, 'M-24-8 L-6 6 10-10 26 8', '#B9C7F5', .9);
    for (const [x, y, s, k] of [[-24, -46, .8, 0], [24, -46, .8, 2], [0, -62, 1.05, 1]]) {
      g.save(); g.translate(x, y + Math.sin(t * 1.6 + k) * 2.5); g.rotate(Math.sin(t * 1.1 + k) * .08 + m.attack * (x ? Math.sign(x) * .12 : 0));
      shape(g, `M-${11 * s}-4 L0-${40 * s} ${11 * s}-4Z`, gradient(g, '#5B5FA8', '#1D2148'));
      oval(g, 0, -40 * s, 2.6, 2.6, '#F1E6A8', '#080F19', .6);
      mask(g, 0, 2, .78 * s, C, k === 1 ? 'long' : 'wide'); g.restore();
    }
    g.save(); g.translate(0, -18); g.rotate(t * .5); oval(g, 0, 0, 13, 13, null, '#B9C7F5', 1); for (let i = 0; i < 6; i++) { const a = i * TAU / 6; oval(g, Math.cos(a) * 13, Math.sin(a) * 13, 1.8, 1.8, '#F1E6A8', null); } g.restore();
  },
  // o feitor: um jugo de ferro nos ombros e os pesos que ele põe nos outros
  jugo(g, t, C, b, m) {
    for (const s of [-1, 1]) { g.save(); g.scale(s, 1); shape(g, 'M8 2 24 2 27 32 6 32Z', gradient(g, '#8A6248', '#3A2C2C')); g.translate(0, Math.sin(m.cycle + s) * m.move * 3);
      shape(g, 'M20-46 40-42 47-10 28-4Z', gradient(g, '#A87A58', '#4E3A36')); chain(g, [[40, -30], [52, -12], [54, 16 + Math.sin(t * 2 + s) * 3]], C); shape(g, 'M44 18 64 18 66 34 42 34Z', '#6A4A38'); line(g, 'M46 26H64', '#C9A27A', 1); g.restore(); }
    shape(g, 'M-28-44 28-44 32-2 0 14-32-2Z', gradient(g, '#9C7052', '#3E2E2E'));
    for (let y = -34; y < 4; y += 9) { line(g, `M-25 ${y}H25`, '#C9A27A', .8); line(g, `M${(y % 18 ? -12 : 6)} ${y}v8`, '#C9A27A', .8); }
    // o jugo
    shape(g, 'M-50-52 Q0-66 50-52 L50-44 Q0-58-50-44Z', gradient(g, '#7C8A96', '#2E3640'));
    for (const x of [-38, 38]) oval(g, x, -48, 5, 7, null, '#C3CCD3', 2);
    shape(g, 'M-15-70-15-50 15-50 15-70 8-78-8-78Z', gradient(g, '#8C9AA6', '#39434E'));
    line(g, 'M-9-63H9', '#080F19', 3); eyes(g, 0, -63, 5.5, 2.2, C);
    if (b.hp < b.max * .5) line(g, 'M-20-52-8-40-18-28', C.accent, 1.6);
  },
  // a cidade que diz "eu": torre em degraus, portão de esmalte azul e uma cabeça de ouro
  babilonia(g, t, C, b, m) {
    const tijolo = gradient(g, '#C9A66A', '#5A4028');
    shape(g, 'M-44 36-44 6 44 6 44 36Z', tijolo); shape(g, 'M-34 6-34-22 34-22 34 6Z', tijolo); shape(g, 'M-24-22-24-46 24-46 24-22Z', tijolo);
    for (const [x0, x1, y] of [[-44, 44, 6], [-34, 34, -22], [-24, 24, -46]]) for (let x = x0; x < x1; x += 11) shape(g, `M${x} ${y} ${x} ${y - 6} ${x + 6} ${y - 6} ${x + 6} ${y}Z`, '#B8935A');
    shape(g, 'M-12 36-12 16 Q0 2 12 16 L12 36Z', gradient(g, '#3F6FB8', '#16264E')); for (let y = 20; y < 36; y += 6) line(g, `M-10 ${y}H10`, '#F1C96A', .8);
    oval(g, 0, 22, 3, 3, '#F1C96A', null);
    for (const s of [-1, 1]) { g.save(); g.translate(s * 46, -8); g.rotate(s * (.3 + Math.sin(t * 1.4) * .08 + m.attack * .3)); shape(g, 'M-4 0 4 0 6 30-6 30Z', '#A8834E'); shape(g, 'M-9 28 9 28 9 40-9 40Z', gradient(g, '#F1C96A', '#8A6A2A')); g.restore(); }
    // cabeça de ouro (Dn 2:38)
    g.save(); g.translate(0, -62 + Math.sin(t * 1.3) * 1.5);
    shape(g, 'M-15-14 Q0-26 15-14 L13 10 0 17-13 10Z', gradient(g, '#FFE9A0', '#9A7426'));
    shape(g, 'M-17-13-17-27-9-20-4-31 0-21 4-31 9-20 17-27 17-13Z', gradient(g, '#FFF1BE', '#C99A3A'));
    line(g, 'M-8-3H-3 M3-3H8', '#3A2A10', 2); line(g, 'M-5 7 Q0 10 5 7', '#3A2A10', 1.4);
    line(g, 'M-12 14 Q-6 26 0 17 Q6 26 12 14', '#C99A3A', 2.4);
    g.restore();
    if (b.hp < b.max * .6) line(g, 'M-30 2-22-8-28-18-16-30 M18-40 26-28 20-14', '#2A1C10', 1.8);
    for (let i = 0; i < 5; i++) { const a = t * .6 + i * 1.26; oval(g, Math.cos(a) * 58, -30 + Math.sin(a) * 34, 1.8, 1.8, '#FFE9A0', null); }
  },
  // o rei no campo: quatro apoios, cabelos como penas de águia, unhas como as das aves
  fera(g, t, C, b, m) {
    const anda = Math.sin(m.cycle) * m.move;
    for (const [x, f] of [[-26, 0], [-12, Math.PI], [14, Math.PI], [28, 0]]) { const k = Math.sin(m.cycle + f) * m.move * 5; shape(g, `M${x - 5} 8 ${x + 5} 8 ${x + 4 + k} 34 ${x - 4 + k} 34Z`, gradient(g, '#7C7A66', '#2F3230'));
      for (let c = -1; c <= 1; c++) line(g, `M${x + k + c * 3} 33 l${c * 2} 6`, '#E8E2CF', 1.5); }
    shape(g, 'M-40-6 Q-30-30 4-28 Q36-26 40-2 L34 16-34 16Z', gradient(g, '#8A8770', '#30352F'));
    // manto real rasgado, ainda preso ao corpo
    shape(g, 'M-34-18 Q-6-34 22-22 L18-6 6-12-4-2-14-12-26-4Z', '#6A2A36'); line(g, 'M-30-14 Q-6-26 20-18', '#D7B25A', 1.2);
    for (let i = 0; i < 9; i++) { const a = -2.5 + i * .34; g.save(); g.translate(26 + Math.cos(a) * 6, -22 + Math.sin(a) * 6); g.rotate(a + Math.sin(t * 2 + i) * .08); shape(g, 'M0 0 Q9-4 24 0 Q9 5 0 0Z', i % 2 ? '#B7C7A0' : '#6E7C64'); line(g, 'M2 0H20', '#E0E6CC', .5); g.restore(); }
    g.save(); g.translate(34, -16 + anda * 1.5); g.rotate(.25 + m.attack * .3);
    shape(g, 'M-10-10 Q4-18 14-8 L16 6 4 12-9 7Z', gradient(g, '#C9B79A', '#5A5245'));
    oval(g, 3, -3, 2.4, 2.8, '#080F19', null); oval(g, 3.6, -3.6, .8, .8, C.accent, null); line(g, 'M8 5 14 4', '#080F19', 1.3);
    for (let i = 0; i < 4; i++) line(g, `M${-2 + i * 3} 10 q1 6-1 11`, '#8A8770', 1.4);
    g.restore();
    // a coroa, caída na erva
    g.save(); g.translate(-44, 30); g.rotate(-.5); shape(g, 'M-8 0-9-9-4-5 0-11 4-5 9-9 8 0Z', gradient(g, '#D7B25A', '#6A5220')); g.restore();
    for (let i = 0; i < 6; i++) oval(g, -30 + i * 12, -22 + ((t * 20 + i * 13) % 22), 1.1, 1.8, '#A9D6E8', null);
  },
  // a Coroa Vazia: um manto sem ninguém dentro, e espelhos que só mostram a si mesma
  soberba(g, t, C, b, m) {
    for (const s of [-1, 1]) { g.save(); g.scale(s, 1); g.rotate(Math.sin(t * 1.3 + s) * .06 + m.attack * .2); shape(g, 'M14-44 Q60-56 70-6 Q52-18 44 12 Q34-10 20 4Z', gradient(g, '#7A2E4A', '#1A0F22')); line(g, 'M20-40 Q50-40 62-12', '#F1C96A', 1); g.restore(); }
    shape(g, 'M-22-50 Q0-62 22-50 L30 20 18 36 8 24 0 38-8 24-18 36-30 20Z', gradient(g, '#8A3050', '#160C1E'));
    line(g, 'M-20-44 Q0-34 20-44 M-24-10 Q0 2 24-10', '#F1C96A', 1.4);
    oval(g, 0, -58, 14, 16, '#05040A', '#F1C96A', 1.6);
    oval(g, 0, -58, 5 + Math.sin(t * 2) * 1.5, 7 + Math.sin(t * 2) * 1.5, null, 'rgba(241,201,106,.5)', 1);
    g.save(); g.translate(0, -84 + Math.sin(t * 1.5) * 3); g.rotate(Math.sin(t * .9) * .08);
    shape(g, 'M-18 6-20-12-11-4-6-18 0-6 6-18 11-4 20-12 18 6Z', gradient(g, '#FFF1BE', '#B8862A'));
    for (const x of [-11, 0, 11]) oval(g, x, 1, 2.2, 2.2, x ? '#C74A6A' : '#7FD0E8', '#080F19', .5);
    g.restore();
    for (let i = 0; i < 5; i++) { const a = t * .8 + i * TAU / 5; g.save(); g.translate(Math.cos(a) * 54, -22 + Math.sin(a) * 30); g.rotate(a * 1.5); shape(g, 'M0-9 6 0 0 9-6 0Z', gradient(g, '#E8F0F2', '#6E8A96')); g.restore(); }
    if (b.hp < b.max * .5) line(g, 'M-4-70 2-60-3-50 4-44', '#F1C96A', 1.4);
  }
};
