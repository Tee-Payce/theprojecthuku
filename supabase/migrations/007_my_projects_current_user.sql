create or replace function public.get_my_projects()
returns table (
  project_id uuid,
  project_name text,
  project_role text,
  project_status text,
  project_created_at timestamptz,
  project_archived_at timestamptz
)
language sql
security definer set search_path = public
as $$
  select
    projects.id,
    projects.name,
    memberships.role,
    memberships.status,
    projects.created_at,
    projects.archived_at
  from public.project_members memberships
  join public.projects projects on projects.id = memberships.project_id
  where memberships.user_id = auth.uid()
    and memberships.status = 'active'
    and projects.archived_at is null
  order by projects.created_at desc;
$$;

revoke all on function public.get_my_projects() from public;
grant execute on function public.get_my_projects() to authenticated;

notify pgrst, 'reload schema';
