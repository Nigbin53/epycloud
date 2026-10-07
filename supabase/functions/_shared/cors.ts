// CORS для мини-приложения. ALLOWED_ORIGIN — адреса через запятую, например
// "https://имя.github.io". Если переменная не задана, разрешены все адреса:
// это безопасно, потому что доступ к данным определяет подпись Telegram, а не cookie.

export function corsHeaders(request: Request): Record<string, string> {
  const allowed = (Deno.env.get("ALLOWED_ORIGIN") ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  const origin = request.headers.get("origin") ?? "";
  const allowOrigin = allowed.length === 0 ? "*" : allowed.includes(origin) ? origin : allowed[0];
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET, PUT, POST, OPTIONS",
    "Access-Control-Allow-Headers": "content-type, x-telegram-init-data, authorization, apikey",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

export function json(request: Request, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(request), "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
}
