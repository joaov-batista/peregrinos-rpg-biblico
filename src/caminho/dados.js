import { FALAS } from '../content/falas-caminho.js';
// Dados do Caminho: a Armadura de Deus (habilidades), as relíquias, os temas das áreas e o mapa do mundo.
import { TODAS } from '../content/index.js';
import { DECISOES_CORINTO } from '../content/decisoes-corinto.js';

// A Armadura de Deus (Ef 6:13-17) é a progressão: cada peça muda o que o peregrino consegue fazer.
export const ARMADURA = {
  cinto_verdade: { hab: 'firmeza', nome: 'Cinto da Verdade', poder: 'Firmeza', ref: 'Efésios 6:14', icone: '🎗️',
    desc: 'Cingido com a verdade, você se firma nas paredes: segure contra uma parede para deslizar e pule para escalar.' },
  calcados_paz: { hab: 'calcados', nome: 'Calçados da Paz', poder: 'Passo Pronto', ref: 'Efésios 6:15', icone: '👡',
    desc: 'Pés calçados com a prontidão do evangelho: o passo pronto volta em menos da metade do tempo.' },
  couraca_justica: { hab: 'couraca', nome: 'Couraça da Justiça', poder: 'Coração Guardado', ref: 'Efésios 6:14', icone: '🛡️',
    desc: 'Guarda o coração: dois fôlegos a mais.' },
  escudo_fe: { hab: 'escudo', nome: 'Escudo da Fé', poder: 'Apagar os Dardos', ref: 'Efésios 6:16', icone: '🔰',
    desc: 'A vigília fica mais larga, devolve os dardos com o triplo da força e cada defesa perfeita enche mais o azeite.' },
  capacete_salvacao: { hab: 'asas', nome: 'Capacete da Salvação', poder: 'Esperança que Eleva', ref: 'Efésios 6:17 · Isaías 40:31', icone: '⛑️',
    desc: 'A esperança da salvação renova as forças: um terceiro salto no ar.' },
  espada_espirito: { hab: 'espada', nome: 'Espada do Espírito', poder: 'Está Escrito', ref: 'Efésios 6:17', icone: '🗡️',
    desc: 'Segure o golpe para carregar e solte uma onda de luz que atravessa os inimigos.' }
};

// Relíquias: até 3 equipadas (4 com a Coroa Restituída). Vêm dos chefes, dos segredos e da Lídia.
// Armas à venda no armeiro: duas por vocação, cada uma muda o jeito de lutar (os valores substituem os da arma de base)
export const ARMAS_ALT = {
  espada: { curta: { nome: 'Espada curta de Eúde', ref: 'Juízes 3:16', preco: 320, desc: 'Curta e muito rápida: menos alcance, golpes em sequência.', alc: 46, cd: 0.24, d: 0.78 }, montante: { nome: 'Espada de Golias', ref: '1 Samuel 21:9', preco: 560, desc: 'Lenta e pesada: alcance enorme e golpe que empurra.', alc: 88, alt: 54, cd: 0.56, d: 1.65, empurra: 1.8 } },
  funda: { cajadoPastor: { nome: 'Funda de couro trançado', ref: '1 Samuel 17:40', preco: 300, desc: 'Pedras mais rápidas e retas, que voam mais longe e ferem mais.', tiro: { tipo: 'pedra', v: 900, r: 6, vida: 1.1, g: 120, fura: true }, cd: 0.4, d: 1.55 },
    saraiva: { nome: 'Funda dos benjamitas', ref: 'Juízes 20:16', preco: 540, desc: 'Três pedras de uma vez, em leque.', tiro: { tipo: 'pedra', v: 700, r: 5, vida: 0.9, g: 300, n: 3, leque: 0.16, fura: true }, cd: 0.4, d: 0.8 },
    cinco: { nome: 'As cinco pedras do ribeiro', ref: '1 Samuel 17:40', preco: 900, desc: 'Cinco pedras a cada lance. Mais lenta, mas cobre a sala.', tiro: { tipo: 'pedra', v: 680, r: 5, vida: 0.95, g: 260, n: 5, leque: 0.15, fura: true }, cd: 0.56, d: 0.72 } },
  cajado: { brasa: { nome: 'Cajado de brasa viva', ref: 'Isaías 6:6', preco: 340, desc: 'Fogo lento e grande, que atravessa os adversários.', tiro: { tipo: 'fogo', v: 300, r: 13, vida: 1.1, fura: true }, cd: 0.62, d: 1.25 }, vara: { nome: 'Vara de amendoeira', ref: 'Jeremias 1:11', preco: 520, desc: 'Fagulhas rápidas e fracas, uma atrás da outra.', tiro: { tipo: 'fogo', v: 620, r: 5, vida: 0.6 }, cd: 0.27, d: 0.62 } },
  trombeta: { shofar: { nome: 'Shofar de carneiro', ref: 'Josué 6:5', preco: 330, desc: 'A onda atravessa a sala inteira e empurra com mais força.', tiro: { tipo: 'som', v: 560, r: 10, vida: 1.1, fura: true }, empurra: 2.6, cd: 0.56 }, prata: { nome: 'Trombeta de prata', ref: 'Números 10:2', preco: 520, desc: 'Toques curtos e rápidos, de meia distância.', tiro: { tipo: 'som', v: 440, r: 9, vida: 0.5, fura: true }, cd: 0.28, d: 0.7 } },
  adaga: { dupla: { nome: 'Punhais gêmeos', ref: 'Juízes 3:21', preco: 320, desc: 'Avança mais a cada golpe e fere com mais força.', avanco: 150, d: 0.6, cd: 0.28 }, espinho: { nome: 'Espinho de acácia', ref: 'Êxodo 25:10', preco: 500, desc: 'A mais rápida de todas, de alcance mínimo.', alc: 36, cd: 0.16, d: 0.42 } },
  lanca: { dardo: { nome: 'Dardo de Joabe', ref: '2 Samuel 18:14', preco: 340, desc: 'A lança vira arremesso: voa reta e atravessa.', tiro: { tipo: 'lanca', v: 700, r: 7, vida: 0.5, fura: true }, cd: 0.6, d: 1.1 }, alabarda: { nome: 'Lança de Jasobeão', ref: '1 Crônicas 11:11', preco: 560, desc: 'Muito longa e lenta: mantém todos à distância.', alc: 130, cd: 0.6, d: 1.45 } },
  chicote: { aguilhada: { nome: 'Aguilhada de Sangar', ref: 'Juízes 3:31', preco: 330, desc: 'Mais curta e mais pesada: cada estalo dói.', alc: 86, d: 1.4, cd: 0.52 }, cordas: { nome: 'Azorrague de cordas', ref: 'João 2:15', preco: 520, desc: 'Longo e veloz, para varrer a sala.', alc: 150, d: 0.8, cd: 0.36 } }
};
// Dons: sinais que a Escritura conta, raríssimos. Vêm da pesca (muito raramente) e dos marcos do Desafio das ondas.
// Usar um dom gasta dois terços do azeite e ele demora a voltar. O último exige todos os outros e a Língua de Fogo.
export const DONS = {
  tornado: { nome: 'Redemoinho de fogo', ref: '2 Reis 2:11', desc: 'Um redemoinho de fogo avança à sua frente e queima o que encontra.' },
  raios: { nome: 'Voz do Sinai', ref: 'Êxodo 19:16', desc: 'Raios caem do céu sobre os adversários mais próximos.' },
  enchente: { nome: 'Águas do dilúvio', ref: 'Gênesis 7:11', desc: 'As águas cobrem o chão da sala, ferem e arrastam.' },
  vento: { nome: 'Vento impetuoso', ref: 'Atos 2:2', desc: 'Um estrondo empurra tudo em volta e, por alguns instantes, você voa (segure o pulo). Precisa das duas metades.', partes: 2 },
  espirito: { nome: 'Fogo do Espírito', ref: 'Atos 2:3-4', desc: 'Por doze segundos: voo, espada de fogo, passos seguidos que atravessam e ferem, chuva de fogo e a terra que treme. Exige os quatro dons e a Língua de Fogo.', exige: ['tornado', 'raios', 'enchente', 'vento'] }
};
// companheiros de caminho, vendidos caro por Noé no Refúgio
export const PETS = {
  cachorro: { nome: 'Cão pastor', ref: 'Jó 30:1', preco: 2400, desc: 'Morde o vício mais próximo de tempos em tempos e late quando há algo escondido por perto.' },
  leao: { nome: 'Leão de Judá (filhote)', ref: 'Gênesis 49:9', preco: 4800, desc: 'Ataca com muito mais força que o cão e, de tempos em tempos, ruge: os vícios por perto ficam atordoados.' },
  papagaio: { nome: 'Papagaio de Ofir', ref: '1 Reis 10:22', preco: 2000, desc: 'Busca denários de longe e grita "VIGIAI!" um instante antes do golpe de um chefe.' }
};
// melhorias da forja (Tubalcaim, "artífice de todo instrumento cortante de bronze e de ferro", Gn 4:22)
export const FORJA = [
  { nome: 'Fio de bronze', preco: 160, desc: 'Golpes 12% mais fortes.' },
  { nome: 'Fio de ferro', preco: 340, desc: 'Golpes 24% mais fortes.' },
  { nome: 'Fio temperado', preco: 620, desc: 'Golpes 36% mais fortes.' },
  { nome: 'Fio de dois gumes', preco: 980, desc: 'Golpes 50% mais fortes. "Mais cortante que qualquer espada de dois gumes" (Hb 4:12).' }
];
export const RELIQUIAS = {
  // raras: só o Mercador da primeira página as tem, e nem sempre
  perola_preco: { nome: 'Pérola de Grande Preço', icone: '⚪', ref: 'Mateus 13:46', desc: 'Um espaço a mais para relíquias.', raro: 1400, passiva: true },
  talento_multiplicado: { nome: 'Talento Multiplicado', icone: '🪙', ref: 'Mateus 25:20', desc: 'Todo denário apanhado vale o dobro.', raro: 1100 },
  tunica_sem_costura: { nome: 'Túnica sem Costura', icone: '👘', ref: 'João 19:23', desc: 'O primeiro golpe que você levaria em cada área não fere.', raro: 1250 },
  bussola_chamado: { nome: 'Bússola do Chamado', icone: '🧭', ref: 'Jonas 1:2', desc: 'Uma seta aponta para o rolo que ainda falta ler.' },
  manto_marinheiro: { nome: 'Manto do Marinheiro', icone: '🧥', ref: 'Jonas 1:13', desc: 'Depois de ferido, você fica a salvo por mais tempo e não é empurrado.' },
  lamparina_abismo: { nome: 'Lamparina do Abismo', icone: '🪔', ref: 'Jonas 2:7', desc: 'A luz alcança mais longe, mesmo com pouco azeite.' },
  sandalias_mensageiro: { nome: 'Sandálias do Mensageiro', icone: '🩴', ref: 'Jonas 3:3', desc: 'Você corre mais depressa.' },
  cinto_compaixao: { nome: 'Cinto da Compaixão', icone: '🪢', ref: 'Jonas 4:11', desc: 'A oração é mais rápida.' },
  selo_misericordia: { nome: 'Selo da Misericórdia', icone: '🕊️', ref: 'Jonas 2:9', desc: 'Uma vez por descanso, em vez de cair você se levanta com um fôlego.' },
  anel_beltessazar: { nome: 'Anel de Beltessazar', icone: '💍', ref: 'Daniel 4:8', desc: 'Uma resposta certa no "Está Escrito" fere o chefe em dobro.' },
  cepa_raizes: { nome: 'Cepa com Raízes', icone: '🪵', ref: 'Daniel 4:26', desc: 'Ao ficar com um só fôlego, a lâmpada recebe azeite para uma oração (uma vez por descanso).' },
  tijolo_humilde: { nome: 'Tijolo sem Nome', icone: '🧱', ref: 'Daniel 4:30', desc: 'Um tijolo da Babilônia sem a marca do rei. Você recolhe mais denários.' },
  orvalho_ceu: { nome: 'Orvalho do Céu', icone: '💧', ref: 'Daniel 4:33', desc: 'O azeite se refaz sozinho, devagar, até dar para uma oração.' },
  olhos_ceu: { nome: 'Olhos ao Céu', icone: '👁️', ref: 'Daniel 4:34', desc: 'Os golpes para cima ferem muito mais.' },
  coroa_restituida: { nome: 'Coroa Restituída', icone: '👑', ref: 'Daniel 4:36', desc: 'Abre um quarto espaço de relíquia. (Vale mesmo guardada.)', passiva: true },
  pedra_lisa: { nome: 'Pedra Lisa do Ribeiro', icone: '🪨', ref: '1 Samuel 17:40', desc: 'Golpes em chefes expostos ou quebrantados ferem mais.' },
  osso_bronze: { nome: 'Osso de Bronze', icone: '🦴', ref: 'Jó 40:18', desc: 'Um fôlego a mais.' },
  escama_leviata: { nome: 'Escama do Leviatã', icone: '🐉', ref: 'Jó 41:15', desc: 'A janela da defesa perfeita fica maior.' },
  purpura_lidia: { nome: 'Púrpura de Lídia', icone: '🟣', ref: 'Atos 16:14', desc: 'Cada golpe rende mais azeite.', preco: 280 },
  odre_novo: { nome: 'Odre Novo', icone: '🫙', ref: 'Mateus 9:17', desc: 'A lâmpada guarda azeite para quatro orações.', preco: 420 },
  cinco_paes: { nome: 'Cinco Pães e Dois Peixes', icone: '🍞', ref: 'João 6:9', desc: 'Os vasos quebrados às vezes devolvem um fôlego.', preco: 200 }
};

// tema: céu, silhuetas, cor dos blocos e clima de cada área
const t = (ceu, longe, meio, bloco, borda, acento, deco, part, escuro = 0.5, extra = {}) => ({ ceu, longe, meio, bloco, borda, acento, deco, part, escuro, ...extra });
export const TEMAS = {
  refugio: t(['#101D33', '#3B4B6B', '#C98F6B'], '#1B2A44', '#131F33', '#0C141F', '#C9B88A', '#FFD98A', 'casas', 'vagalume', 0.25),
  agora: t(['#0E1A2E', '#2C4063', '#B98A62'], '#1A2C47', '#122036', '#0B1320', '#D7C08A', '#FFD23F', 'colunas', 'po', 0.42),
  oficina: t(['#15141F', '#3B2F3A', '#8A5E48'], '#2A2230', '#1C1722', '#100D14', '#C99B6B', '#E9A45C', 'tendas', 'po', 0.5),
  sinagoga: t(['#0B1626', '#1F3350', '#4E6C8C'], '#17283F', '#101D30', '#09111C', '#A9C4D6', '#CDE7ED', 'arcos', 'po', 0.55),
  casa: t(['#170F1C', '#3A1F36', '#7A3F55'], '#2A1730', '#1D1022', '#110913', '#D99BB0', '#FF8FB8', 'arcos', 'petala', 0.55),
  tribunal: t(['#0E0A12', '#2B1420', '#6A2A2A'], '#231019', '#180B12', '#0D060A', '#D7A27A', '#FF5A3C', 'colunas', 'brasa', 0.6, { perigo: 'brasas' }),
  jope: t(['#0D1D2C', '#24506A', '#D9A774'], '#17364A', '#102535', '#0A1620', '#BFD6CF', '#79D9CD', 'mastros', 'po', 0.35),
  conves: t(['#080F1A', '#1B2E44', '#33526A'], '#14273A', '#0D1B2A', '#070F18', '#9DB9C7', '#94D9F5', 'mastros', 'chuva', 0.6, { perigo: 'onda' }),
  ventre: t(['#0A0714', '#1A1030', '#2E1E4A'], '#1A1230', '#120C22', '#090613', '#8E78C0', '#B6A0E6', 'costelas', 'bolha', 0.82),
  ninive: t(['#1A1210', '#4A2E22', '#C98A52'], '#33221B', '#231712', '#130C09', '#E0B88A', '#E9AD7F', 'muralha', 'po', 0.45),
  sombra: t(['#2A1E12', '#7A5630', '#E9C078'], '#4A3520', '#2E2114', '#17100A', '#E9D09A', '#D6C77B', 'dunas', 'areia', 0.2, { perigo: 'vento' }),
  palacio: t(['#0B1024', '#1E2A5A', '#5C5A9A'], '#1A2148', '#121733', '#0A0D1F', '#C9B26A', '#F1C96A', 'colunas', 'estrela', 0.5),
  arvore: t(['#07141A', '#12383A', '#3F7A62'], '#12302E', '#0C211F', '#061312', '#9FD0A0', '#B8E6A0', 'arvores', 'folha', 0.55),
  terraco: t(['#151028', '#4A2E5E', '#E0A060'], '#2C2040', '#1D152C', '#100B19', '#F1C96A', '#FFD67A', 'muralha', 'estrela', 0.35, { perigo: 'vento' }),
  campo: t(['#0A1420', '#1E3440', '#587860'], '#172B30', '#0F1E22', '#081214', '#A9C7A0', '#A9D6E8', 'arvores', 'orvalho', 0.6),
  aurora: t(['#1A1C3A', '#7A5A7A', '#FFD9A0'], '#3A3050', '#252038', '#141020', '#FFE2B0', '#FFE9A8', 'colunas', 'vagalume', 0.2),
  ela: t(['#141C22', '#3F5A52', '#C9B88A'], '#253B38', '#182826', '#0C1615', '#C9C4A2', '#E5C58A', 'dunas', 'po', 0.3),
  ermo: t(['#1C140E', '#5A3C24', '#D9A060'], '#3A2818', '#261A10', '#140D08', '#D5BA88', '#D5BA88', 'dunas', 'areia', 0.3),
  mar: t(['#04101A', '#0C2C40', '#1F6F8B'], '#0C2434', '#081824', '#040D14', '#96DBE0', '#5ED1E8', 'mastros', 'chuva', 0.65)
};
const TEMA_FASE = { jope: 'jope', conves: 'conves', ventre: 'ventre', ninive: 'ninive', sombra: 'sombra' };

const velho = { skin: '#D9A273', hair: '#E3DED2', tunic: '#5B4E66', cape: '#C9B88A', style: 'turbante', beard: true };
const lidia = { skin: '#C68B59', hair: '#2B1A10', tunic: '#6B3F8C', cape: '#D9A3D0', style: 'veu', beard: false };
const zaqueu = { skin: '#D9A273', hair: '#3A2314', tunic: '#4C7A52', cape: 'none', style: 'curto', beard: true };
const saul = { skin: '#C68B59', hair: '#2B1A10', tunic: '#7A2E3A', cape: '#D7B25A', style: 'curto', beard: true };

export const MUNDO = {
  golias: { nome: 'Vale de Elá', chefe: 'golias', tema: 'ela', ref: '1 Samuel 17', premio: 'pedra_lisa', pede: { pedras: 5 }, porque: 'Faltam pedras lisas do ribeiro (ache as 5 escondidas nas áreas de Corinto).' },
  behemote: { nome: 'O Ermo de Beemote', chefe: 'behemote', tema: 'ermo', ref: 'Jó 40:15', premio: 'osso_bronze', pede: { hab: 'firmeza' }, porque: 'O despenhadeiro pede o Cinto da Verdade.' },
  leviata: { nome: 'O Mar do Leviatã', chefe: 'leviata', tema: 'mar', ref: 'Jó 41', premio: 'escama_leviata', pede: { hab: 'escudo' }, porque: 'Os jatos do mar pedem o Escudo da Fé.' }
};

// plataformas de uma sala escrita à mão: [linha do mapa, coluna inicial, coluna final] (linha 13 = teto de uma casa)
const sala = (...pls) => { const topo = Math.min(15, ...pls.map(p => p[0])), g = Array.from({ length: 16 - topo }, () => Array(28).fill('.')); for (const [lin, a, b] of pls) for (let x = a; x <= b; x++) g[lin - topo][x - 1] = '='; return g.map(r => r.join('')); };
const casa = (col, id, nome) => ({ tipo: 'casa', col, id, nome });
const planta = (col, qual) => ({ tipo: 'planta', col, qual });
const povo = (col, vai, look) => ({ tipo: 'morador', col, vai, look });

// O Refúgio: uma aldeia a céu aberto (praças, mercado, bairro, pátio, olival, o portão do Éden) e, por baixo dela,
// os salões de pedra: o Salão dos Rolos (as páginas do Livro), a Casa do Tesouro, a Cripta dos Gigantes e a cisterna.
const REFUGIO = [
  { cx: 0, nome: 'Praça do poço', papel: 'inicio', tiles: sala([13, 20, 23]), objs: [
    planta(2, 'oliveira'), planta(12, 'palmeira'), casa(21, 'viuva', 'Casa da viúva de Sarepta'), planta(27, 'oliveira'),
    { tipo: 'ebenezer', col: 6 }, { tipo: 'poco', col: 14 },
    { tipo: 'npc', col: 10, id: 'velho', nome: 'Velho Peregrino', look: velho },
    { tipo: 'npc', col: 17, id: 'pedro', nome: 'Simão, o pescador', look: { skin: '#A0673E', hair: '#3A2314', tunic: '#497A80', cape: 'none', style: 'cacheado', beard: true, body: 'forte' } },
    { tipo: 'npc', col: 26, id: 'jumenta', nome: 'Uma jumenta', bicho: 'jumenta' },
    povo(19, 3, { skin: '#C68B59', hair: '#6B4423', tunic: '#497A80', cape: 'none', style: 'rabo' }), { tipo: 'ave', col: 9, lin: 16 }, { tipo: 'ave', col: 22, lin: 13 }] },
  // a rua do mercado; no meio dela, a escada que desce ao Salão dos Rolos
  { cx: 1, nome: 'Mercado', papel: 'vila', desce: true, tiles: sala([10, 22, 26], [13, 19, 23]), objs: [
    planta(2, 'palmeira'), { tipo: 'cenario', col: 5, qual: 'banca' }, { tipo: 'cenario', col: 8, qual: 'forja' }, { tipo: 'cenario', col: 14, qual: 'descida', rotulo: 'Salão dos Rolos' },
    { tipo: 'npc', col: 5, id: 'lidia', nome: 'Lídia, vendedora de púrpura', look: lidia },
    { tipo: 'npc', col: 8, id: 'ferreiro', nome: 'Tubalcaim, o ferreiro', look: { skin: '#8A5A3A', hair: '#1E1612', tunic: '#5A4636', cape: 'none', style: 'curto', beard: true, body: 'forte' } },
    { tipo: 'arvore', col: 23 }, { tipo: 'fruto', col: 20, lin: 9 }, { tipo: 'fruto', col: 22, lin: 8 }, { tipo: 'fruto', col: 25, lin: 9 }, { tipo: 'fruto', col: 26, lin: 12 }, { tipo: 'npc', col: 24, lin: 10, id: 'zaqueu', nome: 'Zaqueu', look: zaqueu }] },
  // a praça das armas: armas, roupas e os bichos de Noé
  { cx: 2, nome: 'Praça das armas', papel: 'vila', tiles: sala([12, 4, 8], [12, 21, 25]), objs: [
    { tipo: 'cenario', col: 6, qual: 'armas' }, { tipo: 'cenario', col: 13, qual: 'tear' }, { tipo: 'cenario', col: 20, qual: 'arca' }, planta(27, 'oliveira'),
    { tipo: 'npc', col: 6, id: 'armeiro', nome: 'Jael, a armeira', look: { skin: '#A0673E', hair: '#1C120A', tunic: '#5E4A3A', cape: '#713E49', style: 'trancas', body: 'forte' } },
    { tipo: 'npc', col: 13, id: 'dorcas', nome: 'Dorcas, a costureira', look: { skin: '#E3B48C', hair: '#6B4423', tunic: '#A18C61', cape: '#C8C9BC', style: 'veu' } },
    povo(17, 4, { skin: '#C68B59', hair: '#3A2314', tunic: '#874D4C', cape: 'none', style: 'turbante', beard: true }),
    { tipo: 'npc', col: 20, id: 'noe', nome: 'Noé, criador de animais', look: { skin: '#C68B59', hair: '#D9D2C5', tunic: '#4C665E', cape: '#877451', style: 'longo', beard: true } },
    { tipo: 'vaso', col: 10 }, { tipo: 'vaso', col: 26 }, { tipo: 'ave', col: 5, lin: 12 }, { tipo: 'ave', col: 23, lin: 12 }] },
  // o bairro: casas de teto plano (dá para andar por cima), a estalagem e o oleiro
  { cx: 3, nome: 'Bairro', papel: 'vila', tiles: sala([13, 3, 6], [13, 10, 13], [10, 15, 17], [13, 19, 22]), objs: [
    casa(4, 'estalagem', 'Estalagem do caminho'), planta(8, 'palmeira'), casa(11, 'marta', 'Casa de Marta e Maria'), planta(16, 'oliveira'), casa(20, 'oleiro', 'Casa do oleiro'), planta(27, 'cipreste'),
    { tipo: 'vaso', col: 24 }, { tipo: 'vaso', col: 25 }, { tipo: 'vaso', col: 26 },
    povo(8, 5, { skin: '#A0673E', hair: '#1C120A', tunic: '#4C665E', cape: 'none', style: 'coque' }), povo(16, 3, { skin: '#E3B48C', hair: '#B8863B', tunic: '#686078', cape: '#394F62', style: 'longo' }),
    { tipo: 'ave', col: 5, lin: 13 }, { tipo: 'ave', col: 16, lin: 10 }, { tipo: 'ave', col: 21, lin: 13 }] },
  // o pátio das provas; a escada do meio desce à cisterna
  { cx: 4, nome: 'Pátio das provas', papel: 'vila', desce: true, tiles: sala([12, 22, 26]), objs: [
    planta(2, 'cipreste'), { tipo: 'cenario', col: 14, qual: 'descida', rotulo: 'Cisterna' },
    { tipo: 'npc', col: 4, id: 'mestre', nome: 'Benaia, mestre das provas', look: { skin: '#8A5A3A', hair: '#D9D2C5', tunic: '#343F51', cape: '#877451', style: 'curto', beard: true, body: 'forte' } },
    { tipo: 'boneco', col: 7 }, { tipo: 'boneco', col: 23 },
    { tipo: 'portal', col: 10, area: 'treino', rotulo: 'Arena de treino' }, { tipo: 'portal', col: 20, area: 'desafio', rotulo: 'Desafio das ondas' },
    { tipo: 'npc', col: 27, id: 'samuel', nome: 'Samuel, o que unge', look: { skin: '#C68B59', hair: '#D9D2C5', tunic: '#D2CFBB', cape: '#55516D', style: 'longo', beard: true } }, { tipo: 'ave', col: 24, lin: 12 }] },
  // o olival: figos, sombra e a caravana que às vezes traz algo raro
  { cx: 5, nome: 'Olival', papel: 'vila', tiles: sala([12, 8, 11], [9, 13, 16], [12, 18, 21]), objs: [
    planta(4, 'oliveira'), planta(10, 'oliveira'), planta(15, 'palmeira'), planta(20, 'oliveira'), planta(26, 'cipreste'), { tipo: 'cenario', col: 23, qual: 'banca' },
    { tipo: 'fruto', col: 4, lin: 14 }, { tipo: 'fruto', col: 10, lin: 11 }, { tipo: 'fruto', col: 15, lin: 8 }, { tipo: 'fruto', col: 20, lin: 11 },
    { tipo: 'npc', col: 23, nome: 'Mercador', look: { skin: '#A0673E', hair: '#1C120A', tunic: '#7A5A2E', cape: '#3F2E4F', style: 'turbante', beard: true } },
    { tipo: 'poco', col: 7 }, povo(13, 4, { skin: '#C68B59', hair: '#D9D2C5', tunic: '#5B4E66', cape: 'none', style: 'veu' }), { tipo: 'ave', col: 9, lin: 12 }, { tipo: 'ave', col: 19, lin: 12 }] },
  { cx: 6, nome: 'Portão do Éden', papel: 'vila', tiles: sala(), objs: [planta(3, 'cipreste'), planta(6, 'cipreste'), { tipo: 'porta-pecado', col: 10 }, planta(14, 'oliveira'), { tipo: 'querubim', col: 20 }, planta(25, 'cipreste')] },
  // ---- o subsolo ----
  { cx: 1, cy: 1, nome: 'Salão dos Rolos', papel: 'vila', tiles: sala(), objs: [...TODAS.map((s, i) => ({ tipo: 'portal', col: [4, 9, 21, 26, 7, 23][i % 6], semana: s.id })),
    povo(19, 2, { skin: '#D9A273', hair: '#E3DED2', tunic: '#55516D', cape: '#C9B88A', style: 'longo', beard: true })] },
  { cx: 2, cy: 1, nome: 'Casa do Tesouro', papel: 'vila', tiles: sala([12, 20, 25]), objs: [
    { tipo: 'cenario', col: 11, qual: 'cofre' }, { tipo: 'npc', col: 14, id: 'mateus', nome: 'Mateus, o coletor', look: { skin: '#C68B59', hair: '#2B1A10', tunic: '#3F5A4A', cape: '#C9A63C', style: 'curto', beard: true } },
    { tipo: 'vaso', col: 5 }, { tipo: 'vaso', col: 6 }, { tipo: 'vaso', col: 22, lin: 12 }, { tipo: 'vaso', col: 24, lin: 12 }] },
  { cx: 3, cy: 1, nome: 'Cripta dos Gigantes', papel: 'vila', tiles: sala(), objs: [
    { tipo: 'npc', col: 4, id: 'saul', nome: 'Rei Saul', look: saul },
    { tipo: 'portal', col: 9, mundo: 'golias' }, { tipo: 'portal', col: 17, mundo: 'behemote' }, { tipo: 'portal', col: 25, mundo: 'leviata' }] },
  { cx: 4, cy: 1, nome: 'Cisterna', papel: 'vila', tiles: sala([12, 3, 7]), objs: [
    { tipo: 'npc', col: 22, id: 'nicodemos', nome: 'Nicodemos', look: { skin: '#D9A273', hair: '#D9D2C5', tunic: '#343F51', cape: '#6B5A8C', style: 'turbante', beard: true } },
    { tipo: 'poco', col: 8 }, { tipo: 'vaso', col: 4, lin: 12 }, { tipo: 'vaso', col: 6, lin: 12 }, { tipo: 'vaso', col: 25 }, { tipo: 'vaso', col: 26 }] }
];

export function semanaDe(id) { return TODAS.find(s => s.id === id); }

// Descrição de uma área para o gerador de níveis. ids: "refugio", "semana-01:3", "mundo:golias"
export function areaDef(id) {
  if (id === 'refugio') return { id, nome: 'Refúgio', sub: 'A última aldeia acesa', tema: 'refugio', planta: REFUGIO, seed: 'refugio', paz: true, aberto: true };
  if (id === 'treino') return { id, nome: 'Arena de treino', sub: 'Ferro com ferro se afia (Pv 27:17)', tema: 'ela', seed: id, extra: true, pvp: true,
    planta: [{ papel: 'inicio', tiles: ['....====............====....', '............................', '..........========..........', '............................', '............................'] }] };
  if (id === 'desafio') return { id, nome: 'Desafio das ondas', sub: 'Quantas você aguenta?', tema: 'tribunal', seed: id, extra: true, desafio: true,
    planta: [{ papel: 'inicio', tiles: ['....=====..........=====....', '............................', '...........======...........', '............................', '............................'] }] };
  if (id.startsWith('mundo:')) {
    const m = MUNDO[id.slice(6)];
    return { id, nome: m.nome, sub: m.ref, tema: m.tema, chefe: m.chefe, mundo: id.slice(6), arena: arenaDe(m.chefe), seed: id,
      planta: [{ papel: 'inicio', tiles: ['............................'], objs: [{ tipo: 'ebenezer', col: 12 }] }, { papel: 'arena' }] };
  }
  const [sid, n] = id.split(':'), sem = semanaDe(sid), f = sem.fases[+n - 1];
  const primeira = sid === 'semana-01';
  // segredos: maná em toda área; as cinco pedras lisas ficam em Corinto
  const segredos = ['mana'];
  if (primeira) segredos.push('pedra');
  if (f.n === 3 || f.n === 5) segredos.push('mana');
  const estacoes = f.estacoes || (primeira ? DECISOES_CORINTO[f.n] : undefined);
  return { id, sem, fase: f, nome: f.nome, sub: f.ref, tema: TEMA_FASE[f.tema] || f.tema, chefe: f.chefe, seed: id, cols: estacoes ? 8 : 7,
    rolos: 3, estacoes, npcs: Object.values(f.npcs || {}).map(n => ({ ...n, falas: FALAS[sid]?.[f.n]?.[n.nome] || n.falas })), inimigos: f.inimigos, segredos, arena: arenaDe(f.chefe),
    segTipos: f.n === 1 && primeira ? ['lampada'] : ['lampada', 'lampada', 'firmeza', 'asas'] };
}
import { CHEFES } from './chefes.js';
const arenaDe = id => CHEFES[id]?.arena || 'plana';

export const DIFICULDADES = {
  peregrino: { nome: 'Peregrino', desc: 'Para conhecer a história: um fôlego a mais e avisos um pouco mais longos. Ainda exige atenção.', hp: 1.45, ritmo: 0.95, aviso: 1.05, vel: 1, vidas: 1, oleo: 1.2 },
  provacao: { nome: 'Provação', desc: 'O jogo como foi pensado: chefes de fôlego longo, que não esperam você pensar.', hp: 2.1, ritmo: 0.72, aviso: 0.8, vel: 1.2, vidas: 0, oleo: 1 },
  fornalha: { nome: 'Fornalha', desc: 'Sete vezes mais quente (Dn 3:19): chefes muito rápidos, avisos curtos e um fôlego a menos.', hp: 2.8, ritmo: 0.55, aviso: 0.64, vel: 1.35, vidas: -1, oleo: 0.9 }
};

export function novoCaminho() {
  return { v: 1, area: 'refugio', hab: {}, reliquias: [], eq: [], selos: {}, est: {}, seg: {}, chefes: {}, feitas: {}, mana: 0, pedras: 0, dif: 'provacao',
    ebenezer: null, sacola: null, falas: {}, mortes: 0, visto: {}, ovos: [] };
}
