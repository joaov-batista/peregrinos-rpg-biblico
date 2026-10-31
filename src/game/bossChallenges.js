// Golpes com avisos e punições; todos respeitam esquiva e invulnerabilidade.
export const CHALLENGE_MOVES = {
  sono(G, b, o, dt, c) {
    if (b.step === 0) {
      b.step = 1;
      const x = c.p.x, y = c.p.y, r = o.raio ?? 130;
      G.addText(x, y - 50, 'SONO — SAIA DO CÍRCULO!', '#BDD6FF', 14);
      G.tele.push({ kind: 'circle', x, y, r, t: 1.2, max: 1.2, dano: b.atk * 0.3, sleep: o.duracao ?? 1.3, unblockable: true, src: b, color: '130,170,230', onEnd: () => {
        if (b.hp <= 0) return;
        if (Math.hypot(G.p.x - x, G.p.y - y) < r) G.damagePlayer(b.atk * 0.3, b, { unblockable: true, sleep: o.duracao ?? 1.3 });
        const alive = G.enemies.filter(e => e.summoner === b.nid && e.hp > 0).length;
        for (let i = 0; i < Math.min(o.n ?? 5, 5 - alive); i++) {
          const a = i * Math.PI * 2 / 5;
          const e = G.makeEnemy('distracao', x + Math.cos(a) * 65, y + Math.sin(a) * 65, 0.85);
          if (G.cur.map.collides(e.x, e.y, e.r)) { e.x = b.x; e.y = b.y; }
          e.summoner = b.nid; e.aggro = true; e.stun = 0.7; e.xp = 0; e.ouro = 0; G.enemies.push(e);
        }
      } });
    }
    if (b.stepT > 1.8) G.endAct(b, o.espera ?? 3);
  },
  barreira(G, b, o, dt, c) {
    if (b.step === 0) {
      b.step = 1;
      const x = c.p.x, y = c.p.y;
      G.addText(x, y - 50, 'PRISÃO DE PEDRAS — PROCURE A ABERTURA!', '#D7C5A0', 13);
      G.tele.push({ kind: 'circle', x, y, r: 125, t: 1, max: 1, color: '180,150,110', onEnd: () => {
        if (b.hp <= 0) return;
        for (let i = 1; i < 11; i++) {
          const a = i * Math.PI * 2 / 12;
          G.hazards.push({ x: x + Math.cos(a) * 125, y: y + Math.sin(a) * 125, r: 22, t: 6, tick: 0, dmg: 0, solid: true, color: '125,110,90', src: b });
        }
      } });
    }
    if (b.stepT > 1.1) { G.endAct(b, 0.2); b.nextAct = 'terremoto'; }
  },
  terremoto(G, b, o, dt, c) {
    if (b.step === 0) {
      b.step = 1;
      const x = b.x, y = b.y, r = o.raio ?? 210;
      G.tele.push({ kind: 'circle', x, y, r, t: 1.1, max: 1.1, dano: b.atk * (o.dano ?? 1.5), root: 1.1, unblockable: true, src: b, color: '255,160,70', onEnd: () => {
        if (b.hp <= 0) return;
        G.shake(24); G.burst(x, y, 45, '#B69C75', 300);
        if (Math.hypot(G.p.x - x, G.p.y - y) < r) G.damagePlayer(b.atk * (o.dano ?? 1.5), b, { unblockable: true, root: 1.1 });
      } });
    }
    if (b.stepT > 1.15) { G.endAct(b, 0); b.nextAct = 'investida'; }
  },
  urro(G, b, o, dt, c) {
    if (b.step === 0) { b.step = 1; G.tele.push({ kind: 'circle', x: b.x, y: b.y, r: o.raio, t: 1, max: 1, color: '255,210,130' }); }
    if (b.stepT > 1) {
      G.addText(b.x, b.y - 85, o.fala || 'AU!', '#FFE0AA', 32); G.shake(18);
      if (c.dist < o.raio) G.damagePlayer(b.atk * o.dano, b, { knock: 150 });
      G.endAct(b, o.espera ?? 1.4);
    }
  }
};

export const CHALLENGE_RULES = {
  carapaca(G, b, r, dt) { b.shellOpen = Math.max(0, (b.shellOpen || 0) - dt); },
  mar(G, b, r, dt, c) {
    // Nado permanente, inclusive durante rajadas. A lança exige antecipar o trajeto.
    const threats = G.projs.filter(q => q.owner === 'p' && q.challenge === 'spear' && Math.hypot(q.x - b.x, q.y - b.y) < 230);
    b.evadeCd = Math.max(0, (b.evadeCd || 0) - dt);
    if (threats.length && !b.evadeCd && !b.submerged) {
      b.evadeCd = 3.5; b.evadeT = 0.45;
      b.evadeA = Math.atan2(threats[0].vy, threats[0].vx) + Math.PI / 2;
      G.addText(b.x, b.y - 65, 'MERGULHO LATERAL', '#9FE6F0', 11);
    }
    const a = b.evadeT > 0 ? b.evadeA : Math.atan2(c.ay, c.ax) + (c.dist < 190 ? 1.7 : 0.65);
    b.evadeT = Math.max(0, (b.evadeT || 0) - dt);
    const speed = b.evadeT > 0 ? 320 : b.spd;
    G.moveEnt(b, Math.cos(a) * speed * dt, Math.sin(a) * speed * dt);
  }
};
