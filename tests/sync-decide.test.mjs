// Запуск: node --test tests/sync-decide.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
globalThis.window = {};
new Function(readFileSync(new URL("../miniapp-src/sync-decide.js", import.meta.url), "utf8"))();
const decide = window.GymSyncDecide;
const R = (t) => ({ state: { x: 1 }, updated_at: t });

test("на сервере пусто: есть локальные данные — отправить, нет — ничего", () => {
  assert.equal(decide({ state: null, updated_at: null }, true, {}, 1), "push");
  assert.equal(decide(null, false, {}, 1), "local");
});
test("новое устройство без данных берёт сервер", () => {
  assert.equal(decide(R("2030-01-01T00:00:00Z"), false, {}, 1), "remote");
});
test("устройство ни разу не сверялось (стартовые данные) — сервер главнее, даже если правка новее", () => {
  assert.equal(decide(R("2030-01-01T00:00:00Z"), true, { dirty: true, local_at: "2031-01-01T00:00:00Z" }, 1), "remote");
});
test("другой аккаунт на устройстве — данные сервера", () => {
  assert.equal(decide(R("2030-01-01T00:00:00Z"), true, { user: 2, updated_at: "2031-01-01T00:00:00Z" }, 1), "remote");
});
test("сервер изменили с другого устройства, своих правок нет — сервер", () => {
  assert.equal(decide(R("2030-06-01T00:00:00Z"), true, { user: 1, updated_at: "2030-01-01T00:00:00Z", dirty: false }, 1), "remote");
});
test("конфликт: своя неотправленная правка новее серверной — отправить свою", () => {
  assert.equal(decide(R("2030-06-01T00:00:00Z"), true, { user: 1, updated_at: "2030-01-01T00:00:00Z", dirty: true, local_at: "2030-07-01T00:00:00Z" }, 1), "push");
});
test("конфликт: серверная правка новее неотправленной своей — сервер", () => {
  assert.equal(decide(R("2030-06-01T00:00:00Z"), true, { user: 1, updated_at: "2030-01-01T00:00:00Z", dirty: true, local_at: "2030-02-01T00:00:00Z" }, 1), "remote");
});
test("сервер не менялся: неотправленное — отправить, иначе оставить", () => {
  const meta = { user: 1, updated_at: "2030-01-01T00:00:00Z" };
  assert.equal(decide(R("2030-01-01T00:00:00Z"), true, { ...meta, dirty: true }, 1), "push");
  assert.equal(decide(R("2030-01-01T00:00:00Z"), true, { ...meta, dirty: false }, 1), "local");
});
