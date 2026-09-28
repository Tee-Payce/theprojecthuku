import { FarmButton, FarmInput, GlassCard } from '@/components/farm-ui';
import { FarmTheme } from '@/constants/theme';
import { useAppContext } from '@/contexts/AppContext';
import { createBatch } from '@/database/batchQueries';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function AddBatch() {
  const { triggerRefresh } = useAppContext();
  const [name, setName] = useState('');
  const [initialChicks, setInitialChicks] = useState('');
  const [chickPrice, setChickPrice] = useState('');
  const [expectedPricePerBird, setExpectedPricePerBird] = useState('');
  const [expectedPricePerKg, setExpectedPricePerKg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const save = useCallback(() => {
    if (!name.trim() || !initialChicks || !chickPrice) {
      Alert.alert('Required Fields', 'Please fill in flock name, chick quantity, and unit price.');
      return;
    }

    const chickCount = Number(initialChicks);
    const pricePerChick = Number(chickPrice);
    if (!Number.isInteger(chickCount) || chickCount <= 0 || pricePerChick <= 0) {
      Alert.alert('Invalid Entry', 'Enter a positive whole number of chicks and a valid chick price.');
      return;
    }

    setSubmitting(true);
    try {
      createBatch({
        name: name.trim(),
        startDate: new Date().toISOString().split('T')[0],
        initialChicks: chickCount,
        chickPrice: pricePerChick,
        expectedPricePerBird: Number(expectedPricePerBird) || 8,
        expectedPricePerKg: Number(expectedPricePerKg) || 5,
      });

      triggerRefresh();
      Alert.alert('Flock Created', `Batch "${name.trim()}" successfully registered!`, [
        { text: 'View Batches', onPress: () => router.back() },
      ]);
    } catch (_error) {
      Alert.alert('Error', 'Failed to create batch. Please check your data.');
    } finally {
      setSubmitting(false);
    }
  }, [name, initialChicks, chickPrice, expectedPricePerBird, expectedPricePerKg, triggerRefresh]);

  const chicksNum = Number(initialChicks) || 0;
  const priceNum = Number(chickPrice) || 0;
  const totalCost = chicksNum * priceNum;
  const expPriceBird = Number(expectedPricePerBird) || 8;
  const expPriceKg = Number(expectedPricePerKg) || 5;
  const expectedRevenueBird = chicksNum * expPriceBird;
  const expectedRevenueKg = chicksNum * 2.5 * expPriceKg;
  const expectedProfit = expectedRevenueBird - totalCost;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Banner Card */}
      <GlassCard variant="forest" style={styles.bannerCard} contentStyle={styles.bannerContent}>
        <View style={styles.bannerIconCircle}>
          <Ionicons name="egg-outline" size={26} color={FarmTheme.colors.emeraldLight} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.bannerTitle}>Register New Flock</Text>
          <Text style={styles.bannerSubtitle}>
            Track chicks from day-old through harvest week with automated 6-week growth milestones.
          </Text>
        </View>
      </GlassCard>

      {/* Main Glass Form */}
      <GlassCard variant="surface" contentStyle={styles.formContent}>
        <FarmInput
          label="Batch Name"
          placeholder="e.g. Broiler Batch March 2024"
          value={name}
          onChangeText={setName}
          iconName="bookmark-outline"
          required
        />

        <View style={styles.formRow}>
          <FarmInput
            label="Chicks Count"
            placeholder="e.g. 500"
            value={initialChicks}
            onChangeText={setInitialChicks}
            keyboardType="number-pad"
            iconName="people-outline"
            suffix="birds"
            containerStyle={{ flex: 1, marginRight: 8 }}
            required
          />

          <FarmInput
            label="Cost per Chick"
            placeholder="e.g. 1.25"
            value={chickPrice}
            onChangeText={setChickPrice}
            keyboardType="decimal-pad"
            iconName="pricetag-outline"
            suffix="$"
            containerStyle={{ flex: 1 }}
            required
          />
        </View>

        <View style={styles.formRow}>
          <FarmInput
            label="Target Price / Bird"
            placeholder="8.00"
            value={expectedPricePerBird}
            onChangeText={setExpectedPricePerBird}
            keyboardType="decimal-pad"
            suffix="$"
            containerStyle={{ flex: 1, marginRight: 8 }}
            helperText="Live mature bird target"
          />

          <FarmInput
            label="Target Price / Kg"
            placeholder="5.00"
            value={expectedPricePerKg}
            onChangeText={setExpectedPricePerKg}
            keyboardType="decimal-pad"
            suffix="$"
            containerStyle={{ flex: 1 }}
            helperText="Dressed carcass target"
          />
        </View>

        {/* Live Projection Glass Card */}
        {totalCost > 0 && (
          <GlassCard variant="harvest" style={styles.summaryCard} contentStyle={styles.summaryInner}>
            <View style={styles.summaryHeader}>
              <Ionicons name="calculator-outline" size={18} color={FarmTheme.colors.goldDark} />
              <Text style={styles.summaryTitle}>Live Investment & Target Forecast</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Initial Flock Cost:</Text>
              <Text style={styles.summaryVal}>${totalCost.toFixed(2)}</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Expected Live Revenue (@${expPriceBird}):</Text>
              <Text style={[styles.summaryVal, { color: FarmTheme.colors.forest }]}>
                ${expectedRevenueBird.toFixed(2)}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Expected Carcass Revenue (@${expPriceKg}/kg):</Text>
              <Text style={[styles.summaryVal, { color: FarmTheme.colors.forest }]}>
                ${expectedRevenueKg.toFixed(2)}
              </Text>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryRow}>
              <Text style={styles.summaryBoldLabel}>Projected Gross Margin:</Text>
              <Text
                style={[
                  styles.summaryBoldVal,
                  {
                    color: expectedProfit >= 0 ? FarmTheme.colors.forest : FarmTheme.colors.rose,
                  },
                ]}
              >
                ${expectedProfit.toFixed(2)}
              </Text>
            </View>
          </GlassCard>
        )}

        <FarmButton
          title={submitting ? 'Creating Batch...' : 'Create Batch'}
          variant="primary"
          iconName="checkmark-circle-outline"
          onPress={save}
          loading={submitting}
          style={{ marginTop: 8 }}
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
  formContent: {
    padding: 18,
  },
  formRow: {
    flexDirection: 'row',
  },
  summaryCard: {
    marginVertical: 14,
  },
  summaryInner: {
    padding: 14,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  summaryTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: FarmTheme.colors.goldDark,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  summaryLabel: {
    fontSize: 12,
    color: FarmTheme.colors.textSecondary,
  },
  summaryVal: {
    fontSize: 12,
    fontWeight: '700',
    color: FarmTheme.colors.textPrimary,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: 'rgba(180, 83, 9, 0.15)',
    marginVertical: 6,
  },
  summaryBoldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: FarmTheme.colors.textPrimary,
  },
  summaryBoldVal: {
    fontSize: 14,
    fontWeight: '800',
  },
});
