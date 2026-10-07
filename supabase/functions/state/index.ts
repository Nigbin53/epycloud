// API состояния приложения.
//   GET  /functions/v1/state  → { state, updated_at } (state = null, если пользователь новый)
//   PUT  /functions/v1/state  → тело { state: {...} }, сохраняет и возвращает { updated_at }
//   POST /functions/v1/state  → тело { export: { filename, content } }, бот присылает файл в чат пользователю
// Пользователь определяется по подписанным данным Telegram в заголовке X-Telegram-Init-Data.
import { db as supabase, dbFail } from "../_shared/db.ts";
import { verifyInitData } from "../_shared/telegram.ts";
import { corsHeaders, json } from "../_shared/cors.ts";

const MAX_BODY_BYTES = 6 * 1024 * 1024; // в состоянии бывают фото в base64


Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(request) });
  if (!["GET", "PUT", "POST"].includes(request.method)) return json(request, { error: "method_not_allowed" }, 405);

  const botToken = Deno.env.get("BOT_TOKEN") ?? "";
  const user = await verifyInitData(request.headers.get("x-telegram-init-data") ?? "", botToken);
  if (!user) return json(request, { error: "unauthorized" }, 401);

  if (request.method === "GET") {
    const { data, error } = await supabase
      .from("user_state")
      .select("state, updated_at")
      .eq("telegram_id", user.id)
      .maybeSingle();
    if (error) return json(request, dbFail("state get", error), 500);
    await touchUser(user);
    return json(request, data ? { state: data.state, updated_at: data.updated_at } : { state: null, updated_at: null });
  }

  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > MAX_BODY_BYTES) return json(request, { error: "too_large" }, 413);
  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) return json(request, { error: "too_large" }, 413);

  let payload: { state?: unknown; export?: { filename?: unknown; content?: unknown } };
  try {
    payload = JSON.parse(text);
  } catch {
    return json(request, { error: "bad_json" }, 400);
  }

  if (request.method === "POST") return sendExport(request, user.id, payload.export, botToken);
  const state = payload.state;
  if (!state || typeof state !== "object" || Array.isArray(state)) return json(request, { error: "bad_state" }, 400);

  await touchUser(user);
  const updatedAt = new Date().toISOString();
  const { error } = await supabase
    .from("user_state")
    .upsert({ telegram_id: user.id, state, updated_at: updatedAt }, { onConflict: "telegram_id" });
  if (error) return json(request, dbFail("state put", error), 500);
  return json(request, { ok: true, updated_at: updatedAt });
});

async function touchUser(user: { id: number; first_name?: string; username?: string; language_code?: string }) {
  const { error } = await supabase.from("app_users").upsert(
    {
      telegram_id: user.id,
      first_name: user.first_name ?? null,
      username: user.username ?? null,
      language_code: user.language_code ?? null,
      last_seen_at: new Date().toISOString(),
    },
    { onConflict: "telegram_id" },
  );
  if (error) dbFail("touch user", error);
}

// Экспорт: обычное скачивание файла внутри Telegram не работает, поэтому файл присылает бот.
async function sendExport(
  request: Request,
  chatId: number,
  file: { filename?: unknown; content?: unknown } | undefined,
  botToken: string,
): Promise<Response> {
  const name = typeof file?.filename === "string" ? file.filename : "";
  const content = typeof file?.content === "string" ? file.content : "";
  if (!/^[\w.\-]{1,80}\.(csv|json)$/.test(name) || !content) return json(request, { error: "bad_export" }, 400);
  const form = new FormData();
  form.append("chat_id", String(chatId));
  form.append("caption", "Экспорт данных Gym Tracker");
  const type = name.endsWith(".json") ? "application/json" : "text/csv";
  form.append("document", new Blob([content], { type: `${type};charset=utf-8` }), name);
  const response = await fetch(`https://api.telegram.org/bot${botToken}/sendDocument`, { method: "POST", body: form });
  if (!response.ok) {
    // чаще всего: пользователь ещё не запускал бота (403) — бот не может написать первым
    return json(request, { error: "telegram_send_failed", status: response.status }, 502);
  }
  return json(request, { ok: true });
}
