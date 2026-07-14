-- MPANGI-CHURCH — PHASE 35E-1
-- Rôles, permissions, dashboards personnalisés et tâches par rôle.
--
-- Principes :
-- - aucune modification du type enum public.profiles.role ;
-- - les rôles sont stockés comme codes texte dans ce module ;
-- - profiles.user_id reste la liaison avec auth.users.id ;
-- - les données restent isolées par church_id ;
-- - le script est idempotent.

create extension if not exists pgcrypto;

create table if not exists public.church_role_module_permissions (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null
    references public.churches(id) on delete cascade,
  role_code text not null,
  module_code text not null,

  can_view boolean not null default false,
  can_create boolean not null default false,
  can_update boolean not null default false,
  can_delete boolean not null default false,
  can_approve boolean not null default false,
  is_enabled boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint church_role_module_permissions_unique
    unique (church_id, role_code, module_code)
);

create table if not exists public.church_role_dashboard_widgets (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null
    references public.churches(id) on delete cascade,
  role_code text not null,
  widget_code text not null,
  position integer not null default 100,
  is_enabled boolean not null default true,
  settings jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint church_role_dashboard_widgets_unique
    unique (church_id, role_code, widget_code)
);

create table if not exists public.church_role_task_templates (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null
    references public.churches(id) on delete cascade,
  role_code text not null,
  title text not null,
  description text,
  frequency text not null default 'once'
    check (
      frequency in (
        'once',
        'daily',
        'weekly',
        'monthly',
        'quarterly',
        'yearly'
      )
    ),
  priority text not null default 'normal'
    check (priority in ('low', 'normal', 'high', 'urgent')),
  default_due_days integer not null default 7
    check (default_due_days between 0 and 365),
  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint church_role_task_templates_unique
    unique (church_id, role_code, title)
);

create table if not exists public.church_user_role_tasks (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null
    references public.churches(id) on delete cascade,
  template_id uuid
    references public.church_role_task_templates(id)
    on delete set null,

  assigned_to uuid not null
    references auth.users(id) on delete cascade,
  created_by uuid
    references auth.users(id) on delete set null,

  title text not null,
  description text,
  priority text not null default 'normal'
    check (priority in ('low', 'normal', 'high', 'urgent')),
  status text not null default 'todo'
    check (
      status in (
        'todo',
        'in_progress',
        'blocked',
        'done',
        'cancelled'
      )
    ),

  due_at timestamptz,
  completed_at timestamptz,
  source_period text,
  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists role_permissions_church_role_idx
  on public.church_role_module_permissions(church_id, role_code);

create index if not exists role_widgets_church_role_idx
  on public.church_role_dashboard_widgets(
    church_id,
    role_code,
    position
  );

create index if not exists role_templates_church_role_idx
  on public.church_role_task_templates(church_id, role_code);

create index if not exists user_role_tasks_assigned_idx
  on public.church_user_role_tasks(
    assigned_to,
    status,
    due_at
  );

create index if not exists user_role_tasks_church_idx
  on public.church_user_role_tasks(
    church_id,
    created_at desc
  );

create unique index if not exists user_role_tasks_template_period_unique
  on public.church_user_role_tasks(
    assigned_to,
    template_id,
    source_period
  )
  where template_id is not null
    and source_period is not null;

create or replace function public.phase35e_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists phase35e_permissions_updated_at
  on public.church_role_module_permissions;

create trigger phase35e_permissions_updated_at
before update on public.church_role_module_permissions
for each row
execute function public.phase35e_set_updated_at();

drop trigger if exists phase35e_widgets_updated_at
  on public.church_role_dashboard_widgets;

create trigger phase35e_widgets_updated_at
before update on public.church_role_dashboard_widgets
for each row
execute function public.phase35e_set_updated_at();

drop trigger if exists phase35e_templates_updated_at
  on public.church_role_task_templates;

create trigger phase35e_templates_updated_at
before update on public.church_role_task_templates
for each row
execute function public.phase35e_set_updated_at();

drop trigger if exists phase35e_user_tasks_updated_at
  on public.church_user_role_tasks;

create trigger phase35e_user_tasks_updated_at
before update on public.church_user_role_tasks
for each row
execute function public.phase35e_set_updated_at();

-- Fonctions de contexte. Elles lisent profiles.user_id, jamais profiles.id.

create or replace function public.current_profile_role_code()
returns text
language sql
stable
security definer
set search_path = public, auth
as $$
  select profiles.role::text
  from public.profiles as profiles
  where profiles.user_id = auth.uid()
  limit 1;
$$;

create or replace function public.current_profile_church_id()
returns uuid
language sql
stable
security definer
set search_path = public, auth
as $$
  select profiles.church_id
  from public.profiles as profiles
  where profiles.user_id = auth.uid()
  limit 1;
$$;

create or replace function public.is_phase35e_security_admin(
  target_church_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.profiles as profiles
    where profiles.user_id = auth.uid()
      and (
        profiles.role::text = 'super_admin'
        or (
          profiles.church_id = target_church_id
          and profiles.role::text in (
            'church_admin',
            'admin_eglise',
            'pasteur_t',
            'pastor'
          )
        )
      )
  );
$$;

grant execute on function public.current_profile_role_code()
  to authenticated;

grant execute on function public.current_profile_church_id()
  to authenticated;

grant execute on function public.is_phase35e_security_admin(uuid)
  to authenticated;

alter table public.church_role_module_permissions
  enable row level security;

alter table public.church_role_dashboard_widgets
  enable row level security;

alter table public.church_role_task_templates
  enable row level security;

alter table public.church_user_role_tasks
  enable row level security;

drop policy if exists role_permissions_select
  on public.church_role_module_permissions;

create policy role_permissions_select
on public.church_role_module_permissions
for select
to authenticated
using (
  public.is_phase35e_security_admin(church_id)
  or (
    church_id = public.current_profile_church_id()
    and role_code = public.current_profile_role_code()
  )
);

drop policy if exists role_permissions_manage
  on public.church_role_module_permissions;

create policy role_permissions_manage
on public.church_role_module_permissions
for all
to authenticated
using (public.is_phase35e_security_admin(church_id))
with check (public.is_phase35e_security_admin(church_id));

drop policy if exists role_widgets_select
  on public.church_role_dashboard_widgets;

create policy role_widgets_select
on public.church_role_dashboard_widgets
for select
to authenticated
using (
  public.is_phase35e_security_admin(church_id)
  or (
    church_id = public.current_profile_church_id()
    and role_code = public.current_profile_role_code()
  )
);

drop policy if exists role_widgets_manage
  on public.church_role_dashboard_widgets;

create policy role_widgets_manage
on public.church_role_dashboard_widgets
for all
to authenticated
using (public.is_phase35e_security_admin(church_id))
with check (public.is_phase35e_security_admin(church_id));

drop policy if exists role_templates_select
  on public.church_role_task_templates;

create policy role_templates_select
on public.church_role_task_templates
for select
to authenticated
using (
  public.is_phase35e_security_admin(church_id)
  or (
    church_id = public.current_profile_church_id()
    and role_code = public.current_profile_role_code()
  )
);

drop policy if exists role_templates_manage
  on public.church_role_task_templates;

create policy role_templates_manage
on public.church_role_task_templates
for all
to authenticated
using (public.is_phase35e_security_admin(church_id))
with check (public.is_phase35e_security_admin(church_id));

drop policy if exists user_role_tasks_select
  on public.church_user_role_tasks;

create policy user_role_tasks_select
on public.church_user_role_tasks
for select
to authenticated
using (
  assigned_to = auth.uid()
  or public.is_phase35e_security_admin(church_id)
);

drop policy if exists user_role_tasks_insert
  on public.church_user_role_tasks;

create policy user_role_tasks_insert
on public.church_user_role_tasks
for insert
to authenticated
with check (
  (
    assigned_to = auth.uid()
    and church_id = public.current_profile_church_id()
  )
  or public.is_phase35e_security_admin(church_id)
);

drop policy if exists user_role_tasks_update
  on public.church_user_role_tasks;

create policy user_role_tasks_update
on public.church_user_role_tasks
for update
to authenticated
using (
  assigned_to = auth.uid()
  or public.is_phase35e_security_admin(church_id)
)
with check (
  assigned_to = auth.uid()
  or public.is_phase35e_security_admin(church_id)
);

drop policy if exists user_role_tasks_delete
  on public.church_user_role_tasks;

create policy user_role_tasks_delete
on public.church_user_role_tasks
for delete
to authenticated
using (public.is_phase35e_security_admin(church_id));

-- Catalogue des modules du projet.
create or replace function public.phase35e_seed_church_security(
  target_church_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.church_role_module_permissions (
    church_id,
    role_code,
    module_code,
    can_view,
    can_create,
    can_update,
    can_delete,
    can_approve,
    is_enabled
  )
  select
    target_church_id,
    roles.role_code,
    modules.module_code,
    case
      when roles.role_code = 'super_admin' then true
      when roles.role_code in ('church_admin', 'admin_eglise') then true
      when roles.role_code in ('pasteur_t', 'pastor') then
        modules.module_code not in ('security')
      when roles.role_code = 'pasteur_a' then
        modules.module_code in (
          'role_dashboard',
          'my_work',
          'members',
          'attendance',
          'souls',
          'departments',
          'events',
          'public_requests',
          'teachings',
          'notifications'
        )
      when roles.role_code = 'charge_afp' then
        modules.module_code in (
          'role_dashboard',
          'my_work',
          'finance_dashboard',
          'offerings',
          'expenses',
          'budgets',
          'finance_reports',
          'donations'
        )
      when roles.role_code = 'responsable_d' then
        modules.module_code in (
          'role_dashboard',
          'my_work',
          'members',
          'attendance',
          'departments',
          'events'
        )
      when roles.role_code = 'logisticien' then
        modules.module_code in (
          'role_dashboard',
          'my_work',
          'patrimony',
          'assets',
          'maintenance',
          'movements'
        )
      when roles.role_code = 'secretaire' then
        modules.module_code in (
          'role_dashboard',
          'my_work',
          'correspondence',
          'inbox',
          'transmissions',
          'tasks',
          'minutes',
          'notifications'
        )
      when roles.role_code = 'worker' then
        modules.module_code in (
          'role_dashboard',
          'my_work',
          'members',
          'attendance',
          'departments',
          'events'
        )
      when roles.role_code = 'readonly' then
        modules.module_code in (
          'role_dashboard',
          'members',
          'attendance',
          'departments',
          'events',
          'teachings'
        )
      when roles.role_code = 'member' then
        modules.module_code in (
          'role_dashboard',
          'my_work',
          'teachings'
        )
      else false
    end as can_view,

    case
      when roles.role_code = 'super_admin' then true
      when roles.role_code in ('church_admin', 'admin_eglise') then true
      when roles.role_code in ('pasteur_t', 'pastor') then
        modules.module_code not in (
          'security',
          'users'
        )
      when roles.role_code = 'pasteur_a' then
        modules.module_code in (
          'my_work',
          'members',
          'attendance',
          'souls',
          'events',
          'public_requests'
        )
      when roles.role_code = 'charge_afp' then
        modules.module_code in (
          'my_work',
          'offerings',
          'expenses',
          'budgets',
          'donations'
        )
      when roles.role_code = 'responsable_d' then
        modules.module_code in (
          'my_work',
          'members',
          'attendance',
          'events'
        )
      when roles.role_code = 'logisticien' then
        modules.module_code in (
          'my_work',
          'assets',
          'maintenance',
          'movements'
        )
      when roles.role_code = 'secretaire' then
        modules.module_code in (
          'my_work',
          'correspondence',
          'transmissions',
          'tasks',
          'minutes',
          'notifications'
        )
      when roles.role_code = 'worker' then
        modules.module_code in (
          'my_work',
          'attendance'
        )
      when roles.role_code = 'member' then
        modules.module_code = 'my_work'
      else false
    end as can_create,

    case
      when roles.role_code = 'super_admin' then true
      when roles.role_code in ('church_admin', 'admin_eglise') then true
      when roles.role_code in ('pasteur_t', 'pastor') then
        modules.module_code not in (
          'security',
          'users'
        )
      when roles.role_code = 'pasteur_a' then
        modules.module_code in (
          'my_work',
          'members',
          'attendance',
          'souls',
          'events',
          'public_requests'
        )
      when roles.role_code = 'charge_afp' then
        modules.module_code in (
          'my_work',
          'offerings',
          'expenses',
          'budgets',
          'donations'
        )
      when roles.role_code = 'responsable_d' then
        modules.module_code in (
          'my_work',
          'members',
          'attendance',
          'events'
        )
      when roles.role_code = 'logisticien' then
        modules.module_code in (
          'my_work',
          'assets',
          'maintenance',
          'movements'
        )
      when roles.role_code = 'secretaire' then
        modules.module_code in (
          'my_work',
          'correspondence',
          'transmissions',
          'tasks',
          'minutes',
          'notifications'
        )
      when roles.role_code in ('worker', 'member') then
        modules.module_code = 'my_work'
      else false
    end as can_update,

    case
      when roles.role_code = 'super_admin' then true
      when roles.role_code in ('church_admin', 'admin_eglise') then
        modules.module_code not in (
          'security'
        )
      when roles.role_code in ('pasteur_t', 'pastor') then
        modules.module_code in (
          'events',
          'teachings',
          'notifications',
          'tasks'
        )
      else false
    end as can_delete,

    case
      when roles.role_code = 'super_admin' then true
      when roles.role_code in (
        'church_admin',
        'admin_eglise',
        'pasteur_t',
        'pastor'
      ) then true
      when roles.role_code = 'charge_afp' then
        modules.module_code in (
          'offerings',
          'expenses',
          'budgets',
          'donations'
        )
      else false
    end as can_approve,

    true
  from (
    values
      ('super_admin'),
      ('church_admin'),
      ('admin_eglise'),
      ('pasteur_t'),
      ('pastor'),
      ('pasteur_a'),
      ('charge_afp'),
      ('responsable_d'),
      ('logisticien'),
      ('secretaire'),
      ('worker'),
      ('readonly'),
      ('member')
  ) as roles(role_code)
  cross join (
    values
      ('role_dashboard'),
      ('my_work'),
      ('members'),
      ('attendance'),
      ('souls'),
      ('departments'),
      ('events'),
      ('public_requests'),
      ('publications'),
      ('teachings'),
      ('notifications'),
      ('correspondence'),
      ('inbox'),
      ('transmissions'),
      ('tasks'),
      ('minutes'),
      ('finance_dashboard'),
      ('offerings'),
      ('expenses'),
      ('budgets'),
      ('finance_reports'),
      ('donations'),
      ('patrimony'),
      ('assets'),
      ('maintenance'),
      ('movements'),
      ('extensions'),
      ('settings'),
      ('users'),
      ('security')
  ) as modules(module_code)
  on conflict (church_id, role_code, module_code)
  do nothing;

  insert into public.church_role_dashboard_widgets (
    church_id,
    role_code,
    widget_code,
    position,
    is_enabled
  )
  select
    target_church_id,
    defaults.role_code,
    defaults.widget_code,
    defaults.position,
    true
  from (
    values
      ('super_admin', 'overview', 10),
      ('super_admin', 'security', 20),
      ('super_admin', 'users', 30),
      ('super_admin', 'churches', 40),

      ('church_admin', 'overview', 10),
      ('church_admin', 'members', 20),
      ('church_admin', 'attendance', 30),
      ('church_admin', 'public_requests', 40),
      ('church_admin', 'tasks', 50),
      ('church_admin', 'finance', 60),

      ('admin_eglise', 'overview', 10),
      ('admin_eglise', 'members', 20),
      ('admin_eglise', 'attendance', 30),
      ('admin_eglise', 'public_requests', 40),
      ('admin_eglise', 'tasks', 50),
      ('admin_eglise', 'finance', 60),

      ('pasteur_t', 'overview', 10),
      ('pasteur_t', 'souls', 20),
      ('pasteur_t', 'public_requests', 30),
      ('pasteur_t', 'attendance', 40),
      ('pasteur_t', 'tasks', 50),
      ('pasteur_t', 'finance', 60),

      ('pastor', 'overview', 10),
      ('pastor', 'souls', 20),
      ('pastor', 'public_requests', 30),
      ('pastor', 'attendance', 40),
      ('pastor', 'tasks', 50),

      ('pasteur_a', 'souls', 10),
      ('pasteur_a', 'public_requests', 20),
      ('pasteur_a', 'attendance', 30),
      ('pasteur_a', 'tasks', 40),

      ('charge_afp', 'finance', 10),
      ('charge_afp', 'donations', 20),
      ('charge_afp', 'tasks', 30),

      ('responsable_d', 'departments', 10),
      ('responsable_d', 'members', 20),
      ('responsable_d', 'attendance', 30),
      ('responsable_d', 'tasks', 40),

      ('logisticien', 'patrimony', 10),
      ('logisticien', 'maintenance', 20),
      ('logisticien', 'tasks', 30),

      ('secretaire', 'correspondence', 10),
      ('secretaire', 'minutes', 20),
      ('secretaire', 'transmissions', 30),
      ('secretaire', 'tasks', 40),

      ('worker', 'tasks', 10),
      ('worker', 'attendance', 20),
      ('worker', 'members', 30),

      ('readonly', 'overview', 10),
      ('readonly', 'members', 20),

      ('member', 'overview', 10),
      ('member', 'tasks', 20)
  ) as defaults(role_code, widget_code, position)
  on conflict (church_id, role_code, widget_code)
  do nothing;

  insert into public.church_role_task_templates (
    church_id,
    role_code,
    title,
    description,
    frequency,
    priority,
    default_due_days,
    is_active
  )
  select
    target_church_id,
    templates.role_code,
    templates.title,
    templates.description,
    templates.frequency,
    templates.priority,
    templates.default_due_days,
    true
  from (
    values
      (
        'church_admin',
        'Contrôler les demandes publiques',
        'Examiner les prières, rendez-vous, adhésions et témoignages reçus.',
        'daily',
        'high',
        1
      ),
      (
        'church_admin',
        'Vérifier les indicateurs de l’église',
        'Contrôler les membres, présences, activités et alertes importantes.',
        'weekly',
        'normal',
        3
      ),
      (
        'pasteur_t',
        'Examiner le suivi des âmes',
        'Consulter les personnes nécessitant une action pastorale.',
        'weekly',
        'high',
        3
      ),
      (
        'pasteur_t',
        'Valider les priorités ministérielles',
        'Réviser les activités, demandes et décisions à suivre.',
        'weekly',
        'normal',
        5
      ),
      (
        'pasteur_a',
        'Effectuer les suivis pastoraux assignés',
        'Traiter les demandes et suivis confiés par le pasteur titulaire.',
        'weekly',
        'high',
        3
      ),
      (
        'charge_afp',
        'Contrôler les pièces financières',
        'Vérifier les entrées, sorties, justificatifs et dons déclarés.',
        'weekly',
        'high',
        3
      ),
      (
        'charge_afp',
        'Préparer le résumé financier',
        'Préparer les totaux et éléments de reporting de la période.',
        'monthly',
        'normal',
        5
      ),
      (
        'responsable_d',
        'Contrôler les présences du département',
        'Vérifier les membres actifs et les absences à suivre.',
        'weekly',
        'normal',
        3
      ),
      (
        'logisticien',
        'Contrôler les mouvements de patrimoine',
        'Vérifier les entrées, sorties, affectations et maintenances.',
        'weekly',
        'high',
        3
      ),
      (
        'secretaire',
        'Traiter les courriers et transmissions',
        'Mettre à jour les courriers, transmissions et procès-verbaux.',
        'daily',
        'normal',
        1
      ),
      (
        'worker',
        'Consulter les tâches assignées',
        'Traiter les activités confiées et mettre à jour leur statut.',
        'daily',
        'normal',
        1
      ),
      (
        'member',
        'Consulter les actions personnelles',
        'Vérifier les activités ou actions attribuées à votre compte.',
        'weekly',
        'low',
        7
      )
  ) as templates(
    role_code,
    title,
    description,
    frequency,
    priority,
    default_due_days
  )
  on conflict (church_id, role_code, title)
  do nothing;
end;
$$;

grant execute on function public.phase35e_seed_church_security(uuid)
  to service_role;

do $$
declare
  church_record record;
begin
  for church_record in
    select id from public.churches
  loop
    perform public.phase35e_seed_church_security(
      church_record.id
    );
  end loop;
end $$;

create or replace function public.phase35e_seed_new_church()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.phase35e_seed_church_security(new.id);
  return new;
end;
$$;

drop trigger if exists phase35e_seed_new_church
  on public.churches;

create trigger phase35e_seed_new_church
after insert on public.churches
for each row
execute function public.phase35e_seed_new_church();

notify pgrst, 'reload schema';

select
  churches.name as church_name,
  count(distinct permissions.role_code) as roles_seeded,
  count(distinct permissions.module_code) as modules_seeded,
  count(distinct widgets.widget_code) as widgets_seeded,
  count(distinct templates.id) as task_templates_seeded
from public.churches as churches
left join public.church_role_module_permissions as permissions
  on permissions.church_id = churches.id
left join public.church_role_dashboard_widgets as widgets
  on widgets.church_id = churches.id
left join public.church_role_task_templates as templates
  on templates.church_id = churches.id
group by churches.id, churches.name
order by churches.name;
