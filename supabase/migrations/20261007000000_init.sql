-- Gym Tracker: пользователи Telegram и их состояние приложения.
-- Доступ к таблицам только через Edge Functions (service role): RLS включена и политик нет,
-- поэтому ни anon-, ни authenticated-ключ ничего не читает и не пишет напрямую.

create table if not exists public.app_users (
  telegram_id    bigint primary key,
  first_name     text,
  username       text,
  language_code  text,
  created_at     timestamptz not null default now(),
  last_seen_at   timestamptz not null default now()
);

create table if not exists public.user_state (
  telegram_id  bigint primary key references public.app_users (telegram_id) on delete cascade,
  state        jsonb not null,
  updated_at   timestamptz not null default now(),
  created_at   timestamptz not null default now(),
  constraint user_state_is_object check (jsonb_typeof(state) = 'object')
);

alter table public.app_users  enable row level security;
alter table public.user_state enable row level security;

revoke all on public.app_users  from anon, authenticated;
revoke all on public.user_state from anon, authenticated;

comment on table public.app_users  is 'Пользователи Telegram, открывавшие мини-приложение.';
comment on table public.user_state is 'Полное состояние приложения (тренажёры, вес, питание, настройки) одним JSON на пользователя.';
