import { T, TS } from './world.js';

export function seaMission(G) {
  return ['q_leviata', 'q_jo'].some(id => G.char.data.quests[id]?.st === 'ativa');
}
export function blocks(G, e, x, y, r) {
  const m = G.cur.map;
  if (e.id === 'leviata' && ![T.WATER, T.SHALLOW].includes(m.get(Math.floor(x / TS), Math.floor(y / TS)))) return true;
  const aquatic = G.scene === 'world' && (e.id === 'leviata' || e === G.eu && (e.boat || e.swimming));
  for (const [dx, dy] of [[-r, -r * .4], [r, -r * .4], [-r, r * .7], [r, r * .7]]) {
    const tx = Math.floor((x + dx) / TS), ty = Math.floor((y + dy) / TS);
    if (m.solid(tx, ty) && !(aquatic && m.get(tx, ty) === T.WATER)) return true;
  }
  return (G.hazards || []).some(h => h.solid && h.t > 0 && e.kind !== 'boss' && Math.hypot(x - h.x, y - h.y) < r + h.r);
}
export function tickExpedition(G, dt) {
  const p = G.p;
  p.root = Math.max(0, (p.root || 0) - dt);
  p.sleep = Math.max(0, (p.sleep || 0) - dt);
  p.itemCd = Math.max(0, (p.itemCd || 0) - dt);
  if (G.scene !== 'world') { p.boat = false; p.swimming = false; G.spears = null; G.spearDrop = null; return; }
  const water = G.cur.map.get(Math.floor(p.x / TS), Math.floor(p.y / TS)) === T.WATER;
  p.swimming = water && !p.boat;
  if (!seaMission(G)) { G.spears = null; G.spearDrop = null; return; }
  if (G.spears?.until < G.T) { G.spears = null; G.ui.toast('As lanças temporárias se desfizeram. Procure outra provisão na margem.'); }
  if (G.spearDrop?.until < G.T) G.spearDrop = null;
  if (!G.spearDrop && G.T >= (G.nextSpear || 0) && G.waterNear() && !water) {
    G.nextSpear = G.T + 25;
    G.spearDrop = { x: p.x + p.fx * 20, y: p.y + p.fy * 20, until: G.T + 18 };
    G.ui.toast('Uma provisão de lanças apareceu na margem! Pegue com E; K arremessa por 45 segundos.');
  }
}
export function expeditionInteractions(G, consider) {
  const p = G.p;
  if (G.scene === 'world') {
    const water = G.waterNear();
    if (water && seaMission(G) && !p.boat && !p.swimming && G.T >= (p.boatCd || 0)) {
      consider(water, 48, 'Embarcar — esquive das ondas! K: lança', () => { p.boat = true; p.x = water.x; p.y = water.y; });
    }
    if (p.boat && G.cur.map.get(Math.floor(p.x / TS), Math.floor(p.y / TS)) !== T.WATER) consider(p, 0, 'Desembarcar', () => { p.boat = false; p.boatCd = G.T + 3; });
    if (G.spearDrop) consider(G.spearDrop, Math.hypot(p.x - G.spearDrop.x, p.y - G.spearDrop.y) - 8, 'Pegar 3 lanças temporárias (45s · K)', () => {
      G.spears = { n: 3, until: G.T + 45 }; G.spearDrop = null; G.ui.toast('3 lanças: K arremessa. Antecipe o movimento do Leviatã!');
    });
  }
  if (G.fase) {
    const key = G.fase.sem.id + ':' + G.fase.n;
    const spot = G.chests[G.chests.length - 1];
    if (spot && !G.char.data.secrets.includes('eco:' + key)) consider(spot, Math.hypot(p.x - spot.x, p.y - spot.y) - 8, 'Investigar inscrição escondida', () => {
      const data = G.char.data;
      data.secrets.push('eco:' + key);
      for (const id of ['q_ecos', 'q_lampada']) if (!data.quests[id]) data.quests[id] = { st: 'ativa', n: 0 };
      G.questEvent('eco', '*');
      const messages = ['Cinco pedras, uma coragem: 1 Samuel 17:40.', 'O pequeno grão cresce: Mateus 13:31.', 'Uma lâmpada ilumina o caminho: Salmo 119:105.', 'O tesouro está escondido no campo: Mateus 13:44.', 'A verdade liberta: João 8:32.'];
      G.ui.toast(messages[(G.fase.n - 1) % messages.length] + ' Eco descoberto! Veja Missões.', 7000);
      for (const id of ['q_ecos', 'q_lampada']) if (data.quests[id].st === 'pronta') G.completeQuest(id);
      G.save();
    });
  }
}
export function drawExpedition(G, g) {
  g.save();
  for (const h of G.hazards) if (h.solid) { g.fillStyle = '#756C60'; g.strokeStyle = '#D4B992'; g.lineWidth = 3; g.beginPath(); g.ellipse(h.x, h.y, h.r, h.r * .8, 0, 0, Math.PI * 2); g.fill(); g.stroke(); }
  if (G.spearDrop) { g.fillStyle = '#BCEFFF'; g.font = '24px serif'; g.fillText('⚔', G.spearDrop.x - 12, G.spearDrop.y); }
  if (G.fase) { const spot = G.chests[G.chests.length - 1]; if (spot && !G.char.data.secrets.includes('eco:' + G.fase.sem.id + ':' + G.fase.n)) { g.fillStyle = '#DCC899'; g.font = '15px serif'; g.fillText('✧', spot.x + 18, spot.y - 10); } }
  const p = G.p;
  if (p.boat) { g.fillStyle = '#80582F'; g.strokeStyle = '#DEBA7A'; g.lineWidth = 3; g.beginPath(); g.ellipse(p.x, p.y + 9, 32, 17, Math.atan2(p.fy, p.fx), 0, Math.PI * 2); g.fill(); g.stroke(); }
  if (p.sleep > 0 || p.root > 0 || p.swimming || G.spears) { g.fillStyle = '#FDE7A5'; g.font = '13px sans-serif'; g.textAlign = 'center'; g.fillText(p.sleep > 0 ? 'Zzz…' : p.root > 0 ? 'IMOBILIZADO — DEFENDA!' : G.spears ? `K: ${G.spears.n} lanças · ${Math.ceil(G.spears.until - G.T)}s` : 'NADO LENTO — VOLTE À MARGEM!', p.x, p.y - 55); }
  g.restore();
}
