import { Badge, FarmButton, GlassCard, ProgressBar } from '@/components/farm-ui';
import { FarmTheme } from '@/constants/theme';
import { getAllBatches, updateBatchStatus } from '@/database/batchQueries';
import { getMortalityByBatch } from '@/database/mortalityQueries';
import { getBatchProgress, getEndDate, isBatchCompleted } from '@/database/progressUtils';
import { getSalesByBatch } from '@/database/salesQueries';
import {
  getUpcomingReminders,
  requestNotificationPermissions,
  scheduleFeedReminders,
  scheduleVaccinationReminders,
} from '@/services/NotificationService';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Calendar } from 'react-native-calendars';

export default function CalendarScreen() {
  const [markedDates, setMarkedDates] = useState({});
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [batches, setBatches] = useState([]);
  const [reminders, setReminders] = useState([]);

  const loadBatches = useCallback(() => {
    const batchData = getAllBatches();
    const marks = {};
    const batchesWithProgress = [];

    batchData.forEach((batch) => {
      const start = batch.startDate;
      const end = getEndDate(batch.startDate);
      const progress = getBatchProgress(batch.startDate);
      const revenue = getSalesByBatch(batch.id);
      const mortality = getMortalityByBatch(batch.id);
      const isCompleted = isBatchCompleted(batch.startDate);

      if (isCompleted && batch.status === 'active') {
        updateBatchStatus(batch.id, 'completed');
        batch.status = 'completed';
      }

      const batchColor = batch.status === 'active' ? FarmTheme.colors.forest : '#9CA3AF';
      const endColor = batch.status === 'active' ? FarmTheme.colors.amber : '#9CA3AF';

      marks[start] = {
        startingDay: true,
        color: batchColor,
        textColor: '#FFFFFF',
      };

      marks[end] = {
        endingDay: true,
        color: endColor,
        textColor: '#FFFFFF',
      };

      const startDate = new Date(start);
      const endDate = new Date(end);
      const currentDate = new Date(startDate);

      while (currentDate < endDate) {
        currentDate.setDate(currentDate.getDate() + 1);
        const dateStr = currentDate.toISOString().split('T')[0];

        if (dateStr !== end) {
          marks[dateStr] = {
            color: 'rgba(20, 83, 45, 0.15)',
            textColor: FarmTheme.colors.forest,
          };
        }
      }

      batchesWithProgress.push({
        ...batch,
        progress,
        revenue,
        mortality,
        surviving: Math.max(batch.initialChicks - mortality, 0),
        endDate: end,
      });
    });

    setMarkedDates(marks);
    setBatches(batchesWithProgress);
    setReminders(getUpcomingReminders(batchesWithProgress));
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadBatches();
      requestNotificationPermissions();
    }, [loadBatches])
  );

  const scheduleNotifications = async (batch) => {
    try {
      await scheduleFeedReminders(batch.id, batch.name, batch.startDate);
      await scheduleVaccinationReminders(batch.id, batch.name, batch.startDate);
      Alert.alert(
        'Reminder Guide',
        'Feed and vaccination reminders are mapped into your farm calendar guide.'
      );
    } catch (_error) {
      Alert.alert('Notice', 'Schedule recorded into calendar.');
    }
  };

  const onDayPress = (day) => {
    const selectedDate = day.dateString;
    const batchForDate = batches.find(
      (batch) => batch.startDate === selectedDate || batch.endDate === selectedDate
    );
    setSelectedBatch(batchForDate || null);
  };

  const activeBatches = batches.filter((b) => b.status === 'active');
  const completedBatches = batches.filter((b) => b.status === 'completed');

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Farm Calendar Header */}
      <GlassCard variant="forest" style={styles.summaryCard} contentStyle={styles.summaryInner}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>ACTIVE FLOCKS</Text>
          <Text style={styles.summaryValue}>{activeBatches.length}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>COMPLETED</Text>
          <Text style={styles.summaryValue}>{completedBatches.length}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>REMINDERS</Text>
          <Text style={[styles.summaryValue, { color: FarmTheme.colors.wheat }]}>
            {reminders.length}
          </Text>
        </View>
      </GlassCard>

      {/* Calendar Card */}
      <GlassCard variant="surface" style={styles.calendarCard} contentStyle={{ padding: 6 }}>
        <Calendar
          markingType={'period'}
          markedDates={markedDates}
          onDayPress={onDayPress}
          theme={{
            backgroundColor: 'transparent',
            calendarBackground: 'transparent',
            textSectionTitleColor: FarmTheme.colors.textMuted,
            selectedDayBackgroundColor: FarmTheme.colors.forest,
            selectedDayTextColor: '#FFFFFF',
            todayTextColor: FarmTheme.colors.forest,
            dayTextColor: FarmTheme.colors.textPrimary,
            textDisabledColor: '#D1D5DB',
            arrowColor: FarmTheme.colors.forest,
            monthTextColor: FarmTheme.colors.forest,
            indicatorColor: FarmTheme.colors.forest,
            textDayFontWeight: '600',
            textMonthFontWeight: '800',
            textDayHeaderFontWeight: '700',
          }}
        />
      </GlassCard>

      {/* Selected Batch Details */}
      {selectedBatch && (
        <GlassCard variant="emerald" style={styles.selectedCard} contentStyle={styles.selectedInner}>
          <View style={styles.selectedHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.selectedTitle}>{selectedBatch.name}</Text>
              <Text style={styles.selectedSubtitle}>
                Week {selectedBatch.progress.week} • {selectedBatch.surviving} live birds
              </Text>
            </View>
            <Badge
              label={selectedBatch.status === 'active' ? 'Active' : 'Completed'}
              variant={selectedBatch.status === 'active' ? 'active' : 'completed'}
            />
          </View>

          <View style={styles.selectedProgress}>
            <ProgressBar progress={selectedBatch.progress.percentage} height={7} />
          </View>

          <View style={styles.buttonRow}>
            <FarmButton
              title="Batch Details"
              variant="primary"
              size="sm"
              onPress={() => router.push(`/batches/${selectedBatch.id}`)}
              style={{ flex: 1, marginRight: 6 }}
            />
            {selectedBatch.status === 'active' && (
              <>
                <FarmButton
                  title="Schedule"
                  variant="glass"
                  size="sm"
                  onPress={() => scheduleNotifications(selectedBatch)}
                  style={{ marginRight: 6 }}
                />
                <FarmButton
                  title="Record Sale"
                  variant="harvest"
                  size="sm"
                  onPress={() => router.push(`/sales/add?batchId=${selectedBatch.id}`)}
                  style={{ flex: 1 }}
                />
              </>
            )}
          </View>
        </GlassCard>
      )}

      {/* Reminders Section */}
      {reminders.length > 0 && (
        <View style={styles.sectionWrapper}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeading}>Upcoming Reminders</Text>
            <Badge label={`${reminders.length} Due`} variant="warning" size="sm" />
          </View>
          {reminders.map((reminder, index) => {
            const isCritical = reminder.priority === 'critical';
            const isHigh = reminder.priority === 'high';
            return (
              <GlassCard
                key={index}
                variant={isCritical ? 'rose' : isHigh ? 'harvest' : 'default'}
                style={styles.reminderCard}
                contentStyle={styles.reminderInner}
              >
                <View style={styles.reminderRow}>
                  <Text style={styles.reminderEmoji}>{reminder.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reminderTitle}>{reminder.title}</Text>
                    <Text style={styles.reminderBatch}>{reminder.batch}</Text>
                    <Text style={styles.reminderMsg}>{reminder.message}</Text>
                  </View>
                  <Badge
                    label={reminder.priority}
                    variant={isCritical ? 'danger' : isHigh ? 'warning' : 'active'}
                    size="sm"
                  />
                </View>
              </GlassCard>
            );
          })}
        </View>
      )}

      {/* Feed Schedule Protocol */}
      <View style={styles.sectionWrapper}>
        <Text style={styles.sectionHeading}>Standard 6-Week Feed Protocol</Text>
        <GlassCard variant="surface" contentStyle={styles.guideInner}>
          <View style={styles.feedStagesRow}>
            <View style={styles.feedStageItem}>
              <View style={[styles.stageBadge, { backgroundColor: FarmTheme.colors.forest }]}>
                <Text style={styles.stageBadgeText}>S</Text>
              </View>
              <Text style={styles.stageTitle}>Starter</Text>
              <Text style={styles.stageDays}>Days 0 - 12</Text>
              <Text style={styles.stageNote}>High Protein</Text>
            </View>

            <View style={styles.stageDivider} />

            <View style={styles.feedStageItem}>
              <View style={[styles.stageBadge, { backgroundColor: FarmTheme.colors.amber }]}>
                <Text style={styles.stageBadgeText}>G</Text>
              </View>
              <Text style={styles.stageTitle}>Grower</Text>
              <Text style={styles.stageDays}>Days 13 - 25</Text>
              <Text style={styles.stageNote}>Bone & Muscle</Text>
            </View>

            <View style={styles.stageDivider} />

            <View style={styles.feedStageItem}>
              <View style={[styles.stageBadge, { backgroundColor: FarmTheme.colors.goldDark }]}>
                <Text style={styles.stageBadgeText}>F</Text>
              </View>
              <Text style={styles.stageTitle}>Finisher</Text>
              <Text style={styles.stageDays}>Days 26 - 42</Text>
              <Text style={styles.stageNote}>Weight Gain</Text>
            </View>
          </View>
        </GlassCard>
      </View>

      {/* Vaccination Schedule Protocol */}
      <View style={styles.sectionWrapper}>
        <Text style={styles.sectionHeading}>Standard Vaccination Protocol</Text>
        <GlassCard variant="surface" contentStyle={styles.vaxInner}>
          <View style={styles.vaxRow}>
            <View style={styles.vaxBullet}>
              <Ionicons name="shield-checkmark" size={14} color={FarmTheme.colors.forest} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.vaxName}>MA5 + Clone 30 (Newcastle / Bronchitis)</Text>
              <Text style={styles.vaxSub}>Coarse eye-drop or spray application</Text>
            </View>
            <Badge label="Days 10-12" variant="active" size="sm" />
          </View>

          <View style={styles.vaxDivider} />

          <View style={styles.vaxRow}>
            <View style={styles.vaxBullet}>
              <Ionicons name="shield-checkmark" size={14} color={FarmTheme.colors.forest} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.vaxName}>IBD / Gumboro intermediate</Text>
              <Text style={styles.vaxSub}>Drinking water with skimmed milk stabilizer</Text>
            </View>
            <Badge label="Days 13-14" variant="warning" size="sm" />
          </View>

          <View style={styles.vaxDivider} />

          <View style={styles.vaxRow}>
            <View style={styles.vaxBullet}>
              <Ionicons name="shield-checkmark" size={14} color={FarmTheme.colors.forest} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.vaxName}>Newcastle Booster (Lasota / Clone 30)</Text>
              <Text style={styles.vaxSub}>Secondary booster in drinking water</Text>
            </View>
            <Badge label="Days 19-21" variant="active" size="sm" />
          </View>
        </GlassCard>
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
  summaryCard: {
    marginBottom: 14,
  },
  summaryInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
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
  calendarCard: {
    marginBottom: 16,
  },
  selectedCard: {
    marginBottom: 16,
  },
  selectedInner: {
    padding: 16,
  },
  selectedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  selectedTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: FarmTheme.colors.textPrimary,
  },
  selectedSubtitle: {
    fontSize: 12,
    color: FarmTheme.colors.textSecondary,
    marginTop: 2,
  },
  selectedProgress: {
    marginBottom: 14,
  },
  buttonRow: {
    flexDirection: 'row',
  },
  sectionWrapper: {
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: FarmTheme.colors.textPrimary,
    marginBottom: 8,
  },
  reminderCard: {
    marginBottom: 8,
  },
  reminderInner: {
    padding: 12,
  },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  reminderEmoji: {
    fontSize: 22,
  },
  reminderTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: FarmTheme.colors.textPrimary,
  },
  reminderBatch: {
    fontSize: 11,
    color: FarmTheme.colors.textMuted,
    marginTop: 1,
  },
  reminderMsg: {
    fontSize: 12,
    color: FarmTheme.colors.textSecondary,
    marginTop: 2,
  },
  guideInner: {
    padding: 14,
  },
  feedStagesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  feedStageItem: {
    flex: 1,
    alignItems: 'center',
  },
  stageBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  stageBadgeText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  stageTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: FarmTheme.colors.textPrimary,
  },
  stageDays: {
    fontSize: 11,
    color: FarmTheme.colors.textSecondary,
    marginTop: 1,
  },
  stageNote: {
    fontSize: 10,
    color: FarmTheme.colors.textMuted,
    marginTop: 1,
  },
  stageDivider: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(20, 83, 45, 0.08)',
  },
  vaxInner: {
    padding: 12,
  },
  vaxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  vaxBullet: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: FarmTheme.colors.emeraldSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vaxName: {
    fontSize: 13,
    fontWeight: '700',
    color: FarmTheme.colors.textPrimary,
  },
  vaxSub: {
    fontSize: 11,
    color: FarmTheme.colors.textMuted,
  },
  vaxDivider: {
    height: 1,
    backgroundColor: 'rgba(20, 83, 45, 0.06)',
    marginVertical: 4,
  },
});
