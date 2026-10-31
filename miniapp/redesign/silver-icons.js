/* SVG paths from the approved kit's fitness-screens-core.js. The native
   controls, hit areas, accessible labels and delegated actions are retained. */
(() => {
 'use strict';
 if(!document.documentElement.hasAttribute('data-silver'))return;
 const paths={
  gear:'<path d="m10 3-.6 2.2-2 .9-2.1-.7L3.5 8.5l1.6 1.6v2.3l-1.6 1.5 1.8 3.2 2.1-.6 2 .9.6 2.2h3.6l.6-2.2 2-.9 2.1.6 1.8-3.2-1.6-1.5v-2.3l1.6-1.6-1.8-3.1-2.1.7-2-.9-.6-2.2H10Z"/><circle cx="11.8" cy="11.3" r="3"/>',
  back:'<path d="m15 5-7 7 7 7"/>',
  edit:'<path d="m5 15-1 5 5-1L20 8l-4-4L5 15Zm9.5-9.5 4 4"/>',
  camera:'<path d="M3 7h5l2-3h4l2 3h5v14H3V7Z"/><circle cx="12" cy="13.5" r="4"/>',
  star:'<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z"/>',
  food:'<path d="M4 2v6a3 3 0 0 0 6 0V2M7 2v20m13-20c-4 2-5 6-4 11l4 1V2Zm0 12v8"/>',
  weight:'<rect x="2" y="2" width="20" height="20" rx="6"/><path d="M7 10a5 5 0 0 1 10 0m-5 0 2-3"/>',
  training:'<path d="M2 9v6m3-10v14m3-11v8m0-4h8m0-4v8m3-11v14m3-10v6"/>',
  history:'<path d="M3 3v6h6M3.5 8A10 10 0 1 1 2 14m10-9v7l4 3"/>',
  check:'<path d="m5 12 4 4L19 6"/>'
 };
 const selectors={
  gear:'.hgear svg,.scrgear svg',back:'.scrback svg,.obback svg',
  edit:'.proedit svg,.rd-medit-open svg,.rd-nutrition-goal svg',
  camera:'.na-camera-button svg',star:'.tg-star svg,.na-favorite-action .white-nutrition-shortcut svg',check:'.tg-done svg',
  training:'.nav [data-v="workout"] svg,.ui-bottom-nav [data-v="workout"] svg,.hrow .hic:not(.b):not(.f) svg',
  weight:'.nav [data-v="weight"] svg,.ui-bottom-nav [data-v="weight"] svg,.hrow .hic.b svg',
  food:'.nav [data-v="kbju"] svg,.ui-bottom-nav [data-v="kbju"] svg,.hrow .hic.f svg',
  history:'.nav [data-v="history"] svg,.ui-bottom-nav [data-v="history"] svg'
 };
 let pending=false;
 function present(){
  pending=false;
  Object.entries(selectors).forEach(([name,selector])=>document.querySelectorAll(selector).forEach(svg=>{
   if(svg.closest('#sheet.msheet')||svg.dataset.silverIcon===name)return;
   svg.innerHTML=paths[name];svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('fill','none');
   svg.setAttribute('stroke','currentColor');svg.setAttribute('stroke-width','1.65');svg.style.setProperty('stroke-width','1.65','important');
   svg.setAttribute('stroke-linecap','round');svg.setAttribute('stroke-linejoin','round');
   svg.setAttribute('aria-hidden','true');svg.setAttribute('focusable','false');svg.dataset.silverIcon=name;
  }));
  document.querySelectorAll('#appcontent .hwt').forEach(readout=>Array.from(readout.childNodes).forEach(node=>{
   if(node.nodeType!==Node.TEXT_NODE||!node.textContent.trim())return;
   const value=document.createElement('span');value.className='sl-history-number';node.replaceWith(value);value.append(node);
  }));
 }
 function schedule(){if(!pending){pending=true;requestAnimationFrame(present);}}
 new MutationObserver(schedule).observe(document.body,{subtree:true,childList:true});
 window.addEventListener('gym-redesign:view',schedule);present();
})();
