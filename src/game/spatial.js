// Broad phase: só testa corpos em células vizinhas. A IA continua rodando normalmente.
export function separateEnemies(enemies, move) {
  let size = 64;
  for (const e of enemies) size = Math.max(size, e.r * 2);
  const cells = new Map(), positions = new Map();
  const key = e => Math.floor(e.x / size) + ',' + Math.floor(e.y / size);
  const place = (e, i) => {
    const next = key(e), old = positions.get(i);
    if (next === old) return;
    if (old) cells.get(old).delete(i);
    if (!cells.has(next)) cells.set(next, new Set());
    cells.get(next).add(i); positions.set(i, next);
  };
  enemies.forEach((e, i) => { if (!e.submerged) place(e, i); });
  let checks = 0;
  for (let i = 0; i < enemies.length; i++) {
    const a = enemies[i]; if (a.submerged) continue;
    const x = Math.floor(a.x / size), y = Math.floor(a.y / size), candidates = [];
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++)
      for (const j of cells.get((x + dx) + ',' + (y + dy)) || []) if (j > i) candidates.push(j);
    candidates.sort((a, b) => a - b);
    for (const j of candidates) {
      checks++;
      const b = enemies[j], dx = b.x - a.x, dy = b.y - a.y, min = a.r + b.r, sq = dx * dx + dy * dy;
      if (sq <= 0 || sq >= min * min) continue;
      const d = Math.sqrt(sq), push = (min - d) / 2;
      if (a.kind !== 'boss') { move(a, -dx / d * push, -dy / d * push); place(a, i); }
      if (b.kind !== 'boss') { move(b, dx / d * push, dy / d * push); place(b, j); }
    }
  }
  return checks;
}

export function inView(entity, left, top, width, height, padding = 220) {
  const margin = Math.max(padding, (entity.r || 0) * 3);
  return entity.x >= left - margin && entity.x <= left + width + margin &&
    entity.y >= top - margin && entity.y <= top + height + margin;
}
