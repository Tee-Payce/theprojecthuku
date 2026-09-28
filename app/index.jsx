import {
  Badge,
  FarmButton,
  FarmHero,
  GlassCard,
  ProgressBar,
  QuickActionTile,
  StatCard,
} from '@/components/farm-ui';
import { FarmTheme } from '@/constants/theme';
import { useAppContext } from '@/contexts/AppContext';
import { getAllBatches } from '@/database/batchQueries';
import { getMortalityByBatch } from '@/database/mortalityQueries';
import { getBatchProgress } from '@/database/progressUtils';
import { getTotalRevenue } from '@/database/salesQueries';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Dashboard() {
  const { refreshTrigger, triggerRefresh } = useAppContext();
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalBatches: 0,
    activeBatches: 0,
    totalBirds: 0,
    totalRevenue: 0,
    recentBatches: [],
  });

  const loadDashboardData = () => {
    const batches = getAllBatches();
    const activeBatches = batches.filter((b) => b.status === 'active');
    const revenue = getTotalRevenue();

    let totalLiveBirds = 0;
    activeBatches.forEach((batch) => {
      const dead = getMortalityByBatch(batch.id);
      totalLiveBirds += Math.max(batch.initialChicks - dead, 0);
    });

    const recentBatches = batches.slice(0, 3).map((batch) => {
      const mortality = getMortalityByBatch(batch.id);
      const progress = getBatchProgress(batch.startDate);
      const surviving = Math.max(batch.initialChicks - mortality, 0);
      return {
        ...batch,
        mortality,
        progress,
        surviving,
      };
    });

    setStats({
      totalBatches: batches.length,
      activeBatches: activeBatches.length,
      totalBirds: totalLiveBirds,
      totalRevenue: revenue,
      recentBatches,
    });
  };

  useEffect(() => {
    loadDashboardData();
  }, [refreshTrigger]);

  const onRefresh = async () => {
    setRefreshing(true);
    triggerRefresh();
    loadDashboardData();
    setTimeout(() => setRefreshing(false), 500);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={FarmTheme.colors.forest}
            colors={[FarmTheme.colors.forest]}
          />
        }
      >
        {/* Farm Hero with Branding, Project Switcher and Sync Status */}
        <FarmHero />

        {/* Flock Key Metrics (Glass Cards) */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Flock Metrics</Text>
          <Text style={styles.sectionSubtitle}>Live overview</Text>
        </View>

        <View style={styles.statsRow}>
          <StatCard
            title="Active Flocks"
            value={stats.activeBatches}
            subtitle={`${stats.totalBatches} total batches`}
            mciName="egg-outline"
            variant="emerald"
            onPress={() => router.push('/batches')}
          />
          <StatCard
            title="Live Birds"
            value={stats.totalBirds.toLocaleString()}
            subtitle="In current batches"
            mciName="feather"
            variant="forest"
            onPress={() => router.push('/batches')}
          />
        </View>

        <View style={styles.revenueCardWrapper}>
          <StatCard
            title="Total Harvest Revenue"
            value={`$${stats.totalRevenue.toFixed(2)}`}
            subtitle="Gross poultry & egg sales"
            iconName="cash-outline"
            variant="harvest"
            onPress={() => router.push('/sales')}
          />
        </View>

        {/* Quick Action Matrix */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Farm Operations</Text>
          <Text style={styles.sectionSubtitle}>Quick entry</Text>
        </View>

        <View style={styles.actionGrid}>
          <QuickActionTile
            title="New Batch"
            subtitle="Register chicks"
            iconName="add-circle"
            gradientColors={['#14532D', '#15803D']}
            onPress={() => router.push('/batches/add')}
            style={styles.gridItem}
          />
          <QuickActionTile
            title="Record Sale"
            subtitle="Birds or weight"
            iconName="wallet"
            gradientColors={['#B45309', '#D97706']}
            onPress={() => router.push('/sales/add')}
            style={styles.gridItem}
          />
          <QuickActionTile
            title="Feed Purchase"
            subtitle="Bags & feed type"
            mciName="barley"
            gradientColors={['#CA8A04', '#EAB308']}
            onPress={() => router.push('/feed/add')}
            style={styles.gridItem}
          />
          <QuickActionTile
            title="Record Loss"
            subtitle="Mortality tracking"
            mciName="skull-outline"
            gradientColors={['#B91C1C', '#EF4444']}
            onPress={() => router.push('/mortality/add')}
            style={styles.gridItem}
          />
          <QuickActionTile
            title="Add Expense"
            subtitle="Vaccines & heating"
            mciName="receipt-outline"
            gradientColors={['#6D28D9', '#8B5CF6']}
            onPress={() => router.push('/expenses/add')}
            style={styles.gridItem}
          />
          <QuickActionTile
            title="Schedule"
            subtitle="Vaccine alerts"
            iconName="calendar"
            gradientColors={['#0369A1', '#0EA5E9']}
            onPress={() => router.push('/calendar')}
            style={styles.gridItem}
          />
        </View>

        {/* Recent Batches Section */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>Active Flock Batches</Text>
            {stats.recentBatches.length > 0 && (
              <Badge label={`${stats.recentBatches.length} Recent`} variant="active" size="sm" />
            )}
          </View>
          <TouchableOpacity onPress={() => router.push('/batches')}>
            <Text style={styles.seeAllText}>View All →</Text>
          </TouchableOpacity>
        </View>

        {stats.recentBatches.length > 0 ? (
          stats.recentBatches.map((batch) => {
            const isCompleted = batch.status === 'completed' || batch.progress.completed;
            return (
              <TouchableOpacity
                key={batch.id}
                activeOpacity={0.85}
                onPress={() => router.push(`/batches/${batch.id}`)}
                style={styles.batchCardWrapper}
              >
                <GlassCard variant="surface" contentStyle={styles.batchCardInner}>
                  <View style={styles.batchHeader}>
                    <View style={styles.batchNameCol}>
                      <Text style={styles.batchName}>{batch.name}</Text>
                      <Text style={styles.batchStartDate}>Started: {batch.startDate}</Text>
                    </View>
                    <Badge
                      label={isCompleted ? 'Completed' : `Week ${batch.progress.week}`}
                      variant={isCompleted ? 'completed' : 'active'}
                      size="sm"
                    />
                  </View>

                  {/* Progress Bar */}
                  <View style={styles.progressContainer}>
                    <View style={styles.progressTextRow}>
                      <Text style={styles.progressLabel}>Growth cycle</Text>
                      <Text style={styles.progressValue}>{batch.progress.percentage}%</Text>
                    </View>
                    <ProgressBar progress={batch.progress.percentage} height={7} />
                  </View>

                  {/* Batch Stats Footer */}
                  <View style={styles.batchFooter}>
                    <View style={styles.batchStatItem}>
                      <MaterialCommunityIcons
                        name="feather"
                        size={14}
                        color={FarmTheme.colors.forest}
                        style={{ marginRight: 4 }}
                      />
                      <Text style={styles.batchStatText}>
                        <Text style={styles.batchStatHighlight}>{batch.surviving}</Text> / {batch.initialChicks} birds
                      </Text>
                    </View>

                    {batch.mortality > 0 && (
                      <View style={styles.batchStatItem}>
                        <Ionicons
                          name="warning-outline"
                          size={13}
                          color={FarmTheme.colors.rose}
                          style={{ marginRight: 4 }}
                        />
                        <Text style={[styles.batchStatText, { color: FarmTheme.colors.rose }]}>
                          -{batch.mortality} loss
                        </Text>
                      </View>
                    )}

                    <View style={styles.detailsLink}>
                      <Text style={styles.detailsLinkText}>Details</Text>
                      <Ionicons name="chevron-forward" size={14} color={FarmTheme.colors.forest} />
                    </View>
                  </View>
                </GlassCard>
              </TouchableOpacity>
            );
          })
        ) : (
          <GlassCard variant="default" style={styles.emptyCard}>
            <View style={styles.emptyContent}>
              <View style={styles.emptyIconCircle}>
                <MaterialCommunityIcons name="egg-easter" size={32} color={FarmTheme.colors.forest} />
              </View>
              <Text style={styles.emptyTitle}>No Flock Batches Yet</Text>
              <Text style={styles.emptySubtitle}>
                Add your first batch to start monitoring chick growth, feed usage, and harvest profits.
              </Text>
              <FarmButton
                title="Create First Batch"
                variant="primary"
                iconName="add"
                onPress={() => router.push('/batches/add')}
                style={{ marginTop: 14 }}
              />
            </View>
          </GlassCard>
        )}

        {/* Directory & Timeline Quick Glass Links */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Farm Directory & Tools</Text>
        </View>

        <View style={styles.footerLinksGrid}>
          <TouchableOpacity
            style={styles.navLinkCard}
            activeOpacity={0.82}
            onPress={() => router.push('/clients')}
          >
            <GlassCard variant="default" contentStyle={styles.navLinkInner}>
              <View style={[styles.navLinkIcon, { backgroundColor: FarmTheme.colors.emeraldSoft }]}>
                <Ionicons name="people-outline" size={20} color={FarmTheme.colors.forest} />
              </View>
              <View style={styles.navLinkTextCol}>
                <Text style={styles.navLinkTitle}>Client Directory</Text>
                <Text style={styles.navLinkDesc}>Buyers & purchase history</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={FarmTheme.colors.textMuted} />
            </GlassCard>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navLinkCard}
            activeOpacity={0.82}
            onPress={() => router.push('/progress')}
          >
            <GlassCard variant="default" contentStyle={styles.navLinkInner}>
              <View style={[styles.navLinkIcon, { backgroundColor: FarmTheme.colors.skySoft }]}>
                <MaterialCommunityIcons name="timeline-clock-outline" size={20} color={FarmTheme.colors.skyDark} />
              </View>
              <View style={styles.navLinkTextCol}>
                <Text style={styles.navLinkTitle}>Growth Timeline</Text>
                <Text style={styles.navLinkDesc}>6-week broiler schedule</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={FarmTheme.colors.textMuted} />
            </GlassCard>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: FarmTheme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 10,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: FarmTheme.colors.textPrimary,
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: FarmTheme.colors.textMuted,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: FarmTheme.colors.forestMedium,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  revenueCardWrapper: {
    marginBottom: 6,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 6,
  },
  gridItem: {
    width: '31%',
    flexGrow: 1,
  },
  batchCardWrapper: {
    marginBottom: 10,
  },
  batchCardInner: {
    padding: 14,
  },
  batchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  batchNameCol: {
    flex: 1,
    marginRight: 8,
  },
  batchName: {
    fontSize: 16,
    fontWeight: '700',
    color: FarmTheme.colors.textPrimary,
  },
  batchStartDate: {
    fontSize: 11,
    color: FarmTheme.colors.textMuted,
    marginTop: 2,
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressLabel: {
    fontSize: 11,
    color: FarmTheme.colors.textSecondary,
    fontWeight: '600',
  },
  progressValue: {
    fontSize: 11,
    fontWeight: '700',
    color: FarmTheme.colors.forest,
  },
  batchFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(20, 83, 45, 0.06)',
  },
  batchStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  batchStatText: {
    fontSize: 12,
    color: FarmTheme.colors.textSecondary,
  },
  batchStatHighlight: {
    fontWeight: '700',
    color: FarmTheme.colors.textPrimary,
  },
  detailsLink: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailsLinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: FarmTheme.colors.forest,
    marginRight: 2,
  },
  emptyCard: {
    paddingVertical: 12,
  },
  emptyContent: {
    alignItems: 'center',
    padding: 16,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: FarmTheme.colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: FarmTheme.colors.textPrimary,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    color: FarmTheme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },
  footerLinksGrid: {
    gap: 10,
  },
  navLinkCard: {
    borderRadius: FarmTheme.radius.md,
  },
  navLinkInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  navLinkIcon: {
    width: 40,
    height: 40,
    borderRadius: FarmTheme.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  navLinkTextCol: {
    flex: 1,
  },
  navLinkTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: FarmTheme.colors.textPrimary,
  },
  navLinkDesc: {
    fontSize: 11,
    color: FarmTheme.colors.textMuted,
    marginTop: 1,
  },
});
