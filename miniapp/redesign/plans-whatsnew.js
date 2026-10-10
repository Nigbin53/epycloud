/* «Мои планы» (планы тренировок по дням недели) и окно «Обновление — что нового». */
(() => {
'use strict';
const DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const GROUPS = ['Грудь', 'Спина', 'Ноги', 'Руки', 'Плечи', 'Пресс'];
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const machines = () => (window.GymRedesignCatalog ? window.GymRedesignCatalog.snapshot().m : []) || [];
const word = (n) => n % 10 === 1 && n % 100 !== 11 ? 'упражнение' : (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) ? 'упражнения' : 'упражнений';
const PUSH_ARMS = /трицепс|француз|брусь/i;

/* готовые шаблоны: план = название + дни + группы мышц (берём упражнения из списка пользователя) */
const TEMPLATES = [
  { name: 'Фулбади 3 раза в неделю', hint: 'Всё тело за тренировку · Пн, Ср, Пт',
    plans: [{ name: 'Всё тело', days: [0, 2, 4], pick: (m) => m, perGroup: 1 }] },
  { name: 'Верх / низ', hint: '4 дня · Пн, Чт — верх · Вт, Пт — низ',
    plans: [{ name: 'Верх', days: [0, 3], groups: ['Грудь', 'Спина', 'Плечи', 'Руки'] },
            { name: 'Низ', days: [1, 4], groups: ['Ноги', 'Пресс'] }] },
  { name: 'Тяни / толкай / ноги', hint: '3 дня · Пн — толкай · Ср — тяни · Пт — ноги',
    plans: [{ name: 'Толкай', days: [0], test: (m) => m.g === 'Грудь' || m.g === 'Плечи' || (m.g === 'Руки' && PUSH_ARMS.test(m.n)) },
            { name: 'Тяни', days: [2], test: (m) => m.g === 'Спина' || (m.g === 'Руки' && !PUSH_ARMS.test(m.n)) },
            { name: 'Ноги', days: [4], groups: ['Ноги', 'Пресс'] }] },
];
function templateItems(p, list) {
  if (p.perGroup) return GROUPS.map((g) => list.find((m) => m.g === g)).filter(Boolean).map((m) => m.id);
  if (p.test) return list.filter(p.test).map((m) => m.id);
  return list.filter((m) => p.groups.includes(m.g)).map((m) => m.id);
}

let box = null, view = 'list', draft = null, picking = false;
function close() { if (!box) return; const b = box; box = null; b.classList.remove('on'); setTimeout(() => b.remove(), 220); }
function open() {
  if (box) box.remove();
  box = document.createElement('div'); box.className = 'rd-medit rd-plans'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-label', 'Мои планы');
  view = 'list'; draft = null; picking = false; draw();
  box.addEventListener('click', onClick); box.addEventListener('input', (e) => { if (e.target.id === 'rd-plan-name' && draft) draft.name = e.target.value; });
  document.body.append(box); requestAnimationFrame(() => box && box.classList.add('on'));
}
window.gymOpenPlans = open;

function draw() {
  if (!box) return;
  const all = machines(), plans = window.gymPlans();
  const name = (id) => { const m = all.find((x) => x.id === id); return m ? m.n : null; };
  let h = '<div class="rd-medit-panel rd-plans-panel">';
  if (view === 'list') {
    h += '<div class="rd-medit-head"><b>Мои планы</b><button type="button" class="rd-medit-x" data-p="close" aria-label="Закрыть">×</button></div>';
    h += plans.length ? '<div class="rd-plan-rows">' + plans.map((p) => '<button type="button" class="rd-plan-row" data-p="edit" data-id="' + p.id + '"><span><b>' + esc(p.name) + '</b><small>' + (p.days.length ? p.days.slice().sort().map((d) => DAYS[d]).join(' · ') : 'без дня недели') + ' · ' + p.items.length + ' ' + word(p.items.length) + '</small></span><i>›</i></button>').join('') + '</div>'
      : '<p class="rd-plan-empty">Плана пока нет. Составь свой или возьми готовый шаблон — в свой день наверху экрана «Тренировки» появится карточка с упражнениями по порядку.</p>';
    h += '<button type="button" class="rd-medit-save rd-plan-new" data-p="new">+ Новый план</button>';
    h += '<div class="rd-medit-lbl">Готовые шаблоны</div><div class="rd-plan-tpls">' + TEMPLATES.map((t, i) => '<button type="button" class="rd-plan-tpl" data-p="tpl" data-i="' + i + '"><b>' + t.name + '</b><small>' + t.hint + '</small></button>').join('') + '</div>';
  } else {
    const d = draft, taken = {};
    plans.forEach((p) => { if (p.id !== d.id) p.days.forEach((x) => { taken[x] = p.name; }); });
    h += '<div class="rd-medit-head"><button type="button" class="rd-plan-back" data-p="back" aria-label="Назад">‹</button><b>' + (d.id ? 'План' : 'Новый план') + '</b><button type="button" class="rd-medit-x" data-p="close" aria-label="Закрыть">×</button></div>';
    h += '<label class="rd-medit-lbl" for="rd-plan-name">Название</label><input id="rd-plan-name" class="rd-medit-input" maxlength="30" placeholder="Например, Ноги" autocomplete="off" value="' + esc(d.name) + '">';
    h += '<div class="rd-medit-lbl">Дни недели</div><div class="rd-plan-days" role="group" aria-label="Дни недели">' + DAYS.map((nm, i) => '<button type="button" class="rd-medit-chip rd-day-chip' + (d.days.includes(i) ? ' on' : '') + '" data-p="day" data-d="' + i + '" aria-pressed="' + d.days.includes(i) + '">' + nm + (taken[i] && !d.days.includes(i) ? '<small>' + esc(taken[i]) + '</small>' : '') + '</button>').join('') + '</div>';
    h += '<div class="rd-medit-lbl">Упражнения по порядку</div>';
    h += d.items.length ? '<ol class="rd-plan-items">' + d.items.map((id, i) => '<li><b>' + (i + 1) + '</b><span>' + esc(name(id) || '—') + '</span><button type="button" data-p="up" data-i="' + i + '" aria-label="Выше"' + (i ? '' : ' disabled') + '>↑</button><button type="button" data-p="down" data-i="' + i + '" aria-label="Ниже"' + (i < d.items.length - 1 ? '' : ' disabled') + '>↓</button><button type="button" data-p="rm" data-i="' + i + '" aria-label="Убрать">×</button></li>').join('') + '</ol>'
      : '<p class="rd-plan-empty">Добавь упражнения — они пойдут в этом порядке.</p>';
    if (picking) {
      const rest = all.filter((m) => !d.items.includes(m.id));
      h += '<div class="rd-plan-pick">' + GROUPS.map((g) => { const gm = rest.filter((m) => m.g === g); return gm.length ? '<div class="rd-plan-pick-g"><small>' + g + '</small>' + gm.map((m) => '<button type="button" class="rd-medit-chip" data-p="add" data-id="' + m.id + '">+ ' + esc(m.n) + '</button>').join('') + '</div>' : ''; }).join('') + (rest.length ? '' : '<p class="rd-plan-empty">Все упражнения уже в плане.</p>') + '</div>';
    } else h += '<button type="button" class="rd-plan-addbtn" data-p="pick">+ Добавить упражнение</button>';
    h += '<div class="rd-medit-err" role="alert"></div>';
    h += '<div class="rd-medit-actions">' + (d.id ? '<button type="button" class="rd-medit-cancel rd-plan-del" data-p="del">Удалить</button>' : '<button type="button" class="rd-medit-cancel" data-p="back">Отмена</button>') + '<button type="button" class="rd-medit-save" data-p="save">Сохранить</button></div>';
  }
  box.innerHTML = h + '</div>';
}
function onClick(e) {
  if (e.target === box) { close(); return; }
  const t = e.target.closest('[data-p]'); if (!t || t.disabled) return;
  const a = t.dataset.p, i = +t.dataset.i;
  if (a === 'close') close();
  else if (a === 'new') { view = 'edit'; picking = false; draft = { id: 0, name: '', days: [], items: [] }; draw(); }
  else if (a === 'edit') { const p = window.gymPlans().find((x) => x.id === +t.dataset.id); view = 'edit'; picking = false; draft = p; draw(); }
  else if (a === 'back') { view = 'list'; draft = null; draw(); }
  else if (a === 'day') { const d = +t.dataset.d; draft.days = draft.days.includes(d) ? draft.days.filter((x) => x !== d) : draft.days.concat(d); draw(); }
  else if (a === 'pick') { picking = true; draw(); }
  else if (a === 'add') { draft.items.push(+t.dataset.id); draw(); }
  else if (a === 'rm') { draft.items.splice(i, 1); draw(); }
  else if (a === 'up' && i > 0) { const x = draft.items.splice(i, 1)[0]; draft.items.splice(i - 1, 0, x); draw(); }
  else if (a === 'down') { const x = draft.items.splice(i, 1)[0]; draft.items.splice(i + 1, 0, x); draw(); }
  else if (a === 'save') {
    const err = box.querySelector('.rd-medit-err');
    if (String(draft.name || '').trim().length < 2) { err.textContent = 'Название — минимум 2 символа'; return; }
    if (!draft.items.length) { err.textContent = 'Добавь хотя бы одно упражнение'; return; }
    window.gymPlanSave(draft); view = 'list'; draft = null; draw();
    if (window.gymToast) window.gymToast('План сохранён');
  }
  else if (a === 'del') { const id = draft.id, nm = draft.name; window.gymPlanDelete(id); view = 'list'; draft = null; draw(); if (window.gymToast) window.gymToast('План удалён', '', '«' + nm + '»'); }
  else if (a === 'tpl') {
    const tp = TEMPLATES[i], list = machines();
    tp.plans.forEach((p) => window.gymPlanSave({ id: 0, name: p.name, days: p.days, items: templateItems(p, list) }));
    draw(); if (window.gymToast) window.gymToast('Шаблон добавлен', '', '«' + tp.name + '» — можно поправить под себя');
  }
}

/* ---------- список обновлений (сборки) + окно «Что нового» (один раз на последнюю сборку) ---------- */
const CHANGELOG = [
  { version: '2026-10-10.2', label: '10.10 · 2', date: '10 октября', title: 'Жесты и анимации', items: [
    'Свайп от левого края — назад',
    'Шторки закрываются свайпом вниз',
    'Удерживай + или − — вес меняется быстро',
    'Плотная вибрация при смене веса',
    'Свайп подхода влево — удалить',
    'Список обновлений внизу настроек',
  ] },
  { version: '2026-10-10', label: '10.10', date: '10 октября', title: 'Подходы и планы', items: [
    'Каждый подход записывается отдельно — кнопкой «Записать», рекорд считается сам',
    'Свободные веса, свой вес и упражнения на время, группа «Пресс»',
    'Планы тренировок по дням недели',
    'Карандаш у тренажёра: название, группа, фото, подходы и шаг веса',
    'Запись за прошедший день, прошедшие дни затемнены',
  ] },
  { version: '2026-10-08', label: '08.10', date: '8 октября', title: 'Удобство', items: [
    'EpyFit на рабочем столе: кнопка в чате, /home и пункт в настройках',
    'Тумблер «Неделя / Месяц», новое окно «Записать вес»',
    'Вода и избранное в питании без прыжков экрана',
    'Один фон на весь экран, правки знакомства и истории',
  ] },
  { version: '2026-10-07', label: '07.10', date: '7 октября', title: 'Первый запуск', items: [
    'Мини-приложение в Telegram с синхронизацией между устройствами',
    'Распознавание еды по фото, тексту и штрихкоду',
    'Экран «Тренировка» в новом дизайне, кольцо калорий',
  ] },
];
window.GymChangelog = CHANGELOG;
const WHATS_NEW = CHANGELOG[0];
window.gymChangelogHtml = function () {
  return '<section class="settsec rd-chlog"><h2>Обновления</h2><div class="settcard cm rd-chlog-card">' + CHANGELOG.map((c, i) =>
    '<details class="rd-chlog-item"' + (i === 0 ? ' open' : '') + '><summary><b>' + esc(c.title) + '</b><span>' + esc(c.date) + (i === 0 ? ' · новое' : '') + '</span></summary><ul>' + c.items.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul></details>').join('') + '</div></section>';
};
const SEEN_KEY = 'gym_whatsnew_seen';
function whatsNew() {
  let seen = null; try { seen = localStorage.getItem(SEEN_KEY); } catch (_) {}
  if (seen === WHATS_NEW.version) return;
  const st = window.GymRedesignCatalog && window.GymRedesignCatalog.snapshot();
  if (!st) return;
  if (!st.onboarded) { try { localStorage.setItem(SEEN_KEY, WHATS_NEW.version); } catch (_) {} return; } // новичку показывать нечего
  const w = document.createElement('div'); w.className = 'rd-medit rd-whatsnew'; w.setAttribute('role', 'dialog'); w.setAttribute('aria-modal', 'true'); w.setAttribute('aria-label', 'Обновление');
  w.innerHTML = '<div class="rd-medit-panel rd-wn-panel"><div class="rd-wn-badge">Обновление · ' + WHATS_NEW.date + '</div><b class="rd-wn-title">' + esc(WHATS_NEW.title) + '</b><ul class="rd-wn-list">' + WHATS_NEW.items.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul><button type="button" class="rd-medit-save rd-wn-ok">Понятно</button><small class="rd-wn-more">Все обновления — внизу настроек</small></div>';
  const done = () => { try { localStorage.setItem(SEEN_KEY, WHATS_NEW.version); } catch (_) {} w.classList.remove('on'); setTimeout(() => w.remove(), 220); };
  w.addEventListener('click', (e) => { if (e.target === w || e.target.closest('.rd-wn-ok')) done(); });
  document.body.append(w); requestAnimationFrame(() => w.classList.add('on'));
}
window.gymWhatsNew = whatsNew;
// показываем, когда приложение уже на экране и знакомство пройдено
let tries = 0;
(function wait() { if (++tries > 40) return; const ready = document.querySelector('#appcontent .rd-workout, #appcontent .rd-approved-nutrition, #appcontent .top'); const ob = document.querySelector('.obscr'); if (ob) { try { localStorage.setItem(SEEN_KEY, WHATS_NEW.version); } catch (_) {} return; } // идёт знакомство — новичку «что нового» не нужно
  if (ready) setTimeout(whatsNew, 500); else setTimeout(wait, 250); })();
})();
