begin;

create extension if not exists pgcrypto;

create or replace function public.ministry_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create table if not exists public.ministry_groups (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  name text not null,
  group_type text not null default 'cellule'
    check (group_type in ('cellule', 'discipulat', 'priere', 'jeunesse', 'famille', 'autre')),
  description text,
  meeting_day smallint check (meeting_day between 0 and 6),
  meeting_time time,
  meeting_location text,
  capacity integer check (capacity is null or capacity between 1 and 5000),
  leader_profile_id uuid references public.profiles(id) on delete set null,
  status text not null default 'active' check (status in ('active', 'paused', 'archived')),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ministry_group_members (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  group_id uuid not null references public.ministry_groups(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  member_role text not null default 'member' check (member_role in ('leader', 'assistant', 'host', 'member')),
  status text not null default 'active' check (status in ('active', 'paused', 'left')),
  joined_at date not null default current_date,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ministry_group_members_unique unique (group_id, member_id)
);

create table if not exists public.ministry_group_meetings (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  group_id uuid not null references public.ministry_groups(id) on delete cascade,
  starts_at timestamptz not null,
  location text,
  topic text,
  notes text,
  status text not null default 'planned' check (status in ('planned', 'completed', 'cancelled')),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ministry_group_attendance (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  meeting_id uuid not null references public.ministry_group_meetings(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  status text not null default 'present' check (status in ('present', 'absent', 'excused')),
  checked_at timestamptz not null default now(),
  created_by uuid references public.profiles(id) on delete set null,
  constraint ministry_group_attendance_unique unique (meeting_id, member_id)
);

create table if not exists public.people_flows (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  name text not null,
  description text,
  trigger_type text not null default 'manual'
    check (trigger_type in ('manual', 'new_member', 'new_convert', 'absence', 'request')),
  status text not null default 'active' check (status in ('draft', 'active', 'paused', 'archived')),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.people_flow_steps (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  flow_id uuid not null references public.people_flows(id) on delete cascade,
  name text not null,
  description text,
  position integer not null check (position between 1 and 100),
  due_after_days integer not null default 0 check (due_after_days between 0 and 3650),
  owner_role text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint people_flow_steps_unique unique (flow_id, position)
);

create table if not exists public.people_flow_entries (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  flow_id uuid not null references public.people_flows(id) on delete cascade,
  member_id uuid references public.members(id) on delete cascade,
  soul_intake_id uuid references public.soul_intakes(id) on delete set null,
  display_name text,
  current_step_id uuid references public.people_flow_steps(id) on delete set null,
  assigned_profile_id uuid references public.profiles(id) on delete set null,
  status text not null default 'active' check (status in ('active', 'completed', 'paused', 'cancelled')),
  started_at timestamptz not null default now(),
  next_action_at timestamptz,
  completed_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint people_flow_entry_person_check check (member_id is not null or soul_intake_id is not null or display_name is not null)
);

create unique index if not exists people_flow_entries_member_unique
  on public.people_flow_entries(flow_id, member_id)
  where member_id is not null and status in ('active', 'paused');

create table if not exists public.people_flow_history (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  entry_id uuid not null references public.people_flow_entries(id) on delete cascade,
  from_step_id uuid references public.people_flow_steps(id) on delete set null,
  to_step_id uuid references public.people_flow_steps(id) on delete set null,
  note text,
  changed_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.service_plans (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  title text not null,
  service_type text not null default 'culte'
    check (service_type in ('culte', 'priere', 'conference', 'jeunesse', 'repetition', 'autre')),
  starts_at timestamptz not null,
  ends_at timestamptz,
  location text,
  notes text,
  status text not null default 'draft' check (status in ('draft', 'published', 'completed', 'cancelled')),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint service_plan_dates_check check (ends_at is null or ends_at > starts_at)
);

create table if not exists public.service_positions (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  service_plan_id uuid not null references public.service_plans(id) on delete cascade,
  name text not null,
  required_count integer not null default 1 check (required_count between 1 and 500),
  position integer not null default 1 check (position between 1 and 500),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.service_assignments (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  service_plan_id uuid not null references public.service_plans(id) on delete cascade,
  position_id uuid not null references public.service_positions(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'declined', 'checked_in', 'absent')),
  note text,
  assigned_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint service_assignment_unique unique (position_id, member_id)
);

create index if not exists ministry_groups_church_status_idx on public.ministry_groups(church_id, status, name);
create index if not exists ministry_group_members_church_group_idx on public.ministry_group_members(church_id, group_id, status);
create index if not exists ministry_group_meetings_church_date_idx on public.ministry_group_meetings(church_id, starts_at desc);
create index if not exists people_flows_church_status_idx on public.people_flows(church_id, status, name);
create index if not exists people_flow_steps_flow_idx on public.people_flow_steps(church_id, flow_id, position);
create index if not exists people_flow_entries_church_flow_idx on public.people_flow_entries(church_id, flow_id, status);
create index if not exists people_flow_entries_next_action_idx on public.people_flow_entries(church_id, next_action_at) where status = 'active';
create index if not exists service_plans_church_date_idx on public.service_plans(church_id, starts_at desc);
create index if not exists service_positions_plan_idx on public.service_positions(church_id, service_plan_id, position);
create index if not exists service_assignments_plan_idx on public.service_assignments(church_id, service_plan_id, status);

create or replace function public.ministry_validate_tenant_reference()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  reference_id uuid;
  reference_is_valid boolean;
begin
  reference_id := nullif(to_jsonb(new) ->> tg_argv[1], '')::uuid;
  if reference_id is null then
    return new;
  end if;

  execute format(
    'select exists(select 1 from public.%I where id = $1 and church_id = $2)',
    tg_argv[0]
  ) into reference_is_valid using reference_id, new.church_id;

  if not reference_is_valid then
    raise exception 'Référence inter-église refusée pour %.%', tg_table_name, tg_argv[1]
      using errcode = '23514';
  end if;

  return new;
end;
$$;

do $$
declare
  relation record;
begin
  for relation in
    select * from (values
      ('ministry_group_members', 'ministry_groups', 'group_id'),
      ('ministry_group_members', 'members', 'member_id'),
      ('ministry_group_meetings', 'ministry_groups', 'group_id'),
      ('ministry_group_attendance', 'ministry_group_meetings', 'meeting_id'),
      ('ministry_group_attendance', 'members', 'member_id'),
      ('people_flow_steps', 'people_flows', 'flow_id'),
      ('people_flow_entries', 'people_flows', 'flow_id'),
      ('people_flow_entries', 'members', 'member_id'),
      ('people_flow_entries', 'soul_intakes', 'soul_intake_id'),
      ('people_flow_history', 'people_flow_entries', 'entry_id'),
      ('service_positions', 'service_plans', 'service_plan_id'),
      ('service_assignments', 'service_plans', 'service_plan_id'),
      ('service_assignments', 'service_positions', 'position_id'),
      ('service_assignments', 'members', 'member_id')
    ) as refs(child_table, parent_table, reference_column)
  loop
    execute format(
      'drop trigger if exists ministry_tenant_%I on public.%I',
      relation.reference_column,
      relation.child_table
    );
    execute format(
      'create trigger ministry_tenant_%I before insert or update on public.%I for each row execute function public.ministry_validate_tenant_reference(%L, %L)',
      relation.reference_column,
      relation.child_table,
      relation.parent_table,
      relation.reference_column
    );
  end loop;
end $$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'ministry_groups', 'ministry_group_members', 'ministry_group_meetings',
    'people_flows', 'people_flow_steps', 'people_flow_entries',
    'service_plans', 'service_positions', 'service_assignments'
  ] loop
    execute format('drop trigger if exists ministry_updated_at on public.%I', table_name);
    execute format('create trigger ministry_updated_at before update on public.%I for each row execute function public.ministry_set_updated_at()', table_name);
  end loop;
end $$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'ministry_groups', 'ministry_group_members', 'ministry_group_meetings',
    'ministry_group_attendance', 'people_flows', 'people_flow_steps',
    'people_flow_entries', 'people_flow_history', 'service_plans',
    'service_positions', 'service_assignments'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('drop policy if exists ministry_tenant_access on public.%I', table_name);
    execute format(
      'create policy ministry_tenant_access on public.%I for all to authenticated using (church_id in (select p.church_id from public.profiles p where p.user_id = auth.uid())) with check (church_id in (select p.church_id from public.profiles p where p.user_id = auth.uid()))',
      table_name
    );
  end loop;
end $$;

insert into public.app_modules (code, name, category, description, sort_order)
values
  ('groups', 'Cellules et groupes', 'spiritual', 'Organiser les cellules, responsables, membres et rencontres.', 125),
  ('people_flows', 'Parcours des personnes', 'spiritual', 'Suivre les étapes d’accueil, de conversion et d’intégration.', 126),
  ('services', 'Cultes et équipes', 'spiritual', 'Planifier les cultes, postes et bénévoles.', 127)
on conflict (code) do update set
  name = excluded.name,
  category = excluded.category,
  description = excluded.description,
  sort_order = excluded.sort_order,
  is_active = true;

insert into public.church_modules (church_id, module_code, is_enabled, enabled_at)
select churches.id, modules.module_code, true, now()
from public.churches
cross join (values ('groups'), ('people_flows'), ('services')) as modules(module_code)
on conflict (church_id, module_code) do update set
  is_enabled = true,
  enabled_at = coalesce(public.church_modules.enabled_at, now()),
  updated_at = now();

insert into public.church_role_module_permissions (
  church_id, role_code, module_code, can_view, can_create, can_update,
  can_delete, can_approve, is_enabled
)
select
  churches.id,
  roles.role_code,
  modules.module_code,
  roles.can_view,
  roles.can_create,
  roles.can_update,
  roles.can_delete,
  roles.can_approve,
  true
from public.churches
cross join (
  values
    ('church_admin', true, true, true, true, true),
    ('pasteur_t', true, true, true, false, true),
    ('pasteur_a', true, true, true, false, false),
    ('responsable_d', true, true, true, false, false),
    ('worker', true, false, false, false, false),
    ('readonly', true, false, false, false, false)
) as roles(role_code, can_view, can_create, can_update, can_delete, can_approve)
cross join (values ('groups'), ('people_flows'), ('services')) as modules(module_code)
on conflict (church_id, role_code, module_code) do nothing;

create or replace function public.seed_ministry_coordination_for_church()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.church_modules (church_id, module_code, is_enabled, enabled_at)
  select new.id, modules.module_code, true, now()
  from (values ('groups'), ('people_flows'), ('services')) as modules(module_code)
  on conflict (church_id, module_code) do nothing;

  insert into public.church_role_module_permissions (
    church_id, role_code, module_code, can_view, can_create, can_update,
    can_delete, can_approve, is_enabled
  )
  select
    new.id,
    roles.role_code,
    modules.module_code,
    roles.can_view,
    roles.can_create,
    roles.can_update,
    roles.can_delete,
    roles.can_approve,
    true
  from (
    values
      ('church_admin', true, true, true, true, true),
      ('pasteur_t', true, true, true, false, true),
      ('pasteur_a', true, true, true, false, false),
      ('responsable_d', true, true, true, false, false),
      ('worker', true, false, false, false, false),
      ('readonly', true, false, false, false, false)
  ) as roles(role_code, can_view, can_create, can_update, can_delete, can_approve)
  cross join (values ('groups'), ('people_flows'), ('services')) as modules(module_code)
  on conflict (church_id, role_code, module_code) do nothing;

  return new;
end;
$$;

drop trigger if exists seed_ministry_coordination_after_church on public.churches;
create trigger seed_ministry_coordination_after_church
after insert on public.churches
for each row execute function public.seed_ministry_coordination_for_church();

notify pgrst, 'reload schema';
commit;
