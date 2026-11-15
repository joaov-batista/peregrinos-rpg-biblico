// O Conselho Zelote, no mesmo traço do peregrino e dos moradores (pixel/humano.js): são gente, não monstros.
// Três peregrinos que escolheram o ferro. O que muda de um para o outro é o corpo, a roupa, a arma e o jeito:
//   Menaém — magro, faixa vermelha na testa, túnica escarlate, capa curta; duas sicas.
//   Eleazar — alto e largo, elmo de couro, barba, couraça, capa azul; a lança.
//   Jair — capuz pontudo cor de palha, cabelo e barba brancos, túnica de ceifeiro; a lâmina curva.
// As poses são as do próprio herói (corrida com golpe, queda com golpe para baixo, agarrado à parede), então eles
// se mexem como você se mexe: a luta é contra três iguais.
import { quadroHeroi, AX, AY } from './humano.js';

const QUEM = {
  menaem: { look: { skin: '#A0673E', hair: '#1C120A', tunic: '#8E2B45', cape: '#3A1E22', style: 'espetado', acessorio: 'faixa', beard: false, body: 'magro' }, cls: 'zelote', arma: 'adaga', armaCor: '#E8ECF4', hab: {} },
  eleazar: { look: { skin: '#8A5A3A', hair: '#2B1A10', tunic: '#343F51', cape: '#2F5FB0', style: 'curto', acessorio: 'elmo', beard: true, body: 'alto' }, cls: 'valente', arma: 'lanca', armaCor: '#F1E6B8', hab: { couraca: true, firmeza: true } },
  jair: { look: { skin: '#C68B59', hair: '#D9D2C5', tunic: '#A18C61', cape: '#C9A63C', style: 'longo', acessorio: 'pontudo', beard: true, body: 'forte' }, cls: 'guerreiro', arma: 'espada', armaCor: '#FFD98A', hab: {} }
};
const atk = (dir, k, n = 0) => ({ dir, t: 0.3 * k, dur: 0.3, n });

function zelote(b, Tm, nome) {
  const Q = QUEM[nome], t = b.mov?.def?.fn || b.mov?.nome || '', caido = b.quebrado > 0 || b.tonto > 0, prep = !caido && (b.tele > 0 || (!!b.mov && b.mov.t < 0.3)), age = !caido && !!b.mov && !prep;
  const mergulho = /Cadente|^bote|^giro/.test(t), parede = !mergulho && /Parede|Rasteira|Alta|chuva/.test(t), rasante = !mergulho && !parede && !!t;
  const p = { x: 0, y: 0, chao: true, vx: 0, vy: 0, h: 44, sq: 1, passo: Tm * 1.4, face: 1, pisca: Math.floor(Tm * 0.7) % 5 ? 0 : 0.1, oleoFrac: 0.6, flashT: 0 };
  const bate = 0.25 + 0.55 * ((Tm * 3) % 1); // o golpe em andamento, em laço
  if (caido) p.stunT = 1;
  else if (mergulho) { p.chao = false; if (prep) { p.vy = -120; p.carga = 0.5; } else { p.vy = 600; p.atk = atk('baixo', 0.75); } }
  else if (parede) { p.chao = false; p.desliza = 1; if (age) p.atk = atk('lado', bate, Math.floor(Tm * 3) % 2); else p.carga = 0.5; }
  else if (rasante) { if (prep) p.carga = 0.5; else if (b.corre) { p.vx = 420; p.atk = atk('lado', 0.7); } else p.atkCd = 0.2; }
  // a capa: uma fita de seis pontos atrás dos ombros. Voa para trás na corrida, para cima na queda, e balança parada
  const [dx, dy] = caido ? [-2, 5] : mergulho && !prep ? [-1.5, -7] : rasante && b.corre ? [-9, 0.6] : parede ? [-4, 5] : [-3, 6];
  p.capa = Array.from({ length: 6 }, (_, i) => ({ x: -4 + dx * i + Math.sin(Tm * 5 + i * 0.9) * i * 0.7, y: -40 + dy * i + Math.cos(Tm * 4 + i) * i * 0.4 }));
  return quadroHeroi(p, Q.look, Q.cls, Q.arma, Tm, Q.hab, { armaCor: Q.armaCor });
}

// devolve o quadro pronto (o humano já vem com contorno); quem chama trata do clarão e do sumiço
export const ZELOTES = {
  conselho: (b, Tm) => zelote(b, Tm, b.cen?.quem === 'eleazar' ? 'eleazar' : 'menaem'),
  zeloteFoice: (b, Tm) => zelote(b, Tm, 'jair'),
  zelotePunhal: (b, Tm) => zelote(b, Tm, 'menaem')
};
export { AX as ZAX, AY as ZAY };
