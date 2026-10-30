-- New, separate inbox. Existing input_db rows and permissions are unchanged.
begin;
create table public.inquiries (
  id uuid primary key,
  message text not null check (char_length(btrim(message)) between 1 and 2000),
  email text check (email is null or (char_length(email) <= 254 and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$')),
  created_at timestamptz not null default now(),
  status text not null default 'received' check (status in ('received', 'reviewed', 'closed'))
);
alter table public.inquiries enable row level security;
revoke all on table public.inquiries from public, anon, authenticated;
grant insert (id, message, email) on table public.inquiries to anon, authenticated;
create policy "submit_inquiry" on public.inquiries for insert to anon, authenticated
  with check (char_length(btrim(message)) between 1 and 2000 and status = 'received');
comment on table public.inquiries is 'LINK ON contact inbox. Browser clients may submit only; no public read, update or delete. UUID preserves one submission across retries.';
commit;
