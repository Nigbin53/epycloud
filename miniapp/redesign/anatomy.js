// User-provided anatomy photographs inside the native muscle-group buttons.
// The native group values, selection, labels, and save behavior are untouched.
(() => {
  'use strict';
  const assets = {
    'Грудь': ['chest', 'torso'],
    'Спина': ['back', 'torso'],
    'Ноги': ['front-thighs', 'legs'],
    'Руки': ['arms', 'torso'],
    'Бицепс': ['arms', 'torso'],
    'Трицепс': ['arms', 'torso'],
    // The supplied set has a shared arms illustration. This crop shows only
    // the neutral shoulders above the highlighted arms; it adds no new anatomy.
    'Плечи': ['arms', 'shoulders']
  };
  let scheduled = false;

  function present() {
    scheduled = false;
    const theme = document.documentElement.dataset.redesignTheme;
    if (theme !== 'black' && theme !== 'white') return;
    document.querySelectorAll('.addsheet .addgrp .grpbtn[data-a="grp"]').forEach(button => {
      const anatomy = assets[button.dataset.v];
      if (!anatomy) return;
      let frame = button.querySelector('.rd-anatomy');
      if (!frame) {
        frame = document.createElement('span');
        frame.className = 'rd-anatomy rd-anatomy--' + anatomy[1];
        frame.setAttribute('aria-hidden', 'true');
        const img = document.createElement('img');
        img.alt = '';
        img.decoding = 'async';
        img.draggable = false;
        frame.append(img);
        button.querySelector(':scope > svg')?.remove();
        button.prepend(frame);
        button.classList.add('rd-anatomy-button');
      }
      const src = '../assets/anatomy-groups/' + theme + '/' + anatomy[0] + '.png';
      const img = frame.querySelector('img');
      if (img.getAttribute('src') !== src) img.setAttribute('src', src);
    });
  }

  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(present);
  }
  const shell = document.querySelector('.screen');
  if (shell) new MutationObserver(schedule).observe(shell, { subtree: true, childList: true });
  new MutationObserver(schedule).observe(document.documentElement, {
    attributes: true, attributeFilter: ['data-redesign-theme']
  });
  window.addEventListener('gym-redesign:view', schedule);
  schedule();
})();
