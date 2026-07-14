-- MPANGI-CHURCH — PHASE 35C
-- Module complet de dons : configuration par église, intentions de dons,
-- suivi financier et RLS.
--
-- Ce script est idempotent.

create extension if not exists pgcrypto;

alter table public.churches
  add column if not exists donation_default_currency text default 'CDF',
  add column if not exists donation_allowed_currencies text[]
    default array['CDF', 'USD', 'EUR']::text[],
  add column if not exists donation_min_amount numeric(18,2) default 1,
  add column if not exists donation_card_provider_name text,
  add column if not exists donation_cash_enabled boolean default true,
  add column if not exists donation_receipt_email text;

create table if not exists public.church_donations (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null
    references public.churches(id) on delete cascade,

  reference text not null unique,
  public_token uuid not null default gen_random_uuid() unique,

  donor_name text,
  donor_email text,
  donor_phone text,
  is_anonymous boolean not null default false,

  amount numeric(18,2) not null check (amount > 0),
  currency text not null default 'CDF',
  method text not null
    check (method in ('card', 'mobile_money', 'bank_transfer', 'cash')),
  purpose text not null default 'offering'
    check (
      purpose in (
        'offering',
        'tithe',
        'construction',
        'mission',
        'social',
        'thanksgiving',
        'other'
      )
    ),

  note text,
  status text not null default 'pending'
    check (
      status in (
        'pending',
        'awaiting_payment',
        'submitted',
        'confirmed',
        'cancelled',
        'failed'
      )
    ),

  payment_provider text,
  external_payment_url text,
  external_transaction_id text,

  metadata jsonb not null default '{}'::jsonb,

  confirmed_at timestamptz,
  confirmed_by uuid references auth.users(id) on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists church_donations_church_created_idx
  on public.church_donations(church_id, created_at desc);

create index if not exists church_donations_status_idx
  on public.church_donations(church_id, status);

create index if not exists church_donations_reference_idx
  on public.church_donations(reference);

create or replace function public.set_church_donation_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists set_church_donation_updated_at
  on public.church_donations;

create trigger set_church_donation_updated_at
before update on public.church_donations
for each row
execute function public.set_church_donation_updated_at();

alter table public.church_donations enable row level security;

drop policy if exists church_donations_select_authorized
  on public.church_donations;

create policy church_donations_select_authorized
  on public.church_donations
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.profiles as profiles
      where profiles.user_id = auth.uid()
        and (
          profiles.role::text = 'super_admin'
          or (
            profiles.church_id = church_donations.church_id
            and profiles.role::text in (
              'church_admin',
              'admin_eglise',
              'pasteur_t',
              'pastor',
              'charge_afp'
            )
          )
        )
    )
  );

drop policy if exists church_donations_update_authorized
  on public.church_donations;

create policy church_donations_update_authorized
  on public.church_donations
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.profiles as profiles
      where profiles.user_id = auth.uid()
        and (
          profiles.role::text = 'super_admin'
          or (
            profiles.church_id = church_donations.church_id
            and profiles.role::text in (
              'church_admin',
              'admin_eglise',
              'pasteur_t',
              'pastor',
              'charge_afp'
            )
          )
        )
    )
  )
  with check (
    exists (
      select 1
      from public.profiles as profiles
      where profiles.user_id = auth.uid()
        and (
          profiles.role::text = 'super_admin'
          or (
            profiles.church_id = church_donations.church_id
            and profiles.role::text in (
              'church_admin',
              'admin_eglise',
              'pasteur_t',
              'pastor',
              'charge_afp'
            )
          )
        )
    )
  );

-- Aucune policy INSERT publique :
-- les intentions de dons sont créées par une route serveur protégée
-- utilisant la service role.

notify pgrst, 'reload schema';

select
  'PHASE_35C_READY' as status,
  count(*) as donations_count
from public.church_donations;
