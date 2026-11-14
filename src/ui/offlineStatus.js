import { net, ONLINE } from '../net.js';
import { pwa } from '../pwa.js';
import { h } from '../util.js';
import { jogoAtual } from '../estado.js';

const status = h('button', { id: 'offlineStatus', type: 'button', 'aria-live': 'polite' });
let details = '';
function update() {
  const s = net.syncStatus;
  const ready = pwa.offlineReady ? 'Offline pronto' : import.meta.env.PROD ? 'Baixando jogo para uso offline…' : 'Modo de desenvolvimento';
  const account = ONLINE && net.user;
  let label = account ? (s.syncing ? 'Sincronizando…' : s.pending ? 'Progresso salvo no aparelho · envio pendente' : 'Progresso sincronizado') : 'Progresso só neste aparelho';
  if (!net.connected) label = account ? 'Sem internet · progresso no aparelho' : 'Sem internet · progresso só neste aparelho';
  if (s.conflicts) label = 'Progresso diferente na nuvem · veja a seleção';
  if (s.error) label = s.error.startsWith('Não foi possível salvar') ? 'Falha ao salvar · toque para ver' : 'Sincronização pendente · toque para ver';
  status.textContent = (pwa.offlineError ? 'Download offline pendente' : ready) + ' · ' + label;
  status.classList.toggle('warning', !!(s.error || s.conflicts || pwa.offlineError));
  details = [pwa.offlineError || (pwa.offlineReady ? 'O jogo e as narrações estão disponíveis sem internet neste navegador.' : 'Na versão instalada, aguarde “Offline pronto” antes de desconectar.'),
    account ? 'O progresso é salvo no aparelho e enviado à sua conta ao reconectar. A sincronização retoma também quando você reabre o jogo.' : 'Sem conta, seus personagens ficam somente neste aparelho. Eles não são enviados automaticamente para uma conta.',
    'Multiplayer, ranking mundial e ações de clã precisam de internet.',
    s.conflicts ? 'Há duas versões do progresso. Salve e saia para a seleção de personagens: você poderá exportar uma cópia e escolher qual manter.' : '',
    s.error, 'Não limpe os dados do navegador antes de sincronizar.'].filter(Boolean).join('\n\n');
  status.title = details;
}
status.onclick = () => {
  const game = jogoAtual();
  if (game?.running) game.ui.dialog({ nome: 'Jogar offline e salvar', texto: details,
    acoes: [{ label: 'Exportar cópia do progresso', fn: async () => { await game.save(); net.exportChar(game.char.id, game.char); } }, { label: 'Entendi' }] });
  else alert(details);
};
addEventListener('peregrinos-sync', update);
addEventListener('online', update); addEventListener('offline', update);
pwa.onChange(update);
document.body.append(status); update();
