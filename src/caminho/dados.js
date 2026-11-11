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

const REFUGIO = [
  { papel: 'inicio', tiles: ['............................'], objs: [
    { tipo: 'ebenezer', col: 6 },
    { tipo: 'npc', col: 13, id: 'velho', nome: 'Velho Peregrino', look: velho },
    { tipo: 'npc', col: 24, id: 'jumenta', nome: 'Uma jumenta', bicho: 'jumenta' }] },
  { papel: 'vila', tiles: ['.....................=====..', '............................', '............................', '..................=====.....', '............................', '............................'], objs: [
    { tipo: 'npc', col: 8, id: 'lidia', nome: 'Lídia, vendedora de púrpura', look: lidia },
    { tipo: 'npc', col: 14, id: 'ferreiro', nome: 'Tubalcaim, o ferreiro', look: { skin: '#8A5A3A', hair: '#1E1612', tunic: '#5A4636', cape: 'none', style: 'curto', beard: true, body: 'forte' } },
    { tipo: 'arvore', col: 23 }, { tipo: 'npc', col: 24, lin: 10, id: 'zaqueu', nome: 'Zaqueu', look: zaqueu }] },
  { papel: 'vila', tiles: ['............................'], objs: TODAS.map((s, i) => ({ tipo: 'portal', col: 6 + i * 9, semana: s.id })) },
  { papel: 'vila', tiles: ['............................'], objs: [
    { tipo: 'npc', col: 4, id: 'saul', nome: 'Rei Saul', look: saul },
    { tipo: 'portal', col: 9, mundo: 'golias' }, { tipo: 'portal', col: 17, mundo: 'behemote' }, { tipo: 'portal', col: 25, mundo: 'leviata' }] },
  { papel: 'vila', tiles: ['............................'], objs: [{ tipo: 'querubim', col: 20 }, { tipo: 'porta-pecado', col: 10 }] }
];

export function semanaDe(id) { return TODAS.find(s => s.id === id); }

// Descrição de uma área para o gerador de níveis. ids: "refugio", "semana-01:3", "mundo:golias"
export function areaDef(id) {
  if (id === 'refugio') return { id, nome: 'Refúgio', sub: 'A última aldeia acesa', tema: 'refugio', planta: REFUGIO, seed: 'refugio', paz: true };
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
    rolos: 3, estacoes, npcs: Object.values(f.npcs || {}), inimigos: f.inimigos, segredos, arena: arenaDe(f.chefe),
    segTipos: f.n === 1 && primeira ? ['lampada'] : ['lampada', 'lampada', 'firmeza', 'asas'] };
}
import { CHEFES } from './chefes.js';
const arenaDe = id => CHEFES[id]?.arena || 'plana';

export const DIFICULDADES = {
  peregrino: { nome: 'Peregrino', desc: 'Para conhecer a história: um fôlego a mais e avisos um pouco mais longos. Ainda exige atenção.', hp: 1, ritmo: 1, aviso: 1.1, vel: 1, vidas: 1, oleo: 1.2 },
  provacao: { nome: 'Provação', desc: 'O jogo como foi pensado: chefes de fôlego longo, que não esperam você pensar.', hp: 1.45, ritmo: 0.78, aviso: 0.84, vel: 1.15, vidas: 0, oleo: 1 },
  fornalha: { nome: 'Fornalha', desc: 'Sete vezes mais quente (Dn 3:19): chefes muito rápidos, avisos curtos e um fôlego a menos.', hp: 1.9, ritmo: 0.6, aviso: 0.68, vel: 1.3, vidas: -1, oleo: 0.9 }
};

export function novoCaminho() {
  return { v: 1, area: 'refugio', hab: {}, reliquias: [], eq: [], selos: {}, est: {}, seg: {}, chefes: {}, feitas: {}, mana: 0, pedras: 0, dif: 'provacao',
    ebenezer: null, sacola: null, falas: {}, mortes: 0, visto: {}, ovos: [] };
}
