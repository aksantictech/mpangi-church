-- MPANGI-CHURCH
-- CORRECTION DÉFINITIVE DU SCHÉMA public.profiles
--
-- Schéma réel constaté :
-- profiles.id      = clé propre au profil, générée par PostgreSQL
-- profiles.user_id = identifiant auth.users.id, obligatoire
--
-- Ne mettez plus auth.users.id dans profiles.id.

create extension if not exists pgcrypto;

do $$
begin
  if to_regclass('public.profiles') is null then
    raise exception 'La table public.profiles est absente.';
  end if;
end $$;

-- Réparer les anciennes lignes pouvant être reliées par email.
update public.profiles as profiles
set user_id = users.id
from auth.users as users
where profiles.user_id is null
  and lower(profiles.email) = lower(users.email);

-- Détecter les doublons avant la contrainte unique.
do $$
begin
  if exists (
    select user_id
    from public.profiles
    where user_id is not null
    group by user_id
    having count(*) > 1
  ) then
    raise exception
      'Des doublons existent dans profiles.user_id. Corrigez-les avant de continuer.';
  end if;
end $$;

create unique index if not exists profiles_user_id_unique_idx
  on public.profiles(user_id);

create or replace function public.handle_new_auth_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  profile_full_name text;
  raw_role text;
  raw_status text;
  profile_role public.profiles.role%type;
  profile_status public.profiles.status%type;
  profile_church_id uuid;
begin
  profile_full_name := coalesce(
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'name', ''),
    split_part(coalesce(new.email, 'utilisateur'), '@', 1)
  );

  raw_role := lower(
    coalesce(
      nullif(new.raw_user_meta_data ->> 'role', ''),
      'worker'
    )
  );

  raw_role := case raw_role
    when 'super_admin' then 'super_admin'
    when 'church_admin' then 'church_admin'
    when 'admin_eglise' then 'church_admin'
    when 'pastor_titulaire' then 'pasteur_t'
    when 'pasteur_titulaire' then 'pasteur_t'
    when 'pastor' then 'pasteur_t'
    when 'pasteur' then 'pasteur_t'
    when 'pasteur_t' then 'pasteur_t'
    when 'pastor_assistant' then 'pasteur_a'
    when 'assistant_pastor' then 'pasteur_a'
    when 'pasteur_assistant' then 'pasteur_a'
    when 'pasteur_a' then 'pasteur_a'
    when 'charge_afp' then 'charge_afp'
    when 'responsable_d' then 'responsable_d'
    when 'department_leader' then 'responsable_d'
    when 'logisticien' then 'logisticien'
    when 'secretary' then 'secretaire'
    when 'secretaire' then 'secretaire'
    when 'worker' then 'worker'
    when 'church_worker' then 'worker'
    when 'readonly' then 'readonly'
    when 'viewer' then 'readonly'
    when 'member' then 'member'
    else 'worker'
  end;

  raw_status := lower(
    coalesce(
      nullif(new.raw_user_meta_data ->> 'status', ''),
      'active'
    )
  );

  select typed_profile.role, typed_profile.status
  into profile_role, profile_status
  from jsonb_populate_record(
    null::public.profiles,
    jsonb_build_object(
      'role', raw_role,
      'status', raw_status
    )
  ) as typed_profile;

  begin
    profile_church_id :=
      nullif(new.raw_user_meta_data ->> 'church_id', '')::uuid;
  exception
    when invalid_text_representation then
      profile_church_id := null;
  end;

  -- id est volontairement omis : PostgreSQL génère la clé du profil.
  insert into public.profiles (
    user_id,
    email,
    full_name,
    role,
    status,
    church_id
  )
  values (
    new.id,
    new.email,
    profile_full_name,
    profile_role,
    profile_status,
    profile_church_id
  )
  on conflict (user_id) do update
  set
    email = excluded.email,
    full_name = coalesce(
      nullif(excluded.full_name, ''),
      public.profiles.full_name
    ),
    role = excluded.role,
    status = excluded.status,
    church_id = coalesce(
      excluded.church_id,
      public.profiles.church_id
    );

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_create_profile
  on auth.users;

create trigger on_auth_user_created_create_profile
after insert or update of email, raw_user_meta_data
on auth.users
for each row
execute function public.handle_new_auth_user_profile();

-- Réparer tous les comptes Auth sans profil.
with source_users as (
  select
    users.id as auth_user_id,
    users.email,
    coalesce(
      nullif(users.raw_user_meta_data ->> 'full_name', ''),
      nullif(users.raw_user_meta_data ->> 'name', ''),
      split_part(coalesce(users.email, 'utilisateur'), '@', 1)
    ) as full_name,
    case lower(
      coalesce(
        nullif(users.raw_user_meta_data ->> 'role', ''),
        'worker'
      )
    )
      when 'super_admin' then 'super_admin'
      when 'church_admin' then 'church_admin'
      when 'admin_eglise' then 'church_admin'
      when 'pastor_titulaire' then 'pasteur_t'
      when 'pasteur_titulaire' then 'pasteur_t'
      when 'pastor' then 'pasteur_t'
      when 'pasteur' then 'pasteur_t'
      when 'pasteur_t' then 'pasteur_t'
      when 'pastor_assistant' then 'pasteur_a'
      when 'assistant_pastor' then 'pasteur_a'
      when 'pasteur_assistant' then 'pasteur_a'
      when 'pasteur_a' then 'pasteur_a'
      when 'charge_afp' then 'charge_afp'
      when 'responsable_d' then 'responsable_d'
      when 'department_leader' then 'responsable_d'
      when 'logisticien' then 'logisticien'
      when 'secretary' then 'secretaire'
      when 'secretaire' then 'secretaire'
      when 'worker' then 'worker'
      when 'church_worker' then 'worker'
      when 'readonly' then 'readonly'
      when 'viewer' then 'readonly'
      when 'member' then 'member'
      else 'worker'
    end as normalized_role,
    lower(
      coalesce(
        nullif(users.raw_user_meta_data ->> 'status', ''),
        'active'
      )
    ) as normalized_status,
    case
      when coalesce(
        users.raw_user_meta_data ->> 'church_id',
        ''
      ) ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
      then (users.raw_user_meta_data ->> 'church_id')::uuid
      else null
    end as church_id
  from auth.users as users
),
typed_users as (
  select
    source_users.*,
    typed_profile.role as typed_role,
    typed_profile.status as typed_status
  from source_users
  cross join lateral jsonb_populate_record(
    null::public.profiles,
    jsonb_build_object(
      'role', source_users.normalized_role,
      'status', source_users.normalized_status
    )
  ) as typed_profile
)
insert into public.profiles (
  user_id,
  email,
  full_name,
  role,
  status,
  church_id
)
select
  typed_users.auth_user_id,
  typed_users.email,
  typed_users.full_name,
  typed_users.typed_role,
  typed_users.typed_status,
  typed_users.church_id
from typed_users
left join public.profiles as existing_profile
  on existing_profile.user_id = typed_users.auth_user_id
where existing_profile.user_id is null
on conflict (user_id) do update
set
  email = excluded.email,
  full_name = coalesce(
    nullif(excluded.full_name, ''),
    public.profiles.full_name
  ),
  role = excluded.role,
  status = excluded.status,
  church_id = coalesce(
    excluded.church_id,
    public.profiles.church_id
  );

do $$
begin
  if to_regclass('public.v_profile_module_access_audit') is not null then
    execute
      'alter view public.v_profile_module_access_audit set (security_invoker = true)';
  end if;
end $$;

notify pgrst, 'reload schema';

select
  users.id as auth_user_id,
  users.email,
  profiles.id as profile_id,
  profiles.user_id,
  profiles.full_name,
  profiles.role,
  profiles.status,
  profiles.church_id,
  churches.name as church_name,
  churches.slug as church_slug,
  case
    when profiles.user_id is null then 'PROFILE_MISSING'
    when profiles.church_id is null
      and profiles.role::text <> 'super_admin'
      then 'CHURCH_MISSING'
    else 'OK'
  end as diagnostic
from auth.users as users
left join public.profiles as profiles
  on profiles.user_id = users.id
left join public.churches as churches
  on churches.id = profiles.church_id
order by users.created_at desc;
