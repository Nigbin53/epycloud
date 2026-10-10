/* Экран «Тренировка» в утверждённом виде (экран 01 Карты экранов, Black и White)
   поверх настоящих данных и действий приложения. Вся логика остаётся в движке:
   кнопки вызывают его действия (open, done, filter, day) и mfav (избранное). */
(() => {
'use strict';
const GROUPS = ['Грудь', 'Спина', 'Ноги', 'Руки', 'Плечи', 'Пресс'];
const TABS = GROUPS.concat(['Избранное']);
const DAY_NAMES = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const DAY_FULL = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];
let pickerOpen = false;
let scheduled = false;

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const fmt = (n) => String(Math.round(Number(n) * 100) / 100).replace('.', ',');
const text = (value, role, cls = '') => `<div class="ui-${role} ${cls}" data-type-role="${role}">${value}</div>`;
const svg = (size, body, fill = 'none', sw = 1.6) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${fill}" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
const star = (on, size) => svg(size, '<path d="M12 3.6l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.9 6.8 19.7l1-5.8L3.5 9.8l5.9-.8z"/>', on ? 'currentColor' : 'none');
const check = (size) => svg(size, '<path d="M5 12.5l4.5 4.5L19 7.5"/>', 'none', 2);
const plus = (size) => svg(size, '<path d="M12 5v14M5 12h14"/>');
const dayKey = (t) => { const d = new Date(t); return d.getFullYear() + '-' + d.getMonth() + '-' + d.getDate(); };

function week() {
  const d = new Date(); d.setHours(12, 0, 0, 0);
  const monday = d.getTime() - ((d.getDay() + 6) % 7) * 86400000;
  return Array.from({ length: 7 }, (_, i) => new Date(monday + i * 86400000));
}

function photo(m, theme) {
  // своя заставка (широкая) или, если её нет, своё квадратное фото
  const mine = m.cover || m.img;
  if (mine) return `<img class="ui-photo ta-exercise-photo" data-equipment-personal="true" src="${esc(mine)}" alt="">`;
  const store = window.GymEquipment;
  const own = store && store.ownKey ? store.ownKey(m.n, 'overview', theme) : null;
  const src = own ? store.resolve(own) : (store && store.placeholder ? store.placeholder(theme) : '');
  return `<img class="ui-photo ta-exercise-photo rd-equipment" data-equipment-machine="${m.g === 'Ноги' ? 'leg-press' : 'lat-pulldown'}" data-equipment-name="${esc(m.n)}" src="${esc(src)}" alt="">`;
}

function card(m, index, theme) {
  const white = theme === 'white';
  const small = white ? 12 : 18;
  const type = ['free', 'body', 'time'].includes(m.type) ? m.type : 'machine';
  const metrics = `<div class="ta-metrics"><div>${text(m.s, 'compact-value')}${text('ПОДХОДА', 'micro', 'ui-muted')}</div><div>${text(m.r, 'compact-value')}${text(type === 'time' ? 'СЕКУНД' : 'ПОВТОРОВ', 'micro', 'ui-muted')}</div></div>`;
  // рабочий вес появляется только после первой записи; у «своего веса» — доп. вес, у «на время» веса нет
  const loadValue = type === 'body' ? (m.w > 0 ? '+' + fmt(m.w) : 'СВОЙ ВЕС') : fmt(m.w);
  const loadUnit = type === 'body' ? (m.w > 0 ? 'КГ' : '') : 'КГ';
  const noLoad = !m.used || type === 'time';
  const load = `<div class="${white ? 'wt' : 'bt'}-load-summary${noLoad ? ' tg-noload' : ''}${type === 'body' && !(m.w > 0) ? ' tg-bodyweight' : ''}">${text(noLoad ? '—' : loadValue, 'compact-value')}${text(loadUnit, 'micro', 'ui-muted')}</div>`;
  const tip = null; // подсказки «прибавить / остаться» убраны по просьбе пользователя
  const hint = tip ? `<button type="button" class="tg-hint tg-hint-${tip.kind}" data-a="open" data-v="${m.id}">${tip.kind === 'up' ? '↑ ' : tip.kind === 'down' ? '↓ ' : '• '}${esc(tip.text)}</button>` : '';
  const frame = `<div class="${white ? 'wt-exercise-image' : 'bt-exercise-photo-frame'}">${photo(m, theme)}</div>`;
  const record = white
    ? `<button type="button" class="ui-button ui-button-outline wt-record-button" data-a="open" data-v="${m.id}" aria-label="Записать: ${esc(m.n)}"><span class="button-label">ЗАПИСАТЬ</span></button>`
    : `<button type="button" class="ui-button ui-button-outline" data-a="open" data-v="${m.id}" aria-label="Записать: ${esc(m.n)}"><span class="button-label">ЗАПИСАТЬ</span><span class="ui-button-icon">${UI.icon('arrow', 19)}</span></button>`;
  const done = `<button type="button" class="tg-done${m.d ? ' on' : ''}" data-a="done" data-v="${m.id}" aria-pressed="${!!m.d}" aria-label="${m.d ? 'Снять отметку' : 'Отметить выполненным'}">${check(small)}</button>`;
  const fav = `<button type="button" class="tg-star${m.favorite ? ' on' : ''}" data-a="mfav" data-v="${m.id}" aria-pressed="${!!m.favorite}" aria-label="${m.favorite ? 'Убрать из избранного' : 'Добавить в избранное'}">${star(!!m.favorite, small)}</button>`;
  return `<section class="ta-exercise${m.d ? ' tg-is-done' : ''}" data-${white ? 'white' : 'dark'}-ordinal="${String(index + 1).padStart(2, '0')}">`
    + `<div class="ta-exercise-heading"><div class="ta-exercise-copy">${text(esc(m.g), 'caption', 'ui-muted ta-category')}${text(esc(m.n), 'feature-title', 'ta-exercise-title')}</div>${metrics}</div>`
    + load + hint + frame + `<div class="ta-record tg-record-host">${record}${done}${fav}</div></section>`;
}

function addBlock(machines, favs) {
  let html = favs.length
    ? `<button type="button" class="tg-add tg-add-compact" data-tg-add aria-expanded="${pickerOpen}">${plus(16)}<span>Добавить в избранное</span></button>`
    : `<button type="button" class="tg-add tg-add-empty" data-tg-add aria-expanded="${pickerOpen}"><span class="tg-add-icon">${star(false, 26)}</span><b>Добавить в избранное</b><span class="tg-add-hint">Выбери тренажёры, с которыми работаешь чаще всего — они будут встречать тебя здесь.</span></button>`;
  if (pickerOpen) {
    const rest = machines.filter((m) => !m.favorite);
    html += `<div class="tg-picker" role="list">${rest.length
      ? rest.map((m) => `<button type="button" role="listitem" class="tg-pick" data-a="mfav" data-v="${m.id}"><span class="tg-pick-copy"><small>${esc(m.g)}</small><span>${esc(m.n)}</span></span><span class="tg-pick-star">${star(false, 16)}</span></button>`).join('')
      : '<div class="tg-pick-none">Все тренажёры уже в избранном</div>'}</div>`;
  }
  return `<div class="tg-add-block">${html}</div>`;
}

// карточка плана дня: «Сегодня: Ноги · 5 упражнений», «2 из 5», Начать, × (пропустить только сегодня)
function planCard(plan, items, o) {
  if (!plan) return `<button type="button" class="tg-plan-mini" data-plan="manage">${o.anyPlans ? 'День отдыха · Мои планы ›' : '+ Составить план тренировок'}</button>`;
  if (o.skipped) return `<button type="button" class="tg-plan-mini" data-plan="unskip">Сегодня по плану: ${esc(plan.name)} ›</button>`;
  const done = items.filter((m) => m.d).length;
  const word = (n) => n % 10 === 1 && n % 100 !== 11 ? 'упражнение' : (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) ? 'упражнения' : 'упражнений';
  const when = o.past ? DAY_FULL[o.selected] : 'Сегодня';
  const pct = items.length ? Math.round(done / items.length * 100) : 0;
  return `<section class="tg-plan${o.filter === 'План' ? ' is-open' : ''}${done && done === items.length ? ' is-done' : ''}" aria-label="План на день">`
    + `<div class="tg-plan-top"><div class="tg-plan-copy"><small>${when}${o.past ? '' : ' по плану'}</small><b>${esc(plan.name)} · ${items.length} ${word(items.length)}</b></div>`
    + (o.past ? '' : `<button type="button" class="tg-plan-x" data-plan="skip" aria-label="Пропустить план на сегодня">×</button>`) + `</div>`
    + `<div class="tg-plan-bar" aria-hidden="true"><i style="width:${pct}%"></i></div>`
    + `<div class="tg-plan-bottom"><span>${done} из ${items.length}${done && done === items.length ? ' · готово 💪' : ''}</span>`
    + `<span class="tg-plan-acts"><button type="button" class="tg-plan-link" data-plan="manage">Планы</button>`
    + (o.filter === 'План' ? '' : `<button type="button" class="tg-plan-start" data-plan="start">${done ? 'Продолжить' : 'Начать'}</button>`) + `</span></div></section>`;
}

function build(state, theme) {
  const hist = state.history || [];
  const today = (new Date().getDay() + 6) % 7;
  const selected = Number.isInteger(state.day) && state.day <= today ? state.day : today;
  // прошедший день: «выполнено» = есть запись в истории за этот день
  const past = selected < today;
  const selKey = dayKey(week()[selected]);
  const machines = (state.m || []).map((m) => Object.assign({}, m, {
    used: !!(m.used || (m.h && m.h.length) || hist.some((e) => e.mid === m.id)),
    d: past ? (hist.some((e) => e.mid === m.id && dayKey(e.t) === selKey) ? 1 : 0) : m.d,
  }));
  const plan = typeof window.gymPlanFor === 'function' ? window.gymPlanFor(selected) : null;
  const skipped = !!plan && !past && state.planSkip === dayKey(Date.now());
  const planOn = !!plan && !skipped;
  const tabsAll = (planOn ? ['План'] : []).concat(TABS);
  const filter = tabsAll.includes(state.filter) ? state.filter : 'Избранное';
  const favs = machines.filter((m) => m.favorite);
  const doneCount = machines.filter((m) => m.d).length;
  const total = machines.length;
  const word = total % 10 === 1 && total % 100 !== 11 ? 'упражнения' : 'упражнений';
  const calendar = `<div class="ui-calendar calendar">${week().map((d, i) => `<button type="button" class="ui-day day ${selected === i ? 'selected' : ''}${i < today ? ' tg-past' : ''}${i > today ? ' tg-future' : ''}" data-a="day"${i > today ? ' aria-disabled="true"' : ''} data-v="${i}" aria-pressed="${selected === i}" aria-label="${DAY_NAMES[i]} ${d.getDate()}"${i === today ? ' aria-current="date"' : ''}><small>${DAY_NAMES[i]}</small><strong>${d.getDate()}</strong></button>`).join('')}</div>`;
  const tabs = `<div class="ui-tabs ta-filters tg-filters" role="tablist" aria-label="Группа упражнений">${tabsAll.map((t) => `<button type="button" role="tab" class="${t === filter ? 'selected' : ''}" aria-selected="${t === filter}" data-a="filter" data-v="${t}">${t === 'Избранное' ? star(true, 11) : ''}<span>${t}</span></button>`).join('')}</div>`;
  let list = '';
  const planItems = plan ? plan.items.map((id) => machines.find((m) => m.id === id)).filter(Boolean) : [];
  if (filter === 'План') {
    list = planItems.length ? planItems.map((m, i) => card(m, i, theme)).join('')
      : '<div class="tg-empty"><b>В плане пока нет упражнений</b><span>Открой «Мои планы» и добавь упражнения.</span></div>';
  } else if (filter === 'Избранное') {
    list = addBlock(machines, favs) + favs.map((m, i) => card(m, i, theme)).join('');
  } else {
    const group = machines.filter((m) => m.g === filter);
    list = group.length ? group.map((m, i) => card(m, i, theme)).join('')
      : '<div class="tg-empty"><b>Здесь пока нет тренажёров</b><span>Добавь тренажёр из каталога или свой.</span></div>';
  }
  list += `<button type="button" class="tg-add tg-add-compact tg-add-machine" data-a="open" data-v="0">${plus(16)}<span>Добавить тренажёр</span></button>`;
  const pageClass = theme === 'white' ? 'white-page white-training-overview' : 'black-training-layout black-training-cards';
  return `<div class="rd-approved-training rd-workout" data-tg-filter="${esc(filter)}"><div class="training-overview"><div class="ui-page ta-page ${pageClass}"><div class="ta-overview-content">`
    // как на утверждённом экране: в White — «Сегодня» и счётчик, в Black — только счётчик (надпись и полоса убраны в r9)
    + `<div class="ta-today-line">${past ? text(DAY_FULL[selected], 'micro', 'tg-day-label') : theme === 'white' ? text('Сегодня', 'micro') : ''}${text(`${doneCount} из ${total} ${word}`, 'caption', 'ui-muted')}</div>`
    + calendar + planCard(plan, planItems, { past, skipped, filter, selected, anyPlans: !!(state.plans && state.plans.length) }) + tabs + list + '</div></div></div></div>';
}

function apply() {
  scheduled = false;
  const content = document.getElementById('appcontent');
  const catalog = window.GymRedesignCatalog;
  if (!content || !catalog || !content.querySelector('.mlist')) return;
  const theme = document.documentElement.dataset.redesignTheme === 'white' ? 'white' : 'black';
  const state = catalog.snapshot();
  const header = content.querySelector('.top');
  const scrollTabs = content.querySelector('.tg-filters');
  const keepScroll = scrollTabs ? scrollTabs.scrollLeft : null;
  const holder = document.createElement('div');
  holder.innerHTML = build(state, theme);
  content.replaceChildren(...(header ? [header] : []), holder.firstElementChild);
  const tabs = content.querySelector('.tg-filters');
  if (tabs) {
    const active = tabs.querySelector('.selected');
    if (keepScroll != null) tabs.scrollLeft = keepScroll;
    else if (active) tabs.scrollLeft = Math.max(0, active.offsetLeft - 16);
  }
  window.dispatchEvent(new Event('gym-equipment:change')); // подтянуть свои фото тренажёров
}
function schedule() { if (scheduled) return; scheduled = true; requestAnimationFrame(apply); }

document.addEventListener('click', (event) => {
  const pb = event.target.closest('[data-plan]');
  if (pb && pb.closest('.rd-workout')) {
    const act = pb.dataset.plan;
    if (act === 'skip') { window.gymPlanSkip(true); if (window.gymToast) window.gymToast('План пропущен', () => window.gymPlanSkip(false)); }
    else if (act === 'unskip') window.gymPlanSkip(false);
    else if (act === 'start') window.gymPlanStart();
    else if (act === 'manage' && window.gymOpenPlans) window.gymOpenPlans();
    return;
  }
  const add = event.target.closest('[data-tg-add]');
  if (!add || !add.closest('.rd-workout')) return;
  pickerOpen = !pickerOpen;
  const content = document.getElementById('appcontent');
  // перерисовка без движка: добавим фиктивный список, чтобы apply() сработал
  if (content && !content.querySelector('.mlist')) { const marker = document.createElement('div'); marker.className = 'mlist'; marker.hidden = true; content.append(marker); }
  apply();
});

const target = document.getElementById('appcontent');
if (target) new MutationObserver(() => { if (target.querySelector('.mlist')) schedule(); }).observe(target, { childList: true });
window.addEventListener('gym-redesign:view', schedule);
schedule();
})();
