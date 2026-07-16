-- MPANGI-CHURCH — PHASE 35V
-- Hotfix opérationnel : événements, enseignements et notifications.
-- Script idempotent.

create extension if not exists pgcrypto;

-- -------------------------------------------------------------------
-- 1. Corriger l'erreur event_status = active
-- -------------------------------------------------------------------

do $$
begin
  if exists (
    select 1
    from pg_type t
    join pg_namespace n
      on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname = 'event_status'
  ) then
    alter type public.event_status
      add value if not exists 'active';
  end if;
end $$;

-- -------------------------------------------------------------------
-- 2. Aligner la table des enseignements
-- -------------------------------------------------------------------

create table if not exists public.church_teachings (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null
    references public.churches(id)
    on delete cascade,

  title text not null,
  description text,
  youtube_url text not null,
  youtube_video_id text not null,
  thumbnail_url text,
  teacher_name text,
  category text,

  status text not null default 'draft',
  is_featured boolean not null default false,
  sort_order integer not null default 0,
  published_at timestamptz,

  created_by uuid
    references public.profiles(id)
    on delete set null,

  updated_by uuid
    references public.profiles(id)
    on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.church_teachings
  add column if not exists description text,
  add column if not exists youtube_url text,
  add column if not exists youtube_video_id text,
  add column if not exists thumbnail_url text,
  add column if not exists teacher_name text,
  add column if not exists category text,
  add column if not exists status text default 'draft',
  add column if not exists is_featured boolean default false,
  add column if not exists sort_order integer default 0,
  add column if not exists published_at timestamptz,
  add column if not exists created_by uuid,
  add column if not exists updated_by uuid,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

update public.church_teachings
set
  status = case
    when status in (
      'draft',
      'published',
      'archived'
    )
      then status
    else 'draft'
  end,
  is_featured =
    coalesce(is_featured, false),
  sort_order =
    coalesce(sort_order, 0),
  created_at =
    coalesce(created_at, now()),
  updated_at =
    coalesce(updated_at, created_at, now());

do $$
declare
  constraint_record record;
begin
  for constraint_record in
    select conname
    from pg_constraint
    where conrelid =
      'public.church_teachings'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid)
        ilike '%status%'
  loop
    execute format(
      'alter table public.church_teachings drop constraint if exists %I',
      constraint_record.conname
    );
  end loop;
end $$;

alter table public.church_teachings
  add constraint church_teachings_status_check
  check (
    status in (
      'draft',
      'published',
      'archived'
    )
  )
  not valid;

alter table public.church_teachings
  validate constraint church_teachings_status_check;

create index if not exists idx_church_teachings_church_status
  on public.church_teachings(
    church_id,
    status,
    published_at desc
  );

-- -------------------------------------------------------------------
-- 3. Une seule table d'abonnements utilisée par l'inscription et l'envoi
-- -------------------------------------------------------------------

create table if not exists public.church_notification_subscriptions (
  id uuid primary key default gen_random_uuid(),

  church_id uuid not null
    references public.churches(id)
    on delete cascade,

  profile_id uuid
    references public.profiles(id)
    on delete set null,

  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.church_notification_subscriptions
  add column if not exists profile_id uuid,
  add column if not exists endpoint text,
  add column if not exists p256dh text,
  add column if not exists auth text,
  add column if not exists user_agent text,
  add column if not exists active boolean default true,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

create unique index if not exists idx_church_notification_subscriptions_endpoint
  on public.church_notification_subscriptions(endpoint);

create index if not exists idx_church_notification_subscriptions_church_active
  on public.church_notification_subscriptions(
    church_id,
    active
  );

create table if not exists public.church_notification_logs (
  id uuid primary key default gen_random_uuid(),

  church_id uuid
    references public.churches(id)
    on delete cascade,

  title text not null,
  body text,
  url text,
  type text not null default 'manual',
  status text not null default 'sent',

  recipients_count integer not null default 0,
  success_count integer not null default 0,
  failure_count integer not null default 0,

  created_by uuid
    references public.profiles(id)
    on delete set null,

  created_at timestamptz not null default now()
);

-- Migration depuis l'ancienne table publique si elle existe.
do $$
begin
  if to_regclass(
    'public.push_subscriptions'
  ) is not null then
    execute $migration$
      insert into public.church_notification_subscriptions (
        church_id,
        endpoint,
        p256dh,
        auth,
        user_agent,
        active,
        created_at,
        updated_at
      )
      select
        church_id,
        endpoint,
        p256dh,
        auth,
        user_agent,
        true,
        coalesce(created_at, now()),
        coalesce(updated_at, now())
      from public.push_subscriptions
      where church_id is not null
        and endpoint is not null
        and p256dh is not null
        and auth is not null
      on conflict (endpoint)
      do update set
        church_id =
          excluded.church_id,
        p256dh =
          excluded.p256dh,
        auth =
          excluded.auth,
        user_agent =
          excluded.user_agent,
        active = true,
        updated_at = now()
    $migration$;
  end if;
end $$;

alter table public.church_notification_subscriptions
  enable row level security;

alter table public.church_notification_logs
  enable row level security;

notify pgrst, 'reload schema';

-- Diagnostic final.
select
  t.typname as enum_name,
  e.enumlabel as enum_value
from pg_type t
join pg_namespace n
  on n.oid = t.typnamespace
join pg_enum e
  on e.enumtypid = t.oid
where n.nspname = 'public'
  and t.typname = 'event_status'
order by e.enumsortorder;

select
  table_name,
  column_name,
  data_type
from information_schema.columns
where table_schema = 'public'
  and table_name in (
    'church_teachings',
    'church_notification_subscriptions',
    'church_notification_logs'
  )
order by
  table_name,
  ordinal_position;
