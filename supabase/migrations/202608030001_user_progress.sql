create table if not exists public.user_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null,
  schema_version integer not null default 2,
  revision bigint not null default 1 check (revision > 0),
  updated_at timestamptz not null default now()
);

alter table public.user_progress enable row level security;

create policy "Users can read their own progress"
on public.user_progress
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their own progress"
on public.user_progress
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their own progress"
on public.user_progress
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their own progress"
on public.user_progress
for delete
to authenticated
using ((select auth.uid()) = user_id);

create or replace function public.save_progress(
  new_payload jsonb,
  expected_revision bigint,
  new_schema_version integer default 2
)
returns table(revision bigint, updated_at timestamptz)
language plpgsql
security invoker
set search_path = ''
as $$
begin
  return query
  update public.user_progress
  set
    payload = new_payload,
    schema_version = new_schema_version,
    revision = public.user_progress.revision + 1,
    updated_at = now()
  where
    user_id = (select auth.uid())
    and public.user_progress.revision = expected_revision
  returning public.user_progress.revision, public.user_progress.updated_at;

  if not found then
    raise exception 'progress_revision_conflict' using errcode = '40001';
  end if;
end;
$$;

revoke all on function public.save_progress(jsonb, bigint, integer) from public;
grant execute on function public.save_progress(jsonb, bigint, integer) to authenticated;
