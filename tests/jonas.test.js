import test from 'node:test';
import assert from 'node:assert/strict';
import jonas, { CHEFES_JONAS } from '../src/content/semana-02.js';
import corinto from '../src/content/semana-01.js';
import { ITEMS } from '../src/data/items.js';
import { canEnterDungeon, dungeonRun, scaleDungeonEntity } from '../src/game/dungeon-scaling.js';

const solid = c => '#WTS=LH'.includes(c);
function flood(rows, start) {
  const seen=new Set([start.join(',')]), todo=[start];
  for(let i=0;i<todo.length;i++){
    const [x,y]=todo[i];for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
      const nx=x+dx,ny=y+dy,key=[nx,ny].join(',');
      if(rows[ny]?.[nx] && !solid(rows[ny][nx]) && rows[ny][nx]!=='D' && !seen.has(key)){seen.add(key);todo.push([nx,ny]);}
    }
  }
  return seen;
}
test('Jonas: estudo completo em cinco fases, cinquenta perguntas e cinco chefes exclusivos',()=>{
  assert.equal(jonas.fases.length,5);assert.equal(new Set(jonas.fases.map(f=>f.chefe)).size,5);
  for(const f of jonas.fases){
    assert.equal(f.quiz.length,10);assert.ok(f.estudo.length>=4);assert.ok(f.reflexao);
    for(const q of [...f.quiz,...f.estacoes]){assert.ok(q.porque.length>20);assert.equal(new Set(q.a).size,q.a.length);assert.ok(q.a.length>=3);}
    assert.ok(CHEFES_JONAS[f.chefe]);assert.ok(ITEMS[f.recompensa]);assert.ok(f.mapa.every(r=>r.length===44));
  }
  assert.ok(ITEMS[jonas.recompensaSemana]);
});
test('cada mapa permite alcançar estações, personagens e três baús; arena exige abrir a porta',()=>{
  for(const f of jonas.fases){
    const points={};f.mapa.forEach((r,y)=>[...r].forEach((c,x)=>{(points[c]??=[]).push([x,y]);}));
    assert.equal(points.P.length,1);assert.equal(points.B.length,1);
    const before=flood(f.mapa,points.P[0]);
    assert.equal(before.has(points.B[0].join(',')),false, f.nome+' arena fechada');
    for(const p of [...points.C,...points.N,...points.M,...f.estacoes.map(e=>[e.tx,e.ty])])assert.ok(before.has(p.join(',')),f.nome+' inacessível: '+p);
    assert.ok(points.C.length>=3);
    const opened=f.mapa.map(r=>r.replaceAll('D','.'));
    assert.ok(flood(opened,points.P[0]).has(points.B[0].join(',')),f.nome+' arena inacessível');
  }
});
test('semanas independentes; progresso de Corinto não abre nem bloqueia fases de Jonas',()=>{
  const c={level:1,data:{fases:{}}};
  assert.equal(canEnterDungeon(c,jonas,1),true);assert.equal(canEnterDungeon(c,corinto,1),true);
  assert.equal(canEnterDungeon(c,jonas,2),false);
  c.data.fases['semana-01']={1:{done:true},2:{done:true},5:{done:true}};
  assert.equal(canEnterDungeon(c,jonas,2),false);
  c.data.fases['semana-02']={1:{done:true}};
  assert.equal(canEnterDungeon(c,jonas,2),true);assert.equal(canEnterDungeon(c,jonas,6),false);
});
test('escala cresce do nível 1 ao 40, respeita modos e preserva definições compartilhadas',()=>{
  for(const d of Object.values(CHEFES_JONAS)){
    const original=JSON.stringify(d), sample=(level,mode)=>scaleDungeonEntity({d,max:d.hp*1.5,atk:d.atk*1.32,posMax:100},dungeonRun(level,mode),3);
    let prev=0;
    for(let level=1;level<=40;level++){const e=sample(level,'jornada');assert.ok(e.max>prev);prev=e.max;assert.ok(e.atk>0&&e.def>=0&&Number.isFinite(e.xp));}
    for(const level of [1,10,40]){assert.ok(sample(level,'historia').max<sample(level,'jornada').max);assert.ok(sample(level,'jornada').max<sample(level,'desafio').max);assert.ok(sample(level,'historia').atk<sample(level,'desafio').atk);}
    assert.equal(JSON.stringify(d),original);
  }
  assert.deepEqual(dungeonRun(NaN,'invalid'),{level:1,mode:'jornada'});
  assert.deepEqual(dungeonRun(100,'historia'),{level:40,mode:'historia'});
});
test('o aviso sobre o retorno de Satanás pertence somente ao encerramento de Corinto',()=>{
  assert.match(corinto.fases[4].epilogo,/só uma das faces de Satanás\. Ele voltará/);
  assert.equal(jonas.fases[4].epilogo,undefined);
});
