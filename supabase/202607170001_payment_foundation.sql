-- Mpangi-church — Phase 36A
-- Socle neutre pour les paiements automatisés.
-- Aucun prestataire n'est activé par cette migration.

create extension if not exists pgcrypto;

create table if not exists public.church_payment_transactions (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  donation_id uuid null references public.church_donations(id) on delete set null,

  kind text not null default 'donation'
    check (kind in ('donation', 'subscription', 'invoice', 'other')),

  provider text not null default 'manual',
  provider_transaction_id text null,
  provider_checkout_id text null,
  external_reference text null,
  idempotency_key text not null,

  status text not null default 'created'
    check (
      status in (
        'created',
        'pending',
        'processing',
        'succeeded',
        'failed',
        'cancelled',
        'expired',
        'refunded',
        'partially_refunded'
      )
    ),

  amount numeric(18, 2) not null check (amount > 0),
  currency text not null default 'CDF'
    check (currency ~ '^[A-Z]{3}$'),

  payment_channel text null,
  checkout_url text null,
  return_url text null,

  failure_code text null,
  failure_message text null,

  provider_response jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,

  requested_at timestamptz not null default now(),
  processing_at timestamptz null,
  paid_at timestamptz null,
  failed_at timestamptz null,
  cancelled_at timestamptz null,
  refunded_at timestamptz null,

  created_by uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint church_payment_transactions_idempotency_unique
    unique (church_id, idempotency_key)
);

create unique index if not exists
  church_payment_transactions_provider_reference_unique
on public.church_payment_transactions (
  provider,
  provider_transaction_id
)
where provider_transaction_id is not null;

create index if not exists
  church_payment_transactions_church_created_idx
on public.church_payment_transactions (
  church_id,
  created_at desc
);

create index if not exists
  church_payment_transactions_donation_idx
on public.church_payment_transactions (donation_id)
where donation_id is not null;

create index if not exists
  church_payment_transactions_status_idx
on public.church_payment_transactions (
  church_id,
  status,
  created_at desc
);

create table if not exists public.church_payment_webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  provider_event_id text not null,
  event_type text null,

  transaction_id uuid null
    references public.church_payment_transactions(id)
    on delete set null,

  signature_valid boolean not null default false,
  processing_status text not null default 'received'
    check (
      processing_status in (
        'received',
        'processing',
        'processed',
        'ignored',
        'failed'
      )
    ),

  payload jsonb not null default '{}'::jsonb,
  headers jsonb not null default '{}'::jsonb,
  error_message text null,

  received_at timestamptz not null default now(),
  processed_at timestamptz null,
  created_at timestamptz not null default now(),

  constraint church_payment_webhook_events_provider_event_unique
    unique (provider, provider_event_id)
);

create index if not exists
  church_payment_webhook_events_transaction_idx
on public.church_payment_webhook_events (
  transaction_id,
  received_at desc
);

create index if not exists
  church_payment_webhook_events_processing_idx
on public.church_payment_webhook_events (
  processing_status,
  received_at
);

create table if not exists public.church_payment_status_history (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null
    references public.church_payment_transactions(id)
    on delete cascade,

  previous_status text null,
  next_status text not null,
  source text not null default 'system'
    check (source in ('system', 'webhook', 'administrator', 'provider')),

  reason text null,
  provider_event_id text null,
  changed_by uuid null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists
  church_payment_status_history_transaction_idx
on public.church_payment_status_history (
  transaction_id,
  created_at desc
);

alter table public.church_donations
  add column if not exists payment_transaction_id uuid null,
  add column if not exists payment_attempt_count integer not null default 0,
  add column if not exists last_payment_error text null,
  add column if not exists last_payment_attempt_at timestamptz null,
  add column if not exists paid_at timestamptz null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'church_donations_payment_transaction_fk'
  ) then
    alter table public.church_donations
      add constraint church_donations_payment_transaction_fk
      foreign key (payment_transaction_id)
      references public.church_payment_transactions(id)
      on delete set null;
  end if;
end;
$$;

create or replace function public.set_church_payment_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists
  set_church_payment_transactions_updated_at
on public.church_payment_transactions;

create trigger set_church_payment_transactions_updated_at
before update on public.church_payment_transactions
for each row
execute function public.set_church_payment_updated_at();

create or replace function public.log_church_payment_status_change()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if tg_op = 'INSERT' or old.status is distinct from new.status then
    insert into public.church_payment_status_history (
      transaction_id,
      previous_status,
      next_status,
      source,
      reason,
      metadata
    )
    values (
      new.id,
      case when tg_op = 'INSERT' then null else old.status end,
      new.status,
      'system',
      case when tg_op = 'INSERT' then 'Transaction créée' else null end,
      '{}'::jsonb
    );
  end if;

  return new;
end;
$$;

drop trigger if exists
  log_church_payment_transaction_status
on public.church_payment_transactions;

create trigger log_church_payment_transaction_status
after insert or update of status
on public.church_payment_transactions
for each row
execute function public.log_church_payment_status_change();

alter table public.church_payment_transactions enable row level security;
alter table public.church_payment_webhook_events enable row level security;
alter table public.church_payment_status_history enable row level security;

-- Aucune politique publique n'est créée volontairement.
-- Ces tables sont manipulées côté serveur avec le client administrateur.

comment on table public.church_payment_transactions is
  'Transactions de paiement indépendantes du prestataire.';

comment on table public.church_payment_webhook_events is
  'Événements webhook reçus, dédupliqués et audités.';

comment on table public.church_payment_status_history is
  'Historique immuable des changements de statut de paiement.';
