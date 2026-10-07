/* Shared, filesystem-backed image library. No product state is stored here. */
(() => {
  'use strict';
  const base = new URL('../', document.currentScript.src);
  let catalog = {schema: 1, slots: []};
  let manifest = {schema: 1, revision: 0, items: {}};
  let machines = [];
  let fetching = null;
  const listeners = new Set();
  const channel = typeof BroadcastChannel === 'function' ? new BroadcastChannel('gym-equipment-v1') : null;
  const absolute = path => new URL(path, base).href;
  function changed() {
    listeners.forEach(fn => { try { fn(); } catch (error) { console.error(error); } });
    window.dispatchEvent(new Event('gym-equipment:change'));
  }
  async function readOptional(path) {
    try { const response = await fetch(absolute(path), {cache: 'no-store'}); return response.ok ? response.json() : null; }
    catch (_) { return null; }
  }
  async function read(path) {
    const response = await fetch(absolute(path), {cache: 'no-store'});
    if (!response.ok) throw new Error('Библиотека фотографий недоступна. Обновите страницу.');
    return response.json();
  }
  function validState(value) { return value?.schema === 1 && value.items && typeof value.items === 'object' && !Array.isArray(value.items) && Number.isInteger(value.revision) && value.revision >= 0; }
  async function refresh() {
    if (fetching) return fetching;
    fetching = (async () => {
      const [nextCatalog, nextManifest, nextMachines] = await Promise.all([read('equipment/catalog.json'), read('equipment/overrides.json'), readOptional('equipment/machines.json')]);
      if (nextCatalog.schema !== 1 || !Array.isArray(nextCatalog.slots) || !validState(nextManifest)) throw new Error('Не удалось прочитать библиотеку фотографий.');
      const newer = nextManifest.revision >= manifest.revision;
      const listed = Array.isArray(nextMachines?.machines) ? nextMachines.machines : machines;
      const different = JSON.stringify(catalog) !== JSON.stringify(nextCatalog) || JSON.stringify(machines) !== JSON.stringify(listed) || newer && JSON.stringify(manifest) !== JSON.stringify(nextManifest);
      catalog = nextCatalog;
      machines = listed;
      if (newer) manifest = nextManifest;
      if (different) changed();
      return manifest;
    })().finally(() => { fetching = null; });
    return fetching;
  }
  function current(key) { return manifest.items[key] || null; }
  function resolve(key) {
    const path = current(key)?.url || catalog.slots.find(slot => slot.key === key)?.defaultUrl;
    return path ? absolute(path) : null;
  }
  /* Тренажёр приложения (по названию) → свой слот фото, если фото есть; иначе прежний общий слот. */
  function slugFor(name) {
    const wanted = String(name || '').trim().toLowerCase();
    return wanted ? machines.find(item => String(item.name).trim().toLowerCase() === wanted)?.slug || null : null;
  }
  function hasPhoto(key) { return !!(current(key) || catalog.slots.find(slot => slot.key === key)?.defaultUrl); }
  /* Собственное фото тренажёра для экрана или null — без подмены фото другого тренажёра. */
  function ownKey(name, screen, theme) {
    const slug = slugFor(name);
    const key = slug ? slug + '/' + screen + '/' + theme : null;
    return key && hasPhoto(key) ? key : null;
  }
  /* Заглушка, пока у тренажёра нет своего фото: графит и гантель (как в утверждённом дизайне). */
  function placeholder(theme) {
    const white = theme === 'white';
    const a = white ? '#dcdbd6' : '#1b1c1f', b = white ? '#c9c8c2' : '#36373b', ink = white ? '#ff510c' : '#fcfcfc';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="400" height="260" fill="url(#g)"/><g transform="translate(134 110)" fill="${ink}" opacity="${white ? '.85' : '.55'}"><rect x="28" y="17" width="76" height="6" rx="3"/><rect x="12" y="0" width="14" height="40" rx="4"/><rect x="106" y="0" width="14" height="40" rx="4"/><rect x="0" y="8" width="10" height="24" rx="3"/><rect x="122" y="8" width="10" height="24" rx="3"/></g></svg>`;
    return 'data:image/svg+xml,' + encodeURIComponent(svg);
  }
  function photoKey(name, fallback, screen, theme) {
    const slug = slugFor(name);
    const own = slug ? slug + '/' + screen + '/' + theme : null;
    return own && hasPhoto(own) ? own : fallback + '/' + screen + '/' + theme;
  }
  async function write(action, body) {
    let response;
    try { response = await fetch(absolute('equipment/api/' + action), {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body)}); }
    catch (_) { throw new Error('Не удалось сохранить фото. Проверьте, что локальный сайт запущен.'); }
    let value;
    try { value = await response.json(); }
    catch (_) { throw new Error('Замена фото доступна при запуске сайта через serve.py.'); }
    if (!response.ok) throw new Error(value.error || 'Не удалось сохранить фото.');
    if (!validState(value)) throw new Error('Сервер не подтвердил сохранение фото.');
    if (value.revision >= manifest.revision) { manifest = value; changed(); }
    channel?.postMessage({revision: value.revision});
    return manifest;
  }
  async function save(key, file) {
    if (!catalog.slots.some(slot => slot.key === key)) throw new Error('Такого фото нет в библиотеке.');
    if (!file || !file.size || file.size > 25 * 1024 * 1024) throw new Error('Выберите изображение размером до 25 МБ.');
    const data = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(',')[1]);
      reader.onerror = () => reject(new Error('Не удалось прочитать выбранный файл.'));
      reader.readAsDataURL(file);
    });
    return write('save', {key, filename: file.name, mime: file.type, data});
  }
  const ready = refresh();
  // Frames may start before the preview server is ready. Defaults still render.
  ready.catch(() => {});
  window.GymEquipment = {
    ready, refresh, resolve, current,
    getCatalog: () => catalog,
    getManifest: () => manifest,
    getMachines: () => machines,
    slugFor, hasPhoto, photoKey, ownKey, placeholder,
    save, reset: key => write('reset', {key}),
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }
  };
  channel?.addEventListener('message', () => refresh().catch(() => {}));
  window.addEventListener('focus', () => refresh().catch(() => {}));
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh().catch(() => {}); });
  // Cross-browser changes reach visible comparison frames without reloading them.
  setInterval(() => { if (!document.hidden) refresh().catch(() => {}); }, 5000);
})();
