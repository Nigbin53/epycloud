/* Жесты как в iOS: свайп от левого края — назад, шторки вниз — закрыть, удержание +/− — быстрый повтор,
   свайп подхода влево — удалить. Логика приложения не меняется: жест в конце нажимает те же действия. */
(() => {
'use strict';
const EASE = 'cubic-bezier(.32,.72,0,1)';
const haptic = (k) => { try { const tg = window.Telegram && Telegram.WebApp; if (tg && tg.initData && tg.HapticFeedback) tg.HapticFeedback.impactOccurred(k || 'light'); } catch (_) {} };
const now = () => performance.now();
const reset = (el, props) => { props.forEach((p) => { el.style[p] = ''; }); };

/* ---------- 1. свайп от левого края — назад ---------- */
let back = null;
function backTarget(t) {
  if (document.querySelector('.rd-medit.on')) return null;
  const sheet = document.querySelector('#ov.on > .sheet.msheet');
  if (sheet) return sheet.contains(t) ? { el: sheet, kind: 'sheet' } : null;
  const scr = document.getElementById('scrov');
  if (scr && scr.classList.contains('on') && scr.contains(t)) {
    const depth = window.gymScrDepth ? window.gymScrDepth() : 1;
    return depth > 1 ? { el: document.getElementById('scrpage'), kind: 'pop' } : { el: scr, kind: 'screen' };
  }
  return null;
}
function backFinish(el, kind) {
  if (kind === 'sheet') {
    el.style.visibility = 'hidden';
    if (window.gymClose) window.gymClose();
    requestAnimationFrame(() => reset(el, ['transition', 'transform', 'visibility', 'willChange']));
  } else if (kind === 'pop') {
    reset(el, ['transition', 'transform', 'willChange']);
    if (window.gymScreenBack) window.gymScreenBack();
  } else {
    el.style.opacity = '0';
    if (window.gymScreenBack) window.gymScreenBack();
    setTimeout(() => reset(el, ['transition', 'transform', 'opacity', 'willChange']), 460);
  }
}

/* ---------- 2. шторки: потянуть вниз — закрыть ---------- */
let pull = null;
function pullTarget(t) {
  const medit = t.closest && t.closest('.rd-medit.on > .rd-medit-panel');
  if (medit) return { el: medit, kind: 'medit' };
  const sh = document.querySelector('#ov.on > .sheet:not(.msheet)');
  if (sh && sh.contains(t)) return { el: sh, kind: 'sheet' };
  return null;
}
function pullFinish(el, kind) {
  if (kind === 'medit') {
    const box = el.parentElement;
    if (box) box.dispatchEvent(new MouseEvent('click', { bubbles: true })); // закрывает как тап по фону
    setTimeout(() => reset(el, ['transition', 'transform', 'willChange']), 260);
  } else {
    el.style.visibility = 'hidden';
    if (window.gymClose) window.gymClose();
    requestAnimationFrame(() => reset(el, ['transition', 'transform', 'visibility', 'willChange']));
  }
}

/* ---------- 3. свайп подхода влево — удалить ---------- */
let row = null;

/* ---------- 5. свайп между главными экранами: Тренировка · Вес · Питание · История ---------- */
let tab = null;
const overlayOpen = () => !!document.querySelector('#ov.on, #scrov.on, .rd-medit.on, #prov.on, .obscr');
function hBlocked(el) {
  for (let n = el; n && n.id !== 'app'; n = n.parentElement) {
    if (n.matches && n.matches('input,textarea,select,[data-noswipe],.ui-calendar,.tg-filters,.seg,.rd-r7-switch,.rd-set')) return true;
    const cs = getComputedStyle(n);
    if (n.scrollWidth > n.clientWidth + 2 && /(auto|scroll)/.test(cs.overflowX)) return true; // свои горизонтальные ленты
  }
  return false;
}
function tabNeighbor(dir) {
  const nb = [...document.querySelectorAll('#nav .nb[data-a="tab"]')], i = nb.findIndex((b) => b.classList.contains('on'));
  return i < 0 ? null : nb[i + dir] || null;
}
/* «подглядывание»: следующий экран въезжает за пальцем (фон и заголовок того же экрана, без пустоты),
   текущий уходит с параллаксом; после отпускания под ним рисуется настоящий экран и он растворяется */
function peekMake(btn, dir) {
  const screen = document.querySelector('.screen'), app = document.getElementById('app');
  const pk = document.createElement('div'); pk.className = 'rd-peek'; pk.setAttribute('aria-hidden', 'true');
  const cs = getComputedStyle(screen);
  pk.style.backgroundImage = cs.backgroundImage; pk.style.backgroundColor = cs.backgroundColor !== 'rgba(0, 0, 0, 0)' ? cs.backgroundColor : getComputedStyle(document.body).backgroundColor;
  pk.style.backgroundSize = cs.backgroundSize; pk.style.backgroundPosition = cs.backgroundPosition;
  const label = (btn.querySelector('.nblabel') || btn).textContent.trim(), ic = btn.querySelector('svg');
  pk.innerHTML = '<div class="rd-peek-in"><div class="rd-peek-h">' + (ic ? ic.outerHTML : '') + '<b>' + label + '</b></div><i></i><i></i><i class="s"></i><i></i></div>';
  pk.style.transform = 'translateX(' + (dir * 100) + '%)';
  screen.insertBefore(pk, app.nextSibling);
  return pk;
}
function tabFinish(tb, dir) {
  const app = tb.el, pk = tb.peek;
  pk.style.transition = 'transform .2s ' + EASE; pk.style.transform = 'translateX(0)';
  app.style.transition = 'transform .2s ' + EASE + ', opacity .2s ' + EASE; app.style.transform = 'translateX(' + (-dir * 30) + '%)'; app.style.opacity = '.4';
  setTimeout(() => {
    reset(app, ['transition', 'transform', 'opacity', 'willChange']);
    tb.next.click(); // та же кнопка нижнего меню: вибрация, перерисовка, прокрутка наверх
    requestAnimationFrame(() => requestAnimationFrame(() => {
      pk.style.transition = 'opacity .22s ease'; pk.style.opacity = '0';
      setTimeout(() => pk.remove(), 240);
    }));
  }, 200);
}
function tabCancel(tb) {
  const app = tb.el, pk = tb.peek, dir = tb.dir;
  app.style.transition = 'transform .22s ' + EASE + ', opacity .22s ' + EASE; app.style.transform = ''; app.style.opacity = '';
  if (pk) { pk.style.transition = 'transform .22s ' + EASE; pk.style.transform = 'translateX(' + (dir * 100) + '%)'; setTimeout(() => pk.remove(), 240); }
  setTimeout(() => reset(app, ['transition', 'willChange']), 240);
}

document.addEventListener('touchstart', (e) => {
  if (e.touches.length !== 1) { back = pull = row = tab = null; return; }
  const t = e.touches[0], target = e.target;
  back = pull = row = tab = null;
  if (t.clientX <= 24) {
    const b = backTarget(target);
    if (b) { back = Object.assign(b, { x0: t.clientX, y0: t.clientY, t0: now(), d: 0, lock: null, w: b.el.getBoundingClientRect().width || innerWidth }); return; }
  }
  const r = target.closest && target.closest('.rd-set');
  if (r && !target.closest('.rd-set-x')) { row = { el: r, x0: t.clientX, y0: t.clientY, d: 0, lock: null }; return; }
  if (target.closest && target.closest('input,textarea,select,.tg-filters,.ui-calendar,.rd-plan-days')) return;
  const p = pullTarget(target);
  if (p && p.el.scrollTop <= 0) { pull = Object.assign(p, { x0: t.clientX, y0: t.clientY, t0: now(), d: 0, lock: null, h: p.el.getBoundingClientRect().height || innerHeight }); return; }
  const app = document.getElementById('app');
  if (app && app.contains(target) && !overlayOpen() && !hBlocked(target)) tab = { el: app, x0: t.clientX, y0: t.clientY, t0: now(), d: 0, lock: null, w: app.getBoundingClientRect().width || innerWidth };
}, { passive: true });

document.addEventListener('touchmove', (e) => {
  const t = e.touches[0];
  if (back) {
    const dx = t.clientX - back.x0, dy = t.clientY - back.y0;
    if (back.lock === null) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      back.lock = dx > 0 && Math.abs(dx) > Math.abs(dy) * 1.2 ? 'x' : 'no';
      if (back.lock === 'x') { back.el.style.transition = 'none'; back.el.style.willChange = 'transform'; }
    }
    if (back.lock !== 'x') { back = null; return; }
    e.preventDefault();
    back.d = Math.max(0, dx);
    back.el.style.transform = 'translateX(' + back.d + 'px)';
  } else if (row) {
    const dx = t.clientX - row.x0, dy = t.clientY - row.y0;
    if (row.lock === null) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      row.lock = dx < 0 && Math.abs(dx) > Math.abs(dy) * 1.2 ? 'x' : 'no';
      if (row.lock === 'x') row.el.classList.add('is-swiping');
    }
    if (row.lock !== 'x') { row = null; return; }
    e.preventDefault();
    row.d = Math.min(0, dx);
    row.el.style.setProperty('--sx', row.d + 'px');
    row.el.classList.toggle('is-armed', row.d < -90);
  } else if (tab) {
    const dx = t.clientX - tab.x0, dy = t.clientY - tab.y0;
    if (tab.lock === null) {
      if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
      tab.lock = Math.abs(dx) > Math.abs(dy) * 1.3 ? 'x' : 'no';
      if (tab.lock === 'x') { tab.el.style.transition = 'none'; tab.el.style.willChange = 'transform'; }
    }
    if (tab.lock !== 'x') { tab = null; return; }
    e.preventDefault();
    const dir = dx < 0 ? 1 : -1;
    if (tab.dir !== dir) { if (tab.peek) tab.peek.remove(); tab.peek = null; tab.dir = dir; tab.next = tabNeighbor(dir); if (tab.next) tab.peek = peekMake(tab.next, dir); }
    tab.d = tab.next ? dx : dx * 0.25; // у крайних экранов — пружинит
    if (tab.next) {
      const f = Math.min(1, Math.abs(dx) / tab.w);
      tab.el.style.transform = 'translateX(' + (dx * 0.3) + 'px)'; tab.el.style.opacity = String(1 - f * 0.6);
      tab.peek.style.transform = 'translateX(' + (dir * tab.w + dx) + 'px)';
    } else tab.el.style.transform = 'translateX(' + tab.d + 'px)';
  } else if (pull) {
    const dx = t.clientX - pull.x0, dy = t.clientY - pull.y0;
    if (pull.lock === null) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      pull.lock = dy > 0 && Math.abs(dy) > Math.abs(dx) * 1.2 && pull.el.scrollTop <= 0 ? 'y' : 'no';
      if (pull.lock === 'y') { pull.el.style.transition = 'none'; pull.el.style.willChange = 'transform'; }
    }
    if (pull.lock !== 'y') { pull = null; return; }
    e.preventDefault();
    pull.d = Math.max(0, dy);
    pull.el.style.transform = 'translateY(' + pull.d + 'px)';
  }
}, { passive: false });

function end(cancel) {
  if (back && back.lock === 'x') {
    const b = back, v = b.d / Math.max(1, now() - b.t0), go = !cancel && (b.d > b.w * 0.33 || v > 0.6);
    b.el.style.transition = 'transform .24s ' + EASE;
    if (go) { b.el.style.transform = 'translateX(100%)'; haptic('light'); setTimeout(() => backFinish(b.el, b.kind), 230); }
    else { b.el.style.transform = ''; setTimeout(() => reset(b.el, ['transition', 'willChange']), 260); }
  }
  if (row && row.lock === 'x') {
    const r = row;
    if (!cancel && r.d < -90) { haptic('medium'); const x = r.el.querySelector('.rd-set-x'); if (x) x.click(); }
    else { r.el.classList.add('is-back'); r.el.style.setProperty('--sx', '0px'); setTimeout(() => r.el.classList.remove('is-swiping', 'is-armed', 'is-back'), 220); }
  }
  if (pull && pull.lock === 'y') {
    const p = pull, v = p.d / Math.max(1, now() - p.t0), go = !cancel && (p.d > Math.min(140, p.h * 0.25) || v > 0.6);
    p.el.style.transition = 'transform .24s ' + EASE;
    if (go) { p.el.style.transform = 'translateY(110%)'; setTimeout(() => pullFinish(p.el, p.kind), 220); }
    else { p.el.style.transform = ''; setTimeout(() => reset(p.el, ['transition', 'willChange']), 260); }
  }
  if (tab && tab.lock === 'x') {
    const tb = tab, v = Math.abs(tb.d) / Math.max(1, now() - tb.t0), go = !cancel && tb.next && (Math.abs(tb.d) > tb.w * 0.22 || v > 0.45);
    if (go) tabFinish(tb, tb.dir); else tabCancel(tb);
  }
  back = pull = row = tab = null;
}
document.addEventListener('touchend', () => end(false), { passive: true });
document.addEventListener('touchcancel', () => end(true), { passive: true });

/* ---------- 4. удержание +/− на странице тренажёра — быстрый повтор ---------- */
const HOLD_SEL = '#sheet .rd-approved-training [data-a="dw"], #sheet .rd-approved-training [data-a="dr"]';
let hold = null;
function holdStop() { if (!hold) return; clearTimeout(hold.timer); if (hold.fired) window.gymHoldSwallowUntil = now() + 450; hold = null; }
document.addEventListener('pointerdown', (e) => {
  const b = e.target.closest && e.target.closest(HOLD_SEL);
  if (!b) return;
  const a = b.dataset.a, v = b.dataset.v;
  hold = { a, v, x: e.clientX, y: e.clientY, n: 0, fired: false };
  const step = () => {
    if (!hold) return;
    const cur = document.querySelector('#sheet .rd-approved-training [data-a="' + a + '"][data-v="' + v + '"]');
    if (!cur) { holdStop(); return; }
    hold.fired = true; hold.n++;
    cur.click();
    hold.timer = setTimeout(step, Math.max(70, 160 - hold.n * 10)); // разгоняется
  };
  hold.timer = setTimeout(step, 420);
}, { passive: true });
document.addEventListener('pointermove', (e) => { if (hold && Math.hypot(e.clientX - hold.x, e.clientY - hold.y) > 12) holdStop(); }, { passive: true });
['pointerup', 'pointercancel'].forEach((ev) => document.addEventListener(ev, holdStop, { passive: true }));
window.addEventListener('blur', holdStop);
// после удержания отпускание пальца не должно добавить лишний шаг — проверяет training-presentation.js (stepInPlace)
})();
