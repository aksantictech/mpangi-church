begin;

create table if not exists public.church_households (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  name text not null,
  primary_member_id uuid references public.members(id) on delete set null,
  address text,
  city text,
  notes text,
  status text not null default 'active' check (status in ('active', 'inactive', 'archived')),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.household_members (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  household_id uuid not null references public.church_households(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  relationship text not null default 'member'
    check (relationship in ('head', 'spouse', 'child', 'parent', 'relative', 'member')),
  is_primary_contact boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint household_member_unique unique (church_id, member_id)
);

create table if not exists public.child_profiles (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  household_id uuid references public.church_households(id) on delete set null,
  member_id uuid references public.members(id) on delete set null,
  first_name text not null,
  last_name text not null,
  birth_date date,
  gender text check (gender is null or gender in ('male', 'female', 'other')),
  guardian_name text not null,
  guardian_phone text not null,
  allergies text,
  medical_notes text,
  authorized_pickup_names text,
  photo_url text,
  status text not null default 'active' check (status in ('active', 'inactive', 'archived')),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint child_profile_member_unique unique (church_id, member_id)
);

create table if not exists public.child_checkins (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  child_id uuid not null references public.child_profiles(id) on delete cascade,
  service_plan_id uuid references public.service_plans(id) on delete set null,
  room_name text,
  pickup_code_hash text not null,
  pickup_code_last4 text not null,
  failed_pickup_attempts integer not null default 0 check (failed_pickup_attempts between 0 and 100),
  locked_at timestamptz,
  status text not null default 'checked_in' check (status in ('checked_in', 'checked_out', 'cancelled')),
  checked_in_at timestamptz not null default now(),
  checked_out_at timestamptz,
  checked_in_by uuid references public.profiles(id) on delete set null,
  checked_out_by uuid references public.profiles(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists church_households_church_name_idx on public.church_households(church_id, status, name);
create index if not exists household_members_household_idx on public.household_members(church_id, household_id);
create index if not exists child_profiles_church_name_idx on public.child_profiles(church_id, status, last_name, first_name);
create index if not exists child_checkins_active_idx on public.child_checkins(church_id, status, checked_in_at desc);
create unique index if not exists child_checkins_one_active_per_child
  on public.child_checkins(child_id) where status = 'checked_in';

do $$
declare
  table_name text;
begin
  foreach table_name in array array['church_households', 'household_members', 'child_profiles', 'child_checkins'] loop
    execute format('drop trigger if exists ministry_updated_at on public.%I', table_name);
    execute format('create trigger ministry_updated_at before update on public.%I for each row execute function public.ministry_set_updated_at()', table_name);
  end loop;
end $$;

do $$
declare
  relation record;
begin
  for relation in
    select * from (values
      ('church_households', 'members', 'primary_member_id'),
      ('household_members', 'church_households', 'household_id'),
      ('household_members', 'members', 'member_id'),
      ('child_profiles', 'church_households', 'household_id'),
      ('child_profiles', 'members', 'member_id'),
      ('child_checkins', 'child_profiles', 'child_id'),
      ('child_checkins', 'service_plans', 'service_plan_id')
    ) as refs(child_table, parent_table, reference_column)
  loop
    execute format('drop trigger if exists phase2_tenant_%I on public.%I', relation.reference_column, relation.child_table);
    execute format(
      'create trigger phase2_tenant_%I before insert or update on public.%I for each row execute function public.ministry_validate_tenant_reference(%L, %L)',
      relation.reference_column,
      relation.child_table,
      relation.parent_table,
      relation.reference_column
    );
  end loop;
end $$;

create or replace function public.is_phase2_family_staff(target_church_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1 from public.profiles p
    where p.user_id = auth.uid()
      and p.church_id = target_church_id
      and p.status::text in ('active', 'actif')
      and p.role::text in ('church_admin', 'admin_eglise', 'pasteur_t', 'pastor', 'pasteur_a', 'responsable_d', 'worker')
  );
$$;

grant execute on function public.is_phase2_family_staff(uuid) to authenticated;

do $$
declare
  table_name text;
begin
  foreach table_name in array array['church_households', 'household_members', 'child_profiles', 'child_checkins'] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('drop policy if exists phase2_family_staff_access on public.%I', table_name);
    execute format(
      'create policy phase2_family_staff_access on public.%I for all to authenticated using (public.is_phase2_family_staff(church_id)) with check (public.is_phase2_family_staff(church_id))',
      table_name
    );
  end loop;
end $$;

insert into public.app_modules (code, name, category, description, sort_order)
values
  ('families', 'Foyers et familles', 'spiritual', 'Regrouper les membres par foyer et suivre les contacts familiaux.', 128),
  ('child_checkin', 'Accueil des enfants', 'spiritual', 'Enregistrer les enfants et sécuriser leur arrivée et leur départ.', 129),
  ('member_portal', 'Mon espace membre', 'spiritual', 'Afficher au membre ses groupes, parcours et services à venir.', 130)
on conflict (code) do update set
  name = excluded.name,
  category = excluded.category,
  description = excluded.description,
  sort_order = excluded.sort_order,
  is_active = true;

insert into public.church_modules (church_id, module_code, is_enabled, enabled_at)
select churches.id, modules.module_code, true, now()
from public.churches
cross join (values ('families'), ('child_checkin'), ('member_portal')) as modules(module_code)
on conflict (church_id, module_code) do update set
  is_enabled = true,
  enabled_at = coalesce(public.church_modules.enabled_at, now()),
  updated_at = now();

insert into public.church_role_module_permissions (
  church_id, role_code, module_code, can_view, can_create, can_update,
  can_delete, can_approve, is_enabled
)
select churches.id, roles.role_code, modules.module_code,
  roles.can_view, roles.can_create, roles.can_update, roles.can_delete, roles.can_approve, true
from public.churches
cross join (
  values
    ('church_admin', true, true, true, true, true),
    ('pasteur_t', true, true, true, false, true),
    ('pasteur_a', true, true, true, false, false),
    ('responsable_d', true, true, true, false, false),
    ('worker', true, false, true, false, false),
    ('member', true, false, false, false, false)
) as roles(role_code, can_view, can_create, can_update, can_delete, can_approve)
cross join (values ('families'), ('child_checkin'), ('member_portal')) as modules(module_code)
where
  roles.role_code in ('church_admin', 'pasteur_t', 'pasteur_a')
  or (roles.role_code = 'responsable_d' and modules.module_code in ('families', 'child_checkin'))
  or (roles.role_code = 'worker' and modules.module_code = 'child_checkin')
  or (roles.role_code = 'member' and modules.module_code = 'member_portal')
on conflict (church_id, role_code, module_code) do nothing;

create or replace function public.seed_phase2_for_church()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.church_modules (church_id, module_code, is_enabled, enabled_at)
  select new.id, modules.module_code, true, now()
  from (values ('families'), ('child_checkin'), ('member_portal')) as modules(module_code)
  on conflict (church_id, module_code) do nothing;

  insert into public.church_role_module_permissions (
    church_id, role_code, module_code, can_view, can_create, can_update,
    can_delete, can_approve, is_enabled
  )
  select new.id, roles.role_code, modules.module_code,
    roles.can_view, roles.can_create, roles.can_update, roles.can_delete, roles.can_approve, true
  from (
    values
      ('church_admin', true, true, true, true, true),
      ('pasteur_t', true, true, true, false, true),
      ('pasteur_a', true, true, true, false, false),
      ('responsable_d', true, true, true, false, false),
      ('worker', true, false, true, false, false),
      ('member', true, false, false, false, false)
  ) as roles(role_code, can_view, can_create, can_update, can_delete, can_approve)
  cross join (values ('families'), ('child_checkin'), ('member_portal')) as modules(module_code)
  where
    roles.role_code in ('church_admin', 'pasteur_t', 'pasteur_a')
    or (roles.role_code = 'responsable_d' and modules.module_code in ('families', 'child_checkin'))
    or (roles.role_code = 'worker' and modules.module_code = 'child_checkin')
    or (roles.role_code = 'member' and modules.module_code = 'member_portal')
  on conflict (church_id, role_code, module_code) do nothing;
  return new;
end;
$$;

drop trigger if exists seed_phase2_after_church on public.churches;
create trigger seed_phase2_after_church
after insert on public.churches
for each row execute function public.seed_phase2_for_church();

notify pgrst, 'reload schema';
commit;
