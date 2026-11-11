// Registro das semanas de estudo. Todas aparecem no Salão das Dungeons; a última da lista é a semana ATUAL (NOVA).
// O progresso de cada semana fica salvo separado no personagem (data.fases[semana.id]).
// Uma semana pode trazer chefes próprios no campo "chefes" (mesmo formato de data/bestiary.js): eles entram no bestiário aqui.
import { BOSSES } from '../data/bestiary.js';
import { validarChefe } from '../game/bossMoves.js';
import semana01 from './semana-01.js';
import semana02 from './semana-02.js';
import semana03 from './semana-03.js';

// TODAS: o que o Caminho (remake) joga. SEMANAS: as que também têm mapa de letras para o modo clássico.
export const TODAS = [semana01, semana02, semana03];
export const SEMANAS = TODAS.filter(s => !s.soCaminho);
export const SEMANA_ATUAL = SEMANAS[SEMANAS.length - 1];

for (const sem of TODAS) Object.assign(BOSSES, sem.chefes || {});
for (const [id, d] of Object.entries(BOSSES)) if (d.fases || d.golpes) validarChefe(id, d);
for (const sem of TODAS) for (const f of sem.fases) if (!BOSSES[f.chefe]) console.warn('[' + sem.id + '] a fase ' + f.n + ' usa o chefe "' + f.chefe + '", que não existe');
