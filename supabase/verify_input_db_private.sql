-- Run in SQL Editor after input_db_private.sql. Tests roll back all test data.
begin;
select set_config('test.owner_a', gen_random_uuid()::text, true);
select set_config('test.owner_b', gen_random_uuid()::text, true);
insert into auth.users (id, aud, role, email) values
  (current_setting('test.owner_a')::uuid, 'authenticated', 'authenticated', current_setting('test.owner_a') || '@example.invalid'),
  (current_setting('test.owner_b')::uuid, 'authenticated', 'authenticated', current_setting('test.owner_b') || '@example.invalid');
set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('test.owner_a'), true);
insert into public.input_db (input) values ('private-policy-owner-A');
do $$ begin
  if (select count(*) from public.input_db) <> 1 then raise exception 'Owner A can see other rows'; end if;
end $$;
select set_config('request.jwt.claim.sub', current_setting('test.owner_b'), true);
do $$ begin
  if (select count(*) from public.input_db) <> 0 then raise exception 'Owner B can see owner A or legacy rows'; end if;
end $$;
insert into public.input_db (input) values ('private-policy-owner-B');
do $$ begin
  if (select count(*) from public.input_db) <> 1 then raise exception 'Owner B cannot read own row'; end if;
  begin
    insert into public.input_db (input, user_id) values ('spoof', current_setting('test.owner_a')::uuid);
    raise exception 'Owner spoof unexpectedly allowed';
  exception when insufficient_privilege then null; end;
  begin
    update public.input_db set input = 'changed';
    raise exception 'UPDATE unexpectedly allowed';
  exception when insufficient_privilege then null; end;
  begin
    delete from public.input_db;
    raise exception 'DELETE unexpectedly allowed';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.input_db (input) values ('   ');
    raise exception 'Blank input unexpectedly allowed';
  exception when insufficient_privilege or check_violation then null; end;
  begin
    insert into public.input_db (input) values (repeat('x', 1001));
    raise exception 'Long input unexpectedly allowed';
  exception when insufficient_privilege or check_violation then null; end;
end $$;
select set_config('request.jwt.claim.sub', current_setting('test.owner_a'), true);
do $$ begin
  if (select count(*) from public.input_db) <> 1 or not exists (select 1 from public.input_db where input = 'private-policy-owner-A') then
    raise exception 'Owner A isolation failed after owner B write';
  end if;
end $$;
rollback;
select 'PASS: own INSERT/SELECT, cross-user and legacy isolation, owner spoof blocked, UPDATE/DELETE blocked, input constraints; test rows rolled back' as verification;
