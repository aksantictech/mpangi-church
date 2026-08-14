-- Affectation explicite des responsables de département.
create table if not exists public.profile_department_assignments (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  church_id uuid not null references public.churches(id) on delete cascade,
  department_id uuid not null references public.departments(id) on delete cascade,
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles(id) on delete set null,
  primary key (profile_id, department_id)
);

create index if not exists profile_department_assignments_scope_idx
  on public.profile_department_assignments (church_id, profile_id);

alter table public.profile_department_assignments enable row level security;

drop policy if exists "profile department assignment church read"
  on public.profile_department_assignments;
create policy "profile department assignment church read"
on public.profile_department_assignments
for select to authenticated
using (
  profile_id in (select p.id from public.profiles p where p.user_id = auth.uid())
  or church_id in (
    select p.church_id from public.profiles p
    where p.user_id = auth.uid()
      and p.role in ('church_admin', 'admin_eglise', 'admin', 'pasteur_t', 'pastor')
  )
);

create or replace function public.enforce_profile_department_assignment_scope()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  profile_church uuid;
  department_church uuid;
begin
  select church_id into profile_church from public.profiles where id = new.profile_id;
  select church_id into department_church from public.departments where id = new.department_id;
  if profile_church is null or department_church is null
     or new.church_id <> profile_church
     or new.church_id <> department_church then
    raise exception 'Le compte et le département doivent appartenir à la même église.';
  end if;
  return new;
end;
$$;

drop trigger if exists profile_department_assignment_scope_guard
  on public.profile_department_assignments;
create trigger profile_department_assignment_scope_guard
before insert or update of profile_id, church_id, department_id
on public.profile_department_assignments
for each row execute function public.enforce_profile_department_assignment_scope();

revoke all on function public.enforce_profile_department_assignment_scope() from public;
revoke all on function public.enforce_profile_department_assignment_scope() from authenticated;
