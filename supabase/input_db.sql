-- Run once in this project's SQL Editor. If input_db already exists, inspect it first.
begin;

create table public.input_db (
  id bigint generated always as identity primary key,
  input text not null check (char_length(btrim(input)) between 1 and 1000),
  created_at timestamptz not null default now()
);

alter table public.input_db enable row level security;
revoke all on table public.input_db from public, anon, authenticated;
revoke all on sequence public.input_db_id_seq from public, anon, authenticated;
grant usage on schema public to anon, authenticated;
grant insert (input) on table public.input_db to anon, authenticated;
grant usage on sequence public.input_db_id_seq to anon, authenticated;

create policy "practice_insert_only"
  on public.input_db for insert
  to anon, authenticated
  with check (char_length(btrim(input)) between 1 and 1000);

comment on table public.input_db is 'Classroom input-save exercise. Browser clients may INSERT input only; no read, update or delete access.';
commit;
