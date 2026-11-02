/* Visual-only materials and kit press/release feedback. Native app handlers
   retain all actions and data; feedback never dispatches or repeats an action. */
(() => {
 'use strict';
 const root=document.documentElement;
 const primary='.save:not(.wlog),.addbtn,.expbtn,.obnext,.rd-medit-save,.rd-plan-new,.rd-plan-start,.proplan-btn,.pgo,.logbtn,.mstart,.factbtn,.kn-main,.km-parse,.km-rec,.km-retry,.km-cfa,.kv-rec,.kv-own,.ks-save,.ks-addb,.kr-save,.kr-rec,.kr-done,.kg-save,.kg-cta,.kg-done,.ki-apply,.ki-wsave,.ki-wbtn,.kc-set,.kf-main,.kn-tip>button,.rd-approved-training [data-a="save"]';
 const round='.kv-add,.kn-favadd,.proedit,.rd-medit-open,.kn-tip>button,.kv-rec,.round,.mini,.obwbtn,.obtarget>button,.rd-medit-step button,.ui-adjust-button,.ui-adjustment-button,.ui-adjust-button,.rd-approved-training [data-a="dw"],.rd-approved-training [data-a="ds"],.rd-approved-training [data-a="dr"],.pecam';
 const excluded='.delown,.wlog,.wsicon,.logsheet .round,.na-camera-button,.kc-shoot,.white-nutrition-shortcut,.rd-nutrition-goal,.kb-ic,.kv-pin,.kv-edit,.kv-del,.kn-rowedit,.wt-record-button,.tg-star,.tg-done';
 // The full-screen machine page keeps the original White presentation.
 // Suspending the Silver cascade restores its original tokens as well as controls.
 const silverStyles=[...document.querySelectorAll('link[rel="stylesheet"][href^="silver-"]')];
 function syncMachineStyles(){
  const legacy=root.hasAttribute('data-silver')&&!!document.querySelector('#ov.on>.msheet');
  silverStyles.forEach(link=>{if(link.disabled!==legacy)link.disabled=legacy;});
 }
 let queued=false;
 function decorate(){
  queued=false;
  if(!root.hasAttribute('data-silver')){
   document.querySelectorAll('.sl-face').forEach(face=>face.remove());
   document.querySelectorAll('.sl-metal,.sl-round,.sl-amber,.sl-lathe').forEach(button=>button.classList.remove('sl-metal','sl-round','sl-amber','sl-lathe'));
   return;
  }
  document.querySelectorAll(primary+','+round).forEach(button=>{
   if(button.tagName!=='BUTTON'||button.matches(excluded)||button.closest('#sheet.msheet'))return;
   const isRound=button.matches(round),isAmber=button.matches('.save:not(.wlog),.kv-own,.proedit,.rd-medit-open,.kn-tip>button,.kv-rec,.rd-medit-save,.rd-medit-step button,.obnext,.addbtn,.rd-plan-new,.rd-approved-training [data-a="dw"][data-v="1"],.rd-approved-training [data-a="ds"][data-v="1"],.rd-approved-training [data-a="dr"][data-v="1"],.km-parse,.ks-save,.kr-save,.kg-save,.ki-apply,.ki-wsave,.kc-set');
   if(button.matches('.kv-add,.kn-favadd')&&button.classList.contains('sl-metal'))button.classList.remove('sl-metal');
   if(!button.classList.contains(isRound?'sl-round':'sl-metal'))button.classList.add(isRound?'sl-round':'sl-metal');
   if(isAmber&&!button.classList.contains('sl-amber'))button.classList.add('sl-amber');
   if(button.matches('.pecam')&&!button.classList.contains('sl-lathe'))button.classList.add('sl-lathe');
   if(!button.querySelector(':scope>.sl-face')){const face=document.createElement('span');face.className='sl-face';face.setAttribute('aria-hidden','true');button.prepend(face);}
  });
 }
 function schedule(){if(!queued){queued=true;requestAnimationFrame(decorate);}}
 new MutationObserver(()=>{syncMachineStyles();schedule();}).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
 window.addEventListener('gym-redesign:view',schedule);window.addEventListener('gym-silver:ready',schedule);
 // Favorites use the kit's momentary press/release even for a quick tap.
 // Resolve the action after the native keyed render, which recreates face nodes.
 const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)'),tapEffects=new WeakMap();
 document.addEventListener('click',event=>{
  if(!root.hasAttribute('data-silver')||reducedMotion.matches)return;
  const button=event.target.closest?.('#scrpage.kv button,#appcontent .kn-fav button');
  if(!button||button.disabled||button.getAttribute('aria-disabled')==='true')return;
  const action=button.dataset.a,value=button.dataset.v,expanded=!!button.closest('#scrpage.kv');
  requestAnimationFrame(()=>{
   const page=document.querySelector(expanded?'#scrpage.kv':'#appcontent .kn-favs');
   if(!page||!root.hasAttribute('data-silver'))return;
   const current=page.contains(button)?button:[...page.querySelectorAll('button')].find(b=>b.dataset.a===action&&b.dataset.v===value);
   if(!current||current.disabled)return;
   decorate();
   // Metal faces travel within their seated rim. Quiet actions move their icon.
   let target=current.querySelector(':scope>.sl-face')||current.querySelector('svg');
   if(!target){
    target=current.querySelector(':scope>.sl-favorite-label');
    if(!target){
     target=document.createElement('span');target.className='sl-favorite-label';
     while(current.firstChild)target.append(current.firstChild);
     current.append(target);
    }
   }
   const glyph=current.querySelector(':scope>svg');
   const surfaces=target.classList.contains('sl-face')&&glyph?[target,glyph]:[target];
   surfaces.forEach(surface=>{
    tapEffects.get(surface)?.cancel();
   const effect=surface.animate([
    {transform:'translateY(1.5px) scale(.975)',offset:0},
    {transform:'translateY(-.35px) scale(1.004)',offset:.72},
    {transform:'translateY(0) scale(1)',offset:1}
   ],{duration:230,easing:'cubic-bezier(.2,.7,.3,1)'});
   tapEffects.set(surface,effect);
   effect.onfinish=effect.oncancel=()=>{if(tapEffects.get(surface)===effect)tapEffects.delete(surface);};
   });
  });
 },true);
 syncMachineStyles();decorate();
})();
