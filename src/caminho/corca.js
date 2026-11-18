// Pés de Corça: o item do slot especial. Não ocupa vaga de relíquia. Com ele, o peregrino gruda na parede e fica parado,
// sobe devagar, solta quando quer, pula, ataca e ora dali (o ataque mira sai na versão de parede).
// "O Senhor Deus é a minha força; ele fará os meus pés como os da corça e me fará andar sobre as minhas alturas" (Hc 3:19).
// Conquista: a missão de Habacuque, o vigia na torre da sinagoga. Vencer o Beemote; depois, vencê-lo de novo sem cair nenhuma vez.
import { sfx } from '../audio.js';

export const ESPECIAIS = {
  pes_corca: { nome: 'Pés de Corça', ref: 'Habacuque 3:19', desc: 'Gruda na parede e fica firme ali: segure para o lado da parede para agarrar, para cima para subir devagar, para baixo ou para o outro lado para soltar. Da parede dá para pular, golpear, usar o ataque mira e orar.' }
};
export const temEspecial = (G, id) => !!G.cm.especiais?.[id] && G.cm.espOff?.[id] !== true;
export function alternarEspecial(G, id) { const off = G.cm.espOff = G.cm.espOff || {}; off[id] = !off[id]; G.salvar(); return !off[id]; }

// estágios em cm.corca: 0 nada · 1 aceitou (vencer o Beemote) · 2 venceu uma vez (agora sem cair) · 3 venceu sem cair (buscar) · 4 recebido
const FALAS = {
  0: ['"Pôr-me-ei na minha torre de vigia… e vigiarei para ver o que ele me dirá" (Hc 2:1). Daqui de cima eu vejo a aldeia inteira.',
    'Você escorrega pelas paredes, não é? Desliza, desliza, e lá embaixo recomeça. Eu conheço um jeito de ficar firme nas alturas.',
    'Os pés da corça não escorregam na rocha. Mas não se dão a quem nunca enfrentou o ermo. Lá vive o Beemote, "a obra-prima dos caminhos de Deus" (Jó 40:19).'],
  1: 'Vá ao Ermo de Beemote, pela Cripta dos Gigantes, e vença-o. Depois volte aqui.',
  2: 'Você venceu o Beemote. Bom. Agora vença de novo, e desta vez sem cair nenhuma vez na luta. Quem anda nas alturas não pode tropeçar.',
  2.5: 'Ainda não. Uma luta inteira contra o Beemote, do começo ao fim, sem cair. Eu espero aqui; vigiar é o meu ofício.',
  3: '"Ainda que a figueira não floresça… todavia eu me alegrarei no Senhor" (Hc 3:17-18). Você ficou de pé. Tome: são seus.',
  4: 'Os pés de corça servem para subir, não para se esconder. Use-os e volte sempre que quiser ver a aldeia daqui de cima.'
};

export async function falarHabacuque(G, ob) {
  const cm = G.cm, e = cm.corca || 0, d = (texto, acoes) => G.ui.dialog({ nome: ob.nome, look: ob.look, texto, acoes });
  if (e === 0) {
    for (let i = 0; i < FALAS[0].length - 1; i++) await d(FALAS[0][i], [{ label: 'Continuar' }]);
    return d(FALAS[0][2], [{ label: 'Eu vou ao ermo', fn: () => { cm.corca = 1; G.salvar(); G.ui.toast('Missão de Habacuque: vencer o Beemote (Cripta dos Gigantes).', 5000); } }, { label: 'Ainda não estou pronto' }]);
  }
  if (e === 1) return d(FALAS[1], [{ label: 'Vou lá' }]);
  if (e === 2) { const t = cm.corcaOuviu ? FALAS[2.5] : FALAS[2]; cm.corcaOuviu = 1; G.salvar(); return d(t, [{ label: 'Entendi' }]); }
  if (e === 3) {
    await d(FALAS[3], [{ label: 'Receber' }]);
    cm.corca = 4; (cm.especiais = cm.especiais || {}).pes_corca = true; sfx('level'); G.efeito('coleta', G.p.x, G.p.y - 30); G.salvar();
    return G.ui.dialog({ nome: 'ESPECIAL · Pés de Corça', texto: ESPECIAIS.pes_corca.ref + '\n\n' + ESPECIAIS.pes_corca.desc + '\n\nFica no slot especial do inventário (não ocupa vaga de relíquia).', acoes: [{ label: 'Amém' }], cls: 'achado-lendaria' });
  }
  return d(FALAS[4], [{ label: 'Até mais' }]);
}

// chamado quando um chefe cai: a missão anda
export function corcaVenceu(G, b) {
  const cm = G.cm; if (b.id !== 'behemote' || !(cm.corca >= 1) || cm.corca >= 3) return;
  if (cm.corca === 1) { cm.corca = 2; G.ui.toast('Habacuque vai querer saber disso. (Torre da sinagoga)', 6000); }
  else if (cm.corca === 2 && G.semCair) { cm.corca = 3; G.ui.toast('Sem cair nenhuma vez! Volte a Habacuque, na torre da sinagoga.', 7000); }
  else if (cm.corca === 2) G.ui.toast('Você caiu nesta luta. Habacuque pediu uma vitória sem cair.', 5000);
  G.salvar();
}

// a cada quadro, no herói: agarrar, ficar, subir, soltar
export function passoCorca(G, p, c, dt, paredeAoLado, N, emDash, preso) {
  if (p.soltouT > 0) p.soltouT -= dt;
  if (!temEspecial(G, 'pes_corca') || p.chao || emDash || preso || p.morto) { p.agarra = 0; p.agarraT = 0; return; }
  if (p.agarra && !paredeAoLado(N, p, p.agarra)) p.agarra = 0; // a parede acabou (subiu até o topo ou ela some)
  if (!p.agarra && !(p.soltouT > 0)) { const lado = c.mx > 0.3 ? 1 : c.mx < -0.3 ? -1 : 0; if (lado && paredeAoLado(N, p, lado) && p.vy > -260) { p.agarra = lado; p.agarraT = 0; sfx('block'); G.fx.po(p.x + lado * 9, p.y - 24, 4, '#C9D2C4'); } }
  if (!p.agarra) { p.agarraT = 0; return; }
  p.agarraT += dt;
  // soltar: para baixo, ou para o lado de fora depois de um instante (para não soltar sem querer ao virar o golpe)
  if (c.my > 0.6 || (c.mx && Math.sign(c.mx) === -p.agarra && p.agarraT > 0.35 && !p.atk)) { p.agarra = 0; p.soltouT = 0.3; return; }
  p.desliza = p.agarra; p.face = -p.agarra; p.pulos = G.pulosMax(); p.dashAr = true;
}
