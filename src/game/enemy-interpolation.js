// Interpolação de duas posições confirmadas: velocidade contínua entre pacotes,
// sem extrapolar inimigos através de paredes se a conexão parar.
const buffers = new WeakMap();
const DELAY = .15;
export function recordEnemyPosition(enemy, x, y, time) {
  let samples = buffers.get(enemy);
  const last = samples?.at(-1), gap = last ? time - last.t : 0;
  const maxStep = Math.max(enemy.d?.ai === 'blink' ? 35 : 90, (enemy.spd || 70) * gap * 3);
  if (!last || gap > .6 || gap < 0 || Math.hypot(x - last.x, y - last.y) > maxStep) {
    samples = [{ x, y, t: time }]; buffers.set(enemy, samples);
    enemy.x = x; enemy.y = y; // aparição/teleporte deve continuar instantâneo
  } else {
    if (gap === 0) samples.pop();
    samples.push({ x, y, t: time });
    while (samples.length > 6) samples.shift();
  }
}
export function interpolateEnemy(enemy, time) {
  const samples = buffers.get(enemy);
  if (!samples?.length) return;
  const target = time - DELAY;
  while (samples.length > 2 && samples[1].t <= target) samples.shift();
  const a = samples[0], b = samples[1] || a;
  const blend = b.t > a.t ? Math.max(0, Math.min(1, (target - a.t) / (b.t - a.t))) : 1;
  enemy.x = a.x + (b.x - a.x) * blend; enemy.y = a.y + (b.y - a.y) * blend;
}
