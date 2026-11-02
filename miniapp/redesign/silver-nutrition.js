/* TACTILE / Silver F—03 skin. Native nutrition values, nodes, order and actions stay owned by the app. */
(() => {
  'use strict';
  let queued = false;
  let serial = 0;
  const point = (radius, angle) => [120 + radius * Math.cos(angle * Math.PI / 180), 120 + radius * Math.sin(angle * Math.PI / 180)];
  const arc = (radius, start, end) => {
    const a = point(radius, start), b = point(radius, end);
    return `M${a[0].toFixed(3)} ${a[1].toFixed(3)} A${radius} ${radius} 0 ${end-start>180?1:0} 1 ${b[0].toFixed(3)} ${b[1].toFixed(3)}`;
  };
  function mountRing(gauge) {
    const id = `sl-food-ring-${++serial}`;
    const cells = Array.from({length:50}, (_, index) => {
      const start = 150 + index * 4.8, end = start + 3.8;
      return `<g class="sl-food-cell" data-active="false" data-current="false"><path class="sl-food-recess" d="${arc(108,start,end)}"/><path class="sl-food-segment" stroke="url(#${id}-off)" d="${arc(108,start,end)}"/><path class="sl-food-cut" d="${arc(105.75,start,end)}"/></g>`;
    }).join('');
    const mask = Array.from({length:50},(_,index)=>`<path d="${arc(108,150+index*4.8,153.8+index*4.8)}"/>`).join('');
    // Map the exact F—03 dial geometry onto the existing product dial's centre/radius.
    // No blocks, readings or controls are moved by this SVG-only transformation.
    const scale = 211.32 / 108, tx = 407.84 - 120 * scale, ty = 393.27 - 120 * scale;
    gauge.innerHTML = `<g class="sl-food-metal" transform="translate(${tx} ${ty}) scale(${scale})"><defs>
      <linearGradient id="${id}-off" gradientUnits="userSpaceOnUse" x1="10" y1="190" x2="200" y2="0"><stop stop-color="#9aa3a5"/><stop offset=".32" stop-color="#b8c0bf"/><stop offset=".5" stop-color="#7d8b90"/><stop offset=".7" stop-color="#a9b5b8"/><stop offset="1" stop-color="#939fa3"/></linearGradient>
      <radialGradient id="${id}-on" gradientUnits="userSpaceOnUse" cx="43" cy="151" r="190"><stop stop-color="#f7f8f4"/><stop offset=".32" stop-color="#dcddd9"/><stop offset=".67" stop-color="#bfc1bd"/><stop offset="1" stop-color="#f1f2ee"/></radialGradient>
      <linearGradient id="${id}-inner" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#737e82" stop-opacity=".6"/><stop offset=".33" stop-color="#e8ece9"/><stop offset=".56" stop-color="#a2adaf"/><stop offset="1" stop-color="#f7f8f4"/></linearGradient>
      <linearGradient id="${id}-glint"><stop stop-color="#fff" stop-opacity="0"/><stop offset=".46" stop-color="#fff" stop-opacity=".75"/><stop offset=".54" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
      <mask id="${id}-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="240" height="194"><g fill="none" stroke="white" stroke-width="5.4">${mask}</g></mask>
      </defs><g class="sl-food-cells" fill="none" stroke-width="5.4" stroke-linecap="butt">${cells}</g>
      <path class="sl-food-inner" stroke="url(#${id}-inner)" d="${arc(88.5,150,390)}" fill="none" stroke-width="1.35"/>
      <path class="sl-food-inner-bevel" d="${arc(89.25,150,390)}" fill="none" stroke-width=".45"/>
      <g mask="url(#${id}-mask)" aria-hidden="true"><g class="sl-food-sheen"><rect x="-25" y="-10" width="38" height="230" transform="skewX(-18)" fill="url(#${id}-glint)"/></g></g></g>`;
    gauge.dataset.silverRing = id;
    gauge.setAttribute('role','progressbar');
    gauge.setAttribute('aria-label','Потреблено калорий за день');
    gauge.setAttribute('aria-valuemin','0');
    gauge.removeAttribute('aria-hidden');
    return id;
  }
  const setAttribute = (node, name, value) => { if(node.getAttribute(name)!==String(value))node.setAttribute(name,String(value)); };
  function present() {
    queued = false;
    if (!document.documentElement.hasAttribute('data-silver')) return;
    const page = document.querySelector('#appcontent .rd-approved-nutrition');
    const gauge = page?.querySelector('.na-rings');
    if (!gauge || !window.GymRedesignCatalog?.nutritionData) return;
    let data;
    try { data=window.GymRedesignCatalog.nutritionData(); } catch (_) { return; }
    if (!data || !data.goal || !data.totals) return;
    const id = gauge.querySelector('.sl-food-metal') ? gauge.dataset.silverRing : mountRing(gauge);
    const consumed = Math.max(0,Number(data.totals.k)||0), goal = Math.max(0,Number(data.goal.k)||0);
    const lit = Math.round(Math.min(1,goal>0?consumed/goal:0)*50);
    gauge.querySelectorAll('.sl-food-cell').forEach((cell,index)=>{
      setAttribute(cell,'data-active',index<lit);
      setAttribute(cell,'data-current',lit>0&&index===lit-1);
      setAttribute(cell.querySelector('.sl-food-segment'),'stroke',`url(#${id}-${index<lit?'on':'off'})`);
    });
    setAttribute(gauge,'aria-valuemax',goal);
    setAttribute(gauge,'aria-valuenow',Math.min(consumed,goal));
    setAttribute(gauge,'aria-valuetext',`${Math.round(consumed).toLocaleString('ru-RU')} из ${Math.round(goal).toLocaleString('ru-RU')} ккал`);
  }
  function schedule(){if(!queued){queued=true;requestAnimationFrame(present);}}
  const host=document.querySelector('.screen');
  if(host)new MutationObserver(records=>{
    // Own SVG-only updates cannot wake this observer into a render loop.
    if(records.some(record=>!record.target.closest?.('.sl-food-metal')))schedule();
  }).observe(host,{subtree:true,childList:true,characterData:true});
  window.addEventListener('gym-redesign:view',schedule);
  window.addEventListener('gym-silver:ready',schedule);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule();});
  schedule();
})();
