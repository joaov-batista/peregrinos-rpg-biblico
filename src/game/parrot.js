import { horseSeat } from './horseRide.js';
export const PARROT_ATTACK = { mult: 0.38, cd: 1.8, som: 'Bicada!' };
export function shoulder(p, passenger = false) {
  const seat = passenger ? horseSeat(p.fx, p.fy) : { x: 0, y: 0 };
  return { x: p.x + (p.fx < -0.2 ? 10 : -10) + seat.x, y: p.y - 34 + seat.y };
}
export function updateParrot(G, a, dt) {
  const p = G.p, home = shoulder(p, !!G.rideDriver);
  const perch = () => { Object.assign(a, home, { state: 'perched', moving: false, target: null, fx: p.fx < 0 ? -1 : 1, flightT: 0 }); };
  if (a.map !== G.cur || !a.state || Math.hypot(a.x - p.x, a.y - p.y) > 650) { a.map = G.cur; perch(); }
  a.cd = Math.max(0, a.cd - dt);
  const valid = e => e && G.enemies.includes(e) && e.hp > 0 && !e.clone && !e.inv && !e.submerged && e.id !== 'leviata' &&
    (e.kind !== 'boss' || e.engaged) && Math.hypot(e.x - p.x, e.y - p.y) < 230 && G.cur.map.clearLine(p.x, p.y, e.x, e.y);
  if (G.rideDriver) { perch(); return; }
  if (a.state === 'perched') {
    perch();
    if (a.cd > 0) return;
    const enemies = G.enemies.filter(valid).sort((x, y) => Math.hypot(x.x - p.x, x.y - p.y) - Math.hypot(y.x - p.x, y.y - p.y));
    if (!enemies.length) return;
    a.target = enemies[0]; a.state = 'attacking'; a.flightT = 0;
  }
  a.flightT += dt;
  if (a.state === 'attacking' && (!valid(a.target) || a.flightT > 1.5)) { a.state = 'returning'; a.target = null; a.cd = PARROT_ATTACK.cd; }
  const e = a.target, goal = a.state === 'attacking' ? { x: e.x, y: e.y - Math.min(e.r * .5, 22) } : home;
  const dx = goal.x - a.x, dy = goal.y - a.y, distance = Math.hypot(dx, dy);
  const step = Math.min(distance, Math.max(340, G.st.spd * 1.8) * dt);
  if (distance > 0) { a.x += dx / distance * step; a.y += dy / distance * step; }
  if (Math.abs(dx) > 1) a.fx = Math.sign(dx);
  a.moving = true; a.walk += dt;
  if (distance <= step + 3) {
    if (a.state === 'attacking') {
      G.petHit(a, e, PARROT_ATTACK); a.state = 'returning'; a.target = null; a.cd = PARROT_ATTACK.cd;
    } else perch();
  }
}

export function drawParrot(g, x, y, st = {}) {
  const flying = !!st.moving, t = st.t || 0;
  g.save(); g.translate(x, y + (flying ? Math.sin(t * 12) * 1.5 : Math.sin(t * 3) * .4)); g.scale(st.fx < 0 ? -1 : 1, 1);
  g.lineJoin = 'round'; g.lineWidth = 1.2; g.strokeStyle = '#102E27';
  // Cauda azul comprida, corpo verde e testa amarela.
  g.fillStyle = '#287BA4'; g.beginPath(); g.moveTo(-5, 0); g.lineTo(-10, 15); g.lineTo(-1, 8); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = '#51A85D'; g.beginPath(); g.ellipse(0, -4, 6, 9, -.2, 0, Math.PI * 2); g.fill(); g.stroke();
  g.save(); g.translate(-2, -6); g.rotate(flying ? Math.sin(t * 24) * 1.1 - .3 : .35);
  g.fillStyle = '#20795F'; g.beginPath(); g.ellipse(flying ? -8 : 0, 2, flying ? 15 : 4, flying ? 4 : 7, -.2, 0, Math.PI * 2); g.fill(); g.stroke();
  g.strokeStyle = '#64BAC1'; g.beginPath(); g.moveTo(-2, 2); g.lineTo(flying ? -20 : -2, flying ? 4 : 6); g.stroke(); g.restore();
  g.fillStyle = '#77C46B'; g.beginPath(); g.arc(3, -13, 5.5, 0, Math.PI * 2); g.fill(); g.stroke();
  g.fillStyle = '#E8D458'; g.beginPath(); g.ellipse(5, -16, 3.5, 2, .3, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#EDB36B'; g.beginPath(); g.moveTo(7, -14); g.quadraticCurveTo(15, -12, 9, -7); g.lineTo(8, -11); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = '#FAF1D3'; g.beginPath(); g.arc(5, -13, 1.8, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#102126'; g.beginPath(); g.arc(5.5, -13, .9, 0, Math.PI * 2); g.fill();
  if (!flying) { g.strokeStyle = '#D7AD74'; g.beginPath(); g.moveTo(-2, 3); g.lineTo(-2, 6); g.lineTo(1, 6); g.moveTo(2, 3); g.lineTo(2, 6); g.lineTo(5, 6); g.stroke(); }
  g.restore();
}
