begin;

create table if not exists public.giving_campaigns (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  name text not null,
  description text,
  target_amount numeric(14,2) not null check (target_amount > 0),
  currency text not null default 'CDF',
  starts_on date,
  ends_on date,
  status text not null default 'draft' check (status in ('draft', 'active', 'completed', 'archived')),
  public_enabled boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_on is null or starts_on is null or ends_on >= starts_on)
);

create table if not exists public.giving_pledges (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  campaign_id uuid not null references public.giving_campaigns(id) on delete cascade,
  member_id uuid references public.members(id) on delete set null,
  donor_name text not null,
  donor_email text,
  donor_phone text,
  pledged_amount numeric(14,2) not null check (pledged_amount > 0),
  paid_amount numeric(14,2) not null default 0 check (paid_amount >= 0),
  currency text not null default 'CDF',
  frequency text not null default 'one_time' check (frequency in ('one_time', 'monthly', 'quarterly')),
  due_date date,
  status text not null default 'active' check (status in ('active', 'fulfilled', 'cancelled')),
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.giving_pledge_payments (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  pledge_id uuid not null references public.giving_pledges(id) on delete cascade,
  donation_id uuid references public.church_donations(id) on delete set null,
  amount numeric(14,2) not null check (amount > 0),
  paid_on date not null default current_date,
  method text not null default 'cash',
  reference text,
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.church_forms (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  title text not null,
  description text,
  public_token text not null default replace(gen_random_uuid()::text, '-', ''),
  form_type text not null default 'general' check (form_type in ('general', 'event', 'group', 'volunteer', 'counseling')),
  fields jsonb not null default '[]'::jsonb check (jsonb_typeof(fields) = 'array'),
  confirmation_message text not null default 'Merci, votre réponse a bien été enregistrée.',
  status text not null default 'draft' check (status in ('draft', 'published', 'closed', 'archived')),
  public_enabled boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint church_forms_public_token_unique unique (public_token)
);

create table if not exists public.church_form_submissions (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  form_id uuid not null references public.church_forms(id) on delete cascade,
  submitted_by_member_id uuid references public.members(id) on delete set null,
  respondent_name text,
  respondent_email text,
  respondent_phone text,
  submission_fingerprint text,
  answers jsonb not null default '{}'::jsonb check (jsonb_typeof(answers) = 'object'),
  status text not null default 'new' check (status in ('new', 'reviewing', 'approved', 'rejected', 'archived')),
  assigned_profile_id uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists giving_campaigns_church_status_idx on public.giving_campaigns(church_id, status, starts_on desc);
create index if not exists giving_pledges_campaign_idx on public.giving_pledges(church_id, campaign_id, status);
create index if not exists giving_pledge_payments_pledge_idx on public.giving_pledge_payments(church_id, pledge_id, paid_on desc);
create index if not exists church_forms_church_status_idx on public.church_forms(church_id, status, created_at desc);
create index if not exists church_form_submissions_form_idx on public.church_form_submissions(church_id, form_id, status, created_at desc);
create index if not exists church_form_submissions_rate_idx on public.church_form_submissions(church_id, form_id, submission_fingerprint, created_at desc);

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'giving_campaigns', 'giving_pledges', 'giving_pledge_payments',
    'church_forms', 'church_form_submissions'
  ] loop
    execute format('drop trigger if exists phase3_updated_at on public.%I', table_name);
    execute format('create trigger phase3_updated_at before update on public.%I for each row execute function public.ministry_set_updated_at()', table_name);
  end loop;
end $$;

do $$
declare relation record;
begin
  for relation in select * from (values
    ('giving_pledges', 'giving_campaigns', 'campaign_id'),
    ('giving_pledges', 'members', 'member_id'),
    ('giving_pledge_payments', 'giving_pledges', 'pledge_id'),
    ('giving_pledge_payments', 'church_donations', 'donation_id'),
    ('church_form_submissions', 'church_forms', 'form_id'),
    ('church_form_submissions', 'members', 'submitted_by_member_id')
  ) as refs(child_table, parent_table, reference_column)
  loop
    execute format('drop trigger if exists phase3_tenant_%I on public.%I', relation.reference_column, relation.child_table);
    execute format(
      'create trigger phase3_tenant_%I before insert or update on public.%I for each row execute function public.ministry_validate_tenant_reference(%L, %L)',
      relation.reference_column, relation.child_table, relation.parent_table, relation.reference_column
    );
  end loop;
end $$;

create or replace function public.phase3_refresh_pledge_payment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare target_pledge uuid;
begin
  if tg_op = 'DELETE' then
    target_pledge := old.pledge_id;
  else
    target_pledge := new.pledge_id;
  end if;
  update public.giving_pledges pledge
  set paid_amount = totals.total,
      status = case
        when pledge.status = 'cancelled' then 'cancelled'
        when totals.total >= pledge.pledged_amount then 'fulfilled'
        else 'active'
      end,
      updated_at = now()
  from (
    select coalesce(sum(amount), 0)::numeric(14,2) as total
    from public.giving_pledge_payments
    where pledge_id = target_pledge
  ) totals
  where pledge.id = target_pledge;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists phase3_refresh_pledge_payment on public.giving_pledge_payments;
create trigger phase3_refresh_pledge_payment
after insert or update or delete on public.giving_pledge_payments
for each row execute function public.phase3_refresh_pledge_payment();

create or replace function public.is_phase3_growth_staff(target_church_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1 from public.profiles p
    where p.user_id = auth.uid()
      and p.church_id = target_church_id
      and p.status::text in ('active', 'actif')
      and p.role::text in ('church_admin', 'admin_eglise', 'pasteur_t', 'pastor', 'pasteur_a', 'charge_afp', 'responsable_d', 'secretaire')
  );
$$;

grant execute on function public.is_phase3_growth_staff(uuid) to authenticated;

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'giving_campaigns', 'giving_pledges', 'giving_pledge_payments',
    'church_forms', 'church_form_submissions'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('drop policy if exists phase3_growth_staff_access on public.%I', table_name);
    execute format(
      'create policy phase3_growth_staff_access on public.%I for all to authenticated using (public.is_phase3_growth_staff(church_id)) with check (public.is_phase3_growth_staff(church_id))',
      table_name
    );
  end loop;
end $$;

insert into public.app_modules (code, name, category, description, sort_order)
values
  ('giving_campaigns', 'Campagnes et promesses', 'finance', 'Piloter les objectifs, promesses et versements des campagnes.', 255),
  ('custom_forms', 'Formulaires et inscriptions', 'spiritual', 'Créer des formulaires publics et traiter les réponses.', 131),
  ('engagement_insights', 'Pilotage de l’engagement', 'spiritual', 'Suivre la participation et les actions pastorales prioritaires.', 132)
on conflict (code) do update set
  name = excluded.name,
  category = excluded.category,
  description = excluded.description,
  sort_order = excluded.sort_order,
  is_active = true;

insert into public.church_modules (church_id, module_code, is_enabled, enabled_at)
select churches.id, modules.module_code, true, now()
from public.churches
cross join (values ('giving_campaigns'), ('custom_forms'), ('engagement_insights')) as modules(module_code)
on conflict (church_id, module_code) do update set
  is_enabled = true,
  enabled_at = coalesce(public.church_modules.enabled_at, now()),
  updated_at = now();

insert into public.church_role_module_permissions (
  church_id, role_code, module_code, can_view, can_create, can_update,
  can_delete, can_approve, is_enabled
)
select churches.id, roles.role_code, modules.module_code,
  roles.can_view, roles.can_create, roles.can_update, roles.can_delete, roles.can_approve, true
from public.churches
cross join (values
  ('church_admin', true, true, true, true, true),
  ('pasteur_t', true, true, true, false, true),
  ('pasteur_a', true, true, true, false, false),
  ('charge_afp', true, true, true, false, true),
  ('responsable_d', true, true, true, false, false),
  ('secretaire', true, true, true, false, false),
  ('readonly', true, false, false, false, false)
) as roles(role_code, can_view, can_create, can_update, can_delete, can_approve)
cross join (values ('giving_campaigns'), ('custom_forms'), ('engagement_insights')) as modules(module_code)
where
  roles.role_code in ('church_admin', 'pasteur_t')
  or (roles.role_code = 'pasteur_a' and modules.module_code in ('custom_forms', 'engagement_insights'))
  or (roles.role_code = 'charge_afp' and modules.module_code in ('giving_campaigns', 'engagement_insights'))
  or (roles.role_code = 'responsable_d' and modules.module_code in ('custom_forms', 'engagement_insights'))
  or (roles.role_code = 'secretaire' and modules.module_code = 'custom_forms')
  or (roles.role_code = 'readonly' and modules.module_code = 'engagement_insights')
on conflict (church_id, role_code, module_code) do update set
  can_view = excluded.can_view,
  can_create = excluded.can_create,
  can_update = excluded.can_update,
  can_delete = excluded.can_delete,
  can_approve = excluded.can_approve,
  is_enabled = true,
  updated_at = now();

create or replace function public.seed_phase3_for_church()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.church_modules (church_id, module_code, is_enabled, enabled_at)
  select new.id, module_code, true, now()
  from (values ('giving_campaigns'), ('custom_forms'), ('engagement_insights')) modules(module_code)
  on conflict (church_id, module_code) do nothing;

  insert into public.church_role_module_permissions (
    church_id, role_code, module_code, can_view, can_create, can_update,
    can_delete, can_approve, is_enabled
  )
  select new.id, roles.role_code, modules.module_code,
    roles.can_view, roles.can_create, roles.can_update, roles.can_delete, roles.can_approve, true
  from (values
    ('church_admin', true, true, true, true, true),
    ('pasteur_t', true, true, true, false, true),
    ('pasteur_a', true, true, true, false, false),
    ('charge_afp', true, true, true, false, true),
    ('responsable_d', true, true, true, false, false),
    ('secretaire', true, true, true, false, false),
    ('readonly', true, false, false, false, false)
  ) roles(role_code, can_view, can_create, can_update, can_delete, can_approve)
  cross join (values ('giving_campaigns'), ('custom_forms'), ('engagement_insights')) modules(module_code)
  where
    roles.role_code in ('church_admin', 'pasteur_t')
    or (roles.role_code = 'pasteur_a' and modules.module_code in ('custom_forms', 'engagement_insights'))
    or (roles.role_code = 'charge_afp' and modules.module_code in ('giving_campaigns', 'engagement_insights'))
    or (roles.role_code = 'responsable_d' and modules.module_code in ('custom_forms', 'engagement_insights'))
    or (roles.role_code = 'secretaire' and modules.module_code = 'custom_forms')
    or (roles.role_code = 'readonly' and modules.module_code = 'engagement_insights')
  on conflict (church_id, role_code, module_code) do nothing;
  return new;
end;
$$;

drop trigger if exists seed_phase3_for_church on public.churches;
create trigger seed_phase3_for_church
after insert on public.churches
for each row execute function public.seed_phase3_for_church();

commit;
