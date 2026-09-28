import { Badge, FarmButton, GlassCard, ProgressBar } from '@/components/farm-ui';
import { FarmTheme } from '@/constants/theme';
import { getBatchProgress, getEndDate } from '@/database/progressUtils';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function BatchProgressCard({ batch }) {
  const progress = getBatchProgress(batch.startDate);
  const targetEndDate = getEndDate(batch.startDate);
  const isReady = progress.completed || progress.percentage >= 100;

  return (
    <View style={styles.cardWrapper}>
      <GlassCard variant="surface" contentStyle={styles.cardInner}>
        {/* Header Row */}
        <View style={styles.headerRow}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={styles.batchName}>{batch.name}</Text>
            <Text style={styles.batchDates}>
              Started {batch.startDate} • Target {targetEndDate}
            </Text>
          </View>
          <Badge
            label={isReady ? 'Ready for Sale' : `Week ${progress.week} of 6`}
            variant={isReady ? 'completed' : 'active'}
          />
        </View>

        {/* Progress Bar & Percent */}
        <View style={styles.progressContainer}>
          <View style={styles.progressTextRow}>
            <Text style={styles.progressLabel}>Broiler growth cycle</Text>
            <Text style={styles.progressPercent}>{progress.percentage}%</Text>
          </View>
          <ProgressBar progress={progress.percentage} height={8} />
        </View>

        {/* 3 Milestone Columns */}
        <View style={styles.milestonesRow}>
          <View style={styles.milestoneItem}>
            <MaterialCommunityIcons
              name="egg-outline"
              size={16}
              color={FarmTheme.colors.forest}
              style={{ marginBottom: 2 }}
            />
            <Text style={styles.milestoneLabel}>FLOCK SIZE</Text>
            <Text style={styles.milestoneVal}>{batch.initialChicks} chicks</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.milestoneItem}>
            <Ionicons
              name="calendar-outline"
              size={15}
              color={FarmTheme.colors.amber}
              style={{ marginBottom: 2 }}
            />
            <Text style={styles.milestoneLabel}>CURRENT AGE</Text>
            <Text style={styles.milestoneVal}>Week {progress.week}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.milestoneItem}>
            <MaterialCommunityIcons
              name="scale-bathroom"
              size={15}
              color={FarmTheme.colors.forestMedium}
              style={{ marginBottom: 2 }}
            />
            <Text style={styles.milestoneLabel}>STATUS</Text>
            <Text
              style={[
                styles.milestoneVal,
                { color: isReady ? FarmTheme.colors.skyDark : FarmTheme.colors.forest },
              ]}
            >
              {isReady ? 'Market Ready' : 'Growing'}
            </Text>
          </View>
        </View>

        <FarmButton
          title="Inspect Flock"
          variant="glass"
          size="sm"
          iconName="arrow-forward"
          iconPosition="right"
          onPress={() => router.push(`/batches/${batch.id}`)}
          style={{ marginTop: 12 }}
        />
      </GlassCard>
    </View>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    marginBottom: 12,
  },
  cardInner: {
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  batchName: {
    fontSize: 17,
    fontWeight: '800',
    color: FarmTheme.colors.textPrimary,
  },
  batchDates: {
    fontSize: 11,
    color: FarmTheme.colors.textMuted,
    marginTop: 2,
  },
  progressContainer: {
    marginBottom: 14,
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
  progressPercent: {
    fontSize: 12,
    fontWeight: '800',
    color: FarmTheme.colors.forest,
  },
  milestonesRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(20, 83, 45, 0.04)',
    borderRadius: FarmTheme.radius.md,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: 'rgba(20, 83, 45, 0.08)',
  },
  milestoneItem: {
    flex: 1,
    alignItems: 'center',
  },
  milestoneLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: FarmTheme.colors.textMuted,
    letterSpacing: 0.4,
  },
  milestoneVal: {
    fontSize: 12,
    fontWeight: '700',
    color: FarmTheme.colors.textPrimary,
    marginTop: 1,
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(20, 83, 45, 0.08)',
  },
});
