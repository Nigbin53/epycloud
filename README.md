# Gym Tracker — релиз Telegram mini app

Что здесь лежит и как это связано:

```
Telegram  ──►  бот (Supabase Edge Function telegram-bot)  ──►  кнопка «Открыть»
                                                                      │
                          мини-приложение (GitHub Pages, папка miniapp/)
                                                                      │
                  сохранение данных ──► Supabase Edge Function state ──► таблицы app_users, user_state
```

| Папка | Что это |
|---|---|
| `miniapp/` | Готовая статика приложения (обе темы Black и White). Публикуется на GitHub Pages. |
| `miniapp-src/` | Загрузчик, синхронизация с сервером и настройки (`config.js`). |
| `supabase/` | Таблицы (миграция), функции `telegram-bot` и `state`, тесты проверки подписи Telegram. |
| `tools/` | `build_miniapp.py` — сборка из рабочей версии; `telegram-setup.sh` — настройка бота. |
| `.github/workflows/` | Автопубликация на GitHub Pages и (по желанию) автодеплой Supabase. |

Как работает хранение данных: пока человек в Telegram, приложение само отправляет его данные на сервер (через 1,5 с после изменения и при закрытии) и забирает их при запуске. Пользователь определяется по подписи Telegram, которую сервер проверяет. Пароли не нужны. Таблицы закрыты для прямого доступа, читать и писать может только функция `state`. Без сети приложение работает на локальных данных и догонит сервер позже.

## Что нужно сделать вам (один раз, ~15 минут)

Эти шаги требуют ваших аккаунтов и токенов, поэтому сделать их за вас нельзя.

### 1. Бот
1. В Telegram откройте @BotFather → `/newbot` → задайте имя и username. Получите **токен** (строка вида `123456:ABC…`). Никому не показывайте.

### 2. Supabase
1. На supabase.com создайте проект (регион поближе, запомните пароль базы).
2. Скопируйте **Project ref**: Project Settings → General → Reference ID (20 символов).
3. На компьютере установите CLI: `brew install supabase/tap/supabase`, затем `supabase login`.
4. В папке `08_release` выполните:
   ```bash
   supabase link --project-ref ВАШ_REF
   supabase db push
   export WEBHOOK_SECRET=$(openssl rand -hex 32); echo $WEBHOOK_SECRET   # сохраните это значение — понадобится в шаге 4
   supabase secrets set BOT_TOKEN=ТОКЕН_БОТА WEBHOOK_SECRET=$WEBHOOK_SECRET MINIAPP_URL=https://nigbin53.github.io/gym-tracker/ ALLOWED_ORIGIN=https://nigbin53.github.io
   supabase functions deploy state --no-verify-jwt
   supabase functions deploy telegram-bot --no-verify-jwt
   ```

### 3. GitHub
1. На github.com (аккаунт Nigbin53) создайте **пустой** репозиторий `gym-tracker`: без README, .gitignore и лицензии. Для бесплатного GitHub Pages он должен быть **public**, приватный требует платного тарифа. Секретов в репозитории нет: токены лежат только в Supabase.
2. В папке `08_release` уже есть готовый git-репозиторий с коммитом. Отправить его может Claude (после того как вы создадите пустой репозиторий) или вы сами:
   ```bash
   git remote add origin https://github.com/Nigbin53/gym-tracker.git
   git push -u origin main
   ```
3. Settings → Pages → Source: **GitHub Actions**. Через минуту приложение будет по адресу из `MINIAPP_URL`.

### 4. Свяжите всё
```bash
python3 tools/build_miniapp.py --project-ref ВАШ_REF   # впишет адрес сервера в приложение
git add -A && git commit -m "Подключён Supabase" && git push
PROJECT_REF=ВАШ_REF MINIAPP_URL=https://nigbin53.github.io/gym-tracker/ ./tools/telegram-setup.sh   # токен и секрет спросит сам
```
Откройте бота в Telegram, нажмите `/start` → «Открыть Gym Tracker».

## Как выпустить обновление
1. Правите рабочую версию в `06_web-version`.
2. `python3 tools/build_miniapp.py`
3. `git add -A && git commit -m "..." && git push`. GitHub Pages обновится сам.

Данные пользователей не затрагиваются. Если меняется схема данных приложения, нужна миграция состояния в самом приложении.

## Проверка
- Тест подписи Telegram: `node --experimental-strip-types --test supabase/functions/_shared/telegram.test.ts`
- Открыть локально: `cd miniapp && python3 -m http.server 8080`, затем http://localhost:8080 (вне Telegram работает на локальных данных).

## Как устроена синхронизация
- При запуске приложение сверяется с сервером. Если сервер не ответил, приложение работает на данных телефона и **ничего не отправляет**, пока не сверится. Так пустые данные нового телефона не затрут настоящие.
- Правки уходят на сервер через 1,5 с, а также при сворачивании. Если отправка не удалась, правка помечается и уйдёт при следующем запуске.
- Два устройства: побеждает более свежая правка. Устройство, которое ещё ни разу не сверялось, всегда берёт данные сервера.
- Экспорт CSV/JSON в Telegram приходит файлом в чат с ботом.

## Известные ограничения
- Состояние пользователя хранится одним JSON (до 6 МБ). Фото из галереи сохраняются внутри него; при нехватке памяти у старых записей еды убираются фото.
- Для чистой сборки удалите папку `miniapp/` перед `build_miniapp.py`: скрипт сам ничего не удаляет.
- Загрузка фото тренажёров через локальный сервер (`serve.py`) в мини-приложении не работает. Фото каталога вшиваются при сборке; у тренажёров без своего фото показывается заглушка.
- Список тренажёров и экран «Тренировка» в рабочем приложении ещё в старой раскладке, а утверждённый вариант с «Избранным» сейчас только на Карте экранов. Нужно перенести перед публичным релизом.
- Напоминания и push из бота не подключены (отложены по вашему решению).
