import { useAppContext } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { createProjectInvitation, getProjectMembers } from '@/services/projectService';
import { useFocusEffect } from '@react-navigation/native';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, FlatList, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function ProjectMembersScreen() {
  const { user } = useAuth();
  const { activeProject } = useAppContext();
  const { projectId, projectName, projectRole } = useLocalSearchParams();
  const resolvedProjectId = Array.isArray(projectId) ? projectId[0] : projectId;
  const resolvedName = Array.isArray(projectName) ? projectName[0] : projectName;
  const resolvedRole = Array.isArray(projectRole) ? projectRole[0] : projectRole;
  const [members, setMembers] = useState([]);
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [role, setRole] = useState('worker');
  const [loading, setLoading] = useState(false);

  const loadMembers = useCallback(async () => {
    if (!resolvedProjectId) return;
    try {
      setMembers(await getProjectMembers(resolvedProjectId));
    } catch (error) {
      Alert.alert('Could not load members', error.message || 'Please try again');
    }
  }, [resolvedProjectId]);

  useFocusEffect(useCallback(() => {
    loadMembers();
  }, [loadMembers]));

  const invite = async () => {
    if (!whatsappNumber.trim()) {
      Alert.alert('Missing number', 'Enter the worker WhatsApp number with country code');
      return;
    }
    setLoading(true);
    try {
      await createProjectInvitation({
        projectId: resolvedProjectId,
        invitedBy: user.id,
        whatsappNumber: whatsappNumber.trim(),
        role
      });
      setWhatsappNumber('');
      Alert.alert('Invitation sent', `${whatsappNumber.trim()} will see the ${resolvedName || 'project'} invitation on their Projects page after signing in.`);
    } catch (error) {
      Alert.alert('Could not create invitation', error.message || 'Please try again');
    } finally {
      setLoading(false);
    }
  };

  const canInvite = resolvedRole === 'owner' || resolvedRole === 'manager' || (activeProject?.id === resolvedProjectId && ['owner', 'manager'].includes(activeProject.role));

  return (
    <View style={{ flex: 1, backgroundColor: '#f5faf6', padding: 16 }}>
      <TouchableOpacity onPress={() => router.back()} style={{ paddingVertical: 8 }}>
        <Text style={{ color: '#17532d', fontWeight: 'bold' }}>Back to projects</Text>
      </TouchableOpacity>
      <Text style={{ color: '#17532d', fontSize: 26, fontWeight: 'bold', marginBottom: 4 }}>{resolvedName || 'Project members'}</Text>
      <Text style={{ color: '#6b7280', marginBottom: 16 }}>Collaborators and workers</Text>

      {canInvite && (
        <View style={{ backgroundColor: 'white', padding: 16, borderRadius: 10, marginBottom: 16 }}>
          <Text style={{ fontSize: 17, fontWeight: 'bold', marginBottom: 10 }}>Invite by WhatsApp number</Text>
          <TextInput
            style={{ borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, marginBottom: 10 }}
            placeholder="WhatsApp number with country code"
            value={whatsappNumber}
            onChangeText={setWhatsappNumber}
            keyboardType="phone-pad"
          />
          <View style={{ flexDirection: 'row', marginBottom: 10 }}>
            {['worker', 'manager', 'viewer'].map(option => (
              <TouchableOpacity key={option} onPress={() => setRole(option)} style={{ flex: 1, padding: 10, marginRight: 4, borderRadius: 8, backgroundColor: role === option ? '#16a34a' : '#e5e7eb', alignItems: 'center' }}>
                <Text style={{ color: role === option ? 'white' : '#374151', fontWeight: '600', textTransform: 'capitalize' }}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity onPress={invite} disabled={loading} style={{ backgroundColor: '#16a34a', padding: 13, borderRadius: 8, alignItems: 'center' }}>
            <Text style={{ color: 'white', fontWeight: 'bold' }}>{loading ? 'Sending invitation...' : 'Send invitation'}</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={members}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={{ backgroundColor: 'white', padding: 14, borderRadius: 10, marginBottom: 8 }}>
            <Text style={{ fontSize: 16, fontWeight: 'bold' }}>{item.profiles?.full_name || 'Unnamed member'}</Text>
            <Text style={{ color: '#6b7280', marginTop: 4 }}>{item.profiles?.whatsapp_number || 'No WhatsApp number'} • {item.role}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={{ color: '#6b7280', textAlign: 'center', marginTop: 24 }}>No members found.</Text>}
      />
    </View>
  );
}
