import { Badge, FarmButton, FarmInput, GlassCard } from '@/components/farm-ui';
import { FarmTheme } from '@/constants/theme';
import { useAppContext } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { createProjectInvitation, getProjectMembers } from '@/services/projectService';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
      Alert.alert('Notice', error.message || 'Could not load members');
    }
  }, [resolvedProjectId]);

  useFocusEffect(
    useCallback(() => {
      loadMembers();
    }, [loadMembers])
  );

  const invite = async () => {
    if (!whatsappNumber.trim()) {
      Alert.alert('Required Phone', 'Enter worker WhatsApp number with country code (e.g. +263...).');
      return;
    }
    setLoading(true);
    try {
      await createProjectInvitation({
        projectId: resolvedProjectId,
        invitedBy: user.id,
        whatsappNumber: whatsappNumber.trim(),
        role,
      });
      setWhatsappNumber('');
      Alert.alert(
        'Invitation Queued',
        `${whatsappNumber.trim()} will see the ${resolvedName || 'project'} invitation when they log in.`
      );
    } catch (error) {
      Alert.alert('Error', error.message || 'Could not create invitation');
    } finally {
      setLoading(false);
    }
  };

  const canInvite =
    resolvedRole === 'owner' ||
    resolvedRole === 'manager' ||
    (activeProject?.id === resolvedProjectId && ['owner', 'manager'].includes(activeProject.role));

  const renderMember = ({ item }) => (
    <View style={styles.memberCard}>
      <GlassCard variant="surface" contentStyle={styles.memberInner}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(item.profiles?.full_name || 'U').charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text style={styles.memberName}>{item.profiles?.full_name || 'Farm Member'}</Text>
          <Text style={styles.memberPhone}>
            {item.profiles?.whatsapp_number || 'No phone recorded'}
          </Text>
        </View>
        <Badge
          label={item.role}
          variant={item.role === 'owner' ? 'active' : item.role === 'manager' ? 'warning' : 'neutral'}
          size="sm"
        />
      </GlassCard>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        {/* Navigation Bar */}
        <View style={styles.navBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={20} color={FarmTheme.colors.forest} />
            <Text style={styles.backBtnText}>Projects</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.pageTitle}>{resolvedName || 'Project Members'}</Text>
        <Text style={styles.pageSubtitle}>Collaborate with farm managers, workers, and field staff</Text>

        {/* Invite Card if authorized */}
        {canInvite && (
          <GlassCard variant="forest" style={styles.inviteCard} contentStyle={styles.inviteInner}>
            <Text style={styles.inviteHeading}>Invite Team Member</Text>
            <Text style={styles.inviteCaption}>Enter their WhatsApp number with country code.</Text>

            <FarmInput
              placeholder="e.g. +263 77 123 4567"
              value={whatsappNumber}
              onChangeText={setWhatsappNumber}
              keyboardType="phone-pad"
              iconName="logo-whatsapp"
              containerStyle={{ marginBottom: 12 }}
            />

            {/* Role Pills */}
            <Text style={styles.roleLabel}>Select Workspace Role</Text>
            <View style={styles.roleRow}>
              {['worker', 'manager', 'viewer'].map((option) => {
                const selected = role === option;
                return (
                  <TouchableOpacity
                    key={option}
                    onPress={() => setRole(option)}
                    style={[styles.rolePill, selected && styles.rolePillSelected]}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.rolePillText, selected && styles.rolePillTextSelected]}>
                      {option.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <FarmButton
              title={loading ? 'Sending...' : 'Send WhatsApp Invitation'}
              variant="harvest"
              iconName="paper-plane-outline"
              onPress={invite}
              loading={loading}
              style={{ marginTop: 12 }}
            />
          </GlassCard>
        )}

        {/* Member List */}
        <View style={styles.listHeaderRow}>
          <Text style={styles.listHeading}>Active Members</Text>
          <Badge label={`${members.length} Members`} variant="active" size="sm" />
        </View>

        <FlatList
          data={members}
          keyExtractor={(item) => item.id}
          renderItem={renderMember}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={36} color={FarmTheme.colors.forest} />
              <Text style={styles.emptyText}>No members registered yet.</Text>
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
    paddingTop: 8,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: FarmTheme.colors.forest,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: FarmTheme.colors.forest,
    letterSpacing: -0.3,
  },
  pageSubtitle: {
    fontSize: 12,
    color: FarmTheme.colors.textMuted,
    marginBottom: 14,
  },
  inviteCard: {
    marginBottom: 16,
  },
  inviteInner: {
    padding: 16,
  },
  inviteHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  inviteCaption: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.75)',
    marginBottom: 10,
  },
  roleLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.85)',
    marginBottom: 6,
  },
  roleRow: {
    flexDirection: 'row',
    gap: 6,
  },
  rolePill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: FarmTheme.radius.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  rolePillSelected: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  rolePillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  rolePillTextSelected: {
    color: FarmTheme.colors.forest,
  },
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  listHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: FarmTheme.colors.textPrimary,
  },
  listContent: {
    paddingBottom: 40,
  },
  memberCard: {
    marginBottom: 8,
  },
  memberInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: FarmTheme.colors.emeraldSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: FarmTheme.colors.forest,
  },
  memberName: {
    fontSize: 14,
    fontWeight: '700',
    color: FarmTheme.colors.textPrimary,
  },
  memberPhone: {
    fontSize: 11,
    color: FarmTheme.colors.textMuted,
    marginTop: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyText: {
    fontSize: 13,
    color: FarmTheme.colors.textMuted,
    marginTop: 6,
  },
});
