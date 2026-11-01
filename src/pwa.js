// App instalável (PWA): service worker + botão "Instalar app".
let deferred = null;
const listeners = new Set();
const notify = () => listeners.forEach(f => f());

export const pwa = {
  offlineReady: false,
  offlineError: '',
  get installed() { return matchMedia('(display-mode: fullscreen)').matches || matchMedia('(display-mode: standalone)').matches || navigator.standalone === true; },
  get canPrompt() { return !!deferred; },
  get ios() { return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); },
  // mostra o botão quando o navegador oferece instalação ou no iPhone (instrução manual)
  get available() { return !this.installed && (this.canPrompt || this.ios); },
  onChange(f) { listeners.add(f); return () => listeners.delete(f); },
  async install(toast) {
    if (deferred) {
      deferred.prompt();
      const { outcome } = await deferred.userChoice.catch(() => ({}));
      deferred = null; notify();
      if (outcome === 'accepted') toast?.('Peregrinos instalado! Abra pelo ícone na tela inicial.');
      return;
    }
    if (this.ios) toast?.('No iPhone: toque em Compartilhar (□↑) e depois em "Adicionar à Tela de Início".', 7000);
    else toast?.('No menu do navegador (⋮), escolha "Instalar app" ou "Adicionar à tela inicial".', 6000);
  }
};

addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e; notify(); });
addEventListener('appinstalled', () => { deferred = null; notify(); });

// A instalação inicial baixa o jogo inteiro. Atualizações aguardam o jogador salvar.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  let registration;
  let controlled = !!navigator.serviceWorker.controller;
  const isReady = worker => new Promise(resolve => {
    if (!worker) { resolve(false); return; }
    const channel = new MessageChannel();
    const finish = ready => { clearTimeout(timer); channel.port1.close(); resolve(ready); };
    const timer = setTimeout(() => finish(false), 1500);
    channel.port1.onmessage = e => finish(e.data?.ready === true);
    worker.postMessage('OFFLINE_STATUS', [channel.port2]);
  });
  const showUpdate = () => {
    if (!registration?.waiting || document.getElementById('novaVersao')) return;
    const b = document.createElement('button');
    b.id = 'novaVersao'; b.textContent = '🔄 Nova versão pronta. Salvar e atualizar';
    b.onclick = async () => {
      b.disabled = true;
      const saved = await window.__game?.save();
      if (saved === false) { b.disabled = false; b.textContent = 'Falha ao salvar. Libere espaço antes de atualizar.'; return; }
      registration.waiting?.postMessage('ACTIVATE');
    };
    document.body.append(b);
  };
  navigator.serviceWorker.addEventListener('controllerchange', async () => {
    pwa.offlineReady = await isReady(navigator.serviceWorker.controller); notify();
    if (controlled) {
      if (await window.__game?.save() !== false) location.reload();
    } else controlled = true;
  });
  const register = async () => {
    try {
      registration = await navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' });
      pwa.offlineReady = await isReady(registration.active); notify(); showUpdate();
      registration.addEventListener('updatefound', () => {
        const worker = registration.installing;
        worker?.addEventListener('statechange', () => {
          if (worker.state === 'installed') { pwa.offlineError = ''; showUpdate(); notify(); }
          if (worker.state === 'redundant') { pwa.offlineError = 'Download interrompido. Reconecte para tentar novamente.'; notify(); }
        });
      });
      await navigator.serviceWorker.ready;
      pwa.offlineReady = await isReady(registration.active); notify();
    } catch { pwa.offlineError = 'Não foi possível preparar o modo offline. Verifique a conexão e o espaço livre.'; notify(); }
  };
  if (document.readyState === 'complete') void register();
  else addEventListener('load', register, { once: true });
  const check = () => { if (navigator.onLine && !document.hidden) registration?.update().catch(() => {}); };
  setInterval(check, 5 * 60000);
  addEventListener('online', check);
  document.addEventListener('visibilitychange', check);
}
