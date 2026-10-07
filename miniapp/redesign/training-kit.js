/* Actual approved02 renderer, with both existing skin adapters. UI comes from nutrition-kit. */
function auditedTrainingMetrics(reps,kg){return `<div class="ta-metrics">${[['3','ПОДХОДА'],[reps,'ПОВТОРОВ'],[kg,'КГ']].map(([value,label])=>`<div>${UI.text(value,'compact-value')}${UI.text(label,'micro','ui-muted')}</div>`).join('')}</div>`}
function auditedTrainingExercise(asset,category,title,reps,kg,cls=''){return `<section class="ta-exercise ${cls}">${UI.photo(asset,'ta-exercise-photo')}<div class="ta-exercise-heading"><div class="ta-exercise-copy">${UI.text(category,'caption','ui-muted ta-category')}${UI.text(title,'feature-title','ta-exercise-title')}</div><div class="ta-record">${UI.button('ЗАПИСАТЬ','record','outline','arrow')}</div></div>${auditedTrainingMetrics(reps,kg)}</section>`}
function trainingOverview(){
 const header=`<header class="ui-header ta-greeting">${UI.greeting('settings')}</header>`;
 const body=`<div class="ta-overview-content"><div class="ta-today-line">${UI.text('СЕГОДНЯ','micro')}${UI.text('0 из 9 упражнений','caption','ui-muted')}</div><div class="ta-today-progress" role="progressbar" aria-label="Упражнения за сегодня" aria-valuemin="0" aria-valuemax="9" aria-valuenow="0"><span></span></div>${UI.calendar([21,22,23,24,25,26,27],0)}<div class="ui-tabs ta-filters" role="tablist" aria-label="Группа упражнений">${['Все','Верх','Низ','Всё тело'].map((label,i)=>`<button type="button" role="tab" aria-selected="${i===0}" aria-pressed="${i===0}" class="${i===0?'selected':''}" data-action="tab:${label}">${label}</button>`).join('')}</div>${auditedTrainingExercise('lat-pulldown-equipment.png','Спина','Тяга верхнего блока<br>широким хватом','10','45','ta-first-exercise')}${auditedTrainingExercise('training-leg-photo.png','Ноги','Жим ногами','12','120','ta-second-exercise')}</div>`;
 return UI.page(body,{header,nav:UI.nav('dumbbell'),className:'ta-page',system:true,home:true});
}
GYM.register({id:1,name:'Тренировка · Сегодня',width:393,height:852,className:'training-overview',render:trainingOverview});
function auditedLegChart(){
 const months=['Янв','Фев','Мар','Апр','Май','Июн','Июл'];
 const values=[54.5,57,59,60,62,60.2,59],xs=[46,109,173,239,308,364,428];
 // 62 kg is the data peak at the third grid level; the fourth cell is headroom.
 const y=kg=>1219-(kg-50)/16*116;
 const points=values.map((kg,i)=>[xs[i],y(kg)]);
 // Monotone tangents preserve the data peak without overshoot.
 const slopes=points.slice(1).map((p,i)=>(p[1]-points[i][1])/(p[0]-points[i][0]));
 const tangents=points.map((p,i)=>i===0?slopes[0]:i===points.length-1?slopes.at(-1):slopes[i-1]*slopes[i]<=0?0:2/(1/slopes[i-1]+1/slopes[i]));
 const d=points.slice(1).reduce((path,p,i)=>{const a=points[i],dx=(p[0]-a[0])/3;return path+`C${a[0]+dx} ${a[1]+dx*tangents[i]} ${p[0]-dx} ${p[1]-dx*tangents[i+1]} ${p[0]} ${p[1]}`},`M${points[0][0]} ${points[0][1]}`);
 return `<svg class="ta-leg-chart" viewBox="30 1102 470 154" aria-label="Вес по месяцам с января по июль; максимальный вес 62 кг" data-chart-min="50" data-chart-max="66" data-series-max="62" role="img"><defs><linearGradient id="audited-leg-area" x1="0" y1="0" x2="0" y2="1"><stop stop-color="var(--fit-muted)" stop-opacity=".3"/><stop offset="1" stop-color="var(--fit-bg)" stop-opacity="0"/></linearGradient></defs><g stroke="var(--fit-line)" stroke-width="1">${xs.map(x=>`<path d="M${x} 1103v116"/>`).join('')}${[66,62,58,54,50].map(kg=>`<path data-grid-weight="${kg}" d="M40 ${y(kg)}h394"/>`).join('')}</g><path d="${d}L428 1219H46Z" fill="url(#audited-leg-area)"/><path data-chart-line d="${d}" fill="none" stroke="var(--fit-text)" stroke-width="2.2"/>${points.map(([x,py],i)=>`<circle cx="${x}" cy="${py}" r="4.3" fill="var(--fit-text)" data-month="${months[i]}" data-kg="${values[i]}"><title>${months[i]}: ${String(values[i]).replace('.',',')} кг</title></circle>`).join('')}<g fill="var(--fit-muted)" font-family="Manrope,sans-serif" font-size="12">${[62,58,54,50].map(kg=>`<text data-axis-weight x="457" y="${y(kg)+4}">${kg}</text>`).join('')}${[40,102,166,231,300,354,420].map((x,i)=>`<text data-axis-month x="${x}" y="1245">${months[i]}</text>`).join('')}</g></svg>`;
}
function auditedLegSmallMetric(label,value,key){return `<section class="ta-small-metric ta-small-metric--${key}">${UI.text(label,'caption','ui-muted ta-small-label')}<div class="ta-small-adjustment">${UI.iconButton('minus',`step:${key}:-1`)}${UI.input(value,label,key,'ui-stepper-value ta-small-number')}${UI.iconButton('plus',`step:${key}:1`)}</div></section>`}
function legDetail(){
 const muscles=`<section class="ta-muscles">${UI.photo('anatomy-groups/black/front-thighs.png','ta-muscles-photo')}<div class="ta-muscle-labels">${['Квадрицепсы','Ягодичные','Задняя группа бедра'].map(label=>`<div><span class="ta-muscle-dot" aria-hidden="true"></span>${UI.text(label,'list-title')}</div>`).join('')}</div></section>`;
 const summary=`<div class="ta-leg-summary">${[['Подходы','3','','8%','sets'],['Вес','55','кг','14%','load'],['Тренировки','1','','100%','']].map(([label,value,unit,rise,key])=>UI.panel(`${UI.text(label,'caption','ui-muted')}<div class="ta-summary-reading"><div class="ui-triplet" data-type-role="triplet" ${key?`data-training-summary="${key}"`:''}>${value}</div>${unit?UI.text(unit,'unit'):''}</div>${UI.text('↑ '+rise,'trend')}`,'ta-summary-card')).join('')}</div>`;
 const body=`<div class="ta-detail-content">${UI.header('','back','star').replace('data-action="star"','data-action="star" aria-pressed="false"')}<div class="ta-detail-photo-layers">${UI.photo('detail-leg-photo.png','ta-detail-hero-back')}${UI.photo('detail-leg-photo-full.png','ta-detail-hero')}</div>${UI.text('Ноги','caption','ui-muted ta-detail-category')}${UI.text('Жим ногами','single-title','ta-detail-title')}<section class="ta-load"><div class="ta-load-adjustment">${UI.iconButton('minus','step:load:-2.5','ui-adjust-button')}<div class="ta-load-reading">${UI.input('55','Вес','load','ui-number')}${UI.text('кг','unit')}</div>${UI.iconButton('plus','step:load:2.5','ui-adjust-button')}</div></section><div class="ta-sets-reps">${auditedLegSmallMetric('Подходы','3','sets')}${auditedLegSmallMetric('Повторы','12','reps')}</div>${UI.button('Сохранить','save')}${muscles}<section class="ta-chart-section"><div class="ta-chart-reading">${UI.text('62','value')}${UI.text('кг','unit')}</div>${auditedLegChart()}</section>${summary}</div>`;
 return UI.page(body,{nav:UI.nav('dumbbell'),className:'ta-detail-page',system:true,home:true});
}
GYM.register({id:2,name:'Жим ногами',width:393,height:852,className:'leg-detail',render:legDetail});

// Dark presentation uses the existing controls, data and shared handlers.
(function () {
  const element = (page, name, className) => {
    const node = page.ownerDocument.createElement(name);
    node.className = className;
    return node;
  };
  const adapt = {
    1(page) {
      page.classList.add('black-training-layout', 'black-training-cards');
      page.querySelectorAll('.ta-exercise').forEach((card, index) => {
        const heading = card.querySelector('.ta-exercise-heading');
        const metrics = card.querySelector('.ta-metrics');
        const load = metrics.lastElementChild;
        const photo = card.querySelector('.ta-exercise-photo');
        const record = card.querySelector('.ta-record');
        load.classList.add('bt-load-summary');
        heading.append(metrics);
        const photoFrame = element(page, 'div', 'bt-exercise-photo-frame');
        if (index === 0) photo.src = 'assets/training-lat-graphite.png';
        photoFrame.append(photo);
        card.dataset.darkOrdinal = String(index + 1).padStart(2, '0');
        card.append(heading, load, photoFrame, record);
      });
    },
    2(page) {
      page.classList.add('black-leg-layout');
      const content = page.querySelector('.ta-detail-content');
      const header = content.querySelector('.ui-header');
      const heading = element(page, 'div', 'bt-detail-heading');
      heading.append(content.querySelector('.ta-detail-category'), content.querySelector('.ta-detail-title'));
      const parameters = element(page, 'div', 'ui-caption ui-muted bt-detail-parameters');
      parameters.setAttribute('data-dark-detail-parameters', '');
      const value = key => content.querySelector(`[data-value="${key}"]`).value;
      parameters.textContent = `${value('load')} кг · ${value('sets')}×${value('reps')}`;
      heading.append(parameters);
      header.insertBefore(heading, header.lastElementChild);

      const current = element(page, 'div', 'bt-detail-current');
      const load = element(page, 'div', 'bt-current-load');
      const summary = content.querySelector('.ta-leg-summary');
      const reading = key => {
        const copy = summary.querySelector(`[data-training-summary="${key}"]`).closest('.ta-summary-reading').cloneNode(true);
        const number = copy.querySelector('[data-training-summary]');
        number.removeAttribute('data-training-summary');
        number.setAttribute('data-dark-current', key);
        return copy;
      };
      load.append(reading('load'));
      load.insertAdjacentHTML('beforeend', UI.text('Текущий вес', 'caption', 'ui-muted'));
      const counts = element(page, 'div', 'bt-current-values');
      const sets = element(page, 'div', 'bt-current-column');
      sets.append(reading('sets'));
      sets.insertAdjacentHTML('beforeend', UI.text('Подх.', 'caption', 'ui-muted'));
      const times = element(page, 'span', 'ui-caption ui-muted bt-current-times');
      times.textContent = '×';
      times.setAttribute('aria-hidden', 'true');
      const reps = element(page, 'div', 'bt-current-column');
      const repNumber = element(page, 'span', 'ui-triplet');
      repNumber.setAttribute('data-dark-current', 'reps');
      repNumber.textContent = value('reps');
      reps.append(repNumber);
      reps.insertAdjacentHTML('beforeend', UI.text('Повт.', 'caption', 'ui-muted'));
      counts.append(sets, times, reps);
      current.append(load, counts);
      content.insertBefore(current, content.querySelector('.ta-detail-photo-layers'));
    }
  };
  for (const id of [2]) {
    const def = GYM.screens.find(screen => screen.id === id);
    const render = def.render;
    def.render = () => {
      const template = document.createElement('template');
      template.innerHTML = render();
      const page = template.content.querySelector('.ui-page');
      adapt[id](page);
      return page.outerHTML;
    };
  }
  document.addEventListener('input', event => {
    const field = event.target;
    if (!field.matches?.('[data-value="load"], [data-value="sets"], [data-value="reps"]')) return;
    const page = field.closest('.black-leg-layout');
    if (!page) return;
    const value = field.value.trim();
    const current = page.querySelector(`[data-dark-current="${field.dataset.value}"]`);
    if (current && value !== '' && Number.isFinite(Number(value.replace(',', '.')))) current.textContent = value;
    const parameters = page.querySelector('[data-dark-detail-parameters]');
    const read = key => page.querySelector(`[data-value="${key}"]`).value;
    parameters.textContent = `${read('load')} кг · ${read('sets')}×${read('reps')}`;
  });
}());

window.ApprovedTrainingBlack=GYM.screens.find(screen=>screen.id===2).render;
(function () {
  const adapters = WhitePresentation.adapters;
  const element = (page, name, className) => {
    const node = page.ownerDocument.createElement(name);
    node.className = className;
    return node;
  };

  adapters[1] = function (page) {
    if (page.classList.contains('white-training-overview')) return page;
    page.classList.add('white-training-overview');
    const today = page.querySelector('.ta-today-line > .ui-micro');
    if (today) today.textContent = 'Сегодня';
    page.querySelectorAll('.ta-exercise').forEach((card, index) => {
      const heading = card.querySelector('.ta-exercise-heading');
      const metrics = card.querySelector('.ta-metrics');
      const load = metrics.lastElementChild;
      const photo = card.querySelector('.ta-exercise-photo');
      const record = card.querySelector('.ta-record');
      const photoFrame = element(page, 'div', 'wt-exercise-image');

      card.dataset.whiteOrdinal = String(index + 1).padStart(2, '0');
      load.classList.add('wt-load-summary');
      heading.append(metrics);
      photo.src = index === 0 ? 'white/assets/light-pulldown.png' : 'white/assets/light-legpress.png';
      photoFrame.append(photo);
      card.append(heading, load, photoFrame, record);

      const button = record.querySelector('button');
      button.classList.add('wt-record-button');
      const icon = button.querySelector('.ui-button-icon');
      if (icon) icon.innerHTML = UI.icon('check', 17);
    });
    return page;
  };

  function equipmentArc(page) {
    const arc = element(page, 'div', 'wt-equipment-arc');
    arc.setAttribute('aria-hidden', 'true');
    const point = (angle, radius) => {
      const radians = angle * Math.PI / 180;
      return [150 + Math.cos(radians) * radius, 160 + Math.sin(radians) * radius];
    };
    const path = (start, end) => {
      const a = point(start, 130), b = point(end, 130);
      return `M${a[0]} ${a[1]} A130 130 0 ${end - start > 180 ? 1 : 0} 1 ${b[0]} ${b[1]}`;
    };
    const ticks = Array.from({ length: 53 }, (_, index) => {
      const angle = 140 + index * 5;
      const a = point(angle, 137), b = point(angle, index % 3 === 0 ? 143 : 141);
      return `<path class="${angle >= 180 && angle <= 345 ? 'wt-arc-accent' : ''}" d="M${a[0]} ${a[1]}L${b[0]} ${b[1]}"/>`;
    }).join('');
    arc.innerHTML = `<svg viewBox="0 0 300 255" fill="none" aria-hidden="true"><path class="wt-arc-track" d="${path(140, 400)}"/><path class="wt-arc-progress" d="${path(180, 345)}"/><g class="wt-arc-ticks">${ticks}</g></svg>`;
    return arc;
  }

  adapters[2] = function (page) {
    if (page.classList.contains('white-leg-detail')) return page;
    page.classList.add('white-leg-detail');
    const content = page.querySelector('.ta-detail-content');
    const header = content.querySelector('.ui-header');
    const heading = element(page, 'div', 'wt-detail-heading');
    heading.append(content.querySelector('.ta-detail-category'), content.querySelector('.ta-detail-title'));
    const detailParameters = element(page, 'div', 'wt-detail-parameters');
    detailParameters.setAttribute('data-white-detail-parameters', '');
    const detailValue = key => content.querySelector(`[data-value="${key}"]`).value;
    detailParameters.textContent = `${detailValue('load')} кг · ${detailValue('sets')}×${detailValue('reps')}`;
    heading.append(detailParameters);
    header.insertBefore(heading, header.lastElementChild);

    const photoLayers = content.querySelector('.ta-detail-photo-layers');
    const summary = content.querySelector('.ta-leg-summary');
    const currentCard = key => {
      const card = summary.querySelector(`[data-training-summary="${key}"]`).closest('.ta-summary-card').cloneNode(true);
      const reading = card.querySelector('[data-training-summary]');
      reading.removeAttribute('data-training-summary');
      reading.setAttribute('data-white-current', key);
      return card;
    };
    const loadCard = currentCard('load');
    const setsCard = currentCard('sets');
    const current = element(page, 'div', 'wt-detail-current');
    const loadCaption = loadCard.querySelector('.ui-caption');
    loadCaption.textContent = 'Текущий вес';
    loadCard.classList.add('wt-current-load');
    loadCard.append(loadCaption);

    const setsRow = element(page, 'div', 'wt-current-values');
    const setsColumn = element(page, 'div', 'wt-current-column');
    setsColumn.append(setsCard.querySelector('.ta-summary-reading'), setsCard.querySelector('.ui-caption'));
    setsColumn.querySelector('.ui-caption').textContent = 'Подх.';
    const separator = element(page, 'span', 'wt-current-times');
    separator.textContent = '×';
    separator.setAttribute('aria-hidden', 'true');
    const repsInput = content.querySelector('[data-value="reps"]');
    const repsColumn = element(page, 'div', 'wt-current-column');
    const repsValue = element(page, 'span', 'wt-current-reps-value');
    repsValue.setAttribute('data-white-reps', '');
    repsValue.textContent = repsInput.value;
    const repsCaption = element(page, 'span', 'ui-caption');
    repsCaption.textContent = 'Повт.';
    repsColumn.append(repsValue, repsCaption);
    setsRow.append(setsColumn, separator, repsColumn);
    setsCard.classList.add('wt-current-sets');
    setsCard.append(setsRow);
    current.append(loadCard, setsCard);
    content.insertBefore(current, photoLayers);

    const photo = photoLayers.querySelector('.ta-detail-hero');
    photo.src = 'white/assets/light-legpress.png';
    photoLayers.querySelector('.ta-detail-hero-back').hidden = true;
    photoLayers.prepend(equipmentArc(page));
    content.querySelector('.ta-sets-reps').classList.add('wt-sets-panel');
    content.querySelector('button[data-action="save"]').classList.add('wt-save-button');
    const musclePhoto = content.querySelector('.ta-muscles-photo');
    musclePhoto.src = 'white/assets/anatomy-front-thighs.png';
    musclePhoto.alt = 'Квадрицепсы — передняя поверхность бедра';
    return page;
  };

  document.addEventListener('input', function (event) {
    const field = event.target;
    if (!field.matches?.('[data-value="load"], [data-value="sets"], [data-value="reps"]')) return;
    const page = field.closest('.white-leg-detail');
    if (!page?.closest('.theme-white')) return;
    const current = page.querySelector(`[data-white-current="${field.dataset.value}"]`);
    const numericValue = field.value.trim();
    if (current && numericValue !== '' && Number.isFinite(Number(numericValue.replace(',', '.')))) current.textContent = numericValue;
    if (field.dataset.value === 'reps') {
      const value = page.querySelector('[data-white-reps]');
      if (value) value.textContent = field.value;
    }
    const parameters = page.querySelector('[data-white-detail-parameters]');
    if (parameters) {
      const value = key => page.querySelector(`[data-value="${key}"]`).value;
      parameters.textContent = `${value('load')} кг · ${value('sets')}×${value('reps')}`;
    }
  });
}());

window.ApprovedTrainingMarkup=function(theme){if(theme==="black")return ApprovedTrainingBlack();const template=document.createElement("template");template.innerHTML=legDetail();WhitePresentation.adapters[2](template.content.firstElementChild);return template.content.firstElementChild.outerHTML;};
