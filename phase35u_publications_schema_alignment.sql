-- MPANGI-CHURCH — PHASE 35U HOTFIX PUBLICATIONS
-- Aligne la table public.church_publications avec l'API actuellement déployée.
-- Script idempotent et compatible avec une ancienne structure partielle.

create extension if not exists pgcrypto;

do $$
begin
  if to_regclass('public.church_publications') is null then
    create table public.church_publications (
      id uuid primary key default gen_random_uuid(),
      church_id uuid not null references public.churches(id) on delete cascade,
      title text not null,
      description text,
      content text,
      publication_type text not null default 'teaching',
      video_url text,
      video_embed_url text,
      cover_image_url text,
      cover_image_path text,
      image_alt text,
      is_published boolean not null default false,
      is_featured boolean not null default false,
      published_at timestamptz,
      notified_at timestamptz,
      created_by uuid,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );
  end if;
end $$;

alter table public.church_publications
  add column if not exists church_id uuid,
  add column if not exists title text,
  add column if not exists description text,
  add column if not exists content text,
  add column if not exists publication_type text default 'teaching',
  add column if not exists video_url text,
  add column if not exists video_embed_url text,
  add column if not exists cover_image_url text,
  add column if not exists cover_image_path text,
  add column if not exists image_alt text,
  add column if not exists is_published boolean default false,
  add column if not exists is_featured boolean default false,
  add column if not exists published_at timestamptz,
  add column if not exists notified_at timestamptz,
  add column if not exists created_by uuid,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

-- Migration douce depuis d'anciens noms de colonnes, lorsqu'ils existent.
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'church_publications'
      and column_name = 'summary'
  ) then
    execute $migration$
      update public.church_publications
      set description = coalesce(description, summary)
      where description is null
    $migration$;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'church_publications'
      and column_name = 'youtube_url'
  ) then
    execute $migration$
      update public.church_publications
      set video_url = coalesce(video_url, youtube_url)
      where video_url is null
    $migration$;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'church_publications'
      and column_name = 'type'
  ) then
    execute $migration$
      update public.church_publications
      set publication_type = coalesce(nullif(publication_type, ''), type::text)
      where publication_type is null
         or publication_type = ''
    $migration$;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'church_publications'
      and column_name = 'featured'
  ) then
    execute $migration$
      update public.church_publications
      set is_featured = coalesce(is_featured, featured)
      where is_featured is null
    $migration$;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'church_publications'
      and column_name = 'status'
  ) then
    execute $migration$
      update public.church_publications
      set is_published =
        case
          when lower(status::text) = 'published' then true
          when lower(status::text) in ('draft', 'archived') then false
          else coalesce(is_published, false)
        end
      where is_published is null
    $migration$;
  end if;
end $$;

update public.church_publications
set
  publication_type = coalesce(nullif(publication_type, ''), 'teaching'),
  is_published = coalesce(is_published, false),
  is_featured = coalesce(is_featured, false),
  created_at = coalesce(created_at, now()),
  updated_at = coalesce(updated_at, created_at, now());

alter table public.church_publications
  alter column publication_type set default 'teaching',
  alter column is_published set default false,
  alter column is_featured set default false,
  alter column created_at set default now(),
  alter column updated_at set default now();

create index if not exists church_publications_church_created_idx
  on public.church_publications(church_id, created_at desc);

create index if not exists church_publications_public_idx
  on public.church_publications(
    church_id,
    is_published,
    is_featured,
    published_at desc
  );

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

alter table public.church_publications enable row level security;

drop policy if exists church_publications_public_read
  on public.church_publications;

create policy church_publications_public_read
on public.church_publications
for select
to anon, authenticated
using (
  is_published = true
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
