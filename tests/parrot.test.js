import test from 'node:test';
import assert from 'node:assert/strict';
import { updateParrot, shoulder, PARROT_ATTACK } from '../src/game/parrot.js';
import { ITEMS } from '../src/data/items.js';
import { LOJAS } from '../src/data/npcs.js';
function setup() {
  const a = { kind:'papagaio', x:0, y:0, fx:1, walk:0, cd:0 }, hits=[];
  const e = { x:120, y:100, r:14, hp:100, kind:'enemy' };
  const G = { p:{x:0,y:100,fx:1,fy:0}, st:{spd:150}, cur:{map:{clearLine:()=>true}}, enemies:[e], petHit(a,e,luta){hits.push({e,luta}); e.hp-=10;} };
  const tick = (n=1)=>{for(let i=0;i<n;i++)updateParrot(G,a,.02);};
  return {G,a,e,hits,tick};
}
test('papagaio disponível no curral e equipado no slot de companheiro',()=>{
  assert.ok(LOJAS.animais.itens.includes('papagaio')); assert.equal(ITEMS.papagaio.slot,'pet'); assert.equal(ITEMS.papagaio.pet,'papagaio');
});
test('repousa no ombro e acompanha o dono sem bater as asas',()=>{
  const {G,a,tick}=setup(); G.enemies=[]; tick(); assert.equal(a.state,'perched'); assert.equal(a.moving,false);
  G.p.x=400; G.p.fx=-1; tick(); const at=shoulder(G.p); assert.equal(a.x,at.x); assert.equal(a.y,at.y);
});
test('voa, acerta uma vez, retorna e respeita o intervalo de ataques',()=>{
  const {G,a,e,hits,tick}=setup(); tick(); assert.equal(a.state,'attacking'); assert.equal(hits.length,0);
  for(let i=0;i<100&&hits.length===0;i++)tick(); assert.equal(hits.length,1); assert.equal(e.hp,90); assert.equal(a.state,'returning');
  for(let i=0;i<100&&a.state!=='perched';i++)tick(); assert.equal(a.state,'perched'); assert.equal(hits.length,1);
  assert.equal(hits[0].luta,PARROT_ATTACK); assert.ok(a.cd>0); tick(5); assert.equal(hits.length,1);
});
test('não atravessa paredes para atacar nem desperta chefes ou fere Leviatã',()=>{
  for(const props of [{inv:true},{submerged:true},{clone:true},{kind:'boss',engaged:false},{id:'leviata'},{hp:0}]){
    const {G,a,e,tick,hits}=setup(); Object.assign(e,props); tick(150); assert.equal(a.state,'perched'); assert.equal(hits.length,0);
  }
  const {G,a,tick}=setup(); G.cur.map.clearLine=()=>false; tick(150); assert.equal(a.state,'perched');
});
test('perder o alvo ou mudar de mapa cancela a bicada sem dano tardio',()=>{
  const {G,a,tick,hits}=setup(); tick(); G.enemies=[]; tick(100); assert.equal(a.state,'perched'); assert.equal(hits.length,0);
  const other=setup(); other.tick(); other.G.cur={map:{clearLine:()=>true}}; other.G.enemies=[]; other.tick(); assert.equal(other.a.state,'perched'); assert.equal(other.hits.length,0);
});
test('papagaio fica no ombro do passageiro sem atacar da garupa',()=>{
  const {G,a,tick,hits}=setup(); G.rideDriver={id:'cavaleiro'}; tick(200); assert.equal(a.state,'perched'); assert.equal(hits.length,0); assert.equal(a.y,shoulder(G.p,true).y);
});
