/* Visual-only decoration. Native :active is the sole press mechanism; no click
   handler, event replay, timers, product model writes or wrapped label nodes. */
(() => {
 'use strict';
 const root=document.documentElement;
 const primary='.save:not(.wlog),.addbtn,.expbtn,.obnext,.rd-medit-save,.rd-plan-new,.rd-plan-start,.proplan-btn,.pgo,.logbtn,.mstart,.factbtn,.kn-main,.km-parse,.km-rec,.km-retry,.km-cfa,.kv-rec,.kv-add,.kv-own,.ks-save,.ks-addb,.kr-save,.kr-rec,.kr-done,.kg-save,.kg-cta,.kg-done,.ki-apply,.ki-wsave,.ki-wbtn,.kc-set,.kf-main,.kn-favadd,.kn-tip>button,.rd-approved-training [data-a="save"]';
 const round='.proedit,.rd-medit-open,.kn-tip>button,.kv-rec,.round,.mini,.obwbtn,.obtarget>button,.rd-medit-step button,.ui-adjust-button,.ui-adjustment-button,.ui-adjust-button,.rd-approved-training [data-a="dw"],.rd-approved-training [data-a="ds"],.rd-approved-training [data-a="dr"],.pecam';
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
   if(!button.classList.contains(isRound?'sl-round':'sl-metal'))button.classList.add(isRound?'sl-round':'sl-metal');
   if(isAmber&&!button.classList.contains('sl-amber'))button.classList.add('sl-amber');
   if(button.matches('.pecam')&&!button.classList.contains('sl-lathe'))button.classList.add('sl-lathe');
   if(!button.querySelector(':scope>.sl-face')){const face=document.createElement('span');face.className='sl-face';face.setAttribute('aria-hidden','true');button.prepend(face);}
  });
 }
 function schedule(){if(!queued){queued=true;requestAnimationFrame(decorate);}}
 new MutationObserver(()=>{syncMachineStyles();schedule();}).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
 window.addEventListener('gym-redesign:view',schedule);window.addEventListener('gym-silver:ready',schedule);
 syncMachineStyles();decorate();
})();
