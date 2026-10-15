/* «Плывущие линии» за PNG тренажёра — перенос компонента Background Paths (FloatingPaths, framer-motion)
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
  svg.setAttribute('preserveAspectRatio','xMidYMid slice');svg.setAttribute('aria-hidden','true');if(o.color)svg.style.color=o.color;
  const anims=[],els=[];
  [1,-1].forEach(pos=>layer(pos).forEach(p=>{
    const el=document.createElementNS(NS,'path');el.setAttribute('d',p.d);el.setAttribute('stroke','currentColor');el.setAttribute('stroke-width',p.w);
    el.setAttribute('stroke-opacity',Math.min(1,p.o));el.setAttribute('stroke-linecap','round');svg.appendChild(el);els.push(el);
  }));
  box.prepend(svg);
  // длины в абсолютных единицах — pathLength в анимации штрихов браузеры понимают по-разному
  if(svg.animate)els.forEach(el=>{let L=1000;try{L=el.getTotalLength()||L}catch(_){}const dur=(20+o.seed()*10)*1000;
    anims.push(el.animate([{strokeDasharray:(.3*L)+' '+L,strokeDashoffset:'0',opacity:.3},{strokeDasharray:(.65*L)+' '+L,strokeDashoffset:String(-L),opacity:.6},{strokeDasharray:L+' '+L,strokeDashoffset:'0',opacity:.3}],{duration:dur,iterations:Infinity,easing:'linear'}));});
  const still=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;if(still)anims.forEach(a=>a.pause());
  const vis=()=>anims.forEach(a=>document.hidden?a.pause():(!still&&a.play()));document.addEventListener('visibilitychange',vis);
  return {destroy(){document.removeEventListener('visibilitychange',vis);anims.forEach(a=>a.cancel());svg.remove()},
          setTime(t){anims.forEach(a=>{a.pause();a.currentTime=t*1000})}};
}
window.GymPaths={mount};
/* Карточка тренажёра: «плывущие линии» за фото без фона (своё PNG с прозрачностью).
   У встроенных фото фон-комната, поэтому там эффект не включается. */
const live=new Set();
function wanted(layers){const h=layers.querySelector('.ta-detail-hero');return !!(h&&h.dataset.equipmentPersonal==='true'&&/^data:image\/png/i.test(h.getAttribute('src')||''));}
function sync(){
  live.forEach(it=>{if(!it.box.isConnected||!wanted(it.box)){it.inst.destroy();it.box.classList.remove('gym-has-paths');const pg=it.box.closest('.rd-approved-training');if(pg)pg.classList.remove('gym-has-paths');live.delete(it);}});
  document.querySelectorAll('#sheet .ta-detail-photo-layers').forEach(box=>{
    if(!wanted(box)||box.querySelector(':scope>.gym-paths'))return;
    box.classList.add('gym-has-paths');const pg=box.closest('.rd-approved-training');if(pg)pg.classList.add('gym-has-paths');
    live.add({box,inst:mount(box)});
  });
}
let queued=false;
function boot(){const sh=document.getElementById('sheet')||document.body;
  new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;sync();});}).observe(sh,{childList:true,subtree:true,attributes:true,attributeFilter:['src']});sync();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
