#!/usr/bin/env bash
# Обновить сервер после изменений: таблицы + три функции.  Запуск:  bash tools/update-server.sh
set -euo pipefail
cd "$(dirname "$0")/.."
export PATH="$HOME/.local/bin:$PATH"
echo "→ таблицы"; supabase db push
echo "→ функции"; for f in state telegram-bot food-ai; do supabase functions deploy "$f" --no-verify-jwt --use-api; done
echo "Сервер обновлён."
