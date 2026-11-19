// As passagens do mundo desenhadas como parte dele (nada de arco de pedra com luz no meio):
// a porteira na sebe, a paliçada da arena, o círculo de pedras do desafio, a ruína do Conselho escondida na mata,
// a passagem nos arbustos, a porta de pedra entalhada, o atril com o rolo da página, a laje do túmulo dos gigantes,
// a escada para os telhados, a fenda da raiz e a porta de madeira das saídas. Coordenadas em pixel de jogo (x no meio, y no chão).

const TI = '#17121f';
// que construção cada passagem é
export function visualPortal(o) {
  if (o.tipo === 'saida' || o.tipo === 'retorno') return 'porta';
  if (o.slot != null || o.semana) return 'atril';
  if (o.mundo === 'ladrao') return 'escada';
  if (o.mundo) return 'tumulo';
  return { clareira: 'porteira', refugio: 'trilha', treino: 'arena', desafio: 'circulo', conselho: 'ruina', floresta: 'arbustos', getsemani: 'arbustos', vale: 'portaPedra', raiz: 'fenda' }[o.area] || 'portaPedra';
}

export function pintarConstrucao(g, vis, o, x, y, Tm, cor) {
  const R = (a, b, w, h, c) => { g.fillStyle = c; g.fillRect(Math.round(x + a), Math.round(y + b), Math.round(w), Math.round(h)); };
  const bola = (cx, cy, r, c) => { for (let k = -r; k <= r; k++) { const lg = Math.round(Math.sqrt(r * r - k * k)); R(cx - lg, cy + k, lg * 2, 1, c); } };
  const arbusto = (a, b, w, h, c1 = '#2E5A3A', c2 = '#4A8A4A', c3 = '#7AC06A') => { // moitas redondas, umas por cima das outras, com luz no alto
    const n = Math.max(2, Math.round(w / 12)), bl = []; for (let i = 0; i < n; i++) { const r = Math.round(h * (0.32 + 0.12 * ((i * 7) % 3))), cx = a + (i + 0.5) * w / n, cy = b - r + 2 - ((i % 2) ? h * 0.25 : 0); bl.push([cx, cy, r]); }
    for (const [cx, cy, r] of bl) bola(cx, cy, r + 1, TI); for (const [cx, cy, r] of bl) bola(cx, cy, r, c1); for (const [cx, cy, r] of bl) bola(cx - r * 0.2, cy - r * 0.25, Math.round(r * 0.65), c2); for (const [cx, cy, r] of bl) { R(cx - r * 0.45, cy - r * 0.6, 2, 2, c3); R(cx + r * 0.1, cy - r * 0.75, 2, 1, c3); }
    R(a, b - 3, w, 3, c1); };
  const f = Math.floor(Tm * 6);
  switch (vis) {
    case 'porteira': { // uma porteira de madeira aberta numa sebe, com a placa da trilha
      arbusto(-46, 0, 30, 30); arbusto(18, 0, 30, 28);
      for (const px of [-15, 13]) { R(px - 1, -38, 5, 38, TI); R(px, -37, 3, 37, '#7A5A36'); R(px, -37, 1, 37, '#9A7A4E'); }
      R(-16, -39, 33, 4, TI); R(-15, -38, 31, 2, '#8A6A44');
      for (const [a, b] of [[-12, -30], [-12, -18]]) { R(a, b, 10, 2, '#8A6A44'); } R(-12, -30, 2, 14, '#8A6A44'); R(-4, -30, 2, 14, '#8A6A44'); // a folha aberta para dentro
      R(20, -26, 2, 26, '#6B4A2E'); R(14, -32, 16, 8, TI); R(15, -31, 14, 6, '#C9A06A'); R(17, -29, 8, 1, '#6B4A2E'); R(17, -27, 6, 1, '#6B4A2E');
      R(-10, -3, 20, 3, '#8A7A5A'); return; }
    case 'trilha': { // a trilha volta: dois arbustos e a placa com a seta
      arbusto(-40, 0, 24, 24); arbusto(16, 0, 26, 26); R(-1, -30, 3, 30, '#6B4A2E'); R(-12, -34, 20, 8, TI); R(-11, -33, 18, 6, '#C9A06A'); R(-9, -31, 9, 1, '#6B4A2E'); R(-11, -31, 3, 3, '#6B4A2E'); return; }
    case 'arena': { // a arena de treino: paliçada de troncos com ponta, estandartes e a entrada de areia
      for (let i = -60; i <= 60; i += 7) { if (Math.abs(i) < 14) continue; const h = 46 + ((i * 7) % 5); R(i - 1, -h - 1, 8, h + 1, TI); R(i, -h, 6, h, '#8A5A36'); R(i, -h, 2, h, '#B07A4A'); R(i + 1, -h - 3, 4, 3, '#8A5A36'); R(i + 2, -h - 5, 2, 2, '#8A5A36'); }
      R(-62, -26, 124, 3, '#5A3A22'); R(-15, -54, 3, 54, '#6B4A2E'); R(13, -54, 3, 54, '#6B4A2E'); R(-16, -56, 33, 4, '#5A3A22');
      for (const [px, c1] of [[-30, '#B8322A'], [30, '#C9A63C']]) { R(px, -70, 2, 70, '#4A3424'); const ond = f % 2; R(px + 2, -68, 10, 12 - ond, c1); R(px + 2, -57 - ond, 5, 3, c1); }
      R(-12, -2, 24, 2, '#D8C08A'); R(-10, -4, 20, 2, '#E8D0A0'); return; }
    case 'circulo': { // o círculo de pedras do desafio das ondas, com o poço de água que gira
      for (const [px, h] of [[-44, 30], [-28, 40], [28, 40], [44, 30], [0, 22]]) { if (!px && false) continue; R(px - 6, -h - 1, 13, h + 1, TI); R(px - 5, -h, 11, h, '#8A8A9A'); R(px - 5, -h, 3, h, '#B0B0C0'); R(px + 3, -h, 3, h, '#6A6A7A'); R(px - 5, -h + 6, 11, 1, '#5A5A6A'); }
      R(-20, -5, 40, 5, TI); R(-19, -4, 38, 4, '#2E6B80'); for (let i = 0; i < 6; i++) { const a = Tm * 2 + i; R(Math.cos(a) * 14 - 1, -3 + Math.sin(a) * 1.4, 3, 1, '#8FD4E4'); }
      R(-2, -36, 4, 4, '#8FD4E4'); return; }
    case 'ruina': { // o Conselho Zelote: uma fortaleza em ruína escondida na mata, porta de ferro, trepadeiras e o estandarte rasgado
      arbusto(-80, 0, 30, 54, '#1E3A28', '#2E5A3A', '#4A8A4A'); arbusto(52, 0, 34, 50, '#1E3A28', '#2E5A3A', '#4A8A4A');
      R(-52, -66, 104, 66, TI); R(-50, -64, 100, 64, '#5A5A66'); for (let r = -60; r < 0; r += 7) for (let c = -50 + ((r / 7) % 2 ? 6 : 0); c < 50; c += 12) R(c, r, 11, 1, '#45454F');
      R(-50, -70, 20, 6, '#5A5A66'); R(-22, -74, 14, 10, '#5A5A66'); R(30, -68, 20, 4, '#5A5A66'); R(8, -72, 8, 8, '#5A5A66'); // ameias quebradas
      R(-16, -46, 32, 46, TI); for (let a = 0; a <= 16; a++) { const lg = Math.round(Math.sqrt(256 - (16 - a) ** 2)); R(-lg, -62 + a, lg * 2, 1, TI); }
      R(-14, -44, 28, 44, '#3A3E4A'); for (let a = 0; a <= 14; a++) { const lg = Math.round(Math.sqrt(196 - (14 - a) ** 2)); R(-lg, -58 + a, lg * 2, 1, '#3A3E4A'); }
      for (let r = -40; r < 0; r += 8) R(-14, r, 28, 1, '#2A2E38'); for (const [a, b] of [[-10, -36], [8, -36], [-10, -16], [8, -16]]) R(a, b, 2, 2, '#8A8A9A'); R(-1, -58, 2, 58, '#2A2E38'); R(4, -24, 4, 4, '#C9A63C');
      g.fillStyle = '#3F7A3A'; for (let i = 0; i < 26; i++) g.fillRect(Math.round(x - 50 + (i * 37) % 100), Math.round(y - 64 + ((i * 23) % 50)), 2, 3 + (i % 3)); // trepadeiras
      R(30, -60, 2, 40, '#4A3424'); R(32, -58, 12, 16, '#8E2B2B'); R(36, -42, 3, 4, '#8E2B2B'); R(41, -44, 3, 6, '#8E2B2B'); // o estandarte rasgado
      return; }
    case 'arbustos': { // a trilha escondida: duas oliveiras velhas que se curvam e se encontram num arco; por baixo, a trilha de terra some no escuro da mata
      const ln = (x0, y0, x1, y1, w, c) => { const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0)); for (let i = 0; i <= n; i++) R(x0 + (x1 - x0) * i / n - w / 2, y0 + (y1 - y0) * i / n - w / 2, w, w, c); };
      // o escuro de dentro, em arco, mais fundo no meio
      for (let yy = 0; yy < 36; yy++) { const lg = Math.round(13 * Math.sqrt(Math.min(1, (36 - yy) / 10))); R(-lg, -yy, lg * 2, 1, yy > 26 ? '#0E1A12' : '#0B140E'); }
      R(-6, -24, 12, 22, '#060B08'); for (let i = 0; i < 6; i++) R(-9 + ((i * 7) % 18), -30 + (i % 3) * 6, 2, 2, '#1E3A28'); // folhas lá dentro
      // a trilha de terra, estreitando para dentro, com pedrinhas
      for (let yy = 0; yy < 10; yy++) { const lg = 12 - yy; R(-lg, -yy - 1, lg * 2, 1, yy < 3 ? '#8A6A44' : yy < 7 ? '#6B4E32' : '#3A2A1E'); }
      for (const [a, b] of [[-8, -2], [5, -3], [-2, -6], [3, -8]]) R(a, b, 2, 1, '#A89070');
      // os troncos retorcidos que se curvam até se tocar no alto
      for (const sd of [-1, 1]) { const pts = [[sd * 20, 0], [sd * 18, -14], [sd * 21, -26], [sd * 15, -38], [sd * 6, -46], [0, -48]];
        for (let k = 0; k < pts.length - 1; k++) ln(pts[k][0], pts[k][1], pts[k + 1][0], pts[k + 1][1], 8 - k, TI);
        for (let k = 0; k < pts.length - 1; k++) ln(pts[k][0], pts[k][1], pts[k + 1][0], pts[k + 1][1], 6 - k, '#5A4030');
        for (let k = 0; k < pts.length - 2; k++) ln(pts[k][0] + sd * -1, pts[k][1], pts[k + 1][0] + sd * -1, pts[k + 1][1], 1, '#7A5A40');
        R(sd * 20 - 5, -2, 10, 2, TI); R(sd * 20 - 4, -2, 8, 1, '#4A3524'); } // as raízes
      // a copa das oliveiras: miúda, prateada, com frutos escuros
      for (const [cx, cy, r] of [[-26, -50, 11], [-12, -58, 13], [6, -60, 13], [22, -52, 11], [-30, -38, 8], [30, -40, 8], [0, -50, 9]]) bola(cx, cy, r + 1, TI);
      for (const [cx, cy, r] of [[-26, -50, 11], [-12, -58, 13], [6, -60, 13], [22, -52, 11], [-30, -38, 8], [30, -40, 8], [0, -50, 9]]) { bola(cx, cy, r, '#4E6A3E'); bola(cx - 2, cy - 3, Math.round(r * 0.62), '#6E8A52'); R(cx - r * 0.5, cy - r * 0.55, Math.round(r * 0.5), 1, '#A8BC88'); }
      for (const [a, b] of [[-20, -54], [-6, -62], [10, -56], [24, -48], [-28, -42]]) R(a, b, 2, 2, '#2A2438'); // azeitonas
      // a hera que pende do arco e as moitas baixas dos lados
      for (const [a, n] of [[-11, 9], [-4, 5], [5, 7], [11, 10]]) for (let k = 0; k < n; k++) R(a + ((k % 3) - 1), -44 + k * 2, 2, 2, k % 2 ? '#3E6A3A' : '#5E8A4A');
      arbusto(-38, 0, 18, 14, '#1E3A28', '#2E5A3A', '#4A8A4A'); arbusto(20, 0, 18, 13, '#1E3A28', '#2E5A3A', '#4A8A4A');
      // vaga-lumes na entrada: é por aqui
      for (let i = 0; i < 4; i++) { const ph = Tm * 1.3 + i * 1.7, a = Math.sin(ph * 2.1) > 0.2; if (a) R(Math.round(Math.sin(ph) * 10) + (i - 1.5) * 4, -14 - Math.round(Math.cos(ph * 0.8) * 8) - i * 3, 1, 1, '#D8F08A'); }
      return; }
    case 'portaPedra': { // porta de pedra entalhada, com a luz vazando pelas frestas
      R(-26, -64, 52, 64, TI); R(-24, -62, 48, 62, '#6A6878'); R(-24, -62, 48, 4, '#8A8898'); R(-16, -52, 32, 52, '#4A4858'); R(-1, -52, 2, 52, '#2A2838');
      g.fillStyle = cor; for (const [a, b] of [[-12, -44], [6, -44], [-12, -24], [6, -24]]) g.fillRect(x + a, y + b, 6, 1); g.globalAlpha = 0.5 + 0.3 * Math.sin(Tm * 3); g.fillRect(x - 1, y - 52, 2, 52); g.globalAlpha = 1; return; }
    case 'atril': { // o atril com o rolo aberto da página; a cor é a da semana
      R(-3, -26, 6, 26, TI); R(-2, -26, 4, 26, '#6B4A2E'); R(-8, -2, 16, 2, '#5A3A22'); R(-13, -33, 26, 9, TI); R(-12, -32, 24, 7, '#7A5A36');
      R(-14, -38, 28, 7, TI); R(-13, -37, 26, 5, '#E8D9B0'); R(-15, -38, 3, 7, '#C9A06A'); R(12, -38, 3, 7, '#C9A06A'); R(-9, -36, 7, 1, '#8A7A5A'); R(2, -36, 7, 1, '#8A7A5A'); R(-9, -34, 6, 1, '#8A7A5A'); R(2, -34, 5, 1, '#8A7A5A');
      g.globalAlpha = 0.25 + 0.15 * Math.sin(Tm * 2.4); g.fillStyle = cor; g.fillRect(x - 16, y - 48, 32, 12); g.globalAlpha = 1; R(-1, -44 - (f % 2), 2, 2, cor); return; }
    case 'tumulo': { // a laje do túmulo do gigante, com o relevo de cada um
      R(-32, -76, 64, 76, TI); R(-30, -74, 60, 74, '#7A7468'); R(-30, -74, 60, 5, '#9A9488'); R(-24, -66, 48, 60, '#5A564E'); R(-24, -66, 48, 2, '#6A665E');
      g.fillStyle = cor; const sm = o.mundo;
      if (sm === 'golias') { for (let k = 0; k < 5; k++) g.fillRect(x - 12 + k * 6, y - 40, 4, 4); g.fillRect(x - 2, y - 54, 4, 10); }
      else if (sm === 'behemote') { g.fillRect(x - 12, y - 46, 24, 12); g.fillRect(x - 14, y - 50, 4, 6); g.fillRect(x + 10, y - 50, 4, 6); g.fillRect(x - 10, y - 34, 4, 6); g.fillRect(x + 6, y - 34, 4, 6); }
      else { for (let i = 0; i < 24; i++) g.fillRect(x - 12 + i, y - 42 + Math.round(Math.sin(i * 0.5) * 4), 1, 2); for (let i = 0; i < 18; i++) g.fillRect(x - 9 + i, y - 32 + Math.round(Math.sin(i * 0.5 + 1) * 3), 1, 2); }
      R(-24, -8, 48, 2, '#3A3832'); for (const [a, b, w2] of [[-20, -60, 6], [14, -18, 8]]) R(a, b, w2, 1, '#3A3832'); return; }
    case 'escada': { // a escada encostada que sobe aos telhados (só a lâmpada mostra, só de madrugada)
      for (const px of [-8, 6]) { R(px - 1, -96, 4, 96, TI); R(px, -95, 2, 95, '#7A5A36'); } for (let r = -90; r < 0; r += 10) R(-8, r, 16, 2, '#8A6A44'); return; }
    case 'fenda': { // a fenda na parede, com as raízes que brilham
      R(-6, -60, 12, 60, TI); R(-3, -58, 6, 58, '#0B0A10'); g.fillStyle = cor; for (let i = 0; i < 8; i++) g.fillRect(x - 10 + (i * 7) % 20, y - 52 + i * 6 + (f % 2), 3, 1); return; }
    default: { // 'porta': a porta de madeira num arco de pedra (as saídas das páginas)
      R(-22, -58, 44, 58, TI); for (let a = 0; a <= 22; a++) { const lg = Math.round(Math.sqrt(484 - (22 - a) ** 2)); R(-lg, -80 + a, lg * 2, 1, TI); }
      R(-20, -58, 40, 58, '#8A8898'); for (let a = 0; a <= 20; a++) { const lg = Math.round(Math.sqrt(400 - (20 - a) ** 2)); R(-lg, -78 + a, lg * 2, 1, '#8A8898'); }
      R(-14, -56, 28, 56, '#6B4A2E'); for (let a = 0; a <= 14; a++) { const lg = Math.round(Math.sqrt(196 - (14 - a) ** 2)); R(-lg, -70 + a, lg * 2, 1, '#6B4A2E'); }
      for (let r = -50; r < 0; r += 8) R(-14, r, 28, 1, '#5A3A22'); R(-1, -70, 2, 70, '#4A2E1A'); R(6, -30, 3, 3, '#C9A63C');
      g.globalAlpha = 0.35 + 0.2 * Math.sin(Tm * 3); g.fillStyle = cor; g.fillRect(x - 15, y - 2, 30, 2); g.fillRect(x - 1, y - 68, 2, 66); g.globalAlpha = 1; }
  }
}
