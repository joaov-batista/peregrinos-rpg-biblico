// Telemetria de uso para o painel de acessos (supabase/painel.sql). Envia pouco e raramente:
// uma "visita" ao abrir, um "início" ao entrar no jogo, um "pulso" por minuto enquanto a aba está à vista,
// os "marcos" da jornada (cada um uma vez por aparelho) e a "saída". Sem nome real nem e-mail: um código aleatório
// do aparelho. Quem tem conta aparece ligado a ela. Desliga em ☰ › Ajustes ("Enviar dados de uso").
import { inserirUso, ONLINE } from './net.js';
import { config } from './config.js';
import { jogoAtual } from './estado.js';

const CHAVE = 'peregrinos.visitante', TEMPO = 'peregrinos.tempoJogo', MARCOS = 'peregrinos.marcos';
const ler = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const gravar = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* sem armazenamento: segue sem lembrar */ } };
export function visitante() {
  let v = ler(CHAVE, null);
  if (!v) { v = (crypto.randomUUID?.() || Math.random().toString(36).slice(2) + Date.now().toString(36)).replace(/-/g, '').slice(0, 24); gravar(CHAVE, v); }
  return v;
}
const ativo = () => ONLINE && config.telemetria !== false;
const aparelho = () => matchMedia('(pointer: coarse)').matches ? (Math.min(screen.width, screen.height) >= 700 ? 'tablet' : 'celular') : 'computador';
const navegador = () => { const u = navigator.userAgent; return /Edg\//.test(u) ? 'Edge' : /OPR\//.test(u) ? 'Opera' : /SamsungBrowser/.test(u) ? 'Samsung' : /Firefox\//.test(u) ? 'Firefox' : /CriOS|Chrome\//.test(u) ? 'Chrome' : /Safari\//.test(u) ? 'Safari' : 'outro'; };
const sistema = () => { const u = navigator.userAgent; return /Android/.test(u) ? 'Android' : /iPhone|iPad|iPod/.test(u) ? 'iOS' : /Windows/.test(u) ? 'Windows' : /Mac OS/.test(u) ? 'macOS' : /Linux/.test(u) ? 'Linux' : 'outro'; };
const origem = () => { try { const h = document.referrer && new URL(document.referrer).hostname; return h && h !== location.hostname ? h.replace(/^www\./, '').replace(/^l\.|^lm\./, '') : ''; } catch { return ''; } };

export function uso(tipo, dados = {}) { if (ativo()) inserirUso('telemetria', { visitante: visitante(), tipo, dados }); }
// marco da jornada: só a primeira vez em cada aparelho (o painel conta até onde as pessoas chegaram)
export function marco(m, extra = {}) { const feitos = ler(MARCOS, []); if (feitos.includes(m)) return; feitos.push(m); gravar(MARCOS, feitos.slice(-200)); uso('marco', { m, ...extra }); }

// o retrato do jogo agora: quem, onde, quanto já andou
function retrato() {
  const G = jogoAtual(); if (!G?.char) return { jogando: false };
  const c = G.char, cm = G.cm || {}, sar = cm.sar;
  return { jogando: !!G.running, nome: c.name, cls: c.cls, nivel: c.level, area: G.def?.nome || G.area || '', fases: Object.keys(cm.feitas || {}).length,
    chefes: Object.keys(cm.chefes || {}).length, getsemani: !!cm.getsemani, espirito: !!cm.espirito, sardes: sar ? (sar.feita ? 'restaurada' : 'em andamento') : '', dif: cm.dif || '' };
}
let desde = 0;
function somarTempo() { const G = jogoAtual(); const agora = Date.now(); if (G?.running && desde && !document.hidden) gravar(TEMPO, ler(TEMPO, 0) + Math.min(120, Math.round((agora - desde) / 1000))); desde = agora; return ler(TEMPO, 0); }

export function iniciarTelemetria() {
  if (!ONLINE) return;
  uso('visita', { disp: aparelho(), so: sistema(), nav: navegador(), pwa: matchMedia('(display-mode: standalone)').matches, lingua: navigator.language, tela: innerWidth + 'x' + innerHeight, ref: origem() });
  desde = Date.now();
  setInterval(() => { const seg = somarTempo(); if (!document.hidden) uso('pulso', { ...retrato(), seg }); }, 60000);
  addEventListener('visibilitychange', () => { if (document.hidden) somarTempo(); else desde = Date.now(); });
  addEventListener('pagehide', () => uso('saida', { seg: somarTempo() }));
}
// ao entrar numa partida
export function inicioDeJogo() { desde = Date.now(); setTimeout(() => uso('inicio', { ...retrato(), seg: ler(TEMPO, 0) }), 1500); }
