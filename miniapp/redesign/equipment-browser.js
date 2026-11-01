/* Shared catalog → independent personal instances. No matching by display name. */
(() => {
  'use strict';
  const library = window.GymMachineLibrary;
  const base = new URL('../', document.currentScript.src);
  const totalEquipment = library.equipment().length, totalExercises = library.exercises().length;
  const groups = ['Все', 'Грудь', 'Спина', 'Ноги', 'Плечи', 'Руки', 'Пресс', 'Универсальное'];
  const esc = value => String(value == null ? '' : value).replace(/[&<>"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[char]));
  const snapshot = () => window.GymRedesignCatalog.snapshot();
  const theme = () => document.documentElement.dataset.redesignTheme === 'white' ? 'white' : 'black';
  let box = null, panel = null, tab = 'catalog', query = '', group = 'Все', chosen = null, draft = null, trigger = null;
  let screen = null, wasInert = false;
  function picture(equipment) {
    const key = window.GymEquipment?.ownKey(equipment.id, 'overview', theme());
    return key ? window.GymEquipment.resolve(key) : new URL('equipment/illustrations/' + equipment.slug + '-' + theme() + '.svg', base).href;
  }
  function source(machine, all) { return library.sourceFor(machine, all); }
  function close() {
    if (!box) return;
    const old = box; box = null; panel = null;
    old.remove();
    if (screen) screen.inert = wasInert;
    document.removeEventListener('keydown', keyboard, true);
    if (trigger?.isConnected) trigger.focus();
    else document.querySelector('.tg-add-machine')?.focus();
  }
  function keyboard(event) {
    if (!box) return;
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); if (draft || chosen) back(); else close(); return; }
    if (event.key !== 'Tab') return;
    const focusable = [...box.querySelectorAll('button:not(:disabled),input,select,[tabindex="0"]')].filter(el => el.getClientRects().length);
    if (!focusable.length) return;
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
  function open(startTab = 'catalog') {
    if (box) return;
    trigger = document.activeElement;
    window.gymClose();
    tab = startTab; query = ''; group = 'Все'; chosen = null; draft = null;
    box = document.createElement('div'); box.className = 'rd-medit eq-browser on';
    box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-label', 'Каталог и мои тренажёры');
    panel = document.createElement('div'); panel.className = 'rd-medit-panel eq-panel'; box.append(panel);
    box.addEventListener('click', onClick);
    box.addEventListener('input', event => {
      if (event.target.id === 'eq-search') { query = event.target.value; list(); }
      if (draft && event.target.dataset.eqField) draft[event.target.dataset.eqField] = event.target.value;
    });
    box.addEventListener('change', event => { if (draft && event.target.dataset.eqField) draft[event.target.dataset.eqField] = event.target.value; });
    screen = document.querySelector('.screen'); wasInert = !!screen?.inert; if (screen) screen.inert = true;
    document.body.append(box); document.addEventListener('keydown', keyboard, true);
    draw(); panel.querySelector('[data-e="close"]')?.focus();
  }
  function header(title, subtitle) {
    return '<div class="rd-medit-head eq-head">' + (chosen || draft ? '<button type="button" class="rd-plan-back" data-e="back" aria-label="Назад">‹</button>' : '')
      + '<div><h1>' + esc(title) + '</h1><p>' + esc(subtitle) + '</p></div><button type="button" class="rd-medit-x" data-e="close" aria-label="Закрыть каталог">×</button></div>';
  }
  function draw() {
    if (!panel) return;
    if (draft) { drawDraft(); return; }
    if (chosen) { drawEquipment(); return; }
    const state = snapshot();
    panel.innerHTML = header('Тренажёры', 'Выбери оборудование своего зала')
      + '<div class="eq-tabs" role="tablist" aria-label="Список тренажёров">'
      + '<button type="button" role="tab" data-e="tab" data-tab="catalog" aria-selected="' + (tab === 'catalog') + '">Каталог <span>' + totalEquipment + '</span></button>'
      + '<button type="button" role="tab" data-e="tab" data-tab="mine" aria-selected="' + (tab === 'mine') + '">Мои <span>' + state.m.length + '</span></button></div>'
      + '<label class="eq-search"><span class="eq-sr">Поиск тренажёров и упражнений</span><input id="eq-search" class="rd-medit-input" type="search" autocomplete="off" placeholder="Название или упражнение" value="' + esc(query) + '"></label>'
      + '<div class="eq-filters" role="group" aria-label="Группа мышц">' + groups.map(g => '<button type="button" class="rd-medit-chip' + (g === group ? ' on' : '') + '" data-e="filter" data-group="' + g + '" aria-pressed="' + (g === group) + '">' + g + '</button>').join('') + '</div>'
      + '<button type="button" class="eq-custom-short" data-e="custom">+ Создать свой тренажёр</button>'
      + '<div class="eq-results" aria-live="polite"></div>'
      + '<div class="eq-bottom"><button type="button" class="rd-medit-save" data-e="custom">+ Создать свой тренажёр</button></div>';
    list();
  }
  function list() {
    const host = panel?.querySelector('.eq-results'); if (!host) return;
    const state = snapshot();
    if (tab === 'catalog') {
      const matches = library.search(query, group);
      host.innerHTML = '<p class="eq-count">' + matches.length + ' из ' + totalEquipment + ' типов оборудования · ' + totalExercises + ' упражнений</p>'
        + matches.map(equipment => {
          const count = state.m.filter(machine => library.equipmentFor(machine)?.id === equipment.id).length;
          return '<button type="button" class="eq-catalog-row" data-e="equipment" data-id="' + equipment.id + '">'
            + '<img src="' + esc(picture(equipment)) + '" alt="" loading="lazy"><span class="eq-row-copy"><small>' + esc(equipment.group) + '</small><b>' + esc(equipment.name) + '</b><span>' + equipment.exerciseIds.length + ' ' + (equipment.exerciseIds.length === 1 ? 'упражнение' : equipment.exerciseIds.length < 5 ? 'упражнения' : 'упражнений') + (count ? ' · в моих: ' + count : '') + '</span></span><span class="eq-chevron" aria-hidden="true">›</span></button>';
        }).join('')
        + (!matches.length ? '<div class="eq-empty"><b>Ничего не найдено</b><p>Попробуй другое название или создай свой тренажёр.</p></div>' : '');
    } else {
      const words = library.normalize(query).split(' ').filter(Boolean);
      const matches = state.m.filter(machine => {
        const equipment = library.equipmentFor(machine);
        if (group !== 'Все' && machine.g !== group && !(group === 'Универсальное' && equipment?.group === group)) return false;
        const text = library.normalize([machine.n, machine.g, machine.location, equipment?.name, ...(equipment?.aliases || [])].join(' '));
        return words.every(word => text.includes(word));
      });
      host.innerHTML = '<p class="eq-count">В моём списке: ' + matches.length + '</p>' + matches.map(machine => {
        const equipment = library.equipmentFor(machine);
        const src = machine.cover || machine.img || (equipment ? picture(equipment) : window.GymEquipment?.placeholder(theme()));
        return '<button type="button" class="eq-catalog-row" data-e="personal" data-id="' + machine.id + '"><img src="' + esc(src || '') + '" alt="" loading="lazy"><span class="eq-row-copy"><small>' + esc(machine.g) + '</small><b>' + esc(machine.n) + '</b><span>' + esc(source(machine, state.m)) + '</span></span><span class="eq-chevron" aria-hidden="true">›</span></button>';
      }).join('') + (!matches.length ? '<div class="eq-empty"><b>Здесь пока пусто</b><p>Добавь оборудование из каталога или создай свою запись.</p></div>' : '');
    }
  }
  function drawEquipment() {
    const equipment = library.getEquipment(chosen), state = snapshot();
    panel.innerHTML = header(equipment.name, equipment.group)
      + '<div class="eq-detail-image"><img src="' + esc(picture(equipment)) + '" alt="' + esc(equipment.name) + '"></div>'
      + '<p class="eq-load-note">Изображение показывает тип оборудования. Своё фото можно добавить в карточке.</p>'
      + '<div class="eq-muscles">' + equipment.muscles.map(m => '<span>' + esc(m) + '</span>').join('') + '</div>'
      + '<h2 class="eq-subhead">Выбери упражнение</h2><p class="eq-load-note">У каждого упражнения свои вес, настройки и история.</p>'
      + '<div class="eq-exercises">' + library.exercisesFor(chosen).map(exercise => {
        const instances = library.instances(state, exercise.id);
        return '<section class="eq-exercise"><h3>' + esc(exercise.name) + '</h3><p>' + esc(exercise.muscles.join(' · ')) + '</p>'
          + (instances.length ? instances.map(machine => '<button type="button" class="eq-existing" data-e="personal" data-id="' + machine.id + '"><span>Открыть: ' + esc(machine.n) + (machine.location ? ' · ' + esc(machine.location) : '') + '</span><span aria-hidden="true">›</span></button>').join('') : '')
          + '<button type="button" class="' + (instances.length ? 'eq-another' : 'rd-medit-save') + '" data-e="prepare" data-id="' + exercise.id + '" data-another="' + !!instances.length + '">' + (instances.length ? '+ Добавить ещё один' : 'Добавить в мои') + '</button></section>';
      }).join('') + '</div>';
  }
  function drawDraft() {
    const exercise = library.getExercise(draft.id), state = snapshot();
    const sameName = state.m.filter(machine => library.normalize(machine.n) === library.normalize(exercise.name));
    panel.innerHTML = header('Добавить в мои', exercise.name)
      + '<label class="rd-medit-lbl" for="eq-name">Название у меня в зале</label><input id="eq-name" class="rd-medit-input" data-eq-field="name" maxlength="40" value="' + esc(draft.name) + '">'
      + '<label class="rd-medit-lbl" for="eq-location">Где стоит / пометка</label><input id="eq-location" class="rd-medit-input" data-eq-field="location" maxlength="40" placeholder="Например, зал на первом этаже" value="' + esc(draft.location) + '">'
      + (sameName.length ? '<p class="eq-duplicate-note">В твоём списке уже есть такое название. Будет создана отдельная запись; прежние настройки и история сохранятся.</p>' : '')
      + (exercise.type !== 'time' ? '<label class="rd-medit-lbl" for="eq-mode">Как учитывать вес</label><select id="eq-mode" class="rd-medit-input" data-eq-field="loadMode">' + Object.entries(library.modes).filter(([key]) => exercise.type === 'body' ? key === 'additional' : key !== 'none').map(([key, mode]) => '<option value="' + key + '"' + (draft.loadMode === key ? ' selected' : '') + '>' + mode.name + '</option>').join('') + '</select>'
        + '<p class="eq-load-note eq-mode-hint">' + esc(library.modes[draft.loadMode].hint) + '</p>'
        + '<div class="eq-fields"><label><span class="rd-medit-lbl">Начальное значение, кг</span><input class="rd-medit-input" data-eq-field="weight" type="text" inputmode="decimal" placeholder="Укажи свой вес" value="' + esc(draft.weight) + '"></label><label><span class="rd-medit-lbl">Шаг веса, кг</span><select class="rd-medit-input" data-eq-field="step">' + [1,2,2.5,5,10].map(step => '<option value="' + step + '"' + (Number(draft.step) === step ? ' selected' : '') + '>' + String(step).replace('.', ',') + '</option>').join('') + '</select></label></div>' : '<p class="eq-load-note">Результат этого упражнения записывается в секундах.</p>')
      + '<p class="eq-error" role="alert"></p><div class="eq-draft-actions"><button type="button" class="rd-medit-save" data-e="confirm">Добавить отдельную запись</button><button type="button" class="rd-medit-cancel" data-e="back">Назад</button></div>';
  }
  function back() { if (draft) draft = null; else chosen = null; draw(); panel.scrollTop = 0; }
  function onClick(event) {
    if (event.target === box) { close(); return; }
    const button = event.target.closest('[data-e]'); if (!button || button.disabled) return;
    const action = button.dataset.e;
    if (action === 'close') close();
    else if (action === 'back') back();
    else if (action === 'tab') { tab = button.dataset.tab; chosen = null; draft = null; draw(); }
    else if (action === 'filter') {
      group = button.dataset.group;
      panel.querySelectorAll('[data-e="filter"]').forEach(el => { el.classList.toggle('on', el.dataset.group === group); el.setAttribute('aria-pressed', String(el.dataset.group === group)); });
      list();
    }
    else if (action === 'equipment') { chosen = button.dataset.id; draw(); panel.scrollTop = 0; }
    else if (action === 'custom') { close(); window.gymOpenCustomMachine(); }
    else if (action === 'personal') { const id = Number(button.dataset.id); close(); window.gymOpenPersonalMachine(id); }
    else if (action === 'prepare') {
      const exercise = library.getExercise(button.dataset.id);
      draft = {id:exercise.id, another:button.dataset.another === 'true', name:exercise.name, location:'', weight:'', step:exercise.step, loadMode:exercise.loadMode};
      draw(); panel.scrollTop = 0;
    }
    else if (action === 'confirm') {
      const weight = String(draft.weight).trim().replace(',', '.');
      const error = panel.querySelector('.eq-error');
      if (String(draft.name).trim().length < 2) { error.textContent = 'Название — минимум 2 символа.'; return; }
      if (weight && (!/^\d+(?:\.\d{1,2})?$/.test(weight) || Number(weight) > 1000)) { error.textContent = 'Введи вес от 0 до 1 000 кг.'; return; }
      const result = window.gymLibraryAdd(draft.id, {...draft, weight:Number(weight) || 0});
      if (!result) { error.textContent = 'Не удалось добавить тренажёр.'; return; }
      close();
      window.gymToast(result.added ? 'Добавлено в мои тренажёры' : 'Уже в моих тренажёрах', '', '«' + result.machine.n + '»');
    }
  }
  document.addEventListener('change', event => {
    if (box && draft && event.target.id === 'eq-mode') panel.querySelector('.eq-mode-hint').textContent = library.modes[draft.loadMode].hint;
  });
  document.addEventListener('click', event => {
    const add = event.target.closest('[data-a="open"][data-v="0"],[data-library-open]');
    if (!add) return;
    event.preventDefault(); event.stopPropagation(); open();
  }, true);
  window.gymOpenEquipmentLibrary = open;
})();
