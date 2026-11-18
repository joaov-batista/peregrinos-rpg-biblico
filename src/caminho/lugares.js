// Cantos para parar: o banco sob a amendoeira em flor no Olival, o mirante do Porto e a fogueira da Clareira.
// Sentar ali é um respiro: um versículo, um pensamento, os fôlegos de volta (uma vez por dia em cada lugar).
import { sfx } from '../audio.js';
import { dia, periodo } from './moradores.js';

const PENSAMENTOS = {
  amendoeira: ['"Que vês tu, Jeremias? Vejo uma vara de amendoeira. Bem viste; porque eu velo sobre a minha palavra para a cumprir" (Jr 1:11-12).', 'As pétalas caem devagar no banco. A amendoeira é a primeira a florir, ainda no frio: a que vigia.', '"Considerai os lírios do campo, como eles crescem" (Mt 6:28). Por um instante, nada mais pesa.'],
  mirante: ['O mar lá embaixo, os barcos voltando. "Os que descem ao mar em navios… veem as obras do Senhor" (Sl 107:23-24).', 'Daqui dá para ver o caminho até Sardes. Longe, mas não sozinho.', '"Lança o teu pão sobre as águas, porque depois de muitos dias o acharás" (Ec 11:1).'],
  fogueira: ['"Estavam ali umas brasas, e um peixe posto em cima, e pão" (Jo 21:9). Foi numa fogueira assim que Pedro foi chamado de novo.', 'O fogo estala. Lá longe, uma coruja. Você fica até as brasas ficarem vermelhas.', '"Ardia-nos o coração quando pelo caminho nos falava" (Lc 24:32).']
};
const pick = a => a[Math.floor(Math.random() * a.length)];

export function rotuloLugar(ob) { return ob.tipo === 'banco' ? 'Sentar no banco' : ob.tipo === 'fogueira' ? 'Sentar à fogueira' : undefined; }
export async function usarLugar(G, ob) {
  if (ob.tipo !== 'banco' && ob.tipo !== 'fogueira') return false;
  const qual = ob.tipo === 'fogueira' ? 'fogueira' : ob.lugar || 'amendoeira', cm = G.cm, ja = (cm.sentou = cm.sentou || {})[qual] === dia(G), p = G.p;
  if (!ja) { cm.sentou[qual] = dia(G); p.vida = p.vidaMax; if (qual === 'fogueira') p.oleo = G.oleoMax(); sfx('heal'); G.efeito('cura', p.x, p.y, 1, { gruda: p }); G.salvar(); }
  const noite = periodo(G) === 'noite';
  await G.ui.dialog({ nome: { amendoeira: 'O banco da amendoeira', mirante: 'O mirante do porto', fogueira: 'A fogueira da clareira' }[qual], texto: pick(PENSAMENTOS[qual]) + (ja ? '' : '\n\n' + (qual === 'fogueira' ? 'Fôlegos e azeite refeitos.' : 'Fôlegos refeitos.')) + (noite && qual === 'fogueira' ? '\n\n(À noite, a fogueira é o lugar mais quente da mata.)' : ''), acoes: [{ label: 'Levantar' }], cls: 'fala-narra', voz: false });
  return true;
}
