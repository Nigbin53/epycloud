/* Silver weight controls. The exact display is rendered from app data by silver-weight-display.js. */
(() => {
 'use strict';
 let pending=false;
 function face(button){
  if(![...button.children].some(child=>child.classList.contains('sl-face'))){
   const surface=document.createElement('span');surface.className='sl-face';surface.setAttribute('aria-hidden','true');
   button.prepend(surface);
  }
  if(button.matches('.wlog')&&!button.querySelector(':scope>.sl-weight-label')){
   const label=document.createElement('span');label.className='sl-weight-label';
   [...button.childNodes].filter(node=>node.nodeType!==Node.ELEMENT_NODE||!node.classList.contains('sl-face')).forEach(node=>label.append(node));
   button.append(label);
  }
 }
 // The form covers this control. Complete the kit's visible press first,
 // then invoke the native action once; a second quick tap cannot reopen it.
 const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
 let opening=false;
 function afterPress(button,open){
  if(!document.documentElement.hasAttribute('data-silver')||!button.matches('#appcontent .wlog'))return false;
  if(button.disabled||button.getAttribute('aria-disabled')==='true'||opening)return true;
  if(reducedMotion.matches)return false;
  opening=true;face(button);
  const frames=[
   {transform:'translateY(1.5px) scale(.975)',offset:0},
   {transform:'translateY(-.35px) scale(1.004)',offset:.72},
   {transform:'translateY(0) scale(1)',offset:1}
  ];
  const duration=matchMedia('(pointer:coarse)').matches?180:230;
  const effects=[...button.querySelectorAll(':scope>.sl-face,:scope>.sl-weight-label')].map(surface=>surface.animate(frames,{duration,easing:'cubic-bezier(.2,.7,.3,1)'}));
  Promise.all(effects.map(effect=>effect.finished)).then(()=>{
   opening=false;
   if(!button.isConnected||!document.documentElement.hasAttribute('data-silver')||document.visibilityState!=='visible')return;
   if(document.querySelector('#ov.on,#scrov.on,#prov.on,#obov.on'))return;
   open();
  },()=>{opening=false;});
  return true;
 }
 window.GymSilverWeight=Object.freeze({afterPress});
 function readout(element){
  [...element.childNodes].forEach(node=>{
   if(node.nodeType!==Node.TEXT_NODE||!node.textContent.trim())return;
   const value=document.createElement('span');value.className='sl-weight-value';
   node.replaceWith(value);value.append(node);
  });
 }
 function present(){
  pending=false;if(!document.documentElement.hasAttribute('data-silver'))return;
  const content=document.getElementById('appcontent');
  if(content){
   const home=!!content.querySelector(':scope>.wcard');
   content.classList.toggle('sl-weight-home',home);
   content.classList.toggle('sl-weight-empty',home&&!content.querySelector('.wval'));
  }
  document.querySelectorAll('#appcontent .wval,#scrpage.wsscr .wval,#sheet.logsheet .num').forEach(readout);
  document.querySelectorAll('#appcontent .wlog,#sheet.logsheet .round').forEach(face);
 }
 function schedule(){if(!pending){pending=true;requestAnimationFrame(present);}}
 const shell=document.querySelector('.screen');
 if(shell)new MutationObserver(schedule).observe(shell,{subtree:true,childList:true});
 window.addEventListener('gym-redesign:view',schedule);
 schedule();
})();
