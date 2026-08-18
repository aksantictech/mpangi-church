begin;

create table if not exists public.soul_intakes (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  last_name text not null,
  middle_name text,
  first_name text not null,
  reception_date date not null default current_date,
  service_type text not null check (service_type in ('dimanche','semaine')),
  gender text not null check (gender in ('homme','femme')),
  marital_status text not null check (marital_status in ('marie','celibataire','veuf','veuve','en_couple')),
  age_range text not null check (age_range in ('0_12','13_17','18_25','26_35','36_45','46_60','60_plus')),
  residence_address text not null,
  city text not null,
  country text not null,
  whatsapp_phone text not null,
  other_phone text,
  arrival_channel text not null check (arrival_channel in ('amis','evangelisation','flyers','reseaux_sociaux','autre')),
  attends_other_church boolean not null default false,
  is_newcomer boolean not null default false,
  is_new_convert boolean not null default false,
  comment text,
  assigned_profile_id uuid references public.profiles(id) on delete set null,
  linked_followup_id uuid,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint soul_intakes_type_check check (is_newcomer or is_new_convert)
);

create index if not exists soul_intakes_church_reception_idx
  on public.soul_intakes(church_id, reception_date desc);
create index if not exists soul_intakes_assigned_idx
  on public.soul_intakes(church_id, assigned_profile_id, reception_date desc);

alter table public.soul_intakes enable row level security;

drop policy if exists "soul intake church read" on public.soul_intakes;
create policy "soul intake church read"
  on public.soul_intakes for select to authenticated
  using (
    church_id in (
      select p.church_id from public.profiles p where p.user_id = auth.uid()
    )
  );

drop policy if exists "soul intake church write" on public.soul_intakes;
create policy "soul intake church write"
  on public.soul_intakes for all to authenticated
  using (
    church_id in (
      select p.church_id from public.profiles p where p.user_id = auth.uid()
    )
  )
  with check (
    church_id in (
      select p.church_id from public.profiles p where p.user_id = auth.uid()
    )
  );

alter table public.soul_followups
  add column if not exists intake_id uuid references public.soul_intakes(id) on delete set null;

create index if not exists soul_followups_intake_idx
  on public.soul_followups(church_id, intake_id);

-- La FK inverse est ajoutée après soul_followups.intake_id pour éviter une dépendance circulaire lors de la création.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'soul_intakes_linked_followup_id_fkey'
  ) then
    alter table public.soul_intakes
      add constraint soul_intakes_linked_followup_id_fkey
      foreign key (linked_followup_id) references public.soul_followups(id) on delete set null;
  end if;
end $$;

notify pgrst, 'reload schema';
commit;
