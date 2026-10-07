/* Синхронизация состояния приложения с Supabase внутри Telegram.
   Подключается только в сборке мини-приложения. Вне Telegram ничего не делает. */
(function () {
  'use strict';
  var KEY = 'gym_redesign_app_v1';
  var META = 'gym_sync_meta_v1';
  var tg = window.Telegram && window.Telegram.WebApp;
  var cfg = window.GYM_CONFIG || {};

  // Оформление окна Telegram: во весь экран, без случайного закрытия свайпом вниз
  if (tg) {
    try { tg.ready(); tg.expand(); } catch (e) {}
    try { if (tg.disableVerticalSwipes) tg.disableVerticalSwipes(); } catch (e) {}
    var paint = function () {
      try {
        var color = document.documentElement.dataset.redesignTheme === 'white' ? '#e8e7e2' : '#0b0b0c';
        if (tg.setHeaderColor) tg.setHeaderColor(color);
        if (tg.setBackgroundColor) tg.setBackgroundColor(color);
      } catch (e) {}
    };
    paint();
    // шапка Telegram меняет цвет вместе с темой Black / White
    new MutationObserver(paint).observe(document.documentElement, { attributes: true, attributeFilter: ['data-redesign-theme'] });
  }
  if (!tg || !tg.initData || !cfg.API_BASE) return;

  var url = cfg.API_BASE.replace(/\/$/, '') + '/state';
  var timer = null, pending = null, inFlight = false, failed = 0;

  function push(keepalive) {
    if (pending == null) return;
    if (inFlight && !keepalive) { schedule(); return; }
    var body = pending; pending = null; inFlight = true;
    var now = new Date().toISOString();
    fetch(url, {
      method: 'PUT',
      keepalive: !!keepalive && body.length < 60000,
      headers: { 'Content-Type': 'application/json', 'X-Telegram-Init-Data': tg.initData },
      body: JSON.stringify({ state: JSON.parse(body), client_updated_at: now })
    }).then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); }).then(function (res) {
      failed = 0;
      Storage.prototype.setItem.call(localStorage, META, JSON.stringify({ updated_at: res.updated_at || now, user: tg.initDataUnsafe && tg.initDataUnsafe.user ? tg.initDataUnsafe.user.id : null }));
    }).catch(function () {
      failed++;
      if (pending == null) pending = body; // повторим позже
      if (failed < 6) schedule(Math.min(30000, 2000 * failed * failed));
    }).then(function () { inFlight = false; });
  }
  function schedule(delay) {
    clearTimeout(timer);
    timer = setTimeout(function () { push(false); }, delay == null ? 1500 : delay);
  }

  var original = Storage.prototype.setItem;
  Storage.prototype.setItem = function (key, value) {
    original.apply(this, arguments);
    if (this === window.localStorage && key === KEY) { pending = String(value); schedule(); }
  };

  function flush() { clearTimeout(timer); push(true); }
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') flush(); });
  window.addEventListener('pagehide', flush);
})();
