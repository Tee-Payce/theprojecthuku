import { Badge, FarmButton, GlassCard, ProgressBar } from '@/components/farm-ui';
import { FarmTheme } from '@/constants/theme';
import { getAllBatches } from '@/database/batchQueries';
import { getMortalityByBatch } from '@/database/mortalityQueries';
import { getBatchProgress } from '@/database/progressUtils';
import { getSalesByBatch } from '@/database/salesQueries';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function Batches() {
  const [batches, setBatches] = useState([]);
  const [filter, setFilter] = useState('all');

  const load = useCallback(() => {
    const batchData = getAllBatches();
    const batchesWithStats = batchData.map((batch) => {
      const revenue = getSalesByBatch(batch.id);
      const mortality = getMortalityByBatch(batch.id);
      const progress = getBatchProgress(batch.startDate);
      const totalCost = batch.initialChicks * batch.chickPrice;
      const profit = revenue - totalCost;

      return {
        ...batch,
        revenue,
        mortality,
        progress,
        totalCost,
        profit,
        surviving: Math.max(batch.initialChicks - mortality, 0),
      };
    });
    setBatches(batchesWithStats);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const filteredBatches = batches.filter((b) => {
    if (filter === 'active') return b.status === 'active';
    if (filter === 'completed') return b.status === 'completed';
    return true;
  });

  const activeCount = batches.filter((b) => b.status === 'active').length;
  const completedCount = batches.filter((b) => b.status === 'completed').length;
  const totalProfit = batches.reduce((sum, b) => sum + (b.profit || 0), 0);

  const renderBatchItem = ({ item }) => {
    const isCompleted = item.status === 'completed' || item.progress.completed;
    const isProfitable = item.profit >= 0;

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => router.push(`/batches/${item.id}`)}
        style={styles.cardWrapper}
      >
        <GlassCard variant="surface" contentStyle={styles.cardInner}>
          {/* Header Row */}
          <View style={styles.cardHeader}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.batchName}>{item.name}</Text>
              <Text style={styles.batchDate}>Started {item.startDate}</Text>
            </View>
            <Badge
              label={isCompleted ? 'Completed' : 'Active'}
              variant={isCompleted ? 'completed' : 'active'}
              size="sm"
            />
          </View>

          {/* Growth Progress Bar */}
          <View style={styles.progressRow}>
            <View style={styles.progressLabelRow}>
              <Text style={styles.weekText}>
                Week {item.progress.week} of 6
              </Text>
              <Text style={styles.percentText}>{item.progress.percentage}%</Text>
            </View>
            <ProgressBar progress={item.progress.percentage} height={7} />
          </View>

          {/* Three Key Metrics Grid */}
          <View style={styles.metricsGrid}>
            <View style={styles.metricCol}>
              <Text style={styles.metricLabel}>LIVE BIRDS</Text>
              <View style={styles.metricValueRow}>
                <MaterialCommunityIcons
                  name="feather"
                  size={14}
                  color={FarmTheme.colors.forest}
                  style={{ marginRight: 2 }}
                />
                <Text style={styles.metricValue}>
                  {item.surviving}
                  <Text style={styles.metricMuted}>/{item.initialChicks}</Text>
                </Text>
              </View>
            </View>

            <View style={styles.metricDivider} />

            <View style={styles.metricCol}>
              <Text style={styles.metricLabel}>REVENUE</Text>
              <Text style={[styles.metricValue, { color: FarmTheme.colors.forestMedium }]}>
                ${item.revenue.toFixed(2)}
              </Text>
            </View>

            <View style={styles.metricDivider} />

            <View style={styles.metricCol}>
              <Text style={styles.metricLabel}>PROFIT</Text>
              <Text
                style={[
                  styles.metricValue,
                  { color: isProfitable ? FarmTheme.colors.forest : FarmTheme.colors.rose },
                ]}
              >
                ${item.profit.toFixed(2)}
              </Text>
            </View>
          </View>

          {/* Mortality warning chip if birds lost */}
          {item.mortality > 0 && (
            <View style={styles.mortalityChip}>
              <Ionicons name="alert-circle" size={13} color={FarmTheme.colors.rose} style={{ marginRight: 4 }} />
              <Text style={styles.mortalityText}>
                {item.mortality} birds lost ({((item.mortality / item.initialChicks) * 100).toFixed(1)}% mortality)
              </Text>
            </View>
          )}
        </GlassCard>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Banner / Filter Toolbar */}
      <View style={styles.toolbar}>
        {/* Farm Flock Summary Glass Banner */}
        <GlassCard variant="forest" contentStyle={styles.summaryInner} style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>TOTAL FLOCKS</Text>
            <Text style={styles.summaryValue}>{batches.length}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>ACTIVE</Text>
            <Text style={[styles.summaryValue, { color: FarmTheme.colors.emeraldLight }]}>
              {activeCount}
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>NET PROFIT</Text>
            <Text
              style={[
                styles.summaryValue,
                { color: totalProfit >= 0 ? FarmTheme.colors.wheat : FarmTheme.colors.roseLight },
              ]}
            >
              ${totalProfit.toFixed(0)}
            </Text>
          </View>
        </GlassCard>

        {/* Filter Pills and New Batch Action */}
        <View style={styles.filterRow}>
          <View style={styles.filterPills}>
            {['all', 'active', 'completed'].map((tab) => {
              const selected = filter === tab;
              const count =
                tab === 'all'
                  ? batches.length
                  : tab === 'active'
                  ? activeCount
                  : completedCount;

              return (
                <TouchableOpacity
                  key={tab}
                  onPress={() => setFilter(tab)}
                  style={[
                    styles.filterTab,
                    selected && styles.filterTabSelected,
                  ]}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.filterTabText,
                      selected && styles.filterTabTextSelected,
                    ]}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)} ({count})
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <FarmButton
            title="New"
            size="sm"
            variant="primary"
            iconName="add"
            onPress={() => router.push('/batches/add')}
          />
        </View>
      </View>

      {/* Batches List */}
      <FlatList
        data={filteredBatches}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderBatchItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <MaterialCommunityIcons name="egg-easter" size={36} color={FarmTheme.colors.forest} />
            </View>
            <Text style={styles.emptyTitle}>
              {filter === 'all'
                ? 'No Flock Batches Yet'
                : `No ${filter} batches found`}
            </Text>
            <Text style={styles.emptySubtitle}>
              Start tracking chicks, feed rations, and mortality by adding your first poultry batch.
            </Text>
            <FarmButton
              title="Add Flock Batch"
              variant="primary"
              iconName="add"
              onPress={() => router.push('/batches/add')}
              style={{ marginTop: 14 }}
            />
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: FarmTheme.colors.background,
  },
  toolbar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  summaryCard: {
    marginBottom: 12,
  },
  summaryInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.65)',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  summaryDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  filterPills: {
    flexDirection: 'row',
    backgroundColor: 'rgba(20, 83, 45, 0.08)',
    borderRadius: FarmTheme.radius.full,
    padding: 3,
    flex: 1,
  },
  filterTab: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: FarmTheme.radius.full,
    flex: 1,
    alignItems: 'center',
  },
  filterTabSelected: {
    backgroundColor: '#FFFFFF',
    ...FarmTheme.shadows.soft,
  },
  filterTabText: {
    fontSize: 11,
    fontWeight: '700',
    color: FarmTheme.colors.textMuted,
  },
  filterTabTextSelected: {
    color: FarmTheme.colors.forest,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 40,
  },
  cardWrapper: {
    marginBottom: 12,
  },
  cardInner: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  batchName: {
    fontSize: 17,
    fontWeight: '800',
    color: FarmTheme.colors.textPrimary,
  },
  batchDate: {
    fontSize: 12,
    color: FarmTheme.colors.textMuted,
    marginTop: 2,
  },
  progressRow: {
    marginBottom: 12,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  weekText: {
    fontSize: 11,
    fontWeight: '600',
    color: FarmTheme.colors.textSecondary,
  },
  percentText: {
    fontSize: 11,
    fontWeight: '700',
    color: FarmTheme.colors.forest,
  },
  metricsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(20, 83, 45, 0.03)',
    borderRadius: FarmTheme.radius.md,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: 'rgba(20, 83, 45, 0.06)',
  },
  metricCol: {
    flex: 1,
    alignItems: 'center',
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(20, 83, 45, 0.08)',
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: FarmTheme.colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  metricValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '800',
    color: FarmTheme.colors.textPrimary,
  },
  metricMuted: {
    fontSize: 11,
    fontWeight: '600',
    color: FarmTheme.colors.textMuted,
  },
  mortalityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: FarmTheme.colors.rosePale,
    borderRadius: FarmTheme.radius.sm,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  mortalityText: {
    fontSize: 11,
    fontWeight: '600',
    color: FarmTheme.colors.roseDark,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 50,
    paddingHorizontal: 20,
  },
  emptyIconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: FarmTheme.colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: FarmTheme.colors.textPrimary,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: FarmTheme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 260,
  },
});
