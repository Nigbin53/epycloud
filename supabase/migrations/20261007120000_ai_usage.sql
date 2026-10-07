-- Счётчик запросов к ИИ на пользователя в день: бережём бесплатный лимит Gemini.
create table if not exists public.ai_usage (
  telegram_id bigint not null references public.app_users (telegram_id) on delete cascade,
  day         date   not null default (now() at time zone 'utc')::date,
  count       integer not null default 0,
  primary key (telegram_id, day)
);
alter table public.ai_usage enable row level security;
revoke all on public.ai_usage from anon, authenticated;

-- Атомарно увеличивает счётчик и возвращает новое значение.
create or replace function public.ai_usage_hit(p_telegram_id bigint)
returns integer
language sql
security definer
set search_path = public
as $$
  insert into public.ai_usage (telegram_id, day, count)
  values (p_telegram_id, (now() at time zone 'utc')::date, 1)
  on conflict (telegram_id, day) do update set count = public.ai_usage.count + 1
  returning count;
$$;
revoke all on function public.ai_usage_hit(bigint) from public, anon, authenticated;
