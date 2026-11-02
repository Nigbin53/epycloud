/* Silver weight controls. The exact display is rendered from app data by silver-weight-display.js. */
(() => {
 'use strict';
 let pending=false;
 function face(button){
  if([...button.children].some(child=>child.classList.contains('sl-face')))return;
  const surface=document.createElement('span');surface.className='sl-face';surface.setAttribute('aria-hidden','true');
  button.prepend(surface); // The background is empty. Native text and SVG remain direct children.
 }
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
  document.querySelectorAll('#appcontent .wlog,#appcontent .wsicon,#sheet.logsheet .round').forEach(face);
 }
 function schedule(){if(!pending){pending=true;requestAnimationFrame(present);}}
 const shell=document.querySelector('.screen');
 if(shell)new MutationObserver(schedule).observe(shell,{subtree:true,childList:true});
 window.addEventListener('gym-redesign:view',schedule);
 schedule();
})();
