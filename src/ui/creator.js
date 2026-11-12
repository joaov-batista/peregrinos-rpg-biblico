import { personMotion } from '../game/sprite-motion.js';
import { h, pick } from '../util.js';
import { CLASSES, CLASS_ATTIRE, LOOK_OPTIONS, defaultLook } from '../data/classes.js';
import { ITEMS } from '../data/items.js';
import { drawPerson } from '../game/character-art.js';
import { newCharData } from '../game/player.js';
import { net } from '../net.js';
import { sfx } from '../audio.js';
import { config } from '../config.js';
import { novoHeroi } from '../caminho/heroi.js';
import { quadroHeroi, AX, AY } from '../caminho/pixel/humano.js';
const pxHeroi = novoHeroi(0, 0, 5);
import { desligarCeu } from './ceu.js';
import { icon, itemIcon } from './icons.js';

const ROLES = { guerreiro:'Combate próximo · resistência', pastor:'À distância · precisão', profeta:'Luz · poder espiritual', levita:'Louvor · proteção', zelote:'Agilidade · golpes rápidos', valente:'Alcance · firmeza', juiz:'Controle · versatilidade' };
const SHORT = { guerreiro:'Guerreiro da Fé', pastor:'Pastor', profeta:'Profeta', levita:'Levita', zelote:'Zelote', valente:'Valente de Davi', juiz:'Juiz' };
const COLOR_NAMES = {
  skin:['Clara','Dourada','Bronze','Castanha','Escura'],
  hair:['Ébano','Castanho escuro','Castanho','Cobre dourado','Louro','Prateado','Ruivo escuro','Ruivo'],
  tunic:['Azul de ardósia','Vinho','Sálvia','Ametista','Areia','Noite','Linho','Petróleo'],
  cape:['Azul noturno','Bronze','Bordô','Violeta','Musgo','Pérola','Sem capa']
};

// O fundo da prévia, em pixel (cada ponto vale 4): a praça do Refúgio à noite — céu em faixas, lua, a muralha ao longe,
// um arco de pedra, um poste aceso, uma oliveira e o chão de lajes onde o peregrino pisa.
function sanctuary(g, t) {
  const P = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x * 4, y * 4, w * 4, h * 4); };
  ['#0B1024', '#0E1630', '#121C3A', '#172446', '#1D2D52', '#25375E', '#2F426A', '#3A4A72'].forEach((c, i) => P(0, i * 8, 90, 9, c));
  for (let i = 0; i < 30; i++) { const x = (i * 37) % 90, y = (i * 29 + (i >> 2) * 7) % 47; if ((i + Math.floor(t * 1.5)) % 7) P(x, y, 1, 1, i % 4 ? '#C9CCDA' : '#FFF4CF'); }
  P(64, 9, 8, 8, '#FFF4CF'); P(63, 10, 10, 6, '#FFF4CF'); P(65, 8, 6, 10, '#FFF4CF'); P(67, 10, 2, 2, '#E4D6A6'); P(65, 13, 2, 2, '#E4D6A6'); P(69, 14, 1, 1, '#E4D6A6');
  // muralha e torres ao longe, com janelas acesas
  for (let x = 0; x < 90; x++) { const a = 58 - ((x >> 3) % 2) - Math.round(Math.sin(x * 0.2) * 1); P(x, a, 1, 90 - a, '#1B2748'); }
  for (const [x, w, a] of [[4, 9, 44], [30, 7, 49], [72, 11, 42]]) { P(x, a, w, 60 - a, '#1B2748'); for (let k = 0; k < w; k += 2) P(x + k, a - 1, 1, 1, '#1B2748'); P(x + 2, a + 4, 1, 2, '#FFD98A'); if (w > 8) P(x + w - 3, a + 9, 1, 2, '#FFD98A'); }
  // arco de pedra atrás do peregrino
  for (const x of [14, 68]) { P(x, 30, 8, 56, '#2B3653'); P(x, 30, 1, 56, '#1A2238'); P(x + 7, 30, 1, 56, '#4A5A86'); for (let y = 34; y < 86; y += 6) P(x + 1, y, 6, 1, '#1A2238'); P(x - 1, 28, 10, 3, '#38466B'); P(x - 1, 28, 10, 1, '#6276AE'); }
  for (let k = 0; k <= 30; k++) { const an = Math.PI * k / 30, x = Math.round(45 - Math.cos(an) * 27), y = Math.round(29 - Math.sin(an) * 17); P(x - 2, y - 2, 5, 4, k % 5 === 0 ? '#1A2238' : '#2B3653'); P(x - 2, y - 2, 5, 1, '#4A5A86'); }
  P(42, 9, 7, 5, '#38466B'); P(42, 9, 7, 1, '#6276AE'); P(44, 10, 3, 3, '#E8C873');
  // oliveira e poste aceso
  P(7, 70, 2, 16, '#5E4630'); P(6, 76, 1, 10, '#3A2A1C'); for (const [x, y, w, h, c] of [[2, 62, 12, 7, '#4F6B4A'], [4, 58, 8, 5, '#6E8A5E'], [0, 65, 6, 5, '#3F5A3E'], [9, 64, 6, 6, '#3F5A3E'], [5, 59, 3, 1, '#A8C098']]) P(x, y, w, h, c);
  const pisca = Math.floor(t * 6) % 3 === 0 ? '#FFD86A' : '#FFE9A8';
  P(81, 58, 1, 28, '#17121f'); P(80, 85, 3, 1, '#17121f'); P(79, 53, 5, 6, '#17121f'); P(80, 54, 3, 4, pisca); g.globalAlpha = 0.1; P(74, 48, 15, 16, '#FFE9A8'); g.globalAlpha = 0.07; P(70, 44, 23, 24, '#FFE9A8'); g.globalAlpha = 1;
  // chão de lajes
  P(0, 86, 90, 24, '#232D49'); P(0, 86, 90, 1, '#C9B88A'); P(0, 87, 90, 1, '#4A5A86');
  for (let y = 0; y < 5; y++) for (let x = (y % 2) * 5 - 5; x < 90; x += 10) { P(x, 89 + y * 4, 1, 4, '#141B2D'); } for (let y = 0; y < 6; y++) P(0, 88 + y * 4, 90, 1, y ? '#141B2D' : '#1A2238');
  g.globalAlpha = 0.35; P(34, 86, 22, 2, '#05060B'); g.globalAlpha = 1;
  // vaga-lumes
  for (let i = 0; i < 9; i++) { const k = (t * 0.05 + i / 9) % 1, x = 8 + (i * 31) % 74 + Math.round(Math.sin(t * 0.6 + i) * 2), y = Math.round(84 - k * 50); if (Math.floor(t * 3 + i) % 3) { g.globalAlpha = Math.sin(k * Math.PI); P(x, y, 1, 1, '#FFE9A8'); } } g.globalAlpha = 1;
  for (let y = 100; y < 110; y++) { g.globalAlpha = (y - 99) / 12; P(0, y, 90, 1, '#0B1024'); } g.globalAlpha = 1;
}

export function mountCreator(root, onCreated, onBack) {
  desligarCeu(); root.replaceChildren();root.hidden=false;root.classList.add('creating');
  const look=defaultLook(),motionActor={};
  let cls='guerreiro',step=0,appearance='rosto',face=0,motion='idle',time=0,last=0,raf=0,busy=false,attackStart=-9,customCloth=false;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const faces=[[0,1],[1,0],[0,-1],[-1,0]], names=['Frente','Direita','Costas','Esquerda'];
  const cv=h('canvas',{width:720,height:880,class:'pilgrim-canvas',role:'img','aria-label':'Prévia do peregrino de corpo inteiro'}),g=cv.getContext('2d');
  const previewName=h('h2',{},CLASSES[cls].nome),previewRole=h('p',{},ROLES[cls]),faceLabel=h('span',{class:'face-label','aria-live':'polite'},names[0]);
  const msg=h('p',{class:'creator-message',role:'status','aria-live':'polite'});
  const name=h('input',{id:'pilgrim-name',maxlength:16,placeholder:'Como você será chamado?',autocomplete:'off','aria-describedby':'name-help','aria-label':'Nome do peregrino'});
  const body=h('div',{class:'creation-body',id:'creation-content'}),nav=h('nav',{class:'creation-steps','aria-label':'Etapas da criação'});
  const back=h('button',{class:'quiet-button',type:'button',onclick:()=>{
    if(busy)return;
    if(step>0){step--;render();}else{cancelAnimationFrame(raf);root.classList.remove('creating');onBack();}
  }});
  const next=h('button',{class:'forge-primary',type:'submit'});
  const updatePreview=()=>{previewName.textContent=name.value.trim()||CLASSES[cls].nome;previewRole.textContent=ROLES[cls];cv.setAttribute('aria-label',`${CLASSES[cls].nome}, ${names[face].toLowerCase()}, com ${ITEMS[CLASSES[cls].armaInicial].nome}`);};
  name.addEventListener('input',()=>{name.removeAttribute('aria-invalid');msg.textContent='';updatePreview();});
  const rotate=d=>{face=(face+d+4)%4;faceLabel.textContent=names[face];updatePreview();};
  const modeButtons=h('div',{class:'preview-modes','aria-label':'Animação da prévia'});
  for(const [key,title,art] of [['idle','Repouso','eye'],['walk','Caminhar','walk'],['attack','Atacar','espada']]){
    modeButtons.append(h('button',{type:'button',class:key==='idle'?'on':'','aria-pressed':String(key==='idle'),onclick:e=>{
      motion=key;if(key==='attack')attackStart=time;
      modeButtons.querySelectorAll('button').forEach(b=>{const on=b===e.currentTarget;b.classList.toggle('on',on);b.setAttribute('aria-pressed',String(on));});
    }},icon(art,15),title));
  }
  const preview=h('aside',{class:'pilgrim-preview','aria-label':'Seu peregrino'},
    h('div',{class:'preview-kicker'},h('span',{class:'tiny-diamond'}),'SEU PEREGRINO'),cv,
    h('div',{class:'preview-caption'},previewName,previewRole),
    h('div',{class:'preview-turn'},h('button',{type:'button','aria-label':'Girar para a esquerda',onclick:()=>rotate(-1)},icon('back',17)),faceLabel,h('button',{type:'button','aria-label':'Girar para a direita',onclick:()=>rotate(1)},icon('arrow',17))),modeButtons);
  const field=(label,node)=>h('fieldset',{class:'appearance-field'},h('legend',{},label),node);
  const swatches=key=>h('div',{class:'ink-swatches'},LOOK_OPTIONS[key].map((color,i)=>h('button',{
    type:'button',class:'ink-swatch'+(look[key]===color?' on':''),style:`--swatch:${color==='none'?'transparent':color}`,
    'aria-label':COLOR_NAMES[key][i],title:COLOR_NAMES[key][i],'aria-pressed':String(look[key]===color),
    onclick:e=>{look[key]=color;if(key==='tunic'||key==='cape')customCloth=true;e.currentTarget.parentElement.querySelectorAll('button').forEach(b=>{const on=b===e.currentTarget;b.classList.toggle('on',on);b.setAttribute('aria-pressed',String(on));});}
  },color==='none'?'∅':icon('check',14))));
  const choices=key=>h('div',{class:'ink-choices'},LOOK_OPTIONS[key].map(o=>h('button',{
    type:'button',class:look[key]===o.id?'on':'','aria-pressed':String(look[key]===o.id),
    onclick:e=>{look[key]=o.id;e.currentTarget.parentElement.querySelectorAll('button').forEach(b=>{const on=b===e.currentTarget;b.classList.toggle('on',on);b.setAttribute('aria-pressed',String(on));});}
  },o.nome)));
  function classDetails(){
    const C=CLASSES[cls];
    return h('div',{class:'vocation-detail','aria-live':'polite'},
      h('div',{class:'vocation-detail-top'},h('h3',{},C.nome),h('span',{},C.ref)),
      h('p',{},C.desc),h('div',{class:'vocation-skill'},icon('spark',16),h('span',{},C.skill.nome),h('small',{},C.skill.custo+' Fé · '+C.skill.cd+'s')));
  }
  function render(focus=false){
    updatePreview();nav.replaceChildren();body.replaceChildren();msg.textContent='';
    for(const [i,title] of ['Vocação','Aparência','Nome'].entries())nav.append(h('button',{
      type:'button',class:'creation-step'+(step===i?' active':'')+(step>i?' complete':''),'aria-current':step===i?'step':null,
      onclick:()=>{if(!busy){step=i;render(true);}}
    },h('span',{class:'step-number'},step>i?icon('check',14):'0'+(i+1)),title));
    if(step===0){
      body.append(h('div',{class:'section-heading'},h('span',{class:'overline'},'01 / O CHAMADO'),h('h2',{tabindex:-1},'Escolha sua vocação'),h('p',{},'Sete caminhos. Uma mesma fé.')));
      const grid=h('div',{class:'vocation-grid','aria-label':'Vocações'});
      for(const [key,C] of Object.entries(CLASSES))grid.append(h('button',{
        type:'button',class:'vocation'+(cls===key?' selected':''),'aria-pressed':String(cls===key),onclick:()=>{cls=key;if(!customCloth)Object.assign(look,CLASS_ATTIRE[key]);sfx('click');render();body.querySelectorAll('.vocation')[Object.keys(CLASSES).indexOf(key)]?.focus({preventScroll:true});}
      },h('span',{class:'vocation-emblem'},icon(C.arma,27)),h('span',{class:'vocation-label'},h('b',{},SHORT[key]),h('small',{},ROLES[key])),h('span',{class:'selection-mark'},cls===key?icon('check',13):'')));
      body.append(grid,classDetails());
    }else if(step===1){
      body.append(h('div',{class:'section-heading'},h('span',{class:'overline'},'02 / A PRESENÇA'),h('h2',{tabindex:-1},'Dê forma ao seu peregrino'),h('p',{},'Cada detalhe conta uma parte da sua história.')));
      const tabs=h('div',{class:'appearance-tabs','aria-label':'Grupos de aparência'});
      for(const [key,title] of [['rosto','Rosto e cabelo'],['vestes','Corpo e vestes']])tabs.append(h('button',{type:'button',class:appearance===key?'on':'','aria-pressed':String(appearance===key),onclick:()=>{appearance=key;render();}},title));
      body.append(tabs);
      const options=h('div',{class:'appearance-fields'});
      if(appearance==='rosto')options.append(field('Tom de pele',swatches('skin')),field('Cor do cabelo',swatches('hair')),field('Cabelo e cobertura',choices('style')),field('Barba',choices('beard')));
      else options.append(field('Constituição',choices('body')),field('Na cabeça',choices('acessorio')),field('Cor da túnica',swatches('tunic')),field('Cor da capa',swatches('cape')));
      body.append(options,h('button',{type:'button',class:'random-look',onclick:()=>{
        customCloth=true;for(const key of ['skin','hair','tunic','cape'])look[key]=pick(LOOK_OPTIONS[key]);
        for(const key of ['style','body','beard'])look[key]=pick(LOOK_OPTIONS[key]).id;render();
      }},icon('shuffle',16),'Sortear aparência'));
    }else{
      const C=CLASSES[cls];
      body.append(h('div',{class:'section-heading'},h('span',{class:'overline'},'03 / A JORNADA'),h('h2',{tabindex:-1},'Um nome para sua história'),h('p',{},'Sua jornada começa na Cidade de Refúgio.')),
        h('label',{class:'name-field',for:'pilgrim-name'},'Nome do peregrino',name),h('p',{id:'name-help',class:'name-help'},'De 3 a 16 letras ou números. Espaços, hífen e sublinhado são aceitos.'),
        h('div',{class:'journey-summary'},h('span',{class:'overline'},'SEU CHAMADO'),h('h3',{},icon(C.arma,23),C.nome),h('p',{},ROLES[cls]),
          h('div',{class:'starting-stats'},[['heart','Vida',C.base.hp],['spark','Fé',C.base.fe],['shield','Defesa',C.base.def+(ITEMS.escudo_madeira.def||0)]].map(([art,title,v])=>h('div',{},icon(art,17),h('span',{},title),h('b',{},v)))),
          h('div',{class:'starting-gear'},itemIcon(ITEMS[C.armaInicial],C.armaInicial,33),h('span',{},h('small',{},'EQUIPAMENTO INICIAL'),h('b',{},ITEMS[C.armaInicial].nome+' + escudo')))),
        h('p',{class:'journey-note'},icon('book',17),'“Andamos por fé, e não pelo que vemos.”',h('span',{},'2 Coríntios 5:7')));
    }
    back.replaceChildren(icon('back',16),step===0?'Voltar':'Anterior');
    next.replaceChildren(step===2?'Começar a jornada':'Continuar',icon('arrow',17));
    if(focus)body.querySelector('h2')?.focus({preventScroll:true});
  }
  const form=h('form',{class:'character-forge',novalidate:true,onsubmit:async e=>{
    e.preventDefault();if(busy)return;
    if(step<2){step++;render(true);return;}
    const n=name.value.trim();
    if(!/^[\p{L}0-9 _-]{3,16}$/u.test(n)){msg.textContent='Use de 3 a 16 letras ou números para o nome.';name.setAttribute('aria-invalid','true');name.focus();return;}
    busy=true;next.disabled=true;back.disabled=true;nav.querySelectorAll('button').forEach(b=>b.disabled=true);msg.textContent='Preparando sua jornada…';
    try{
      const c=await net.createChar({name:n,cls,look:{...look},data:newCharData(cls)});
      cancelAnimationFrame(raf);root.classList.remove('creating');sfx('level');onCreated(c);
    }catch(err){busy=false;next.disabled=false;back.disabled=false;nav.querySelectorAll('button').forEach(b=>b.disabled=false);msg.textContent=err.message;}
  }},preview,h('section',{class:'creation-panel'},nav,body,h('footer',{class:'creation-footer'},msg,h('div',{class:'creation-actions'},back,next))));
  const content=h('div',{class:'screen forge-screen'},
    h('header',{class:'forge-header'},h('div',{class:'forge-brand'},icon('feather',27),h('span',{},'PEREGRINOS')),h('span',{class:'forge-header-meta'},'CRIAÇÃO DE PERSONAGEM')),
    h('div',{class:'forge-title'},h('span',{class:'overline'},'ENTRE A SOMBRA E A LUZ'),h('h1',{},'O início de uma jornada.'),h('p',{},'Escolha seu caminho. Leve a luz com você.')),
    form,h('div',{class:'forge-footnote'},h('span',{},'UMA JORNADA DE FÉ E CORAGEM'),h('span',{},'CIDADE DE REFÚGIO')));
  root.append(content);render();
  function draw(now){
    if(!cv.isConnected||root.hidden)return;
    const dt=last?Math.min(.05,(now-last)/1000):0;last=now;time+=dt;
    const T=reduced?0:time;g.setTransform(2,0,0,2,0,0);sanctuary(g,T);
    const since=time-attackStart,attack=motion==='attack'&&since<.66;
    if(motion==='attack'&&!attack){motion='idle';modeButtons.querySelectorAll('button').forEach((b,i)=>{b.classList.toggle('on',i===0);b.setAttribute('aria-pressed',String(i===0));});}
    if(config.pixel!==false){ // o mesmo peregrino em pixel art que aparece no jogo
      const anda=motion==='walk'&&!reduced; pxHeroi.chao=true; pxHeroi.vx=anda?230:0; pxHeroi.face=face===3?-1:1; if(anda)pxHeroi.passo+=230*dt/26;
      pxHeroi.atk=attack?{t:since%.22,dur:.17,dir:face===2?'cima':'lado',face:pxHeroi.face,n:Math.floor(since/.22)}:null;
      const q=quadroHeroi(pxHeroi,look,cls,CLASSES[cls].arma,T,{});g.imageSmoothingEnabled=false;
      g.save();g.translate(180,344);g.scale(5*pxHeroi.face,5);g.drawImage(q.tela(),-AX,-AY);g.restore();
      raf=requestAnimationFrame(draw);return;
    }
    drawPerson(g,180,310,4.05,look,personMotion(motionActor,look,{t:T,fx:faces[face][0],fy:faces[face][1],moving:motion==='walk'&&!reduced,walk:time*.55,cls,weapon:CLASSES[cls].arma,weaponId:CLASSES[cls].armaInicial,shield:true,
      atkT:attack?.22-(since%.22):0,swingA:face===3?Math.PI:face===2?-Math.PI/2:0,combo:Math.floor(since/.22)+1}));
    raf=requestAnimationFrame(draw);
  }
  raf=requestAnimationFrame(draw);
}
