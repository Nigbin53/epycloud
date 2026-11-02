/* Exact D03 weight display from the approved kit. Only chart coordinates,
   dates, labels and selection depend on the app; this module never owns state. */
(() => {
 'use strict';
 let sequence=0;
 const months=['ЯНВ','ФЕВ','МАР','АПР','МАЙ','ИЮН','ИЮЛ','АВГ','СЕН','ОКТ','НОЯ','ДЕК'];
 const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const format=value=>value.toFixed(1).replace('.',',');
 const dateLabel=t=>{const d=new Date(t);return d.getDate()+' '+months[d.getMonth()];};
 const colorStops=['#a9a9a9','#dcdcdb','#f5eaeb','#fbe9e8','#f3807a','#fc3f2d','#fb422d','#fe3824'];
 function pointColor(x){
  const at=Math.max(0,Math.min(7,(x-206)/1095*7)),a=Math.floor(at),b=Math.min(7,a+1),mix=at-a;
  const rgb=colorStops.map(c=>[1,3,5].map(i=>parseInt(c.slice(i,i+2),16)));
  return '#'+rgb[a].map((v,i)=>Math.round(v+(rgb[b][i]-v)*mix).toString(16).padStart(2,'0')).join('');
 }
 function niceStep(n){const power=10**Math.floor(Math.log10(n));return [1,2,5,10].find(x=>x*power>=n)*power;}
 function chartModel(entries,{monthly=false}={}){
  const rows=entries.filter(e=>Number.isFinite(e.t)&&Number.isFinite(e.w)&&e.w>0).slice().sort((a,b)=>a.t-b.t);
  const values=rows.map(e=>e.w),min=values.length?Math.min(...values):0,max=values.length?Math.max(...values):0;
  let step=niceStep(Math.max(1,(max-min)*.7)),center=Math.floor((min+max)/step)*step/2;
  while(min<center-step+step*.1||max>center+step-step*.1){step=niceStep(step*1.1);center=Math.floor((min+max)/step)*step/2;}
  const first=rows[0]?.t,last=rows.at(-1)?.t,span=last-first;
  const points=rows.map(e=>({x:span?206+(e.t-first)/span*1095:1301,y:225+(center+step-e.w)/(step*2)*343}));
  let dates=[];
  if(rows.length){
   if(monthly)dates=rows.map(e=>e.t).filter((_,i)=>i===0||i===rows.length-1||i%Math.max(1,Math.ceil((rows.length-1)/6))===0);
   else {
    const count=Math.min(7,Math.max(1,Math.floor(span/86400000)+1));
    dates=Array.from({length:count},(_,i)=>first+(count===1?0:span*i/(count-1)));
   }
  }
  const dateSlots=[218,382,548,715,880,1045,1220];
  const labels=dates.map((t,i)=>({text:monthly?months[new Date(t).getMonth()]:dateLabel(t),x:dates.length===7?dateSlots[i]:dates.length===1?1220:218+i*1002/(dates.length-1)}));
  return {points,dots:points.map((_,i)=>i),labels,
   ticks:[{text:rows.length?format(center+step):'—',y:225,top:214},{text:rows.length?format(center):'—',y:397,top:386},{text:rows.length?format(center-step):'—',y:568,top:557}],
   description:rows.length?'Вес, '+rows.map(e=>dateLabel(e.t)+' '+format(e.w)+' кг').join('; '):'График веса: пока нет замеров'};
 }
const weightLcdGlyphs = {
  'В': {d:'M1.25 1.25H10.75L13.75 4.25V10.25L10.75 13H1.25 M10.75 13L13.75 16V21.75L10.75 24.75H1.25V1.25'},
  'Е': {d:'M13.75 1.25H1.25V24.75H13.75 M1.25 12.75H11.5'},
  'С': {d:'M13.75 5.25V4.25L10.75 1.25H4.25L1.25 4.25V21.75L4.25 24.75H10.75L13.75 21.75V20.75'},
  'Н': {d:'M1.25 1.25V24.75 M13.75 1.25V24.75 M1.25 12.75H13.75'},
  'Д': {d:'M1.25 28.75V24.75H16.75V28.75 M3.25 24.75L6.75 1.25H14.5V24.75',width:18,advance:21},
  'Л': {d:'M1.25 24.75L5.75 1.25H14.75V24.75',width:16},
  'Я': {d:'M13.75 24.75V1.25H4.25L1.25 4.25V10.25L4.25 13.25H13.75 M7.75 13.25L1.25 24.75'},
  'М': {d:'M1.25 24.75V1.25L7.5 14.25L13.75 1.25V24.75'},
  'Ц': {d:'M1.25 1.25V24.75H13.75V1.25 M13.75 24.75H16.75V28.75',width:18,advance:19},
  'О': {d:'M4.25 1.25H10.75L13.75 4.25V21.75L10.75 24.75H4.25L1.25 21.75V4.25Z'},
  'К': {d:'M1.25 1.25V24.75 M13.75 1.25L3.5 13L13.75 24.75'},
  'Т': {d:'M1.25 1.25H13.75 M7.5 1.25V24.75'},
  '/': {d:'M1.25 24.75L10.75 1.25',width:12},
  '2': {d:'M1.25 5.25V4.25L4.25 1.25H10.75L13.75 4.25V10.25L1.25 21.75V24.75H13.75'},
  '3': {d:'M1.25 1.25H10.75L13.75 4.25V10.25L10.75 12.75H5.75 M10.75 12.75L13.75 15.75V21.75L10.75 24.75H4.25L1.25 21.75'},
  '4': {d:'M11.25 24.75V1.25H9.25L1.25 17.75H13.75'},
  '5': {d:'M13.75 1.25H1.25V12.25L4.25 10.75H9.75L13.75 14.75V21.75L10.75 24.75H4.25L1.25 21.75'},
  '6': {d:'M13.75 5.25V4.25L10.75 1.25H4.25L1.25 4.25V21.75L4.25 24.75H10.75L13.75 21.75V15.25L10.75 12.25H4.25L1.25 15.25'},
  '7': {d:'M1.25 1.25H13.75V4.25L5.25 24.75'},
  '8': {d:'M4.25 1.25H10.75L13.75 4.25V9.75L10.75 12.75H4.25L1.25 9.75V4.25Z M4.25 12.75L1.25 15.75V21.75L4.25 24.75H10.75L13.75 21.75V15.75L10.75 12.75'},
  ',': {d:'M3.75 22.25L1.25 28.75',width:5,advance:12},
  '0': {d:'M4.25 1.25H10.75L13.75 4.25V21.75L10.75 24.75H4.25L1.25 21.75V4.25Z M3.25 21.75L11.75 4.25'},
  '1': {d:'M3.25 5.25L7.75 1.25V24.75 M2.25 24.75H13.25'},
  '9': {d:'M13.75 10.75L10.75 13.75H4.25L1.25 10.75V4.25L4.25 1.25H10.75L13.75 4.25V21.75L10.75 24.75H4.25L1.25 21.75'},
  'А': {d:'M1.25 24.75V6.75L7.5 1.25L13.75 6.75V24.75 M1.25 15.25H13.75'},
  'Б': {d:'M13.75 1.25H1.25V24.75H10.75L13.75 21.75V15.25L10.75 12.25H1.25'},
  'Г': {d:'M1.25 24.75V1.25H13.75'},
  'З': {d:'M1.25 4.25L4.25 1.25H10.75L13.75 4.25V9.75L10.75 12.75H6.75 M10.75 12.75L13.75 15.75V21.75L10.75 24.75H4.25L1.25 21.75'},
  'И': {d:'M1.25 1.25V24.75L13.75 1.25V24.75'},
  'Й': {d:'M1.25 5.25V24.75L13.75 5.25V24.75 M4.25 0L6.25 2H8.75L10.75 0'},
  'П': {d:'M1.25 24.75V1.25H13.75V24.75'},
  'Р': {d:'M1.25 24.75V1.25H10.75L13.75 4.25V10.25L10.75 13.25H1.25'},
  'Ф': {d:'M7.5 1.25V24.75 M4.25 5.25H10.75L13.75 8.25V17.75L10.75 20.75H4.25L1.25 17.75V8.25Z'},
  'Ю': {d:'M1.25 1.25V24.75 M1.25 12.75H6.25 M9.25 1.25H15.75L18.75 4.25V21.75L15.75 24.75H9.25L6.25 21.75V4.25Z',width:20,advance:23},
  'Ё': {d:'M13.75 4.25H1.25V24.75H13.75 M1.25 14.25H11.5 M4.25 0H4.5 M10.5 0H10.75'},
  '—': {d:'M1.25 12.75H13.75'},
  ' ': {d:'',width:0,advance:19}
};
function weightLcdText(text,x,top,width,capHeight,fill='#efefea',extra='') {
  let advance=0, right=0;
  const paths=Array.from(text).map(char=>{
    const glyph=weightLcdGlyphs[char];
    if(!glyph)throw new Error('Unsupported reference LCD glyph: '+char);
    const at=advance;
    advance+=glyph.advance||19;
    if(!glyph.d)return '';
    right=at+(glyph.width||15);
    return '<path transform="translate('+at+' 0)" d="'+glyph.d+'"/>';
  }).join('');
  return '<g '+extra+' aria-label="'+text+'" transform="translate('+x+' '+top+') scale('+(width/right)+' '+(capHeight/26)+')" fill="none" stroke="'+fill+'" stroke-width="2.5" stroke-linejoin="miter" stroke-linecap="square">'+paths+'</g>';
}

 function periodMarkup(controls){
  return controls.map(c=>(c.selected?'<rect x="'+c.x+'" y="91" width="'+c.width+'" height="49" rx="4" fill="none" stroke="#f0f2eb" stroke-width="2.7"/>':'')+
   weightLcdText(c.label,c.textX,103,c.textWidth,24,c.selected?'#f0f0eb':'#82857c')).join('');
 }
 function render(model,{range='week',action='bwr'}={}){
  const controls=action==='wsr'?
   [{label:'3 МЕС',value:'3m',x:827,width:145,textX:847,textWidth:105},{label:'6 МЕС',value:'6m',x:997,width:145,textX:1017,textWidth:105},{label:'ВСЁ',value:'all',x:1175,width:145,textX:1210,textWidth:75}]:
   [{label:'НЕДЕЛЯ',value:'week',x:1013,width:175,textX:1050,textWidth:100},{label:'МЕСЯЦ',value:'month',x:1203,width:140,textX:1228,textWidth:88}];
  controls.forEach(c=>c.selected=c.value===range);
  const points=model.points,last=points.at(-1),line=points.map((p,i)=>(i?'L':'M')+p.x+' '+p.y).join(' ');
    let markup = '<title id="display-weight-title">'+escape(model.description)+'</title>' +
      '<defs><linearGradient id="dl-weight-bezel" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="1409" y2="755"><stop offset="0" stop-color="#111"/><stop offset="43%" stop-color="#191919"/><stop offset="50%" stop-color="#858585"/><stop offset="56%" stop-color="#ededeb"/><stop offset="100%" stop-color="#fffffd"/></linearGradient><linearGradient id="dl-weight-glass-band" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".035"/><stop offset="45%" stop-color="#fff" stop-opacity=".06"/><stop offset="100%" stop-color="#fff" stop-opacity=".035"/></linearGradient><linearGradient id="dl-weight-line-color" gradientUnits="userSpaceOnUse" x1="206" y1="0" x2="1301" y2="0"><stop offset="0" stop-color="#a9a9a9"/><stop offset="14.4%" stop-color="#dcdcdb"/><stop offset="28.8%" stop-color="#f5eaeb"/><stop offset="43.1%" stop-color="#fbe9e8"/><stop offset="57.4%" stop-color="#f3807a"/><stop offset="71.8%" stop-color="#fc3f2d"/><stop offset="86.2%" stop-color="#fb422d"/><stop offset="100%" stop-color="#fe3824"/></linearGradient>' +
      '<linearGradient id="dl-weight-area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff3926" stop-opacity=".17"/><stop offset="100%" stop-color="#ff3926" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="dl-weight-fade"><stop offset="0" stop-color="#000"/><stop offset="45%" stop-color="#000"/><stop offset="100%" stop-color="#fff"/></linearGradient><mask id="dl-weight-mask"><rect x="206" y="210" width="1095" height="388" fill="url(#dl-weight-fade)"/></mask>' +
      '<linearGradient id="dl-weight-cursor-color" gradientUnits="userSpaceOnUse" x1="1301" y1="213" x2="1301" y2="594"><stop offset="0" stop-color="#ff3d27" stop-opacity="0"/><stop offset="14%" stop-color="#ff3d27" stop-opacity=".7"/><stop offset="22%" stop-color="#ff3d27"/><stop offset="40%" stop-color="#ff3d27"/><stop offset="67%" stop-color="#ff3d27" stop-opacity=".88"/><stop offset="88%" stop-color="#ff3d27" stop-opacity=".31"/><stop offset="97%" stop-color="#ff3d27" stop-opacity=".05"/><stop offset="100%" stop-color="#ff3d27" stop-opacity="0"/></linearGradient><filter id="dl-weight-glow" filterUnits="userSpaceOnUse" x="1250" y="200" width="102" height="410"><feGaussianBlur stdDeviation="8"/></filter></defs>' +
      '<rect width="1409" height="755" rx="78" fill="url(#dl-weight-bezel)"/><rect x="5" y="5" width="1393" height="739" rx="73" fill="#171717"/><rect x="11" y="11" width="1387" height="733" rx="67" fill="#050505"/><path d="M682 13H961L492 742H213Z" fill="url(#dl-weight-glass-band)" opacity=".45"/>' +
      '<circle cx="88" cy="114" r="12" fill="#62645f"/>' + weightLcdText('ВЕС',134,101,53,26,'#f0f0eb') +
      periodMarkup(controls) +
      [270,428,585,742,899,1056,1213].map(x=>'<path class="dl-weight-grid" d="M'+(x-64)+' 212V594"/>').join('') +
      model.ticks.map(t=>weightLcdText(t.text,76,t.top,54,22,'#b6b8b0')+'<path d="M155 '+t.y+'h17" stroke="#b1b5aa" stroke-width="1.8"/>').join('') +
      '<path class="dl-weight-baseline" d="M206 598H1318"/>' +
      model.labels.map((label,i)=>weightLcdText(label.text,label.x,634,64,19,i===model.labels.length-1?'#f4f5ee':'#9b9e96')).join('') +
      (points.length>1?'<path d="'+line+'L1301 598L206 598Z" fill="url(#dl-weight-area)" mask="url(#dl-weight-mask)"/>':'')+points.slice(1).map((p,i)=>'<path class="dl-weight-line" d="M'+points[i].x+' '+points[i].y+'L'+p.x+' '+p.y+'" stroke="url(#dl-weight-line-color)" stroke-width="'+(i===points.length-2?3:1.5+.5*i/Math.max(1,points.length-3)).toFixed(2)+'"/>').join('')+'' +
      (last?'<path d="M1301 213V594" stroke="url(#dl-weight-cursor-color)" stroke-width="10" stroke-opacity=".35" filter="url(#dl-weight-glow)"/><path class="dl-weight-cursor" d="M1301 213V594" stroke="url(#dl-weight-cursor-color)"/>' +
      '<circle cx="1301" cy="'+last.y+'" r="24" fill="#ff3926" fill-opacity=".13"/><circle cx="1301" cy="'+last.y+'" r="17" fill="#ff3926" fill-opacity=".22"/>':'') +
      model.dots.map((index,i)=>{const p=points[index];return '<circle class="dl-weight-point" cx="'+p.x+'" cy="'+p.y+'" r="'+(index===points.length-1?'11':'5.8')+'" fill="'+(model.colors?model.colors[i]:pointColor(p.x))+'"/>'}).join('');
  const id='sl-weight-reference-'+(++sequence);
  markup=markup.replaceAll('id="dl-weight-','id="'+id+'-').replaceAll('#dl-weight-','#'+id+'-').replaceAll('display-weight-title',id+'-title');
  return '<svg viewBox="0 0 1409 755" role="img" aria-labelledby="'+id+'-title">'+markup+'</svg>'+controls.map(c=>'<button class="sl-weight-period" data-a="'+action+'" data-v="'+c.value+'" aria-label="'+c.label+'" aria-pressed="'+c.selected+'" style="--period-center:'+((c.x+c.width/2)/1409*100)+'%;--period-width:'+(c.width/1409*100)+'%"><span>'+c.label+'</span></button>').join('');
 }
 window.SilverWeightDisplay=Object.freeze({chartModel,render});
})();
