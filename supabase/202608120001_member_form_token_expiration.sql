alter table public.churches
  add column if not exists member_form_token_expires_at timestamptz;

comment on column public.churches.member_form_token_expires_at is
  'Expiration facultative du lien public d inscription membre. NULL conserve la compatibilite des anciens liens.';

create table if not exists public.public_member_registration_rate_limits (
  church_id uuid not null references public.churches(id) on delete cascade,
  fingerprint text not null,
  window_started_at timestamptz not null default now(),
  attempts integer not null default 1 check (attempts > 0),
  primary key (church_id, fingerprint)
);

alter table public.public_member_registration_rate_limits enable row level security;

create or replace function public.check_public_member_registration_rate_limit(
  p_church_id uuid,
  p_fingerprint text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  current_attempts integer;
begin
  insert into public.public_member_registration_rate_limits as limits (
    church_id, fingerprint, window_started_at, attempts
  ) values (
    p_church_id, p_fingerprint, now(), 1
  )
  on conflict (church_id, fingerprint) do update
    set attempts = case
          when limits.window_started_at < now() - interval '15 minutes' then 1
          else limits.attempts + 1
        end,
        window_started_at = case
          when limits.window_started_at < now() - interval '15 minutes' then now()
          else limits.window_started_at
        end
  returning attempts into current_attempts;

  return current_attempts <= 5;
end;
$$;

revoke all on function public.check_public_member_registration_rate_limit(uuid, text) from public;
grant execute on function public.check_public_member_registration_rate_limit(uuid, text) to service_role;

alter table public.members
  add column if not exists registration_source text,
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by uuid references public.profiles(id) on delete set null;

create index if not exists members_church_pending_registration_idx
  on public.members (church_id, created_at desc)
  where status = 'en_attente';
