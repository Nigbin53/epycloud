// Materials and assets over native UI. Product event hooks and editing state stay native.
(() => {
'use strict';
let scheduled=false;
const PLATE_ICON='<svg width="132" height="84" viewBox="0 0 132 84" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="66" cy="42" r="32"/><circle cx="66" cy="42" r="21" stroke-dasharray="1.5 5" opacity=".75"/><path d="M12 12v14a6 6 0 0 0 12 0V12M18 12v14M18 32v40"/><path d="M114 72V12c5 4 7 12 7 22h-7"/></svg>';
function image(src,className,alt=''){const el=document.createElement('img');el.src=src;el.className=className;el.alt=alt;return el;}
function present(){
 scheduled=false;
 const white=document.documentElement.dataset.redesignTheme==='white';
 const shell=document.querySelector('.screen');if(!shell)return;
 shell.querySelectorAll('.phg').forEach(el=>{
  if(el.querySelector('img'))return;
  const machine=el.closest('.mtile');
  const title=machine?.textContent||'';
  const legs=/Ноги|ног|бедр/.test(title);
  const src=white?(legs?'../white/assets/light-legpress.png':'../white/assets/light-pulldown.png'):(legs?'../assets/training-leg-photo.png':'../assets/training-lat-graphite.png');
  const photo=image(src,'rd-equipment');photo.dataset.equipmentMachine=legs?'leg-press':'lat-pulldown';
  photo.dataset.equipmentName=machine?.querySelector('.mname')?.textContent||'';
  el.replaceChildren(photo);el.classList.add('rd-equipment-frame');
 });
 const hero=shell.querySelector('.mhero-ph');
 if(hero&&!hero.querySelector('img')){
  const legs=/ног|Ноги|бедр/.test(shell.querySelector('.mhero-info')?.textContent||'');
  const src=white?(legs?'../white/assets/light-legpress.png':'../white/assets/light-pulldown.png'):(legs?'../assets/training-leg-photo.png':'../assets/training-lat-graphite.png');
  const photo=image(src,'rd-equipment');photo.dataset.equipmentMachine=legs?'leg-press':'lat-pulldown';
  hero.replaceChildren(photo);hero.classList.add('rd-equipment-frame');
 }
 // Switch illustrative assets when the material changes; custom uploaded photos are retained.
 shell.querySelectorAll('img.rd-equipment').forEach(el=>{
  const legs=el.dataset.equipmentMachine==='leg-press';
  const src=white?(legs?'../white/assets/light-legpress.png':'../white/assets/light-pulldown.png'):(legs?'../assets/training-leg-photo.png':'../assets/training-lat-graphite.png');
  el.dataset.equipmentOriginal=new URL(src,document.baseURI).href;
  const store=window.GymEquipment,theme=white?'white':'black';
  // своё фото тренажёра; если его нет — заглушка, а не фото другого тренажёра
  const own=store?.ownKey?store.ownKey(el.dataset.equipmentName,'overview',theme):null;
  const resolved=own?store.resolve(own):(store?.placeholder?store.placeholder(theme):el.dataset.equipmentOriginal);
  if(el.src!==resolved)el.src=resolved;
 });
 // Видоискатель камеры: аккуратная рамка с уголками и значком тарелки вместо демонстрационного фото.
 const finder=shell.querySelector('.kc-frame.f');
 if(finder&&!finder.querySelector('.rd-finder-ui')){
  finder.innerHTML='<i class="c tl"></i><i class="c tr"></i><i class="c bl"></i><i class="c br"></i><div class="rd-finder-ui">'+PLATE_ICON+'</div>';
  finder.classList.add('rd-photo-finder');
 }
 const foodFigure=shell.querySelector('.km-fig.food');
 if(foodFigure&&!foodFigure.querySelector('img,.rd-finder-ui')){foodFigure.innerHTML='<div class="rd-finder-ui">'+PLATE_ICON+'</div>';foodFigure.classList.add('rd-photo-finder');}
 shell.querySelectorAll('.kn-arc>svg').forEach(svg=>{
  const paths=[...svg.querySelectorAll('path')];
  if(!svg.querySelector('defs')){
   const defs=document.createElementNS('http://www.w3.org/2000/svg','defs');
   defs.innerHTML='<linearGradient id="rd-steel-scale" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#8b949b"/><stop offset=".28" stop-color="#f4f7f8"/><stop offset=".5" stop-color="#a4adb3"/><stop offset=".72" stop-color="#eef1f2"/><stop offset="1" stop-color="#8b969d"/></linearGradient>';
   svg.prepend(defs);
   const inner=document.createElementNS('http://www.w3.org/2000/svg','path');
   inner.setAttribute('d','M 42 158 A 108 108 0 0 1 258 158');inner.setAttribute('fill','none');inner.setAttribute('stroke','var(--rd-rim)');inner.setAttribute('stroke-width','1');inner.classList.add('rd-inner-scale');svg.append(inner);
  }
  const track=paths[0];if(track){track.style.stroke=white?'url(#rd-steel-scale)':'var(--rd-rim)';track.setAttribute('stroke-width',white?'7':'1.5');track.setAttribute('stroke-linecap','butt');if(white)track.setAttribute('stroke-dasharray','3 3');else track.removeAttribute('stroke-dasharray');}
  if(paths[1]&&!paths[1].classList.contains('rd-inner-scale'))paths[1].setAttribute('stroke-width',white?'5':'3');
 });
 // Native recipe/favorite card illustrations remain descriptive; use a consistent line icon weight.
 shell.querySelectorAll('svg[stroke="currentColor"]').forEach(el=>{if(el.getAttribute('stroke-width')==='3')el.setAttribute('stroke-width','1.8');});
}
function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(present);}
window.addEventListener('gym-redesign:view',schedule);
window.addEventListener('gym-equipment:change',schedule);
const shell=document.querySelector('.screen');
if(shell)new MutationObserver(schedule).observe(shell,{subtree:true,childList:true});
schedule();
})();
