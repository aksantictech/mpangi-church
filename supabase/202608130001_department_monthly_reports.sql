create table if not exists public.department_monthly_reports (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  department_id uuid not null references public.departments(id) on delete cascade,
  report_month date not null,
  strengths text,
  weaknesses text,
  opportunities text,
  threats text,
  next_actions text,
  status text not null default 'draft' check (status in ('draft', 'submitted')),
  created_by uuid references public.profiles(id) on delete set null,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (department_id, report_month)
);

create index if not exists department_monthly_reports_church_month_idx
  on public.department_monthly_reports (church_id, report_month desc);

alter table public.department_monthly_reports enable row level security;

drop policy if exists "department reports church read" on public.department_monthly_reports;
create policy "department reports church read"
  on public.department_monthly_reports for select to authenticated
  using (church_id in (select p.church_id from public.profiles p where p.user_id = auth.uid()));

drop policy if exists "department reports church write" on public.department_monthly_reports;
create policy "department reports church write"
  on public.department_monthly_reports for all to authenticated
  using (church_id in (select p.church_id from public.profiles p where p.user_id = auth.uid()))
  with check (church_id in (select p.church_id from public.profiles p where p.user_id = auth.uid()));
