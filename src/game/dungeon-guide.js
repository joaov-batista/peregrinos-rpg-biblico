// A Mentira usa o guia como isca. Nunca há fallback para a verdadeira.
export function dungeonBossGuide(game) {
  const truth = game.enemies.find(e => e.kind === 'boss' && e.id === 'mentira' && !e.clone && e.hp > 0);
  if (!truth) { game.falseGuideTarget = null; return null; }
  const eligible = e => e.id === 'mentira' && e.clone && e.hp > 0 && !e.submerged &&
    Math.hypot(e.x - truth.x, e.y - truth.y) > e.r + truth.r;
  let target = game.falseGuideTarget;
  if (!game.enemies.includes(target) || !eligible(target)) target = game.enemies.find(eligible);
  game.falseGuideTarget = target || null;
  if (!target) return null;
  // Coordenadas vivas: a seta acompanha a ilusão até nas trocas de lugar.
  return { get x() { return target.x; }, get y() { return target.y; },
    label: 'Derrote ' + truth.d.nome, deceptive: true };
}
export function canLockEnemy(enemy) {
  return enemy.id === 'mentira' ? !!enemy.clone : !enemy.clone;
}
