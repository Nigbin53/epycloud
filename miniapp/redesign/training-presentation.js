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
 hook(page.querySelector('[data-action="save"]'),'save',undefined,'Записать подход');
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
  const groups={Грудь:'chest',Спина:'back',Бицепс:'arms',Трицепс:'arms',Руки:'arms',Плечи:'chest',Пресс:'chest'};
  muscles.querySelector('img').src='../assets/anatomy-groups/'+theme+'/'+(groups[data.machine.g]?groups[data.machine.g]+'-upper':'front-thighs')+'.png'; // обрезано по зоне мышц, как у ног
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
 // своё фото — в той же рамке и с теми же краями, что и встроенные фото тренажёров
 if(data.working.img){const pl=page.querySelector('.ta-detail-photo-layers');if(pl)pl.classList.add('equipment-single-image');}
 // карандаш «Редактировать» в шапке, рядом с избранным: название, группа мышц, фото, заставка
 if(star&&typeof window.gymMachineEdit==='function'){
  const edit=star.cloneNode(false);
  edit.removeAttribute('aria-pressed');edit.classList.remove('filled');delete edit.dataset.a;delete edit.dataset.v;
  edit.classList.add('rd-medit-open');edit.setAttribute('aria-label','Редактировать тренажёр');
  edit.innerHTML='<svg class="ui-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/></svg>';
  edit.addEventListener('click',()=>openEditor(data.machine,theme));
  star.before(edit);
 }
 trialMachine(page,data,theme); // подходы, подсказка, типы упражнений
 // при +/− страница пересобирается: фото и анатомию берём прежними узлами — без перезагрузки картинки и мелькания
 const layersNew=page.querySelector('.ta-detail-photo-layers');
 if(layersNew){
  const wi=data.working.img||'',pkey=[theme,data.machine.id,data.machine.n,data.machine.g,wi.length,wi.slice(-48)].join('|');
  if(keptPhoto&&keptPhoto.key===pkey)layersNew.replaceWith(keptPhoto.node);else keptPhoto={key:pkey,node:layersNew};
 }
 const mimg=page.querySelector('.ta-muscles img');
 if(mimg){
  const mkey=theme+'|'+mimg.getAttribute('src');
  if(keptMuscle&&keptMuscle.key===mkey)mimg.replaceWith(keptMuscle.node);else keptMuscle={key:mkey,node:mimg};
 }
 sheet.replaceChildren(page);
}
let keptPhoto=null,keptMuscle=null;
/* ---------- r10: подходы, подсказка «пора прибавить», типы упражнений ---------- */
const exTypeOf=m=>['free','body','time'].includes(m&&m.type)?m.type:'machine';
function setText(type,x){
 if(type==='time')return x.r+' сек';
 if(type==='body')return (x.w>0?'+'+fmt(x.w)+' кг':'свой вес')+' × '+x.r;
 return fmt(x.w)+' кг × '+x.r;
}
const shortDay=t=>new Date(t).toLocaleDateString('ru-RU',{weekday:'short',day:'numeric',month:'short'});
function trialMachine(page,data,theme){
 if(typeof window.gymSets!=='function')return;
 const m=data.machine,w=data.working,id=m.id,type=exTypeOf(m);
 page.classList.add('rd-type-'+type);
 if(type==='time')page.classList.add('rd-noload');
 // подписи по типу
 const unit=page.querySelector('.ta-load-reading .ui-unit');
 if(unit&&type==='body')unit.textContent='доп. кг';
 if(type==='time'){
  page.querySelectorAll('.ta-small-metric').forEach(el=>{const lb=el.querySelector('.ta-small-label');if(lb&&/Повтор/i.test(lb.textContent))lb.textContent='Секунды';});
  page.querySelectorAll('.wt-current-column .ui-caption,.bt-current-column .ui-caption').forEach(c=>{if(/Повт/i.test(c.textContent))c.textContent='Сек.';});
 }
 // «Последний раз» по типу: секунды и свой вес вместо «0 кг»
 if(type==='time'||type==='body'){
  const par=page.querySelector('[data-white-detail-parameters],[data-dark-detail-parameters]');
  const last=window.gymLastSets(id)||null,todaySets=window.gymSets(id);
  const ss=todaySets.length?todaySets:(last?last.sets:[]);
  if(par&&ss.length)par.textContent='Последний раз: '+ss.map(x=>type==='time'?x.r+' сек':(x.w>0?'+'+fmt(x.w)+'×':'')+x.r).join(' · ');
 }
 // подсказка прибавки
 const tip=window.gymHint(id);
 const load=page.querySelector('.ta-load');
 if(tip&&load){
  const b=document.createElement('button');b.type='button';b.className='rd-hint rd-hint-'+tip.kind;
  b.innerHTML='<span>'+(tip.kind==='up'?'↑ ':tip.kind==='down'?'↓ ':'• ')+tip.text+'</span>'+(tip.kind==='stay'?'':'<b>Поставить</b>');
  if(tip.kind!=='stay')b.addEventListener('click',()=>window.gymApplyHint(id));
  load.before(b);
 }
 // подходы за выбранный день: список с удалением; записывает их кнопка «Записать» (бывшая «Сохранить»)
 const sets=window.gymSets(id);
 const past=typeof window.gymSelPastT==='function'&&window.gymSelPastT();
 const sec=document.createElement('section');sec.className='rd-sets';
 const head=(past?'Подходы · '+shortDay(past):'Подходы сегодня');
 const dumb=type==='free'&&/гантел/i.test(m.n);
 let html='<div class="rd-sets-head"><span>'+head+(dumb?' <small>вес одной гантели</small>':'')+'</span><em>'+sets.length+' из '+w.s+'</em></div>';
 if(sets.length){
  html+='<ol class="rd-sets-list">'+sets.map((x,i)=>'<li class="rd-set"><b>'+(i+1)+'</b><span>'+setText(type,x)+'</span><button type="button" class="rd-set-x" data-setdel="'+i+'" aria-label="Удалить подход '+(i+1)+'">×</button></li>').join('')+'</ol>';
 }else html+='<p class="rd-sets-empty">Сделал подход — нажми «Записать»: вес и повторы берутся с регуляторов выше.</p>';
 const prev=window.gymLastSets(id);
 if(prev&&prev.sets.length)html+='<div class="rd-sets-prev">В прошлый раз ('+shortDay(prev.t)+'): '+prev.sets.map(x=>type==='time'?x.r+' с':type==='body'?(x.w>0?'+'+fmt(x.w)+'×':'')+x.r:fmt(x.w)+'×'+x.r).join(' · ')+'</div>';
 sec.innerHTML=html;
 sec.addEventListener('click',e=>{
  const del=e.target.closest('[data-setdel]');if(!del)return;
  const i=+del.dataset.setdel,x=sets[i];
  window.gymSetDel(id,i);
  if(window.gymToast)window.gymToast('Подход '+(i+1)+' удалён',()=>window.gymSetPut(id,i,x),setText(type,x));
 });
 const saveBtn=page.querySelector('.ta-detail-content [data-a="save"]');
 if(saveBtn){ // «Сохранить» → «Записать»: пишет подход
  const lb=saveBtn.querySelector('.button-label,.ui-button-label');
  if(lb)lb.textContent='Записать';else{const tn=[...saveBtn.childNodes].find(n=>n.nodeType===3&&/Сохранить/.test(n.textContent));if(tn)tn.textContent=tn.textContent.replace('Сохранить','Записать');}
  saveBtn.setAttribute('aria-label','Записать подход');
 }
 const save=page.querySelector('.ta-detail-content [data-a="save"]');
 if(save)save.after(sec); // сразу после подходов/повторов идёт «Записать», под ней — список подходов
}

/* ---------- редактор тренажёра ---------- */
const MEDIT_GROUPS=['Грудь','Спина','Ноги','Руки','Плечи','Пресс'];
const MEDIT_TYPES=[['machine','Тренажёр'],['free','Свободный вес'],['body','Свой вес'],['time','На время']];
const meditEsc=v=>String(v==null?'':v).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
// фото с телефона → центральная обрезка под нужные пропорции, сжатый JPEG
function meditCrop(file,w,h,q){return new Promise((ok,no)=>{const r=new FileReader();r.onerror=no;r.onload=()=>{const im=new Image();im.onerror=no;im.onload=()=>{
 const k=Math.max(w/im.width,h/im.height),sw=w/k,sh=h/k,sx=(im.width-sw)/2,sy=(im.height-sh)/2;
 const c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(im,sx,sy,sw,sh,0,0,w,h);ok(c.toDataURL('image/jpeg',q));};im.src=r.result;};r.readAsDataURL(file);});}
function openEditor(machine,theme){
 const old=document.querySelector('.rd-medit');if(old)old.remove();
 const st={n:machine.n,g:machine.g,img:machine.img||'',cover:machine.cover||'',type:exTypeOf(machine)};
 const box=document.createElement('div');box.className='rd-medit';box.setAttribute('role','dialog');box.setAttribute('aria-modal','true');box.setAttribute('aria-label','Редактировать тренажёр');
 const close=()=>{box.classList.remove('on');setTimeout(()=>box.remove(),220);};
 function draw(){
  box.innerHTML='<div class="rd-medit-panel">'
   +'<div class="rd-medit-head"><b>Редактировать</b><button type="button" class="rd-medit-x" data-m="close" aria-label="Закрыть">×</button></div>'
   +'<label class="rd-medit-lbl" for="rd-medit-name">Название</label>'
   +'<input id="rd-medit-name" class="rd-medit-input" maxlength="40" autocomplete="off" value="'+meditEsc(st.n)+'">'
   +'<div class="rd-medit-lbl">Группа мышц</div><div class="rd-medit-groups" role="group" aria-label="Группа мышц">'
   +MEDIT_GROUPS.map(g=>'<button type="button" class="rd-medit-chip'+(g===st.g?' on':'')+'" data-m="group" data-g="'+g+'" aria-pressed="'+(g===st.g)+'">'+g+'</button>').join('')+'</div>'
   +'<div class="rd-medit-lbl">Тип</div><div class="rd-medit-groups" role="group" aria-label="Тип упражнения">'
   +MEDIT_TYPES.map(t=>'<button type="button" class="rd-medit-chip'+(t[0]===st.type?' on':'')+'" data-m="type" data-t="'+t[0]+'" aria-pressed="'+(t[0]===st.type)+'">'+t[1]+'</button>').join('')+'</div>'
   +'<div class="rd-medit-photos">'
   +'<div class="rd-medit-ph"><div class="rd-medit-lbl">Фото тренажёра<small>на странице тренажёра</small></div>'
   +'<label class="rd-medit-pick ph">'+(st.img?'<img alt="" src="'+st.img+'">':'<span>+ Выбрать</span>')+'<input type="file" accept="image/*" data-m="img" hidden></label>'
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
  else if(m==='type'){st.type=t.dataset.t;draw();}
  else if(m==='rmimg'){st.img='';draw();}
  else if(m==='rmcover'){st.cover='';draw();}
  else if(m==='save'){
   const n=String(st.n||'').trim();
   if(n.length<2){box.querySelector('.rd-medit-err').textContent='Название — минимум 2 символа';box.querySelector('#rd-medit-name').focus();return;}
   const ok=window.gymMachineEdit(machine.id,{n:n,g:st.g,img:st.img,cover:st.cover,type:st.type});
   if(ok)close();else box.querySelector('.rd-medit-err').textContent='Не получилось сохранить';
  }
 });
 box.addEventListener('change',e=>{
  const t=e.target;if(!t.files||!t.files[0])return;
  const kind=t.dataset.m;
  const job=kind==='img'?meditCrop(t.files[0],900,600,.8):meditCrop(t.files[0],900,405,.76);
  job.then(url=>{st[kind]=url;draw();}).catch(()=>{const er=box.querySelector('.rd-medit-err');if(er)er.textContent='Не удалось открыть фото';});
 });
 document.body.append(box);
 requestAnimationFrame(()=>box.classList.add('on'));
}
function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(present);}
const shell=document.querySelector('.screen');if(shell)new MutationObserver(schedule).observe(shell,{subtree:true,childList:true});
window.addEventListener('gym-redesign:view',schedule);schedule();
})();
