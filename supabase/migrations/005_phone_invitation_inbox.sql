create or replace function public.normalize_phone_number(phone text)
returns text
language sql
immutable
as $$
  select regexp_replace(coalesce(phone, ''), '[^0-9]', '', 'g');
$$;

create or replace function public.get_my_project_invitations()
returns table (
  invitation_id uuid,
  project_id uuid,
  project_name text,
  invited_role text,
  invited_by_name text,
  expires_at timestamptz
)
language sql
security definer set search_path = public
as $$
  select
    invitations.id,
    invitations.project_id,
    projects.name,
    invitations.role,
    inviter.full_name,
    invitations.expires_at
  from public.project_invitations invitations
  join public.projects on projects.id = invitations.project_id
  join public.profiles inviter on inviter.id = invitations.invited_by
  join public.profiles recipient on recipient.id = auth.uid()
  where public.normalize_phone_number(invitations.whatsapp_number) = public.normalize_phone_number(recipient.whatsapp_number)
    and invitations.accepted_at is null
    and invitations.cancelled_at is null
    and invitations.expires_at > now()
    and not exists (
      select 1 from public.project_members members
      where members.project_id = invitations.project_id
        and members.user_id = auth.uid()
    );
$$;

create or replace function public.accept_project_invitation_by_id(p_invitation_id uuid)
returns table (project_id uuid, project_name text, member_role text)
language plpgsql
security definer set search_path = public
as $$
declare
  invitation public.project_invitations;
  recipient_phone text;
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'authentication required';
  end if;

  select whatsapp_number into recipient_phone
  from public.profiles
  where id = current_user_id;

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
  select invitation.project_id, projects.name, invitation.role
  from public.projects
  where projects.id = invitation.project_id;
end;
$$;

revoke all on function public.normalize_phone_number(text) from public;
revoke all on function public.get_my_project_invitations() from public;
revoke all on function public.accept_project_invitation_by_id(uuid) from public;
grant execute on function public.get_my_project_invitations() to authenticated;
grant execute on function public.accept_project_invitation_by_id(uuid) to authenticated;
