// GETSÊMANI — o único encontro do peregrino com Jesus, na noite antes da cruz (Mt 26:36-46; Mc 14:32-42; Lc 22:39-46).
// Acontece uma vez só. Depois, o jardim amanhece vazio e fica sobre a pedra um livro aberto contando a manhã seguinte.
// Tudo aqui é devagar de propósito: a fala se escreve letra a letra, há silêncios, e o jogador escolhe o que dizer.
import { sfx, music, audio, murmurio, teclaTexto } from '../audio.js';
import { marco } from '../telemetria.js';

export const JESUS_LOOK = { skin: '#B98A5E', hair: '#3A2314', tunic: '#E6DFCB', cape: '#8E2E3A', style: 'longo', beard: true };
const NOME_J = 'Jesus';
const JUDAS_LOOK = { skin: '#B07A4E', hair: '#2A1A10', tunic: '#7A6A3A', cape: '#4A3A2A', style: 'curto', beard: true };
const MALCO_LOOK = { skin: '#C68B59', hair: '#3A2314', tunic: '#6E5A4A', cape: 'none', style: 'curto', beard: false };
const ORANDO = ['Aba, Pai…', 'Tudo te é possível.', 'Passa de mim este cálice…', 'Contudo, não seja o que eu quero…', '…e sim o que tu queres.'];
const esperar = ms => new Promise(r => setTimeout(r, ms));

// ---- o mundo enquanto se espera: a oração que se ouve de longe, as gotas, os vaga-lumes, os discípulos dormindo, as tochas ----
export function passoGetsemani(G, dt) {
  const p = G.p, J = G.objs.find(o => o.tipo === 'jesus');
  if (J) {
    if (!G.cena && Math.abs(J.x - p.x) < 520) { J.tOra = (J.tOra ?? 1.5) - dt; if (J.tOra <= 0) { J.tOra = 4.6; G.fala(J, ORANDO[(J.iOra = ((J.iOra ?? -1) + 1) % ORANDO.length)]); } }
    if (J.pose === 'ora' && Math.random() < dt * 0.9) G.parts.push({ x: J.x + 6, y: J.y - 34, vx: 0, vy: 40, t: 0.7, max: 0.7, r: 1.2, cor: '#9E2A2A', g: 120 }); // "o seu suor tornou-se como gotas de sangue" (Lc 22:44)
    if (Math.random() < dt * 3) G.parts.push({ x: J.x + (Math.random() - 0.5) * 60, y: J.y - 10 - Math.random() * 60, vx: (Math.random() - 0.5) * 10, vy: -12, t: 1.6, max: 1.6, r: 1, cor: '#FFF1BE', g: 0 });
  }
  // todos andam até um ponto e PARAM (ninguém anda para sempre); quem sai de cena se apaga e é retirado
  for (const o of G.objs) {
    if (o.tipo === 'tocha') o.fase = (o.fase || 0) + dt;
    if (o.indo != null) { const d = o.indo - o.x; if (Math.abs(d) < 3) { o.x = o.indo; o.indo = null; if (o.tipo !== 'tocha') o.pose = o.poseDepois ?? null; o.poseDepois = undefined; } else { o.x += Math.sign(d) * Math.min(Math.abs(d), (o.vel || 46) * dt); o.vira = Math.sign(d); if (o.tipo !== 'tocha') o.pose = 'anda'; } }
    if (o.some > 0) { if (o.luz0 == null) o.luz0 = o.luz || 0; o.some = Math.max(0, o.some - dt * (o.someVel || 0.35)); o.alfa = o.some; o.luz = o.luz0 * o.alfa; if (o.some <= 0) o.fora = true; }
    if (o.tipo === 'anjo') { o.t = (o.t || 0) + dt; o.alfa = o.fora ? 0 : Math.min(o.alfaMax ?? 1, (o.alfa ?? 0) + dt * 0.6 * (o.some > 0 ? 0 : 1)); o.espada += ((o.guarda ? 0 : 1) - o.espada) * Math.min(1, dt * (o.guarda ? 2.5 : 1.2)); }
  }
  if (G.objs.some(o => o.fora && o.tipo !== 'jesus')) G.objs = G.objs.filter(o => o.tipo === 'jesus' || !o.fora);
  if (Math.random() < dt * 0.7) for (const o of G.objs) if (o.tipo === 'discipulo' && !o.acordado && Math.random() < 0.3) G.parts.push({ x: o.x + 8, y: o.y - 34, vx: 6, vy: -14, t: 1.8, max: 1.8, r: 1, cor: '#9AA6C8', g: 0, z: true });
  if (G.cenaAjoelha) p.orando = Math.max(p.orando, 0.2);
}

// fala de alguém, devagar (a de Jesus) ou não; o peregrino fala com o próprio nome e o próprio rosto
const disse = (G, quem, texto, acoes, o = {}) => G.ui.dialog({ nome: quem === 'eu' ? G.char.name : quem === 'j' ? NOME_J : quem === 'n' ? 'Getsêmani' : quem, look: quem === 'eu' ? G.char.look : quem === 'j' ? JESUS_LOOK : o.look, texto, acoes: acoes ? acoes.map(l => ({ label: l })) : [{ label: o.botao || 'Continuar' }], cls: quem === 'j' ? 'fala-jesus' : o.cls || (quem === 'eu' ? '' : 'fala-narra'), voz: quem === 'n' ? false : undefined });
const narra = (G, texto, botao) => disse(G, 'n', texto, null, { botao });

// a oração: uma tela à parte, quase escura, onde os versículos aparecem um de cada vez
function oracao(G, passos) {
  return G.ui.modal((p, close) => {
    p.classList.add('oracao'); p.parentElement.classList.add('locked', 'oracao-fundo');
    const caixa = document.createElement('div'); caixa.className = 'oracao-texto'; const ref = document.createElement('small'); const botoes = document.createElement('div'); botoes.className = 'btn-row';
    p.append(caixa, ref, botoes);
    let i = 0, escolha = null;
    const mostra = () => {
      const s = passos[i]; if (!s) return close(escolha);
      const t = typeof s.t === 'function' ? s.t(escolha) : s.t;
      caixa.className = 'oracao-texto ' + (s.quem || 'verso'); caixa.textContent = ''; ref.textContent = ''; botoes.replaceChildren();
      if (s.flash) { G.clarao = 0.5; sfx('level'); G.fx.anel(G.p.x, G.p.y - 26, '#FFFFFF', 300); }
      if (s.quem === 'jesus') murmurio(NOME_J, Math.round(t.length / 24) + 2);
      let k = 0; const tk = setInterval(() => { if (!caixa.isConnected) return clearInterval(tk); k++; caixa.textContent = t.slice(0, k); if (k % 2 && t[k - 1] !== ' ') teclaTexto(s.quem === 'jesus' ? NOME_J : 'oracao');
        if (k >= t.length) { clearInterval(tk); ref.textContent = s.ref || ''; const opts = s.opcoes || [s.botao || 'Amém'];
          opts.forEach((l, j) => { const b = document.createElement('button'); b.className = 'btn' + (j === 0 ? ' gold' : ''); b.textContent = l; b.onclick = () => { sfx('click'); if (s.opcoes) escolha = j; i++; mostra(); }; botoes.append(b); });
          botoes.querySelector('button')?.focus(); } }, s.quem === 'narra' ? 32 : 46);
      caixa.onclick = () => { if (k < t.length) k = t.length - 1; };
    };
    mostra();
  }, { dismiss: false, wide: true });
}

export async function encontro(G, J) {
  if (G.cm.getsemani || G.cena) return;
  const cm = G.cm, p = G.p, nome = G.char.name || 'peregrino';
  G.cena = true; G.cenaFoco = J; document.body.classList.add('em-cena', 'cena-cinema'); cinema(true, G); G.vista.cam.x = (J.x + p.x) / 2 - G.vista.W / G.vista.Z / 2; G.prenderCam(); const musicaAntes = audio.modo, chaveAntes = audio.chave; music('cinema', 'getsemani');
  try {
    await narra(G, 'Ele está de joelhos sobre a pedra, o rosto quase tocando o chão.\n\nO suor cai dele como gotas de sangue (Lc 22:44). Você para. Não sabe se deve chegar perto.', 'Esperar em silêncio');
    await esperar(1600);
    J.pose = 'olha'; J.vira = p.x < J.x ? -1 : 1; sfx('magic'); await esperar(1300);
    await disse(G, 'j', 'Não tenha medo.\n\nPode chegar mais perto.');
    G.cenaMx = Math.sign(J.x - 54 * (p.x < J.x ? 1 : -1) - p.x); await esperar(Math.min(1600, Math.abs(J.x - p.x) * 3)); G.cenaMx = 0; p.face = Math.sign(J.x - p.x) || 1;
    const como = await disse(G, 'j', 'Olá, meu filho.\n\nComo você está?', ['Cansado.', 'Com medo.', 'Eu nem sei, Senhor.']);
    await disse(G, 'j', { 'Cansado.': 'Eu sei. Você andou muito para chegar aqui.\n\n"Vinde a mim, todos os que estais cansados e sobrecarregados, e eu vos aliviarei" (Mt 11:28).\n\nEsta noite eu também estou cansado. Aqui você não precisa fingir que é forte.',
      'Com medo.': '"A minha alma está profundamente triste, até a morte" (Mt 26:38). Eu disse isso agora há pouco, a eles.\n\nMedo não é falta de fé. É o lugar onde a fé aprende a segurar a mão do Pai.',
      'Eu nem sei, Senhor.': 'Tudo bem.\n\nÀs vezes o coração é mais fundo do que as palavras. O Espírito intercede com gemidos que não se podem exprimir (Rm 8:26). O Pai entende assim mesmo.' }[como] || '');
    await disse(G, 'j', 'Eu sei que você não é deste tempo. Atravessou séculos de páginas para chegar a este jardim… e chegou justamente nesta noite.\n\nSabe onde estamos? Getsêmani. Quer dizer "prensa de azeite". É aqui que as azeitonas são esmagadas, para que haja azeite.');
    await disse(G, 'j', 'Esse azeite da sua lâmpada, que acendeu o seu caminho até aqui…\n\n…sempre veio de um lugar como este.');
    await disse(G, 'j', 'E você já sabe o que vai acontecer amanhã. Não sabe?', ['Sei.', '…']);
    await disse(G, 'eu', 'Senhor, eles vão te trair. Por trinta moedas de prata. Vão te açoitar, cuspir no teu rosto, te pregar numa cruz…\n\nAinda dá tempo! Os soldados nem chegaram. Eu tenho uma espada, eu tenho a lâmpada. Eu luto por ti.\n\nVamos embora daqui. Por favor.');
    J.pose = null; await esperar(900); J.pose = 'mao'; await esperar(500);
    await disse(G, 'j', 'Guarde a sua espada, filho.\n\nDaqui a pouco Pedro vai tentar a mesma coisa (Jo 18:10-11).');
    await disse(G, 'j', '"Acaso pensas que eu não poderia rogar a meu Pai, e ele não me mandaria agora mesmo mais de doze legiões de anjos?" (Mt 26:53)\n\nNinguém tira a minha vida de mim. Eu a dou por mim mesmo (Jo 10:18).', ['Então por quê?']);
    J.pose = null;
    await disse(G, 'j', 'Olhe para eles.\n\nPedro vai me negar três vezes antes de o galo cantar. Os outros vão fugir. Daqui a pouco, nenhum deles vai estar aqui.\n\nE eu os amo do mesmo jeito.');
    await disse(G, 'j', 'Cada sombra que você enfrentou lá fora — a ganância, o pavor, a mentira, a soberba — nenhuma nasceu longe do coração do homem. Nem do seu.\n\n"O salário do pecado é a morte" (Rm 6:23). É uma dívida que ninguém consegue pagar sozinho.');
    await disse(G, 'j', 'Amanhã, eu pago.\n\nNão porque alguém me obriga. Porque eu amo você.');
    await disse(G, 'j', 'O Pai não quer que ninguém se perca, mas que todos se arrependam e vivam (2Pe 3:9). Foi para isso que eu vim: buscar e salvar o que estava perdido (Lc 19:10).\n\nSe eu fugir esta noite, você continua perdido.\n\nSe eu for… você volta para casa.', ['Eu não mereço isso.', '…']).then(r => disse(G, 'j', r === 'Eu não mereço isso.' ? 'Não. Ninguém merece.\n\nPor isso se chama graça (Ef 2:8).' : 'Eu sei. Às vezes o amor deixa a gente sem palavras.'));
    await disse(G, 'j', 'Não chore por mim. Está tudo bem.\n\nEsta é a vontade do Pai, e é a minha também. Eu vou na frente, para preparar um lugar para você (Jo 14:2).');
    await disse(G, 'j', 'Mas agora… fique aqui e vigie comigo.\n\nOre comigo, só um pouco (Mt 26:38).', ['Ajoelhar ao lado dele']);
    J.pose = 'ora'; G.cenaAjoelha = true; G.escuroAlvo = 0.9; await esperar(1800);
    await oracao(G, [
      { quem: 'narra', t: 'Vocês dois, de joelhos, no meio das oliveiras. O vento para. Até os grilos se calam.', botao: 'Continuar' },
      { t: '"Sonda-me, ó Deus, e conhece o meu coração; prova-me, e conhece os meus pensamentos; vê se há em mim algum caminho mau, e guia-me pelo caminho eterno."', ref: 'Salmos 139:23-24' },
      { quem: 'narra', t: 'Há alguma coisa que você precisa entregar a Ele?', opcoes: ['O meu orgulho.', 'O meu medo.', 'As vezes em que eu desisti.', 'Tudo. Eu não sei por onde começar.'] },
      { quem: 'jesus', t: e => ['"Quem se humilha será exaltado" (Lc 14:11). Pode largar esse peso, filho. Ele nunca foi seu para carregar.', '"No amor não há medo; antes, o perfeito amor lança fora o medo" (1Jo 4:18). Você não está sozinho. Nunca esteve.', 'Eu também vi você se levantar. "Sete vezes cai o justo, e se levanta" (Pv 24:16). Eu nunca desisti de você.', 'É assim que se começa. Com tudo.'][e] },
      { t: '"Se confessarmos os nossos pecados, ele é fiel e justo para nos perdoar os pecados e nos purificar de toda injustiça."', ref: '1 João 1:9' },
      { t: '"Ainda que os vossos pecados sejam como a escarlata, eles se tornarão brancos como a neve."', ref: 'Isaías 1:18', flash: true },
      { quem: 'jesus', t: 'Filho… os seus pecados estão perdoados.', ref: 'Marcos 2:5' },
      { t: '"Quanto dista o Oriente do Ocidente, assim afasta de nós as nossas transgressões."', ref: 'Salmos 103:12' },
      { quem: 'narra', t: 'Você não sabe quanto tempo passa. Só sabe que o peso que trazia desde o Refúgio… não está mais lá.', botao: 'Levantar' }
    ]);
    G.cenaAjoelha = false; G.escuroAlvo = 0; p.oleo = G.oleoMax(); p.vida = p.vidaMax; G.efeito('cura', p.x, p.y, 1, { gruda: p }); G.fx.sobe(p.x, p.y - 10, 30, '#FFF1BE');
    J.pose = null; await esperar(1200);
    await disse(G, 'j', 'Eu poderia te dar muitas coisas agora. Uma espada que nunca erra. Uma armadura que nada atravessa. Poderia tirar todos os gigantes do seu caminho.\n\nMas aí você não cresceria.');
    await disse(G, 'j', 'O ouro é provado no fogo (1Pe 1:7). E o diamante só brilha depois de lapidado — e ele é lapidado na dureza, golpe por golpe.\n\n"No mundo tereis aflições; mas tende bom ânimo: eu venci o mundo" (Jo 16:33).');
    await disse(G, 'j', 'Eu acredito em você, ' + nome + '. Não no que você já é, mas no que o Pai está fazendo em você. "Aquele que começou a boa obra em vós há de completá-la" (Fp 1:6).\n\nEntão eu só vou fortalecer um pouco o que já existe em você. Escolha.');
    const DONS = { 'Fôlego, para não desistir': ['folego', '"Os que esperam no Senhor renovam as suas forças; sobem com asas como águias, correm e não se cansam" (Is 40:31).'], 'Azeite, para a lâmpada durar': ['azeite', '"Lâmpada para os meus pés é a tua palavra, e luz para o meu caminho" (Sl 119:105). Que ela não se apague.'], 'Força, para as batalhas': ['forca', '"O Senhor é a minha força e o meu escudo; nele o meu coração confia" (Sl 28:7).'] };
    const dom = await disse(G, 'j', 'Escolha uma coisa só. O resto, você vai conquistar.', Object.keys(DONS));
    const [id, versiculo] = DONS[dom] || DONS['Fôlego, para não desistir'];
    J.pose = 'mao'; await esperar(400); G.clarao = 0.3; sfx('level'); G.fx.anel(p.x, p.y - 26, '#FFE9A8', 120); G.efeito('cura', p.x, p.y, 1, { gruda: p });
    cm.getsemaniDom = id; p.vidaMax = G.vidaMax(); if (id === 'folego') p.vida = p.vidaMax; if (id === 'azeite') p.oleo = G.oleoMax();
    await disse(G, 'j', versiculo); J.pose = null;
    // os discípulos dormindo
    const pedro = G.objs.find(o => o.tipo === 'discipulo' && o.nome === 'Pedro');
    if (pedro) { J.indo = pedro.x + 34; J.poseDepois = null; await esperar(Math.abs(J.x - pedro.x) / 46 * 1000 + 300); J.vira = -1; G.fala(J, 'Simão, você está dormindo?'); await esperar(2200);
      await disse(G, 'j', '"Simão, dormes? Não pudeste vigiar nem uma hora?" (Mc 14:37)\n\n…O espírito está pronto, mas a carne é fraca (Mt 26:41).'); }
    // as tochas sobem o monte e param a uma distância: soldados, guardas, e Judas à frente (Jo 18:3)
    const chega = async (o, max = 9000) => { const t0 = performance.now(); while (o.indo != null && performance.now() - t0 < max && G.running) await esperar(80); };
    const xJ = J.x, discs = G.objs.filter(o => o.tipo === 'discipulo');
    const solds = Array.from({ length: 6 }, (_, i) => ({ tipo: 'tocha', x: xJ - 760 - i * 44, y: J.y, vel: 44, fase: i * 0.7, luz: 70, vira: 1, indo: xJ - 215 - i * 32 }));
    const judas = { tipo: 'pessoa', nome: 'Judas', look: JUDAS_LOOK, x: xJ - 700, y: J.y, vel: 44, vira: 1, indo: xJ - 185 };
    const malco = { tipo: 'pessoa', nome: 'Malco', look: MALCO_LOOK, x: xJ - 740, y: J.y, vel: 44, vira: 1, indo: xJ - 160 };
    G.objs.push(...solds, judas, malco);
    sfx('boss'); await esperar(2200);
    J.vira = p.x < J.x ? -1 : 1;
    await disse(G, 'j', '"Levantai-vos, vamos! Eis que é chegado aquele que me trai" (Mt 26:46).');
    discs.forEach((d, k) => { d.acordado = true; d.pose = null; d.vel = 70; d.indo = xJ + 70 + k * 30; }); // os três acordam e vêm para perto dele
    await disse(G, 'j', 'É hora de você voltar, ' + nome + '. Mas antes, fique e veja. O seu caminho continua lá, e ele vai ser difícil.\n\nQuando a noite ficar escura demais, lembre: eu estive aqui primeiro.');
    await disse(G, 'j', '"E eis que eu estou convosco todos os dias, até a consumação dos séculos" (Mt 28:20).', ['Senhor… obrigado.']);
    await chega(judas);
    await narra(G, 'Sobe uma multidão com lanternas, tochas e armas (Jo 18:3). Param a alguns passos.\n\nÀ frente vem alguém que você conhece das páginas: Judas, um dos doze.', 'Olhar');
    // Jesus desce da pedra e vai ao encontro deles; você vai junto, e a câmera fica no meio de tudo
    J.indo = xJ - 70; J.poseDepois = null;
    G.cenaFoco = { alfa: 1, get x() { return 2 * (J.x - 85) - p.x; } };
    for (let i = 0; i < 120 && Math.abs(p.x - (xJ + 40)) > 12; i++) { G.cenaMx = Math.sign(xJ + 40 - p.x); await esperar(30); } G.cenaMx = 0; p.face = -1;
    await chega(J);
    // o beijo
    judas.indo = J.x - 24; await chega(judas); judas.vira = 1; J.vira = -1;
    await disse(G, 'Judas', '"Salve, Rabi!"\n\n(E o beijou — Mt 26:49.)', null, { look: JUDAS_LOOK, botao: 'Continuar' });
    await disse(G, 'j', '"Judas, com um beijo trais o Filho do Homem?" (Lc 22:48)');
    judas.indo = xJ - 290; judas.vel = 30; // volta para o meio dos soldados, de cabeça baixa
    // "Sou eu" — e eles caem por terra
    await disse(G, 'j', '"A quem buscais?"');
    await disse(G, 'Soldados', '"A Jesus, o Nazareno."', null, { botao: 'Continuar' });
    await disse(G, 'j', '"Sou eu." (Jo 18:5)');
    G.clarao = 0.35; G.tremor(10); sfx('level'); G.fx.anel(J.x, J.y - 26, '#FFF1BE', 260);
    for (const o of [...solds, malco, judas]) { o.caido = true; o.x -= 26; } malco.pose = 'dorme'; judas.pose = 'dorme';
    await esperar(1400);
    await narra(G, 'Quando ele disse "Sou eu", recuaram e caíram por terra (Jo 18:6).\n\nNinguém ali tirava a vida dele. Ele a estava entregando.', 'Continuar');
    for (const o of [...solds, malco, judas]) o.caido = false; malco.pose = null; judas.pose = null;
    await esperar(700);
    await disse(G, 'j', '"Já vos disse que sou eu. Se, pois, me buscais a mim, deixai ir estes." (Jo 18:8)');
    // Pedro e a espada
    // (pedro é o mesmo discípulo que Jesus acordou)
    if (pedro) {
      await disse(G, 'Pedro', '"Senhor, feriremos à espada?" (Lc 22:49)', null, { look: pedro.look, botao: 'Continuar' });
      pedro.vel = 230; pedro.indo = malco.x + 26; await chega(pedro); pedro.vira = -1; pedro.pose = 'mao';
      G.efeito('corte', malco.x + 6, malco.y - 30, -1); sfx('swing'); G.tremor(6); G.hitstop = 0.12; malco.ferido = true; malco.pose = 'olha';
      for (let i = 0; i < 6; i++) G.parts.push({ x: malco.x + 4, y: malco.y - 36, vx: (Math.random() - 0.5) * 80, vy: -60 - Math.random() * 60, t: 0.6, max: 0.6, r: 1.4, cor: '#B8312A', g: 400 });
      for (const o of solds) o.x -= 8; // os soldados erguem as armas
      await narra(G, 'Simão Pedro desembainha a espada e fere o servo do sumo sacerdote, cortando-lhe a orelha direita. O servo se chamava Malco (Jo 18:10).', 'Continuar');
    }
    // os anjos: mais de doze legiões esperando uma palavra (Mt 26:53) — quase invisíveis
    const anjos = [];
    for (let i = 0; i < 9; i++) { const lado = i % 2 ? 1 : -1, k = Math.floor(i / 2); anjos.push({ tipo: 'anjo', x: J.x + lado * (90 + k * 95) + (i === 8 ? 0 : 0), y: J.y - (i % 3) * 60 - (i === 8 ? 150 : 0), alfa: 0, alfaMax: 0.9, espada: 0, fase: i * 0.8 }); }
    G.objs.push(...anjos); sfx('magic'); G.clarao = 0.08;
    await esperar(2200);
    await narra(G, 'Por um instante, você sente mais do que vê. O ar do jardim se enche de asas. Espadas de luz, meio desembainhadas, esperando uma só palavra.\n\n"Acaso pensas que eu não poderia rogar a meu Pai, e ele não me mandaria agora mesmo mais de doze legiões de anjos?" (Mt 26:53)', 'Continuar');
    // e ele diz "não" — baixinho, só com o rosto e a mão
    J.vira = 1; J.pose = 'mao'; await esperar(500);
    G.textoEm(J.x + 8, J.y - 62, '…não.', '#E8E2D0', 10); await esperar(1300);
    for (const a of anjos) { a.guarda = true; a.curva = true; } sfx('key');
    await esperar(1500);
    for (const a of anjos) { a.some = a.alfa; a.someVel = 0.5; }
    J.pose = null; await esperar(800);
    // "Basta!" — e cura a orelha do homem que vinha prendê-lo
    await disse(G, 'j', '"Basta! Deixai-os." (Lc 22:51)');
    J.indo = malco.x + 22; J.poseDepois = 'mao'; await chega(J); J.vira = -1;
    G.efeito('cura', malco.x, malco.y, 1, { gruda: malco }); G.fx.sobe(malco.x, malco.y - 30, 14, '#FFF1BE'); sfx('level'); G.clarao = 0.12; malco.ferido = false;
    await esperar(1200);
    await narra(G, 'E, tocando-lhe a orelha, o curou (Lc 22:51).\n\nA última cura antes da cruz foi num homem que tinha vindo prendê-lo.', 'Continuar');
    malco.pose = null; J.pose = null;
    if (pedro) { J.vira = 1; await disse(G, 'j', 'Pedro, "mete a tua espada na bainha; não beberei eu o cálice que o Pai me deu?" (Jo 18:11)\n\n"Todos os que lançarem mão da espada, à espada morrerão" (Mt 26:52).'); pedro.pose = null; }
    // os discípulos fogem
    for (const d of discs) { d.vel = 150; d.indo = d.x + 900; d.some = 1; d.someVel = 0.45; }
    await narra(G, 'Então, deixando-o, todos fugiram (Mc 14:50).', 'Continuar');
    // amarram-no e o levam; antes de ir, ele olha para você
    G.textoEm(J.x, J.y - 70, 'prenderam Jesus e o manietaram (Jo 18:12)', '#C9C4B2', 11);
    await esperar(1600);
    J.vira = p.x < J.x ? -1 : 1; await esperar(1400); J.vira = -1;
    for (const o of [J, ...solds, judas, malco]) { o.vel = 34; o.indo = o.x - 520; }
    await esperar(3200);
    J.some = 1; J.someVel = 0.35; for (const o of [...solds, judas, malco]) { o.some = 1; o.someVel = 0.35; }
    await esperar(3200);
    await narra(G, 'Você não o vê mais. Só o brilho das tochas, descendo o monte em direção à cidade.\n\nE, muito longe, um galo que ainda não cantou.', 'Fechar os olhos');
    cm.getsemani = true; G.salvar(); marco('getsemani');
    G.cena = false; G.entrar('getsemani', { quieto: true });
    const pedra = G.objs.find(o => o.tipo === 'rocha'), q = G.p; if (pedra) { q.x = pedra.x - 70; q.y = pedra.y - 1; q.face = 1; q.orando = 0; G.vista.cam.x = q.x - G.vista.W / G.vista.Z / 2; G.prenderCam(); }
    await esperar(1400);
    await narra(G, 'Quando você abre os olhos, já é manhã.\n\nO jardim está vazio. Sobre a pedra onde ele orou, alguém deixou um livro aberto.', 'Levantar');
    G.ovo('getsemani', 'Vigiai e orai, para que não entreis em tentação (Mt 26:41).');
  } finally { G.cena = false; G.cenaFoco = null; document.body.classList.remove('em-cena', 'cena-cinema'); cinema(false); G.cenaCls = false; G.cenaAjoelha = false; G.cenaMx = 0; G.escuroAlvo = 0; if (G.running) music(musicaAntes || 'mundo', chaveAntes); }
}

export async function lerBiblia(G) {
  const paginas = [
    'Naquela mesma manhã, levaram-no a Pilatos. Ele foi açoitado, coroado de espinhos e carregou a cruz até o lugar chamado Caveira (Jo 19:1-17).',
    '"Ele foi traspassado pelas nossas transgressões e moído pelas nossas iniquidades; o castigo que nos traz a paz estava sobre ele, e pelas suas pisaduras fomos sarados" (Is 53:5).',
    'Pregado no madeiro, ele ainda orou pelos que o feriam: "Pai, perdoa-lhes, porque não sabem o que fazem" (Lc 23:34).',
    'E, inclinando a cabeça, disse: "Está consumado" (Jo 19:30). A dívida que ninguém podia pagar estava paga.',
    'Mas no primeiro dia da semana, bem cedo, as mulheres foram ao sepulcro e o encontraram vazio. "Ele não está aqui; ressuscitou, como tinha dito" (Mt 28:6).',
    '"Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna" (Jo 3:16).',
    'Ele foi ao encontro da cruz para que você — e todos — fossem perdoados.\n\nA cruz foi o preço. O túmulo vazio é a promessa.'
  ];
  for (let i = 0; i < paginas.length; i++) await G.ui.dialog({ nome: 'O livro sobre a pedra', texto: paginas[i], acoes: [{ label: i === paginas.length - 1 ? 'Amém' : 'Virar a página' }], cls: 'fala-narra', voz: false });
}

// o encontro vira cinema: vinheta nas bordas e um zoom lento nos dois (sem faixa embaixo: ela cobria o chão e os pés)
let enquadra = null;
function cinema(on, G) {
  let v = document.getElementById('cenaCine');
  if (!v) { v = document.createElement('div'); v.id = 'cenaCine'; v.innerHTML = '<i class="cc-cima"></i><i class="cc-veu"></i>'; document.body.append(v); }
  requestAnimationFrame(() => v.classList.toggle('on', on));
  const cv = document.getElementById('cv'); clearInterval(enquadra); enquadra = null;
  if (!on || !cv || matchMedia('(prefers-reduced-motion: reduce)').matches) { if (cv) { cv.style.transform = ''; cv.style.transformOrigin = ''; } return; }
  // o zoom acompanha os dois: o ponto entre Jesus e o peregrino vai para o meio da tela, sem nunca mostrar a borda do quadro
  const k = 1.45, passo = () => {
    const J = G.cenaFoco, p = G.p, vv = G.vista; if (!J || !p) return;
    const W = cv.clientWidth, H = cv.clientHeight, vw = vv.W / vv.Z, vh = vv.H / vv.Z;
    const ox = ((J.x + p.x) / 2 - vv.cam.x) / vw * W, oy = (p.y - 40 - vv.cam.y) / vh * H;
    const dx = Math.max(-(k - 1) * (W - ox), Math.min((k - 1) * ox, W * 0.5 - ox)), dy = Math.max(-(k - 1) * (H - oy), Math.min((k - 1) * oy, H * 0.66 - oy));
    cv.style.transformOrigin = ox + 'px ' + oy + 'px'; cv.style.transform = 'translate(' + dx + 'px,' + dy + 'px) scale(' + k + ')';
  };
  passo(); enquadra = setInterval(passo, 120);
}
