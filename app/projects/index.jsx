import { Badge, FarmButton, FarmInput, GlassCard } from '@/components/farm-ui';
import { FarmTheme } from '@/constants/theme';
import { useAppContext } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { registerLocalProject } from '@/database/localProjectQueries';
import { signOut } from '@/services/authService';
import {
  acceptProjectInvitationById,
  createProject,
  getMyProjectInvitations,
  getMyProjects,
  rejectProjectInvitation,
} from '@/services/projectService';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProjectsScreen() {
  const { user } = useAuth();
  const { setActiveProject } = useAppContext();
  const [projects, setProjects] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);

  const loadProjects = useCallback(async () => {
    try {
      const memberships = await getMyProjects();
      const pendingInvitations = await getMyProjectInvitations();
      setProjects(memberships);
      setInvitations(pendingInvitations);
    } catch (error) {
      Alert.alert('Notice', error.message || 'Could not load projects.');
    }
  }, []);

  const acceptInvitation = async (invitation) => {
    try {
      const project = await acceptProjectInvitationById(invitation.invitation_id);
      registerLocalProject({
        id: project.project_id,
        name: project.project_name,
        role: project.member_role,
      });
      setActiveProject({
        id: project.project_id,
        name: project.project_name,
        role: project.member_role,
      });
      router.replace('/');
    } catch (error) {
      Alert.alert('Error', error.message || 'Could not accept invitation');
    }
  };

  const rejectInvitation = (invitation) => {
    Alert.alert(
      'Decline Invitation',
      `Decline the invitation to join ${invitation.project_name}?`,
      [
        { text: 'Keep', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            try {
              await rejectProjectInvitation(invitation.invitation_id);
              await loadProjects();
            } catch (error) {
              Alert.alert('Error', error.message || 'Could not decline invitation');
            }
          },
        },
      ]
    );
  };

  useFocusEffect(
    useCallback(() => {
      loadProjects();
    }, [loadProjects])
  );

  const saveProject = async () => {
    if (!name.trim()) {
      Alert.alert('Missing Name', 'Please enter a name for your farm project.');
      return;
    }
    setCreating(true);
    try {
      await createProject(name.trim());
      setName('');
      await loadProjects();
      Alert.alert('Success', 'Farm project created successfully!');
    } catch (error) {
      Alert.alert('Error', error.message || 'Could not create project');
    } finally {
      setCreating(false);
    }
  };

  const leaveSession = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          setActiveProject(null);
          await signOut();
          router.replace('/auth');
        },
      },
    ]);
  };

  const renderProjectItem = ({ item }) => {
    const isManager = item.role === 'owner' || item.role === 'manager';

    return (
      <View style={styles.projectWrapper}>
        <GlassCard variant="surface" contentStyle={styles.projectInner}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              registerLocalProject({
                id: item.projects.id,
                name: item.projects.name,
                role: item.role,
              });
              setActiveProject({
                id: item.projects.id,
                name: item.projects.name,
                role: item.role,
              });
              router.replace('/');
            }}
          >
            <View style={styles.projectHeader}>
              <View style={styles.projectIconCircle}>
                <MaterialCommunityIcons name="egg-easter" size={24} color={FarmTheme.colors.forest} />
              </View>

              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.projectName}>{item.projects.name}</Text>
                <Text style={styles.projectSub}>Tap to open farm dashboard</Text>
              </View>

              <Badge
                label={item.role}
                variant={item.role === 'owner' ? 'active' : item.role === 'manager' ? 'warning' : 'neutral'}
                size="sm"
              />
            </View>
          </TouchableOpacity>

          {isManager && (
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: '/projects/members',
                  params: {
                    projectId: item.projects.id,
                    projectName: item.projects.name,
                    projectRole: item.role,
                  },
                })
              }
              style={styles.membersRow}
              activeOpacity={0.8}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="people-outline" size={15} color={FarmTheme.colors.forest} style={{ marginRight: 6 }} />
                <Text style={styles.membersText}>Manage Team & Workers</Text>
              </View>
              <Ionicons name="chevron-forward" size={15} color={FarmTheme.colors.textMuted} />
            </TouchableOpacity>
          )}
        </GlassCard>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        {/* Top Bar */}
        <View style={styles.topBar}>
          <View>
            <Text style={styles.appTitle}>The Project Huku 🐔</Text>
            <Text style={styles.userEmail}>{user?.email || 'Farm Workspace'}</Text>
          </View>
          <TouchableOpacity onPress={leaveSession} style={styles.signOutBtn} activeOpacity={0.7}>
            <Ionicons name="log-out-outline" size={16} color={FarmTheme.colors.rose} style={{ marginRight: 4 }} />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        {/* Pending Invitations Banner */}
        {invitations.length > 0 && (
          <GlassCard variant="harvest" style={styles.invitationCard} contentStyle={styles.invitationInner}>
            <View style={styles.inviteHeader}>
              <Ionicons name="mail-unread-outline" size={20} color={FarmTheme.colors.goldDark} />
              <Text style={styles.inviteTitle}>Pending Farm Invitations ({invitations.length})</Text>
            </View>

            {invitations.map((inv) => (
              <View key={inv.invitation_id} style={styles.inviteItem}>
                <Text style={styles.inviteProjectName}>{inv.project_name}</Text>
                <Text style={styles.inviteDesc}>
                  Invited as <Text style={{ fontWeight: '700' }}>{inv.invited_role}</Text> by{' '}
                  {inv.invited_by_name || 'Project Manager'}
                </Text>

                <View style={styles.inviteBtnRow}>
                  <FarmButton
                    title="Accept"
                    variant="primary"
                    size="sm"
                    onPress={() => acceptInvitation(inv)}
                    style={{ flex: 1, marginRight: 8 }}
                  />
                  <FarmButton
                    title="Decline"
                    variant="glass"
                    size="sm"
                    onPress={() => rejectInvitation(inv)}
                    style={{ flex: 1 }}
                  />
                </View>
              </View>
            ))}
          </GlassCard>
        )}

        {/* Create Farm Project Card */}
        <GlassCard variant="forest" style={styles.createCard} contentStyle={styles.createInner}>
          <Text style={styles.createTitle}>Start a New Farm Project</Text>
          <Text style={styles.createSubtitle}>Create an independent poultry workspace for your farm or coop.</Text>
          <FarmInput
            placeholder="e.g. Green Valley Broiler Project"
            value={name}
            onChangeText={setName}
            containerStyle={{ marginBottom: 10, marginTop: 8 }}
            iconName="business-outline"
          />
          <FarmButton
            title={creating ? 'Creating...' : 'Create Project'}
            variant="harvest"
            iconName="add-circle-outline"
            onPress={saveProject}
            loading={creating}
          />
        </GlassCard>

        {/* Projects List Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeading}>Your Farm Workspaces</Text>
          <Badge label={`${projects.length} Available`} variant="active" size="sm" />
        </View>

        <FlatList
          data={projects}
          keyExtractor={(item) => item.projects.id}
          renderItem={renderProjectItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="egg-easter" size={40} color={FarmTheme.colors.forest} />
              <Text style={styles.emptyTitle}>No Projects Found</Text>
              <Text style={styles.emptySubtitle}>
                Create your first farm project above to start tracking poultry batches.
              </Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: FarmTheme.colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  appTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: FarmTheme.colors.forest,
    letterSpacing: -0.3,
  },
  userEmail: {
    fontSize: 12,
    color: FarmTheme.colors.textMuted,
    marginTop: 1,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: FarmTheme.colors.rosePale,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: FarmTheme.radius.full,
    borderWidth: 1,
    borderColor: FarmTheme.colors.roseBorder,
  },
  signOutText: {
    color: FarmTheme.colors.roseDark,
    fontSize: 12,
    fontWeight: '700',
  },
  invitationCard: {
    marginBottom: 14,
  },
  invitationInner: {
    padding: 14,
  },
  inviteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  inviteTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: FarmTheme.colors.goldDark,
  },
  inviteItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    padding: 12,
    borderRadius: FarmTheme.radius.md,
    marginBottom: 8,
  },
  inviteProjectName: {
    fontSize: 15,
    fontWeight: '700',
    color: FarmTheme.colors.textPrimary,
  },
  inviteDesc: {
    fontSize: 12,
    color: FarmTheme.colors.textSecondary,
    marginTop: 2,
    marginBottom: 8,
  },
  inviteBtnRow: {
    flexDirection: 'row',
  },
  createCard: {
    marginBottom: 14,
  },
  createInner: {
    padding: 16,
  },
  createTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  createSubtitle: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.75)',
    marginTop: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: FarmTheme.colors.textPrimary,
  },
  listContent: {
    paddingBottom: 30,
  },
  projectWrapper: {
    marginBottom: 10,
  },
  projectInner: {
    padding: 14,
  },
  projectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  projectIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: FarmTheme.colors.emeraldSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  projectName: {
    fontSize: 16,
    fontWeight: '800',
    color: FarmTheme.colors.textPrimary,
  },
  projectSub: {
    fontSize: 11,
    color: FarmTheme.colors.textMuted,
    marginTop: 2,
  },
  membersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(20, 83, 45, 0.06)',
  },
  membersText: {
    fontSize: 12,
    fontWeight: '700',
    color: FarmTheme.colors.forest,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: FarmTheme.colors.textPrimary,
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 12,
    color: FarmTheme.colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 240,
  },
});