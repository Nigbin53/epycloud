#!/usr/bin/env bash
# Одноразовая настройка бота в Telegram: вебхук, команды и кнопка меню.
# Запуск:  PROJECT_REF=... MINIAPP_URL=... ./tools/telegram-setup.sh   (токен и секрет спросит)
set -euo pipefail
# Токен и секрет можно не писать в команде (чтобы они не остались в истории терминала) — скрипт спросит сам.
if [ -z "${BOT_TOKEN:-}" ]; then read -rsp "Токен бота: " BOT_TOKEN; echo; fi
if [ -z "${WEBHOOK_SECRET:-}" ]; then read -rsp "WEBHOOK_SECRET (тот же, что в Supabase): " WEBHOOK_SECRET; echo; fi
: "${BOT_TOKEN:?нужен BOT_TOKEN}" "${WEBHOOK_SECRET:?нужен WEBHOOK_SECRET}" "${PROJECT_REF:?нужен PROJECT_REF}" "${MINIAPP_URL:?нужен MINIAPP_URL}"
API="https://api.telegram.org/bot${BOT_TOKEN}"
WEBHOOK="https://${PROJECT_REF}.supabase.co/functions/v1/telegram-bot"

echo "→ вебхук"
curl -fsS "${API}/setWebhook" \
  --data-urlencode "url=${WEBHOOK}" \
  --data-urlencode "secret_token=${WEBHOOK_SECRET}" \
  --data-urlencode 'allowed_updates=["message"]'
echo
echo "→ команды"
curl -fsS "${API}/setMyCommands" \
  --data-urlencode 'commands=[{"command":"start","description":"Открыть Gym Tracker"},{"command":"home","description":"Иконка на рабочий стол"},{"command":"help","description":"Как это работает"}]'
echo
echo "→ кнопка меню (открывает приложение)"
curl -fsS "${API}/setChatMenuButton" \
  --data-urlencode "menu_button={\"type\":\"web_app\",\"text\":\"Открыть\",\"web_app\":{\"url\":\"${MINIAPP_URL}\"}}"
echo
echo "Готово."
