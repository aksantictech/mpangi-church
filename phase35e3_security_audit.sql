
create extension if not exists pgcrypto;

create table if not exists public.security_audit_logs (
  id uuid primary key default gen_random_uuid(),
  church_id uuid references public.churches(id) on delete set null,
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_email text,
  actor_role text,
  action text not null,
  resource_type text,
  resource_id text,
  status text not null default 'success'
    check (status in ('success','denied','error','warning')),
  severity text not null default 'low'
    check (severity in ('low','medium','high','critical')),
  route text,
  ip_address inet,
  user_agent text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists security_audit_logs_church_created_idx
  on public.security_audit_logs(church_id, created_at desc);

create index if not exists security_audit_logs_actor_created_idx
  on public.security_audit_logs(actor_user_id, created_at desc);

create index if not exists security_audit_logs_status_created_idx
  on public.security_audit_logs(status, severity, created_at desc);

alter table public.security_audit_logs enable row level security;

create or replace function public.phase35e3_current_church_id()
returns uuid
language sql
stable
security definer
set search_path = public, auth
as $$
  select p.church_id
  from public.profiles p
  where p.user_id = auth.uid()
  limit 1;
$$;

create or replace function public.phase35e3_current_role()
returns text
language sql
stable
security definer
set search_path = public, auth
as $$
  select p.role::text
  from public.profiles p
  where p.user_id = auth.uid()
  limit 1;
$$;

create or replace function public.phase35e3_can_read_audit(target_church_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
      and (
        p.role::text = 'super_admin'
        or (
          p.church_id = target_church_id
          and p.role::text in (
            'church_admin','admin_eglise','pasteur_t','pastor'
          )
        )
      )
  );
$$;

grant execute on function public.phase35e3_current_church_id() to authenticated;
grant execute on function public.phase35e3_current_role() to authenticated;
grant execute on function public.phase35e3_can_read_audit(uuid) to authenticated;

drop policy if exists security_audit_logs_select on public.security_audit_logs;
create policy security_audit_logs_select
on public.security_audit_logs
for select
to authenticated
using (public.phase35e3_can_read_audit(church_id));

drop policy if exists security_audit_logs_insert_self on public.security_audit_logs;
create policy security_audit_logs_insert_self
on public.security_audit_logs
for insert
to authenticated
with check (
  actor_user_id = auth.uid()
  and (
    church_id is null
    or church_id = public.phase35e3_current_church_id()
  )
);

drop policy if exists security_audit_logs_delete_super_admin on public.security_audit_logs;
create policy security_audit_logs_delete_super_admin
on public.security_audit_logs
for delete
to authenticated
using (public.phase35e3_current_role() = 'super_admin');

create or replace view public.security_audit_summary
with (security_invoker = true)
as
select
  church_id,
  date_trunc('day', created_at) as audit_day,
  status,
  severity,
  count(*) as event_count
from public.security_audit_logs
group by church_id, date_trunc('day', created_at), status, severity;

grant select on public.security_audit_summary to authenticated;

create or replace function public.phase35e3_security_findings()
returns table (
  severity text,
  check_code text,
  entity text,
  finding_count bigint,
  details jsonb
)
language sql
stable
security definer
set search_path = public, auth
as $$
  with duplicate_profiles as (
    select user_id, count(*) duplicate_count
    from public.profiles
    where user_id is not null
    group by user_id
    having count(*) > 1
  ),
  cross_church_tasks as (
    select t.id
    from public.church_user_role_tasks t
    left join public.profiles p on p.user_id = t.assigned_to
    where p.user_id is null
       or p.church_id is distinct from t.church_id
  ),
  unknown_modules as (
    select p.module_code
    from public.church_role_module_permissions p
    left join public.app_modules m on m.code = p.module_code
    where m.code is null
  )
  select 'critical','PROFILE_USER_ID_MISSING','profiles',count(*)::bigint,
         jsonb_build_object('message','Profils sans auth.users.id')
  from public.profiles where user_id is null
  union all
  select 'high','PROFILE_CHURCH_MISSING','profiles',count(*)::bigint,
         jsonb_build_object('message','Profils non Super Admin sans église')
  from public.profiles
  where role::text <> 'super_admin' and church_id is null
  union all
  select 'critical','PROFILE_DUPLICATE_USER_ID','profiles',count(*)::bigint,
         jsonb_build_object('message','Plusieurs profils pour un même auth.users.id')
  from duplicate_profiles
  union all
  select 'critical','TASK_CROSS_CHURCH','church_user_role_tasks',count(*)::bigint,
         jsonb_build_object('message','Tâches liées à un profil d’une autre église')
  from cross_church_tasks
  union all
  select 'high','PERMISSION_UNKNOWN_MODULE','church_role_module_permissions',count(*)::bigint,
         jsonb_build_object('message','Permissions avec module absent de app_modules')
  from unknown_modules;
$$;

revoke all on function public.phase35e3_security_findings() from public;
grant execute on function public.phase35e3_security_findings() to service_role;

notify pgrst, 'reload schema';

select * from public.phase35e3_security_findings()
order by case severity when 'critical' then 1 when 'high' then 2 else 3 end, check_code;
