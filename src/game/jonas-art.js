// Sprites vetoriais próprios: silhuetas e animações independentes dos chefes de Corinto.
import { shape, line, oval, gradient, eyes, mask, chain } from './creature-primitives.js';
export const JONAS_ART = {
  fuga(g,t,C,b,m) {
    for(const s of [-1,1]){g.save();g.scale(s,1);g.translate(17,-15);g.rotate(Math.sin(t*2+s)*.15+m.attack*.2);shape(g,'M0-30 Q38-20 45 22 L27 11 15 36 5 24Z',gradient(g,'#397E86',C.deep));line(g,'M8-20 Q25 2 30 18','#8DD7C8',1);g.restore();}
    shape(g,'M-17-40 17-40 26 18 13 34 0 23-16 36-27 20Z',gradient(g,'#477B84','#122F42'));
    mask(g,0,-54,.95,C);shape(g,'M-23-60 Q-10-93 8-80 L28-59 10-65-4-60Z','#172F42');line(g,'M-21-60 23-59',C.gold,2);
    g.save();g.translate(0,-12);g.rotate(t*.65);oval(g,0,0,17,17,'#172F42',C.gold,2);shape(g,'M0-14 5 0 0 13-5 0Z',C.accent);g.restore();
    for(const s of [-1,1]){g.save();g.translate(s*32,-13+Math.sin(t*2+s)*5);g.rotate(s*.3);shape(g,'M-8-12 8-12 8 12-8 12Z','#DDD1A5');line(g,'M-5-7 4-3-3 2 5 7','#417A82',1.4);g.restore();}
  },
  pavor(g,t,C,b,m) {
    for(let i=0;i<6;i++){const y=29-i*14,w=12+i*7,x=Math.sin(t*3-i*.8)*(5+m.attack*4);oval(g,x,y,w,7,gradient(g,i%2?'#689BAC':'#2C617A','#163347'),C.accent,.7);line(g,`M${x-w*.7} ${y} Q${x} ${y+6} ${x+w*.7} ${y}`,'#C0EBEF',1,false);}
    for(const s of [-1,1]){g.save();g.scale(s,1);g.rotate(Math.sin(t*1.4+s)*.08);shape(g,'M12-47 44-68 36-43 57-49 32-20 39-40Z',gradient(g,'#D3F3EE','#5898BA'));g.restore();}
    oval(g,0,-43,20,14,'#0C2A3B','#97CFD9',2);oval(g,0,-43,8,11,C.accent);oval(g,Math.sin(t)*3,-43,3,9,'#123348');
    g.save();g.translate(0,-83);g.rotate(t*.3);line(g,'M-7 0 2-12-1-2 8-2-4 12 0 1Z','#F4E6AE',2);g.restore();
  },
  desespero(g,t,C,b,m) {
    for(const s of [-1,1]){g.save();g.scale(s,1);for(let i=0;i<3;i++){const x=14+i*8;line(g,`M${x}-23 Q${65+i*4} ${Math.sin(t*2+i)*15} ${31+i*11} ${40+Math.sin(t+i)*9}`,'#7869A8',5,false);line(g,`M${x}-23 Q${65+i*4} ${Math.sin(t*2+i)*15} ${31+i*11} ${40+Math.sin(t+i)*9}`,'#BCB1DD',1,false);}g.restore();}
    shape(g,'M-20-48 Q0-71 20-48 L27-15 15 20 0 30-15 20-27-15Z',gradient(g,'#6B6B99','#152C42'));
    for(let i=0;i<4;i++){const y=-23+i*11;line(g,`M-18 ${y} Q0 ${y+12} 18 ${y}`,'#BCB1DD',2);}
    mask(g,0,-50,1.2,{...C,accent:'#D7BCF4'});oval(g,0,-11,5,8,'#DFDBAF',null);
    for(let i=0;i<5;i++){const a=t+i*1.26;oval(g,Math.cos(a)*46,Math.sin(a)*24-28,2,3,C.accent,null);}
  },
  violencia(g,t,C,b,m) {
    for(const s of [-1,1]){g.save();g.scale(s,1);shape(g,'M9 0 25 0 28 30 7 30Z',gradient(g,'#A57E68','#413F45'));g.translate(0,Math.sin(m.cycle+s)*m.move*3);shape(g,'M18-53 38-51 46-15 26-6Z',gradient(g,'#B99B80','#675452'));chain(g,[[34,-27],[48,-9],[50,20]],C);oval(g,50,25,10,12,'#4E5660',C.gold,2);g.restore();}
    shape(g,'M-27-46 27-46 31-4 0 13-31-4Z',gradient(g,'#AA8771','#4D4953'));
    for(let y=-34;y<2;y+=10){line(g,`M-23 ${y}H23`,'#D6B89A',1);line(g,`M${y%20?-10:8} ${y}v9`,'#D6B89A',1);}
    shape(g,'M-20-50-20-76-11-76-11-66-4-66-4-80 5-80 5-66 12-66 12-76 20-76 20-50Z','#BD9F80');
    eyes(g,0,-56,8,3,C);line(g,'M-8-43 0-37 8-43','#322D36',2);
    if(b.hp<b.max*.5)line(g,'M-5-73 3-54-5-37 5-24-4-7',C.accent,2);
  },
  ressentimento(g,t,C,b,m) {
    for(const s of [-1,1]){g.save();g.scale(s,1);line(g,`M12 5 Q39 9 ${45+Math.sin(t*2)*4} -23`,'#80734E',7,false);line(g,'M33-2 46-2 39-12 M17-3 18-19 28-15',C.gold,2);g.restore();}
    shape(g,'M-16-43 Q-30-17-19 4 L-31 31-10 24 0 37 10 24 31 31 18 4 Q31-17 16-43Z',gradient(g,'#8D8462','#333C39'));
    for(let x=-12;x<=12;x+=8)line(g,`M${x}-33 Q${x-8}-8 ${x} 21`,'#B7AA7B',1);
    mask(g,0,-48,1.1,C,'wide');
    for(let i=0;i<7;i++){const a=-Math.PI+i*Math.PI/6;g.save();g.translate(Math.cos(a)*29,-57+Math.sin(a)*17);g.rotate(a+Math.sin(t*1.3+i)*.12);shape(g,'M0 0 Q10-18 25-9 Q17 4 0 0Z',i<3?'#788D65':'#B49C65');line(g,'M2-1 19-8','#DAC58B',.7);g.restore();}
    oval(g,0,-13,9,10,'#242F32',C.gold);shape(g,'M0-8 C-13-19-15-3 0 3 C15-3 13-19 0-8Z',b.hp<b.max*.5?'#F1CD91':'#9B6E6D');
    for(let i=0;i<4;i++){const a=t*.5+i*1.57;g.save();g.translate(Math.cos(a)*49,((t*13+i*22)%91)-58);g.rotate(a);shape(g,'M0 0 Q8-9 15-3 Q7 5 0 0Z','#AD945A');g.restore();}
  }
};
