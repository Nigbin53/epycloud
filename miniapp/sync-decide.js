/* Общее правило «чьи данные взять» для загрузчика и синхронизации.
   remote — взять данные сервера; local — оставить данные устройства; push — оставить и отправить на сервер. */
window.GymSyncDecide = function (res, localHasData, meta, userId) {
  'use strict';
  if (!res || !res.state || !res.updated_at) return localHasData ? 'push' : 'local'; // на сервере пусто
  if (!localHasData) return 'remote';
  if (meta.user != null && userId != null && meta.user !== userId) return 'remote'; // другой аккаунт
  if (!meta.updated_at) return 'remote'; // устройство ещё ни разу не сверялось: сервер главнее
  var remote = Date.parse(res.updated_at) || 0;
  var synced = Date.parse(meta.updated_at) || 0;
  var local = meta.local_at ? Date.parse(meta.local_at) || 0 : 0;
  if (remote > synced) {
    // сервер менялся с другого устройства; локальные несохранённые правки побеждают, только если они новее
    return meta.dirty && local > remote ? 'push' : 'remote';
  }
  return meta.dirty ? 'push' : 'local';
};
