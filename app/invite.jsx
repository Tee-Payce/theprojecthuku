import { useAuth } from '@/contexts/AuthContext';
import { registerLocalProject } from '@/database/localProjectQueries';
import { acceptProjectInvitation } from '@/services/projectService';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';

export default function InvitationScreen() {
  const { user } = useAuth();
  const { token } = useLocalSearchParams();
  const invitationToken = Array.isArray(token) ? token[0] : token;
  const [message, setMessage] = useState('Checking invitation...');
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    if (!user || !invitationToken) return;

    const accept = async () => {
      try {
        const project = await acceptProjectInvitation(invitationToken);
        registerLocalProject({ id: project.project_id, name: project.project_name, role: project.member_role });
        setAccepted(true);
        setMessage(`You joined ${project.project_name}`);
      } catch (error) {
        setMessage(error.message || 'This invitation is invalid or expired.');
      }
    };

    accept();
  }, [user, invitationToken]);

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Project invitation</Text>
        <Text style={styles.message}>Sign in or create your profile to accept this invitation.</Text>
        <TouchableOpacity onPress={() => router.replace({ pathname: '/auth', params: { invitationToken } })} style={styles.button}>
          <Text style={styles.buttonText}>Continue to sign in</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {!accepted && <ActivityIndicator color="#16a34a" />}
      <Text style={styles.title}>Project invitation</Text>
      <Text style={styles.message}>{message}</Text>
      {accepted && (
        <TouchableOpacity onPress={() => router.replace('/')} style={styles.button}>
          <Text style={styles.buttonText}>Open project</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = {
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#f5faf6' },
  title: { fontSize: 26, fontWeight: 'bold', color: '#17532d', marginBottom: 12 },
  message: { color: '#4b5563', textAlign: 'center', marginBottom: 20 },
  button: { backgroundColor: '#16a34a', padding: 14, borderRadius: 8 },
  buttonText: { color: 'white', fontWeight: 'bold' }
};