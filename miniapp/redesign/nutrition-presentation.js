/* One approved03 shell over the native nutrition model and delegated actions. */
(() => {
'use strict';
let scheduled=false;
const number=value=>Math.round(value).toLocaleString('ru-RU').replace(/\u00a0/g,' ');
function nativeButton(button,action,value,label){button.removeAttribute('data-action');button.dataset.a=action;if(value!==undefined)button.dataset.v=String(value);if(label)button.setAttribute('aria-label',label);}
function update(page,data,white){
 const signature=JSON.stringify(data);if(page.dataset.nutritionState===signature)return;
 page.dataset.nutritionState=signature;
 const balance=Math.round(data.goal.k-data.totals.k);
 page.querySelector('.na-calorie-reading .ui-micro').textContent=balance<0?'ПЕРЕБОР':'ОСТАЛОСЬ';
 page.querySelector('.na-calorie-reading .ui-value').textContent=number(Math.abs(balance));
 const fields=['p','c','f'];
 page.querySelectorAll('.na-macros>div').forEach((item,i)=>{
  const current=Math.round(data.totals[fields[i]]),target=data.goal[fields[i]],value=item.querySelector('.ui-caption');
  if(white){value.querySelector('.white-macro-current').textContent=current;value.querySelector('.white-macro-goal').textContent=' / '+target+' г';}
  else value.textContent=current+' / '+target+' г';
  item.querySelector('.na-macro-track>span').style.width=Math.min(100,target?current/target*100:0)+'%';
 });
 const water=page.querySelector('.na-water');
 water.querySelector('[data-water]').textContent=data.liters;
 water.querySelector('[data-water-ml]').textContent=number(data.water*250)+' мл';
 water.querySelector('.water-fill').style.width=Math.min(100,data.water/8*100)+'%';
 const weekly=[Math.max(0,data.week.budget-data.week.used),data.week.used,Math.max(0,data.week.sunday)];
 page.querySelectorAll('.na-budget-metrics .ui-metric').forEach((el,i)=>el.textContent=number(weekly[i]));
}
function present(){
 scheduled=false;
 const kn=document.querySelector('#appcontent>.kn');
 if(!kn)return;
 const existing=kn.querySelector('.rd-approved-nutrition');
 if(existing){update(existing,window.GymRedesignCatalog.nutritionData(),document.documentElement.dataset.redesignTheme==='white');return;}
 if(!kn.querySelector('.kn-today'))return;
 const data=window.GymRedesignCatalog.nutritionData();
 const white=document.documentElement.dataset.redesignTheme==='white';
 const host=document.createElement('div');host.innerHTML=nutrition();
 const page=host.firstElementChild;
 if(white)WhitePresentation.adapters[3](page);
 const scroll=page.querySelector('.ui-scroll');page.replaceChildren(...scroll.children);
 page.classList.add('rd-approved-nutrition','nutrition-screen');
 page.querySelectorAll('img[src],use[href]').forEach(el=>{
  const key=el.tagName.toLowerCase()==='use'?'href':'src';
  const src=el.getAttribute(key);if(src&&!src.startsWith('../'))el.setAttribute(key,'../'+src);
 });
 const header=page.querySelector('.na-header');
 header.querySelector('.ui-caption').textContent=data.date;
 const goal=document.createElement('button');goal.type='button';goal.className='rd-nutrition-goal';goal.innerHTML=UI.icon('pencil',20);nativeButton(goal,'kbopen','kbGoals','Изменить дневную цель');header.append(goal);
 nativeButton(page.querySelector('.na-favorite-action button'),'kbopen','kbFav','Избранное');
 nativeButton(page.querySelector('.na-camera-action button'),'kbopen','kbCamera','Сфотографировать еду или штрихкод');
 nativeButton(page.querySelector('.na-manual-action button'),'kbopen','kbManual','Вручную');
 // Use native real meal/favorite rows. Empty favorites remain empty, and all edit hooks are retained.
 const favorites=kn.querySelector('.kn-favs');
 const originalFavorites=page.querySelector('.na-favorites');
 if(favorites){favorites.classList.add('rd-native-favorites','na-favorites');originalFavorites.replaceWith(favorites);}
 const meals=kn.querySelector('.kn-meals');
 if(meals&&!meals.querySelector('.kn-empty')){meals.classList.add('rd-native-meals');page.querySelector('.na-actions').after(meals);}
 const water=page.querySelector('.na-water');
 const minus=water.querySelector('[data-action="water:minus"]');nativeButton(minus,'kbw',-1,'Убрать стакан');minus.disabled=data.water===0;
 nativeButton(water.querySelector('[data-action="water:add"]'),'kbw',1,'Добавить стакан 250 мл');
 const portion=water.querySelector('[data-action="water:portion"]');const portionLabel=document.createElement('span');portionLabel.className=portion.className;portionLabel.innerHTML=portion.innerHTML;portionLabel.querySelector('.ui-button-icon')?.remove();portion.replaceWith(portionLabel);
 nativeButton(page.querySelector('.na-budget-heading button'),'kbopen','kbInsights','Расчёт бюджета недели');
 update(page,data,white);
 kn.replaceChildren(page);
}
function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(present);}
const shell=document.querySelector('.screen');if(shell)new MutationObserver(schedule).observe(shell,{subtree:true,childList:true});
window.addEventListener('gym-redesign:view',schedule);schedule();
})();
