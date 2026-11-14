import { jogoAtual } from './estado.js';
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

// A instalação inicial baixa o jogo inteiro. Atualizações entram sozinhas.
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
  // A versão nova entra sozinha (o service worker se ativa ao terminar de baixar). A página salva e recarrega;
  // no meio de uma luta contra um chefe, espera a luta acabar.
  const recarregar = async () => {
    for (let i = 0; i < 240 && jogoAtual()?.running && jogoAtual().luta; i++) await new Promise(r => setTimeout(r, 1000));
    try { await Promise.race([jogoAtual()?.save?.(), new Promise(r => setTimeout(r, 3000))]); } catch { /* recarrega mesmo assim: o jogo salva sozinho a cada 40 s */ }
    location.reload();
  };
  navigator.serviceWorker.addEventListener('controllerchange', async () => {
    pwa.offlineReady = await isReady(navigator.serviceWorker.controller); notify();
    if (controlled) void recarregar(); else controlled = true;
  });
  const register = async () => {
    try {
      registration = await navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' });
      pwa.offlineReady = await isReady(registration.active); notify();
      registration.waiting?.postMessage('ACTIVATE'); // versão antiga que ficou esperando
      registration.addEventListener('updatefound', () => {
        const worker = registration.installing;
        worker?.addEventListener('statechange', () => {
          if (worker.state === 'installed') { pwa.offlineError = ''; notify(); }
          if (worker.state === 'redundant') { pwa.offlineError = 'Download interrompido. Reconecte para tentar novamente.'; notify(); }
        });
      });
      await navigator.serviceWorker.ready;
      pwa.offlineReady = await isReady(registration.active); notify();
    } catch { pwa.offlineError = 'Não foi possível preparar o modo offline. Verifique a conexão e o espaço livre.'; notify(); }
  };
  if (document.readyState === 'complete') void register();
  else addEventListener('load', register, { once: true });
  // Rede de segurança: pergunta ao servidor qual é a versão publicada. Se o worker não trocar sozinho em um minuto
  // (download travado, aparelho que ficou dias fechado), apaga o worker e o cache do jogo e recarrega. O progresso fica salvo.
  const versaoDoWorker = () => new Promise(ok => { const w = navigator.serviceWorker.controller; if (!w) return ok(null); const ch = new MessageChannel(), t = setTimeout(() => ok(null), 1500); ch.port1.onmessage = e => { clearTimeout(t); ok(e.data?.id || null); }; w.postMessage('VERSION', [ch.port2]); });
  let pendente = 0;
  const conferir = async () => {
    if (!navigator.onLine || document.hidden) return;
    try {
      const publicada = (await (await fetch('/version.json?t=' + Date.now(), { cache: 'no-store' })).json()).id, minha = await versaoDoWorker();
      if (!publicada || !minha || publicada === minha) { pendente = 0; return; }
      registration?.update().catch(() => {});
      if (!pendente) { pendente = Date.now(); setTimeout(conferir, 65000); return; }
      if (Date.now() - pendente > 60000) { // não trocou sozinho: recomeça do zero
        pendente = 0; for (let i = 0; i < 240 && jogoAtual()?.running && jogoAtual().luta; i++) await new Promise(r => setTimeout(r, 1000));
        try { await Promise.race([jogoAtual()?.save?.(), new Promise(r => setTimeout(r, 3000))]); } catch { /* segue */ }
        for (const r of await navigator.serviceWorker.getRegistrations()) await r.unregister();
        for (const k of await caches.keys()) if (k.startsWith('peregrinos-offline-')) await caches.delete(k);
        location.reload();
      }
    } catch { /* sem rede: tenta depois */ }
  };
  const check = () => { if (navigator.onLine && !document.hidden) { registration?.update().catch(() => {}); void conferir(); } };
  setInterval(check, 2 * 60000); setTimeout(check, 8000);
  addEventListener('online', check);
  document.addEventListener('visibilitychange', check);
}
