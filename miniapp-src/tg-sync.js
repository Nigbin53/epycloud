/* Связь мини-приложения с Telegram и сервером. Подключается только в сборке мини-приложения.
   — синхронизация состояния с Supabase (без потери данных при плохой сети и на двух устройствах);
   — системная кнопка «Назад» Telegram закрывает шторки и экраны;
   — экспорт CSV/JSON приходит файлом в чат с ботом (обычное скачивание в Telegram не работает);
   — цвет шапки Telegram под тему Black / White.
   Вне Telegram ничего не делает. */
(function () {
  'use strict';
  var KEY = 'gym_redesign_app_v1';
  var META = 'gym_sync_meta_v1';
  var READY = 'gym_sync_ready_v1';
  var tg = window.Telegram && window.Telegram.WebApp;
  var cfg = window.GYM_CONFIG || {};
  if (!tg || !tg.initData) return;

  var nativeSet = Storage.prototype.setItem;
  function readMeta() { try { return JSON.parse(localStorage.getItem(META)) || {}; } catch (e) { return {}; } }
  function writeMeta(meta) { try { nativeSet.call(localStorage, META, JSON.stringify(meta)); } catch (e) {} }
  var userId = tg.initDataUnsafe && tg.initDataUnsafe.user ? tg.initDataUnsafe.user.id : null;

  /* ---------- окно Telegram ---------- */
  try { tg.ready(); tg.expand(); } catch (e) {}
  try { if (tg.disableVerticalSwipes) tg.disableVerticalSwipes(); } catch (e) {}
  function paint() {
    try {
      var color = document.documentElement.dataset.redesignTheme === 'white' ? '#e8e7e2' : '#0b0b0c';
      if (tg.setHeaderColor) tg.setHeaderColor(color);
      if (tg.setBackgroundColor) tg.setBackgroundColor(color);
    } catch (e) {}
  }
  /* Верхний отступ: дизайн рассчитан на статус-бар iPhone (43 px), а в Telegram его закрывает шапка Telegram.
     Оставляем небольшой воздух; в полноэкранном режиме учитываем вырез и кнопки Telegram. */
  function fitTop() {
    try {
      var a = (tg.safeAreaInset && tg.safeAreaInset.top) || 0;
      var b = (tg.contentSafeAreaInset && tg.contentSafeAreaInset.top) || 0;
      var top = Math.max(14, a + b + 8);
      document.documentElement.style.setProperty('--rd-safe-top', top + 'px');
      // низ: зона полоски «домой» iPhone (Telegram сообщает её высоту; иначе — системная или 16 px)
      var bottom = (tg.safeAreaInset && tg.safeAreaInset.bottom) || 0;
      document.documentElement.style.setProperty('--rd-safe-bottom', bottom > 0 ? bottom + 'px' : 'max(16px, env(safe-area-inset-bottom))');
      document.documentElement.classList.add('in-telegram');
    } catch (e) {}
  }
  fitTop();
  try { tg.onEvent('safeAreaChanged', fitTop); tg.onEvent('contentSafeAreaChanged', fitTop); tg.onEvent('fullscreenChanged', fitTop); } catch (e) {}
  paint();
  new MutationObserver(paint).observe(document.documentElement, { attributes: true, attributeFilter: ['data-redesign-theme'] });

  /* ---------- кнопка «Назад» ---------- */
  function visible(el) { return !!el && el.getClientRects().length > 0; }
  function backTarget() {
    var pr = document.getElementById('prov');
    if (pr && pr.classList.contains('on')) return pr.querySelector('[data-a="prclose"]');
    var ov = document.getElementById('ov');
    if (ov && ov.classList.contains('on')) {
      var inSheet = [].slice.call(ov.querySelectorAll('[aria-label="Назад"],[aria-label="Закрыть"],[data-a="close"]')).filter(visible)[0];
      return inSheet || ov;
    }
    var scr = document.getElementById('scrov');
    if (scr && scr.classList.contains('on')) {
      return [].slice.call(scr.querySelectorAll('[aria-label="Назад"],[aria-label="Закрыть"],[data-a="screenback"],[data-a="pecancel"]')).filter(visible)[0] || null;
    }
    var ob = document.getElementById('obov');
    if (ob && ob.classList.contains('on')) return [].slice.call(ob.querySelectorAll('[data-a="obback"]')).filter(visible)[0] || null;
    return null;
  }
  function pressBack() {
    var target = backTarget();
    if (!target) return;
    if (target.id === 'ov') target.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    else target.click();
  }
  if (tg.BackButton) {
    try { tg.BackButton.onClick(pressBack); } catch (e) {}
    var backQueued = false;
    var updateBack = function () {
      backQueued = false;
      try { if (backTarget()) tg.BackButton.show(); else tg.BackButton.hide(); } catch (e) {}
    };
    new MutationObserver(function () { if (!backQueued) { backQueued = true; requestAnimationFrame(updateBack); } })
      .observe(document.documentElement, { subtree: true, childList: true, attributes: true, attributeFilter: ['class'] });
  }

  if (!cfg.API_BASE) return;
  var base = cfg.API_BASE.replace(/\/$/, '');
  var url = base + '/state';
  function headers(json) {
    var h = { 'X-Telegram-Init-Data': tg.initData };
    if (json) h['Content-Type'] = 'application/json';
    return h;
  }

  /* ---------- экспорт файлом в чат ---------- */
  var nativeClick = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function () {
    var a = this;
    if (!a.hasAttribute('download') || !/^blob:/.test(a.href)) return nativeClick.apply(a, arguments);
    var filename = a.getAttribute('download') || 'gym-export.txt';
    fetch(a.href).then(function (r) { return r.text(); }).then(function (content) {
      return fetch(base + '/state', { method: 'POST', headers: headers(true), body: JSON.stringify({ export: { filename: filename, content: content } }) });
    }).then(function (r) {
      var message = r.ok ? 'Файл «' + filename + '» отправлен в чат с ботом.' : 'Не удалось отправить файл. Откройте чат с ботом и нажмите /start, затем попробуйте снова.';
      try { tg.showAlert(message); } catch (e) {}
    }).catch(function () { try { tg.showAlert('Нет связи — файл не отправлен.'); } catch (e) {} });
  };

  /* ---------- синхронизация ---------- */
  var ready = false;
  try { ready = sessionStorage.getItem(READY) === 'ok'; } catch (e) {}
  var timer = null, inFlight = false, failed = 0, stopped = false, seq = 0;

  function push() {
    if (!ready || stopped) return;
    var meta = readMeta();
    if (!meta.dirty) return;
    if (inFlight) { schedule(); return; }
    var body = localStorage.getItem(KEY);
    if (body == null) return;
    var mySeq = seq;
    inFlight = true;
    fetch(url, {
      method: 'PUT',
      keepalive: body.length < 60000,
      headers: headers(true),
      body: '{"state":' + body + '}'
    }).then(function (r) {
      if (r.status === 401 || r.status === 413) { stopped = true; return Promise.reject(r.status); }
      return r.ok ? r.json() : Promise.reject(r.status);
    }).then(function (res) {
      failed = 0;
      var next = readMeta();
      next.updated_at = res.updated_at;
      next.user = userId;
      next.dirty = seq !== mySeq; // пока отправляли, могли появиться новые правки
      writeMeta(next);
      if (next.dirty) schedule();
    }).catch(function () {
      failed++;
      if (!stopped && failed < 8) schedule(Math.min(60000, 2000 * failed * failed));
    }).then(function () { inFlight = false; });
  }
  function schedule(delay) {
    clearTimeout(timer);
    timer = setTimeout(push, delay == null ? 1500 : delay);
  }

  Storage.prototype.setItem = function (key, value) {
    var track = this === window.localStorage && key === KEY;
    var before = track ? localStorage.getItem(KEY) : null;
    nativeSet.apply(this, arguments);
    if (!track || before === String(value)) return; // ничего не изменилось — отправлять нечего
    seq++;
    var meta = readMeta();
    meta.dirty = true;
    // Пока не сверились с сервером, время правки не продвигаем: иначе устаревшие данные устройства,
    // пересохранённые при запуске, «обогнали» бы более свежие данные с другого устройства.
    if (ready) meta.local_at = new Date().toISOString();
    if (meta.user == null) meta.user = userId;
    writeMeta(meta);
    schedule();
  };

  // Загрузчик не дождался сервера: сверяемся в фоне и ничего не отправляем, пока не сверимся
  var checks = 0;
  function reconcile() {
    if (ready) return;
    fetch(url, { method: 'GET', headers: headers(false) }).then(function (r) {
      return r.ok ? r.json() : Promise.reject(r.status);
    }).then(function (res) {
      var decision = window.GymSyncDecide(res, localStorage.getItem(KEY) != null, readMeta(), userId);
      try { sessionStorage.setItem(READY, 'ok'); } catch (e) {}
      if (decision === 'remote') {
        nativeSet.call(localStorage, KEY, JSON.stringify(res.state));
        writeMeta({ updated_at: res.updated_at, user: userId, dirty: false });
        location.reload(); // открыть приложение уже с данными с сервера
        return;
      }
      ready = true;
      if (decision === 'push') { var m = readMeta(); m.dirty = true; writeMeta(m); }
      push();
    }).catch(function (status) {
      if (status === 401) return;
      checks++;
      setTimeout(reconcile, Math.min(30000, 3000 * checks));
    });
  }

  function flush() { clearTimeout(timer); push(); }
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') flush();
    else if (!ready) reconcile();
  });
  window.addEventListener('pagehide', flush);

  if (ready) { if (readMeta().dirty) schedule(300); } // досылаем то, что не успело уйти в прошлый раз
  else reconcile();
})();
