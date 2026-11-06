// A escala é fixada na entrada: subir de nível durante a partida não fortalece inimigos.
export const DUNGEON_MODES = {
  historia: { nome: 'História', hp: .72, atk: .65, recompensa: .8, dica: 'Mais tempo para explorar e aprender.' },
  jornada: { nome: 'Jornada', hp: 1, atk: 1, recompensa: 1, dica: 'Combate e estudo em equilíbrio.' },
  desafio: { nome: 'Desafio', hp: 1.3, atk: 1.25, recompensa: 1.15, dica: 'Inimigos mais resistentes e perigosos.' }
};

export function dungeonRun(level, mode = 'jornada') {
  return { level: Math.max(1, Math.min(40, Math.floor(Number(level) || 1))), mode: Object.hasOwn(DUNGEON_MODES, mode) ? mode : 'jornada' };
}

export function scaleDungeonEntity(entity, run, stage = 1) {
  const d = entity.d, mode = DUNGEON_MODES[run.mode], level = run.level;
  const health = (1 + .16 * (level - 1)) / (1 + .16 * (d.lv - 1));
  const attack = (1 + .12 * (level - 1)) / (1 + .12 * (d.lv - 1));
  const depth = 1 + .04 * (stage - 1);
  entity.hp = entity.max = Math.max(1, Math.round(entity.max * health * mode.hp * depth));
  entity.atk = Math.max(1, Math.round(entity.atk * attack * mode.atk * depth));
  entity.def = Math.max(0, Math.round(d.def * attack));
  entity.lv = level;
  entity.xp = Math.max(1, Math.round((d.xp || 10) * Math.sqrt(health) * mode.recompensa));
  entity.ouro = Math.max(1, Math.round((d.ouro || 5) * Math.sqrt(health) * mode.recompensa));
  entity.posMax = Math.round(entity.posMax * Math.sqrt(health));
  return entity;
}

// A progressão é somente dentro da semana escolhida; nunca exige outra semana ou nível mínimo.
export function canEnterDungeon(character, week, number) {
  return !!week.fases[number - 1] && (number === 1 || !!character.data.fases?.[week.id]?.[number - 1]?.done);
}
