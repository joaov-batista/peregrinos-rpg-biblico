const CACHE = 'peregrinos-offline-__BUILD_ID__';
const CORE = /* PRECACHE */ [];

const VERSAO = CACHE.slice('peregrinos-offline-'.length);
const PESADO = path => path.startsWith('/narracao/') || /\.(mp4|webm|mp3|wav|ogg)$/.test(path);
const ESSENCIAL = CORE.filter(p => !PESADO(p)), EXTRA = CORE.filter(PESADO);
// o que não mudou de nome (narração, ícones) vem da versão anterior, sem baixar de novo
async function deOutra(path) { for (const k of await caches.keys()) if (k.startsWith('peregrinos-offline-') && k !== CACHE) { const hit = await (await caches.open(k)).match(path); if (hit) return hit; } return null; }
async function guardar(cache, path, tentativas = 2) {
  const velho = PESADO(path) || !path.startsWith('/assets/') ? null : await deOutra(path); // assets têm hash no nome: o mesmo nome é o mesmo arquivo
  if (velho) return cache.put(path, velho);
  for (let i = 0; i < tentativas; i++) { try { const r = await fetch(new Request(path, { cache: 'reload' })); if (r.ok) return cache.put(path, r); } catch { /* tenta de novo */ } }
  throw new Error('falhou: ' + path);
}
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE), todo = [...ESSENCIAL];
    // só o essencial (página, código, imagens) precisa estar inteiro para a versão nova assumir
    const results = await Promise.allSettled(Array.from({ length: 6 }, async () => { while (todo.length) await guardar(cache, todo.shift()); }));
    const failed = results.find(r => r.status === 'rejected');
    if (failed) { await caches.delete(CACHE); throw failed.reason; }
    await self.skipWaiting(); // a versão nova assume assim que termina de baixar; a página salva e recarrega
  })());
});
// a narração e os vídeos entram aos poucos, depois que a versão nova já está valendo
async function baixarExtras() {
  const cache = await caches.open(CACHE);
  for (const path of EXTRA) { if (await cache.match(path)) continue; const velho = await deOutra(path); if (velho) { await cache.put(path, velho); continue; } try { await guardar(cache, path, 1); } catch { /* fica para a próxima */ } }
}
self.addEventListener('message', event => {
  if (event.data === 'ACTIVATE') self.skipWaiting();
  if (event.data === 'VERSION') event.ports[0]?.postMessage({ id: VERSAO });
  if (event.data === 'OFFLINE_STATUS') event.waitUntil((async () => {
    const keys = await (await caches.open(CACHE)).keys();
    const paths = new Set(keys.map(req => new URL(req.url).pathname));
    event.ports[0]?.postMessage({ ready: ESSENCIAL.length > 0 && ESSENCIAL.every(path => paths.has(path)) });
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    // Mantém assets de abas ainda na versão anterior; não apaga caches de outros apps.
    const keys = (await caches.keys()).filter(k => k.startsWith('peregrinos-offline-') && k !== CACHE);
    await Promise.all(keys.slice(0, -2).map(k => caches.delete(k)));
    await self.clients.claim();
    baixarExtras(); // sem esperar: não segura a ativação
  })());
});

async function audioRange(request, response) {
  const range = request.headers.get('range');
  if (!range) return response;
  const bytes = await response.arrayBuffer(), size = bytes.byteLength;
  const match = /^bytes=(\d*)-(\d*)$/.exec(range);
  const start = match?.[1] ? Number(match[1]) : Math.max(0, size - Number(match?.[2]));
  const end = match?.[1] && match?.[2] ? Math.min(size - 1, Number(match[2])) : size - 1;
  if (!match || (!match[1] && !match[2]) || start > end || start >= size)
    return new Response(null, { status: 416, headers: { 'Content-Range': 'bytes */' + size } });
  const headers = new Headers(response.headers);
  headers.set('Content-Range', `bytes ${start}-${end}/${size}`);
  headers.set('Content-Length', String(end - start + 1));
  headers.set('Accept-Ranges', 'bytes');
  return new Response(bytes.slice(start, end + 1), { status: 206, headers });
}
self.addEventListener('fetch', event => {
  const req = event.request, url = new URL(req.url);
  // Auth, ranking, Supabase e fontes externas nunca entram no cache do jogo.
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;
  if (req.mode === 'navigate') {
    event.respondWith(caches.open(CACHE).then(cache => cache.match('/index.html')).then(hit => hit || fetch(req)));
  } else if (CORE.includes(url.pathname)) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      const hit = await cache.match(url.pathname);
      if (!hit) return fetch(req);
      return url.pathname.startsWith('/narracao/') ? audioRange(req, hit) : hit;
    })());
  } else if (url.pathname.startsWith('/assets/')) {
    // Uma aba antiga pode pedir um chunk depois de outra aba aceitar a atualização.
    event.respondWith(caches.match(req).then(hit => hit || fetch(req)));
  }
});
