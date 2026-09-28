import {
  Badge,
  GlassCard,
  ProgressBar,
  QuickActionTile,
  StatCard,
} from '@/components/farm-ui';
import { FarmTheme } from '@/constants/theme';
import { getBatchById } from '@/database/batchQueries';
import { getTotalExpensesByBatch } from '@/database/expenseQueries';
import { getFeedByBatch } from '@/database/feedQueries';
import { getMortalityByBatch } from '@/database/mortalityQueries';
import { getBatchProgress } from '@/database/progressUtils';
import { getSalesByBatch, getSalesDetailsByBatch } from '@/database/salesQueries';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export default function BatchDetail() {
  const { id } = useLocalSearchParams();
  const [batch, setBatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    revenue: 0,
    feedCost: 0,
    expenseCost: 0,
    mortality: 0,
    progress: {},
    sales: [],
    feedExpenses: [],
  });

  const loadBatchData = useCallback(() => {
    if (!id) return;
    const batchId = Number(id);
    const batchData = getBatchById(batchId);
    if (!batchData) {
      setLoading(false);
      return;
    }

    const revenue = getSalesByBatch(batchId);
    const sales = getSalesDetailsByBatch(batchId);
    const feedExpenses = getFeedByBatch(batchId);
    const mortality = getMortalityByBatch(batchId);
    const progress = getBatchProgress(batchData.startDate);
    const expenseCost = getTotalExpensesByBatch(batchId);

    const feedCost = feedExpenses.reduce(
      (sum, feed) => sum + feed.quantityKg * feed.pricePerKg,
      0
    );
    const chickCost = batchData.initialChicks * batchData.chickPrice;
    const totalCost = chickCost + feedCost + expenseCost;
    const profit = revenue - totalCost;
    const surviving = Math.max(batchData.initialChicks - mortality, 0);

    setBatch({ ...batchData, chickCost, totalCost, profit, surviving });
    setStats({
      revenue,
      feedCost,
      expenseCost,
      mortality,
      progress,
      sales,
      feedExpenses,
    });
    setLoading(false);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      loadBatchData();
    }, [loadBatchData])
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={FarmTheme.colors.forest} />
        <Text style={styles.loadingText}>Loading flock details...</Text>
      </View>
    );
  }

  if (!batch) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Batch not found.</Text>
      </View>
    );
  }

  const isCompleted = batch.status === 'completed' || stats.progress?.completed;
  const mortalityRate = batch.initialChicks > 0
    ? ((stats.mortality / batch.initialChicks) * 100).toFixed(1)
    : '0.0';

  const expectedRevenueLive = batch.surviving * batch.expectedPricePerBird;
  const expectedTotalCosts = batch.chickCost + stats.feedCost;
  const expectedProfit = expectedRevenueLive - expectedTotalCosts;
  const revenueVariance = stats.revenue - expectedRevenueLive;
  const costVariance = batch.totalCost - expectedTotalCosts;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero Card for Batch Details */}
      <GlassCard variant="forest" style={styles.heroCard} contentStyle={styles.heroContent}>
        <View style={styles.heroHeaderRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.batchSubhead}>BATCH OVERVIEW</Text>
            <Text style={styles.batchTitle}>{batch.name}</Text>
            <Text style={styles.batchDates}>Started {batch.startDate}</Text>
          </View>
          <Badge
            label={isCompleted ? 'Completed' : `Week ${stats.progress?.week || 1}`}
            variant={isCompleted ? 'completed' : 'active'}
          />
        </View>

        {/* Progress Bar */}
        <View style={styles.progressBox}>
          <View style={styles.progressRow}>
            <Text style={styles.progressCaption}>
              Growth Cycle ({stats.progress?.week || 1} / 6 weeks)
            </Text>
            <Text style={styles.progressValue}>
              {stats.progress?.percentage || 0}% Complete
            </Text>
          </View>
          <ProgressBar progress={stats.progress?.percentage || 0} height={8} />
        </View>
      </GlassCard>

      {/* 4 Key Stat Cards in 2x2 Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statsRow}>
          <StatCard
            title="SURVIVING BIRDS"
            value={`${batch.surviving}`}
            subtitle={`of ${batch.initialChicks} chicks`}
            mciName="feather"
            variant="emerald"
          />
          <StatCard
            title="GROSS REVENUE"
            value={`$${stats.revenue.toFixed(2)}`}
            subtitle={`${stats.sales.length} sales logged`}
            iconName="cash-outline"
            variant="harvest"
          />
        </View>

        <View style={styles.statsRow}>
          <StatCard
            title="TOTAL COSTS"
            value={`$${batch.totalCost.toFixed(2)}`}
            subtitle={`Chicks $${batch.chickCost.toFixed(0)} • Feed $${stats.feedCost.toFixed(0)}`}
            mciName="currency-usd-off"
            variant="rose"
          />
          <StatCard
            title="NET PROFIT"
            value={`$${batch.profit.toFixed(2)}`}
            subtitle={batch.profit >= 0 ? 'Surplus' : 'Deficit'}
            iconName="trending-up-outline"
            variant={batch.profit >= 0 ? 'default' : 'rose'}
            valueStyle={{
              color: batch.profit >= 0 ? FarmTheme.colors.forest : FarmTheme.colors.rose,
            }}
          />
        </View>
      </View>

      {/* Mortality Alert if any deaths */}
      {stats.mortality > 0 && (
        <GlassCard variant="rose" style={styles.alertCard} contentStyle={styles.alertContent}>
          <View style={styles.alertIconWrapper}>
            <Ionicons name="warning" size={20} color={FarmTheme.colors.rose} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.alertTitle}>Mortality Record</Text>
            <Text style={styles.alertSubtitle}>
              {stats.mortality} birds lost ({mortalityRate}% mortality rate)
            </Text>
          </View>
        </GlassCard>
      )}

      {/* Quick Action Matrix for this Batch */}
      <Text style={styles.sectionHeading}>Batch Actions</Text>
      <View style={styles.actionsGrid}>
        <QuickActionTile
          title="Record Sale"
          subtitle="Add buyer"
          iconName="cash"
          gradientColors={['#B45309', '#D97706']}
          onPress={() => router.push(`/sales/add?batchId=${id}`)}
          style={styles.actionItem}
        />
        <QuickActionTile
          title="Add Feed"
          subtitle="Bags & cost"
          mciName="barley"
          gradientColors={['#CA8A04', '#EAB308']}
          onPress={() => router.push(`/feed/add?batchId=${id}`)}
          style={styles.actionItem}
        />
        <QuickActionTile
          title="Record Loss"
          subtitle="Mortality"
          mciName="skull-outline"
          gradientColors={['#B91C1C', '#EF4444']}
          onPress={() => router.push(`/mortality/add?batchId=${id}`)}
          style={styles.actionItem}
        />
        <QuickActionTile
          title="Add Expense"
          subtitle="Vaccines/Meds"
          mciName="receipt-outline"
          gradientColors={['#6D28D9', '#8B5CF6']}
          onPress={() => router.push(`/expenses/add?batchId=${id}`)}
          style={styles.actionItem}
        />
      </View>

      {/* Financial Performance Analysis Card */}
      <Text style={styles.sectionHeading}>Financial Analysis</Text>
      <GlassCard variant="surface" style={styles.analysisCard} contentStyle={styles.analysisContent}>
        <View style={styles.tableRow}>
          <Text style={styles.tableKey}>Target Revenue (Live birds):</Text>
          <Text style={styles.tableVal}>${expectedRevenueLive.toFixed(2)}</Text>
        </View>

        <View style={styles.tableRow}>
          <Text style={styles.tableKey}>Actual Revenue Realized:</Text>
          <Text style={[styles.tableVal, { color: FarmTheme.colors.forestMedium }]}>
            ${stats.revenue.toFixed(2)}
          </Text>
        </View>

        <View style={styles.tableRow}>
          <Text style={styles.tableKey}>Estimated Budget (Chicks + Feed):</Text>
          <Text style={styles.tableVal}>${expectedTotalCosts.toFixed(2)}</Text>
        </View>

        <View style={styles.tableRow}>
          <Text style={styles.tableKey}>Actual Total Cost (Inc. Expenses):</Text>
          <Text style={[styles.tableVal, { color: FarmTheme.colors.rose }]}>
            ${batch.totalCost.toFixed(2)}
          </Text>
        </View>

        <View style={styles.tableDivider} />

        <View style={styles.tableRow}>
          <Text style={styles.tableKeyBold}>Revenue Variance:</Text>
          <Text
            style={[
              styles.tableValBold,
              { color: revenueVariance >= 0 ? FarmTheme.colors.forest : FarmTheme.colors.rose },
            ]}
          >
            {revenueVariance >= 0 ? '+' : ''}${revenueVariance.toFixed(2)}
          </Text>
        </View>

        <View style={styles.tableRow}>
          <Text style={styles.tableKeyBold}>Cost Variance:</Text>
          <Text
            style={[
              styles.tableValBold,
              { color: costVariance <= 0 ? FarmTheme.colors.forest : FarmTheme.colors.rose },
            ]}
          >
            {costVariance <= 0 ? '-' : '+'}${Math.abs(costVariance).toFixed(2)}
          </Text>
        </View>

        <View style={styles.tableDivider} />

        <View style={styles.tableRow}>
          <Text style={styles.tableKeyBold}>Projected Net Profit:</Text>
          <Text style={styles.tableValBold}>${expectedProfit.toFixed(2)}</Text>
        </View>

        <View style={styles.tableRow}>
          <Text style={[styles.tableKeyBold, { color: FarmTheme.colors.forest }]}>
            Current Net Profit:
          </Text>
          <Text
            style={[
              styles.tableValBold,
              {
                color: batch.profit >= 0 ? FarmTheme.colors.forest : FarmTheme.colors.rose,
                fontSize: 16,
              },
            ]}
          >
            ${batch.profit.toFixed(2)}
          </Text>
        </View>
      </GlassCard>

      {/* Recent Sales for this Batch */}
      {stats.sales.length > 0 && (
        <View style={styles.listSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeading}>Batch Sales Log</Text>
            <Badge label={`${stats.sales.length} orders`} variant="active" size="sm" />
          </View>
          <GlassCard variant="surface" contentStyle={{ padding: 12 }}>
            {stats.sales.map((sale, index) => (
              <View
                key={sale.id || index}
                style={[
                  styles.logItemRow,
                  index < stats.sales.length - 1 && styles.logBorderBottom,
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.logPrimaryText}>
                    {sale.quantity} {sale.saleType === 'per_bird' ? 'birds' : 'kg'}
                  </Text>
                  <Text style={styles.logSubText}>{sale.date}</Text>
                </View>
                <Text style={styles.logAmountGreen}>
                  +${Number(sale.total).toFixed(2)}
                </Text>
              </View>
            ))}
          </GlassCard>
        </View>
      )}

      {/* Feed Expenses for this Batch */}
      {stats.feedExpenses.length > 0 && (
        <View style={styles.listSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeading}>Feed Purchases</Text>
            <Badge label={`${stats.feedExpenses.length} batches`} variant="warning" size="sm" />
          </View>
          <GlassCard variant="surface" contentStyle={{ padding: 12 }}>
            {stats.feedExpenses.map((feed, index) => (
              <View
                key={feed.id || index}
                style={[
                  styles.logItemRow,
                  index < stats.feedExpenses.length - 1 && styles.logBorderBottom,
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.logPrimaryText}>
                    {feed.quantityKg}kg {feed.type} feed
                  </Text>
                  <Text style={styles.logSubText}>{feed.datePurchased}</Text>
                </View>
                <Text style={styles.logAmountRed}>
                  -${(feed.quantityKg * feed.pricePerKg).toFixed(2)}
                </Text>
              </View>
            ))}
          </GlassCard>
        </View>
      )}

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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: FarmTheme.colors.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: FarmTheme.colors.textMuted,
  },
  errorText: {
    fontSize: 16,
    color: FarmTheme.colors.rose,
    fontWeight: '700',
  },
  heroCard: {
    marginBottom: 16,
  },
  heroContent: {
    padding: 18,
  },
  heroHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  batchSubhead: {
    fontSize: 10,
    fontWeight: '800',
    color: FarmTheme.colors.emeraldLight,
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  batchTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  batchDates: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
  },
  progressBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: FarmTheme.radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressCaption: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
  },
  progressValue: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '800',
  },
  statsGrid: {
    gap: 12,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  alertCard: {
    marginBottom: 16,
  },
  alertContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  alertIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: FarmTheme.colors.rosePale,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: FarmTheme.colors.roseDark,
  },
  alertSubtitle: {
    fontSize: 12,
    color: FarmTheme.colors.rose,
    marginTop: 1,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: FarmTheme.colors.textPrimary,
    marginBottom: 10,
    marginTop: 8,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  actionItem: {
    width: '48%',
    flexGrow: 1,
  },
  analysisCard: {
    marginBottom: 16,
  },
  analysisContent: {
    padding: 16,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
  },
  tableKey: {
    fontSize: 13,
    color: FarmTheme.colors.textSecondary,
  },
  tableVal: {
    fontSize: 13,
    fontWeight: '700',
    color: FarmTheme.colors.textPrimary,
  },
  tableKeyBold: {
    fontSize: 13,
    fontWeight: '700',
    color: FarmTheme.colors.textPrimary,
  },
  tableValBold: {
    fontSize: 13,
    fontWeight: '800',
  },
  tableDivider: {
    height: 1,
    backgroundColor: 'rgba(20, 83, 45, 0.08)',
    marginVertical: 6,
  },
  listSection: {
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  logItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  logBorderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(20, 83, 45, 0.06)',
  },
  logPrimaryText: {
    fontSize: 14,
    fontWeight: '700',
    color: FarmTheme.colors.textPrimary,
    textTransform: 'capitalize',
  },
  logSubText: {
    fontSize: 11,
    color: FarmTheme.colors.textMuted,
    marginTop: 2,
  },
  logAmountGreen: {
    fontSize: 15,
    fontWeight: '800',
    color: FarmTheme.colors.forest,
  },
  logAmountRed: {
    fontSize: 15,
    fontWeight: '800',
    color: FarmTheme.colors.rose,
  },
});