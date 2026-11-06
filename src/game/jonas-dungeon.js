import { TS } from './world.js';
import { DUNGEON_MODES } from './dungeon-scaling.js';
import { sfx } from '../audio.js';

export function initJonas(fase) {
  if (!fase.def.estacoes) return;
  fase.jonas = { feitas: [], ocupada: false, tempo: 0, onda: 0, aviso: null };
  fase.estacoes = fase.def.estacoes.map(e => ({ ...e, x: e.tx * TS + 16, y: e.ty * TS + 16 }));
}
export const studyReady = f => !f?.jonas || f.jonas.feitas.length === f.estacoes.length;
export function studyTarget(f) { return f?.estacoes?.find(e => !f.jonas.feitas.includes(e.id)); }
export function completeStation(f, id) {
  if (!f?.jonas || !f.estacoes.some(e => e.id === id) || f.jonas.feitas.includes(id)) return false;
  if (f.def.ordem && studyTarget(f)?.id !== id) return false;
  f.jonas.feitas.push(id); return true;
}
export function receiveStation(G, message) {
  const f = G.fase;
  if (f?.run && message.run === f.run && completeStation(f, message.id)) {
    G.ui.toast('Seu grupo concluiu: ' + f.estacoes.find(e => e.id === message.id).nome);
    if (f.keys >= 3) G.openDoor();
  }
}
export function studyText(f) {
  return f.jonas ? 'Estudo ' + f.jonas.feitas.length + '/' + f.estacoes.length + ' · ' + (studyTarget(f)?.nome || 'concluído') : '';
}
export function showStudy(G, def) {
  return G.ui.dialog({ nome: 'Estudo · ' + def.nome, texto: def.ref + '\n\n' + def.estudo.join('\n\n') + '\n\nPARA REFLETIR\n' + def.reflexao,
    acoes: [{ label: 'Continuar a jornada' }] });
}
async function interactStation(G, e) {
  const f = G.fase;
  if (f.jonas.ocupada || f.jonas.feitas.includes(e.id)) return;
  if (f.def.ordem && studyTarget(f)?.id !== e.id) return G.ui.toast('Primeiro: ' + studyTarget(f).nome + '. Siga a seta do estudo.');
  f.jonas.ocupada = true;
  try {
    const ok = await G.ui.quiz(e, e.nome + ' · ' + f.def.ref);
    if (G.fase !== f || f.done) return;
    G.revisao(e, ok);
    if (!ok) { G.ui.toast('Releia a explicação e tente outra vez. Não há perda de vida nesta atividade.'); return; }
    if (!completeStation(f, e.id)) return;
    sfx('right'); G.burst(e.x,e.y,24,'#93E4CC',150);
    G.p.hp = Math.min(G.st.maxHp, G.p.hp + G.st.maxHp * .08);
    G.p.fe = Math.min(G.st.maxFe, G.p.fe + 10);
    G.netEnviar({ t:'jonas-estacao', id:e.id, run:f.run });
    G.ui.toast(e.nome + ' concluído! ' + studyText(f), 4000);
    if (f.keys >= 3) G.openDoor();
  } finally { f.jonas.ocupada = false; }
}
export function jonasInteractions(G, consider) {
  const f = G.fase;
  if (G.scene !== 'fase' || !f?.jonas || f.done) return;
  for (const e of f.estacoes) if (!f.jonas.feitas.includes(e.id)) consider(e,Math.hypot(G.p.x-e.x,G.p.y-e.y),e.nome,()=>interactStation(G,e));
}

// Perigos locais com aviso de 1,8s. Não há dano durante diálogos; concluir o estudo acalma o ambiente.
export function tickJonas(G, dt) {
  const f=G.fase, s=f?.jonas;
  if (!s || f.done || !f.def.ambiente || G.ui.blocking || G.p.dead) return;
  s.tempo += Math.max(0,dt);
  if (s.aviso) {
    s.aviso.t -= dt;
    if (s.aviso.t > 0) return;
    const a=s.aviso; s.aviso=null;
    const hit=a.circle ? Math.hypot(G.p.x-a.x,G.p.y-a.y)<a.r+G.p.r : Math.abs(G.p.y-a.y)<a.r+G.p.r;
    if (hit) {
      const mode=DUNGEON_MODES[f.scale.mode];
      const damage=(9 + f.scale.level*1.2)*mode.atk*(1-s.feitas.length*.22);
      G.damagePlayer(damage,{x:a.x,y:a.y},{noKnock:true});
    }
    G.burst(a.x,a.y,16,f.def.ambiente==='calor'?'#E5BB7A':'#85D4E4',100);
    return;
  }
  if (studyReady(f) || s.tempo < 9 + s.feitas.length*3) return;
  s.tempo=0; s.onda++;
  // O início do mapa, as leituras e a arena têm intervalos seguros; não segue o jogador depois do aviso.
  const circle=f.def.ambiente!=='ondas';
  s.aviso={x:circle?G.p.x:22*TS, y:circle?G.p.y:(16+(s.onda%4)*4)*TS, r:circle?66:24, circle,t:1.8};
}
function icon(g, symbol, t, color) {
  g.strokeStyle=color;g.fillStyle=color;g.lineWidth=2;g.lineCap='round';
  g.beginPath();g.arc(0,0,18,0,Math.PI*2);g.stroke();
  if(symbol==='bussola'){g.save();g.rotate(Math.sin(t)*.15);g.beginPath();g.moveTo(0,-13);g.lineTo(6,8);g.lineTo(0,4);g.lineTo(-6,8);g.closePath();g.fill();g.restore();}
  else if(symbol==='planta'){g.beginPath();g.moveTo(0,12);g.lineTo(0,-8);g.stroke();for(const side of [-1,1]){g.beginPath();g.ellipse(side*6,-4,8,4,side*.6,0,7);g.fill();}}
  else if(symbol==='verme'){g.beginPath();for(let x=-11;x<=11;x++)g.lineTo(x,Math.sin(x*.3+t)*4);g.stroke();}
  else if(symbol==='coracao'){g.beginPath();g.moveTo(0,11);g.bezierCurveTo(-20,-3,-9,-15,0,-5);g.bezierCurveTo(9,-15,20,-3,0,11);g.fill();}
  else if(symbol==='caixa'){g.strokeRect(-9,-8,18,16);g.beginPath();g.moveTo(-9,-8);g.lineTo(9,8);g.moveTo(9,-8);g.lineTo(-9,8);g.stroke();}
  else if(symbol==='ancora'){g.beginPath();g.moveTo(0,-12);g.lineTo(0,12);g.moveTo(-9,3);g.quadraticCurveTo(0,20,9,3);g.moveTo(-7,-5);g.lineTo(7,-5);g.stroke();}
  else if(symbol==='luz'){g.beginPath();g.moveTo(0,-13);g.quadraticCurveTo(15,3,0,11);g.quadraticCurveTo(-10,2,0,-13);g.fill();}
  else {g.strokeRect(-9,-10,18,20);for(let y=-5;y<=6;y+=5){g.beginPath();g.moveTo(-5,y);g.lineTo(5,y);g.stroke();}}
}
export function drawJonas(G,g) {
  const f=G.fase;if(G.scene!=='fase'||!f?.jonas)return;
  const s=f.jonas;
  if(s.aviso){const a=s.aviso;g.save();g.fillStyle=f.def.ambiente==='calor'?'rgba(245,169,65,.22)':'rgba(87,190,239,.25)';g.strokeStyle='#FFF0B9';g.lineWidth=3;
    if(a.circle){g.beginPath();g.arc(a.x,a.y,a.r,0,Math.PI*2);g.fill();g.stroke();g.beginPath();g.arc(a.x,a.y,a.r*a.t/1.8,0,Math.PI*2);g.stroke();}
    else{g.fillRect(TS,a.y-a.r,(f.built.map.w-2)*TS,a.r*2);g.strokeRect(TS,a.y-a.r,(f.built.map.w-2)*TS,a.r*2);}
    g.font='bold 13px sans-serif';g.textAlign='center';g.fillStyle='#FFFFFF';g.fillText(f.def.ambiente==='calor'?'CALOR · saia do círculo':'CORRENTE · saia da área',a.x,a.y-a.r-10);g.restore();}
  for(const e of f.estacoes){const done=s.feitas.includes(e.id);g.save();g.translate(e.x,e.y);g.fillStyle=done?'rgba(86,209,155,.16)':'rgba(20,32,48,.8)';g.beginPath();g.ellipse(0,8,25,14,0,0,7);g.fill();g.translate(0,-18+Math.sin(G.T*2+e.tx)*3);icon(g,e.simbolo,G.T,done?'#67CF9E':'#FFE4A4');g.font='bold 11px sans-serif';g.textAlign='center';g.fillStyle='#FFF0CC';g.fillText((done?'✓ ':'')+e.nome,0,-28);g.restore();}
  // Costelas luminosas ao fundo da câmara, sem transformar o peixe em inimigo.
  if(f.def.tema==='ventre'){g.save();g.strokeStyle='rgba(183,155,217,.24)';g.lineWidth=5;for(let y=450;y<990;y+=100){g.beginPath();g.moveTo(42,y+40);g.quadraticCurveTo(180,y-25,320,y);g.moveTo(1360,y+40);g.quadraticCurveTo(1220,y-25,1088,y);g.stroke();}g.restore();}
}
