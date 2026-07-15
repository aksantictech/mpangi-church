-- MPANGI-CHURCH — HOTFIX IMMÉDIAT PUBLICATIONS
-- Corrige uniquement l'erreur PostgREST :
-- "Could not find the 'description' column of 'church_publications' in the schema cache"
-- Script idempotent.

do $$
begin
  if to_regclass('public.church_publications') is null then
    raise exception
      'La table public.church_publications est absente. Transmettre le contexte Phase 35U.';
  end if;
end $$;

alter table public.church_publications
  add column if not exists description text;

notify pgrst, 'reload schema';

select
  column_name,
  data_type,
  is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'church_publications'
order by ordinal_position;
