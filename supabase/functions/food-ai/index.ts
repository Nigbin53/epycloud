// Распознавание еды через Gemini (бесплатный тариф Google AI Studio).
//   POST /functions/v1/food-ai  { mode: "food" | "label", image: "data:image/jpeg;base64,..." }
//   POST /functions/v1/food-ai  { mode: "text", text: "гречка с курицей и огурец" }
// Ответ: { dish, items: [{ name, grams, kcal, protein, fat, carbs }] } — значения на указанную порцию.
// Переменные: BOT_TOKEN, GEMINI_API_KEY, GEMINI_MODEL (по умолчанию gemini-2.5-flash), AI_DAILY_LIMIT (по умолчанию 40).
import { createClient } from "npm:@supabase/supabase-js@2";
import { verifyInitData } from "../_shared/telegram.ts";
import { corsHeaders, json } from "../_shared/cors.ts";

const MAX_BODY_BYTES = 3 * 1024 * 1024;
const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false },
});

const COMMON =
  "Ты помощник дневника питания. Отвечай только JSON по схеме. Названия продуктов — по-русски, коротко. " +
  "grams — масса порции в граммах; kcal, protein, fat, carbs — на эту порцию (не на 100 г). " +
  "Если не уверен, давай типичные средние значения. Не выдумывай продукты, которых нет.";
const PROMPTS: Record<string, string> = {
  food: COMMON + " На фото — еда. Определи блюдо (dish) и разложи его на основные продукты с примерной массой по виду порции.",
  label: COMMON + " На фото — упаковка или таблица пищевой ценности. Прочитай название продукта и значения на 100 г; " +
    "верни один продукт с grams = 100 и значениями на 100 г. dish — название продукта.",
  text: COMMON + " Пользователь описал словами, что съел. Разбери на продукты; если масса не указана, поставь обычную порцию.",
};
const SCHEMA = {
  type: "OBJECT",
  properties: {
    dish: { type: "STRING" },
    items: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          name: { type: "STRING" },
          grams: { type: "NUMBER" },
          kcal: { type: "NUMBER" },
          protein: { type: "NUMBER" },
          fat: { type: "NUMBER" },
          carbs: { type: "NUMBER" },
        },
        required: ["name", "grams", "kcal", "protein", "fat", "carbs"],
      },
    },
  },
  required: ["items"],
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(request) });
  if (request.method !== "POST") return json(request, { error: "method_not_allowed" }, 405);

  const user = await verifyInitData(request.headers.get("x-telegram-init-data") ?? "", Deno.env.get("BOT_TOKEN") ?? "");
  if (!user) return json(request, { error: "unauthorized" }, 401);
  const key = Deno.env.get("GEMINI_API_KEY") ?? "";
  if (!key) return json(request, { error: "ai_not_configured" }, 503);

  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) return json(request, { error: "too_large" }, 413);
  let body: { mode?: string; image?: string; text?: string };
  try {
    body = JSON.parse(text);
  } catch {
    return json(request, { error: "bad_json" }, 400);
  }
  const mode = body.mode === "label" || body.mode === "text" ? body.mode : "food";
  const parts: Record<string, unknown>[] = [{ text: PROMPTS[mode] }];
  if (mode === "text") {
    const phrase = String(body.text ?? "").trim().slice(0, 600);
    if (!phrase) return json(request, { error: "empty" }, 400);
    parts.push({ text: "Съел: " + phrase });
  } else {
    const match = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(String(body.image ?? ""));
    if (!match) return json(request, { error: "bad_image" }, 400);
    parts.push({ inline_data: { mime_type: match[1], data: match[2] } });
  }

  // Лимит на пользователя в день (по умолчанию 40) — чтобы один человек не съел весь бесплатный тариф
  await supabase.from("app_users").upsert(
    { telegram_id: user.id, first_name: user.first_name ?? null, username: user.username ?? null, last_seen_at: new Date().toISOString() },
    { onConflict: "telegram_id" },
  );
  const limit = Number(Deno.env.get("AI_DAILY_LIMIT") ?? 40);
  const { data: used, error: usageError } = await supabase.rpc("ai_usage_hit", { p_telegram_id: user.id });
  if (usageError) return json(request, { error: "db_error" }, 500);
  if (Number(used) > limit) return json(request, { error: "limit" }, 429);

  const model = Deno.env.get("GEMINI_MODEL") ?? "gemini-2.5-flash";
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({
      contents: [{ role: "user", parts }],
      generationConfig: { responseMimeType: "application/json", responseSchema: SCHEMA, temperature: 0.2 },
    }),
  });
  if (response.status === 429) return json(request, { error: "limit" }, 429);
  if (!response.ok) {
    console.error("gemini", response.status, (await response.text()).slice(0, 500));
    return json(request, { error: "ai_failed" }, 502);
  }
  const result = await response.json();
  const raw = result?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  let parsed: { dish?: unknown; items?: unknown };
  try {
    parsed = JSON.parse(raw);
  } catch {
    return json(request, { error: "ai_failed" }, 502);
  }
  return json(request, { dish: typeof parsed.dish === "string" ? parsed.dish.slice(0, 80) : null, items: cleanItems(parsed.items) });
});

function cleanItems(items: unknown) {
  if (!Array.isArray(items)) return [];
  const n = (v: unknown, max: number) => Math.max(0, Math.min(max, Math.round(Number(v) || 0)));
  return items.slice(0, 12).filter((it) => it && typeof it.name === "string" && it.name.trim()).map((it) => ({
    name: String(it.name).trim().slice(0, 80),
    grams: Math.max(1, n(it.grams, 2000)),
    kcal: n(it.kcal, 5000),
    protein: n(it.protein, 500),
    fat: n(it.fat, 500),
    carbs: n(it.carbs, 800),
  }));
}
