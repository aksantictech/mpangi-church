-- Mpangi-church — Phase 36C
-- Consolidation du journal de sécurité et d’audit.

create extension if not exists pgcrypto;

create table if not exists public.security_audit_logs (
  id uuid primary key default gen_random_uuid(),

  church_id uuid null
    references public.churches(id)
    on delete set null,

  actor_user_id uuid null,
  actor_email text null,
  actor_role text null,

  action text not null,
  resource_type text null,
  resource_id text null,

  status text not null default 'success',
  severity text not null default 'low',

  route text null,
  ip_address text null,
  user_agent text null,

  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),

  constraint security_audit_logs_status_check
    check (
      status in (
        'success',
        'denied',
        'error',
        'warning'
      )
    ),

  constraint security_audit_logs_severity_check
    check (
      severity in (
        'low',
        'medium',
        'high',
        'critical'
      )
    )
);

alter table public.security_audit_logs
  add column if not exists church_id uuid null;

alter table public.security_audit_logs
  add column if not exists actor_user_id uuid null;

alter table public.security_audit_logs
  add column if not exists actor_email text null;

alter table public.security_audit_logs
  add column if not exists actor_role text null;

alter table public.security_audit_logs
  add column if not exists action text;

alter table public.security_audit_logs
  add column if not exists resource_type text null;

alter table public.security_audit_logs
  add column if not exists resource_id text null;

alter table public.security_audit_logs
  add column if not exists status text default 'success';

alter table public.security_audit_logs
  add column if not exists severity text default 'low';

alter table public.security_audit_logs
  add column if not exists route text null;

alter table public.security_audit_logs
  add column if not exists ip_address text null;

alter table public.security_audit_logs
  add column if not exists user_agent text null;

alter table public.security_audit_logs
  add column if not exists metadata jsonb default '{}'::jsonb;

alter table public.security_audit_logs
  add column if not exists created_at timestamptz default now();

update public.security_audit_logs
set
  status = coalesce(status, 'success'),
  severity = coalesce(severity, 'low'),
  metadata = coalesce(metadata, '{}'::jsonb),
  created_at = coalesce(created_at, now())
where
  status is null
  or severity is null
  or metadata is null
  or created_at is null;

create index if not exists security_audit_logs_created_at_idx
  on public.security_audit_logs(created_at desc);

create index if not exists security_audit_logs_church_created_idx
  on public.security_audit_logs(church_id, created_at desc);

create index if not exists security_audit_logs_actor_created_idx
  on public.security_audit_logs(actor_user_id, created_at desc);

create index if not exists security_audit_logs_status_created_idx
  on public.security_audit_logs(status, created_at desc);

create index if not exists security_audit_logs_severity_created_idx
  on public.security_audit_logs(severity, created_at desc);

create index if not exists security_audit_logs_action_created_idx
  on public.security_audit_logs(action, created_at desc);

create index if not exists security_audit_logs_resource_idx
  on public.security_audit_logs(resource_type, resource_id);

alter table public.security_audit_logs enable row level security;

revoke all
  on table public.security_audit_logs
  from anon;

revoke all
  on table public.security_audit_logs
  from authenticated;

comment on table public.security_audit_logs is
  'Journal interne immuable des accès refusés, erreurs et actions sensibles. Lecture et écriture exclusivement côté serveur avec le client administrateur.';

comment on column public.security_audit_logs.metadata is
  'Métadonnées techniques expurgées : aucun mot de passe, jeton, cookie ou secret ne doit être enregistré.';

create or replace function public.prevent_security_audit_log_update()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  raise exception
    'Les événements du journal de sécurité sont immuables.';
end;
$$;

drop trigger if exists security_audit_logs_prevent_update
  on public.security_audit_logs;

create trigger security_audit_logs_prevent_update
before update
on public.security_audit_logs
for each row
execute function public.prevent_security_audit_log_update();

create or replace function public.prevent_security_audit_log_delete()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  raise exception
    'La suppression directe du journal de sécurité est interdite.';
end;
$$;

drop trigger if exists security_audit_logs_prevent_delete
  on public.security_audit_logs;

create trigger security_audit_logs_prevent_delete
before delete
on public.security_audit_logs
for each row
execute function public.prevent_security_audit_log_delete();