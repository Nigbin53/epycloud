(() => {
  'use strict';

  const init = () => {
    const root = document.querySelector('#fit-kit');
    if (!root) return;

    const find = (selector) => root.querySelector(selector);
    const all = (selector) => Array.from(root.querySelectorAll(selector));
    const number = (value, fallback = 0) => {
      const parsed = Number.parseFloat(String(value ?? '').replace(',', '.'));
      return Number.isFinite(parsed) ? parsed : fallback;
    };
    const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));

    let toastTimeout;
    let restInterval;
    let restRunning = false;
    let restPaused = false;
    let saving = false;
    const restDisplay = find('#rest-value');
    const restButton = find('#rest-start');

    const parseDuration = (value) => {
      const text = String(value ?? '').trim();
      if (text.includes(':')) {
        const [minutes, seconds] = text.split(':');
        return Math.max(0, number(minutes) * 60 + number(seconds));
      }
      return Math.max(0, number(text, 90));
    };
    const selectedRest = find('[data-segment-group="rest"] [aria-pressed="true"], [data-segment-group="rest"] .is-active');
    let restDuration = parseDuration(selectedRest?.dataset.value ?? restDisplay?.textContent ?? 90);
    let restRemaining = restDuration;

    const label = (button, text) => {
      if (!button) return;
      const target = button.querySelector('.action-label');
      if (target) target.textContent = text;
      else if (!button.querySelector('[data-icon]')) button.textContent = text;
    };

    const hideToast = () => {
      window.clearTimeout(toastTimeout);
      const toast = find('#toast');
      if (!toast) return;
      toast.classList.remove('is-visible');
      toast.hidden = true;
    };

    const showToast = (message) => {
      const toast = find('#toast');
      if (!toast) return;
      window.clearTimeout(toastTimeout);
      const content = toast.querySelector('[data-toast-message], .toast-message, .toast-text');
      if (content) content.textContent = message;
      else toast.textContent = message;
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      toast.setAttribute('aria-atomic', 'true');
      toast.hidden = false;
      toast.classList.add('is-visible');
      toastTimeout = window.setTimeout(hideToast, 3000);
    };

    const setTab = (name) => {
      const target = find(`#panel-${name}`);
      if (!target) return;
      all('[data-tab]').forEach((tab) => {
        const selected = tab.dataset.tab === name;
        tab.setAttribute('aria-selected', String(selected));
        tab.tabIndex = selected ? 0 : -1;
        tab.classList.toggle('active', selected);
        tab.classList.toggle('is-active', selected);
      });
      ['components', 'screens', 'tokens'].forEach((panelName) => {
        const panel = find(`#panel-${panelName}`);
        if (panel) panel.hidden = panelName !== name;
      });
    };

    const renderRest = () => {
      if (restDisplay) {
        const minutes = Math.floor(restRemaining / 60);
        const seconds = Math.floor(restRemaining % 60);
        restDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
      }
      if (restButton) {
        restButton.setAttribute('aria-pressed', String(restRunning));
        restButton.classList.toggle('is-active', restRunning);
        label(restButton, restRunning ? 'Пауза' : restPaused ? 'Продолжить' : 'Начать отдых');
      }
    };

    const stopRest = () => {
      window.clearInterval(restInterval);
      restInterval = undefined;
      restRunning = false;
    };

    const resetRest = (duration) => {
      stopRest();
      restDuration = Math.max(1, Math.floor(duration));
      restRemaining = restDuration;
      restPaused = false;
      renderRest();
    };

    const toggleRest = () => {
      if (restRunning) {
        stopRest();
        restPaused = true;
        renderRest();
        return;
      }
      if (restRemaining <= 0) restRemaining = restDuration;
      restRunning = true;
      restPaused = false;
      renderRest();
      let nextTick = Date.now() + 1000;
      restInterval = window.setInterval(() => {
        const now = Date.now();
        if (now < nextTick) return;
        const elapsed = Math.floor((now - nextTick) / 1000) + 1;
        nextTick += elapsed * 1000;
        restRemaining = Math.max(0, restRemaining - elapsed);
        if (restRemaining === 0) {
          stopRest();
          restPaused = false;
          showToast('Отдых завершён. Можно начинать следующий подход.');
        }
        renderRest();
      }, 250);
    };

    const setSegment = (button) => {
      const group = button.closest('[data-segment-group]');
      if (!group) return;
      group.querySelectorAll('[data-segment]').forEach((item) => {
        const selected = item === button;
        item.setAttribute('aria-pressed', String(selected));
        item.classList.toggle('is-active', selected);
      });
      if (group.dataset.segmentGroup === 'rest') resetRest(parseDuration(button.dataset.value));
    };

    const defaults = {
      'set-weight': { value: 60, step: 2.5, min: 0, max: 300 },
      'set-reps': { value: 12, step: 1, min: 1, max: 100 },
    };

    const updateStepper = (input) => {
      if (!input) return;
      const options = defaults[input.id] ?? { step: 1, min: 0, max: Infinity };
      const value = number(input.value, options.value ?? 0);
      const minimum = input.min === '' ? options.min : number(input.min, options.min);
      const maximum = input.max === '' ? options.max : number(input.max, options.max);
      input.setAttribute('aria-valuenow', String(value));
      input.setAttribute('aria-valuemin', String(minimum));
      if (Number.isFinite(maximum)) input.setAttribute('aria-valuemax', String(maximum));
      all('[data-stepper]').filter((button) => button.dataset.target === input.id).forEach((button) => {
        const delta = number(button.dataset.delta);
        button.disabled = delta < 0 ? value <= minimum : value >= maximum;
      });
    };

    const step = (button) => {
      const input = document.getElementById(button.dataset.target ?? '');
      if (!input || !root.contains(input) || input.disabled || input.readOnly) return;
      const options = defaults[input.id] ?? { value: 0, step: 1, min: 0, max: Infinity };
      const current = number(input.value, options.value);
      const increment = input.step === '' || input.step === 'any' ? options.step : number(input.step, options.step);
      const minimum = input.min === '' ? options.min : number(input.min, options.min);
      const maximum = input.max === '' ? options.max : number(input.max, options.max);
      const delta = number(button.dataset.delta);
      input.value = String(Number(clamp(current + delta * increment, minimum, maximum).toFixed(5)));
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    };

    const updateEffort = () => {
      const input = find('#effort-range');
      if (!input) return;
      const value = number(input.value, 7);
      const output = find('#effort-value');
      const note = find('#effort-note');
      if (output) output.textContent = `${value} / 10`;
      if (note) note.textContent = value <= 3 ? 'Большой запас сил' : value <= 5 ? 'Комфортный темп' : value <= 7 ? '3 повтора в запасе' : value <= 9 ? '1–2 повтора в запасе' : 'Без запаса';
      input.setAttribute('aria-valuetext', `${value} из 10`);
      const percent = ((value - number(input.min, 1)) / (number(input.max, 10) - number(input.min, 1))) * 100;
      input.style.setProperty('--range-progress', `${clamp(percent, 0, 100)}%`);
    };

    const validateWeight = () => {
      const input = find('#weight-validate');
      const error = find('#weight-error');
      if (!input || !error) return;
      const invalid = input.value !== '' && !input.validity.valid;
      input.setAttribute('aria-invalid', String(invalid));
      error.hidden = !invalid;
      const field = input.closest('.text-field, .field, .input-field, .field-control');
      if (field) {
        field.classList.toggle('is-error', invalid);
        field.classList.toggle('field-error', invalid);
      }
    };

    const updateSession = () => {
      const count = find('#sets-count');
      if (count) count.textContent = String(number(count.textContent) + 1);
      const progress = find('#session-progress');
      const percent = find('#session-percent');
      const fill = progress?.querySelector('span');
      const previous = number(progress?.getAttribute('aria-valuenow'), number(percent?.textContent, number(fill?.style.width, 78)));
      const totalSets = number(count?.dataset.total, 16);
      const next = count && totalSets > 0 ? Math.min(100, Math.round(number(count.textContent) / totalSets * 100)) : Math.min(100, previous + 7);
      if (progress) {
        if (fill) fill.style.width = `${next}%`;
        progress.setAttribute('aria-valuenow', String(next));
        progress.setAttribute('aria-valuemin', '0');
        progress.setAttribute('aria-valuemax', '100');
        const progressRegion = progress.closest('[role="progressbar"]');
        if (progressRegion) progressRegion.setAttribute('aria-valuenow', String(next));
      }
      if (percent) percent.textContent = `${next}%`;
    };

    const saveSet = (button) => {
      if (saving || button.disabled) return;
      const inputs = ['#set-weight', '#set-reps'].map(find).filter(Boolean);
      const invalid = inputs.find((input) => !input.validity.valid || input.value === '');
      if (invalid) {
        invalid.reportValidity();
        invalid.focus();
        showToast('Проверьте вес и количество повторений.');
        return;
      }
      saving = true;
      const originalLabel = button.querySelector('.action-label')?.textContent ?? button.textContent;
      const originalState = button.dataset.state ?? 'default';
      button.disabled = true;
      button.classList.add('is-loading');
      button.setAttribute('aria-busy', 'true');
      button.dataset.state = 'loading';
      label(button, 'Сохраняем');
      window.setTimeout(() => {
        button.classList.remove('is-loading');
        button.setAttribute('aria-busy', 'false');
        button.dataset.state = 'success';
        button.classList.add('is-success');
        label(button, 'Подход записан');
        updateSession();
        showToast('Подход записан. Прогресс тренировки обновлён.');
        window.setTimeout(() => {
          label(button, originalLabel);
          button.dataset.state = originalState;
          button.classList.remove('is-success');
          button.disabled = false;
          saving = false;
        }, 2000);
      }, 850);
    };

    const statuses = {
      success: { title: 'Восстановление в норме', description: 'Все показатели в зелёной зоне' },
      warning: { title: 'Нужен лёгкий день', description: 'Нагрузка выше обычной. Выберите спокойный темп.' },
      error: { title: 'Пора сделать паузу', description: 'Низкое восстановление. Дайте себе время на отдых.' },
      offline: { title: 'Нет данных', description: 'Подключите устройство, чтобы обновить показатели.' },
    };

    const showStatus = (button) => {
      const status = statuses[button.dataset.statusDemo] ? button.dataset.statusDemo : 'success';
      const card = find('#status-live');
      if (!card) return;
      Object.keys(statuses).forEach((name) => card.classList.remove(`status-${name}`));
      card.classList.add(`status-${status}`);
      card.dataset.state = status;
      const title = card.querySelector('.status-title');
      const description = card.querySelector('.status-description');
      if (title) title.textContent = statuses[status].title;
      if (description) description.textContent = statuses[status].description;
      const indicator = card.querySelector('.status-indicator');
      if (indicator) indicator.dataset.state = status;
      all('[data-status-demo]').forEach((item) => {
        const selected = item === button;
        item.setAttribute('aria-pressed', String(selected));
        item.classList.toggle('is-active', selected);
      });
    };

    const copy = async (value) => {
      try {
        if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
        await navigator.clipboard.writeText(value);
        showToast(`Скопировано: ${value}`);
      } catch {
        const textarea = document.createElement('textarea');
        textarea.value = value;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.append(textarea);
        const focused = document.activeElement;
        textarea.select();
        let copied = false;
        try { copied = document.execCommand('copy'); } catch { /* Manual copy remains available in the toast. */ }
        textarea.remove();
        if (focused instanceof HTMLElement) focused.focus({ preventScroll: true });
        showToast(copied ? `Скопировано: ${value}` : `Значение для копирования: ${value}`);
      }
    };

    const search = find('#exercise-search');
    const exercises = ['Жим лёжа', 'Тяга верхнего блока', 'Приседания со штангой', 'Жим гантелей', 'Сгибание рук'];
    let searchResults;
    let searchIndex = -1;

    const closeSearch = () => {
      if (searchResults) searchResults.hidden = true;
      if (search) {
        search.setAttribute('aria-expanded', 'false');
        search.removeAttribute('aria-activedescendant');
      }
      searchIndex = -1;
    };

    const renderSearch = () => {
      if (!search || !searchResults) return;
      const query = search.value.trim().toLocaleLowerCase('ru').replaceAll('ё', 'е');
      searchResults.replaceChildren();
      searchIndex = -1;
      search.removeAttribute('aria-activedescendant');
      if (!query) { closeSearch(); return; }
      const matches = exercises.filter((name) => name.toLocaleLowerCase('ru').replaceAll('ё', 'е').includes(query));
      matches.forEach((name, index) => {
        const option = document.createElement('button');
        option.type = 'button';
        option.id = `exercise-result-${index}`;
        option.dataset.exercise = name;
        option.textContent = name;
        option.tabIndex = -1;
        option.setAttribute('role', 'option');
        option.setAttribute('aria-selected', 'false');
        searchResults.append(option);
      });
      if (!matches.length) {
        const empty = document.createElement('p');
        empty.textContent = 'Упражнение не найдено';
        empty.setAttribute('role', 'status');
        searchResults.append(empty);
      }
      searchResults.hidden = false;
      search.setAttribute('aria-expanded', 'true');
    };

    const selectExercise = (name) => {
      if (!search) return;
      search.value = name;
      closeSearch();
      search.focus({ preventScroll: true });
      showToast(`Выбрано упражнение: ${name}`);
    };

    if (search) {
      searchResults = document.createElement('div');
      searchResults.id = 'exercise-results';
      searchResults.className = 'search-results';
      searchResults.hidden = true;
      searchResults.setAttribute('role', 'listbox');
      searchResults.setAttribute('aria-label', 'Найденные упражнения');
      const field = search.closest('.text-field');
      if (field) field.insertAdjacentElement('afterend', searchResults);
      else search.insertAdjacentElement('afterend', searchResults);
      search.setAttribute('role', 'combobox');
      search.setAttribute('aria-autocomplete', 'list');
      search.setAttribute('aria-controls', searchResults.id);
      search.setAttribute('aria-expanded', 'false');
      search.addEventListener('focus', () => { if (search.value.trim()) renderSearch(); });
    }

    const screenMetrics = {
      'fs-weight': { value: 60, min: 0, max: 300, step: 2.5, decimals: 1, suffix: 'кг' },
      'fs-reps': { value: 12, min: 1, max: 100, step: 1, decimals: 0, suffix: 'повторений' },
    };

    const updateScreenMetric = (id) => {
      const input = find(`#${id}`);
      const options = screenMetrics[id];
      if (!input || !options) return;
      const value = number(input.value, options.value);
      input.setAttribute('aria-valuenow', String(value));
      input.setAttribute('aria-invalid', String(!input.validity.valid || input.value === ''));
      const key = id === 'fs-weight' ? 'weight' : 'reps';
      const decrease = find(`[data-screen-action="decrease-${key}"]`);
      const increase = find(`[data-screen-action="increase-${key}"]`);
      if (decrease) decrease.disabled = input.disabled || input.readOnly || value <= options.min;
      if (increase) increase.disabled = input.disabled || input.readOnly || value >= options.max;
    };

    const adjustScreenMetric = (id, direction) => {
      const input = find(`#${id}`);
      const options = screenMetrics[id];
      if (!input || !options || input.disabled || input.readOnly) return;
      const next = clamp(number(input.value, options.value) + direction * options.step, options.min, options.max);
      input.value = next.toFixed(options.decimals);
      updateScreenMetric(id);
      input.dispatchEvent(new Event('change', { bubbles: true }));
    };

    const logScreenSet = (button) => {
      const inputs = Object.keys(screenMetrics).map((id) => find(`#${id}`)).filter(Boolean);
      const invalid = inputs.find((input) => !input.validity.valid || input.value === '');
      if (invalid) {
        invalid.reportValidity();
        invalid.focus();
        showToast('Проверьте вес и повторения.');
        return;
      }
      const text = button.querySelector('.action-label') ?? Array.from(button.children).find((child) => !child.className && child.tagName === 'SPAN');
      const originalText = text?.textContent;
      if (text) text.textContent = 'Подход записан';
      button.classList.add('is-success');
      button.disabled = true;
      const phone = button.closest('.fs-phone');
      phone?.querySelectorAll('.fs-set-progress > span').forEach((bar, index) => {
        bar.classList.toggle('fs-set-done', index < 2);
        bar.classList.toggle('fs-set-active', index === 2);
      });
      const setProgress = phone?.querySelector('.fs-set-progress');
      setProgress?.setAttribute('aria-valuenow', '67');
      setProgress?.setAttribute('aria-valuetext', '2 из 3 подходов выполнены, текущий подход третий');
      const heading = phone?.querySelector('.fs-set-heading > span');
      if (heading?.firstChild?.nodeType === Node.TEXT_NODE) heading.firstChild.nodeValue = 'ПОДХОД 3 ';
      const weight = find('#fs-weight')?.value ?? '60.0';
      const reps = find('#fs-reps')?.value ?? '12';
      showToast(`Подход записан · ${weight} кг × ${reps}`);
      window.setTimeout(() => {
        if (text) text.textContent = originalText;
        button.classList.remove('is-success');
        button.disabled = false;
      }, 2000);
    };

    const screenAction = (button) => {
      const action = button.dataset.screenAction ?? '';
      if (action === 'decrease-weight' || action === 'increase-weight') { adjustScreenMetric('fs-weight', action.startsWith('decrease') ? -1 : 1); return; }
      if (action === 'decrease-reps' || action === 'increase-reps') { adjustScreenMetric('fs-reps', action.startsWith('decrease') ? -1 : 1); return; }
      if (action === 'log-set') { logScreenSet(button); return; }
      const messages = {
        calendar: 'Демо календаря · следующая тренировка в четверг',
        profile: 'Демо профиля · настройки спортсмена',
        home: 'Демо главной · план на сегодня',
        training: 'Демо тренировок · верх тела',
        progress: 'Демо прогресса · выполнено 75% цели',
        'bench-press': 'Жим лёжа · 3 подхода × 12 повторений',
        'lat-pulldown': 'Тяга верхнего блока · 3 подхода × 12',
        'all-exercises': 'В программе 5 упражнений',
        'start-workout': 'Демо тренировки · начните с жима лёжа',
        'back-to-workout': 'Демо программы · 5 упражнений на верх тела',
        'pause-workout': 'Демо паузы · продолжите, когда будете готовы',
        'rest-timer': 'Демо таймера · отдых 90 секунд',
        'view-results': 'Результат · 482 ккал, 2 450 кг, 48:32',
        start: 'Демо старта тренировки',
        finish: 'Демо завершения · результаты тренировки',
        program: 'Демо программы тренировок',
        edit: 'Демо редактирования параметров',
      };
      const text = button.querySelector('.action-label')?.textContent?.trim() || button.getAttribute('aria-label') || button.textContent.trim();
      showToast(messages[action] ?? (/[А-Яа-яЁё]/.test(action) ? action : `Демо · ${text || 'действие'}`));
    };

    root.addEventListener('click', (event) => {
      if (!(event.target instanceof Element)) return;
      const button = event.target.closest('[data-tab], [data-segment], [data-stepper], [data-toggle], [data-status-demo], [data-screen-action], [data-toast], [data-copy], [data-exercise], [data-save-set], #save-set, #rest-start');
      if (!button || !root.contains(button) || button.disabled || button.getAttribute('aria-disabled') === 'true') return;
      if (button.hasAttribute('data-tab')) { event.preventDefault(); setTab(button.dataset.tab); }
      else if (button.hasAttribute('data-segment')) setSegment(button);
      else if (button.hasAttribute('data-stepper')) { event.preventDefault(); step(button); }
      else if (button.id === 'save-set' || button.hasAttribute('data-save-set')) { event.preventDefault(); saveSet(button); }
      else if (button.id === 'rest-start') { event.preventDefault(); toggleRest(); }
      else if (button.hasAttribute('data-toggle')) {
        const pressed = button.getAttribute('aria-pressed') !== 'true';
        button.setAttribute('aria-pressed', String(pressed));
        button.classList.toggle('is-active', pressed);
      }
      else if (button.hasAttribute('data-status-demo')) showStatus(button);
      else if (button.hasAttribute('data-copy')) { event.preventDefault(); void copy(button.dataset.copy ?? ''); }
      else if (button.hasAttribute('data-exercise')) selectExercise(button.dataset.exercise);
      else if (button.hasAttribute('data-toast')) showToast(button.dataset.toast ?? 'Готово');
      else if (button.hasAttribute('data-screen-action')) screenAction(button);
    });

    root.addEventListener('input', (event) => {
      const input = event.target;
      if (!(input instanceof HTMLInputElement)) return;
      if (input.id === 'effort-range') updateEffort();
      if (input.id === 'weight-validate') validateWeight();
      if (input.id === 'exercise-search') renderSearch();
      if (Object.hasOwn(defaults, input.id)) updateStepper(input);
      if (Object.hasOwn(screenMetrics, input.id)) updateScreenMetric(input.id);
    });

    root.addEventListener('change', (event) => {
      const input = event.target;
      if (!(input instanceof HTMLInputElement)) return;
      if (input.type === 'checkbox') {
        const wrapper = input.closest('[data-switch], .switch');
        if (wrapper) wrapper.classList.toggle('is-active', input.checked);
      }
      if (input.id === 'weight-validate') validateWeight();
      if (Object.hasOwn(defaults, input.id)) updateStepper(input);
      if (Object.hasOwn(screenMetrics, input.id)) updateScreenMetric(input.id);
    });

    root.addEventListener('keydown', (event) => {
      if (!(event.target instanceof Element)) return;
      if (event.target === search) {
        if (event.key === 'Escape') { closeSearch(); event.preventDefault(); return; }
        if (['ArrowDown', 'ArrowUp', 'Enter'].includes(event.key)) {
          if (searchResults?.hidden && event.key !== 'Enter') renderSearch();
          const options = Array.from(searchResults?.querySelectorAll('[data-exercise]') ?? []);
          if (!options.length || searchResults?.hidden) return;
          event.preventDefault();
          if (event.key === 'Enter') {
            selectExercise(options[Math.max(0, searchIndex)].dataset.exercise);
            return;
          }
          searchIndex = event.key === 'ArrowDown' ? (searchIndex + 1) % options.length : (searchIndex <= 0 ? options.length - 1 : searchIndex - 1);
          options.forEach((option, index) => {
            const selected = index === searchIndex;
            option.setAttribute('aria-selected', String(selected));
            option.classList.toggle('is-active', selected);
          });
          search.setAttribute('aria-activedescendant', options[searchIndex].id);
          return;
        }
      }
      const current = event.target.closest('[data-tab]');
      if (!current || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      const tabs = all('[data-tab]').filter((tab) => !tab.disabled);
      const index = tabs.indexOf(current);
      if (index === -1 || !tabs.length) return;
      event.preventDefault();
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
      setTab(tabs[next].dataset.tab);
      tabs[next].focus();
    });

    document.addEventListener('keydown', (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k' && search) {
        event.preventDefault();
        setTab('components');
        search.focus();
      }
      if (event.key === 'Escape') { hideToast(); closeSearch(); }
    });

    const dismissSearchOutside = (event) => {
      if (!search || !searchResults || !(event.target instanceof Element)) return;
      const field = search.closest('.text-field');
      if (!field?.contains(event.target) && !searchResults.contains(event.target)) closeSearch();
    };
    document.addEventListener('click', dismissSearchOutside);
    document.addEventListener('focusin', dismissSearchOutside);

    Object.entries(defaults).forEach(([id, options]) => {
      const input = find(`#${id}`);
      if (!input) return;
      if (input.value === '') input.value = String(options.value);
      if (input.step === '') input.step = String(options.step);
      if (input.min === '') input.min = String(options.min);
      if (input.max === '') input.max = String(options.max);
      updateStepper(input);
    });
    Object.entries(screenMetrics).forEach(([id, options]) => {
      const input = find(`#${id}`);
      if (!input) return;
      input.type = 'number';
      input.min = String(options.min);
      input.max = String(options.max);
      input.step = String(options.step);
      input.required = true;
      input.setAttribute('aria-valuemin', String(options.min));
      input.setAttribute('aria-valuemax', String(options.max));
      updateScreenMetric(id);
    });
    const activeTab = find('[data-tab][aria-selected="true"], [data-tab].active, [data-tab].is-active') ?? find('[data-tab]');
    if (activeTab) setTab(activeTab.dataset.tab);
    renderRest();
    updateEffort();
    validateWeight();
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
