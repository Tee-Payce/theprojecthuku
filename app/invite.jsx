import { FarmButton, GlassCard } from '@/components/farm-ui';
import { FarmTheme } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { registerLocalProject } from '@/database/localProjectQueries';
import { acceptProjectInvitation } from '@/services/projectService';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

export default function InvitationScreen() {
  const { user } = useAuth();
  const { token } = useLocalSearchParams();
  const invitationToken = Array.isArray(token) ? token[0] : token;
  const [message, setMessage] = useState('Verifying farm invitation...');
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !invitationToken) {
      setLoading(false);
      return;
    }

    const accept = async () => {
      try {
        const project = await acceptProjectInvitation(invitationToken);
        registerLocalProject({
          id: project.project_id,
          name: project.project_name,
          role: project.member_role,
        });
        setAccepted(true);
        setMessage(`You have joined "${project.project_name}" as a farm ${project.member_role}.`);
      } catch (error) {
        setMessage(error.message || 'This invitation is invalid or has expired.');
      } finally {
        setLoading(false);
      }
    };

    accept();
  }, [user, invitationToken]);

  if (!user) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#071F10', '#0F3C1E', '#14532D']}
          style={StyleSheet.absoluteFill}
        />
        <GlassCard variant="surface" style={styles.card} contentStyle={styles.cardInner}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name="mail-alert-outline" size={32} color={FarmTheme.colors.forest} />
          </View>
          <Text style={styles.title}>Farm Project Invitation</Text>
          <Text style={styles.message}>
            Sign in or create your profile to accept this farm workspace invitation.
          </Text>
          <FarmButton
            title="Continue to Sign In"
            variant="primary"
            iconName="log-in-outline"
            onPress={() =>
              router.replace({ pathname: '/auth', params: { invitationToken } })
            }
            size="lg"
            style={{ width: '100%' }}
          />
        </GlassCard>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#071F10', '#0F3C1E', '#14532D']}
        style={StyleSheet.absoluteFill}
      />
      <GlassCard variant="surface" style={styles.card} contentStyle={styles.cardInner}>
        <View style={styles.iconCircle}>
          {accepted ? (
            <Ionicons name="checkmark-circle" size={36} color={FarmTheme.colors.forest} />
          ) : (
            <MaterialCommunityIcons name="egg-easter" size={36} color={FarmTheme.colors.forest} />
          )}
        </View>

        {loading && <ActivityIndicator color={FarmTheme.colors.forest} style={{ marginBottom: 12 }} />}

        <Text style={styles.title}>Project Invitation</Text>
        <Text style={styles.message}>{message}</Text>

        {accepted ? (
          <FarmButton
            title="Open Farm Dashboard"
            variant="primary"
            iconName="apps-outline"
            onPress={() => router.replace('/')}
            size="lg"
            style={{ width: '100%' }}
          />
        ) : (
          <FarmButton
            title="Back to Projects"
            variant="glass"
            onPress={() => router.replace('/projects')}
            style={{ width: '100%' }}
          />
        )}
      </GlassCard>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#071F10',
  },
  card: {
    width: '100%',
    maxWidth: 380,
  },
  cardInner: {
    alignItems: 'center',
    padding: 24,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: FarmTheme.colors.emeraldSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: FarmTheme.colors.forestDeep,
    marginBottom: 8,
  },
  message: {
    fontSize: 13,
    color: FarmTheme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
});