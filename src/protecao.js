// Proteções básicas da versão publicada. Nada no navegador é inviolável (quem insiste sempre consegue ler o que o
// navegador recebe); o que vale de verdade fica no servidor (as regras de acesso do Supabase e as checagens de pontos).
// Aqui o objetivo é não deixar a porta aberta: sem atalho para o console, sem copiar o código pela página, sem o
// estado do jogo pendurado em window, e um aviso claro para quem cair no golpe de "cole isto no console".
if (import.meta.env.PROD) {
  const editavel = el => !!el?.closest?.('input, textarea, [contenteditable="true"]');
  // botão direito, arrastar imagens e selecionar texto do jogo (os campos de texto continuam normais)
  addEventListener('contextmenu', e => { if (!editavel(e.target)) e.preventDefault(); }, { capture: true });
  addEventListener('dragstart', e => { if (!editavel(e.target)) e.preventDefault(); }, { capture: true });
  addEventListener('selectstart', e => { if (!editavel(e.target)) e.preventDefault(); }, { capture: true });
  addEventListener('copy', e => { if (!editavel(e.target)) e.preventDefault(); }, { capture: true });
  // atalhos das ferramentas de desenvolvedor e de "ver código-fonte" / "salvar página"
  addEventListener('keydown', e => {
    const k = (e.key || '').toLowerCase(), ctrl = e.ctrlKey || e.metaKey;
    const ferramentas = k === 'f12' || (ctrl && e.shiftKey && ['i', 'j', 'c', 'k'].includes(k)) || (e.metaKey && e.altKey && ['i', 'j', 'c', 'u'].includes(k));
    const codigo = ctrl && !e.shiftKey && ['u', 's'].includes(k);
    if (ferramentas || codigo) { e.preventDefault(); e.stopPropagation(); }
  }, { capture: true });
  // o aviso no console, para quem foi convencido a colar algo ali
  const aviso = () => {
    try {
      console.log('%cPare!', 'color:#E2463C;font:900 46px sans-serif;text-shadow:0 2px 0 #000');
      console.log('%cEsta área é para desenvolvedores. Se alguém pediu para você copiar e colar algo aqui para "ganhar moedas", "liberar fases" ou "hackear o jogo", é golpe: pode dar acesso à sua conta.', 'font:600 16px sans-serif;color:#E8C873');
    } catch { /* sem console */ }
  };
  aviso();
  // o jogo não pode ser embutido em sites de terceiros (proteção contra cliques disfarçados)
  try { if (window.top !== window.self && window.top.location.origin !== location.origin) window.top.location = location.href; } catch { document.documentElement.style.display = 'none'; }
}
