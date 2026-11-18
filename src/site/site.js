// O site de apresentação: o trailer, os clipes das batalhas e a instalação (o mesmo app do jogo).
import './site.css';

// clipes: só tocam quando aparecem na tela (economiza dados no celular)
const ver = new IntersectionObserver(es => { for (const e of es) { const v = e.target; if (e.isIntersecting) { v.preload = 'auto'; v.play().catch(() => {}); } else v.pause(); } }, { threshold: 0.35 });
document.querySelectorAll('.clipe video').forEach(v => ver.observe(v));

// o trailer: no celular em pé, a versão vertical (feita para reels); no resto, a horizontal
const trailer = document.querySelector('.trailer-video');
if (trailer && matchMedia('(max-width: 600px) and (orientation: portrait)').matches) { trailer.src = trailer.dataset.vertical; trailer.classList.add('vertical'); }

// instalação: o mesmo app do jogo (manifesto e service worker); registrar aqui já baixa o jogo para jogar sem internet
let pedido = null;
const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const android = /android/i.test(navigator.userAgent), instalado = matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: fullscreen)').matches || navigator.standalone === true;
const estado = document.querySelector('.baixar .estado');
addEventListener('beforeinstallprompt', e => { e.preventDefault(); pedido = e; });
addEventListener('appinstalled', () => { pedido = null; estado.textContent = 'Instalado! Abra o Peregrinos pelo ícone.'; });
if ('serviceWorker' in navigator && import.meta.env.PROD) addEventListener('load', () => navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' }).catch(() => {}));

// destaca o cartão do aparelho de quem está vendo
const meu = ios ? 'iphone' : android ? 'android' : matchMedia('(pointer: coarse)').matches ? null : 'pc';
if (meu) document.querySelector(`.plat[data-plat="${meu}"]`)?.classList.add('seu');
if (instalado) estado.textContent = 'Você já está com o Peregrinos instalado.';
if (ios) document.querySelector('.plat[data-plat="iphone"] .passos').hidden = false; // no iPhone a instalação é sempre pelo Safari

for (const card of document.querySelectorAll('.plat')) {
  const passos = card.querySelector('.passos');
  card.querySelector('.mostrar')?.addEventListener('click', () => { passos.hidden = !passos.hidden; });
  card.querySelector('.instalar')?.addEventListener('click', async () => {
    const aqui = card.dataset.plat === meu;
    if (pedido && aqui) { pedido.prompt(); const { outcome } = await pedido.userChoice.catch(() => ({})); pedido = null; if (outcome === 'accepted') estado.textContent = 'Instalando… o Peregrinos vai aparecer como app.'; return; }
    passos.hidden = false; passos.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });
}
