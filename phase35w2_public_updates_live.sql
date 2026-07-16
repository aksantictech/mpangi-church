-- MPANGI-CHURCH — PHASE 35W-2
-- Synchronisation des annonces/actualités/événements publics.
-- Script idempotent.

alter table public.church_publications
  add column if not exists publication_type text not null default 'teaching',
  add column if not exists is_published boolean not null default false,
  add column if not exists is_featured boolean not null default false,
  add column if not exists published_at timestamptz,
  add column if not exists cover_image_url text;

-- category est prioritaire lorsqu'elle contient le type réel.
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'church_publications'
      and column_name = 'category'
  ) then
    execute $migration$
      update public.church_publications
      set publication_type =
        case lower(trim(category::text))
          when 'annonce' then 'announcement'
          when 'announcement' then 'announcement'
          when 'actualite' then 'news'
          when 'actualité' then 'news'
          when 'news' then 'news'
          when 'event' then 'event'
          when 'evenement' then 'event'
          when 'événement' then 'event'
          when 'programme' then 'programme'
          when 'program' then 'programme'
          else publication_type
        end
      where category is not null
        and nullif(trim(category::text), '') is not null
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
      set publication_type =
        case lower(trim(type::text))
          when 'annonce' then 'announcement'
          when 'announcement' then 'announcement'
          when 'actualite' then 'news'
          when 'actualité' then 'news'
          when 'news' then 'news'
          when 'event' then 'event'
          when 'evenement' then 'event'
          when 'événement' then 'event'
          when 'programme' then 'programme'
          when 'program' then 'programme'
          else publication_type
        end
      where type is not null
        and nullif(trim(type::text), '') is not null
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
      set
        is_published = true,
        published_at = coalesce(
          published_at,
          created_at,
          now()
        )
      where lower(status::text) in (
        'published',
        'active'
      )
    $migration$;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'church_publications'
      and column_name = 'is_public'
  ) then
    execute $migration$
      update public.church_publications
      set
        is_published = true,
        published_at = coalesce(
          published_at,
          created_at,
          now()
        )
      where is_public = true
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
      set is_featured = featured
      where featured is not null
    $migration$;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'church_publications'
      and column_name = 'image_url'
  ) then
    execute $migration$
      update public.church_publications
      set cover_image_url = image_url
      where cover_image_url is null
        and image_url is not null
    $migration$;
  end if;
end $$;

create index if not exists church_publications_home_feed_idx
  on public.church_publications(
    church_id,
    is_published,
    is_featured,
    publication_type,
    published_at desc
  );

notify pgrst, 'reload schema';

select
  id,
  title,
  publication_type,
  is_published,
  is_featured,
  published_at
from public.church_publications
where publication_type in (
  'announcement',
  'news',
  'event',
  'programme'
)
order by created_at desc
limit 30;
