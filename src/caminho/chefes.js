// Chefes do Caminho: lutas de padrão, em fases, com golpes sempre avisados (dá para aprender e vencer sem levar dano).
// Cada chefe é só dados (CHEFES): a ordem dos golpes em cada fase é fixa, como uma coreografia.
// Três ideias próprias do jogo:
//   • Postura: defesas perfeitas com a lâmpada enchem a barra; cheia, o chefe fica QUEBRANTADO.
//   • Está Escrito: a cada virada de fase o chefe acusa, e a luta para numa pergunta do estudo.
//   • Cada chefe tem uma regra que ensina o texto (fugir da Imoralidade, a luz que desfaz a Mentira, a testa de Golias…).
import { rand, clamp, TAU, pick } from '../util.js';
import { sfx } from '../audio.js';
import { BOSSES } from '../data/bestiary.js';
import { drawBoss } from '../game/boss-art.js';
import { mover } from './corpo.js';

const F = (vida, golpes, extra = {}) => ({ vida, golpes, ...extra });
export const CHEFES = {
  /* ---------- Corinto (Atos 18) ---------- */
  mamom: { vida: 430, r: 40, arena: 'plana', mover: 'perseguir', vel: 70,
    golpes: { fortuna: { tipo: 'rajada', vezes: 3, intervalo: 0.34, cor: '#FFD23F' }, investida: { tipo: 'investida', vel: 560 }, moedas: { tipo: 'chuva', n: 4, vezes: 2, cor: '#FFD23F', tentacao: true },
      salto: { tipo: 'salto' }, chamar: { tipo: 'invocar', tipos: ['ganancia'], n: 2, fala: 'Mais! Mais!' }, dupla: { tipo: 'investida', vel: 620, repete: 1 }, cofre: { tipo: 'leque', n: 9, abertura: 0.22, cor: '#FFD23F', alto: true }, tesouro: { tipo: 'chuva', n: 6, vezes: 2, cor: '#FFD23F', tentacao: true } },
    fases: [F(1, ['fortuna', 'investida', 'moedas', 'salto']), F(0.6, ['chamar', 'dupla', 'tesouro', 'salto', 'fortuna'], { grito: 'TUDO TEM PREÇO!' }), F(0.3, ['cofre', 'dupla', 'salto', 'tesouro'], { grito: 'SIRVA A MIM!' })],
    dica: 'As moedas que ficam no chão pesam: cada uma que você apanha deixa o passo mais lento até o fim da luta.' },
  procrastinacao: { vida: 480, r: 38, arena: 'plat', mover: 'parado', regras: { aura: { raio: 190, lentidao: 0.6 }, regenera: { apos: 3.5, taxa: 0.012 } },
    golpes: { sono: { tipo: 'sono', raio: 170 }, relogio: { tipo: 'relogio', n: 2, giro: 0.95, dur: 3.6 }, atraso: { tipo: 'marcados', vezes: 3 }, relogio3: { tipo: 'relogio', n: 3, giro: -1.2, dur: 4 }, areia: { tipo: 'chuva', n: 5, vezes: 2, cor: '#A5CDCE' },
      atraso4: { tipo: 'marcados', vezes: 4, intervalo: 0.36 }, relogio4: { tipo: 'relogio', n: 4, giro: 1.35, dur: 4.4 }, pendulo: { tipo: 'varredura', vezes: 2, altura: 'alterna' } },
    fases: [F(1, ['sono', 'relogio', 'atraso']), F(0.55, ['relogio3', 'areia', 'sono', 'atraso4'], { grito: 'SÓ MAIS CINCO MINUTINHOS…' }), F(0.25, ['relogio4', 'pendulo', 'atraso4', 'areia'], { grito: 'AMANHÃ! AMANHÃ!' })],
    dica: 'Ela se cura se você parar de bater. Perto dela tudo fica lento: ataque nas brechas do relógio e não espere.' },
  mentira: { vida: 500, r: 34, arena: 'plat', voa: 120, mover: 'pairar', vel: 90,
    golpes: { copias: { tipo: 'clones', n: 3 }, mentiras: { tipo: 'leque', n: 5, cor: '#C79BFF' }, trocar: { tipo: 'teleporte' }, copias5: { tipo: 'clones', n: 5 }, mentiras7: { tipo: 'leque', n: 7, cor: '#C79BFF' }, falsidade: { tipo: 'marcados', vezes: 3 },
      copias6: { tipo: 'clones', n: 6 }, meias: { tipo: 'rajada', vezes: 5, intervalo: 0.24, cor: '#C79BFF' }, anel: { tipo: 'anel', n: 12, cor: '#C79BFF' } },
    fases: [F(1, ['copias', 'mentiras', 'trocar']), F(0.6, ['copias5', 'mentiras7', 'trocar', 'falsidade'], { grito: 'QUAL DE NÓS É O VERDADEIRO?' }), F(0.3, ['copias6', 'trocar', 'meias', 'anel'], { grito: 'NINGUÉM VAI ACREDITAR EM VOCÊ!', escuro: 0.5 })],
    dica: 'Erga a lâmpada: sob a luz as cópias tremem e ficam transparentes. Acertar a verdadeira desfaz todas.' },
  imoralidade: { vida: 520, r: 38, arena: 'plana', mover: 'perseguir', vel: 55, regras: { fuga: true },
    golpes: { cilada: { tipo: 'leque', n: 5, cor: '#FF8FB8' }, encanto: { tipo: 'encanto', dur: 2.4 }, pocas: { tipo: 'pocas', n: 3 }, cauda: { tipo: 'varredura', vezes: 1, altura: 'baixo' }, pocas4: { tipo: 'pocas', n: 4 }, cilada7: { tipo: 'leque', n: 7, cor: '#FF8FB8' },
      caudas: { tipo: 'varredura', vezes: 3, altura: 'alterna' }, anel: { tipo: 'anel', n: 12, cor: '#FF8FB8', meio: true } },
    fases: [F(1, ['cilada', 'encanto', 'pocas']), F(0.55, ['encanto', 'cauda', 'pocas4', 'cilada7'], { grito: 'NINGUÉM ESTÁ OLHANDO…' }), F(0.25, ['encanto', 'caudas', 'anel', 'pocas4'], { grito: 'CHEGUE MAIS PERTO!' })],
    dica: 'Não se vence o encanto de perto: corra para longe (o passo pronto ajuda). Quem foge a deixa exposta. "Fugi da imoralidade" (1Co 6:18).' },
  satanas: { vida: 760, r: 44, arena: 'plat', voa: 150, mover: 'pairar', vel: 110, acusacoes: true,
    golpes: { condenacao: { tipo: 'leque', n: 7, cor: '#FF5A3C' }, fogo: { tipo: 'rajada', vezes: 4, intervalo: 0.3, cor: '#FF5A3C' }, abismo: { tipo: 'chuva', n: 5, vezes: 2, cor: '#FF5A3C' }, queda: { tipo: 'mergulho' }, anel: { tipo: 'anel', n: 12, cor: '#FF5A3C' },
      foice: { tipo: 'varredura', vezes: 2, altura: 'alterna' }, abismo7: { tipo: 'chuva', n: 7, vezes: 2, cor: '#FF5A3C' }, sumir: { tipo: 'teleporte' }, condenacao9: { tipo: 'leque', n: 9, cor: '#FF5A3C' }, medos: { tipo: 'invocar', tipos: ['medo', 'duvida'], n: 2, fala: 'Você não merece estar aqui!' },
      anel16: { tipo: 'anel', n: 16, cor: '#FF5A3C' }, foice3: { tipo: 'varredura', vezes: 3, altura: 'alterna' }, fogo6: { tipo: 'rajada', vezes: 6, intervalo: 0.24, cor: '#FF5A3C' } },
    fases: [F(1, ['condenacao', 'fogo', 'abismo']), F(0.75, ['queda', 'anel', 'foice', 'fogo'], { grito: 'EU ACUSO VOCÊ DIA E NOITE!' }), F(0.5, ['abismo7', 'sumir', 'condenacao9', 'queda', 'medos'], { grito: 'CULPADO!' }), F(0.25, ['anel16', 'foice3', 'queda', 'abismo7', 'fogo6'], { grito: 'VOCÊ É MEU!', escuro: 0.35 })],
    dica: 'A cada quarto da vida ele acusa. Responda com o que está escrito: a resposta certa o quebranta.' },
  /* ---------- Jonas ---------- */
  fuga: { vida: 380, r: 36, arena: 'plana', mover: 'rodear', vel: 110,
    golpes: { deriva: { tipo: 'investida', vel: 520, repete: 1, fala: 'Sempre há outro navio…' }, cartas: { tipo: 'leque', n: 3, cor: '#79D9CD' }, sumir: { tipo: 'teleporte' }, rotas: { tipo: 'anel', n: 10, cor: '#79D9CD', meio: true }, cartas5: { tipo: 'leque', n: 5, cor: '#79D9CD' }, salto: { tipo: 'salto' } },
    fases: [F(1, ['deriva', 'cartas', 'sumir']), F(0.5, ['rotas', 'deriva', 'cartas5', 'sumir', 'salto'], { grito: 'FUGIR NÃO MUDA O CHAMADO!' })],
    dica: 'Ele sempre escapa para o lado oposto. Espere a investida passar e golpeie pelas costas.' },
  pavor: { vida: 420, r: 36, arena: 'plat', voa: 130, mover: 'pairar', vel: 100,
    golpes: { ondas: { tipo: 'varredura', vezes: 1, altura: 'baixo', cor: '120,210,245' }, relampagos: { tipo: 'chuva', n: 4, vezes: 2, cor: '#F4E6AE' }, vento: { tipo: 'leque', n: 5, cor: '#94D9F5' }, queda: { tipo: 'mergulho' }, raios6: { tipo: 'chuva', n: 6, vezes: 3, cor: '#F4E6AE' }, vagas: { tipo: 'varredura', vezes: 3, altura: 'alterna', cor: '120,210,245' } },
    fases: [F(1, ['ondas', 'vento', 'relampagos']), F(0.5, ['queda', 'raios6', 'vagas', 'vento'], { grito: 'O MEDO QUER DECIDIR POR VOCÊ!' })],
    dica: 'Observe os avisos: sempre há um lugar seguro no convés. O pânico erra o pulo.' },
  desespero: { vida: 460, r: 36, arena: 'plat', voa: 120, mover: 'pairar', vel: 80, escuro: 0.55,
    golpes: { ecos: { tipo: 'anel', n: 10, cor: '#B6A0E6' }, clamor: { tipo: 'rajada', vezes: 3, intervalo: 0.4, cor: '#C6B8FA' }, correntes: { tipo: 'pocas', n: 3, cor: '143,120,200' }, pesos: { tipo: 'marcados', vezes: 3 }, ecos14: { tipo: 'anel', n: 14, cor: '#B6A0E6' }, sumir: { tipo: 'teleporte' }, clamor5: { tipo: 'rajada', vezes: 5, intervalo: 0.3, cor: '#C6B8FA' } },
    fases: [F(1, ['ecos', 'clamor', 'correntes']), F(0.5, ['pesos', 'ecos14', 'sumir', 'clamor5'], { grito: 'AQUI NINGUÉM PODE OUVIR VOCÊ…' })],
    dica: 'No ventre quase não há luz: guarde azeite. Orar no abismo é exatamente o que Jonas fez (Jn 2:2).' },
  violencia: { vida: 500, r: 40, arena: 'plana', mover: 'perseguir', vel: 60,
    golpes: { correntes: { tipo: 'estocada', alcance: 200 }, estrondo: { tipo: 'ondas', vezes: 2 }, pedras: { tipo: 'chuva', n: 4, vezes: 2, cor: '#E9AD7F' }, arrasto: { tipo: 'investida', vel: 540 }, estrondo3: { tipo: 'ondas', vezes: 3 }, pedras6: { tipo: 'chuva', n: 6, vezes: 2, cor: '#E9AD7F' }, salto: { tipo: 'salto' } },
    fases: [F(1, ['correntes', 'estrondo', 'pedras']), F(0.5, ['arrasto', 'correntes', 'estrondo3', 'pedras6', 'salto'], { grito: 'NADA MUDA NESTA CIDADE!' })],
    dica: 'A corrente é lenta e reta: erga a lâmpada no instante do golpe para quebrar a postura dele.' },
  ressentimento: { vida: 550, r: 40, arena: 'plat', mover: 'parado',
    golpes: { espinhos: { tipo: 'leque', n: 5, cor: '#D6C77B' }, calor: { tipo: 'marcados', vezes: 3 }, amargura: { tipo: 'anel', n: 10, cor: '#C9A16C', meio: true }, vento: { tipo: 'varredura', vezes: 2, altura: 'alterna', cor: '233,187,122' }, folhas: { tipo: 'chuva', n: 5, vezes: 2, cor: '#B49C65' }, amargura14: { tipo: 'anel', n: 14, cor: '#C9A16C', meio: true }, calor4: { tipo: 'marcados', vezes: 4, intervalo: 0.38 } },
    fases: [F(1, ['espinhos', 'calor', 'amargura']), F(0.5, ['vento', 'folhas', 'amargura14', 'calor4'], { grito: 'COMPAIXÃO PARA ELES? NUNCA!' })],
    dica: 'Ele não sai do lugar: a raiz da amargura não anda. Chegue perto entre um anel e outro.' },
  /* ---------- Daniel 4 ---------- */
  encantadores: { vida: 440, r: 36, arena: 'plat', voa: 125, mover: 'pairar', vel: 90,
    golpes: { astros: { tipo: 'chuva', n: 5, vezes: 2, cor: '#B9C7F5' }, enigma: { tipo: 'clones', n: 3 }, fumaca: { tipo: 'pocas', n: 3, cor: '120,130,190' }, zodiaco: { tipo: 'anel', n: 12, cor: '#B9C7F5' }, enigma4: { tipo: 'clones', n: 4 }, astros7: { tipo: 'chuva', n: 7, vezes: 2, cor: '#B9C7F5' }, sumir: { tipo: 'teleporte' } },
    fases: [F(1, ['astros', 'enigma', 'fumaca']), F(0.5, ['zodiaco', 'enigma4', 'astros7', 'sumir'], { grito: 'NÓS LEMOS AS ESTRELAS!' })],
    dica: 'Magos, encantadores e caldeus não souberam explicar o sonho (Dn 4:7). A luz mostra qual deles é só fumaça.' },
  jugo: { vida: 500, r: 42, arena: 'plana', mover: 'perseguir', vel: 58,
    golpes: { correntes: { tipo: 'estocada', alcance: 210 }, passo: { tipo: 'ondas', vezes: 2 }, arrasto: { tipo: 'investida', vel: 520 }, cobrar: { tipo: 'invocar', tipos: ['ganancia', 'orgulho'], n: 2, fala: 'Trabalhem! Mais tijolos!' }, salto: { tipo: 'salto' }, tijolos: { tipo: 'chuva', n: 5, vezes: 2, cor: '#C98E62' }, correntes2: { tipo: 'estocada', alcance: 230, repete: 1 } },
    fases: [F(1, ['correntes', 'passo', 'arrasto']), F(0.5, ['cobrar', 'salto', 'correntes2', 'tijolos'], { grito: 'OS FRACOS SUSTENTAM O TRONO!' })],
    dica: '"Põe termo às tuas iniquidades, usando de misericórdia para com os pobres" (Dn 4:27). A corrente quebra na defesa perfeita.' },
  babilonia: { vida: 620, r: 46, arena: 'plat', mover: 'parado',
    golpes: { tijolos: { tipo: 'chuva', n: 6, vezes: 2, cor: '#E0B45A' }, brilho: { tipo: 'varredura', vezes: 1, altura: 'alto', cor: '255,214,120' }, decreto: { tipo: 'leque', n: 7, cor: '#FFD67A' }, gloria: { tipo: 'anel', n: 14, cor: '#FFD67A', meio: true }, brilhos: { tipo: 'varredura', vezes: 3, altura: 'alterna', cor: '255,214,120' }, tijolos8: { tipo: 'chuva', n: 8, vezes: 2, cor: '#E0B45A' }, selos: { tipo: 'marcados', vezes: 4, intervalo: 0.38 },
      voz: { tipo: 'chuva', n: 10, vezes: 3, cor: '#FFFFFF' }, gloria18: { tipo: 'anel', n: 18, cor: '#FFD67A', meio: true }, brilhos4: { tipo: 'varredura', vezes: 4, altura: 'alterna', cor: '255,214,120' } },
    fases: [F(1, ['tijolos', 'brilho', 'decreto']), F(0.6, ['gloria', 'brilhos', 'tijolos8', 'selos'], { grito: 'NÃO É ESTA A GRANDE BABILÔNIA QUE EU EDIFIQUEI?' }), F(0.25, ['voz', 'gloria18', 'brilhos4'], { grito: 'AINDA ESTAVA A PALAVRA NA BOCA DO REI…' })],
    dica: 'Tudo aqui diz "eu". Na última fase quem fala é a voz do céu (Dn 4:31): não ataque, apenas atravesse a sentença.' },
  fera: { vida: 540, r: 40, arena: 'plana', mover: 'rodear', vel: 130,
    golpes: { arranco: { tipo: 'investida', vel: 600, repete: 1 }, bote: { tipo: 'salto' }, garras: { tipo: 'leque', n: 5, cor: '#B7C7A0' }, urro: { tipo: 'urro', raio: 190 }, arranco2: { tipo: 'investida', vel: 660, repete: 2 }, orvalho: { tipo: 'chuva', n: 5, vezes: 2, cor: '#A9D6E8' } },
    fases: [F(1, ['arranco', 'bote', 'garras']), F(0.5, ['urro', 'arranco2', 'bote', 'orvalho', 'garras'], { grito: 'SETE TEMPOS… SETE TEMPOS…' })],
    dica: 'É o rei, sem razão de homem (Dn 4:33). Não é um monstro a destruir: resista até que ele levante os olhos ao céu.' },
  soberba: { vida: 780, r: 44, arena: 'plat', voa: 150, mover: 'pairar', vel: 110, acusacoes: true,
    golpes: { cetro: { tipo: 'leque', n: 7, cor: '#F1C96A' }, queda: { tipo: 'mergulho' }, coroa: { tipo: 'anel', n: 12, cor: '#F1C96A' }, sumir: { tipo: 'teleporte' }, edito: { tipo: 'varredura', vezes: 2, altura: 'alterna', cor: '241,201,106' }, ouro: { tipo: 'chuva', n: 6, vezes: 2, cor: '#F1C96A' }, eu: { tipo: 'rajada', vezes: 5, intervalo: 0.26, cor: '#F1C96A' },
      estatuas: { tipo: 'clones', n: 4 }, coroa16: { tipo: 'anel', n: 16, cor: '#F1C96A' }, selos: { tipo: 'marcados', vezes: 4, intervalo: 0.36 }, ouro9: { tipo: 'chuva', n: 9, vezes: 3, cor: '#F1C96A' }, edito4: { tipo: 'varredura', vezes: 4, altura: 'alterna', cor: '241,201,106' }, coroa18: { tipo: 'anel', n: 18, cor: '#F1C96A' } },
    fases: [F(1, ['cetro', 'queda', 'coroa']), F(0.75, ['sumir', 'edito', 'ouro', 'eu'], { grito: 'PELA FORÇA DO MEU PODER!' }), F(0.5, ['estatuas', 'coroa16', 'queda', 'selos'], { grito: 'PARA GLÓRIA DA MINHA MAJESTADE!' }), F(0.25, ['ouro9', 'edito4', 'coroa18', 'queda'], { grito: 'QUEM ME DIRÁ: QUE FAZES?', escuro: 0.35 })],
    dica: '"Aos que andam na soberba ele pode humilhar" (Dn 4:37). Responda às bravatas com o texto.' },
  /* ---------- chefes do mundo ---------- */
  golias: { vida: 1250, pressa: 0.7, r: 52, arena: 'plana', mover: 'perseguir', vel: 66, regras: { armadura: 0.1 },
    golpes: { lanca: { tipo: 'estocada', alcance: 230, expoe: true }, pisao: { tipo: 'ondas', vezes: 2 }, dardos: { tipo: 'rajada', vezes: 3, intervalo: 0.3, cor: '#C9B48A' }, medo: { tipo: 'invocar', tipos: ['medo'], n: 2, fala: 'Tremam, servos de Saul!' }, salto: { tipo: 'salto' }, lanca2: { tipo: 'estocada', alcance: 240, expoe: true, repete: 1 }, arranco: { tipo: 'investida', vel: 500 }, pisao3: { tipo: 'ondas', vezes: 3 } },
    fases: [F(1, ['lanca', 'pisao', 'dardos']), F(0.6, ['medo', 'lanca', 'salto', 'dardos'], { grito: 'SOU EU ALGUM CÃO?' }), F(0.3, ['lanca2', 'arranco', 'pisao3'], { grito: 'GOLIAS AVANÇA!' })],
    dica: 'A armadura absorve quase tudo. Só a defesa perfeita contra a lança expõe a testa do gigante (1Sm 17:49).' },
  behemote: { vida: 3600, dano: 2, pressa: 0.5, r: 104, arena: 'plana', mover: 'perseguir', vel: 46, regras: { casco: 0.3 },
    golpes: { investida: { tipo: 'investida', vel: 640, repete: 1, tonto: 2.6 }, terremoto: { tipo: 'ondas', vezes: 3 }, pedras: { tipo: 'chuva', n: 6, vezes: 2, cor: '#A8946E' }, investida2: { tipo: 'investida', vel: 700, repete: 2, tonto: 2.6 }, salto: { tipo: 'salto' }, pedras8: { tipo: 'chuva', n: 8, vezes: 3, cor: '#A8946E' }, urro: { tipo: 'urro', raio: 210 } },
    fases: [F(1, ['investida', 'terremoto', 'pedras']), F(0.5, ['investida2', 'salto', 'pedras8', 'urro'], { grito: 'O CHÃO TREME!' })],
    dica: 'Os ossos dele são como tubos de bronze (Jó 40:18). Faça-o bater na parede: tonto, o casco se abre.' },
  leviata: { vida: 3300, dano: 2, pressa: 0.45, r: 82, regras: { armadura: 0.45 }, arena: 'alta', voa: 60, mover: 'pairar', vel: 150,
    golpes: { jatos: { tipo: 'rajada', vezes: 5, intervalo: 0.26, cor: '#5ED1E8' }, cauda: { tipo: 'varredura', vezes: 1, altura: 'baixo', cor: '94,209,232' }, mergulho: { tipo: 'mergulho' }, anel: { tipo: 'anel', n: 14, cor: '#5ED1E8' }, caudas: { tipo: 'varredura', vezes: 3, altura: 'alterna', cor: '94,209,232' }, chuva: { tipo: 'chuva', n: 6, vezes: 2, cor: '#5ED1E8' }, jatos7: { tipo: 'rajada', vezes: 7, intervalo: 0.22, cor: '#5ED1E8' }, anel18: { tipo: 'anel', n: 18, cor: '#5ED1E8' } },
    fases: [F(1, ['jatos', 'cauda', 'mergulho']), F(0.6, ['mergulho', 'anel', 'caudas', 'chuva'], { grito: 'A MARÉ SE ERGUE!' }), F(0.3, ['mergulho', 'jatos7', 'anel18', 'caudas', 'mergulho'], { grito: 'O MAR FERVE!' })],
    dica: '"Poderás tirar com anzol o Leviatã?" (Jó 41:1). Ele só fica ao alcance logo depois de emergir.' }
};

const bala = (G, x, y, a, vel, o = {}) => G.tiros.push({ x, y, vx: Math.cos(a) * vel, vy: Math.sin(a) * vel, r: 8, vida: 4.5, cor: '#FFD23F', tipo: 'bola', ...o });
const centro = b => ({ x: b.x, y: b.y - b.h * 0.55 });
const mira = (G, b) => { const c = centro(b); return Math.atan2(G.p.y - 20 - c.y, G.p.x - c.x); };

export function novoChefe(id, A, dif) {
  const c = CHEFES[id], d = BOSSES[id] || { nome: id };
  const hp = Math.round(c.vida * dif.hp);
  return { kind: 'chefe', id, c, d, x: clamp(A.cx + 250, A.x0 + 80, A.x1 - 80), y: A.chao - (c.voa || 0), vx: 0, vy: 0, w: c.r * 1.5, h: c.r * 2.1, r: c.r, hp, max: hp, fase: 0, post: 0, postT: 0, quebrado: 0,
    mov: null, idx: 0, espera: 1.8, flash: 0, face: -1, voa: !!c.voa, exposto: 0, clones: [], furia: 0, semDano: 0, alpha: 1, raios: null, tonto: 0, ultimoGolpe: 0, t: 0,
    art: { id, d, r: c.r, x: 0, y: 0, flash: 0, stun: 0, hp, max: hp, spd: c.vel || 60 } };
}

/* ---------------- golpes ---------------- */
// cada golpe devolve true quando termina. m = { t, e, def }
const GOLPES = {
  investida(G, b, m, dt) {
    const A = G.N.arena, d = m.def;
    if (m.e === 0) { if (m.t === 0) { b.face = Math.sign(G.p.x - b.x) || 1; if (d.fala) G.fala(b, d.fala); } b.vx = 0; b.art.step = 1; b.tele = 1; if (Math.random() < dt * 30) G.fx.po(b.x - b.face * 20, b.y, 1, '#C9D2C4'); if (m.t > 0.72 * G.dif.aviso) { m.e = 1; m.t = 0; sfx('dodge'); } }
    else if (m.e === 1) {
      b.art.step = 2; b.vx = b.face * d.vel * G.dif.vel; b.perigo = true;
      if (b.parede === b.face || b.x < A.x0 + b.w / 2 + 6 || b.x > A.x1 - b.w / 2 - 6 || m.t > 1.7) {
        b.vx = 0; G.tremor(7); sfx('block'); G.fx.po(b.x + b.face * b.w / 2, b.y - 20, 12, '#C9D2C4'); m.e = 2; m.t = 0;
        if (d.tonto && !(m.rep < (d.repete || 0))) { b.tonto = d.tonto; G.textoEm(b.x, b.y - b.h - 10, 'TONTO!', '#FFE9A8'); }
      }
    }
    else { b.perigo = false; if (m.t > 0.5) { if ((m.rep = (m.rep || 0) + 1) <= (d.repete || 0)) { m.e = 0; m.t = 0; return false; } return true; } }
    return false;
  },
  salto(G, b, m, dt) {
    const A = G.N.arena;
    if (m.e === 0) { b.vx = 0; b.art.step = 1; b.tele = 1; if (m.t > 0.5 * G.dif.aviso) { m.e = 1; m.t = 0; const tx = clamp(G.p.x, A.x0 + b.w, A.x1 - b.w); b.vy = -960; b.vx = (tx - b.x) / 0.94; b.chao = false; sfx('dodge'); } }
    else if (m.e === 1) { b.art.step = 2; b.perigo = true; if (b.chao && m.t > 0.2) { b.vx = 0; m.e = 2; m.t = 0; choque(G, b); } }
    else { b.perigo = false; if (m.t > 0.65) return true; }
    return false;
  },
  ondas(G, b, m, dt) {
    b.vx = 0;
    if (m.e === 0) { b.art.step = 1; b.tele = 1; if (m.t > 0.5 * G.dif.aviso) { m.e = 1; m.t = 0; choque(G, b); m.n = (m.n || 0) + 1; } }
    else { b.art.step = 2; if (m.t > 0.55) { if (m.n < (m.def.vezes || 2)) { m.e = 0; m.t = 0; } else return true; } }
    return false;
  },
  leque(G, b, m) {
    b.vx *= 0.9; b.art.step = 1; b.tele = 1;
    if (m.t > 0.62 * G.dif.aviso) {
      const d = m.def, c = centro(b), a0 = d.alto ? -Math.PI / 2 : mira(G, b), n = d.n || 5, ab = d.abertura || 0.2;
      for (let i = 0; i < n; i++) bala(G, c.x, c.y, a0 + (i - (n - 1) / 2) * ab, (d.vel || 300) * G.dif.vel, { cor: d.cor, g: d.alto ? 620 : 0 });
      sfx('shoot'); b.art.artAttack = (b.art.artAttack || 0) + 1; return true;
    }
    return false;
  },
  rajada(G, b, m) {
    const d = m.def; b.vx *= 0.9;
    if (m.e === 0) { b.art.step = 1; b.tele = 1; if (m.t > 0.5 * G.dif.aviso) { m.e = 1; m.t = 0; m.n = 0; m.prox = 0; } }
    else { b.art.step = 2; if (m.t >= m.prox) { const c = centro(b); bala(G, c.x, c.y, mira(G, b) + rand(-0.04, 0.04), (d.vel || 330) * G.dif.vel, { cor: d.cor, r: 7 }); sfx('shoot'); m.n++; m.prox = m.t + (d.intervalo || 0.3); if (m.n >= (d.vezes || 3)) return true; } }
    return false;
  },
  anel(G, b, m) {
    b.vx *= 0.9; b.art.step = 1; b.tele = 1;
    if (m.t > 0.75 * G.dif.aviso) {
      const d = m.def, c = centro(b), n = d.n || 12, off = (b.ultimoGolpe++ % 2) * Math.PI / n;
      for (let i = 0; i < n; i++) { const a = off + i * TAU / n; if (d.meio && Math.sin(a) > 0.25) continue; bala(G, c.x, c.y, a, (d.vel || 230) * G.dif.vel, { cor: d.cor }); }
      sfx('magic'); G.tremor(3); return true;
    }
    return false;
  },
  chuva(G, b, m) {
    const d = m.def, A = G.N.arena; b.vx *= 0.9; b.art.step = m.t < 0.4 ? 1 : 2;
    if (m.t === 0) { m.n = 0; m.prox = 0.35; }
    if (m.t >= m.prox && m.n < (d.vezes || 2)) {
      m.n++; m.prox = m.t + 0.78;
      const cols = new Set([Math.round((G.p.x - A.x0) / 60)]), max = Math.floor((A.x1 - A.x0) / 60);
      while (cols.size < Math.min(d.n || 4, max - 2)) cols.add(Math.floor(rand(0, max)));
      for (const k of cols) G.zonas.push({ tipo: 'col', x: A.x0 + k * 60 + 30, w: 44, aviso: 0.85 * G.dif.aviso, dur: 0.22, cor: d.cor || '#FFD23F', tentacao: d.tentacao });
      sfx('shoot');
    }
    return m.n >= (d.vezes || 2) && m.t > m.prox + 0.35;
  },
  marcados(G, b, m) {
    const d = m.def; b.vx *= 0.9; b.art.step = 1;
    if (m.t === 0) { m.n = 0; m.prox = 0.25; }
    if (m.t >= m.prox && m.n < (d.vezes || 3)) { m.n++; m.prox = m.t + (d.intervalo || 0.45); G.zonas.push({ tipo: 'circ', x: G.p.x + G.p.vx * 0.2, y: G.p.y - 18, r: 56, aviso: 0.8 * G.dif.aviso, dur: 0.2, cor: b.d.cor || '#C79BFF' }); sfx('click'); }
    return m.n >= (d.vezes || 3) && m.t > m.prox + 0.6;
  },
  pocas(G, b, m) {
    b.vx *= 0.9; b.art.step = 1; b.tele = 1;
    if (m.t > 0.55) {
      const A = G.N.arena, n = m.def.n || 3;
      for (let i = 0; i < n; i++) { const x = clamp(G.p.x + (i - (n - 1) / 2) * 130 + rand(-20, 20), A.x0 + 50, A.x1 - 50); G.zonas.push({ tipo: 'poca', x: x - 46, y: A.chao - 14, w: 92, h: 14, aviso: 0.8, dur: 3.4, cor: m.def.cor || '210,65,110' }); }
      sfx('magic'); return true;
    }
    return false;
  },
  varredura(G, b, m) {
    const d = m.def, A = G.N.arena; b.vx *= 0.9; b.art.step = 1;
    if (m.t === 0) { m.n = 0; m.prox = 0.2; }
    if (m.t >= m.prox && m.n < (d.vezes || 1)) {
      const baixo = d.altura === 'baixo' || (d.altura === 'alterna' && (m.n + b.ultimoGolpe) % 2 === 0); m.n++; m.prox = m.t + 1.05;
      G.zonas.push({ tipo: 'faixa', y: baixo ? A.chao - 30 : A.chao - 190, h: baixo ? 30 : 136, x: A.x0, w: A.x1 - A.x0, aviso: 0.9 * G.dif.aviso, dur: 0.3, cor: d.cor || '255,90,60', baixo });
      sfx('swing');
    }
    if (m.n >= (d.vezes || 1) && m.t > m.prox + 0.2) { b.ultimoGolpe++; return true; }
    return false;
  },
  invocar(G, b, m) {
    b.vx = 0; b.art.step = 1; b.tele = 1;
    if (m.t === 0 && m.def.fala) G.fala(b, m.def.fala);
    if (m.t > 0.7) {
      const A = G.N.arena, vivos = G.inimigos.filter(e => e.kind === 'vicio').length;
      for (let i = 0; i < Math.max(0, Math.min(m.def.n || 2, 3 - vivos)); i++) { const x = i % 2 ? A.x0 + 70 : A.x1 - 70; G.nascer(pick(m.def.tipos), x, A.chao - 4, true); G.fx.po(x, A.chao - 20, 12, b.d.cor || '#fff'); }
      sfx('boss'); return true;
    }
    return false;
  },
  teleporte(G, b, m) {
    const A = G.N.arena; b.vx = 0;
    if (m.e === 0) { b.alpha = Math.max(0, 1 - m.t / 0.3); b.semDano = 0.2; if (m.t > 0.3) { m.e = 1; m.t = 0; const lado = G.p.x > A.cx ? -1 : 1; b.x = A.cx + lado * rand(170, 320); if (b.voa) b.y = A.chao - b.c.voa - rand(0, 60); G.fx.po(b.x, b.y - 40, 14, b.d.cor || '#C79BFF'); sfx('magic'); } }
    else { b.alpha = Math.min(1, m.t / 0.3); if (m.t > 0.45) { b.alpha = 1; return true; } }
    return false;
  },
  clones(G, b, m) {
    const A = G.N.arena, n = m.def.n || 3; b.vx = 0;
    if (m.e === 0) { b.alpha = Math.max(0, 1 - m.t / 0.35); b.semDano = 0.2; if (m.t > 0.35) {
      m.e = 1; m.t = 0; b.clones = [];
      const vagas = Array.from({ length: n + 1 }, (_, i) => ({ x: A.x0 + 70 + i * (A.x1 - A.x0 - 140) / n, y: A.chao - (b.voa ? b.c.voa + (i % 2) * 70 : 0) })), real = Math.floor(rand(0, n + 1));
      vagas.forEach((v, i) => { if (i === real) { b.x = v.x; b.y = v.y; } else b.clones.push({ x: v.x, y: v.y, t: 6.5, alpha: 0, art: { ...b.art } }); });
      G.fala(b, 'Qual é o verdadeiro?'); sfx('magic');
    } }
    else if (m.e === 1) { b.alpha = Math.min(1, m.t / 0.4); for (const c of b.clones) c.alpha = b.alpha; b.tele = 1; if (m.t > 1.25 * G.dif.aviso) { m.e = 2; m.t = 0; for (const o of [b, ...b.clones]) { const cx = o.x, cy = o.y - b.h * 0.55, a = Math.atan2(G.p.y - 20 - cy, G.p.x - cx); for (let i = -1; i <= 1; i++) bala(G, cx, cy, a + i * 0.2, 270 * G.dif.vel, { cor: b.d.cor || '#C79BFF' }); } sfx('shoot'); } }
    else if (m.t > 1.4) return true;
    return false;
  },
  encanto(G, b, m, dt) {
    const d = m.def; b.vx = 0; b.art.step = 1; b.art.talk = true;
    if (m.t === 0) { G.fala(b, 'Chegue mais perto…'); m.fugiu = false; sfx('magic'); }
    G.puxao = { x: b.x, f: 210 }; b.encanta = true;
    if (G.p.dashT > 0 && Math.sign(G.p.dashDir) === Math.sign(G.p.x - b.x)) m.fugiu = true;
    if (m.t > (d.dur || 2.4)) {
      b.encanta = false; b.art.talk = false; G.puxao = null;
      const longe = Math.abs(G.p.x - b.x) > 300;
      if (m.fugiu || longe) { G.postura(b, 55); b.exposto = 2.6; G.textoEm(b.x, b.y - b.h - 12, 'Você fugiu! Ela está exposta', '#FFE9A8'); sfx('parry'); }
      return true;
    }
    return false;
  },
  estocada(G, b, m) {
    const d = m.def; b.vx = 0;
    if (m.e === 0) { if (m.t === 0) b.face = Math.sign(G.p.x - b.x) || 1; b.art.step = 1; b.art.lanca = 'prep'; b.tele = 1; if (m.t > 0.72 * G.dif.aviso) { m.e = 1; m.t = 0; b.art.lanca = 'golpe'; sfx('swing');
      const w = d.alcance || 200; G.zonas.push({ tipo: 'ret', x: b.face > 0 ? b.x : b.x - w, y: b.y - 54, w, h: 40, aviso: 0, dur: 0.16, cor: '#E5C58A', lanca: true, dono: b, expoe: d.expoe }); } }
    else if (m.e === 1) { b.art.step = 2; if (m.t > 0.3) { m.e = 2; m.t = 0; b.art.lanca = null; } }
    else if (m.t > 0.55) { if ((m.rep = (m.rep || 0) + 1) <= (d.repete || 0)) { m.e = 0; m.t = 0; return false; } return true; }
    return false;
  },
  mergulho(G, b, m, dt) {
    const A = G.N.arena, alto = A.chao - (b.c.voa || 120);
    if (m.e === 0) { b.vx *= 0.9; b.art.step = 1; b.y -= 150 * dt; b.alpha = Math.max(0, 1 - m.t / 0.45); b.semDano = 0.2; if (m.t > 0.45) { m.e = 1; m.t = 0; m.x = clamp(G.p.x, A.x0 + 60, A.x1 - 60); G.zonas.push({ tipo: 'col', x: m.x, w: b.w * 1.1, aviso: 0.8 * G.dif.aviso, dur: 0.25, cor: b.d.cor || '#FF5A3C' }); } }
    else if (m.e === 1) { b.semDano = 0.2; if (m.t > 0.8 * G.dif.aviso) { m.e = 2; m.t = 0; b.x = m.x; b.y = A.y0 + 40; b.alpha = 1; b.perigo = true; sfx('dodge'); } }
    else if (m.e === 2) { b.art.step = 2; b.y += 1350 * dt; if (b.y >= A.chao) { b.y = A.chao; m.e = 3; m.t = 0; b.perigo = false; G.tremor(8); choque(G, b); } }
    else { // fica no chão um instante: é a brecha
      if (m.t > 1.15) { b.y -= 260 * dt; if (b.y <= alto) { b.y = alto; return true; } }
    }
    return false;
  },
  sono(G, b, m) {
    b.vx = 0; b.art.step = 1; b.tele = 1;
    if (m.t === 0) { G.fala(b, 'Descanse só um pouquinho…'); G.zonas.push({ tipo: 'circ', x: b.x, y: b.y - 40, r: m.def.raio || 170, aviso: 1.25 * G.dif.aviso, dur: 0.2, cor: '#A5CDCE', efeito: 'sono' }); }
    return m.t > 1.6;
  },
  urro(G, b, m) {
    b.vx = 0; b.art.step = 1; b.tele = 1;
    if (m.t === 0) G.zonas.push({ tipo: 'circ', x: b.x, y: b.y - 40, r: m.def.raio || 200, aviso: 0.85 * G.dif.aviso, dur: 0.2, cor: b.d.cor || '#D5BA88', efeito: 'empurra' });
    if (m.t > 0.85 * G.dif.aviso && !m.fez) { m.fez = true; G.tremor(9); sfx('boss'); }
    return m.t > 1.5;
  },
  relogio(G, b, m, dt) {
    const d = m.def; b.vx = 0; b.art.step = 1;
    if (m.t === 0) { b.raios = { a: rand(0, TAU), n: d.n || 2, giro: (d.giro || 1) * G.dif.vel, aviso: 0.95 * G.dif.aviso, len: 560 }; sfx('magic'); }
    const r = b.raios; if (!r) return true;
    r.aviso -= dt; if (r.aviso <= 0) r.a += r.giro * dt;
    if (m.t > (d.dur || 3.6) + 0.95) { b.raios = null; return true; }
    return false;
  }
};

function choque(G, b) {
  const y = G.N.arena.chao;
  for (const s of [-1, 1]) G.tiros.push({ x: b.x + s * b.w / 2, y: y - 13, vx: s * 330 * G.dif.vel, vy: 0, r: 13, vida: 2.4, cor: b.d.cor || '#C9D2C4', tipo: 'choque', fixo: true });
  G.tremor(7); sfx('block'); G.fx.po(b.x, y, 14, '#C9D2C4'); b.pousou = 0.2; G.efeito('baque', b.x, y);
}

export function atualizarChefe(G, b, dt) {
  const c = b.c, A = G.N.arena, p = G.p;
  b.t += dt; b.flash = Math.max(0, b.flash - dt); b.semDano = Math.max(0, b.semDano - dt); b.exposto = Math.max(0, b.exposto - dt); b.furia = Math.max(0, b.furia - dt);
  b.tele = 0; b.art.step = 0; b.perigo = false; if (b.pousou > 0) b.pousou -= dt;
  for (const cl of b.clones) cl.t -= dt;
  b.clones = b.clones.filter(cl => cl.t > 0);
  if (b.morrendo) { b.morrendo -= dt; b.vx = 0; if (Math.random() < dt * 22) G.fx.po(b.x + rand(-b.w, b.w) / 2, b.y - rand(0, b.h), 3, b.d.cor || '#fff'); if (b.morrendo <= 0) G.chefeCaiu(b); return; }
  // postura
  b.postT -= dt; if (b.postT <= 0 && b.post > 0 && b.quebrado <= 0) b.post = Math.max(0, b.post - 9 * dt);
  const parado = b.quebrado > 0 || b.tonto > 0;
  if (parado) {
    b.quebrado -= dt; b.tonto -= dt; b.vx = 0; b.raios = null; b.encanta = false; G.puxao = null; b.mov = null; b.alpha = 1;
    if (b.voa) b.y = Math.min(A.chao, b.y + 520 * dt);
    if (b.quebrado <= 0 && b.tonto <= 0) { b.post = 0; b.espera = 0.7; }
  } else {
    // virada de fase: grito, escuridão e a acusação
    let nf = 0; c.fases.forEach((f, i) => { if (b.hp / b.max <= f.vida) nf = i; });
    if (nf > b.fase) {
      b.fase = nf; const f = c.fases[nf]; b.mov = null; b.raios = null; b.encanta = false; G.puxao = null; b.alpha = 1; b.idx = 0; b.espera = 1.4;
      G.limparPerigos(); if (f.grito) G.grito(f.grito); G.tremor(10); sfx('boss');
      G.estaEscrito(b);
      return;
    }
    const f = c.fases[b.fase];
    G.escuroAlvo = f.escuro ?? c.escuro ?? 0;
    if (!b.mov) {
      b.espera -= dt;
      // entre os golpes
      const dx = p.x - b.x; b.face = Math.sign(dx) || b.face;
      if (c.mover === 'perseguir') b.vx = Math.abs(dx) > b.w * 0.7 ? b.face * (c.vel || 60) * (b.fase ? 1.2 : 1) : 0;
      else if (c.mover === 'rodear') { const alvo = Math.abs(dx) < 220 ? -b.face : Math.abs(dx) > 330 ? b.face : 0; b.vx = alvo * (c.vel || 100); }
      else if (c.mover === 'pairar') { const tx = clamp(p.x + Math.sin(b.t * 0.8) * 190, A.x0 + 80, A.x1 - 80), ty = A.chao - c.voa + Math.sin(b.t * 1.7) * 18; b.vx = clamp((tx - b.x) * 1.4, -(c.vel || 100), c.vel || 100); b.y += clamp(ty - b.y, -1, 1) * 140 * dt; }
      else b.vx = 0;
      if (b.espera <= 0) { const nome = f.golpes[b.idx++ % f.golpes.length]; b.mov = { nome, def: c.golpes[nome], t: 0, e: 0 }; }
    } else {
      const m = b.mov, fim = GOLPES[m.def.tipo](G, b, m, dt); m.t += dt;
      if (fim) { b.mov = null; b.art.lanca = null; b.espera = (m.def.espera ?? 1.05) * G.dif.ritmo * (c.pressa || 1) * (b.fase ? 0.85 : 1) * (b.furia > 0 ? 0.7 : 1); }
    }
    // regras passivas
    if (c.regras?.regenera) { b.semGolpe = (b.semGolpe || 0) + dt; if (b.semGolpe > c.regras.regenera.apos && b.hp < b.max) { b.hp = Math.min(b.max, b.hp + b.max * c.regras.regenera.taxa * dt); if (Math.random() < dt * 5) G.fx.sobe(b.x + rand(-20, 20), b.y - 30, 1, '#A5CDCE'); } }
  }
  // física
  if (b.voa || b.mov?.def.tipo === 'mergulho') { b.x = clamp(b.x + b.vx * dt, A.x0 + b.w / 2, A.x1 - b.w / 2); }
  else { b.vy = Math.min(1100, b.vy + 2050 * dt); mover(G.N, b, dt); b.x = clamp(b.x, A.x0 + b.w / 2, A.x1 - b.w / 2); if (b.x <= A.x0 + b.w / 2 + 1) b.parede = -1; else if (b.x >= A.x1 - b.w / 2 - 1) b.parede = 1; }
}

export function desenharChefe(g, b, Tm, G) {
  const a = b.art, s = b.r / 40;
  Object.assign(a, { x: b.x, y: b.y - 37 * s, flash: b.flash, stun: b.quebrado > 0 || b.tonto > 0 ? 1 : 0, hp: b.hp, max: b.max, alpha: b.alpha, act: b.mov ? b.mov.nome : null, exposto: b.exposto > 0 ? 1 : 0, lancaA: b.face > 0 ? 0 : Math.PI });
  // raios do relógio
  if (b.raios) { const r = b.raios, cx = b.x, cy = b.y - b.h * 0.55; g.save(); g.lineCap = 'round'; for (let i = 0; i < r.n; i++) { const an = r.a + i * TAU / r.n; g.beginPath(); g.moveTo(cx + Math.cos(an) * 30, cy + Math.sin(an) * 30); g.lineTo(cx + Math.cos(an) * r.len, cy + Math.sin(an) * r.len); if (r.aviso > 0) { g.strokeStyle = 'rgba(165,205,206,.35)'; g.lineWidth = 2; g.setLineDash([8, 8]); } else { g.strokeStyle = 'rgba(210,240,240,.95)'; g.lineWidth = 9; g.shadowColor = '#A5CDCE'; g.shadowBlur = 16; } g.stroke(); } g.restore(); }
  if (b.encanta) { g.save(); g.strokeStyle = 'rgba(255,143,184,.5)'; g.lineWidth = 2; for (let i = 0; i < 3; i++) { const rr = 340 - ((Tm * 150 + i * 110) % 330); g.beginPath(); g.arc(b.x, b.y - b.h / 2, rr, 0, TAU); g.stroke(); } g.restore(); }
  const luz = G.p.lamp ? G.raioLuz() : 0;
  for (const cl of b.clones) { const ca = cl.art; Object.assign(ca, a, { x: cl.x, y: cl.y - 37 * s }); const naLuz = luz && Math.hypot(cl.x - G.p.x, cl.y - G.p.y) < luz; ca.alpha = cl.alpha * (naLuz ? 0.22 + 0.12 * Math.sin(Tm * 40) : 1) * Math.min(1, cl.t * 2); drawBoss(g, ca, Tm); }
  g.save(); if (b.face > 0 && !b.c.semVirar) { g.translate(b.x, 0); g.scale(-1, 1); g.translate(-b.x, 0); }
  drawBoss(g, a, Tm); g.restore();
  if (b.exposto > 0) { g.save(); g.strokeStyle = '#FFE9A8'; g.lineWidth = 2.5; g.globalAlpha = 0.6 + 0.4 * Math.sin(Tm * 14); g.beginPath(); g.arc(b.x, b.y - b.h * 0.86, 15, 0, TAU); g.stroke(); g.restore(); }
  if (b.quebrado > 0 || b.tonto > 0) for (let i = 0; i < 3; i++) { const an = Tm * 4 + i * TAU / 3; g.fillStyle = '#FFE9A8'; g.beginPath(); g.arc(b.x + Math.cos(an) * 24, b.y - b.h - 8 + Math.sin(an) * 6, 3, 0, TAU); g.fill(); }
}

// dano que o chefe realmente recebe de um golpe
export function danoNoChefe(b, dano, origem) {
  const r = b.c.regras || {};
  let m = 1;
  if (b.quebrado > 0) m = 1.3;
  else if (r.armadura != null) m = b.exposto > 0 ? 3 : dano > 150 ? 1 : r.armadura; // arpão e golpes muito fortes atravessam a couraça
  else if (r.casco != null) m = b.tonto > 0 ? 1.5 : r.casco;
  else if (b.exposto > 0) m = 1.8;
  return dano * m * (origem === 'funda' && b.exposto > 0 ? 1.5 : 1);
}
