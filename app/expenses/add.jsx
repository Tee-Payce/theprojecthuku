import { FarmButton, FarmInput, GlassCard } from '@/components/farm-ui';
import { FarmTheme } from '@/constants/theme';
import { useAppContext } from '@/contexts/AppContext';
import { getAllBatches } from '@/database/batchQueries';
import { addExpense } from '@/database/expenseQueries';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const EXPENSE_CATEGORIES = [
  { name: 'Heating Coal', icon: 'fire' },
  { name: 'Stress Pack', icon: 'pill' },
  { name: 'Vaccines', icon: 'needle' },
  { name: 'Antibiotics', icon: 'flask-outline' },
  { name: 'Vitamins', icon: 'fruit-citrus' },
  { name: 'Disinfectant', icon: 'spray-bottle' },
  { name: 'Equipment', icon: 'wrench' },
  { name: 'Labor', icon: 'account-hard-hat' },
  { name: 'Transport', icon: 'truck-fast-outline' },
  { name: 'Other', icon: 'note-text-outline' },
];

export default function AddExpenseScreen() {
  const { batchId } = useLocalSearchParams();
  const { triggerRefresh } = useAppContext();

  const [selectedCategory, setSelectedCategory] = useState('Vaccines');
  const [customItem, setCustomItem] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedBatchId, setSelectedBatchId] = useState(batchId || '');
  const [batches, setBatches] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const batchData = getAllBatches();
    setBatches(batchData);
    if (!batchId && batchData.length > 0) {
      setSelectedBatchId(batchData[0].id.toString());
    }
  }, [batchId]);

  const handleSubmit = () => {
    const itemName = selectedCategory === 'Other' ? customItem.trim() : selectedCategory;
    const parsedAmount = Number(amount);

    if (!itemName || !amount || !selectedBatchId) {
      Alert.alert('Required Fields', 'Please select a batch, category, and enter amount.');
      return;
    }

    if (parsedAmount <= 0) {
      Alert.alert('Invalid Amount', 'Expense amount must be greater than zero.');
      return;
    }

    setSubmitting(true);
    try {
      const expenseId = addExpense(
        parseInt(selectedBatchId),
        itemName,
        selectedCategory,
        parsedAmount,
        new Date().toISOString().split('T')[0],
        notes
      );

      if (expenseId) {
        triggerRefresh();
        Alert.alert('Expense Added', `${itemName} ($${parsedAmount.toFixed(2)}) recorded!`, [
          { text: 'Done', onPress: () => router.back() },
        ]);
      } else {
        Alert.alert('Error', 'Failed to add expense.');
      }
    } catch (_error) {
      Alert.alert('Error', 'Failed to add expense.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Banner */}
      <GlassCard variant="forest" style={styles.bannerCard} contentStyle={styles.bannerContent}>
        <View style={styles.bannerIconCircle}>
          <MaterialCommunityIcons name="receipt-outline" size={26} color={FarmTheme.colors.emeraldLight} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.bannerTitle}>Record Farm Expense</Text>
          <Text style={styles.bannerSubtitle}>
            Log veterinary medications, brooder heating coal, bedding shavings, and operational labor.
          </Text>
        </View>
      </GlassCard>

      <GlassCard variant="surface" contentStyle={styles.formCard}>
        {/* Select Batch */}
        <Text style={styles.label}>Select Flock Batch *</Text>
        {batches.length > 0 ? (
          <View style={styles.pillContainer}>
            {batches.map((b) => {
              const selected = selectedBatchId === b.id.toString();
              return (
                <TouchableOpacity
                  key={b.id}
                  style={[styles.batchPill, selected && styles.batchPillSelected]}
                  onPress={() => setSelectedBatchId(b.id.toString())}
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
          <Text style={styles.emptyNotice}>No batches found. Please add a batch first.</Text>
        )}

        {/* Category Grid */}
        <Text style={[styles.label, { marginTop: 8 }]}>Expense Category *</Text>
        <View style={styles.catGrid}>
          {EXPENSE_CATEGORIES.map((cat) => {
            const selected = selectedCategory === cat.name;
            return (
              <TouchableOpacity
                key={cat.name}
                style={[styles.catCard, selected && styles.catCardSelected]}
                onPress={() => setSelectedCategory(cat.name)}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons
                  name={cat.icon}
                  size={20}
                  color={selected ? '#FFFFFF' : FarmTheme.colors.forest}
                />
                <Text style={[styles.catText, selected && styles.catTextSelected]}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {selectedCategory === 'Other' && (
          <FarmInput
            label="Specific Item Description"
            placeholder="e.g. Pine wood shavings"
            value={customItem}
            onChangeText={setCustomItem}
            iconName="pencil-outline"
            required
          />
        )}

        <FarmInput
          label="Expense Amount"
          placeholder="e.g. 45.00"
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          suffix="$"
          iconName="cash-outline"
          required
        />

        <FarmInput
          label="Optional Notes / Supplier"
          placeholder="e.g. Bought from AgriVet Supplies"
          value={notes}
          onChangeText={setNotes}
          iconName="document-text-outline"
        />

        <FarmButton
          title={submitting ? 'Recording Expense...' : 'Record Expense'}
          variant="primary"
          iconName="checkmark-circle-outline"
          onPress={handleSubmit}
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
  catGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  catCard: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(20, 83, 45, 0.04)',
    borderWidth: 1.2,
    borderColor: 'rgba(20, 83, 45, 0.12)',
    borderRadius: FarmTheme.radius.md,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  catCardSelected: {
    backgroundColor: FarmTheme.colors.forest,
    borderColor: FarmTheme.colors.forest,
  },
  catText: {
    fontSize: 12,
    fontWeight: '700',
    color: FarmTheme.colors.textPrimary,
    flex: 1,
  },
  catTextSelected: {
    color: '#FFFFFF',
  },
});