/* Загрузчик мини-приложения.
   1) В Telegram берёт сохранённое состояние пользователя с сервера и кладёт его в localStorage,
      если на сервере оно новее, чем на устройстве.
   2) Без сети, без настройки или вне Telegram просто запускает приложение с локальными данными.
   3) Открывает основное приложение. */
(function () {
  'use strict';
  var APP = 'redesign/app.html';
  var KEY = 'gym_redesign_app_v1';
  var META = 'gym_sync_meta_v1';
  var tg = window.Telegram && window.Telegram.WebApp;
  var cfg = window.GYM_CONFIG || {};

  function start() { location.replace(APP); }
  function read(key) { try { return JSON.parse(localStorage.getItem(key)); } catch (e) { return null; } }

  if (tg) { try { tg.ready(); tg.expand(); } catch (e) {} }
  if (!tg || !tg.initData || !cfg.API_BASE) { start(); return; }

  var done = false;
  var timer = setTimeout(function () { if (!done) { done = true; start(); } }, 4000);
  function finish() { if (done) return; done = true; clearTimeout(timer); start(); }

  fetch(cfg.API_BASE.replace(/\/$/, '') + '/state', {
    method: 'GET',
    headers: { 'X-Telegram-Init-Data': tg.initData }
  }).then(function (r) { return r.ok ? r.json() : null; }).then(function (res) {
    if (res && res.state && res.updated_at) {
      var meta = read(META) || {};
      var localHasData = !!localStorage.getItem(KEY);
      var remoteTime = Date.parse(res.updated_at) || 0;
      var userId = tg.initDataUnsafe && tg.initDataUnsafe.user ? tg.initDataUnsafe.user.id : null;
      var otherUser = meta.user != null && userId != null && meta.user !== userId;
      // сервер новее, на устройстве данных нет или на устройстве данные другого аккаунта — берём серверные
      if (!localHasData || otherUser || remoteTime > (meta.updated_at ? Date.parse(meta.updated_at) : 0)) {
        localStorage.setItem(KEY, JSON.stringify(res.state));
        localStorage.setItem(META, JSON.stringify({ updated_at: res.updated_at, user: tg.initDataUnsafe && tg.initDataUnsafe.user ? tg.initDataUnsafe.user.id : null }));
      }
    }
  }).catch(function () {}).then(finish);
})();
