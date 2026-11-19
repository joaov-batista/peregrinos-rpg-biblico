// O co-op da célula: o mesmo "Caminhar juntos" do jogo (src/caminho/juntos.js) — vícios e chefe compartilhados, um aparelho
// "dono" de cada página que simula o mundo e manda retratos, os golpes de cada um contando no mesmo chefe, as regras de
// queda do jogo normal (enquanto alguém está de pé, quem cai volta à luta; se todos caem, o encontro recomeça) — mas sem o
// limite de quatro e sem a ligação própria: as mensagens passam pela sala da célula (rede.js), que já segura todo mundo.
// Aqui todo aparelho é "convidado" do ponto de vista do Juntos; o anfitrião da sala só retransmite.
import { Juntos } from '../caminho/juntos.js';

// o retrato do peregrino que vai pela rede: só o que o desenho, a mira dos chefes e as regras de queda leem
const NUM = ['x', 'y', 'vx', 'vy', 'face', 'vig', 'dashT', 'orando', 'lampA', 'desliza', 'passo', 'vida', 'vidaMax', 'sq', 'stunT', 'oleoFrac', 'inv', 'flashT', 'h', 'w', 'carga', 'oraAnda'];
const BOOL = ['chao', 'lamp', 'morto', 'rasteiro', 'parede'];

export class JuntosCelula extends Juntos {
  constructor(G, sala) {
    super(G);
    this.sala = sala; this.anfitriao = false; this.codigo = sala.codigo; this.local = sala.local;
    this.rede = { con: null, via: 'retransmissor', fechar() {} }; // "retransmissor": o Juntos manda retratos num ritmo mais calmo (para caber muita gente)
    this.eu = sala.id; this.ultimo = performance.now();
    this.sincronizar();
  }
  // quem está na sala vira companheiro (a lista vem da sala; os ids mudam se o anfitrião cair e outro assumir)
  sincronizar() {
    const s = this.sala;
    if (this.eu !== s.id) { this.eu = s.id; this.pares.clear(); this.souDono = true; }
    for (const q of s.lista.values()) if (q.id !== s.id && !q.telao && !this.pares.has(q.id)) this.chegou(q.id, q, true);
    for (const id of [...this.pares.keys()]) if (!s.lista.has(id)) this.pares.delete(id);
  }
  enviar(m) { this.sala.jx(m); }
  chegouDaSala(m) { this.ultimo = performance.now(); if (m.de != null && !this.pares.has(m.de) && this.sala.lista.has(m.de)) this.sincronizar(); try { this.receber(m); } catch (e) { console.error('[celula coop]', e); } }
  estado() {
    const G = this.G, p = G.eu, o = { t: 'e', a: G.area, dn: this.souDono ? 1 : 0, au: G.ui.blocking || G.pausaGeral ? 1 : 0 };
    for (const k of NUM) { const v = p[k]; if (typeof v === 'number') o[k] = Math.round(v * 10) / 10; }
    for (const k of BOOL) o[k] = !!p[k]; // sempre os dois valores: quem levantou precisa deixar de estar caído na tela dos outros
    if (p.atk) o.atk = { dir: p.atk.dir, t: Math.round((p.atk.t || 0) * 100) / 100, dur: p.atk.dur, face: p.atk.face, semCaixa: true };
    const ts = G.tiros.filter(t => t.amigo && !t.nid); if (ts.length) o.ts = ts.slice(0, 6).map(t => [t.x | 0, t.y | 0, t.vx | 0, t.vy | 0, t.r, t.tipo, t.cor]);
    return o;
  }
  // a sala cuida de reconectar; o Juntos não abre ligação própria
  reconectar() {}
  caiu() {}
  sair() { this.fechado = true; if (this.G.mp === this) this.G.mp = null; }
  saiu(id) { if (this.pares.delete(id)) { /* o aviso já vem da sala */ } }
  chegou(id, m, quieto) { super.chegou(id, m, true); }
}
