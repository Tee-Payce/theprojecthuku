-- Supabase commonly installs pgcrypto functions in the extensions schema.
-- Include that schema when security-definer functions generate or hash tokens.

create or replace function public.create_project_invitation(
  invitation_project_id uuid,
  invitation_whatsapp_number text,
  invitation_role text default 'worker'
)
returns table (id uuid, token text, expires_at timestamptz)
language plpgsql
security definer set search_path = public, extensions
as $$
declare
  raw_token text := encode(gen_random_bytes(32), 'hex');
  invitation_id uuid;
  invitation_expiry timestamptz := now() + interval '7 days';
begin
  if not public.has_project_role(invitation_project_id, array['owner', 'manager']) then
    raise exception 'not authorized to invite project members';
  end if;

  if invitation_role not in ('manager', 'worker', 'viewer') then
    raise exception 'invalid invitation role';
  end if;

  insert into public.project_invitations (
    token_hash, project_id, invited_by, whatsapp_number, role, expires_at
  ) values (
    encode(digest(raw_token, 'sha256'), 'hex'),
    invitation_project_id,
    auth.uid(),
    invitation_whatsapp_number,
    invitation_role,
    invitation_expiry
  ) returning project_invitations.id into invitation_id;

  return query select invitation_id, raw_token, invitation_expiry;
end;
$$;

create or replace function public.accept_project_invitation(invitation_token text)
returns table (project_id uuid, project_name text, member_role text)
language plpgsql
security definer set search_path = public, extensions
as $$
declare
  invitation public.project_invitations;
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'authentication required';
  end if;

  if invitation_token is null or length(trim(invitation_token)) = 0 then
    raise exception 'invitation token is required';
  end if;

  select * into invitation
  from public.project_invitations
  where token_hash = encode(digest(trim(invitation_token), 'sha256'), 'hex')
    and accepted_at is null
    and cancelled_at is null
    and expires_at > now()
  for update;

  if invitation.id is null then
    raise exception 'invitation is invalid, expired, cancelled, or already used';
  end if;

  if exists (
    select 1 from public.project_members
    where project_id = invitation.project_id
      and user_id = current_user_id
  ) then
    raise exception 'user is already a member of this project';
  end if;

  insert into public.project_members (project_id, user_id, role, status)
  values (invitation.project_id, current_user_id, invitation.role, 'active');

  update public.project_invitations
  set accepted_at = now()
  where id = invitation.id;

  return query
  select invitation.project_id, projects.name, invitation.role
  from public.projects
  where projects.id = invitation.project_id;
end;
$$;

revoke all on function public.create_project_invitation(uuid, text, text) from public;
grant execute on function public.create_project_invitation(uuid, text, text) to authenticated;
revoke all on function public.accept_project_invitation(text) from public;
grant execute on function public.accept_project_invitation(text) to authenticated;
