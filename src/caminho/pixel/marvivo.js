// O mar vivo (o de perto, o da pesca e o da praia): peixes que saltam, um golfinho de vez em quando, gaivotas boiando,
// águas-vivas que brilham de noite; na praia, as ondas que sobem na areia molhada, caranguejos que correm para a toca
// e gaivotas que pousam e voam quando você chega. Tudo em pixel de jogo (X, Y convertem do mundo).
const h = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const TINTA = '#17121f';

export function pintarMarVivo(g, G, X, Y, Tm) {
  for (const A of G.objs) {
    if (A.tipo !== 'aguaAberta') continue;
    const x0 = A.x - 16, w = (A.ate - A.col + 1) * 32, x1 = x0 + w, sup = Y(A.y) - 3, praia = !!A.praia, noite = !!G.cm && (() => { const hh = ((G.cm.relogio || 0) / 600 * 24 + 7) % 24; return hh >= 19.5 || hh < 5; })();
    const sx0 = X(x0), sx1 = X(x1); if (sx1 < -20 || sx0 > g.canvas.width + 20) continue;
    // peixes que saltam: um arco curto e dois respingos
    for (let i = 0; i < (praia ? 2 : 5); i++) { const P = 6 + i * 2.7, c = Math.floor((Tm + i * 1.9) / P), k = ((Tm + i * 1.9) % P); if (k > 0.9) continue;
      const fx = X(x0 + 60 + h(c * 7 + i) * (w - 120)), u = k / 0.9, dir = h(c + i * 3) > 0.5 ? 1 : -1, px = fx + Math.round(dir * u * 16), py = sup - Math.round(Math.sin(u * Math.PI) * (10 + h(c) * 8));
      g.fillStyle = TINTA; g.fillRect(px - 3, py - 1, 7, 3); g.fillStyle = h(c * 3 + i) > 0.7 ? '#E8B860' : '#A9C4D0'; g.fillRect(px - 2, py, 5, 1); g.fillStyle = '#E8F0F4'; g.fillRect(px - 2, py - 1, 3, 1); g.fillStyle = TINTA; g.fillRect(px + (dir > 0 ? -4 : 4), py - 1 + (Math.floor(Tm * 16) % 2), 1, 2);
      if (u < 0.15 || u > 0.85) { g.fillStyle = '#DFF6FA'; const ex = u < 0.15 ? fx : fx + dir * 16; g.fillRect(ex - 3, sup - 2, 1, 1); g.fillRect(ex + 2, sup - 3, 1, 1); g.fillRect(ex - 1, sup - 4, 2, 1); } }
    // o golfinho, uma vez ou outra, no mar aberto
    if (!praia) { const P = 23, c = Math.floor(Tm / P), k = Tm % P; if (k < 2.4) { const u = k / 2.4, bx = X(x0 + 200 + h(c * 11) * (w - 400)) + Math.round(u * 70), by = sup - Math.round(Math.sin(u * Math.PI) * 22);
      g.save(); g.beginPath(); g.rect(0, 0, g.canvas.width, sup); g.clip(); const a = Math.cos(u * Math.PI) * 0.9;
      for (let i = -9; i <= 9; i++) { const yy = by + Math.round(i * a * 0.5 + (i * i) / 30); g.fillStyle = TINTA; g.fillRect(bx + i, yy - 3, 1, 6); g.fillStyle = i > 4 ? '#8AA8B8' : '#4A6A80'; g.fillRect(bx + i, yy - 2, 1, 3); g.fillStyle = '#C9D8E0'; g.fillRect(bx + i, yy + 1, 1, 1); }
      g.fillStyle = '#4A6A80'; g.fillRect(bx - 1, by - 6 + Math.round(-a), 3, 3); g.restore(); } }
    // gaivotas boiando, subindo e descendo com a onda
    for (let i = 0; i < (praia ? 1 : 3); i++) { const gx = X(x0 + 80 + h(i * 13 + 5) * (w - 160)) + Math.round(Math.sin(Tm * 0.2 + i) * 10), gy = sup - 2 + Math.round(Math.sin(Tm * 1.6 + i * 2) * 1);
      g.fillStyle = TINTA; g.fillRect(gx - 4, gy - 3, 8, 4); g.fillRect(gx + 2, gy - 6, 3, 3); g.fillStyle = '#F2EEE6'; g.fillRect(gx - 3, gy - 2, 6, 2); g.fillRect(gx + 3, gy - 5, 1, 2); g.fillStyle = '#8A8A96'; g.fillRect(gx - 3, gy - 2, 3, 1); g.fillStyle = '#E8A040'; g.fillRect(gx + 5, gy - 4, 2, 1); }
    // de noite, águas-vivas que brilham embaixo d'água
    if (noite) for (let i = 0; i < (praia ? 2 : 6); i++) { const jx = X(x0 + h(i * 17 + 2) * w) + Math.round(Math.sin(Tm * 0.3 + i) * 14), jy = sup + 6 + Math.round(h(i * 5) * 12 + Math.sin(Tm * 0.9 + i) * 2), c = i % 2 ? '#FF9AD8' : '#9AF0FF', pul = 0.4 + 0.3 * Math.sin(Tm * 2 + i);
      g.globalAlpha = pul * 0.4; g.fillStyle = c; g.fillRect(jx - 4, jy - 3, 9, 6); g.globalAlpha = pul; g.fillRect(jx - 2, jy - 2, 5, 2); for (let t = 0; t < 3; t++) g.fillRect(jx - 2 + t * 2, jy + 1 + (Math.floor(Tm * 3 + t) % 2), 1, 3); g.globalAlpha = 1; }
    if (praia) pintarVidaDaPraia(g, G, X, Y, Tm, A, x1, sup);
  }
}

/* ---------------- a praia: ondas na areia, caranguejos, gaivotas ---------------- */
function pintarVidaDaPraia(g, G, X, Y, Tm, A, beira, sup) {
  const p = G.p, V = G.praiaVida = G.praiaVida || { caranguejos: [{ x: beira + 160, d: 1, t: 0, toca: 0 }, { x: beira + 420, d: -1, t: 1.3, toca: 0 }], gaivotas: [{ x: beira + 260, voa: 0 }, { x: beira + 610, voa: 0 }] }, dt = 1 / 60, chao = Y(A.y);
  // a onda que sobe e desce na areia molhada, deixando espuma
  const sobe = Math.sin(Tm * 0.7) * 0.5 + 0.5, bx = X(beira);
  g.fillStyle = '#9A8A5A'; g.globalAlpha = 0.35; g.fillRect(bx, chao - 2, 70, 3); g.globalAlpha = 1;
  const ate = Math.round(sobe * 46); for (let i = 0; i < ate; i++) { const yy = chao - 2 + (i % 5 === 0 ? 1 : 0); g.fillStyle = i > ate - 4 ? '#F4FAFC' : (i % 3 ? '#6AB8C8' : '#9AD8E0'); g.globalAlpha = i > ate - 4 ? 0.95 : 0.6; g.fillRect(bx + i, yy, 1, 2); }
  g.globalAlpha = 0.8; g.fillStyle = '#F4FAFC'; for (let i = 0; i < 6; i++) g.fillRect(bx + ate - 2 - i * 3 + (i % 2), chao - 3 - (i % 2), 2, 1); g.globalAlpha = 1;
  // caranguejos: andam de lado; se você chega perto, correm para a toca e só voltam depois
  for (const c of V.caranguejos) { const perto = Math.abs(p.x - c.x) < 110 && Math.abs(p.y - A.y) < 60;
    if (perto && c.toca <= 0) c.toca = 4; if (c.toca > 0) c.toca -= dt;
    if (c.toca <= 0) { c.t += dt; if (c.t > 2) { c.t = 0; c.d = Math.random() < 0.5 ? -1 : 1; } c.x = Math.max(beira + 60, Math.min(beira + 760, c.x + c.d * 26 * dt)); }
    const x = X(c.x), y = chao - 1, k = Math.floor(Tm * 10) % 2;
    g.fillStyle = '#5A3A2A'; g.fillRect(x - 3, y, 7, 2); if (c.toca > 0) { g.fillStyle = TINTA; g.fillRect(x - 2, y, 5, 1); continue; } // a toca
    g.fillStyle = TINTA; g.fillRect(x - 4, y - 4, 9, 4); g.fillStyle = '#E2563C'; g.fillRect(x - 3, y - 3, 7, 2); g.fillStyle = '#FF8A6A'; g.fillRect(x - 2, y - 3, 3, 1);
    g.fillStyle = '#E2563C'; g.fillRect(x - 5, y - 5 - k, 2, 2); g.fillRect(x + 4, y - 5 - (1 - k), 2, 2); g.fillStyle = TINTA; g.fillRect(x - 1, y - 5, 1, 1); g.fillRect(x + 1, y - 5, 1, 1);
    g.fillStyle = '#B83A2A'; for (const lx of [-3, -1, 2, 4]) g.fillRect(x + lx, y - 1 + ((lx + k) % 2 ? 0 : 1), 1, 1); }
  // gaivotas na areia: bicam, dão pulinhos; com você perto, levantam voo e voltam depois
  for (const q of V.gaivotas) { const perto = Math.abs(p.x - q.x) < 130; if (perto && q.voa <= 0) q.voa = 5; if (q.voa > 0) q.voa -= dt;
    const x = X(q.x), voo = q.voa > 0 ? Math.min(1, (5 - q.voa) / 1.2) * Math.min(1, q.voa / 1.2) : 0, y = chao - 1 - Math.round(voo * 60), bate = Math.floor(Tm * 9) % 2, bica = !voo && Math.floor(Tm * 1.3 + q.x) % 4 === 0;
    if (!voo) { g.fillStyle = TINTA; g.fillRect(x - 4, y - 7, 9, 5); g.fillRect(x + 2, y - 10 + (bica ? 3 : 0), 4, 4); g.fillStyle = '#F2EEE6'; g.fillRect(x - 3, y - 6, 7, 3); g.fillRect(x + 3, y - 9 + (bica ? 3 : 0), 2, 2); g.fillStyle = '#8A8A96'; g.fillRect(x - 3, y - 6, 4, 1); g.fillStyle = '#E8A040'; g.fillRect(x + 5, y - 8 + (bica ? 3 : 0), 2, 1); g.fillRect(x - 1, y - 2, 1, 2); g.fillRect(x + 1, y - 2, 1, 2); }
    else { const xx = x + Math.round(voo * 30); g.fillStyle = '#F2EEE6'; g.fillRect(xx - 2, y - 2, 5, 2); g.fillStyle = TINTA; g.fillRect(xx - 6, y - 2 - (bate ? 2 : 0), 4, 1); g.fillRect(xx + 3, y - 2 - (bate ? 2 : 0), 4, 1); g.fillStyle = '#E8A040'; g.fillRect(xx + 3, y - 1, 1, 1); } }
}
