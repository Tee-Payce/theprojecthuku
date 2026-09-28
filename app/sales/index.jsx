import { Badge, FarmButton, GlassCard } from '@/components/farm-ui';
import { FarmTheme } from '@/constants/theme';
import { getSalesWithClientInfo, getTotalRevenue } from '@/database/salesQueries';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

export default function Sales() {
  const [sales, setSales] = useState([]);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalSales: 0,
    avgSaleValue: 0,
  });

  const loadSales = useCallback(() => {
    const salesData = getSalesWithClientInfo();
    const totalRevenue = getTotalRevenue();
    const avgSaleValue = salesData.length > 0 ? totalRevenue / salesData.length : 0;

    setSales(salesData);
    setStats({
      totalRevenue,
      totalSales: salesData.length,
      avgSaleValue,
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSales();
    }, [loadSales])
  );

  const renderSaleItem = ({ item }) => {
    const isPerBird = item.saleType === 'per_bird';

    return (
      <View style={styles.cardWrapper}>
        <GlassCard variant="surface" contentStyle={styles.cardInner}>
          <View style={styles.cardTopRow}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.clientName}>{item.clientName || 'Walk-in Client'}</Text>
              <View style={styles.clientInfoRow}>
                {item.clientPhone ? (
                  <View style={styles.phoneChip}>
                    <Ionicons name="call-outline" size={11} color={FarmTheme.colors.forest} style={{ marginRight: 3 }} />
                    <Text style={styles.phoneText}>{item.clientPhone}</Text>
                  </View>
                ) : null}
                <Text style={styles.dateText}>{item.date}</Text>
              </View>
            </View>

            <View style={styles.amountCol}>
              <Text style={styles.totalAmount}>+${Number(item.total).toFixed(2)}</Text>
              <Badge
                label={isPerBird ? 'Live Birds' : 'By Weight'}
                variant={isPerBird ? 'active' : 'info'}
                size="sm"
              />
            </View>
          </View>

          <View style={styles.detailsRow}>
            <View style={styles.unitChip}>
              <MaterialCommunityIcons
                name={isPerBird ? 'feather' : 'scale'}
                size={14}
                color={FarmTheme.colors.forest}
                style={{ marginRight: 4 }}
              />
              <Text style={styles.unitText}>
                {item.quantity} {isPerBird ? 'birds' : 'kg'} @ ${item.price}/{isPerBird ? 'bird' : 'kg'}
              </Text>
            </View>
          </View>
        </GlassCard>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Sales Summary Glass Banner */}
      <View style={styles.headerSection}>
        <GlassCard variant="harvest" style={styles.summaryCard} contentStyle={styles.summaryInner}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>GROSS SALES</Text>
            <Text style={styles.summaryMainValue}>${stats.totalRevenue.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>ORDERS</Text>
            <Text style={styles.summaryVal}>{stats.totalSales}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>AVG ORDER</Text>
            <Text style={styles.summaryVal}>${stats.avgSaleValue.toFixed(2)}</Text>
          </View>
        </GlassCard>

        <View style={styles.actionRow}>
          <Text style={styles.headingTitle}>Recent Sales Receipts</Text>
          <FarmButton
            title="Record Sale"
            variant="harvest"
            size="sm"
            iconName="add"
            onPress={() => router.push('/sales/add')}
          />
        </View>
      </View>

      <FlatList
        data={sales}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderSaleItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <MaterialCommunityIcons name="cash-multiple" size={36} color={FarmTheme.colors.amber} />
            </View>
            <Text style={styles.emptyTitle}>No Sales Recorded</Text>
            <Text style={styles.emptySubtitle}>
              Log bird sales, wholesale chicken orders, and client payments to track revenue.
            </Text>
            <FarmButton
              title="Record First Sale"
              variant="harvest"
              iconName="cash-outline"
              onPress={() => router.push('/sales/add')}
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
  headerSection: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
  },
  summaryCard: {
    marginBottom: 12,
  },
  summaryInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: FarmTheme.colors.goldDark,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  summaryMainValue: {
    fontSize: 19,
    fontWeight: '800',
    color: FarmTheme.colors.goldDark,
  },
  summaryVal: {
    fontSize: 16,
    fontWeight: '800',
    color: FarmTheme.colors.textPrimary,
  },
  summaryDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(180, 83, 9, 0.2)',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  headingTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: FarmTheme.colors.textPrimary,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 40,
  },
  cardWrapper: {
    marginBottom: 10,
  },
  cardInner: {
    padding: 14,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  clientName: {
    fontSize: 16,
    fontWeight: '700',
    color: FarmTheme.colors.textPrimary,
    marginBottom: 4,
  },
  clientInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  phoneChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(20, 83, 45, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: FarmTheme.radius.xs,
  },
  phoneText: {
    fontSize: 11,
    color: FarmTheme.colors.forest,
    fontWeight: '600',
  },
  dateText: {
    fontSize: 11,
    color: FarmTheme.colors.textMuted,
  },
  amountCol: {
    alignItems: 'flex-end',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: FarmTheme.colors.forestMedium,
    marginBottom: 3,
  },
  detailsRow: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(20, 83, 45, 0.06)',
  },
  unitChip: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unitText: {
    fontSize: 13,
    color: FarmTheme.colors.textSecondary,
    fontWeight: '600',
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
    backgroundColor: FarmTheme.colors.amberPale,
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