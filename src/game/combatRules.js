export function bossDamage(enemy, damage, challenge) {
  if (enemy.id === 'leviata') return challenge === 'spear' ? Math.round(enemy.max * .027) : challenge === 'reflect' ? Math.round(enemy.max * .018) : 0;
  return enemy.kind === 'boss' ? Math.min(damage, Math.ceil(enemy.max * .025)) : damage;
}
export function strikeShell(enemy, posture) {
  if (enemy.id !== 'behemote' || enemy.shellOpen > 0 || posture < 30) return false;
  enemy.shellHits = (enemy.shellHits || 0) + 1;
  if (enemy.shellHits < 8) return false;
  enemy.shellHits = 0; enemy.shellOpen = 6;
  return true;
}
