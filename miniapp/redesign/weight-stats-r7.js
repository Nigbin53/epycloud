// The graph remains the native axisChart: no resampling, alternate scale or copied data.
(() => {
 'use strict';
 let pending=false;
 function present(){
  pending=false;
  document.querySelectorAll('.wsscr .wchart').forEach(chart=>{
   const svg=chart.querySelector(':scope > svg');
   if(!svg)return;
   chart.dataset.rdChartKind='weight-native';
   const trend=svg.querySelector(':scope > path');
   // Native single-measure charts are dotted; multi-measure curves stay continuous.
   chart.dataset.rdChartState=trend?.hasAttribute('stroke-dasharray')?'single':'series';
  });
 }
 function schedule(){if(pending)return;pending=true;requestAnimationFrame(present);}
 const shell=document.querySelector('.screen');
 if(shell)new MutationObserver(schedule).observe(shell,{subtree:true,childList:true});
 window.addEventListener('gym-redesign:view',schedule);
 schedule();
})();
