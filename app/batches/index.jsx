import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';
import { getAllBatches } from '../../database/batchQueries';
import { getMortalityByBatch } from '../../database/mortalityQueries';
import { getBatchProgress } from '../../database/progressUtils';
import { getSalesByBatch } from '../../database/salesQueries';

export default function Batches() {
  const [batches, setBatches] = useState([]);

  useFocusEffect(useCallback(() => {
    load();
  }, []));

  const load = () => {
    const batchData = getAllBatches();
    const batchesWithStats = batchData.map(batch => {
      const revenue = getSalesByBatch(batch.id);
      const mortality = getMortalityByBatch(batch.id);
      const progress = getBatchProgress(batch.startDate);
      const totalCost = (batch.initialChicks * batch.chickPrice);
      const profit = revenue - totalCost;
      
      return {
        ...batch,
        revenue,
        mortality,
        progress,
        totalCost,
        profit,
        surviving: batch.initialChicks - mortality
      };
    });
    setBatches(batchesWithStats);
  };

  const BatchCard = ({ item }) => {
    const statusColor = item.status === 'active' ? '#16a34a' : '#6b7280';
    const profitColor = item.profit >= 0 ? '#059669' : '#dc2626';
    
    return (
      <TouchableOpacity
        style={{
          backgroundColor: 'white',
          margin: 8,
          padding: 16,
          borderRadius: 12,
          elevation: 3,
          borderLeftWidth: 4,
          borderLeftColor: statusColor
        }}
        onPress={() => router.push(`/batches/${item.id}`)}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold' }}>{item.name}</Text>
          <View style={{
            backgroundColor: statusColor,
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 12
          }}>
            <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>
              {item.status.toUpperCase()}
            </Text>
          </View>
        </View>
        
        <Text style={{ color: '#666', marginTop: 4 }}>Started: {item.startDate}</Text>
        <Text style={{ color: '#666' }}>Week {item.progress.week} • {item.progress.percentage}% Complete</Text>
        
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
          <View>
            <Text style={{ fontSize: 12, color: '#666' }}>CHICKS</Text>
            <Text style={{ fontSize: 16, fontWeight: 'bold' }}>
              {item.surviving}/{item.initialChicks}
            </Text>
          </View>
          
          <View>
            <Text style={{ fontSize: 12, color: '#666' }}>REVENUE</Text>
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#059669' }}>
              ${item.revenue.toFixed(2)}
            </Text>
          </View>
          
          <View>
            <Text style={{ fontSize: 12, color: '#666' }}>PROFIT</Text>
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: profitColor }}>
              ${item.profit.toFixed(2)}
            </Text>
          </View>
        </View>
        
        {item.mortality > 0 && (
          <Text style={{ color: '#dc2626', marginTop: 8, fontSize: 12 }}>
            ⚠️ {item.mortality} birds lost
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <View style={{ padding: 16, backgroundColor: 'white', elevation: 2 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: 24, fontWeight: 'bold' }}>Batches</Text>
          <TouchableOpacity
            style={{
              backgroundColor: '#16a34a',
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 8
            }}
            onPress={() => router.push('/batches/add')}
          >
            <Text style={{ color: 'white', fontWeight: 'bold' }}>+ New Batch</Text>
          </TouchableOpacity>
        </View>
        
        <Text style={{ color: '#666', marginTop: 4 }}>
          {batches.length} total batches • {batches.filter(b => b.status === 'active').length} active
        </Text>
      </View>

      <FlatList
        data={batches}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => <BatchCard item={item} />}
        ListEmptyComponent={
          <View style={{ padding: 40, alignItems: 'center' }}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>🐔</Text>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>No batches yet</Text>
            <Text style={{ color: '#666', textAlign: 'center' }}>Start tracking your poultry by creating your first batch</Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
}
