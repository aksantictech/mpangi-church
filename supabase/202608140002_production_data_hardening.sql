-- Correctifs de confidentialité et d'intégrité avant mise en production.

-- Les documents internes ne doivent jamais être servis par une URL publique.
insert into storage.buckets (id, name, public)
values ('church-documents', 'church-documents', false)
on conflict (id) do update set public = false;

-- Les écritures passent par les actions serveur, après contrôle du rôle et du périmètre.
-- Supprime l'ancien accès direct trop large accordé à tout utilisateur authentifié.
drop policy if exists "department reports church write"
  on public.department_monthly_reports;

create or replace function public.enforce_department_report_church()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  department_church_id uuid;
  author_church_id uuid;
begin
  select d.church_id into department_church_id
  from public.departments d
  where d.id = new.department_id;

  if department_church_id is null or department_church_id <> new.church_id then
    raise exception 'Le département du rapport doit appartenir à la même église.';
  end if;

  if new.created_by is not null then
    select p.church_id into author_church_id
    from public.profiles p
    where p.id = new.created_by;

    if author_church_id is null or author_church_id <> new.church_id then
      raise exception 'L’auteur du rapport doit appartenir à la même église.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists department_report_church_guard
  on public.department_monthly_reports;
create trigger department_report_church_guard
before insert or update of church_id, department_id, created_by
on public.department_monthly_reports
for each row execute function public.enforce_department_report_church();

create or replace function public.enforce_department_report_recipient_church()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  report_church_id uuid;
  recipient_church_id uuid;
begin
  select r.church_id into report_church_id
  from public.department_monthly_reports r
  where r.id = new.report_id;

  select p.church_id into recipient_church_id
  from public.profiles p
  where p.id = new.profile_id;

  if report_church_id is null
     or recipient_church_id is null
     or new.church_id <> report_church_id
     or new.church_id <> recipient_church_id then
    raise exception 'Le rapport et son destinataire doivent appartenir à la même église.';
  end if;

  return new;
end;
$$;

drop trigger if exists department_report_recipient_church_guard
  on public.department_report_recipients;
create trigger department_report_recipient_church_guard
before insert or update of report_id, church_id, profile_id
on public.department_report_recipients
for each row execute function public.enforce_department_report_recipient_church();

revoke all on function public.enforce_department_report_church() from public;
revoke all on function public.enforce_department_report_church() from authenticated;
revoke all on function public.enforce_department_report_recipient_church() from public;
revoke all on function public.enforce_department_report_recipient_church() from authenticated;
