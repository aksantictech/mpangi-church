alter table public.department_monthly_reports
  add column if not exists period_start date,
  add column if not exists period_end date,
  add column if not exists edit_until timestamptz,
  add column if not exists sent_at timestamptz;

update public.department_monthly_reports
set period_start = coalesce(period_start, report_month),
    period_end = coalesce(period_end, (report_month + interval '1 month - 1 day')::date),
    edit_until = coalesce(edit_until, now() + interval '7 days')
where period_start is null or period_end is null or edit_until is null;

create table if not exists public.department_report_recipients (
  report_id uuid not null references public.department_monthly_reports(id) on delete cascade,
  church_id uuid not null references public.churches(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (report_id, profile_id)
);
create index if not exists department_report_recipients_profile_idx
  on public.department_report_recipients (church_id, profile_id, read_at);
alter table public.department_report_recipients enable row level security;
drop policy if exists "department report recipients same church" on public.department_report_recipients;
create policy "department report recipients same church" on public.department_report_recipients
for select to authenticated using (
  church_id in (select p.church_id from public.profiles p where p.user_id = auth.uid())
);

insert into public.app_modules (code, name, category, description, sort_order, is_core, is_active, icon_name, group_key)
values ('ai_assistant', 'Assistant intelligent', 'system', 'Recherche et résumés sécurisés sur les données de l’église.', 35, false, true, 'sparkles', 'system')
on conflict (code) do update set
  name = excluded.name, description = excluded.description, is_active = true;
