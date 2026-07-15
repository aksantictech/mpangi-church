-- MPANGI-CHURCH — PHASE 35T
-- Utilisateurs d’église + véritable parcours de dons.
-- Script idempotent.

alter table public.churches
  add column if not exists donation_bible_verse_text text,
  add column if not exists donation_bible_verse_reference text,

  add column if not exists donation_mpesa_enabled boolean not null default false,
  add column if not exists donation_mpesa_number text,
  add column if not exists donation_mpesa_name text,

  add column if not exists donation_airtel_enabled boolean not null default false,
  add column if not exists donation_airtel_number text,
  add column if not exists donation_airtel_name text,

  add column if not exists donation_orange_enabled boolean not null default false,
  add column if not exists donation_orange_number text,
  add column if not exists donation_orange_name text,

  add column if not exists donation_card_enabled boolean not null default false,
  add column if not exists donation_bank_enabled boolean not null default false;

alter table public.church_donations
  add column if not exists payment_channel text,
  add column if not exists payment_instructions_snapshot jsonb
    not null default '{}'::jsonb;

update public.churches
set
  donation_bible_verse_text = coalesce(
    nullif(donation_bible_verse_text, ''),
    'Honore l’Éternel avec tes biens, et avec les prémices de tout ton revenu : alors tes greniers seront remplis d’abondance.'
  ),
  donation_bible_verse_reference = coalesce(
    nullif(donation_bible_verse_reference, ''),
    'Proverbes 3:9-10'
  );

-- Migration douce de l’ancien numéro Mobile Money vers M-Pesa.
update public.churches
set
  donation_mpesa_enabled = true,
  donation_mpesa_number = donation_mobile_money,
  donation_mpesa_name = donation_mobile_money_name
where
  donation_mobile_money is not null
  and nullif(trim(donation_mobile_money), '') is not null
  and donation_mpesa_number is null;

update public.churches
set donation_card_enabled = true
where
  donation_card_url is not null
  and nullif(trim(donation_card_url), '') is not null;

update public.churches
set donation_bank_enabled = true
where
  (
    donation_bank_account_number is not null
    and nullif(trim(donation_bank_account_number), '') is not null
  )
  or (
    donation_bank_iban is not null
    and nullif(trim(donation_bank_iban), '') is not null
  );

update public.church_donations
set payment_channel =
  case
    when method = 'card' then 'card'
    when method = 'bank_transfer' then 'bank_transfer'
    when method = 'cash' then 'cash'
    when method = 'mobile_money' then 'mpesa'
    else method
  end
where payment_channel is null;

create index if not exists church_donations_payment_channel_idx
  on public.church_donations(
    church_id,
    payment_channel,
    created_at desc
  );

notify pgrst, 'reload schema';
