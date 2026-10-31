import test from 'node:test';
import assert from 'node:assert/strict';
import { methods, horseSeat } from '../src/game/horseRide.js';

function party() {
  const all = [];
  function player(id, horse = false) {
    const G = Object.assign({
      char: { id }, scene: 'world', p: { x: 100, y: 100, r: 12, fx: 1, fy: 0, hp: 100, mounted: horse },
      st: { pet: horse ? 'cavalo' : null, montaria: horse ? 2.4 : 0 }, others: new Map(),
      cur: { map: { collides: () => false } }, net: {}, notices: [],
      ui: { blocking: false, toast(s) { G.notices.push(s); }, mountBtn() {}, dialog(d) { G.dialog = d; } },
      meuId() { return id; }, salaAtual() { return this.scene; },
      netEnviar(m) { for (const other of all) if (other !== this) other.onHorseRide({ ...m, de: id, sala: this.scene }); },
      sendPos() {
        for (const other of all) if (other !== this) other.others.set(id, {
          id, name: id, x: this.p.x, y: this.p.y, fx: this.p.fx, fy: this.p.fy, mv: this.p.moving, hp: this.p.dead ? 0 : 1,
          sala: this.scene, seen: performance.now(), pet: this.st.pet ? { k: this.st.pet, m: this.p.mounted } : null,
          rideDriver: this.rideDriver?.id, ridePassenger: this.ridePassenger?.id, rideToken: (this.rideDriver || this.ridePassenger)?.token
        });
      }
    }, methods);
    all.push(G); return G;
  }
  const a = player('cavaleiro', true), b = player('passageiro'), c = player('terceiro');
  all.forEach(g => g.sendPos());
  const board = () => { b.askHorseRide(b.ridePeer(a.meuId())); a.dialog.acoes[0].fn(); };
  return { a, b, c, board };
}

test('dono aceita e confirma apenas um passageiro; terceiro não ocupa assento', () => {
  const { a, b, c, board } = party(); board();
  assert.equal(a.ridePassenger.id, b.meuId()); assert.ok(a.ridePassenger.confirmed);
  assert.equal(b.rideDriver.id, a.meuId());
  assert.equal(c.canAskRide(c.ridePeer(a.meuId())), false);
  a.onHorseRide({ t:'horse-request', de:c.meuId(), para:a.meuId(), token:'simultaneo' });
  assert.equal(a.ridePassenger.id, b.meuId());
});
test('passageiro acompanha movimento e pode descer sem desmontar condutor', () => {
  const { a, b, board } = party(); board();
  a.p.x = 500; a.p.y = 320; a.p.moving = true; a.sendPos(); b.updateHorseRide();
  assert.equal(b.p.x, 500); assert.equal(b.p.y, 320); assert.ok(b.p.moving);
  b.leaveHorseRide(); assert.equal(b.rideDriver, null); assert.equal(a.ridePassenger, null); assert.ok(a.p.mounted);
});
test('pedido precisa de proximidade, cavalo e personagem livre', () => {
  const { a, b } = party();
  a.st.pet = 'burrinho'; a.sendPos(); assert.equal(b.canAskRide(b.ridePeer(a.meuId())), false);
  a.st.pet = 'cavalo'; a.p.x = 500; a.sendPos(); assert.equal(b.canAskRide(b.ridePeer(a.meuId())), false);
  a.p.x = 100; a.sendPos(); b.p.boat = true; assert.equal(b.canAskRide(b.ridePeer(a.meuId())), false);
});
test('revalida distância ao aceitar e ignora aceite sem pedido correspondente', () => {
  const { a, b } = party(); b.askHorseRide(b.ridePeer(a.meuId()));
  b.p.x = 700; b.sendPos(); a.dialog.acoes[0].fn(); assert.equal(a.ridePassenger, undefined); assert.equal(b.rideRequest, null);
  b.onHorseRide({ t:'horse-accepted', de:a.meuId(), para:b.meuId(), token:'forjado' }); assert.equal(b.rideDriver, undefined);
});
test('desmontagem, morte, mudança de área e desconexão encerram carona', () => {
  for (const event of ['dismount','death','area','disconnect','unequip']) {
    const { a, b, board } = party(); board();
    if (event === 'dismount') a.p.mounted = false;
    if (event === 'death') a.p.dead = true;
    if (event === 'area') a.scene = 'fase';
    if (event === 'unequip') a.st.pet = 'burrinho';
    a.sendPos();
    if (event === 'disconnect') b.ridePeer(a.meuId()).seen = performance.now() - 6000;
    b.updateHorseRide(); assert.equal(b.rideDriver, null, event);
  }
});
test('reserva sem confirmação expira e mensagens antigas não removem nova carona', () => {
  const { a, b, board } = party(); board();
  const old = b.rideDriver.token; b.leaveHorseRide(); b.p.x = 100; b.sendPos(); board();
  b.onHorseRide({ t:'horse-left', de:a.meuId(), para:b.meuId(), token:old }); assert.ok(b.rideDriver);
  a.ridePassenger.confirmed = false; a.ridePassenger.until = -1; a.updateHorseRide();
  assert.equal(a.ridePassenger, null); assert.equal(b.rideDriver, null);
});
test('assento desloca só a representação e respeita direção', () => {
  assert.deepEqual(horseSeat(1, 0), { x:-16, y:-17 });
  assert.deepEqual(horseSeat(-1, 0), { x:16, y:-17 });
});
