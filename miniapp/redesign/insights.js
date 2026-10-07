// Both materials present the same native kcal bars, weight line and daily-goal line.
// Native kiChart owns all coordinates, scales, dates and period changes.
(() => {
 'use strict';
 let pending=false;
 function present(){
  pending=false;
  document.querySelectorAll('.ki-chart').forEach(chart=>{
   if(!chart.querySelector(':scope > .ki-svg > svg'))return;
   if(chart.dataset.rdChartKind!=='combined-native')chart.dataset.rdChartKind='combined-native';
   if(chart.dataset.rdChartSeries!=='kcal,weight,goal')chart.dataset.rdChartSeries='kcal,weight,goal';
  });
 }
 function schedule(){if(pending)return;pending=true;requestAnimationFrame(present);}
 const shell=document.querySelector('.screen');
 if(shell)new MutationObserver(schedule).observe(shell,{subtree:true,childList:true,attributes:true,attributeFilter:['data-rd-chart-kind','data-rd-chart-series']});
 window.addEventListener('gym-redesign:view',schedule);
 schedule();
})();
