import { FarmButton, FarmInput, GlassCard } from '@/components/farm-ui';
import { FarmTheme } from '@/constants/theme';
import { useAppContext } from '@/contexts/AppContext';
import { getAllBatches } from '@/database/batchQueries';
import { getMortalityByBatch, recordMortality } from '@/database/mortalityQueries';
import { getSalesDetailsByBatch } from '@/database/salesQueries';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const REASON_OPTIONS = [
  { label: 'Heat Stress', icon: 'white-balance-sunny' },
  { label: 'Cold Stress', icon: 'snowflake' },
  { label: 'Disease / Infection', icon: 'virus-outline' },
  { label: 'Predator Attack', icon: 'shield-alert-outline' },
  { label: 'Physical Injury', icon: 'bandage' },
  { label: 'Smothering', icon: 'account-group-outline' },
  { label: 'Unknown Cause', icon: 'help-circle-outline' },
];

export default function AddMortality() {
  const { triggerRefresh } = useAppContext();
  const { batchId } = useLocalSearchParams();
  const [batches, setBatches] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    batchId: batchId || '',
    quantity: '',
    reason: 'Heat Stress',
    customReason: '',
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    const batchData = getAllBatches().filter((b) => b.status === 'active');
    setBatches(batchData);
    if (!batchId && batchData.length > 0) {
      setFormData((prev) => ({ ...prev, batchId: batchData[0].id.toString() }));
    }
  }, [batchId]);

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const selectedBatch = batches.find((b) => b.id.toString() === formData.batchId);
  let availableBirds = 0;
  if (selectedBatch) {
    const dead = getMortalityByBatch(selectedBatch.id);
    const sold = getSalesDetailsByBatch(selectedBatch.id)
      .filter((s) => s.saleType === 'per_bird')
      .reduce((sum, s) => sum + s.quantity, 0);
    availableBirds = Math.max(selectedBatch.initialChicks - dead - sold, 0);
  }

  const save = () => {
    if (!formData.batchId || !formData.quantity) {
      Alert.alert('Required Fields', 'Please select a batch and enter the number of bird losses.');
      return;
    }

    const quantity = Number(formData.quantity);
    if (!Number.isInteger(quantity) || quantity <= 0 || !selectedBatch) {
      Alert.alert('Invalid Entry', 'Enter a positive whole number of birds.');
      return;
    }

    if (quantity > availableBirds) {
      Alert.alert(
        'Inventory Limit',
        `Only ${availableBirds} birds are currently recorded in this flock.`
      );
      return;
    }

    setSubmitting(true);
    try {
      const finalReason = formData.reason === 'Other' ? formData.customReason : formData.reason;
      recordMortality({
        batchId: Number(formData.batchId),
        quantity,
        date: formData.date,
        reason: finalReason || 'Not specified',
      });

      triggerRefresh();
      Alert.alert('Loss Recorded', 'Mortality count updated in flock records.', [
        { text: 'Done', onPress: () => router.back() },
      ]);
    } catch (_error) {
      Alert.alert('Error', 'Failed to record mortality.');
    } finally {
      setSubmitting(false);
    }
  };

  const enteredLoss = Number(formData.quantity) || 0;
  const projectedRemaining = Math.max(availableBirds - enteredLoss, 0);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Banner */}
      <GlassCard variant="rose" style={styles.bannerCard} contentStyle={styles.bannerContent}>
        <View style={styles.bannerIconCircle}>
          <MaterialCommunityIcons name="skull-outline" size={26} color={FarmTheme.colors.rose} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.bannerTitle}>Record Bird Mortality</Text>
          <Text style={styles.bannerSubtitle}>
            Log flock losses to monitor biosecurity health, environmental stress, and survival rates.
          </Text>
        </View>
      </GlassCard>

      <GlassCard variant="surface" contentStyle={styles.formCard}>
        {/* Batch Selection */}
        <Text style={styles.label}>Select Flock Batch *</Text>
        {batches.length > 0 ? (
          <View style={styles.pillContainer}>
            {batches.map((b) => {
              const selected = formData.batchId === b.id.toString();
              return (
                <TouchableOpacity
                  key={b.id}
                  style={[styles.batchPill, selected && styles.batchPillSelected]}
                  onPress={() => updateField('batchId', b.id.toString())}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons
                    name="egg-outline"
                    size={16}
                    color={selected ? '#FFFFFF' : FarmTheme.colors.forest}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={[styles.batchPillText, selected && styles.batchPillTextSelected]}>
                    {b.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <Text style={styles.emptyNotice}>No active batches found.</Text>
        )}

        {/* Current Available Birds Glass Strip */}
        {selectedBatch && (
          <View style={styles.availableBox}>
            <Ionicons name="information-circle-outline" size={16} color={FarmTheme.colors.forest} />
            <Text style={styles.availableText}>
              Current live birds in this flock: <Text style={{ fontWeight: '800' }}>{availableBirds}</Text>
            </Text>
          </View>
        )}

        {/* Quantity */}
        <FarmInput
          label="Number of Dead / Culled Birds"
          placeholder="e.g. 3"
          value={formData.quantity}
          onChangeText={(val) => updateField('quantity', val)}
          keyboardType="number-pad"
          suffix="birds"
          iconName="alert-circle-outline"
          containerStyle={{ marginTop: 8 }}
          required
        />

        {/* Common Reasons / Cause Chips */}
        <Text style={[styles.label, { marginTop: 4 }]}>Cause of Loss *</Text>
        <View style={styles.reasonChips}>
          {REASON_OPTIONS.map((item) => {
            const selected = formData.reason === item.label;
            return (
              <TouchableOpacity
                key={item.label}
                style={[styles.reasonChip, selected && styles.reasonChipSelected]}
                onPress={() => updateField('reason', item.label)}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons
                  name={item.icon}
                  size={15}
                  color={selected ? '#FFFFFF' : FarmTheme.colors.rose}
                  style={{ marginRight: 5 }}
                />
                <Text style={[styles.reasonText, selected && styles.reasonTextSelected]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <FarmInput
          label="Date of Loss"
          value={formData.date}
          onChangeText={(val) => updateField('date', val)}
          placeholder="YYYY-MM-DD"
          iconName="calendar-outline"
          containerStyle={{ marginTop: 10 }}
        />

        {/* Impact Live Summary Card */}
        {enteredLoss > 0 && selectedBatch && (
          <GlassCard variant="rose" style={styles.impactCard} contentStyle={styles.impactInner}>
            <View style={styles.impactRow}>
              <View>
                <Text style={styles.impactLabel}>REMAINING LIVE FLOCK</Text>
                <Text style={styles.impactSub}>
                  {availableBirds} minus {enteredLoss} birds
                </Text>
              </View>
              <Text style={styles.impactVal}>{projectedRemaining} birds</Text>
            </View>
          </GlassCard>
        )}

        <FarmButton
          title={submitting ? 'Recording...' : 'Record Loss'}
          variant="danger"
          iconName="checkmark-circle-outline"
          onPress={save}
          loading={submitting}
          style={{ marginTop: 12 }}
        />

        <FarmButton
          title="Cancel"
          variant="glass"
          onPress={() => router.back()}
          style={{ marginTop: 10 }}
        />
      </GlassCard>

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
    marginBottom: 16,
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
    backgroundColor: FarmTheme.colors.rosePale,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  bannerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: FarmTheme.colors.roseDark,
    marginBottom: 2,
  },
  bannerSubtitle: {
    fontSize: 12,
    color: FarmTheme.colors.rose,
    lineHeight: 16,
  },
  formCard: {
    padding: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: FarmTheme.colors.textSecondary,
    marginBottom: 8,
  },
  pillContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  batchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(20, 83, 45, 0.06)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: FarmTheme.radius.full,
    borderWidth: 1,
    borderColor: 'rgba(20, 83, 45, 0.12)',
  },
  batchPillSelected: {
    backgroundColor: FarmTheme.colors.forest,
    borderColor: FarmTheme.colors.forest,
  },
  batchPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: FarmTheme.colors.forest,
  },
  batchPillTextSelected: {
    color: '#FFFFFF',
  },
  emptyNotice: {
    fontSize: 12,
    color: FarmTheme.colors.rose,
    marginBottom: 12,
  },
  availableBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: FarmTheme.colors.emeraldSoft,
    padding: 10,
    borderRadius: FarmTheme.radius.sm,
    gap: 8,
    marginBottom: 12,
  },
  availableText: {
    fontSize: 12,
    color: FarmTheme.colors.forest,
  },
  reasonChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  reasonChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: FarmTheme.radius.full,
  },
  reasonChipSelected: {
    backgroundColor: FarmTheme.colors.rose,
    borderColor: FarmTheme.colors.rose,
  },
  reasonText: {
    fontSize: 12,
    fontWeight: '600',
    color: FarmTheme.colors.roseDark,
  },
  reasonTextSelected: {
    color: '#FFFFFF',
  },
  impactCard: {
    marginVertical: 12,
  },
  impactInner: {
    padding: 14,
  },
  impactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  impactLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: FarmTheme.colors.roseDark,
    letterSpacing: 0.8,
  },
  impactSub: {
    fontSize: 12,
    color: FarmTheme.colors.textMuted,
    marginTop: 2,
  },
  impactVal: {
    fontSize: 20,
    fontWeight: '800',
    color: FarmTheme.colors.forest,
  },
});
