// O ARSENAL: raridades, os efeitos especiais das armas, as armas e relíquias novas e os achados que caem dos chefes.
// Também a ORAÇÃO + GOLPE: o Espírito desce do céu como pomba e fere tudo em volta, no alto e no chão.
// As armas e relíquias daqui entram nas mesmas tabelas de dados.js (ARMAS_ALT e RELIQUIAS), então lojas, menu e save
// continuam iguais: uma arma é "sua" quando cm.armas['vocação:id'] existe; uma relíquia, quando está em cm.reliquias.
import { ARMAS_ALT, RELIQUIAS, MUNDO } from './dados.js';
import { sfx } from '../audio.js';

export const RARIDADES = {
  comum: { nome: 'Comum', cor: '#C9CCDA', ordem: 0, marca: '◆' },
  rara: { nome: 'Rara', cor: '#6FB4FF', ordem: 1, marca: '◆◆' },
  epica: { nome: 'Épica', cor: '#C99BFF', ordem: 2, marca: '◆◆◆' },
  lendaria: { nome: 'Lendária', cor: '#FFC94A', ordem: 3, marca: '◆◆◆◆' }
};
export const rarDe = x => RARIDADES[x?.rar] || RARIDADES.comum;

// o que cada efeito especial faz (aplicado em aplicarEspecial, a cada golpe da arma)
export const ESPECIAIS = {
  brasa: { nome: 'Brasa', desc: '30% de chance de incendiar o alvo por alguns instantes.' },
  gelo: { nome: 'Geada', desc: '25% de chance de congelar um vício por um instante; num chefe, abala a postura.' },
  raio: { nome: 'Relâmpago', desc: '22% de chance de o golpe saltar para até dois inimigos por perto.' },
  vida: { nome: 'Fôlego', desc: '5% de chance de devolver um fôlego.' },
  azeite: { nome: 'Unção', desc: 'Cada golpe rende mais azeite.' },
  critico: { nome: 'Golpe certeiro', desc: '18% de chance de ferir em dobro.' },
  eco: { nome: 'Eco', desc: '35% de chance de golpear de novo, mais fraco, logo em seguida.' },
  luz: { nome: 'Luz', desc: 'Fere 35% mais os chefes.' },
  empurra: { nome: 'Ímpeto', desc: 'Joga os vícios para longe.' }
};
export const especiaisDe = a => [].concat(a?.especial || []);

// ---- armas novas: quatro por arma (uma de cada raridade). "lamina" pinta a arma no boneco; "cor" pinta os efeitos.
// Lendárias não se compram: só caem de chefes.
const NOVAS = {
  espada: {
    pedro: { nome: 'Espada de Pedro', ref: 'João 18:10', rar: 'comum', preco: 380, desc: 'Rápida no gatilho: às vezes acerta onde não devia.', especial: 'critico', lamina: '#B8C4D0', d: 1.02 },
    gideao: { nome: 'Espada do Senhor e de Gideão', ref: 'Juízes 7:20', rar: 'rara', preco: 760, desc: 'Brilha contra os grandes.', especial: 'luz', lamina: '#F1E6B8', cor: 'luz', fx: 'corteLuz', d: 1.08 },
    querubim: { nome: 'Espada flamejante do querubim', ref: 'Gênesis 3:24', rar: 'epica', preco: 1500, desc: 'A lâmina que guardava o caminho da árvore da vida. Arde.', especial: 'brasa', lamina: '#FF8A3C', cor: 'fogo', fx: 'corteFogo', d: 1.15 },
    dois_gumes: { nome: 'Espada de dois gumes', ref: 'Hebreus 4:12', rar: 'lendaria', desc: 'Penetra até dividir alma e espírito. Fere os chefes e volta a ferir.', especial: ['luz', 'eco'], lamina: '#FFF4C8', cor: 'luz', fx: 'corteLuz', d: 1.3, alc: 70 }
  },
  adaga: {
    silex: { nome: 'Facas de sílex', ref: 'Josué 5:2', rar: 'comum', preco: 360, desc: 'Pedra lascada: corta fundo quando acerta.', especial: 'critico', lamina: '#9A9488', d: 0.55 },
    geada: { nome: 'Punhais de geada', ref: 'Jó 38:29', rar: 'rara', preco: 740, desc: 'Frios como a geada do céu: prendem o vício no lugar.', especial: 'gelo', lamina: '#9FE8FF', cor: 'som', fx: 'corteSom', d: 0.52 },
    leao: { nome: 'Garras do leão de Sansão', ref: 'Juízes 14:6', rar: 'epica', preco: 1500, desc: 'Da força que rasgou o leão vem o fôlego.', especial: 'vida', lamina: '#E9B04A', cor: 'bronze', d: 0.6 },
    meianoite: { nome: 'Adagas da meia-noite', ref: 'Mateus 25:6', rar: 'lendaria', desc: 'À meia-noite ouviu-se um grito. Cortam duas vezes, e certeiras.', especial: ['eco', 'critico'], lamina: '#C79BFF', cor: 'roxo', d: 0.66 }
  },
  lanca: {
    fineias: { nome: 'Lança de Fineias', ref: 'Números 25:7', rar: 'comum', preco: 380, desc: 'Zelo de uma estocada só.', especial: 'critico', lamina: '#B8C0C8', d: 1.22 },
    saul: { nome: 'Lança de Saul', ref: '1 Samuel 18:11', rar: 'rara', preco: 760, desc: 'Arremessada com raiva contra a parede: joga longe quem atinge.', especial: 'empurra', lamina: '#C9B48A', d: 1.25, empurra: 2 },
    fulgor: { nome: 'Lança fulgurante', ref: 'Habacuque 3:11', rar: 'epica', preco: 1500, desc: 'Ao resplendor da lança, o sol e a lua param. O golpe salta em relâmpago.', especial: 'raio', lamina: '#BFF0F8', cor: 'som', d: 1.28 },
    josue: { nome: 'Dardo estendido de Josué', ref: 'Josué 8:18', rar: 'lendaria', desc: 'Josué não recolheu a mão enquanto não venceu. Luz e relâmpago.', especial: ['luz', 'raio'], lamina: '#FFE08A', cor: 'luz', d: 1.4, alc: 110 }
  },
  chicote: {
    raabe: { nome: 'Cordão de escarlata', ref: 'Josué 2:18', rar: 'comum', preco: 360, desc: 'O cordão da janela de Raabe: cada estalo unge a lâmpada.', especial: 'azeite', lamina: '#C0303A', d: 0.98 },
    brasas: { nome: 'Açoite de brasas', ref: 'Provérbios 26:21', rar: 'rara', preco: 740, desc: 'Couro passado na brasa: o estalo incendeia.', especial: 'brasa', lamina: '#FF8A3C', cor: 'fogo', d: 1 },
    sansao: { nome: 'Cordas novas de Sansão', ref: 'Juízes 15:14', rar: 'epica', preco: 1500, desc: 'As cordas que se desfizeram como linho queimado: estalam duas vezes.', especial: 'eco', lamina: '#E8D9B0', d: 1.05 },
    amor: { nome: 'Cordas de amor', ref: 'Oseias 11:4', rar: 'lendaria', desc: 'Com cordas humanas eu os atraí. Devolvem fôlego e ecoam.', especial: ['vida', 'eco'], lamina: '#FFB8D0', cor: 'luz', d: 1.1, alc: 130 }
  },
  cajado: {
    eliseu: { nome: 'Bordão de Eliseu', ref: '2 Reis 4:29', rar: 'comum', preco: 380, desc: 'O bordão posto sobre o menino: cada fagulha unge.', especial: 'azeite', lamina: '#C9A06A', d: 1.05 },
    arao: { nome: 'Vara de Arão que floresceu', ref: 'Números 17:8', rar: 'rara', preco: 760, desc: 'Brotou, floresceu e deu amêndoas: às vezes devolve fôlego.', especial: 'vida', lamina: '#B8E6A0', d: 1.08 },
    carmelo: { nome: 'Cajado do Carmelo', ref: '1 Reis 18:38', rar: 'epica', preco: 1500, desc: 'O fogo que caiu e lambeu a água da vala: brasas maiores, que incendeiam.', especial: 'brasa', lamina: '#FF6A2A', cor: 'fogo', d: 1.15, tiro: { tipo: 'fogo', v: 420, r: 11, vida: 0.85, fura: true } },
    moises: { nome: 'Vara de Moisés', ref: 'Êxodo 14:16', rar: 'lendaria', desc: 'Estendida sobre o mar, abriu caminho. Gela e relampeja.', especial: ['gelo', 'raio'], lamina: '#7FE0FF', cor: 'som', d: 1.2, tiro: { tipo: 'som', v: 520, r: 11, vida: 0.9, fura: true } }
  },
  trombeta: {
    cantaro: { nome: 'Buzina dos trezentos', ref: 'Juízes 7:18', rar: 'comum', preco: 360, desc: 'O toque que espalhou o acampamento: empurra longe.', especial: 'empurra', lamina: '#D9C9A0', d: 0.92, empurra: 2.4 },
    jubileu: { nome: 'Trombeta do jubileu', ref: 'Levítico 25:9', rar: 'rara', preco: 740, desc: 'O ano da libertação: cada toque unge a lâmpada.', especial: 'azeite', lamina: '#E8C24A', d: 0.95 },
    jerico: { nome: 'Trombeta de Jericó', ref: 'Josué 6:20', rar: 'epica', preco: 1500, desc: 'Ao sétimo toque, o muro caiu: cada som ecoa.', especial: 'eco', lamina: '#FFD9A0', d: 1 },
    ultima: { nome: 'A última trombeta', ref: '1 Coríntios 15:52', rar: 'lendaria', desc: 'Num abrir e fechar de olhos. Luz e relâmpago.', especial: ['luz', 'raio'], lamina: '#FFF4C8', cor: 'luz', d: 1.12, tiro: { tipo: 'som', v: 560, r: 12, vida: 1, fura: true } }
  },
  funda: {
    uzias: { nome: 'Funda de Uzias', ref: '2 Crônicas 26:14', rar: 'comum', preco: 380, desc: 'Do arsenal do rei: pedra certeira.', especial: 'critico', lamina: '#B9B4A2', d: 1.32 },
    granizo: { nome: 'Pedras de granizo', ref: 'Josué 10:11', rar: 'rara', preco: 760, desc: 'Grandes pedras do céu: gelam quem acertam.', especial: 'gelo', lamina: '#BFE8FF', cor: 'som', d: 1.3 },
    fogo: { nome: 'Pedras de fogo', ref: 'Ezequiel 28:14', rar: 'epica', preco: 1500, desc: 'Andavam no meio das pedras afogueadas: incendeiam.', especial: 'brasa', lamina: '#FF8A3C', cor: 'fogo', d: 1.36 },
    davi: { nome: 'Funda de Davi', ref: '1 Samuel 17:49', rar: 'lendaria', desc: 'A pedra que se cravou na testa do gigante. Certeira e brilhante contra os grandes.', especial: ['luz', 'critico'], lamina: '#FFE08A', cor: 'luz', d: 1.7, tiro: { tipo: 'pedra', v: 940, r: 7, vida: 1.1, g: 120, fura: true } }
  }
};
// as armas que já existiam ganham raridade e cor
const RAR_ANTIGAS = { curta: 'comum', montante: 'rara', cajadoPastor: 'comum', saraiva: 'rara', cinco: 'epica', brasa: 'comum', vara: 'rara', shofar: 'comum', prata: 'rara', dupla: 'comum', espinho: 'rara', dardo: 'comum', alabarda: 'rara', aguilhada: 'comum', cordas: 'rara' };
const COR_ANTIGAS = { montante: '#C8CCD4', cinco: '#E8E2C8', brasa: '#FF9A3C', vara: '#C9E6A0', prata: '#E6ECF2', espinho: '#B8A070', alabarda: '#9AA8B4', cordas: '#C9A06A' };
for (const [tipo, lista] of Object.entries(ARMAS_ALT)) for (const [id, a] of Object.entries(lista)) { a.rar = a.rar || RAR_ANTIGAS[id] || 'comum'; if (COR_ANTIGAS[id]) a.lamina = a.lamina || COR_ANTIGAS[id]; }
for (const [tipo, lista] of Object.entries(NOVAS)) Object.assign(ARMAS_ALT[tipo] = ARMAS_ALT[tipo] || {}, lista);

// ---- relíquias novas (todas com efeito de verdade: G.tem('id') nos lugares certos) ----
const RELIQ_NOVAS = {
  chifre_azeite: { nome: 'Chifre de Azeite', icone: '📯', ref: '1 Samuel 16:13', rar: 'rara', raro: 900, desc: 'A lâmpada guarda 25 de azeite a mais.' },
  oleo_viuva: { nome: 'Botija da Viúva', icone: '🏺', ref: '1 Reis 17:16', rar: 'epica', desc: 'A oração gasta um quarto a menos de azeite.' },
  manto_elias: { nome: 'Manto de Elias', icone: '🧥', ref: '2 Reis 2:13', rar: 'rara', raro: 950, desc: 'O passo volta muito mais depressa.' },
  pena_aguia: { nome: 'Pena de Águia', icone: '🪶', ref: 'Isaías 40:31', rar: 'epica', desc: 'Um pulo a mais no ar.' },
  cabelo_sansao: { nome: 'Trança de Sansão', icone: '➰', ref: 'Juízes 16:17', rar: 'epica', desc: 'Seus golpes ficam 20% mais fortes.' },
  brasa_altar: { nome: 'Brasa do Altar', icone: '🔥', ref: 'Isaías 6:6', rar: 'rara', desc: 'Qualquer arma ganha a Brasa: às vezes incendeia o alvo.' },
  jarro_gideao: { nome: 'Cântaro de Gideão', icone: '🫙', ref: 'Juízes 7:20', rar: 'rara', desc: 'A defesa perfeita quebra o cântaro: um clarão atordoa os vícios por perto.' },
  pedra_angular: { nome: 'Pedra Angular', icone: '🪨', ref: 'Salmo 118:22', rar: 'epica', desc: 'Um golpe em cada seis que o feririam não fere.' },
  sal_terra: { nome: 'Sal da Terra', icone: '🧂', ref: 'Mateus 5:13', rar: 'comum', preco: 260, desc: 'Vícios vencidos às vezes deixam azeite.' },
  semente_mostarda: { nome: 'Semente de Mostarda', icone: '🌱', ref: 'Mateus 17:20', rar: 'comum', preco: 300, desc: 'O ataque mira pede 10 de azeite a menos.' },
  vaso_alabastro: { nome: 'Vaso de Alabastro', icone: '⚱️', ref: 'Marcos 14:3', rar: 'epica', desc: 'Ao terminar uma oração, o perfume o protege por um instante.' },
  lenco_paulo: { nome: 'Lenço de Paulo', icone: '🧣', ref: 'Atos 19:12', rar: 'lendaria', desc: 'A cada 20 golpes que acertam, um fôlego volta.' },
  porcao_dobrada: { nome: 'Porção Dobrada', icone: '🌀', ref: '2 Reis 2:9', rar: 'lendaria', desc: 'O ataque mira, o golpe do passo e a descida do Espírito ferem 40% mais.' },
  aljava_jonatas: { nome: 'Aljava de Jônatas', icone: '🏹', ref: '1 Samuel 20:20', rar: 'rara', raro: 850, desc: 'Pedras, brasas e sons dos seus golpes voam mais longe.' },
  mana_deserto: { nome: 'Jarro de Maná', icone: '🍯', ref: 'Êxodo 16:33', rar: 'comum', preco: 240, desc: 'Ao entrar numa área, a lâmpada recebe 12 de azeite.' },
  vara_florida: { nome: 'Amêndoa Florida', icone: '🌸', ref: 'Números 17:8', rar: 'epica', desc: 'Vícios vencidos às vezes devolvem um fôlego.' },
  cantico_novo: { nome: 'Cântico Novo', icone: '🎶', ref: 'Salmo 96:1', rar: 'rara', desc: 'O especial da vocação gasta menos azeite.' },
  pomba_jordao: { nome: 'Pomba do Jordão', icone: '🕊️', ref: 'Mateus 3:16', rar: 'lendaria', desc: 'A descida do Espírito (orar + golpe) volta duas vezes mais depressa e cobre mais chão.' },
  // só o mercador de além-mar traz estas (no porto do Refúgio, de vez em quando)
  ancora_esperanca: { nome: 'Âncora da Esperança', icone: '⚓', ref: 'Hebreus 6:19', rar: 'epica', porto: 1600, desc: 'Firme e segura: o vento não o empurra.' },
  vela_paulo: { nome: 'Vela do Navio de Paulo', icone: '⛵', ref: 'Atos 27:40', rar: 'rara', porto: 900, desc: 'O passo no ar vai muito mais longe.' },
  estrela_magos: { nome: 'Estrela dos Magos', icone: '⭐', ref: 'Mateus 2:10', rar: 'epica', porto: 1800, desc: 'Os vícios vencidos deixam metade a mais de denários.' },
  // o presente de Sardes, quando a luz volta
  veste_branca: { nome: 'Veste Branca de Sardes', icone: '🤍', ref: 'Apocalipse 3:5', rar: 'lendaria', desc: 'Um fôlego a mais. "O que vencer será vestido de vestes brancas."' }
};
Object.assign(RELIQUIAS, RELIQ_NOVAS);
// as antigas ganham raridade: as do Mercador são épicas, os prêmios dos gigantes são lendários, as da Lídia são comuns
const PREMIOS = new Set(Object.values(MUNDO).map(m => m.premio));
for (const [id, R] of Object.entries(RELIQUIAS)) if (!R.rar) R.rar = PREMIOS.has(id) ? 'lendaria' : R.raro ? 'epica' : R.preco ? 'comum' : 'rara';
// relíquias que podem cair de chefes e vícios (as de prêmio fixo e as do Mercador ficam de fora)
export const RELIQ_ACHAVEIS = Object.keys(RELIQ_NOVAS).filter(id => !RELIQ_NOVAS[id].porto && id !== 'veste_branca');

// sorteia por raridade, com pesos; devolve null se não há nada que falte
function sorteio(itens, pesos) {
  const tot = itens.reduce((s, [, x]) => s + (pesos[x.rar] || 0), 0); if (!tot) return null;
  let r = Math.random() * tot; for (const [id, x] of itens) { r -= pesos[x.rar] || 0; if (r <= 0) return id; } return itens[itens.length - 1][0];
}
export function sortearArma(G, pesos) {
  const tipo = G.tipoArma, cls = G.char.cls, cm = G.cm; cm.armas = cm.armas || {};
  return sorteio(Object.entries(ARMAS_ALT[tipo] || {}).filter(([id]) => !cm.armas[cls + ':' + id]), pesos);
}
export function sortearReliquia(G, pesos) {
  const cm = G.cm; return sorteio(RELIQ_ACHAVEIS.filter(id => !cm.reliquias.includes(id)).map(id => [id, RELIQUIAS[id]]), pesos);
}

// ---- os efeitos especiais, a cada golpe que a arma acerta ----
const golpeExtra = () => ({ dir: 'lado', hits: new Set(), semOleo: true, especial: true });
export function aplicarEspecial(G, e, dano) {
  const p = G.p, lista = especiaisDe(G.arma); if (G.tem('brasa_altar') && !lista.includes('brasa')) lista.push('brasa');
  if (G.tem('lenco_paulo') && (G.cm.lencoN = (G.cm.lencoN || 0) + 1) % 20 === 0 && p.vida < p.vidaMax) { p.vida++; sfx('heal'); G.textoEm(p.x, p.y - 70, '+1 fôlego (lenço de Paulo)', '#FFE9A8', 12); }
  if (!lista.length || e.hp <= 0) return;
  const vivo = () => e.hp > 0 && !e.morrendo && G.inimigos.includes(e), meio = { x: e.x, y: e.y - e.h / 2 };
  for (const k of lista) {
    if (k === 'brasa' && Math.random() < 0.3) { e.queima = { t: 2.4, tick: 0.6, dano: dano * 0.3 }; G.textoEm(meio.x, meio.y - e.h / 2 - 6, 'em brasa', '#FF8A3C', 10); }
    else if (k === 'gelo' && Math.random() < 0.25) { if (e.kind === 'vicio') { e.stun = Math.max(e.stun, 0.9); e.gelo = 0.9; } else G.postura(e, 8); G.fx.po(meio.x, meio.y, 10, '#BFF0F8'); G.textoEm(meio.x, meio.y - e.h / 2 - 6, 'geada', '#BFF0F8', 10); }
    else if (k === 'raio' && Math.random() < 0.22) {
      const outros = G.inimigos.filter(o => o !== e && o.hp > 0 && !o.morrendo && Math.hypot(o.x - e.x, o.y - e.y) < 230).slice(0, 2);
      for (const o of outros) { G.risco(meio.x, meio.y, o.x, o.y - o.h / 2, '#BFF0F8', 3); G.atingir(o, dano * 0.55, e.x, golpeExtra()); G.efeito('faiscaLuz', o.x, o.y - o.h / 2, 1); }
      if (outros.length) sfx('shoot');
    }
    else if (k === 'vida' && Math.random() < 0.05 && p.vida < p.vidaMax) { p.vida++; sfx('heal'); G.textoEm(p.x, p.y - 70, '+1 fôlego', '#FFE9A8', 12); G.fx.sobe(p.x, p.y - 10, 8, '#FFE9A8'); }
    else if (k === 'azeite') G.ganharOleo(5);
    else if (k === 'critico' && Math.random() < 0.18) { G.textoEm(meio.x, meio.y - e.h / 2 - 14, 'CERTEIRO!', '#FFE9A8', 13); G.efeito('critico', meio.x, meio.y, 1); G.atingir(e, dano, p.x, golpeExtra()); }
    else if (k === 'eco' && Math.random() < 0.35) setTimeout(() => { if (G.running && vivo()) { G.efeito('faiscaLuz', e.x, e.y - e.h / 2, 1); G.atingir(e, dano * 0.5, p.x, golpeExtra()); } }, 150);
    else if (k === 'luz' && e.kind === 'chefe') G.atingir(e, dano * 0.35, p.x, golpeExtra());
    else if (k === 'empurra' && e.kind === 'vicio' && G.souDono()) { e.vx = Math.sign(e.x - p.x) * 420; e.vy = -220; e.chao = false; }
  }
}
// a queima e a geada, a cada quadro
export function passoEspeciais(G, dt) {
  for (const e of G.inimigos) {
    if (e.gelo > 0) { e.gelo -= dt; if (Math.random() < dt * 20) G.parts.push({ x: e.x + (Math.random() - 0.5) * e.w, y: e.y - Math.random() * e.h, vx: 0, vy: -10, t: 0.4, max: 0.4, r: 1.6, cor: '#BFF0F8', g: 0 }); }
    const q = e.queima; if (!q) continue;
    if (e.hp <= 0 || e.morrendo) { e.queima = null; continue; }
    q.t -= dt; q.tick -= dt;
    if (Math.random() < dt * 26) G.parts.push({ x: e.x + (Math.random() - 0.5) * e.w, y: e.y - Math.random() * e.h * 0.8, vx: 0, vy: -50, t: 0.45, max: 0.45, r: 2, cor: Math.random() < 0.5 ? '#FF8A3C' : '#FFD23F', g: -40 });
    if (q.tick <= 0) { q.tick = 0.6; G.atingir(e, q.dano, e.x, golpeExtra()); }
    if (q.t <= 0) e.queima = null;
  }
}

// ---- ORAÇÃO + GOLPE: o Espírito desce. Uma pomba de luz cai do alto; ao tocar o chão, duas faixas de fogo varrem
// a sala (uma no alto, outra rente ao chão) e colunas de luz descem em volta. Desfaz os dardos por perto.
export const ESPIRITO_CUSTO = 50, ESPIRITO_ESPERA = 12;
export function espiritoDesce(G) {
  const p = G.p, base = G.danoBase() * (G.tem('porcao_dobrada') ? 1.4 : 1), larga = G.tem('pomba_jordao') ? 340 : 270;
  p.oleo -= ESPIRITO_CUSTO; p.espCd = ESPIRITO_ESPERA * (G.tem('pomba_jordao') ? 0.5 : 1); p.orando = 0; p.atkBuf = 0; p.atkCd = 0.6;
  G.textoEm(p.x, p.y - 84, 'O Espírito desce', '#FFF4CF', 15); G.grito?.('"…desceu como pomba" (Mt 3:16)');
  G.pomba = { x: p.x, y: p.y, t: 0 }; G.clarao = 0.12; sfx('magic'); G.efeito('pilar', p.x, p.y);
  const x = p.x, y = p.y;
  setTimeout(() => {
    if (!G.running) return;
    G.clarao = 0.22; G.tremor(14); sfx('boss'); G.fx.anel(x, y - 40, '#FFF4CF', larga);
    G.zonas.push({ tipo: 'faixa', x: x - larga, w: larga * 2, y: y - 130, h: 70, aviso: 0, dur: 0.4, cor: '#FFE9A8', amigo: base * 3, santo: true }); // a faixa do alto
    G.zonas.push({ tipo: 'faixa', x: x - larga, w: larga * 2, y: y - 42, h: 46, aviso: 0.08, dur: 0.4, cor: '#FFC98A', amigo: base * 3, santo: true }); // a faixa do chão
    for (let i = -3; i <= 3; i++) if (i) G.zonas.push({ tipo: 'col', x: x + i * (larga / 3.4), w: 46, aviso: 0.1 + Math.abs(i) * 0.09, dur: 0.4, cor: '#FFE9A8', amigo: base * 1.4, y0: y - 360, y1: y + 6, santo: true });
    for (const i of [-1, 1]) G.efeito('pilar', x + i * (larga / 2), y);
    G.tiros = G.tiros.filter(t => t.amigo || Math.hypot(t.x - x, t.y - y) > larga);
    for (const e of G.inimigos) if (e.kind === 'vicio' && e.hp > 0 && Math.abs(e.x - x) < larga && G.souDono()) { e.stun = Math.max(e.stun, 1); e.vy = -260; e.chao = false; }
  }, 420);
}
