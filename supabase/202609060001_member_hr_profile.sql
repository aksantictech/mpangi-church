-- Enrichit le dossier membre avec les informations familiales,
-- le parcours de formation et la vie dans l'église.

alter table public.members
  add column if not exists preferred_name text,
  add column if not exists family_name text,
  add column if not exists family_role text,
  add column if not exists spouse_name text,
  add column if not exists children_names text,
  add column if not exists anniversary_date date,
  add column if not exists emergency_contact_name text,
  add column if not exists emergency_contact_phone text,
  add column if not exists emergency_contact_relationship text,
  add column if not exists conversion_date date,
  add column if not exists baptism_date date,
  add column if not exists membership_date date,
  add column if not exists previous_church text,
  add column if not exists discipleship_stage text,
  add column if not exists mentor_name text,
  add column if not exists training_goal text,
  add column if not exists last_training_review_date date,
  add column if not exists small_group text,
  add column if not exists ministry_interests text,
  add column if not exists spiritual_gifts text,
  add column if not exists volunteer_availability text;

comment on column public.members.family_name is
  'Nom du foyer permettant de regrouper et rechercher les membres d une même famille.';
comment on column public.members.discipleship_stage is
  'Étape actuelle du parcours de foi et d intégration.';
comment on column public.members.training_goal is
  'Prochaine étape ou objectif de formation du membre.';
comment on column public.members.small_group is
  'Cellule, groupe de maison ou groupe de proximité du membre.';

create index if not exists members_church_family_name_idx
  on public.members (church_id, lower(family_name))
  where family_name is not null and archived_at is null;

create index if not exists members_church_discipleship_stage_idx
  on public.members (church_id, discipleship_stage)
  where archived_at is null;
