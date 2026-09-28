import { FarmButton, FarmInput, GlassCard } from '@/components/farm-ui';
import { FarmTheme } from '@/constants/theme';
import { useAppContext } from '@/contexts/AppContext';
import { getAllBatches } from '@/database/batchQueries';
import { addFeedExpense } from '@/database/feedQueries';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const FEED_TYPES = [
  { id: 'starter', label: 'Starter Crumbles', icon: 'seed-outline', desc: 'Week 1 - 2' },
  { id: 'grower', label: 'Grower Pellets', icon: 'barley', desc: 'Week 3 - 4' },
  { id: 'finisher', label: 'Finisher Mash', icon: 'corn', desc: 'Week 5 - 6' },
];

export default function AddFeed() {
  const { triggerRefresh } = useAppContext();
  const { batchId } = useLocalSearchParams();
  const [batches, setBatches] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    batchId: batchId || '',
    type: 'starter',
    quantityKg: '',
    pricePerKg: '',
    datePurchased: new Date().toISOString().split('T')[0],
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

  const save = () => {
    if (!formData.batchId || !formData.quantityKg || !formData.pricePerKg) {
      Alert.alert('Required Fields', 'Please select a batch and enter quantity and price.');
      return;
    }

    const quantityKg = Number(formData.quantityKg);
    const pricePerKg = Number(formData.pricePerKg);
    if (quantityKg <= 0 || pricePerKg <= 0) {
      Alert.alert('Invalid Entry', 'Quantity and price must be greater than zero.');
      return;
    }

    setSubmitting(true);
    try {
      addFeedExpense({
        batchId: Number(formData.batchId),
        type: formData.type,
        quantityKg,
        pricePerKg,
        datePurchased: formData.datePurchased,
        receiptPath: null,
      });

      triggerRefresh();
      Alert.alert('Feed Logged', 'Feed expense recorded successfully!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (_error) {
      Alert.alert('Error', 'Failed to record feed purchase.');
    } finally {
      setSubmitting(false);
    }
  };

  const totalCost = (Number(formData.quantityKg) || 0) * (Number(formData.pricePerKg) || 0);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Banner */}
      <GlassCard variant="harvest" style={styles.bannerCard} contentStyle={styles.bannerContent}>
        <View style={styles.bannerIconCircle}>
          <MaterialCommunityIcons name="barley" size={26} color={FarmTheme.colors.goldDark} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.bannerTitle}>Record Feed Purchase</Text>
          <Text style={styles.bannerSubtitle}>
            Log feed rations by stage (Starter, Grower, Finisher) to calculate accurate Feed Conversion Ratio (FCR).
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
                    {b.name} ({b.initialChicks} chicks)
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <Text style={styles.emptyNotice}>No active batches found.</Text>
        )}

        {/* Feed Type Cards */}
        <Text style={[styles.label, { marginTop: 8 }]}>Feed Formulation *</Text>
        <View style={styles.feedTypeGrid}>
          {FEED_TYPES.map((type) => {
            const selected = formData.type === type.id;
            return (
              <TouchableOpacity
                key={type.id}
                style={[styles.feedCard, selected && styles.feedCardSelected]}
                onPress={() => updateField('type', type.id)}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons
                  name={type.icon}
                  size={24}
                  color={selected ? '#FFFFFF' : FarmTheme.colors.amber}
                  style={{ marginBottom: 4 }}
                />
                <Text style={[styles.feedCardTitle, selected && styles.feedCardTitleSelected]}>
                  {type.label}
                </Text>
                <Text style={[styles.feedCardDesc, selected && styles.feedCardDescSelected]}>
                  {type.desc}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Inputs */}
        <View style={styles.row}>
          <FarmInput
            label="Feed Quantity"
            placeholder="e.g. 50"
            value={formData.quantityKg}
            onChangeText={(val) => updateField('quantityKg', val)}
            keyboardType="decimal-pad"
            suffix="kg"
            iconName="speedometer-outline"
            containerStyle={{ flex: 1, marginRight: 8 }}
            required
          />

          <FarmInput
            label="Price per Kg"
            placeholder="e.g. 0.85"
            value={formData.pricePerKg}
            onChangeText={(val) => updateField('pricePerKg', val)}
            keyboardType="decimal-pad"
            suffix="$"
            iconName="pricetag-outline"
            containerStyle={{ flex: 1 }}
            required
          />
        </View>

        <FarmInput
          label="Purchase Date"
          value={formData.datePurchased}
          onChangeText={(val) => updateField('datePurchased', val)}
          placeholder="YYYY-MM-DD"
          iconName="calendar-outline"
        />

        {/* Cost Summary Glass Card */}
        {totalCost > 0 && (
          <GlassCard variant="harvest" style={styles.summaryCard} contentStyle={styles.summaryInner}>
            <View style={styles.summaryRow}>
              <View>
                <Text style={styles.summaryLabel}>TOTAL FEED EXPENSE</Text>
                <Text style={styles.summarySub}>
                  {formData.quantityKg}kg @ ${formData.pricePerKg}/kg
                </Text>
              </View>
              <Text style={styles.summaryValue}>${totalCost.toFixed(2)}</Text>
            </View>
          </GlassCard>
        )}

        <FarmButton
          title={submitting ? 'Recording Feed...' : 'Record Feed Expense'}
          variant="harvest"
          iconName="checkmark-circle-outline"
          onPress={save}
          loading={submitting}
          style={{ marginTop: 10 }}
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
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  bannerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: FarmTheme.colors.goldDark,
    marginBottom: 2,
  },
  bannerSubtitle: {
    fontSize: 12,
    color: FarmTheme.colors.earth,
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
    marginBottom: 14,
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
  feedTypeGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  feedCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: FarmTheme.radius.md,
    borderWidth: 1.2,
    borderColor: 'rgba(245, 158, 11, 0.25)',
    backgroundColor: 'rgba(254, 243, 199, 0.3)',
  },
  feedCardSelected: {
    backgroundColor: FarmTheme.colors.amber,
    borderColor: FarmTheme.colors.amber,
  },
  feedCardTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: FarmTheme.colors.goldDark,
    textAlign: 'center',
  },
  feedCardTitleSelected: {
    color: '#FFFFFF',
  },
  feedCardDesc: {
    fontSize: 9,
    color: FarmTheme.colors.textMuted,
    marginTop: 2,
  },
  feedCardDescSelected: {
    color: 'rgba(255, 255, 255, 0.85)',
  },
  row: {
    flexDirection: 'row',
  },
  summaryCard: {
    marginVertical: 12,
  },
  summaryInner: {
    padding: 14,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: FarmTheme.colors.goldDark,
    letterSpacing: 0.8,
  },
  summarySub: {
    fontSize: 12,
    color: FarmTheme.colors.textSecondary,
    marginTop: 2,
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: '800',
    color: FarmTheme.colors.earthDark,
  },
});
