/* «Плывущие линии» в шапке Профиля — перенос компонента Background Paths (FloatingPaths, framer-motion)
   на обычный JS: два слоя по 36 кривых (position 1 и −1), у каждой бегущий штрих (pathLength 0.3→1, pathOffset 0→1→0)
   и мягкое мерцание прозрачности; длительность 20–30 с, линейно, бесконечно. Анимация — Web Animations API.
   GymPaths.mount(box,{color}) → {destroy,setTime} */
(() => {
'use strict';
const NS='http://www.w3.org/2000/svg';
function layer(position){
  const out=[];
  for(let i=0;i<36;i++){
    const a=380-i*5*position,b=189+i*6,c=312-i*5*position,d=216-i*6,e=152-i*5*position,f=343-i*6,g=616-i*5*position,h=470-i*6,k=684-i*5*position,l=875-i*6;
    out.push({d:`M-${a} -${b}C-${a} -${b} -${c} ${d} ${e} ${f}C${g} ${h} ${k} ${l} ${k} ${l}`,w:.5+i*.03,o:.1+i*.03});
  }
  return out;
}
function mount(box,o){
  o=Object.assign({color:null,seed:Math.random},o||{});
  const svg=document.createElementNS(NS,'svg');svg.setAttribute('class','gym-paths');svg.setAttribute('viewBox','0 0 696 316');svg.setAttribute('fill','none');
  svg.setAttribute('preserveAspectRatio',o.fit||'xMidYMid slice');svg.setAttribute('aria-hidden','true');if(o.color)svg.style.color=o.color;
  const anims=[],els=[];
  [1,-1].forEach(pos=>layer(pos).forEach(p=>{
    const el=document.createElementNS(NS,'path');el.setAttribute('d',p.d);el.setAttribute('stroke','currentColor');el.setAttribute('stroke-width',p.w);
    el.setAttribute('stroke-opacity',Math.min(1,p.o));el.setAttribute('stroke-linecap','round');svg.appendChild(el);els.push(el);
  }));
  box.prepend(svg);
  // длины в абсолютных единицах — pathLength в анимации штрихов браузеры понимают по-разному
  if(svg.animate)els.forEach(el=>{let L=1000;try{L=el.getTotalLength()||L}catch(_){}const dur=(20+o.seed()*10)*1000;
    anims.push(el.animate([{strokeDasharray:(.3*L)+' '+L,strokeDashoffset:'0',opacity:.3},{strokeDasharray:(.65*L)+' '+L,strokeDashoffset:String(-L),opacity:.6},{strokeDasharray:L+' '+L,strokeDashoffset:'0',opacity:.3}],{duration:dur,iterations:Infinity,easing:'linear'}));
    if(o.phase)anims[anims.length-1].currentTime=o.seed()*dur;});
  const still=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;if(still)anims.forEach(a=>a.pause());
  const vis=()=>anims.forEach(a=>document.hidden?a.pause():(!still&&a.play()));document.addEventListener('visibilitychange',vis);
  return {destroy(){document.removeEventListener('visibilitychange',vis);anims.forEach(a=>a.cancel());svg.remove()},
          setTime(t){anims.forEach(a=>{a.pause();a.currentTime=t*1000})}};
}
window.GymPaths={mount};
/* Профиль: «плывущие линии» в верхней области (шапка, аватар, имя). Запускаются заново при каждом открытии Профиля;
   при перерисовке экрана (переключатели внутри Профиля) тот же слой возвращается на место — анимация не сбрасывается. */
let cur=null;
const mark=(el,v)=>{if(el.classList.contains('gym-has-paths')!==v)el.classList.toggle('gym-has-paths',v);};
function sync(){
  const page=document.getElementById('scrpage');
  const ov=document.getElementById('scrov');
  const on=!!(page&&page.querySelector(':scope>.prohead')&&(!ov||ov.classList.contains('on')));
  if(!on){if(cur){cur.inst.destroy();mark(cur.page,false);cur=null;}return;}
  if(cur&&cur.page===page){if(cur.svg.parentNode!==page)page.prepend(cur.svg);mark(page,true);return;}
  if(cur){cur.inst.destroy();mark(cur.page,false);}
  mark(page,true);
  const inst=mount(page,{phase:true,fit:'none'}); /* разные фазы — линии видны всё время; fit none — вся картина по ширине экрана, как в оригинале */
  cur={page,inst,svg:page.querySelector(':scope>.gym-paths')};
}
let queued=false;
function boot(){const root=document.getElementById('scrov')||document.body;
  new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;sync();});}).observe(root,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style']});sync();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
