// O sítio do peregrino: lavoura, pomar, animais, lagar, prensa, forno e o cesto de vendas.
// Não é o centro do jogo, mas é um lugar seu: um respiro entre as páginas, que rende denários, presentes e azeite para a lâmpada.

// os itens novos da bolsa (somam-se aos de gente.js)
export const ITENS_SITIO = {
  trigo: { nome: 'Trigo', plural: 'feixes de trigo' }, uva: { nome: 'Uva', plural: 'cachos de uva' }, azeitona: { nome: 'Azeitona', plural: 'azeitonas' },
  leite: { nome: 'Leite de cabra', plural: 'jarros de leite' }, ovo: { nome: 'Ovo', plural: 'ovos' }, la: { nome: 'Lã', plural: 'fardos de lã' },
  azeite: { nome: 'Azeite', plural: 'botijas de azeite' }, vinho: { nome: 'Vinho novo', plural: 'odres de vinho' }
};
// o que o cesto paga (de manhã, depois que o comprador passa)
export const PRECO = { trigo: 4, uva: 6, azeitona: 5, leite: 8, ovo: 5, la: 14, azeite: 32, vinho: 36, pao: 9, figo: 6, peixe: 12, flor: 6, mel: 25 };

// o que se planta: dias regados até a colheita, quanto rende e se volta a dar
export const PLANTAS = {
  trigo: { nome: 'Trigo', dias: 3, rende: ['trigo', 3], semente: 'Sementes de trigo', preco: 12, ref: '"Se o grão de trigo, caindo na terra, não morrer, fica só; mas, se morrer, dá muito fruto" (Jo 12:24).' },
  videira: { nome: 'Videira', dias: 5, rende: ['uva', 2], volta: 2, semente: 'Muda de videira', preco: 120, ref: '"Eu sou a videira, vós, as varas" (Jo 15:5).' },
  lentilha: { nome: 'Lentilha', dias: 2, rende: ['trigo', 1], extra: ['pao', 1], semente: 'Sementes de lentilha', preco: 8, ref: 'O guisado de lentilhas que custou um direito (Gn 25:34). Aqui, só alimenta.' }
};
// os animais: o que dão, de quanto em quanto tempo (em dias alimentados)
export const ANIMAIS = {
  galinha: { nome: 'Galinha', preco: 80, da: 'ovo', cada: 1, lugar: 'quintal', nomes: ['Pintada', 'Cocó', 'Branquinha', 'Dona Ruiva', 'Pipoca'] },
  cabra: { nome: 'Cabra', preco: 260, da: 'leite', cada: 1, lugar: 'pasto', nomes: ['Malhada', 'Teimosa', 'Chifruda', 'Doçura', 'Saltadora'] },
  ovelha: { nome: 'Ovelha', preco: 320, da: 'la', cada: 3, lugar: 'pasto', nomes: ['Lanuda', 'Branca', 'Mansa', 'Nuvem', 'Cordeirinha', 'Rute'] }
};
// o que as máquinas fazem: 3 de entrada dão 1 (o forno faz 2 pães com 2 feixes)
export const MAQUINAS = {
  lagar: { nome: 'O lagar', entra: ['uva', 3], sai: ['vinho', 1], horas: 1, fala: 'Pisa-se a uva com os pés, cantando. "Vinho novo em odres novos" (Mc 2:22).' },
  prensa: { nome: 'A prensa de azeite', entra: ['azeitona', 3], sai: ['azeite', 1], horas: 1, fala: 'A pedra esmaga, a viga aperta, o azeite escorre devagar: o azeite puro das lâmpadas (Êx 27:20).' },
  forno: { nome: 'O forno de barro', entra: ['trigo', 2], sai: ['pao', 2], horas: 0, fala: 'Mói-se, amassa-se, assa-se. "O pão nosso de cada dia" (Mt 6:11).' }
};
// falas do sítio
export const SITIO = {
  chegada: 'Um pedaço de terra fora da aldeia, com uma casa de pedra, um poço e o cheiro de mato. É seu.',
  semSemente: 'Você não tem sementes. Eliabe, o pastor (no Olival), vende sementes e animais.',
  cesto: 'Deixe aqui o que quer vender. O comprador passa de madrugada e o pagamento fica no cesto de manhã.',
  pago: (v, itens) => 'O comprador passou: +' + v + ' denários (' + itens + ').',
  conjuge: (nome) => nome + ' já regou a lavoura e deu de comer aos animais. Deixou um recado: "Tem pão no forno."',
  pastorear: 'O rebanho segue você. Leve-o pelo pasto um pouco: pastar sossega os bichos e eles dão mais.',
  pastoreou: 'Os bichos pastaram e voltaram mansos. Comeram bem hoje.'
};
