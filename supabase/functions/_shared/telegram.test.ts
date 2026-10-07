// Запуск: node --experimental-strip-types --test supabase/functions/_shared/telegram.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { verifyInitData } from "./telegram.ts";

const TOKEN = "123456:TEST-TOKEN";

// Независимая реализация подписи по документации Telegram (на node:crypto)
function sign(fields: Record<string, string>, token = TOKEN): string {
  const check = Object.entries(fields).sort(([a], [b]) => (a < b ? -1 : 1)).map(([k, v]) => `${k}=${v}`).join("\n");
  const secret = createHmac("sha256", "WebAppData").update(token).digest();
  const hash = createHmac("sha256", secret).update(check).digest("hex");
  return new URLSearchParams({ ...fields, hash }).toString();
}

const NOW = 1_800_000_000;
const user = JSON.stringify({ id: 4242, first_name: "Епи", username: "epy", language_code: "ru" });
const fresh = () => ({ auth_date: String(NOW - 60), query_id: "AAH", user });

test("верная подпись принимается", async () => {
  const result = await verifyInitData(sign(fresh()), TOKEN, 86400, NOW);
  assert.equal(result?.id, 4242);
  assert.equal(result?.first_name, "Епи");
});

test("чужой токен бота отклоняется", async () => {
  assert.equal(await verifyInitData(sign(fresh(), "999:OTHER"), TOKEN, 86400, NOW), null);
});

test("изменённые данные отклоняются", async () => {
  const forged = sign(fresh()).replace("4242", "1");
  assert.equal(await verifyInitData(forged, TOKEN, 86400, NOW), null);
});

test("просроченные данные отклоняются", async () => {
  const old = sign({ ...fresh(), auth_date: String(NOW - 90_000) });
  assert.equal(await verifyInitData(old, TOKEN, 86400, NOW), null);
});

test("дата из будущего отклоняется", async () => {
  const future = sign({ ...fresh(), auth_date: String(NOW + 3600) });
  assert.equal(await verifyInitData(future, TOKEN, 86400, NOW), null);
});

test("пустые данные, без hash и без токена отклоняются", async () => {
  assert.equal(await verifyInitData("", TOKEN, 86400, NOW), null);
  assert.equal(await verifyInitData("auth_date=1&user=%7B%7D", TOKEN, 86400, NOW), null);
  assert.equal(await verifyInitData(sign(fresh()), "", 86400, NOW), null);
});

test("без пользователя отклоняется", async () => {
  assert.equal(await verifyInitData(sign({ auth_date: String(NOW - 5), query_id: "x" }), TOKEN, 86400, NOW), null);
});
