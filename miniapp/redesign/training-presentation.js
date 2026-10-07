/* Approved02 presentation over the original native machine model and actions. */
(() => {
'use strict';let scheduled=false;
const fmt=n=>Number(n).toLocaleString('ru-RU').replace(/\u00a0/g,' ');
function hook(button,action,value,label){button.removeAttribute('data-action');button.dataset.a=action;if(value!==undefined)button.dataset.v=String(value);if(label)button.setAttribute('aria-label',label);}
function present(){
 scheduled=false;
 const sheet=document.querySelector('#ov.on>.msheet');if(!sheet||sheet.querySelector('.rd-approved-training'))return;
 const data=window.GymRedesignCatalog.machineData();if(!data)return;
 const theme=document.documentElement.dataset.redesignTheme;
 const nativePhoto=sheet.querySelector('.mhero-top label'),nativeStep=sheet.querySelector('.steprow'),nativeDone=sheet.querySelector('.donerow'),nativeChart=sheet.querySelector('.chart'),nativeDelete=sheet.querySelector('.delbtn');
 const host=document.createElement('div');host.innerHTML=ApprovedTrainingMarkup(theme);const page=host.firstElementChild;page.classList.add('rd-approved-training','leg-detail');
 page.querySelectorAll('img[src],use[href]').forEach(el=>{const key=el.tagName.toLowerCase()==='use'?'href':'src';const src=el.getAttribute(key);if(src&&!src.startsWith('../'))el.setAttribute(key,'../'+src);});
 page.querySelector('.ta-detail-title').textContent=data.machine.n;
 page.querySelector('.ta-detail-category').textContent=data.machine.g;
 const values={load:data.working.w,sets:data.working.s,reps:data.working.r};
 for(const key of ['load','sets','reps']){
  const input=page.querySelector('[data-value="'+key+'"]');const value=document.createElement('span');value.className=input.className+' rd-training-value';value.dataset.value=key;value.textContent=fmt(values[key]);input.replaceWith(value);
  page.querySelectorAll('[data-white-current="'+key+'"],[data-dark-current="'+key+'"],[data-training-summary="'+key+'"]').forEach(el=>el.textContent=fmt(values[key]));
 }
 const reps=page.querySelector('[data-white-reps]');if(reps)reps.textContent=values.reps;
 const parameters=page.querySelector('[data-white-detail-parameters],[data-dark-detail-parameters]');if(parameters)parameters.textContent=data.lastText;
 hook(page.querySelector('[data-action="back"]'),'close',undefined,'Назад');
 const star=page.querySelector('[data-action="star"]');hook(star,'rdmachinefav',undefined,'Избранное');star.setAttribute('aria-pressed',String(!!data.machine.favorite));star.classList.toggle('filled',!!data.machine.favorite);
 page.querySelectorAll('[data-action^="step:"]').forEach(button=>{const [_,key,delta]=button.dataset.action.split(':');hook(button,{load:'dw',sets:'ds',reps:'dr'}[key],Number(delta)<0?-1:1,({load:'веса',sets:'подходов',reps:'повторов'}[key]+' '+(Number(delta)<0?'меньше':'больше')));});
 hook(page.querySelector('[data-action="save"]'),'save',undefined,'Сохранить');
 const nav={dumbbell:'workout',weight:'weight',fork:'kbju',history:'history'};page.querySelectorAll('[data-action^="nav:"]').forEach(button=>hook(button,'rdmachinenav',nav[button.dataset.action.split(':')[1]]));
 const content=page.querySelector('.ta-detail-content');
 if(data.working.ok){nativeDone.className='rd-training-success';nativeDone.setAttribute('role','status');nativeDone.innerHTML=UI.icon('check',18)+'<span>Все подходы выполнены</span>';content.querySelector('[data-a="save"]').before(nativeDone);}
 const extra=document.createElement('details');extra.className='rd-training-controls';extra.innerHTML='<summary>Параметры тренажёра</summary><div class="rd-training-extra"></div>';const box=extra.lastElementChild;
 if(!data.working.ok){nativeDone.className='rd-training-complete';box.append(nativeDone);}
 if(nativeStep)box.append(nativeStep);
 if(nativePhoto)box.append(nativePhoto);
 if(nativeDelete)box.append(nativeDelete);
 content.querySelector('.ta-muscles').after(extra);
 const muscles=page.querySelector('.ta-muscles');
 if(data.machine.g!=='Ноги'){
  const groups={Грудь:'chest',Спина:'back',Бицепс:'arms',Трицепс:'arms',Руки:'arms',Плечи:'chest'};
  muscles.querySelector('img').src='../assets/anatomy-groups/'+theme+'/'+(groups[data.machine.g]||'front-thighs')+'.png';
  muscles.querySelector('.ta-muscle-labels').replaceChildren();const row=document.createElement('div');row.innerHTML='<span class="ta-muscle-dot" aria-hidden="true"></span>';const label=document.createElement('span');label.className='ui-list-title';label.textContent=data.machine.g;row.append(label);muscles.querySelector('.ta-muscle-labels').append(row);
 }
 const approvedChart=page.querySelector('.ta-chart-section');approvedChart.classList.add('rd-training-chart');approvedChart.replaceChildren(nativeChart);
 const summary=page.querySelector('.ta-leg-summary');summary.children[2].querySelector('.ui-triplet').textContent=data.logs;
 summary.querySelectorAll('.ui-trend').forEach(el=>el.remove());
 page.dataset.equipmentMachine=data.machine.g==='Ноги'?'leg-press':'lat-pulldown';
 page.dataset.equipmentName=data.machine.n;
 if(data.working.img){const photo=page.querySelector('.ta-detail-hero');photo.dataset.equipmentPersonal='true';photo.src=data.working.img;page.querySelector('.ta-detail-hero-back').hidden=true;}
 else if(data.machine.g!=='Ноги'){
  page.querySelector('.ta-detail-hero').src=theme==='white'?'../white/assets/light-pulldown.png':'../assets/training-lat-graphite.png';
  page.querySelector('.ta-detail-hero-back').hidden=true;
 }
 sheet.replaceChildren(page);
}
function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(present);}
const shell=document.querySelector('.screen');if(shell)new MutationObserver(schedule).observe(shell,{subtree:true,childList:true});
window.addEventListener('gym-redesign:view',schedule);schedule();
})();
