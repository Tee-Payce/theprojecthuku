create or replace function public.reject_project_invitation(p_invitation_id uuid)
returns boolean
language plpgsql
security definer set search_path = public
as $$
declare
  recipient_phone text;
  current_user_id uuid := auth.uid();
  updated_count integer;
begin
  if current_user_id is null then
    raise exception 'authentication required';
  end if;

  select p.whatsapp_number into recipient_phone
  from public.profiles p
  where p.id = current_user_id;

  update public.project_invitations i
  set cancelled_at = now()
  where i.id = p_invitation_id
    and i.accepted_at is null
    and i.cancelled_at is null
    and i.expires_at > now()
    and public.normalize_phone_number(i.whatsapp_number) = public.normalize_phone_number(recipient_phone);

  get diagnostics updated_count = row_count;
  return updated_count = 1;
end;
$$;

revoke all on function public.reject_project_invitation(uuid) from public;
grant execute on function public.reject_project_invitation(uuid) to authenticated;

notify pgrst, 'reload schema';
