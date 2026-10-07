/* A physical control skin over the source controls; no product state or actions. */
(() => {
  'use strict';
  const groups = [
    ['.kg-tabs', 'kgmode', 'Способ расчёта дневной цели', false],
    ['.hfilt', 'hf', 'Фильтр истории', false],
    ['.pescr .pegrid', 'peg', 'Пол', false],
    ['.pescr .pegoals', 'pegoal', 'Цель', false],
    ['.achscr .achfilters', 'achfilter', 'Фильтр достижений', true]
  ];
  let pending = false;
  function decorate() {
    pending = false;
    if (document.documentElement.dataset.redesignTheme !== 'white') return;
    for (const [selector, action, label, matrix] of groups) {
      document.querySelectorAll(selector).forEach(group => {
        const buttons = Array.from(group.children).filter(node => node.matches(`button[data-a="${action}"]`));
        if (buttons.length < 2) return;
        const index = Math.max(0, buttons.findIndex(button => button.classList.contains('on')));
        group.classList.add('rd-r7-switch');
        group.classList.toggle('rd-r7-switch-matrix', matrix);
        if (!group.hasAttribute('role')) group.setAttribute('role', 'group');
        if (!group.hasAttribute('aria-label')) group.setAttribute('aria-label', label);
        if (group.dataset.r7Control !== 'segmented-slider') group.dataset.r7Control = 'segmented-slider';
        const values = {'--r7-count': String(matrix ? 2 : buttons.length), '--r7-index': String(matrix ? index % 2 : index), '--r7-row': String(matrix ? Math.floor(index / 2) : 0)};
        for (const [key, value] of Object.entries(values)) {
          if (group.style.getPropertyValue(key) !== value) group.style.setProperty(key, value);
        }
      });
    }
  }
  function schedule() {
    if (!pending) { pending = true; requestAnimationFrame(decorate); }
  }
  new MutationObserver(schedule).observe(document.body, {subtree: true, childList: true, attributes: true, attributeFilter: ['class', 'data-redesign-theme']});
  window.addEventListener('gym-redesign:view', schedule);
  decorate();
})();
