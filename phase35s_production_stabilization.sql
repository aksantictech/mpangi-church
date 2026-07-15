-- MPANGI-CHURCH — PHASE 35S
-- Sous-domaines canoniques et routage durable.

alter table public.churches
  add column if not exists subdomain text;

update public.churches
set subdomain = 'icckinshasa'
where slug = 'iccrdc'
  and coalesce(trim(subdomain), '') = '';

update public.churches
set subdomain = 'mdm'
where slug = 'maison-misericorde-cmp'
  and coalesce(trim(subdomain), '') = '';

update public.churches
set subdomain = left(
  trim(both '-' from regexp_replace(
    lower(slug),
    '[^a-z0-9-]+',
    '-',
    'g'
  )),
  63
)
where coalesce(trim(subdomain), '') = ''
  and slug is not null;

update public.churches
set subdomain = lower(trim(subdomain))
where subdomain is not null;

create unique index if not exists churches_subdomain_lower_unique
  on public.churches (lower(subdomain))
  where subdomain is not null;

alter table public.churches
  drop constraint if exists churches_subdomain_format_check;

alter table public.churches
  add constraint churches_subdomain_format_check
  check (
    subdomain is null
    or subdomain ~ '^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$'
  ) not valid;

comment on column public.churches.subdomain is
  'Sous-domaine canonique sans le domaine racine, ex. icckinshasa.';

notify pgrst, 'reload schema';

select id, name, slug, subdomain, status
from public.churches
order by name;
