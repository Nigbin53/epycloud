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
 const used=!!(data.machine.used||(data.machine.h&&data.machine.h.length)||data.logs>0);
 page.classList.toggle('rd-noload',!used); // без записей шапка без блока веса
 for(const key of ['load','sets','reps']){
  const input=page.querySelector('[data-value="'+key+'"]');const value=document.createElement('span');value.className=input.className+' rd-training-value';value.dataset.value=key;value.textContent=fmt(values[key]);input.replaceWith(value);
  // до первой записи у тренажёра нет рабочего веса — в шапке «—», значение на регуляторе лишь подсказка
  page.querySelectorAll('[data-white-current="'+key+'"],[data-dark-current="'+key+'"],[data-training-summary="'+key+'"]').forEach(el=>el.textContent=(key==='load'&&!used)?'—':fmt(values[key]));
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
 // смена фото теперь в «Редактировать» (кнопка на фото)
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
 // кнопка «Редактировать» в углу фото: название, группа мышц, квадратное фото, заставка
 const layers=page.querySelector('.ta-detail-photo-layers');
 if(layers&&typeof window.gymMachineEdit==='function'){
  const edit=document.createElement('button');edit.type='button';edit.className='rd-photo-change rd-medit-open';
  edit.innerHTML='<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/></svg><span>Редактировать</span>';
  edit.addEventListener('click',()=>openEditor(data.machine,theme));
  // держатель нулевой высоты — кнопка не сдвигает вёрстку страницы
  const pin=document.createElement('div');pin.className='rd-photo-pin';pin.append(edit);layers.before(pin);
 }
 sheet.replaceChildren(page);
}
/* ---------- редактор тренажёра ---------- */
const MEDIT_GROUPS=['Грудь','Спина','Ноги','Руки','Плечи'];
const meditEsc=v=>String(v==null?'':v).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
// фото с телефона → центральная обрезка под нужные пропорции, сжатый JPEG
function meditCrop(file,w,h,q){return new Promise((ok,no)=>{const r=new FileReader();r.onerror=no;r.onload=()=>{const im=new Image();im.onerror=no;im.onload=()=>{
 const k=Math.max(w/im.width,h/im.height),sw=w/k,sh=h/k,sx=(im.width-sw)/2,sy=(im.height-sh)/2;
 const c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(im,sx,sy,sw,sh,0,0,w,h);ok(c.toDataURL('image/jpeg',q));};im.src=r.result;};r.readAsDataURL(file);});}
function openEditor(machine,theme){
 const old=document.querySelector('.rd-medit');if(old)old.remove();
 const st={n:machine.n,g:machine.g,img:machine.img||'',cover:machine.cover||''};
 const box=document.createElement('div');box.className='rd-medit';box.setAttribute('role','dialog');box.setAttribute('aria-modal','true');box.setAttribute('aria-label','Редактировать тренажёр');
 const close=()=>{box.classList.remove('on');setTimeout(()=>box.remove(),220);};
 function draw(){
  box.innerHTML='<div class="rd-medit-panel">'
   +'<div class="rd-medit-head"><b>Редактировать</b><button type="button" class="rd-medit-x" data-m="close" aria-label="Закрыть">×</button></div>'
   +'<label class="rd-medit-lbl" for="rd-medit-name">Название</label>'
   +'<input id="rd-medit-name" class="rd-medit-input" maxlength="40" autocomplete="off" value="'+meditEsc(st.n)+'">'
   +'<div class="rd-medit-lbl">Группа мышц</div><div class="rd-medit-groups" role="group" aria-label="Группа мышц">'
   +MEDIT_GROUPS.map(g=>'<button type="button" class="rd-medit-chip'+(g===st.g?' on':'')+'" data-m="group" data-g="'+g+'" aria-pressed="'+(g===st.g)+'">'+g+'</button>').join('')+'</div>'
   +'<div class="rd-medit-photos">'
   +'<div class="rd-medit-ph"><div class="rd-medit-lbl">Фото тренажёра<small>квадратное, на странице тренажёра</small></div>'
   +'<label class="rd-medit-pick sq">'+(st.img?'<img alt="" src="'+st.img+'">':'<span>+ Выбрать</span>')+'<input type="file" accept="image/*" data-m="img" hidden></label>'
   +(st.img?'<button type="button" class="rd-medit-rm" data-m="rmimg">Убрать</button>':'')+'</div>'
   +'<div class="rd-medit-ph wide"><div class="rd-medit-lbl">Заставка<small>широкая, в списке тренировок</small></div>'
   +'<label class="rd-medit-pick wd">'+(st.cover?'<img alt="" src="'+st.cover+'">':'<span>+ Выбрать</span>')+'<input type="file" accept="image/*" data-m="cover" hidden></label>'
   +(st.cover?'<button type="button" class="rd-medit-rm" data-m="rmcover">Убрать</button>':'')+'</div>'
   +'</div>'
   +'<div class="rd-medit-err" role="alert"></div>'
   +'<div class="rd-medit-actions"><button type="button" class="rd-medit-cancel" data-m="close">Отмена</button><button type="button" class="rd-medit-save" data-m="save">Сохранить</button></div>'
   +'</div>';
 }
 draw();
 box.addEventListener('input',e=>{if(e.target.id==='rd-medit-name')st.n=e.target.value;});
 box.addEventListener('click',e=>{
  if(e.target===box){close();return;}
  const t=e.target.closest('[data-m]');if(!t||t.tagName==='INPUT')return;
  const m=t.dataset.m;
  if(m==='close')close();
  else if(m==='group'){st.g=t.dataset.g;draw();}
  else if(m==='rmimg'){st.img='';draw();}
  else if(m==='rmcover'){st.cover='';draw();}
  else if(m==='save'){
   const n=String(st.n||'').trim();
   if(n.length<2){box.querySelector('.rd-medit-err').textContent='Название — минимум 2 символа';box.querySelector('#rd-medit-name').focus();return;}
   const ok=window.gymMachineEdit(machine.id,{n:n,g:st.g,img:st.img,cover:st.cover});
   if(ok)close();else box.querySelector('.rd-medit-err').textContent='Не получилось сохранить';
  }
 });
 box.addEventListener('change',e=>{
  const t=e.target;if(!t.files||!t.files[0])return;
  const kind=t.dataset.m;
  const job=kind==='img'?meditCrop(t.files[0],560,560,.8):meditCrop(t.files[0],900,405,.76);
  job.then(url=>{st[kind]=url;draw();}).catch(()=>{const er=box.querySelector('.rd-medit-err');if(er)er.textContent='Не удалось открыть фото';});
 });
 document.body.append(box);
 requestAnimationFrame(()=>box.classList.add('on'));
}
function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(present);}
const shell=document.querySelector('.screen');if(shell)new MutationObserver(schedule).observe(shell,{subtree:true,childList:true});
window.addEventListener('gym-redesign:view',schedule);schedule();
})();
