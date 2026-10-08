#!/usr/bin/env bash
# Обновить сервер после изменений: таблицы + три функции.  Запуск:  bash tools/update-server.sh
set -euo pipefail
cd "$(dirname "$0")/.."
export PATH="$HOME/.local/bin:$PATH"
echo "→ таблицы"; supabase db push
echo "→ функции"; for f in state telegram-bot food-ai; do supabase functions deploy "$f" --no-verify-jwt --use-api; done
# команды и кнопка меню бота (токен берётся из .env, в git его нет)
REF=$(cat supabase/.temp/project-ref 2>/dev/null || true)
if [ -n "$REF" ] && [ -f .env ]; then
  set -a; . ./.env; set +a
  echo "→ команды бота"; PROJECT_REF="$REF" MINIAPP_URL="${MINIAPP_URL:-https://nigbin53.github.io/epycloud/}" bash tools/telegram-setup.sh
fi
echo "Сервер обновлён."
