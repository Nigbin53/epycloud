-- Явно даём серверной роли доступ к таблицам и функции.
-- В новых проектах Supabase права для таблиц, созданных миграцией, выдаются не автоматически.
grant usage on schema public to service_role;
grant select, insert, update, delete on table public.app_users, public.user_state, public.ai_usage to service_role;
grant execute on function public.ai_usage_hit(bigint) to service_role;
