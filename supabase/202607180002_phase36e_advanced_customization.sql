begin;

alter table public.churches
  add column if not exists theme_color text
    default '#03357A',

  add column if not exists secondary_color text
    default '#2563EB',

  add column if not exists accent_color text
    default '#8B5CF6',

  add column if not exists background_color text
    default '#F5F9FC',

  add column if not exists surface_color text
    default '#FFFFFF',

  add column if not exists text_color text
    default '#0F172A',

  add column if not exists pwa_name text,

  add column if not exists pwa_short_name text,

  add column if not exists public_slogan text,

  add column if not exists public_layout text
    default 'modern',

  add column if not exists public_hero_style text
    default 'gradient',

  add column if not exists dashboard_welcome_message text,

  add column if not exists show_pastor boolean
    default true,

  add column if not exists show_programs boolean
    default true,

  add column if not exists show_publications boolean
    default true,

  add column if not exists show_teachings boolean
    default true,

  add column if not exists show_donations boolean
    default true,

  add column if not exists customization_updated_at timestamptz;

update public.churches
set
  theme_color = coalesce(
    nullif(trim(theme_color), ''),
    '#03357A'
  ),
  secondary_color = coalesce(
    nullif(trim(secondary_color), ''),
    '#2563EB'
  ),
  accent_color = coalesce(
    nullif(trim(accent_color), ''),
    '#8B5CF6'
  ),
  background_color = coalesce(
    nullif(trim(background_color), ''),
    '#F5F9FC'
  ),
  surface_color = coalesce(
    nullif(trim(surface_color), ''),
    '#FFFFFF'
  ),
  text_color = coalesce(
    nullif(trim(text_color), ''),
    '#0F172A'
  ),
  public_layout = coalesce(
    nullif(trim(public_layout), ''),
    'modern'
  ),
  public_hero_style = coalesce(
    nullif(trim(public_hero_style), ''),
    'gradient'
  ),
  show_pastor = coalesce(show_pastor, true),
  show_programs = coalesce(show_programs, true),
  show_publications = coalesce(
    show_publications,
    true
  ),
  show_teachings = coalesce(
    show_teachings,
    true
  ),
  show_donations = coalesce(
    show_donations,
    true
  );

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname =
      'churches_public_layout_check'
  ) then
    alter table public.churches
      add constraint
        churches_public_layout_check
      check (
        public_layout in (
          'modern',
          'classic',
          'minimal'
        )
      );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname =
      'churches_public_hero_style_check'
  ) then
    alter table public.churches
      add constraint
        churches_public_hero_style_check
      check (
        public_hero_style in (
          'gradient',
          'image',
          'solid'
        )
      );
  end if;
end
$$;

comment on column public.churches.theme_color is
  'Couleur principale de l’église.';

comment on column public.churches.secondary_color is
  'Couleur secondaire de l’identité visuelle.';

comment on column public.churches.accent_color is
  'Couleur utilisée pour les accents et boutons secondaires.';

comment on column public.churches.pwa_name is
  'Nom complet de l’application PWA de l’église.';

comment on column public.churches.pwa_short_name is
  'Nom court affiché sous l’icône PWA.';

comment on column public.churches.public_layout is
  'Style général de la page publique.';

comment on column public.churches.public_hero_style is
  'Style du bloc principal de la page publique.';

commit;