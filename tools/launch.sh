#!/usr/bin/env bash
# Полный запуск одной командой:  bash tools/launch.sh ВАШ_PROJECT_REF
# Берёт BOT_TOKEN и GEMINI_API_KEY из .env (файл не попадает в git), создаёт WEBHOOK_SECRET,
# настраивает Supabase, публикует функции, вписывает адрес сервера в приложение, пушит и подключает бота.
set -euo pipefail
cd "$(dirname "$0")/.."
REF="${1:?Укажите Project ref: bash tools/launch.sh ВАШ_REF}"
MINIAPP_URL="https://nigbin53.github.io/epycloud/"
command -v supabase >/dev/null || { echo "Нет Supabase CLI. Установите его (см. README) и выполните supabase login"; exit 1; }
[ -f .env ] || { echo "Нет файла .env"; exit 1; }
grep -q '^BOT_TOKEN=' .env || { echo "В .env нет BOT_TOKEN"; exit 1; }
grep -q '^WEBHOOK_SECRET=' .env || echo "WEBHOOK_SECRET=$(openssl rand -hex 32)" >> .env
grep -q '^MINIAPP_URL=' .env || echo "MINIAPP_URL=$MINIAPP_URL" >> .env
grep -q '^ALLOWED_ORIGIN=' .env || echo "ALLOWED_ORIGIN=https://nigbin53.github.io" >> .env
set -a; . ./.env; set +a

echo "→ 1/6 связываю с проектом Supabase (может спросить пароль базы)"
supabase link --project-ref "$REF"
echo "→ 2/6 создаю таблицы"
supabase db push
echo "→ 3/6 передаю секреты"
supabase secrets set --env-file .env
echo "→ 4/6 публикую функции"
for f in state telegram-bot food-ai; do supabase functions deploy "$f" --no-verify-jwt --use-api; done
echo "→ 5/6 вписываю адрес сервера в приложение и отправляю на GitHub"
python3 tools/build_miniapp.py --project-ref "$REF"
git add -A
git commit -m "Подключён Supabase" || true
git push
echo "→ 6/6 подключаю бота"
PROJECT_REF="$REF" MINIAPP_URL="$MINIAPP_URL" bash tools/telegram-setup.sh
echo "Готово. Через 3–5 минут (пока GitHub опубликует) откройте бота в Telegram и нажмите /start."
