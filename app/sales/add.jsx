import { FarmButton, FarmInput, GlassCard } from '@/components/farm-ui';
import { FarmTheme } from '@/constants/theme';
import { useAppContext } from '@/contexts/AppContext';
import { getAllBatches, getBatchById } from '@/database/batchQueries';
import { getClients } from '@/database/clientQueries';
import { getMortalityByBatch } from '@/database/mortalityQueries';
import { addSale, getSalesDetailsByBatch } from '@/database/salesQueries';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function AddSale() {
  const { triggerRefresh } = useAppContext();
  const { batchId, clientId } = useLocalSearchParams();
  const [batches, setBatches] = useState([]);
  const [clients, setClients] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    batchId: batchId || '',
    clientId: clientId || '',
    saleType: 'per_bird',
    quantity: '',
    price: '',
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    const batchData = getAllBatches().filter((b) => b.status === 'active');
    const clientData = getClients();
    setBatches(batchData);
    setClients(clientData);

    if (!batchId && batchData.length > 0) {
      setFormData((prev) => ({ ...prev, batchId: batchData[0].id.toString() }));
    }
    if (!clientId && clientData.length > 0) {
      setFormData((prev) => ({ ...prev, clientId: clientData[0].id.toString() }));
    }
  }, [batchId, clientId]);

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const calculateTotal = () => {
    const quantity = Number(formData.quantity) || 0;
    const price = Number(formData.price) || 0;
    return quantity * price;
  };

  const save = () => {
    if (!formData.batchId || !formData.clientId || !formData.quantity || !formData.price) {
      Alert.alert('Required Fields', 'Please select a batch and client, and enter quantity and price.');
      return;
    }

    const quantity = Number(formData.quantity);
    const price = Number(formData.price);
    if (quantity <= 0 || price <= 0) {
      Alert.alert('Invalid Entry', 'Quantity and price must be greater than zero.');
      return;
    }

    const batch = getBatchById(Number(formData.batchId));
    if (!batch || batch.status !== 'active') {
      Alert.alert('Batch Inactive', 'Please select an active flock batch.');
      return;
    }

    if (formData.saleType === 'per_bird') {
      const dead = getMortalityByBatch(batch.id);
      const sold = getSalesDetailsByBatch(batch.id)
        .filter((sale) => sale.saleType === 'per_bird')
        .reduce((sum, sale) => sum + sale.quantity, 0);
      const available = batch.initialChicks - dead - sold;
      if (quantity > available) {
        Alert.alert(
          'Inventory Limit',
          `Only ${Math.max(available, 0)} birds are available for sale from this batch.`
        );
        return;
      }
    }

    setSubmitting(true);
    try {
      const total = calculateTotal();
      addSale({
        batchId: Number(formData.batchId),
        clientId: Number(formData.clientId),
        saleType: formData.saleType,
        quantity,
        price,
        total,
        date: formData.date,
        receiptPath: null,
      });

      triggerRefresh();
      Alert.alert('Sale Recorded', `Successfully recorded $${total.toFixed(2)} sale!`, [
        { text: 'Done', onPress: () => router.back() },
      ]);
    } catch (_error) {
      Alert.alert('Error', 'Failed to record sale transaction.');
    } finally {
      setSubmitting(false);
    }
  };

  const total = calculateTotal();
  const isPerBird = formData.saleType === 'per_bird';

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
          <Ionicons name="cash" size={26} color={FarmTheme.colors.goldDark} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.bannerTitle}>Record Farm Sale</Text>
          <Text style={styles.bannerSubtitle}>
            Log live bird orders or dressed kilogram sales with automated customer receipts.
          </Text>
        </View>
      </GlassCard>

      <GlassCard variant="surface" contentStyle={styles.formCard}>
        {/* Select Batch */}
        <Text style={styles.label}>Select Flock Batch *</Text>
        {batches.length > 0 ? (
          <View style={styles.pillContainer}>
            {batches.map((b) => {
              const selected = formData.batchId === b.id.toString();
              return (
                <TouchableOpacity
                  key={b.id}
                  style={[styles.choicePill, selected && styles.choicePillSelected]}
                  onPress={() => updateField('batchId', b.id.toString())}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons
                    name="egg-outline"
                    size={16}
                    color={selected ? '#FFFFFF' : FarmTheme.colors.forest}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={[styles.choicePillText, selected && styles.choicePillTextSelected]}>
                    {b.name} ({b.initialChicks} chicks)
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <Text style={styles.emptyNotice}>No active batches found. Please add a batch first.</Text>
        )}

        {/* Client Selection */}
        <View style={styles.clientLabelRow}>
          <Text style={styles.label}>Buyer Client *</Text>
          <TouchableOpacity onPress={() => router.push('/clients')}>
            <Text style={styles.newClientLink}>+ New Client</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={formData.clientId}
            onValueChange={(val) => updateField('clientId', val)}
            style={styles.picker}
          >
            <Picker.Item label="Select Client..." value="" color={FarmTheme.colors.textMuted} />
            {clients.map((c) => (
              <Picker.Item
                key={c.id}
                label={`${c.name}${c.phone ? ` (${c.phone})` : ''}`}
                value={c.id.toString()}
              />
            ))}
          </Picker>
        </View>

        {/* Sale Type Pills */}
        <Text style={[styles.label, { marginTop: 14 }]}>Pricing Model *</Text>
        <View style={styles.typeSelector}>
          <TouchableOpacity
            style={[styles.typeOption, isPerBird && styles.typeOptionSelected]}
            onPress={() => updateField('saleType', 'per_bird')}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name="feather"
              size={18}
              color={isPerBird ? '#FFFFFF' : FarmTheme.colors.forest}
            />
            <Text style={[styles.typeText, isPerBird && styles.typeTextSelected]}>
              Per Bird (Live)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.typeOption, !isPerBird && styles.typeOptionSelected]}
            onPress={() => updateField('saleType', 'per_kg')}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name="scale"
              size={18}
              color={!isPerBird ? '#FFFFFF' : FarmTheme.colors.forest}
            />
            <Text style={[styles.typeText, !isPerBird && styles.typeTextSelected]}>
              Per Kilogram (Kg)
            </Text>
          </TouchableOpacity>
        </View>

        {/* Quantity & Unit Price */}
        <View style={styles.row}>
          <FarmInput
            label={`Quantity (${isPerBird ? 'Birds' : 'Kg'})`}
            placeholder={isPerBird ? 'e.g. 20' : 'e.g. 35.5'}
            value={formData.quantity}
            onChangeText={(val) => updateField('quantity', val)}
            keyboardType="decimal-pad"
            suffix={isPerBird ? 'birds' : 'kg'}
            containerStyle={{ flex: 1, marginRight: 8 }}
            required
          />

          <FarmInput
            label={`Price per ${isPerBird ? 'Bird' : 'Kg'}`}
            placeholder={isPerBird ? '8.00' : '5.50'}
            value={formData.price}
            onChangeText={(val) => updateField('price', val)}
            keyboardType="decimal-pad"
            suffix="$"
            containerStyle={{ flex: 1 }}
            required
          />
        </View>

        <FarmInput
          label="Sale Date"
          value={formData.date}
          onChangeText={(val) => updateField('date', val)}
          placeholder="YYYY-MM-DD"
          iconName="calendar-outline"
        />

        {/* Live Total Glass Card */}
        {total > 0 && (
          <GlassCard variant="emerald" style={styles.totalCard} contentStyle={styles.totalInner}>
            <View style={styles.totalRow}>
              <View>
                <Text style={styles.totalLabel}>SALE TOTAL</Text>
                <Text style={styles.totalSub}>
                  {formData.quantity} {isPerBird ? 'birds' : 'kg'} × ${formData.price}
                </Text>
              </View>
              <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
            </View>
          </GlassCard>
        )}

        <FarmButton
          title={submitting ? 'Recording Sale...' : 'Confirm Sale'}
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
  choicePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(20, 83, 45, 0.06)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: FarmTheme.radius.full,
    borderWidth: 1,
    borderColor: 'rgba(20, 83, 45, 0.12)',
  },
  choicePillSelected: {
    backgroundColor: FarmTheme.colors.forest,
    borderColor: FarmTheme.colors.forest,
  },
  choicePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: FarmTheme.colors.forest,
  },
  choicePillTextSelected: {
    color: '#FFFFFF',
  },
  emptyNotice: {
    fontSize: 12,
    color: FarmTheme.colors.rose,
    marginBottom: 12,
  },
  clientLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  newClientLink: {
    fontSize: 12,
    fontWeight: '700',
    color: FarmTheme.colors.forestMedium,
  },
  pickerContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1.2,
    borderColor: 'rgba(20, 83, 45, 0.16)',
    borderRadius: FarmTheme.radius.md,
    overflow: 'hidden',
    marginBottom: 12,
  },
  picker: {
    height: 48,
    color: FarmTheme.colors.textPrimary,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  typeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(20, 83, 45, 0.05)',
    borderWidth: 1.2,
    borderColor: 'rgba(20, 83, 45, 0.15)',
    borderRadius: FarmTheme.radius.md,
    paddingVertical: 12,
  },
  typeOptionSelected: {
    backgroundColor: FarmTheme.colors.forest,
    borderColor: FarmTheme.colors.forest,
  },
  typeText: {
    fontSize: 13,
    fontWeight: '700',
    color: FarmTheme.colors.forest,
  },
  typeTextSelected: {
    color: '#FFFFFF',
  },
  row: {
    flexDirection: 'row',
  },
  totalCard: {
    marginVertical: 12,
  },
  totalInner: {
    padding: 14,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: FarmTheme.colors.forest,
    letterSpacing: 0.8,
  },
  totalSub: {
    fontSize: 12,
    color: FarmTheme.colors.textSecondary,
    marginTop: 2,
  },
  totalValue: {
    fontSize: 24,
    fontWeight: '800',
    color: FarmTheme.colors.forestDeep,
  },
});