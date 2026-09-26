import { useFocusEffect } from '@react-navigation/native';
import { Link, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { getBatchById } from '../../database/batchQueries';
import { getTotalExpensesByBatch } from '../../database/expenseQueries';
import { getFeedByBatch } from '../../database/feedQueries';
import { getMortalityByBatch } from '../../database/mortalityQueries';
import { getBatchProgress } from '../../database/progressUtils';
import { getSalesByBatch, getSalesDetailsByBatch } from '../../database/salesQueries';

export default function BatchDetail() {
  const { id } = useLocalSearchParams();
  const [batch, setBatch] = useState(null);
  const [stats, setStats] = useState({
    revenue: 0,
    feedCost: 0,
    expenseCost: 0,
    mortality: 0,
    progress: {},
    sales: [],
    feedExpenses: []
  });

  useFocusEffect(useCallback(() => {
    loadBatchData();
  }, [loadBatchData]));

  const loadBatchData = useCallback(() => {
    const batchData = getBatchById(Number(id));
    const revenue = getSalesByBatch(Number(id));
    const sales = getSalesDetailsByBatch(Number(id));
    const feedExpenses = getFeedByBatch(Number(id));
    const mortality = getMortalityByBatch(Number(id));
    const progress = getBatchProgress(batchData.startDate);
    const expenseCost = getTotalExpensesByBatch(Number(id));
    
    const feedCost = feedExpenses.reduce((sum, feed) => sum + (feed.quantityKg * feed.pricePerKg), 0);
    const totalCost = (batchData.initialChicks * batchData.chickPrice) + feedCost + expenseCost;
    const profit = revenue - totalCost;
    const surviving = batchData.initialChicks - mortality;

    setBatch({ ...batchData, totalCost, profit, surviving });
    setStats({ revenue, feedCost, expenseCost, mortality, progress, sales, feedExpenses });
  }, [id]);

  if (!batch) return <View><Text>Loading...</Text></View>;

  const StatCard = ({ title, value, color = '#16a34a', subtitle }) => (
    <View style={{
      backgroundColor: 'white',
      padding: 16,
      borderRadius: 8,
      margin: 4,
      flex: 1,
      elevation: 2,
      borderLeftWidth: 4,
      borderLeftColor: color
    }}>
      <Text style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>{title}</Text>
      <Text style={{ fontSize: 20, fontWeight: 'bold', color }}>{value}</Text>
      {subtitle && <Text style={{ fontSize: 10, color: '#666', marginTop: 2 }}>{subtitle}</Text>}
    </View>
  );

  const progressColor = stats.progress.percentage < 50 ? '#16a34a' : 
                       stats.progress.percentage < 80 ? '#f59e0b' : '#dc2626';

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      {/* Header */}
      <View style={{ padding: 16, backgroundColor: 'white', marginBottom: 16 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold' }}>{batch.name}</Text>
        <Text style={{ color: '#666', marginTop: 4 }}>
          Started: {batch.startDate} • Week {stats.progress.week} • {stats.progress.percentage}% Complete
        </Text>
        
        {/* Progress Bar */}
        <View style={{ 
          backgroundColor: '#e5e7eb', 
          height: 8, 
          borderRadius: 4, 
          marginTop: 8,
          overflow: 'hidden'
        }}>
          <View style={{
            backgroundColor: progressColor,
            height: '100%',
            width: `${stats.progress.percentage}%`
          }} />
        </View>
      </View>

      {/* Key Stats */}
      <View style={{ flexDirection: 'row', paddingHorizontal: 12, marginBottom: 16 }}>
        <StatCard 
          title="SURVIVING BIRDS" 
          value={`${batch.surviving}/${batch.initialChicks}`}
          color={batch.surviving === batch.initialChicks ? '#16a34a' : '#f59e0b'}
        />
        <StatCard 
          title="REVENUE" 
          value={`$${stats.revenue.toFixed(2)}`}
          color="#059669"
        />
      </View>

      <View style={{ flexDirection: 'row', paddingHorizontal: 12, marginBottom: 16 }}>
        <StatCard 
          title="TOTAL COSTS" 
          value={`$${batch.totalCost.toFixed(2)}`}
          color="#dc2626"
          subtitle={`Chicks: $${(batch.initialChicks * batch.chickPrice).toFixed(2)} • Feed: $${stats.feedCost.toFixed(2)} • Expenses: $${stats.expenseCost.toFixed(2)}`}
        />
        <StatCard 
          title="PROFIT" 
          value={`$${batch.profit.toFixed(2)}`}
          color={batch.profit >= 0 ? '#059669' : '#dc2626'}
        />
      </View>

      {/* Quick Actions */}
      <View style={{ padding: 16, backgroundColor: 'white', marginBottom: 16 }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>Quick Actions</Text>
        <View style={{ flexDirection: 'row' }}>
          <Link href={`/sales/add?batchId=${id}`} asChild>
            <TouchableOpacity style={{
              backgroundColor: '#059669',
              padding: 12,
              borderRadius: 8,
              margin: 4,
              flex: 1,
              alignItems: 'center'
            }}>
              <Text style={{ fontSize: 20, marginBottom: 4 }}>💰</Text>
              <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 12 }}>Record Sale</Text>
            </TouchableOpacity>
          </Link>
          
          <Link href={`/feed/add?batchId=${id}`} asChild>
            <TouchableOpacity style={{
              backgroundColor: '#f59e0b',
              padding: 12,
              borderRadius: 8,
              margin: 4,
              flex: 1,
              alignItems: 'center'
            }}>
              <Text style={{ fontSize: 20, marginBottom: 4 }}>🌾</Text>
              <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 12 }}>Add Feed</Text>
            </TouchableOpacity>
          </Link>
          
          <Link href={`/mortality/add?batchId=${id}`} asChild>
            <TouchableOpacity style={{
              backgroundColor: '#dc2626',
              padding: 12,
              borderRadius: 8,
              margin: 4,
              flex: 1,
              alignItems: 'center'
            }}>
              <Text style={{ fontSize: 20, marginBottom: 4 }}>📊</Text>
              <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 12 }}>Record Mortality</Text>
            </TouchableOpacity>
          </Link>
          
          <Link href={`/expenses/add?batchId=${id}`} asChild>
            <TouchableOpacity style={{
              backgroundColor: '#8b5cf6',
              padding: 12,
              borderRadius: 8,
              margin: 4,
              flex: 1,
              alignItems: 'center'
            }}>
              <Text style={{ fontSize: 20, marginBottom: 4 }}>🧾</Text>
              <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 12 }}>Add Expense</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>

      {/* Recent Sales */}
      {stats.sales.length > 0 && (
        <View style={{ padding: 16, backgroundColor: 'white', marginBottom: 16 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>Recent Sales</Text>
          {stats.sales.slice(0, 3).map((sale, index) => (
            <View key={index} style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              paddingVertical: 8,
              borderBottomWidth: index < 2 ? 1 : 0,
              borderBottomColor: '#e5e7eb'
            }}>
              <View>
                <Text style={{ fontWeight: '600' }}>
                  {sale.quantity} {sale.saleType === 'per_bird' ? 'birds' : 'kg'}
                </Text>
                <Text style={{ color: '#666', fontSize: 12 }}>{sale.date}</Text>
              </View>
              <Text style={{ fontWeight: 'bold', color: '#059669' }}>
                ${sale.total.toFixed(2)}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Feed Expenses */}
      {stats.feedExpenses.length > 0 && (
        <View style={{ padding: 16, backgroundColor: 'white', marginBottom: 16 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>Feed Expenses</Text>
          {stats.feedExpenses.map((feed, index) => (
            <View key={index} style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              paddingVertical: 8,
              borderBottomWidth: index < stats.feedExpenses.length - 1 ? 1 : 0,
              borderBottomColor: '#e5e7eb'
            }}>
              <View>
                <Text style={{ fontWeight: '600', textTransform: 'capitalize' }}>
                  {feed.type} Feed - {feed.quantityKg}bags
                </Text>
                <Text style={{ color: '#666', fontSize: 12 }}>{feed.datePurchased}</Text>
              </View>
              <Text style={{ fontWeight: 'bold', color: '#dc2626' }}>
                ${(feed.quantityKg * feed.pricePerKg).toFixed(2)}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Mortality Alert */}
      {stats.mortality > 0 && (
        <View style={{
          backgroundColor: '#fef2f2',
          padding: 16,
          margin: 16,
          borderRadius: 8,
          borderLeftWidth: 4,
          borderLeftColor: '#dc2626'
        }}>
          <Text style={{ fontWeight: 'bold', color: '#dc2626', marginBottom: 4 }}>
            ⚠️ Mortality Alert
          </Text>
          <Text style={{ color: '#7f1d1d' }}>
            {stats.mortality} birds lost ({((stats.mortality / batch.initialChicks) * 100).toFixed(1)}% mortality rate)
          </Text>
        </View>
      )}

      {/* Performance Analysis */}
      <View style={{ padding: 16, backgroundColor: 'white', marginBottom: 16 }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>Performance Analysis</Text>
        
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
          <Text>Expected Revenue (Live):</Text>
          <Text style={{ fontWeight: 'bold' }}>
            ${(batch.surviving * batch.expectedPricePerBird).toFixed(2)}
          </Text>
        </View>
        
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
          <Text>Actual Revenue:</Text>
          <Text style={{ fontWeight: 'bold', color: '#059669' }}>
            ${stats.revenue.toFixed(2)}
          </Text>
        </View>
        
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
          <Text>Expected Total Costs:</Text>
          <Text style={{ fontWeight: 'bold' }}>
            ${((batch.initialChicks * batch.chickPrice) + stats.feedCost).toFixed(2)}
          </Text>
        </View>
        
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
          <Text>Actual Total Costs:</Text>
          <Text style={{ fontWeight: 'bold', color: '#dc2626' }}>
            ${batch.totalCost.toFixed(2)}
          </Text>
        </View>
        
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#e5e7eb' }}>
          <Text style={{ fontWeight: 'bold' }}>Revenue Variance:</Text>
          <Text style={{ 
            fontWeight: 'bold', 
            color: stats.revenue >= (batch.surviving * batch.expectedPricePerBird) ? '#059669' : '#dc2626' 
          }}>
            ${(stats.revenue - (batch.surviving * batch.expectedPricePerBird)).toFixed(2)}
          </Text>
        </View>
        
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
          <Text style={{ fontWeight: 'bold' }}>Cost Variance:</Text>
          <Text style={{ 
            fontWeight: 'bold', 
            color: batch.totalCost <= ((batch.initialChicks * batch.chickPrice) + stats.feedCost) ? '#059669' : '#dc2626' 
          }}>
            ${(batch.totalCost - ((batch.initialChicks * batch.chickPrice) + stats.feedCost)).toFixed(2)}
          </Text>
        </View>
        
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 8, borderTopWidth: 1, borderTopColor: '#e5e7eb' }}>
          <Text style={{ fontWeight: 'bold' }}>Expected Profit:</Text>
          <Text style={{ fontWeight: 'bold' }}>
            ${((batch.surviving * batch.expectedPricePerBird) - ((batch.initialChicks * batch.chickPrice) + stats.feedCost)).toFixed(2)}
          </Text>
        </View>
        
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ fontWeight: 'bold' }}>Actual Profit:</Text>
          <Text style={{ 
            fontWeight: 'bold', 
            color: batch.profit >= 0 ? '#059669' : '#dc2626' 
          }}>
            ${batch.profit.toFixed(2)}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}