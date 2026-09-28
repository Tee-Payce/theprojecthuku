import { Badge, FarmButton, GlassCard } from '@/components/farm-ui';
import { FarmTheme } from '@/constants/theme';
import { getAllBatches } from '@/database/batchQueries';
import { getBatchProgress } from '@/database/progressUtils';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import BatchProgressCard from '../../components/BatchProgressCard';

export default function Progress() {
  const [batches, setBatches] = useState([]);

  const load = useCallback(() => {
    const data = getAllBatches();
    setBatches(data);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const readyBatches = batches.filter((b) => {
    const p = getBatchProgress(b.startDate);
    return p.completed || p.percentage >= 100;
  });

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Banner */}
      <GlassCard variant="forest" style={styles.bannerCard} contentStyle={styles.bannerContent}>
        <View style={styles.bannerIconCircle}>
          <MaterialCommunityIcons name="timeline-clock-outline" size={26} color={FarmTheme.colors.emeraldLight} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.bannerTitle}>Flock Growth Timeline</Text>
          <Text style={styles.bannerSubtitle}>
            Monitor your batches across the 6-week growth cycle from brooding heat lamps to slaughter readiness.
          </Text>
        </View>
      </GlassCard>

      {/* Summary Chips */}
      <View style={styles.summaryRow}>
        <GlassCard variant="emerald" style={{ flex: 1 }} contentStyle={styles.chipInner}>
          <Text style={styles.chipLabel}>TOTAL TRACKED</Text>
          <Text style={styles.chipValue}>{batches.length} Batches</Text>
        </GlassCard>

        <GlassCard variant="harvest" style={{ flex: 1 }} contentStyle={styles.chipInner}>
          <Text style={styles.chipLabel}>READY FOR MARKET</Text>
          <Text style={[styles.chipValue, { color: FarmTheme.colors.goldDark }]}>
            {readyBatches.length} Ready
          </Text>
        </GlassCard>
      </View>

      {/* Batch Cards */}
      <View style={styles.listSection}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeading}>Active Flock Lifecycles</Text>
          <Badge label={`${batches.length} Batches`} variant="active" size="sm" />
        </View>

        {batches.length > 0 ? (
          batches.map((batch) => (
            <BatchProgressCard key={batch.id} batch={batch} />
          ))
        ) : (
          <GlassCard variant="default" contentStyle={styles.emptyContent}>
            <MaterialCommunityIcons name="egg-easter" size={40} color={FarmTheme.colors.forest} />
            <Text style={styles.emptyTitle}>No Flocks Being Tracked</Text>
            <Text style={styles.emptyDesc}>
              Register a batch to track daily progress and automated growth milestones.
            </Text>
            <FarmButton
              title="Add Batch"
              variant="primary"
              iconName="add"
              onPress={() => router.push('/batches/add')}
              style={{ marginTop: 14 }}
            />
          </GlassCard>
        )}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: FarmTheme.colors.background,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  bannerCard: {
    marginBottom: 14,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  bannerIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  bannerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  bannerSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.75)',
    lineHeight: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  chipInner: {
    padding: 12,
    alignItems: 'center',
  },
  chipLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: FarmTheme.colors.textMuted,
    letterSpacing: 0.5,
  },
  chipValue: {
    fontSize: 16,
    fontWeight: '800',
    color: FarmTheme.colors.forest,
    marginTop: 2,
  },
  listSection: {
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: FarmTheme.colors.textPrimary,
  },
  emptyContent: {
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: FarmTheme.colors.textPrimary,
    marginTop: 8,
  },
  emptyDesc: {
    fontSize: 12,
    color: FarmTheme.colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 240,
  },
});
