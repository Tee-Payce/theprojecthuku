import { useAppContext } from '@/contexts/AppContext';
import { getAllBatches } from '@/database/batchQueries';
import { getBatchProgress } from '@/database/progressUtils';
import { getTotalRevenue } from '@/database/salesQueries';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function Dashboard() {
  const { refreshTrigger, activeProject, setActiveProject, syncStatus, syncNow } = useAppContext();
  const [stats, setStats] = useState({
    totalBatches: 0,
    activeBatches: 0,
    totalRevenue: 0,
    recentBatches: []
  });

  useEffect(() => {
    loadDashboardData();
  }, [refreshTrigger]);

  const loadDashboardData = () => {
    const batches = getAllBatches();
    const activeBatches = batches.filter(b => b.status === 'active');
    const revenue = getTotalRevenue();
    const recentBatches = batches.slice(0, 3);

    setStats({
      totalBatches: batches.length,
      activeBatches: activeBatches.length,
      totalRevenue: revenue,
      recentBatches
    });
  };

  const StatCard = ({ title, value, color = '#16a34a' }) => (
    <View style={{
      backgroundColor: color,
      padding: 16,
      borderRadius: 8,
      margin: 4,
      flex: 1
    }}>
      <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>{title}</Text>
      <Text style={{ color: 'white', fontSize: 24, fontWeight: 'bold' }}>{value}</Text>
    </View>
  );

  const QuickAction = ({ title, onPress, icon }) => (
    <TouchableOpacity
      style={{
        backgroundColor: '#f3f4f6',
        padding: 16,
        borderRadius: 8,
        margin: 4,
        alignItems: 'center'
      }}
      onPress={onPress}
    >
      <Text style={{ fontSize: 24, marginBottom: 8 }}>{icon}</Text>
      <Text style={{ fontSize: 14, fontWeight: '600' }}>{title}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={{ flex: 1, padding: 16, marginBottom:45, paddingBottom:12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
        <TouchableOpacity
          accessibilityLabel="Back to projects"
          accessibilityRole="button"
          hitSlop={10}
          onPress={() => {
            setActiveProject(null);
            router.replace('/projects');
          }}
          style={{ padding: 6 }}
        >
          <Ionicons name="arrow-back" size={24} color="#17532d" />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center', marginRight: 36 }}>
          <Text style={{ fontSize: 24, fontWeight: 'bold', textAlign: 'center', fontFamily: 'arial', color: '#17532dff' }}>
            {activeProject?.name || 'The Project Huku 🐔'}
          </Text>
          {activeProject?.name && (
            <Text style={{ color: '#6b7280', fontSize: 12, marginTop: 2 }}>Project dashboard</Text>
          )}
        </View>
      </View>

      <TouchableOpacity onPress={syncNow} style={{ backgroundColor: '#ecfdf5', padding: 10, borderRadius: 8, marginBottom: 16, borderWidth: 1, borderColor: '#bbf7d0' }}>
        <Text style={{ color: '#166534', textAlign: 'center', fontWeight: '600' }}>
          {syncStatus.status === 'syncing' ? 'Syncing...' : syncStatus.pendingCount > 0 ? `${syncStatus.pendingCount} changes pending - Sync now` : 'Synced - Sync now'}
        </Text>
      </TouchableOpacity>

      {/* Stats Cards */}
      <View style={{ flexDirection: 'row', marginBottom: 20 }}>
        <StatCard title="Total Batches" value={stats.totalBatches} />
        <StatCard title="Active Batches" value={stats.activeBatches} color="#dc2626" />
      </View>
      
      <View style={{ marginBottom: 20 }}>
        <StatCard title="Total Revenue" value={`$${stats.totalRevenue.toFixed(2)}`} color="#059669" />
      </View>

      {/* Quick Actions */}
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>Quick Actions</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20 }}>
        <QuickAction title="New Batch" icon="➕" onPress={() => router.push('/batches/add')} />
        <QuickAction title="Record Sale" icon="💰" onPress={() => router.push('/sales/add')} />
        <QuickAction title="Add Feed" icon="🌾" onPress={() => router.push('/feed/add')} />
        <QuickAction title="Record Mortality" icon="📊" onPress={() => router.push('/mortality/add')} />
        <QuickAction title="Add Expense" icon="🧾" onPress={() => router.push('/expenses/add')} />
      </View>

      {/* Recent Batches */}
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>Recent Batches</Text>
      {stats.recentBatches.map(batch => {
        const progress = getBatchProgress(batch.startDate);
        return (
          <TouchableOpacity
            key={batch.id}
            style={{
              backgroundColor: 'white',
              padding: 16,
              borderRadius: 8,
              marginBottom: 8,
              elevation: 2
            }}
            onPress={() => router.push(`/batches/${batch.id}`)}
          >
            <Text style={{ fontSize: 16, fontWeight: 'bold' }}>{batch.name}</Text>
            <Text style={{ color: '#666' }}>Week {progress.week} • {progress.percentage}% Complete</Text>
            <Text style={{ color: '#666' }}>{batch.initialChicks} chicks • Started {batch.startDate}</Text>
          </TouchableOpacity>
        );
      })}

      {/* Navigation Buttons */}
      <View style={{ marginTop: 20 }}>
        <TouchableOpacity
          style={{ backgroundColor: '#16a34a', padding: 16, borderRadius: 8, marginBottom: 8 }}
          onPress={() => router.push('/batches')}
        >
          <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>View All Batches</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={{ backgroundColor: '#059669', padding: 16, borderRadius: 8, marginBottom: 8 }}
          onPress={() => router.push('/clients')}
        >
          <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>Manage Clients</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={{ backgroundColor: '#dc2626', padding: 16, borderRadius: 8, marginBottom: 8 }}
          onPress={() => router.push('/calendar')}
        >
          <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>View Calendar</Text>
        </TouchableOpacity>
      
      </View>
    </ScrollView>
  );
}
