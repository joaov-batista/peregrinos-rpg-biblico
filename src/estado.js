// O jogo em andamento, guardado aqui dentro (e não em window): assim o console do navegador não alcança o estado do
// jogo para trapacear. Em desenvolvimento, continua exposto em window.__game para depurar e testar.
let atual = null;
export const jogoAtual = () => atual;
export function definirJogo(g) { atual = g; if (import.meta.env.DEV) window.__game = g; }
