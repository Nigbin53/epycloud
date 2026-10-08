// Webhook Telegram-бота. Показывает кнопку открытия мини-приложения.
// Переменные: BOT_TOKEN, WEBHOOK_SECRET, MINIAPP_URL (адрес на GitHub Pages).

const BOT_TOKEN = Deno.env.get("BOT_TOKEN") ?? "";
const WEBHOOK_SECRET = Deno.env.get("WEBHOOK_SECRET") ?? "";
const MINIAPP_URL = Deno.env.get("MINIAPP_URL") ?? "";

const WELCOME =
  "Gym Tracker — дневник тренировок.\n\n" +
  "Записывай вес на тренажёрах, следи за прогрессом, весом тела и питанием. Всё открывается в приложении:";

async function telegram(method: string, body: Record<string, unknown>) {
  const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) console.error(method, response.status, await response.text());
}

// Адрес мини-приложения с меткой: приложение откроется и сразу предложит добавить иконку на рабочий стол
function homeUrl(): string {
  return MINIAPP_URL + (MINIAPP_URL.includes("?") ? "&" : "?") + "a2hs=1";
}

function openButton() {
  return {
    inline_keyboard: [
      [{ text: "Открыть Gym Tracker", web_app: { url: MINIAPP_URL } }],
      [{ text: "📲 На рабочий стол", web_app: { url: homeUrl() } }],
    ],
  };
}

function homeButton() {
  return { inline_keyboard: [[{ text: "📲 На рабочий стол", web_app: { url: homeUrl() } }]] };
}

const HOME_TEXT =
  "Иконка на рабочем столе телефона открывает приложение в одно касание, без поиска чата.\n\n" +
  "Нажми кнопку ниже — Telegram покажет окно «Добавить на главный экран».";

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

Deno.serve(async (request) => {
  if (request.method !== "POST") return new Response("ok");
  if (!WEBHOOK_SECRET || !safeEqual(request.headers.get("x-telegram-bot-api-secret-token") ?? "", WEBHOOK_SECRET)) {
    return new Response("forbidden", { status: 403 });
  }

  let update: { message?: { chat?: { id: number; type?: string }; text?: string } };
  try {
    update = await request.json();
  } catch {
    return new Response("bad request", { status: 400 });
  }

  const message = update.message;
  if (message?.chat?.id && MINIAPP_URL.startsWith("https://")) {
    const text = (message.text ?? "").trim();
    if (text.startsWith("/home")) {
      await telegram("sendMessage", { chat_id: message.chat.id, text: HOME_TEXT, reply_markup: homeButton() });
    } else {
      const reply = text.startsWith("/help")
        ? "Нажми кнопку ниже — приложение откроется прямо в Telegram. Данные сохраняются в твоём аккаунте."
        : WELCOME;
      await telegram("sendMessage", { chat_id: message.chat.id, text: reply, reply_markup: openButton() });
    }
  }
  // Telegram должен получать 200, иначе будет повторять доставку
  return new Response("ok");
});
