// Efeitos sonoros e música sintetizados (WebAudio), sem arquivos.
import { store } from './util.js';
import { config } from './config.js';

let AC = null, master = null, musicGain = null, sfxGain = null, musicTimer = null;
export const audio = { muted: store.get('peregrinos.mute', false), modo: null };

export function initAudio() {
  if (!AC) {
    try {
      AC = new (window.AudioContext || window.webkitAudioContext)();
      master = AC.createGain(); master.gain.value = audio.muted ? 0 : 0.8; master.connect(AC.destination);
      musicGain = AC.createGain(); musicGain.connect(master);
      sfxGain = AC.createGain(); sfxGain.connect(master);
      setVolumes();
    } catch { AC = null; }
  }
  if (AC && AC.state === 'suspended') AC.resume();
}
// volumes separados de música e efeitos (menu › Ajustes)
export function setVolumes() { if (!AC) return; musicGain.gain.value = 0.2 * (config.volMusica ?? 0.8); sfxGain.gain.value = config.volEfeitos ?? 1; }
export function setMuted(m) { audio.muted = m; store.set('peregrinos.mute', m); if (master) master.gain.value = m ? 0 : 0.8; }

function tone(f1, f2, dur, type = 'sine', vol = 0.2, delay = 0, dest) {
  if (!AC) return;
  const t = AC.currentTime + delay, o = AC.createOscillator(), g = AC.createGain();
  o.type = type; o.frequency.setValueAtTime(f1, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(dest || sfxGain || master); o.start(t); o.stop(t + dur + 0.02);
}
function noiseBurst(dur, vol = 0.15, freq = 1200) {
  if (!AC) return;
  const n = AC.createBufferSource(), b = AC.createBuffer(1, AC.sampleRate * dur, AC.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const f = AC.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq;
  const g = AC.createGain(); g.gain.value = vol;
  n.buffer = b; n.connect(f); f.connect(g); g.connect(sfxGain || master); n.start();
}

export function sfx(n) {
  if (!AC || audio.muted) return;
  switch (n) {
    case 'swing': noiseBurst(0.12, 0.12, 2400); break;
    case 'hit': tone(220, 90, 0.12, 'square', 0.12); noiseBurst(0.08, 0.1, 800); break;
    case 'crit': tone(520, 160, 0.18, 'square', 0.14); noiseBurst(0.1, 0.14, 1400); break;
    case 'hurt': tone(160, 70, 0.25, 'sawtooth', 0.16); break;
    case 'block': tone(900, 600, 0.08, 'triangle', 0.18); break;
    case 'parry': tone(1200, 1800, 0.12, 'triangle', 0.2); tone(1800, 2400, 0.15, 'sine', 0.12, 0.05); break;
    case 'dodge': noiseBurst(0.18, 0.08, 600); break;
    case 'shoot': tone(700, 300, 0.1, 'triangle', 0.1); break;
    case 'magic': tone(400, 1200, 0.3, 'sine', 0.14); tone(600, 1600, 0.3, 'sine', 0.08, 0.05); break;
    case 'kill': tone(300, 600, 0.12, 'square', 0.1); tone(600, 900, 0.12, 'square', 0.08, 0.08); break;
    case 'coin': tone(988, 0, 0.08, 'square', 0.08); tone(1319, 0, 0.18, 'square', 0.08, 0.07); break;
    case 'heal': [523, 659, 784].forEach((f, i) => tone(f, 0, 0.3, 'sine', 0.12, i * 0.08)); break;
    case 'right': [523, 659, 784, 1046].forEach((f, i) => tone(f, 0, 0.18, 'triangle', 0.12, i * 0.07)); break;
    case 'wrong': tone(300, 150, 0.35, 'sawtooth', 0.12); break;
    case 'key': [784, 988, 1319].forEach((f, i) => tone(f, 0, 0.25, 'triangle', 0.14, i * 0.09)); break;
    case 'level': [523, 659, 784, 1046, 1319].forEach((f, i) => tone(f, 0, 0.3, 'triangle', 0.14, i * 0.09)); break;
    case 'boss': tone(80, 40, 1.2, 'sawtooth', 0.2); tone(120, 60, 1.2, 'square', 0.08, 0.1); break;
    case 'gate': tone(200, 400, 0.6, 'sine', 0.14); tone(300, 600, 0.6, 'sine', 0.1, 0.1); break;
    case 'click': tone(660, 0, 0.05, 'square', 0.05); break;
    case 'step': noiseBurst(0.03, 0.03, 400); break;
  }
}

// Música ambiente: arpejo modal de lira, troca de clima no combate com chefe.
const SCALES = { mundo: [0, 2, 3, 5, 7, 9, 10], chefe: [0, 1, 4, 5, 7, 8, 10], fase: [0, 2, 4, 5, 7, 9, 11], cinema: [0, 2, 3, 5, 7, 8, 10] };
// ---- trilha: piano esparso, cordas longas e muito eco (a melancolia de um reino esquecido) ----
// Tudo é sintetizado: um "piano" de senoides com decaimento, um colchão de cordas filtradas e, nos chefes, um ostinato grave.
let eco = null, canal = null;
function sala() { // eco de sala grande: três atrasos realimentados e filtrados
  if (eco || !AC) return eco;
  eco = AC.createGain(); eco.gain.value = 1;
  for (const [t, fb] of [[0.31, 0.42], [0.47, 0.36], [0.73, 0.3]]) { const d = AC.createDelay(1.5), g = AC.createGain(), lp = AC.createBiquadFilter(); d.delayTime.value = t; g.gain.value = fb; lp.type = 'lowpass'; lp.frequency.value = 1900; eco.connect(d); d.connect(lp); lp.connect(g); g.connect(d); lp.connect(canal || musicGain); }
  return eco;
}
const nota = st => 220 * Math.pow(2, st / 12); // semitons a partir do lá
function piano(st, vol = 0.2, delay = 0, dur = 3.2) {
  if (!AC) return; const t = AC.currentTime + delay, g = AC.createGain(), f = nota(st);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.012); g.gain.exponentialRampToValueAtTime(vol * 0.35, t + 0.4); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  for (const [m, tipo, k] of [[1, 'sine', 1], [2, 'sine', 0.3], [3, 'triangle', 0.08]]) { const o = AC.createOscillator(), og = AC.createGain(); o.type = tipo; o.frequency.value = f * m; og.gain.value = k; o.connect(og); og.connect(g); o.start(t); o.stop(t + dur + 0.05); }
  g.connect(canal || musicGain); g.connect(sala());
}
function cordas(sts, dur, vol = 0.05, delay = 0) {
  if (!AC) return; const t = AC.currentTime + delay, g = AC.createGain(), lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 700; lp.Q.value = 0.4;
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + dur * 0.35); g.gain.linearRampToValueAtTime(vol * 0.8, t + dur * 0.7); g.gain.linearRampToValueAtTime(0.0001, t + dur);
  for (const st of sts) for (const des of [-5, 6]) { const o = AC.createOscillator(); o.type = 'sawtooth'; o.frequency.value = nota(st); o.detune.value = des; o.connect(lp); o.start(t); o.stop(t + dur + 0.05); }
  lp.connect(g); g.connect(canal || musicGain); g.connect(sala());
}
function tambor(vol = 0.3, delay = 0) { if (!AC) return; const t = AC.currentTime + delay, o = AC.createOscillator(), g = AC.createGain(); o.frequency.setValueAtTime(92, t); o.frequency.exponentialRampToValueAtTime(38, t + 0.3); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5); o.connect(g); g.connect(canal || musicGain); o.start(t); o.stop(t + 0.55); }
// progressões em menor (semitons a partir do lá): [baixo, acorde..., notas boas para a melodia]
const TRILHAS = {
  mundo: { compasso: 5.2, acordes: [[-12, [0, 3, 7], [12, 15, 19, 22]], [-16, [-4, 0, 3], [8, 12, 15, 20]], [-9, [3, 7, 10], [10, 15, 19, 22]], [-14, [-2, 2, 5], [10, 14, 17, 19]]], dens: 0.55 },
  fase: { compasso: 4.6, acordes: [[-12, [0, 3, 7], [12, 14, 15, 19]], [-12, [0, 5, 8], [12, 17, 20, 15]], [-17, [-5, -1, 2], [7, 11, 14, 19]], [-16, [-4, 0, 3], [8, 12, 15, 19]]], dens: 0.7 },
  chefe: { compasso: 2.15, acordes: [[-12, [0, 3, 7], [12, 15, 19]], [-12, [0, 3, 8], [12, 15, 20]], [-14, [-2, 2, 5], [10, 14, 17]], [-17, [-5, -1, 4], [7, 11, 16]]], dens: 1, luta: true }
};
// cada área tem a sua trilha: a mesma linguagem, em outro tom, outra ordem de acordes e outro andamento
function trilhaDe(mode, chave) {
  const base = TRILHAS[mode] || TRILHAS.mundo; if (!chave) return base;
  let hh = 7; for (const ch of chave) hh = (hh * 31 + ch.charCodeAt(0)) >>> 0;
  const tr = (hh % 9) - 4, rot = (hh >>> 4) % 4, vel = 0.9 + ((hh >>> 7) % 5) * 0.06;
  return { ...base, compasso: base.compasso / vel, acordes: base.acordes.map((_, i) => base.acordes[(i + rot) % 4]).map(([b, a, m]) => [b + tr, a.map(x => x + tr), m.map(x => x + tr)]), salto: (hh >>> 10) % 2 };
}
function chimbal(vol, delay) { if (!AC) return; const t = AC.currentTime + delay, n = AC.createBufferSource(), b = AC.createBuffer(1, AC.sampleRate * 0.05, AC.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length); const f = AC.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 6000; const g = AC.createGain(); g.gain.value = vol; n.buffer = b; n.connect(f); f.connect(g); g.connect(canal || musicGain); n.start(t); }
export function music(mode, chave) {
  if (AC && mode && mode === audio.modo && chave === audio.chave && musicTimer) return; audio.chave = chave; // a mesma trilha já está tocando
  audio.modo = mode || null;
  if (!AC) return;
  clearInterval(musicTimer); musicTimer = null;
  // corta o que ainda soava da trilha anterior (as notas longas não invadem a cutscene nem a luta)
  if (canal) { const velho = canal; try { velho.gain.setTargetAtTime(0, AC.currentTime, 0.12); } catch { /* */ } setTimeout(() => { try { velho.disconnect(); } catch { /* */ } }, 900); }
  canal = AC.createGain(); canal.gain.value = 1; canal.connect(musicGain); eco = null;
  if (!mode) return;
  if (mode === 'cinema') return pad(); // fundo lento e baixo para não brigar com a narração
  const T = trilhaDe(mode, chave); let n = 0;
  const compasso = () => {
    if (audio.muted || document.hidden) return;
    const [baixo, acorde, mel] = T.acordes[n % T.acordes.length], c = T.compasso, frase = Math.floor(n / T.acordes.length) % 3;
    cordas([baixo, ...acorde], c * 1.25, T.luta ? 0.06 : 0.045); piano(baixo, 0.16, 0, c);
    if (mode === 'fase') { tambor(0.16, 0); tambor(0.1, c * 0.5); tambor(0.07, c * 0.5 + 0.18); if (n % 4 === 3) cordas([acorde[0] + 13], c * 0.9, 0.022, c * 0.2); } // pulso surdo e uma nota que incomoda: a tensão de quem é vigiado
    if (T.luta) { for (let i = 0; i < 16; i++) chimbal(i % 4 === 2 ? 0.11 : 0.05, i * c / 16); if (n % 2) { cordas([baixo + 18, baixo + 24], c * 0.5, 0.05, c * 0.5); tambor(0.34, c * 0.75); tambor(0.34, c * 0.875); } }
    if (T.luta) { // ostinato grave em colcheias, tambor e uma linha que sobe
      for (let i = 0; i < 8; i++) { piano(baixo + (i % 2 ? 12 : 0), 0.12, i * c / 8, 0.5); if (i % 4 === 0) tambor(0.32, i * c / 8); if (i === 6) tambor(0.2, i * c / 8 + c / 16); }
      for (let i = 0; i < 4; i++) piano(mel[(i + frase) % mel.length] + (frase === 2 ? 12 : 0), 0.15, i * c / 4 + c / 8, 1.4);
    } else { // arpejo quebrado e, a cada duas frases, um fragmento de melodia lá em cima
      const ordem = [0, 2, 1, 2, 0, 1];
      for (let i = 0; i < 6; i++) if (Math.random() < T.dens || i === 0) piano(acorde[ordem[i] % acorde.length] + 12, 0.1 + Math.random() * 0.05, i * c / 6 + Math.random() * 0.04, 2.8);
      if (frase !== 1) { const k = Math.floor(Math.random() * mel.length); piano(mel[k], 0.17, c * 0.25, 3.6); if (Math.random() < 0.7) piano(mel[(k + 1) % mel.length], 0.14, c * 0.6, 3.4); if (frase === 2 && Math.random() < 0.6) piano(mel[(k + 2) % mel.length] + 12, 0.1, c * 0.82, 3); }
    }
    n++;
  };
  compasso(); musicTimer = setInterval(compasso, T.compasso * 1000);
}

// Cutscene: acordes longos e graves (sobe e desce devagar), bem baixinho por baixo da voz
function pad() {
  const acordes = [[0, 7, 12], [-4, 3, 8], [-2, 5, 10], [-5, 2, 7]], root = 110;
  let i = 0;
  const toca = () => {
    if (audio.muted || document.hidden) return;
    for (const st of acordes[i++ % acordes.length]) tone(root * Math.pow(2, st / 12), 0, 5.2, 'sine', 0.09, 0, canal || musicGain);
  };
  toca(); musicTimer = setInterval(toca, 4800);
}

// ---- vozes: cada personagem "fala" um murmúrio curto ao abrir a fala (como nos jogos de texto), e o texto estala ao se escrever ----
const VOZES = { // tom (Hz), timbre e ritmo por quem fala; os demais ganham um tom tirado do nome
  'Jesus': { f: 128, ond: 'sine', ritmo: 0.16, vol: 0.09, calmo: true },
  'Uma jumenta': { f: 210, ond: 'sawtooth', ritmo: 0.11, vol: 0.05 },
  'Velho Peregrino': { f: 118, ond: 'triangle', ritmo: 0.13, vol: 0.08 }
};
function vozDe(nome = '') {
  const base = Object.keys(VOZES).find(k => nome.startsWith(k)); if (base) return VOZES[base];
  let h = 0; for (const c of nome) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const fem = /a\b|Lídia|Dorcas|Priscila|Marta|Maria|viúva|Moradora|Trabalhadora|Jael/.test(nome);
  return { f: (fem ? 205 : 120) + (h % 60), ond: ['triangle', 'square', 'triangle', 'sawtooth'][h % 4], ritmo: 0.085 + (h % 5) * 0.012, vol: 0.055 };
}
export function murmurio(nome, silabas = 4) {
  if (!AC || audio.muted || config.murmurio === false) return;
  const v = vozDe(nome), n = Math.max(2, Math.min(8, silabas));
  for (let i = 0; i < n; i++) {
    const t = AC.currentTime + i * v.ritmo + Math.random() * 0.02, f = v.f * (1 + (Math.random() - 0.5) * (v.calmo ? 0.08 : 0.28)) * (i === n - 1 ? 0.86 : 1);
    const o = AC.createOscillator(), o2 = AC.createOscillator(), filtro = AC.createBiquadFilter(), g = AC.createGain();
    o.type = v.ond; o2.type = 'sine'; o.frequency.setValueAtTime(f, t); o.frequency.linearRampToValueAtTime(f * (v.calmo ? 0.97 : 0.9 + Math.random() * 0.2), t + v.ritmo);
    o2.frequency.setValueAtTime(f * 2.01, t);
    filtro.type = 'bandpass'; filtro.frequency.setValueAtTime(600 + Math.random() * 900, t); filtro.Q.value = 2.2; // a "vogal" muda a cada sílaba
    const dur = v.ritmo * (v.calmo ? 1.15 : 0.9);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v.vol, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(filtro); o2.connect(filtro); filtro.connect(g); g.connect(sfxGain || master);
    o.start(t); o2.start(t); o.stop(t + dur + 0.03); o2.stop(t + dur + 0.03);
  }
}
let ultimaTecla = 0;
export function teclaTexto(nome) { // um estalo baixinho enquanto o texto se escreve
  if (!AC || audio.muted || config.murmurio === false) return;
  const agora = AC.currentTime; if (agora - ultimaTecla < 0.045) return; ultimaTecla = agora;
  const v = vozDe(nome); tone(v.f * 3 * (0.95 + Math.random() * 0.1), 0, 0.03, 'triangle', 0.018);
}
