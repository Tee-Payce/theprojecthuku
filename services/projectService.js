import * as Linking from 'expo-linking';
import { supabase } from './supabase';

export const createProject = async (name) => {
  const { data, error } = await supabase.rpc('create_project', {
    project_name: name
  });

  if (error) throw error;
  return Array.isArray(data) ? data[0] : data;
};

export const getMyProjects = async () => {
  const { data, error } = await supabase.rpc('get_my_projects');

  if (error) throw error;
  return (data || []).map(project => ({
    role: project.project_role,
    status: project.project_status,
    projects: {
      id: project.project_id,
      name: project.project_name,
      created_at: project.project_created_at,
      archived_at: project.project_archived_at
    }
  }));
};

export const getProjectMembers = async (projectId) => {
  const { data, error } = await supabase
    .from('project_members')
    .select('id, role, status, joined_at, profiles(id, full_name, whatsapp_number)')
    .eq('project_id', projectId)
    .order('joined_at', { ascending: true });

  if (error) throw error;
  return data || [];
};

export const createProjectInvitation = async ({ projectId, invitedBy, whatsappNumber, role = 'worker' }) => {
  const { data, error } = await supabase.rpc('create_project_invitation', {
    invitation_project_id: projectId,
    invitation_whatsapp_number: whatsappNumber,
    invitation_role: role
  });

  if (error) throw error;
  return Array.isArray(data) ? data[0] : data;
};

export const createInvitationLink = (token) => Linking.createURL('invite', {
  queryParams: { token }
});

export const acceptProjectInvitation = async (token) => {
  const { data, error } = await supabase.rpc('accept_project_invitation', {
    invitation_token: token
  });

  if (error) throw error;
  return Array.isArray(data) ? data[0] : data;
};

export const getMyProjectInvitations = async () => {
  const { data, error } = await supabase.rpc('get_my_project_invitations');
  if (error) throw error;
  return data || [];
};

export const acceptProjectInvitationById = async (invitationId) => {
  const { data, error } = await supabase.rpc('accept_project_invitation_by_id', {
    p_invitation_id: invitationId
  });

  if (error) throw error;
  return Array.isArray(data) ? data[0] : data;
};

export const rejectProjectInvitation = async (invitationId) => {
  const { data, error } = await supabase.rpc('reject_project_invitation', {
    p_invitation_id: invitationId
  });

  if (error) throw error;
  return data;
};