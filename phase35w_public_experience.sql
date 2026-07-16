-- MPANGI-CHURCH — PHASE 35W
-- Mise en vedette publique + compatibilité événements.
-- Script idempotent.

alter table public.church_publications
  add column if not exists is_featured boolean not null default false,
  add column if not exists is_published boolean not null default false,
  add column if not exists publication_type text not null default 'teaching',
  add column if not exists published_at timestamptz,
  add column if not exists cover_image_url text;

-- Supprimer uniquement les contraintes CHECK qui limitent publication_type.
do $$
declare
  constraint_row record;
begin
  for constraint_row in
    select conname
    from pg_constraint
    where conrelid =
      'public.church_publications'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid)
        ilike '%publication_type%'
  loop
    execute format(
      'alter table public.church_publications drop constraint if exists %I',
      constraint_row.conname
    );
  end loop;
end $$;

alter table public.church_publications
  add constraint church_publications_type_check
  check (
    publication_type in (
      'teaching',
      'video',
      'message',
      'announcement',
      'sermon',
      'event',
      'news',
      'actuality'
    )
  )
  not valid;

alter table public.church_publications
  validate constraint church_publications_type_check;

-- Compatibilité souple avec les tables d'événements existantes.
do $$
begin
  if to_regclass('public.events') is not null then
    execute '
      alter table public.events
        add column if not exists is_featured boolean not null default false,
        add column if not exists is_public boolean not null default true,
        add column if not exists cover_image_url text
    ';
  end if;

  if to_regclass('public.church_events') is not null then
    execute '
      alter table public.church_events
        add column if not exists is_featured boolean not null default false,
        add column if not exists is_public boolean not null default true,
        add column if not exists cover_image_url text
    ';
  end if;
end $$;

create index if not exists church_publications_featured_public_idx
  on public.church_publications(
    church_id,
    is_published,
    is_featured,
    published_at desc
  );

notify pgrst, 'reload schema';
