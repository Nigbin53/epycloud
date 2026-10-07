/* Attach presentation slots to approved and native screens without changing actions. */
(() => {
  'use strict';
  const store = window.GymEquipment;
  if (!store) return;
  let scheduled = false;
  const white = () => document.body.classList.contains('theme-white') || document.documentElement.dataset.redesignTheme === 'white';
  function bind(img, key) {
    if (!img || img.dataset.equipmentPersonal === 'true') return;
    if (!img.dataset.equipmentOriginal) img.dataset.equipmentOriginal = img.src;
    if (img.dataset.equipmentSlot !== key) img.dataset.equipmentSlot = key;
    const src = store.resolve(key) || img.dataset.equipmentOriginal;
    if (img.src !== src) img.src = src;
    const replaced = !!store.current(key);
    if (img.classList.contains('equipment-replaced') !== replaced) img.classList.toggle('equipment-replaced', replaced);
  }
  function placeholder(img, theme) {
    if (!img || img.dataset.equipmentPersonal === 'true' || !store.placeholder) return;
    const src = store.placeholder(theme);
    if (img.src !== src) img.src = src;
    img.classList.remove('equipment-replaced');
    img.dataset.equipmentPlaceholder = 'true';
  }
  const keyFor = (name, fallback, screen, theme) => store.photoKey ? store.photoKey(name, fallback, screen, theme) : fallback + '/' + screen + '/' + theme;
  function present() {
    scheduled = false;
    const theme = white() ? 'white' : 'black';
    document.querySelectorAll('.ta-exercise').forEach((card, index) => {
      const machine = card.classList.contains('ta-second-exercise') ? 'leg-press' : 'lat-pulldown';
      bind(card.querySelector('.ta-exercise-photo'), machine + '/overview/' + theme);
    });
    document.querySelectorAll('img.rd-equipment[data-equipment-machine]').forEach(img => {
      if (!store.ownKey) { bind(img, keyFor(img.dataset.equipmentName, img.dataset.equipmentMachine, 'overview', theme)); return; }
      const own = store.ownKey(img.dataset.equipmentName, 'overview', theme);
      if (own) bind(img, own);
      else placeholder(img, theme);
    });
    document.querySelectorAll('.ta-detail-photo-layers').forEach(layers => {
      const page = layers.closest('.rd-approved-training');
      const hero = layers.querySelector('.ta-detail-hero');
      const rear = layers.querySelector('.ta-detail-hero-back');
      const machine = page?.dataset.equipmentMachine || 'leg-press';
      if (!hero || hero.dataset.equipmentPersonal === 'true') return;
      if (page && store.ownKey && !store.ownKey(page.dataset.equipmentName, 'detail', theme)) {
        // у тренажёра пока нет своего фото — заглушка одним слоем
        placeholder(hero, theme);
        layers.classList.add('equipment-single-image');
        if (rear) rear.hidden = true;
        return;
      }
      const key = keyFor(page?.dataset.equipmentName, machine, 'detail', theme);
      bind(hero, key);
      // Своё фото тренажёра (не общий слот) показывается одним слоем, без фона жима ногами.
      const single = key !== machine + '/detail/' + theme || !!store.current(key);
      layers.classList.toggle('equipment-single-image', single);
      if (rear) {
        if (rear.dataset.equipmentHidden === undefined) rear.dataset.equipmentHidden = String(rear.hidden);
        if (theme === 'black' && machine === 'leg-press') bind(rear, 'leg-press/detail/black-background');
        rear.hidden = single || rear.dataset.equipmentHidden === 'true';
      }
    });
  }
  function schedule() { if (scheduled) return; scheduled = true; requestAnimationFrame(present); }
  new MutationObserver(schedule).observe(document.body, {subtree: true, childList: true});
  store.subscribe(schedule);
  window.addEventListener('gym-redesign:view', schedule);
  schedule();
})();
