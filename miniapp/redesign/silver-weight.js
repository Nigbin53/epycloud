/* Silver F02 / D03 presentation only: the app retains weight data and all handlers. */
(() => {
 'use strict';
 const ns='http://www.w3.org/2000/svg';
 const processed=new WeakSet();
 let pending=false,sequence=0;
 const make=(tag,attributes)=>{
  const element=document.createElementNS(ns,tag);
  Object.entries(attributes||{}).forEach(([key,value])=>element.setAttribute(key,String(value)));
  return element;
 };
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
 function nativePoints(path,svg){
  const d=path.getAttribute('d')||'';
  if(path.hasAttribute('stroke-dasharray')){
   const point=svg.querySelector(':scope>circle');
   return point?[{x:Number(point.getAttribute('cx')),y:Number(point.getAttribute('cy'))}]:[];
  }
  const points=[];
  for(const match of d.matchAll(/([MC])([^MC]*)/g)){
   const numbers=match[2].match(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi)?.map(Number)||[];
   const offset=match[1]==='M'?0:numbers.length-2;
   if(numbers.length>=2)points.push({x:numbers[offset],y:numbers[offset+1]});
  }
  return points.filter(point=>Number.isFinite(point.x)&&Number.isFinite(point.y));
 }
 function sampleColors(index,total){
  const stops=[[169,169,169],[240,236,233],[239,183,175],[255,87,67],[255,60,39]];
  const t=total<2?4:index/(total-1)*4,a=Math.floor(t),b=Math.min(4,a+1),fraction=t-a;
  return 'rgb('+stops[a].map((v,i)=>Math.round(v+(stops[b][i]-v)*fraction)).join(',')+')';
 }
 function presentChart(chart){
  const svg=chart.querySelector(':scope>svg');if(!svg||processed.has(svg))return;
  const path=svg.querySelector(':scope>path');if(!path)return;
  const points=nativePoints(path,svg);if(!points.length)return;
  processed.add(svg);
  const id='sl-weight-'+(++sequence),last=points[points.length-1],first=points[0];
  const defs=make('defs');
  defs.innerHTML='<linearGradient id="'+id+'-line" gradientUnits="userSpaceOnUse" x1="'+first.x+'" y1="0" x2="'+(last.x===first.x?last.x+1:last.x)+'" y2="0"><stop offset="0" stop-color="#a9a9a9"/><stop offset="24%" stop-color="#f0ece9"/><stop offset="50%" stop-color="#efb7af"/><stop offset="77%" stop-color="#ff5743"/><stop offset="100%" stop-color="#ff3c27"/></linearGradient>'+
   '<linearGradient id="'+id+'-area" gradientUnits="userSpaceOnUse" x1="0" y1="10" x2="0" y2="130"><stop offset="0" stop-color="#ff3926" stop-opacity=".16"/><stop offset="100%" stop-color="#ff3926" stop-opacity="0"/></linearGradient>'+
   '<linearGradient id="'+id+'-fade" gradientUnits="userSpaceOnUse" x1="30" y1="0" x2="294" y2="0"><stop offset="0" stop-color="#000"/><stop offset="35%" stop-color="#000"/><stop offset="100%" stop-color="#fff"/></linearGradient>'+
   '<mask id="'+id+'-mask"><rect x="30" y="5" width="264" height="125" fill="url(#'+id+'-fade)"/></mask>'+
   '<linearGradient id="'+id+'-cursor" gradientUnits="userSpaceOnUse" x1="'+last.x+'" y1="5" x2="'+last.x+'" y2="130"><stop offset="0" stop-color="#ff3d27" stop-opacity="0"/><stop offset="14%" stop-color="#ff3d27"/><stop offset="60%" stop-color="#ff3d27" stop-opacity=".9"/><stop offset="100%" stop-color="#ff3d27" stop-opacity="0"/></linearGradient>'+
   '<filter id="'+id+'-glow" filterUnits="userSpaceOnUse" x="'+(last.x-12)+'" y="-5" width="24" height="150"><feGaussianBlur stdDeviation="1.65"/></filter>';
  svg.prepend(defs);
  const backdrop=make('g',{'class':'sl-weight-chart-backdrop','aria-hidden':'true'});
  points.forEach(point=>backdrop.append(make('line',{x1:point.x,x2:point.x,y1:10,y2:130,stroke:'#a4a79f','stroke-width':'.55','stroke-opacity':'.4','stroke-dasharray':'2 4.3'})));
  if(points.length>1)backdrop.append(make('path',{d:path.getAttribute('d')+' L'+last.x+' 130 H'+first.x+' Z',fill:'url(#'+id+'-area)',mask:'url(#'+id+'-mask)'}));
  backdrop.append(make('path',{d:'M30 130H294',fill:'none',stroke:'#94988f','stroke-width':'.65'}));
  svg.insertBefore(backdrop,path);
  path.classList.add('sl-weight-native-line');path.style.setProperty('--sl-weight-line','url(#'+id+'-line)');
  svg.querySelectorAll(':scope>text').forEach(text=>{
   if(Number(text.getAttribute('y'))>130)text.classList.add('sl-weight-date');
  });
  const cursor=make('g',{'class':'sl-weight-chart-cursor','aria-hidden':'true'});
  cursor.append(make('path',{d:'M'+last.x+' 5V130',fill:'none',stroke:'url(#'+id+'-cursor)','stroke-width':'3.3','stroke-opacity':'.4',filter:'url(#'+id+'-glow)'}));
  cursor.append(make('path',{d:'M'+last.x+' 5V130',fill:'none',stroke:'url(#'+id+'-cursor)','stroke-width':'1.1'}));
  cursor.append(make('circle',{cx:last.x,cy:last.y,r:'7.1',fill:'#ff3c27',opacity:'.13'}));
  cursor.append(make('circle',{cx:last.x,cy:last.y,r:'4.9',fill:'#ff3c27',opacity:'.22'}));
  points.slice(0,-1).forEach((point,index)=>cursor.append(make('circle',{cx:point.x,cy:point.y,r:'2.4',fill:sampleColors(index,points.length)})));
  const endpoint=svg.querySelector(':scope>circle');if(endpoint)endpoint.classList.add('sl-weight-native-point');
  svg.insertBefore(cursor,endpoint||null);
  chart.dataset.slWeightChart='native-d03';
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
  document.querySelectorAll('#appcontent .wchart,#scrpage.wsscr .wchart').forEach(presentChart);
 }
 function schedule(){if(!pending){pending=true;requestAnimationFrame(present);}}
 const shell=document.querySelector('.screen');
 if(shell)new MutationObserver(schedule).observe(shell,{subtree:true,childList:true});
 window.addEventListener('gym-redesign:view',schedule);
 schedule();
})();
