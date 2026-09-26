import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';
import { getSalesWithClientInfo, getTotalRevenue } from '../../database/salesQueries';

export default function Sales() {
  const [sales, setSales] = useState([]);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalSales: 0,
    avgSaleValue: 0
  });

  useFocusEffect(useCallback(() => {
    loadSales();
  }, []));

  const loadSales = () => {
    const salesData = getSalesWithClientInfo();
    const totalRevenue = getTotalRevenue();
    const avgSaleValue = salesData.length > 0 ? totalRevenue / salesData.length : 0;

    setSales(salesData);
    setStats({
      totalRevenue,
      totalSales: salesData.length,
      avgSaleValue
    });
  };

  const SaleCard = ({ item }) => (
    <View style={{
      backgroundColor: 'white',
      margin: 8,
      padding: 16,
      borderRadius: 12,
      elevation: 3
    }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontSize: 16, fontWeight: 'bold' }}>{item.clientName}</Text>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#059669' }}>
          ${item.total.toFixed(2)}
        </Text>
      </View>
      
      <Text style={{ color: '#666', marginTop: 4 }}>
        {item.quantity} {item.saleType === 'per_bird' ? 'birds' : 'kg'} @ ${item.price}/{item.saleType === 'per_bird' ? 'bird' : 'kg'}
      </Text>
      
      <Text style={{ color: '#666', fontSize: 12, marginTop: 4 }}>
        {item.date} • {item.clientPhone || 'No phone'}
      </Text>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <View style={{ padding: 16, backgroundColor: 'white', elevation: 2 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: 24, fontWeight: 'bold' }}>Sales</Text>
          <TouchableOpacity
            style={{
              backgroundColor: '#059669',
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 8
            }}
            onPress={() => router.push('/sales/add')}
          >
            <Text style={{ color: 'white', fontWeight: 'bold' }}>+ New Sale</Text>
          </TouchableOpacity>
        </View>
        
        {/* Stats */}
        <View style={{ flexDirection: 'row', marginTop: 16 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12, color: '#666' }}>TOTAL REVENUE</Text>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#059669' }}>
              ${stats.totalRevenue.toFixed(2)}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12, color: '#666' }}>TOTAL SALES</Text>
            <Text style={{ fontSize: 20, fontWeight: 'bold' }}>{stats.totalSales}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12, color: '#666' }}>AVG SALE</Text>
            <Text style={{ fontSize: 20, fontWeight: 'bold' }}>
              ${stats.avgSaleValue.toFixed(2)}
            </Text>
          </View>
        </View>
      </View>

      <FlatList
        data={sales}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => <SaleCard item={item} />}
        ListEmptyComponent={
          <View style={{ padding: 40, alignItems: 'center' }}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>💰</Text>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>No sales recorded</Text>
            <Text style={{ color: '#666', textAlign: 'center' }}>Start recording your sales to track revenue</Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
}