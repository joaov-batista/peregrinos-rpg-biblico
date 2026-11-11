// Desenho dos objetos de cena do Caminho: rolos, pedras de Ebenézer, portais, vasos, segredos e personagens.
import { TAU } from '../util.js';
import { drawPerson } from '../game/character-art.js';
import { TODAS } from '../content/index.js';
import { corA } from './cena.js';
import { MUNDO } from './dados.js';

const INK = '#080F19';
const brilho = (g, x, y, r, cor, a) => { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, corA(cor, a)); gr.addColorStop(1, corA(cor, 0)); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); };

export function desenharObjeto(g, o, G) {
  const Tm = G.T, tm = G.tm, x = o.x, y = o.y;
  g.lineJoin = 'round'; g.lineCap = 'round';
  switch (o.tipo) {
    case 'vaso':
      if (o.quebrado) { g.fillStyle = '#5E4A33'; g.fillRect(x - 9, y - 4, 7, 4); g.fillRect(x + 2, y - 3, 6, 3); break; }
      g.fillStyle = '#8C6B45'; g.strokeStyle = INK; g.lineWidth = 1.4; g.beginPath(); g.moveTo(x - 6, y - 22); g.quadraticCurveTo(x - 14, y - 10, x - 7, y); g.lineTo(x + 7, y); g.quadraticCurveTo(x + 14, y - 10, x + 6, y - 22); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = '#B79A6E'; g.fillRect(x - 7, y - 24, 14, 3.5); g.strokeRect(x - 7, y - 24, 14, 3.5); g.fillStyle = 'rgba(255,255,255,.14)'; g.fillRect(x - 6, y - 16, 3, 9);
      break;
    case 'rolo': {
      // estante de leitura com o rolo aberto
      brilho(g, x, y - 34, 70, o.feito ? '#FFE9A8' : tm.acento, o.feito ? 0.3 : 0.14 + 0.06 * Math.sin(Tm * 3));
      g.fillStyle = '#2A2019'; g.strokeStyle = INK; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x - 4, y); g.lineTo(x - 3, y - 26); g.lineTo(x + 3, y - 26); g.lineTo(x + 4, y); g.closePath(); g.fill(); g.stroke();
      g.fillRect(x - 12, y - 3, 24, 3); g.save(); g.translate(x, y - 30); g.rotate(-0.12);
      g.fillStyle = '#3A2C22'; g.fillRect(-17, -2, 34, 5); g.strokeRect(-17, -2, 34, 5);
      g.fillStyle = o.feito ? '#FFF3CF' : '#D9CBA6'; g.fillRect(-14, -9, 28, 8); g.strokeRect(-14, -9, 28, 8);
      g.fillStyle = '#8C6B45'; g.beginPath(); g.arc(-15, -5, 4, 0, TAU); g.arc(15, -5, 4, 0, TAU); g.fill(); g.stroke();
      g.fillStyle = 'rgba(60,45,30,.55)'; for (let i = 0; i < 3; i++) g.fillRect(-10, -7.5 + i * 2.2, 20 - i * 4, 0.9);
      g.restore();
      if (o.feito) { g.fillStyle = '#FFE9A8'; g.beginPath(); g.arc(x, y - 52 + Math.sin(Tm * 2) * 2, 4, 0, TAU); g.fill(); }
      else { g.font = '900 15px Cinzel, serif'; g.textAlign = 'center'; g.fillStyle = corA(tm.acento, 0.6 + 0.4 * Math.sin(Tm * 4)); g.fillText(String(o.n + 1), x, y - 50 + Math.sin(Tm * 2) * 2); }
      break;
    }
    case 'estacao': {
      const c = o.feito ? '#93E4CC' : '#D7C08A', f = Math.sin(Tm * 2.4 + x) * 3;
      brilho(g, x, y - 34, 60, c, 0.22);
      g.fillStyle = '#1B232E'; g.strokeStyle = INK; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x - 10, y); g.lineTo(x - 6, y - 14); g.lineTo(x + 6, y - 14); g.lineTo(x + 10, y); g.closePath(); g.fill(); g.stroke();
      g.save(); g.translate(x, y - 36 + f); g.rotate(o.feito ? 0 : Math.sin(Tm * 1.3) * 0.2); g.strokeStyle = c; g.lineWidth = 2.2; g.fillStyle = corA(c, 0.2);
      g.beginPath(); for (let i = 0; i < 4; i++) { const a = i * TAU / 4 - Math.PI / 2; g.lineTo(Math.cos(a) * 13, Math.sin(a) * 13); } g.closePath(); g.fill(); g.stroke();
      g.beginPath(); g.arc(0, 0, 4, 0, TAU); g.fillStyle = c; g.fill(); g.restore();
      break;
    }
    case 'ebenezer': {
      const aceso = G.cm.ebenezer?.area === G.area;
      brilho(g, x, y - 40, 110, '#FFE9A8', aceso ? 0.3 : 0.12);
      g.fillStyle = '#4B5560'; g.strokeStyle = INK; g.lineWidth = 1.8; g.beginPath(); g.moveTo(x - 16, y); g.lineTo(x - 13, y - 44); g.quadraticCurveTo(x - 4, y - 66, x + 8, y - 52); g.lineTo(x + 16, y); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = 'rgba(255,255,255,.1)'; g.beginPath(); g.moveTo(x - 11, y - 6); g.lineTo(x - 9, y - 42); g.lineTo(x - 3, y - 54); g.lineTo(x - 4, y - 6); g.fill();
      g.strokeStyle = aceso ? '#FFE9A8' : '#8A93A0'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(x - 4, y - 38); g.lineTo(x + 5, y - 38); g.moveTo(x - 4, y - 30); g.lineTo(x + 6, y - 30); g.moveTo(x - 3, y - 22); g.lineTo(x + 4, y - 22); g.stroke();
      g.fillStyle = '#39424C'; g.fillRect(x - 26, y - 5, 12, 5); g.fillRect(x + 15, y - 7, 14, 7);
      if (aceso) { g.fillStyle = '#FFE9A8'; g.beginPath(); g.ellipse(x - 2, y - 66 + Math.sin(Tm * 6) * 1.5, 3, 5.5, 0, 0, TAU); g.fill(); }
      break;
    }
    case 'portal': case 'saida': case 'retorno': {
      const sem = o.semana ? TODAS.find(s => s.id === o.semana) : null, m = o.mundo ? MUNDO[o.mundo] : null;
      const cor = o.tipo === 'saida' ? '#FFE9A8' : o.tipo === 'retorno' ? '#9DB9C7' : m ? '#E58A6A' : ['#FFD23F', '#79D9CD', '#F1C96A', '#C79BFF'][TODAS.indexOf(sem) % 4];
      brilho(g, x, y - 46, 100, cor, 0.26 + 0.06 * Math.sin(Tm * 2));
      g.fillStyle = '#131B26'; g.strokeStyle = INK; g.lineWidth = 2; g.beginPath(); g.moveTo(x - 30, y); g.lineTo(x - 30, y - 56); g.arc(x, y - 56, 30, Math.PI, 0); g.lineTo(x + 30, y); g.closePath(); g.fill(); g.stroke();
      const gr = g.createLinearGradient(0, y - 80, 0, y); gr.addColorStop(0, corA(cor, 0.85)); gr.addColorStop(1, corA(cor, 0.12));
      g.fillStyle = gr; g.beginPath(); g.moveTo(x - 21, y); g.lineTo(x - 21, y - 54); g.arc(x, y - 54, 21, Math.PI, 0); g.lineTo(x + 21, y); g.closePath(); g.fill();
      for (let i = 0; i < 5; i++) { const yy = y - ((Tm * 26 + i * 17) % 78); g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(x - 14 + (i * 37 % 28), yy, 1.6, 5); }
      const nome = o.tipo === 'saida' ? 'Seguir' : o.tipo === 'retorno' ? 'Refúgio' : sem ? sem.estudo : m.nome;
      g.font = '800 12px Cinzel, serif'; g.textAlign = 'center'; g.lineWidth = 3; g.strokeStyle = 'rgba(8,15,25,.9)'; g.strokeText(nome, x, y - 96); g.fillStyle = cor; g.fillText(nome, x, y - 96);
      if (sem) { const feitas = sem.fases.filter(f => G.cm.feitas[sem.id + ':' + f.n]).length; g.font = '700 10px Alegreya Sans, sans-serif'; g.fillStyle = '#C9D2C4'; g.strokeText(feitas + '/5 páginas', x, y - 108); g.fillText(feitas + '/5 páginas', x, y - 108); }
      break;
    }
    case 'segredo': {
      const f = Math.sin(Tm * 3 + x) * 3, cor = o.item === 'pedra' ? '#C9C4B2' : o.item === 'mana' ? '#FFF6DC' : '#FFD23F';
      brilho(g, x, y - 18 + f, 34, cor, 0.5);
      g.fillStyle = cor; g.strokeStyle = INK; g.lineWidth = 1.4; g.beginPath();
      if (o.item === 'pedra') g.ellipse(x, y - 16 + f, 8, 6, 0.3, 0, TAU); else if (o.item === 'mana') g.arc(x, y - 16 + f, 6, 0, TAU); else { g.moveTo(x - 7, y - 10 + f); g.quadraticCurveTo(x - 10, y - 24 + f, x, y - 26 + f); g.quadraticCurveTo(x + 10, y - 24 + f, x + 7, y - 10 + f); g.closePath(); }
      g.fill(); g.stroke();
      break;
    }
    case 'sacola':
      brilho(g, x, y - 14, 44, '#FFD23F', 0.4 + 0.15 * Math.sin(Tm * 5));
      g.fillStyle = '#7A5A30'; g.strokeStyle = INK; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x - 9, y); g.quadraticCurveTo(x - 13, y - 16, x - 3, y - 20); g.lineTo(x + 3, y - 20); g.quadraticCurveTo(x + 13, y - 16, x + 9, y); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = '#FFD23F'; g.fillRect(x - 4, y - 23, 8, 3);
      break;
    case 'arvore': // o sicômoro de Zaqueu
      g.fillStyle = '#2A2019'; g.strokeStyle = INK; g.lineWidth = 2; g.beginPath(); g.moveTo(x - 10, y); g.quadraticCurveTo(x - 4, y - 90, x - 16, y - 190); g.lineTo(x + 6, y - 190); g.quadraticCurveTo(x + 4, y - 90, x + 12, y); g.closePath(); g.fill(); g.stroke();
      for (const [dx, dy, r] of [[-40, -200, 46], [30, -214, 54], [-6, -250, 50], [70, -180, 36], [-80, -170, 30]]) { g.fillStyle = corA('#2F5A40', 0.92); g.beginPath(); g.arc(x + dx + Math.sin(Tm + dx) * 2, y + dy, r, 0, TAU); g.fill(); }
      break;
    case 'querubim': {
      brilho(g, x, y - 70, 170, '#FFB05A', 0.3);
      g.save(); g.translate(x, y - 70); g.rotate(Tm * 2.2);
      const gr = g.createLinearGradient(0, -64, 0, 64); gr.addColorStop(0, '#FFF1BE'); gr.addColorStop(0.5, '#FF9F4A'); gr.addColorStop(1, '#FFF1BE');
      g.fillStyle = gr; g.shadowColor = '#FF9F4A'; g.shadowBlur = 22; g.beginPath(); g.moveTo(0, -66); g.lineTo(6, 0); g.lineTo(0, 66); g.lineTo(-6, 0); g.closePath(); g.fill(); g.restore();
      for (const s of [-1, 1]) { g.fillStyle = 'rgba(255,241,200,.35)'; g.beginPath(); g.moveTo(x + s * 40, y - 60); g.quadraticCurveTo(x + s * 130, y - 170, x + s * 70, y - 20); g.quadraticCurveTo(x + s * 80, y - 70, x + s * 40, y - 60); g.fill(); }
      break;
    }
    case 'porta-pecado':
      g.fillStyle = '#05060A'; g.strokeStyle = '#1B232E'; g.lineWidth = 3; g.fillRect(x - 22, y - 78, 44, 78); g.strokeRect(x - 22, y - 78, 44, 78);
      if (!G.cm.ovos.includes('graca')) { g.fillStyle = `rgba(239,105,129,${0.35 + 0.3 * Math.sin(Tm * 1.7)})`; g.beginPath(); g.ellipse(x - 6, y - 46, 2, 3, 0, 0, TAU); g.ellipse(x + 6, y - 46, 2, 3, 0, 0, TAU); g.fill(); }
      else brilho(g, x, y - 40, 90, '#FFE9A8', 0.5);
      break;
    case 'npc':
      if (o.bicho === 'jumenta') { jumenta(g, x, y, Tm); break; }
      g.save(); drawPerson(g, x, y, 1.3, o.look || {}, { t: Tm + x, fx: Math.sign(G.p.x - x) * 0.5, fy: 1, walk: 0, moving: false, semLuz: true }); g.restore();
      break;
  }
}

function jumenta(g, x, y, Tm) {
  const c = '#8A8176'; g.fillStyle = c; g.strokeStyle = INK; g.lineWidth = 1.6;
  for (const dx of [-14, -8, 10, 16]) { g.fillRect(x + dx, y - 20, 4, 20); g.strokeRect(x + dx, y - 20, 4, 20); }
  g.beginPath(); g.ellipse(x, y - 28, 22, 12, 0, 0, TAU); g.fill(); g.stroke();
  g.save(); g.translate(x - 22, y - 36); g.rotate(-0.5 + Math.sin(Tm * 1.2) * 0.06);
  g.beginPath(); g.ellipse(-6, -8, 8, 13, 0.2, 0, TAU); g.fill(); g.stroke();
  g.beginPath(); g.ellipse(-4, -24, 3, 9, -0.2, 0, TAU); g.ellipse(2, -23, 3, 9, 0.25, 0, TAU); g.fill(); g.stroke();
  g.fillStyle = INK; g.beginPath(); g.arc(-8, -11, 1.5, 0, TAU); g.fill(); g.restore();
  g.strokeStyle = c; g.lineWidth = 3; g.beginPath(); g.moveTo(x + 21, y - 30); g.quadraticCurveTo(x + 30, y - 24 + Math.sin(Tm * 3) * 3, x + 27, y - 12); g.stroke();
}
