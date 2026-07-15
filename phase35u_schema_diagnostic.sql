-- MPANGI-CHURCH — DIAGNOSTIC SCHÉMA PHASE 35U
-- Exécuter dans Supabase SQL Editor.

select
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
from information_schema.columns
where table_schema = 'public'
  and table_name in (
    'church_publications',
    'bible_versions',
    'bible_books',
    'bible_verses',
    'push_subscriptions',
    'notifications',
    'churches',
    'app_modules',
    'church_modules',
    'church_role_module_permissions'
  )
order by table_name, ordinal_position;

select
  schemaname,
  tablename,
  policyname,
  cmd,
  roles,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename in (
    'church_publications',
    'push_subscriptions',
    'notifications',
    'bible_versions',
    'bible_books',
    'bible_verses'
  )
order by tablename, policyname;
