create or replace function public.create_project(project_name text)
returns public.projects
language plpgsql
security definer set search_path = public
as $$
declare
  created_project public.projects;
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'authentication required';
  end if;

  if project_name is null or length(trim(project_name)) = 0 then
    raise exception 'project name is required';
  end if;

  if not exists (select 1 from public.profiles where id = current_user_id) then
    raise exception 'profile not found for authenticated user';
  end if;

  insert into public.projects (name, owner_id)
  values (trim(project_name), current_user_id)
  returning * into created_project;

  return created_project;
end;
$$;

revoke all on function public.create_project(text) from public;
grant execute on function public.create_project(text) to authenticated;