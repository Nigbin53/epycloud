/* Загрузчик мини-приложения.
   1) В Telegram спрашивает у сервера сохранённое состояние пользователя и решает, чьи данные свежее.
   2) Если сервер не ответил, помечает это: tg-sync.js не отправит ничего на сервер,
      пока не сверится с ним, — так пустые данные нового устройства не затрут настоящие.
   3) Открывает основное приложение. */
(function () {
  'use strict';
  var APP = 'redesign/app.html';
  var KEY = 'gym_redesign_app_v1';
  var META = 'gym_sync_meta_v1';
  var READY = 'gym_sync_ready_v1'; // sessionStorage: 'ok' — сверились с сервером, 'pending' — ещё нет
  var tg = window.Telegram && window.Telegram.WebApp;
  var cfg = window.GYM_CONFIG || {};

  // Кнопка «На рабочий стол» в чате бота открывает мини-апп с меткой a2hs=1 — передаём её приложению
  try { if (/[?&]a2hs=1\b/.test(location.search)) sessionStorage.setItem('gym_a2hs', '1'); } catch (e) {}
  function start() { location.replace(APP); }
  function read(key) { try { return JSON.parse(localStorage.getItem(key)); } catch (e) { return null; } }
  function mark(value) { try { sessionStorage.setItem(READY, value); } catch (e) {} }

  if (tg) { try { tg.ready(); tg.expand(); } catch (e) {} }
  if (!tg || !tg.initData || !cfg.API_BASE) { start(); return; }
  mark('pending');

  var done = false;
  var timer = setTimeout(function () { if (!done) { done = true; start(); } }, 4000);
  function finish() { if (done) return; done = true; clearTimeout(timer); start(); }

  fetch(cfg.API_BASE.replace(/\/$/, '') + '/state', {
    method: 'GET',
    headers: { 'X-Telegram-Init-Data': tg.initData }
  }).then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); }).then(function (res) {
    if (done) return; // приложение уже запущено — сверкой займётся tg-sync.js
    var userId = tg.initDataUnsafe && tg.initDataUnsafe.user ? tg.initDataUnsafe.user.id : null;
    var decision = window.GymSyncDecide(res, localStorage.getItem(KEY) != null, read(META) || {}, userId);
    if (decision === 'remote') {
      localStorage.setItem(KEY, JSON.stringify(res.state));
      localStorage.setItem(META, JSON.stringify({ updated_at: res.updated_at, user: userId, dirty: false }));
    } else if (decision === 'push') {
      var meta = read(META) || {};
      meta.dirty = true; meta.user = userId;
      localStorage.setItem(META, JSON.stringify(meta));
    }
    mark('ok');
  }).catch(function () {}).then(finish);
})();
