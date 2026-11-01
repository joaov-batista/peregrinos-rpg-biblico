// Apenas pose: nunca modifica posição, alcance, dano ou temporizadores do combate.
const states = new WeakMap();
const TAU = Math.PI * 2;
const damp = (a, b, rate, dt) => a + (b - a) * (1 - Math.exp(-rate * dt));
const STRIDE = { preguica: 35, ganancia: 32, inveja: 44, ira: 52, orgulho: 48, golias: 95, behemote: 105 };

export function creatureMotion(actor, time) {
  const x = actor.x || 0, y = actor.y || 0;
  let s = states.get(actor);
  if (!s) {
    s = { time, x, y, move: 0, speed: 0, cycle: (actor.ph || 0) % TAU, wing: (actor.ph || 0) % TAU, attack: 0,
      lookX: 0, lookY: 1, lean: 0, hit: 0, strike: 0, attackId: actor.artAttack || 0, step: actor.step, flash: actor.flash > 0 };
    states.set(actor, s);
  }
  const act = actor.artRemote ? actor.artAct : actor.act, step = actor.artRemote ? actor.artStep : actor.step;
  const elapsed = time - s.time, dt = Math.max(0, Math.min(.1, elapsed));
  const dx = x - s.x, dy = y - s.y, distance = Math.hypot(dx, dy);
  const nominal = Math.max(25, actor.spd || actor.d?.spd || 70);
  // Reentrada na câmera, pausa e teleporte não viram uma passada enorme.
  const reset = elapsed > .3 || elapsed < 0 || distance > Math.max(55, nominal * dt * 4);
  const speed = reset || !dt ? 0 : Math.min(nominal * 2, distance / dt);
  if (reset) { s.speed = 0; s.move = 0; s.hit = 0; s.strike = 0; }
  s.speed = damp(s.speed, actor.stun > 0 ? 0 : speed, 12, dt);
  s.move = damp(s.move, Math.min(1, s.speed / nominal), 14, dt);
  if (!reset && (actor.stun || 0) <= 0 && dt) {
    // Passada pela distância real, não por um relógio que faz os pés deslizarem.
    s.cycle = (s.cycle + distance / (STRIDE[actor.type || actor.id] || 42) * TAU) % TAU;
  }
  if (distance > .05 && !reset) {
    s.lookX = damp(s.lookX, dx / distance, 11, dt);
    s.lookY = damp(s.lookY, dy / distance, 11, dt);
  }
  if (!(actor.stun > 0)) s.wing = (s.wing + dt * (6 + s.move * 5)) % TAU;
  s.lean = damp(s.lean, s.lookX * s.move * .075, 10, dt);
  const preparing = actor.telegraph > 0 || (act && step === 1);
  s.attack = damp(s.attack, preparing ? 1 : 0, preparing ? 14 : 20, dt);
  if (!reset && ((actor.artAttack || 0) !== s.attackId || (act && step === 2 && s.step !== 2))) s.strike = 1;
  else s.strike *= Math.exp(-16 * dt);
  if (actor.flash > 0 && !s.flash && !reset) s.hit = 1;
  else s.hit *= Math.exp(-18 * dt);
  s.attackId = actor.artAttack || 0; s.step = step; s.flash = actor.flash > 0;
  s.time = time; s.x = x; s.y = y;
  const foot = offset => {
    const phase = s.cycle + offset;
    return { swing: Math.sin(phase) * s.move, lift: Math.max(0, Math.cos(phase)) * s.move };
  };
  return { wing: s.wing, move: s.move, cycle: s.cycle, phase: s.cycle / 5, attack: s.attack, strike: s.strike,
    lookX: s.lookX, lookY: s.lookY, lean: s.lean, hit: s.hit,
    bob: -Math.abs(Math.sin(s.cycle)) * s.move * 1.2, left: foot(0), right: foot(Math.PI) };
}
