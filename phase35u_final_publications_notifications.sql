-- MPANGI-CHURCH — PHASE 35U FINAL
-- Publications, photos, notifications publiques et compatibilité du schéma.
-- Script idempotent.

create extension if not exists pgcrypto;

-- -------------------------------------------------------------------
-- 1. Table canonique des publications
-- -------------------------------------------------------------------

create table if not exists public.church_publications (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null
    references public.churches(id)
    on delete cascade,

  title text not null,
  subtitle text,
  content text,
  excerpt text,
  category text,

  image_url text,
  image_path text,

  video_url text,
  youtube_url text,
  youtube_video_id text,
  link_url text,

  status text not null default 'draft',
  is_public boolean not null default true,
  is_featured boolean not null default false,
  notify_subscribers boolean not null default false,

  published_at timestamptz,
  notified_at timestamptz,
  archived_at timestamptz,

  created_by uuid
    references public.profiles(id)
    on delete set null,

  updated_by uuid
    references public.profiles(id)
    on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.church_publications
  add column if not exists subtitle text,
  add column if not exists content text,
  add column if not exists excerpt text,
  add column if not exists category text,

  add column if not exists image_url text,
  add column if not exists image_path text,

  add column if not exists video_url text,
  add column if not exists youtube_url text,
  add column if not exists youtube_video_id text,
  add column if not exists link_url text,

  add column if not exists status text default 'draft',
  add column if not exists is_public boolean default true,
  add column if not exists is_featured boolean default false,
  add column if not exists notify_subscribers boolean default false,

  add column if not exists published_at timestamptz,
  add column if not exists notified_at timestamptz,
  add column if not exists archived_at timestamptz,

  add column if not exists created_by uuid,
  add column if not exists updated_by uuid,

  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

-- -------------------------------------------------------------------
-- 2. Migration depuis les colonnes apparues dans les hotfix précédents
-- -------------------------------------------------------------------

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'church_publications'
      and column_name = 'description'
  ) then
    execute $migration$
      update public.church_publications
      set excerpt = coalesce(excerpt, description)
      where excerpt is null
        and description is not null
    $migration$;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'church_publications'
      and column_name = 'publication_type'
  ) then
    execute $migration$
      update public.church_publications
      set category = coalesce(category, publication_type)
      where category is null
        and publication_type is not null
    $migration$;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'church_publications'
      and column_name = 'is_published'
  ) then
    execute $migration$
      update public.church_publications
      set
        status = case
          when is_published then 'published'
          else coalesce(status, 'draft')
        end,
        is_public = coalesce(is_public, true)
    $migration$;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'church_publications'
      and column_name = 'cover_image_url'
  ) then
    execute $migration$
      update public.church_publications
      set image_url = coalesce(image_url, cover_image_url)
      where image_url is null
        and cover_image_url is not null
    $migration$;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'church_publications'
      and column_name = 'cover_image_path'
  ) then
    execute $migration$
      update public.church_publications
      set image_path = coalesce(image_path, cover_image_path)
      where image_path is null
        and cover_image_path is not null
    $migration$;
  end if;
end $$;

update public.church_publications
set
  category = coalesce(nullif(category, ''), 'teaching'),
  status = coalesce(nullif(status, ''), 'draft'),
  is_public = coalesce(is_public, true),
  is_featured = coalesce(is_featured, false),
  notify_subscribers = coalesce(notify_subscribers, false),
  created_at = coalesce(created_at, now()),
  updated_at = coalesce(updated_at, created_at, now());

alter table public.church_publications
  alter column status set default 'draft',
  alter column is_public set default true,
  alter column is_featured set default false,
  alter column notify_subscribers set default false,
  alter column created_at set default now(),
  alter column updated_at set default now();

create index if not exists idx_church_publications_church_id
  on public.church_publications(church_id);

create index if not exists idx_church_publications_status
  on public.church_publications(church_id, status, published_at desc);

create index if not exists idx_church_publications_featured
  on public.church_publications(church_id, is_featured, published_at desc);

create or replace function public.set_church_publications_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists church_publications_set_updated_at
  on public.church_publications;

create trigger church_publications_set_updated_at
before update on public.church_publications
for each row
execute function public.set_church_publications_updated_at();

alter table public.church_publications
  enable row level security;

drop policy if exists church_publications_public_read
  on public.church_publications;

create policy church_publications_public_read
on public.church_publications
for select
to anon, authenticated
using (
  (
    status = 'published'
    and is_public = true
  )
  or exists (
    select 1
    from public.profiles
    where profiles.user_id = auth.uid()
      and (
        profiles.role::text = 'super_admin'
        or profiles.church_id = church_publications.church_id
      )
  )
);

grant select
on public.church_publications
to anon, authenticated;

-- -------------------------------------------------------------------
-- 3. Bucket public des photos de publications
-- -------------------------------------------------------------------

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'church-publications',
  'church-publications',
  true,
  4194304,
  array[
    'image/jpeg',
    'image/png',
    'image/webp'
  ]::text[]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists church_publications_storage_public_read
  on storage.objects;

create policy church_publications_storage_public_read
on storage.objects
for select
to public
using (
  bucket_id = 'church-publications'
);

-- Les écritures sont réalisées côté serveur avec la Service Role.

-- -------------------------------------------------------------------
-- 4. Abonnements et journaux Push
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

create index if not exists idx_church_notification_subscriptions_church_id
  on public.church_notification_subscriptions(church_id);

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

create index if not exists idx_church_notification_logs_church_created
  on public.church_notification_logs(church_id, created_at desc);

alter table public.church_notification_subscriptions
  enable row level security;

alter table public.church_notification_logs
  enable row level security;

-- -------------------------------------------------------------------
-- 5. Module et activation
-- -------------------------------------------------------------------

insert into public.app_modules (
  code,
  name,
  category,
  description,
  sort_order
)
values (
  'publications',
  'Publications',
  'spiritual',
  'Publier des actualités, événements, photos et enseignements.',
  160
)
on conflict (code) do update
set
  name = excluded.name,
  category = excluded.category,
  description = excluded.description,
  sort_order = excluded.sort_order;

insert into public.church_modules (
  church_id,
  module_code,
  enabled
)
select
  id,
  'publications',
  true
from public.churches
on conflict (church_id, module_code) do update
set
  enabled = true,
  updated_at = now();

notify pgrst, 'reload schema';

select
  column_name,
  data_type,
  is_nullable,
  column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'church_publications'
order by ordinal_position;
