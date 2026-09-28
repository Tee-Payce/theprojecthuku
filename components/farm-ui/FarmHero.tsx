import { FarmTheme } from '@/constants/theme';
import { useAppContext } from '@/contexts/AppContext';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface FarmHeroProps {
  showBackToProjects?: boolean;
}

export const FarmHero: React.FC<FarmHeroProps> = ({ showBackToProjects = true }) => {
  const { activeProject, setActiveProject, syncStatus, syncNow } = useAppContext();

  const handleBackToProjects = () => {
    try {
      Haptics.selectionAsync();
    } catch {}
    setActiveProject(null);
    router.replace('/projects');
  };

  const handleSyncPress = () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
    syncNow();
  };

  const isSyncing = syncStatus.status === 'syncing';
  const hasPending = syncStatus.pendingCount > 0;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={FarmTheme.gradients.forestHero}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* Subtle decorative mesh circles for glass depth */}
        <View style={styles.decorativeCircle1} />
        <View style={styles.decorativeCircle2} />

        <View style={styles.content}>
          {/* Top Bar with Project navigation and branding */}
          <View style={styles.topBar}>
            {showBackToProjects ? (
              <TouchableOpacity
                onPress={handleBackToProjects}
                style={styles.backButton}
                activeOpacity={0.8}
                accessibilityLabel="Switch project"
              >
                <Ionicons name="apps-outline" size={18} color="#FFFFFF" />
                <Text style={styles.backButtonText}>Projects</Text>
              </TouchableOpacity>
            ) : (
              <View />
            )}

            {/* Sync Status Glass Pill */}
            <TouchableOpacity
              onPress={handleSyncPress}
              disabled={isSyncing}
              activeOpacity={0.8}
              style={[
                styles.syncPill,
                hasPending && styles.syncPillPending,
                isSyncing && styles.syncPillSyncing,
              ]}
            >
              {isSyncing ? (
                <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 6 }} />
              ) : hasPending ? (
                <Ionicons name="cloud-upload-outline" size={14} color="#FDE68A" style={{ marginRight: 5 }} />
              ) : (
                <Ionicons name="checkmark-circle-outline" size={14} color="#86EFAC" style={{ marginRight: 5 }} />
              )}
              <Text style={styles.syncText}>
                {isSyncing
                  ? 'Syncing...'
                  : hasPending
                  ? `${syncStatus.pendingCount} to sync`
                  : 'Cloud Synced'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Project Title & Farm Emblem */}
          <View style={styles.heroBody}>
            <View style={styles.avatarGlass}>
              <MaterialCommunityIcons name="egg-outline" size={24} color={FarmTheme.colors.emeraldLight} />
            </View>
            <View style={styles.titleColumn}>
              <View style={styles.tagRow}>
                <Text style={styles.preTitle}>POULTRY MANAGEMENT</Text>
                {activeProject?.role && (
                  <View style={styles.roleBadge}>
                    <Text style={styles.roleText}>{activeProject.role}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.mainTitle} numberOfLines={1}>
                {activeProject?.name || 'The Project Huku 🐔'}
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: FarmTheme.radius.xl,
    overflow: 'hidden',
    marginBottom: 16,
    ...FarmTheme.shadows.medium,
  },
  gradient: {
    position: 'relative',
    padding: 18,
    paddingTop: 16,
    paddingBottom: 22,
  },
  decorativeCircle1: {
    position: 'absolute',
    top: -40,
    right: -20,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
  },
  decorativeCircle2: {
    position: 'absolute',
    bottom: -50,
    left: 40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
  },
  content: {
    zIndex: 2,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: FarmTheme.radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  syncPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: FarmTheme.radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.20)',
  },
  syncPillPending: {
    backgroundColor: 'rgba(245, 158, 11, 0.22)',
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  syncPillSyncing: {
    backgroundColor: 'rgba(56, 189, 248, 0.22)',
    borderColor: 'rgba(56, 189, 248, 0.4)',
  },
  syncText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  heroBody: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarGlass: {
    width: 48,
    height: 48,
    borderRadius: FarmTheme.radius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  titleColumn: {
    flex: 1,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  preTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: FarmTheme.colors.emeraldLight,
    letterSpacing: 1.2,
  },
  roleBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: FarmTheme.radius.full,
    marginLeft: 8,
  },
  roleText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
});
