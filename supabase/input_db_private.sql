-- Apply after input_db.sql. Existing ownerless practice rows remain preserved
-- and invisible to browser users. Never assign historical rows by guesswork.
begin;
alter table public.input_db add column if not exists user_id uuid references auth.users(id) on delete set null;
alter table public.input_db alter column user_id set default auth.uid();
alter table public.input_db enable row level security;
revoke all on table public.input_db from public, anon, authenticated;
revoke all on sequence public.input_db_id_seq from public, anon, authenticated;
grant select (id, input, created_at) on table public.input_db to authenticated;
grant insert (input) on table public.input_db to authenticated;
grant usage on sequence public.input_db_id_seq to authenticated;
drop policy if exists "practice_insert_only" on public.input_db;
drop policy if exists "practice_read_public" on public.input_db;
drop policy if exists "practice_select_own" on public.input_db;
drop policy if exists "practice_insert_own" on public.input_db;
create policy "practice_select_own" on public.input_db for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "practice_insert_own" on public.input_db for insert to authenticated
  with check ((select auth.uid()) = user_id and char_length(btrim(input)) between 1 and 1000);
create index if not exists input_db_user_id_id_idx on public.input_db (user_id, id desc);
comment on table public.input_db is 'Private practice sentences: authenticated users may read and insert their own rows only. No browser update/delete. Historical ownerless rows are admin-only.';
commit;
