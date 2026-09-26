import { useAppContext } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { registerLocalProject } from '@/database/localProjectQueries';
import { signOut } from '@/services/authService';
import { acceptProjectInvitationById, createProject, getMyProjectInvitations, getMyProjects, rejectProjectInvitation } from '@/services/projectService';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, FlatList, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function ProjectsScreen() {
  const { user } = useAuth();
  const { setActiveProject } = useAppContext();
  const [projects, setProjects] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [name, setName] = useState('');

  const loadProjects = useCallback(async () => {
    try {
      const memberships = await getMyProjects();
      const pendingInvitations = await getMyProjectInvitations();
      setProjects(memberships);
      setInvitations(pendingInvitations);
    } catch (error) {
      Alert.alert('Could not load projects', error.message || 'Please try again');
    }
  }, []);

  const acceptInvitation = async (invitation) => {
    try {
      const project = await acceptProjectInvitationById(invitation.invitation_id);
      registerLocalProject({ id: project.project_id, name: project.project_name, role: project.member_role });
      setActiveProject({ id: project.project_id, name: project.project_name, role: project.member_role });
      router.replace('/');
    } catch (error) {
      Alert.alert('Could not accept invitation', error.message || 'Please try again');
    }
  };

  const rejectInvitation = (invitation) => {
    Alert.alert(
      'Reject invitation',
      `Remove the invitation to ${invitation.project_name}?`,
      [
        { text: 'Keep invitation', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              await rejectProjectInvitation(invitation.invitation_id);
              await loadProjects();
            } catch (error) {
              Alert.alert('Could not reject invitation', error.message || 'Please try again');
            }
          }
        }
      ]
    );
  };

  useFocusEffect(useCallback(() => {
    loadProjects();
  }, [loadProjects]));

  const saveProject = async () => {
    if (!name.trim()) {
      Alert.alert('Missing name', 'Enter a project name');
      return;
    }
    try {
      await createProject(name.trim());
      setName('');
      await loadProjects();
    } catch (error) {
      Alert.alert('Could not create project', error.message || 'Please try again');
    }
  };

  const leaveSession = async () => {
    setActiveProject(null);
    await signOut();
    router.replace('/auth');
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f5faf6', padding: 16 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <View>
          <Text style={{ fontSize: 26, fontWeight: 'bold', color: '#17532d' }}>Your Projects</Text>
          <Text style={{ color: '#6b7280', marginTop: 4 }}>{user?.email}</Text>
        </View>
        <TouchableOpacity onPress={leaveSession}><Text style={{ color: '#dc2626', fontWeight: '600' }}>Sign out</Text></TouchableOpacity>
      </View>

      <View style={{ backgroundColor: 'white', padding: 16, borderRadius: 10, marginBottom: 16 }}>
        <Text style={{ fontWeight: 'bold', fontSize: 17, marginBottom: 10 }}>Create a project</Text>
        <TextInput style={{ borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, marginBottom: 10 }} placeholder="Project name" value={name} onChangeText={setName} />
        <TouchableOpacity style={{ backgroundColor: '#16a34a', padding: 13, borderRadius: 8, alignItems: 'center' }} onPress={saveProject}>
          <Text style={{ color: 'white', fontWeight: 'bold' }}>Create project</Text>
        </TouchableOpacity>
      </View>

      {invitations.length > 0 && (
        <View style={{ backgroundColor: '#ecfdf5', padding: 16, borderRadius: 10, marginBottom: 16, borderWidth: 1, borderColor: '#86efac' }}>
          <Text style={{ color: '#166534', fontSize: 17, fontWeight: 'bold', marginBottom: 10 }}>Project invitations</Text>
          {invitations.map(invitation => (
            <View key={invitation.invitation_id} style={{ backgroundColor: 'white', padding: 12, borderRadius: 8, marginBottom: 8 }}>
              <Text style={{ fontSize: 16, fontWeight: 'bold' }}>{invitation.project_name}</Text>
              <Text style={{ color: '#6b7280', marginTop: 4 }}>
                Invited by {invitation.invited_by_name || 'a project manager'} as {invitation.invited_role}
              </Text>
              <View style={{ flexDirection: 'row', marginTop: 10 }}>
                <TouchableOpacity onPress={() => acceptInvitation(invitation)} style={{ backgroundColor: '#16a34a', padding: 11, borderRadius: 8, alignItems: 'center', flex: 1, marginRight: 8 }}>
                  <Text style={{ color: 'white', fontWeight: 'bold' }}>Accept</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => rejectInvitation(invitation)} style={{ backgroundColor: '#fee2e2', padding: 11, borderRadius: 8, alignItems: 'center', flex: 1 }}>
                  <Text style={{ color: '#b91c1c', fontWeight: 'bold' }}>Reject</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      <FlatList
        data={projects}
        keyExtractor={(item) => item.projects.id}
        renderItem={({ item }) => (
          <View style={{ backgroundColor: 'white', padding: 16, borderRadius: 10, marginBottom: 10 }}>
            <TouchableOpacity onPress={() => {
              registerLocalProject({ id: item.projects.id, name: item.projects.name, role: item.role });
              setActiveProject({
                id: item.projects.id,
                name: item.projects.name,
                role: item.role
              });
              router.replace('/');
            }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold' }}>{item.projects.name}</Text>
              <Text style={{ color: '#6b7280', marginTop: 4 }}>Role: {item.role}</Text>
            </TouchableOpacity>
            {(item.role === 'owner' || item.role === 'manager') && (
              <TouchableOpacity
                onPress={() => router.push({ pathname: '/projects/members', params: { projectId: item.projects.id, projectName: item.projects.name, projectRole: item.role } })}
                style={{ marginTop: 12, borderTopWidth: 1, borderTopColor: '#e5e7eb', paddingTop: 10 }}
              >
                <Text style={{ color: '#17532d', fontWeight: 'bold' }}>Manage members</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        ListEmptyComponent={<Text style={{ color: '#6b7280', textAlign: 'center', marginTop: 24 }}>No projects yet.</Text>}
      />
    </View>
  );
}