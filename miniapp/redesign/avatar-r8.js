/* Only the missing-photo initial is replaced. Native photos and actions stay. */
(() => {
  'use strict';
  let pending = false;
  const selector = '.top > button.ava[data-a="profileopen"], #scrpage .proring > .inner';
  function present() {
    pending = false;
    document.querySelectorAll(selector).forEach(slot => {
      // Native gender portraits and uploaded images both already render as img.
      if (slot.querySelector('img')) return;
      const portrait = document.createElement('img');
      portrait.className = 'rd-avatar-fallback';
      portrait.src = '../assets/avatar-outline-10.png';
      portrait.alt = '';
      portrait.decoding = 'async';
      slot.dataset.rdAvatar = 'kit-portrait';
      slot.replaceChildren(portrait);
    });
  }
  function schedule() {
    if (pending) return;
    pending = true;
    requestAnimationFrame(present);
  }
  const shell = document.querySelector('.screen');
  if (shell) new MutationObserver(schedule).observe(shell, {subtree: true, childList: true});
  window.addEventListener('gym-redesign:view', schedule);
  schedule();
})();
