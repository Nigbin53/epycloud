// Подключение к базе от имени сервера.
// У новых проектов Supabase служебный ключ нового формата (sb_secret_…) лежит в SUPABASE_SECRET_KEYS,
// у старых — в SUPABASE_SERVICE_ROLE_KEY. Берём тот, что есть.
import { createClient } from "npm:@supabase/supabase-js@2";

export function serviceKey(): string {
  const raw = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (raw) {
    try {
      const keys = JSON.parse(raw) as Record<string, unknown>;
      const key = keys["default"] ?? Object.values(keys)[0];
      if (typeof key === "string" && key) return key;
    } catch { /* не JSON — пробуем старый ключ */ }
  }
  return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
}

export const db = createClient(Deno.env.get("SUPABASE_URL")!, serviceKey(), {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Код ошибки базы без подробностей — помогает понять причину по ответу, не раскрывая данных.
export function dbFail(where: string, error: { code?: string; message?: string } | null) {
  console.error(`[db] ${where}:`, error?.code, error?.message);
  return { error: "db_error", code: error?.code ?? null };
}
