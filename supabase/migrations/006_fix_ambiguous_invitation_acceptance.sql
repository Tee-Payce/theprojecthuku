drop function if exists public.accept_project_invitation_by_id(uuid);

create function public.accept_project_invitation_by_id(p_invitation_id uuid)
returns table (project_id uuid, project_name text, member_role text)
language plpgsql
security definer set search_path = public, extensions
as $$
declare
  invitation public.project_invitations;
  recipient_phone text;
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'authentication required';
  end if;

  select p.whatsapp_number into recipient_phone
  from public.profiles p
  where p.id = current_user_id;

  select i.* into invitation
  from public.project_invitations i
  where i.id = p_invitation_id
    and i.accepted_at is null
    and i.cancelled_at is null
    and i.expires_at > now()
    and public.normalize_phone_number(i.whatsapp_number) = public.normalize_phone_number(recipient_phone)
  for update;

  if invitation.id is null then
    raise exception 'invitation is invalid, expired, cancelled, or does not match your WhatsApp number';
  end if;

  if exists (
    select 1 from public.project_members members
    where members.project_id = invitation.project_id
      and members.user_id = current_user_id
  ) then
    raise exception 'user is already a member of this project';
  end if;

  insert into public.project_members (project_id, user_id, role, status)
  values (invitation.project_id, current_user_id, invitation.role, 'active');

  update public.project_invitations i
  set accepted_at = now()
  where i.id = invitation.id;

  return query
  select invitation.project_id, p.name, invitation.role
  from public.projects p
  where p.id = invitation.project_id;
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

  select i.* into invitation
  from public.project_invitations i
  where i.token_hash = encode(digest(trim(invitation_token), 'sha256'), 'hex')
    and i.accepted_at is null
    and i.cancelled_at is null
    and i.expires_at > now()
  for update;

  if invitation.id is null then
    raise exception 'invitation is invalid, expired, cancelled, or already used';
  end if;

  if exists (
    select 1 from public.project_members members
    where members.project_id = invitation.project_id
      and members.user_id = current_user_id
  ) then
    raise exception 'user is already a member of this project';
  end if;

  insert into public.project_members (project_id, user_id, role, status)
  values (invitation.project_id, current_user_id, invitation.role, 'active');

  update public.project_invitations i
  set accepted_at = now()
  where i.id = invitation.id;

  return query
  select invitation.project_id, p.name, invitation.role
  from public.projects p
  where p.id = invitation.project_id;
end;
$$;

revoke all on function public.accept_project_invitation_by_id(uuid) from public;
grant execute on function public.accept_project_invitation_by_id(uuid) to authenticated;
revoke all on function public.accept_project_invitation(text) from public;
grant execute on function public.accept_project_invitation(text) to authenticated;

notify pgrst, 'reload schema';