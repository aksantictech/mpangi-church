-- Phase 37E - rapports départementaux, notifications de validation et analytics plateforme.

alter table public.department_monthly_reports
  add column if not exists author_validation_read_at timestamptz null;

-- Évite de notifier rétroactivement toutes les validations historiques au déploiement.
update public.department_monthly_reports
set author_validation_read_at = validated_at
where validated_at is not null
  and author_validation_read_at is null;

create index if not exists department_reports_author_validation_idx
  on public.department_monthly_reports(created_by, validated_at desc)
  where validated_at is not null;

create extension if not exists pgcrypto;

create table if not exists public.site_analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null default 'page_view'
    check (event_type in ('page_view')),
  host text not null,
  path text not null,
  area text not null default 'public'
    check (area in ('public', 'login', 'authenticated')),
  visitor_hash text not null,
  country_code text null,
  region text null,
  city text null,
  referrer_host text null,
  is_bot boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists site_analytics_created_idx
  on public.site_analytics_events(created_at desc);
create index if not exists site_analytics_host_created_idx
  on public.site_analytics_events(host, created_at desc);
create index if not exists site_analytics_path_created_idx
  on public.site_analytics_events(path, created_at desc);
create index if not exists site_analytics_country_created_idx
  on public.site_analytics_events(country_code, created_at desc);
create index if not exists site_analytics_visitor_created_idx
  on public.site_analytics_events(visitor_hash, created_at desc);

alter table public.site_analytics_events enable row level security;
revoke all on table public.site_analytics_events from anon;
revoke all on table public.site_analytics_events from authenticated;

comment on table public.site_analytics_events is
  'Analytics first-party Mpangi-church. Les visites ne stockent pas l IP brute; visitor_hash est une empreinte pseudonymisée journalière calculée côté serveur.';
