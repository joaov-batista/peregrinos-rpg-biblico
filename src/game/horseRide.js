// O dono do cavalo reserva o único assento; pedido/aceite/confirmação têm prazo.
const RANGE = 80, FRESH = 5000, TIMEOUT = 10000;
const now = () => performance.now();
export const horseSeat = (fx = 0, fy = 1) => ({ x: -fx * 16, y: -17 - fy * 12 });
export function instalarCarona(Game) { Object.assign(Game.prototype, methods); }
export const methods = {
  ridePeer(id) { return [...this.others.values()].find(o => String(o.id) === String(id)); },
  rideNear(o) {
    return !!o && now() - o.seen < FRESH && (o.sala || 'world') === 'world' && o.hp > 0 &&
      Math.hypot(o.x - this.p.x, o.y - this.p.y) <= RANGE;
  },
  rideOnFoot() {
    const p = this.p;
    return this.scene === 'world' && !p.dead && !p.mounted && !p.boat && !p.swimming && !p.charm && !(p.stun > 0) && !(p.root > 0) && !(p.sleep > 0) && !this.rideDriver;
  },
  canCarryRider(o) {
    return this.scene === 'world' && !this.p.dead && this.p.mounted && this.st.pet === 'cavalo' &&
      !this.p.boat && !this.rideDriver && !this.ridePassenger && this.rideNear(o) && !o.pet?.m && !o.rideDriver && !o.boat && !o.swimming;
  },
  canAskRide(o) {
    return !!this.net && this.rideOnFoot() && !this.rideRequest && this.rideNear(o) && o.pet?.k === 'cavalo' && !!o.pet.m && !o.ridePassenger;
  },
  rideSend(t, para, token) { this.netEnviar({ t, para: String(para), token }); },
  rideBroadcast() { if (this.net && this.salaAtual()) { this.lastSent = null; this.sendPos(); } },
  askHorseRide(o) {
    if (!this.canAskRide(o)) return this.ui.toast('Aproxime-se de um cavalo montado com o segundo assento livre.');
    const token = crypto.randomUUID();
    this.rideRequest = { id: String(o.id), token, until: now() + TIMEOUT };
    this.rideSend('horse-request', o.id, token);
    this.ui.toast('Pedido de carona enviado a ' + o.name + '.');
  },
  acceptHorseRide(offer) {
    if (this.rideOffer !== offer) return;
    this.rideOffer = null;
    if (offer.until < now() || !this.canCarryRider(this.ridePeer(offer.id))) {
      this.rideSend('horse-denied', offer.id, offer.token); return;
    }
    this.ridePassenger = { ...offer, until: now() + 5000, confirmed: false };
    this.rideBroadcast();
    this.rideSend('horse-accepted', offer.id, offer.token);
  },
  leaveHorseRide(announce = true) {
    const driver = this.rideDriver, rider = this.ridePassenger, request = this.rideRequest, offer = this.rideOffer;
    this.rideDriver = this.ridePassenger = this.rideRequest = this.rideOffer = null;
    if (announce) for (const pair of [driver, rider, request, offer]) if (pair) this.rideSend('horse-left', pair.id, pair.token);
    if (driver) {
      this.p.moving = false;
      // O centro do cavalo é uma posição válida; procure espaço ao lado sem atravessar paredes.
      for (const [dx, dy] of [[24, 0], [-24, 0], [0, 24], [0, -24]]) {
        if (!this.cur.map.collides(this.p.x + dx, this.p.y + dy, this.p.r)) { this.p.x += dx; this.p.y += dy; break; }
      }
      this.ui.toast('Você desceu do cavalo.');
    }
    this.ui.mountBtn?.(!!this.st.montaria, !!this.p.mounted);
    if (driver || rider) this.rideBroadcast();
  },
  onHorseRide(m) {
    if (String(m.para) !== this.meuId() || typeof m.token !== 'string' || m.token.length > 100) return;
    const id = String(m.de), peer = this.ridePeer(id);
    const matches = pair => pair && pair.id === id && pair.token === m.token;
    switch (m.t) {
      case 'horse-request': {
        if (!this.canCarryRider(peer) || this.rideOffer || this.ui.blocking) { this.rideSend('horse-denied', id, m.token); return; }
        const offer = this.rideOffer = { id, token: m.token, until: now() + TIMEOUT };
        this.ui.dialog({ nome: 'Carona no cavalo', texto: peer.name + ' quer viajar com você. Você conduz; R permite descer.', acoes: [
          { label: 'Levar passageiro', fn: () => this.acceptHorseRide(offer) },
          { label: 'Agora não', fn: () => { if (this.rideOffer === offer) { this.rideOffer = null; this.rideSend('horse-denied', id, m.token); } } }
        ] });
        break;
      }
      case 'horse-accepted': {
        if (!matches(this.rideRequest) || this.rideRequest.until < now() || !this.rideOnFoot() || !this.rideNear(peer) || peer.pet?.k !== 'cavalo' || !peer.pet.m) {
          this.rideSend('horse-left', id, m.token); return;
        }
        this.rideRequest = null;
        this.rideDriver = { id, token: m.token, until: now() + 2000 };
        this.p.guard = false; this.p.dodgeT = 0; this.p.atkT = 0; this.p.holdT = 0; this.p.charging = false; this.p.atkBuf = 0;
        this.rideSend('horse-confirmed', id, m.token);
        this.ui.mountBtn?.(true, true); this.ui.toast('Você está na garupa. R ou Interagir para descer.');
        this.updateHorseRide(); this.rideBroadcast(); break;
      }
      case 'horse-confirmed':
        if (matches(this.ridePassenger) && this.ridePassenger.until >= now()) this.ridePassenger.confirmed = true;
        break;
      case 'horse-denied':
        if (matches(this.rideRequest)) { this.rideRequest = null; this.ui.toast('A carona não está disponível.'); }
        break;
      case 'horse-left':
        if ([this.rideDriver, this.ridePassenger, this.rideRequest, this.rideOffer].some(matches)) this.leaveHorseRide(false);
        break;
    }
  },
  updateHorseRide() {
    if (this.rideRequest?.until < now()) { this.rideRequest = null; this.ui.toast('O pedido de carona expirou.'); }
    if (this.rideOffer?.until < now()) this.rideOffer = null;
    const rider = this.ridePassenger, driver = this.rideDriver;
    if (rider) {
      const o = this.ridePeer(rider.id);
      if (this.scene !== 'world' || this.p.dead || !this.p.mounted || this.st.pet !== 'cavalo' || !o || now() - o.seen > FRESH || (o.sala || 'world') !== 'world' || o.hp <= 0 ||
        (now() > rider.until && (!rider.confirmed || o.rideDriver !== this.meuId() || o.rideToken !== rider.token))) this.leaveHorseRide();
    }
    if (driver) {
      const o = this.ridePeer(driver.id);
      if (this.scene !== 'world' || this.p.dead || !o || now() - o.seen > FRESH || (o.sala || 'world') !== 'world' || o.hp <= 0 || o.pet?.k !== 'cavalo' || !o.pet.m ||
        (now() > driver.until && (o.ridePassenger !== this.meuId() || o.rideToken !== driver.token))) { this.leaveHorseRide(); return; }
      this.p.x = o.x; this.p.y = o.y; this.p.fx = o.fx; this.p.fy = o.fy; this.p.moving = !!o.mv; this.p.walk = o.walk || 0;
      // Também publica a posição quando um menu está aberto.
      if (now() - (this.rideSent || 0) > 100) { this.rideSent = now(); this.rideBroadcast(); }
    }
  }
};
