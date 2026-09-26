import { getAllBatches, updateBatchStatus } from '@/database/batchQueries';
import { getMortalityByBatch } from '@/database/mortalityQueries';
import { getBatchProgress, getEndDate, isBatchCompleted } from '@/database/progressUtils';
import { getSalesByBatch } from '@/database/salesQueries';
import { getUpcomingReminders, requestNotificationPermissions, scheduleFeedReminders, scheduleVaccinationReminders } from '@/services/NotificationService';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Calendar } from 'react-native-calendars';

export default function CalendarScreen() {
  const [markedDates, setMarkedDates] = useState({});
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [batches, setBatches] = useState([]);
  const [reminders, setReminders] = useState([]);

  useFocusEffect(useCallback(() => {
    loadBatches();
    requestNotificationPermissions();
  }, []));

  const loadBatches = () => {
    const batchData = getAllBatches();
    const marks = {};
    const batchesWithProgress = [];

    batchData.forEach(batch => {
      const start = batch.startDate;
      const end = getEndDate(batch.startDate);
      const progress = getBatchProgress(batch.startDate);
      const revenue = getSalesByBatch(batch.id);
      const mortality = getMortalityByBatch(batch.id);
      const isCompleted = isBatchCompleted(batch.startDate);
      
      if (isCompleted && batch.status === 'active') {
        updateBatchStatus(batch.id, 'completed');
        batch.status = 'completed';
      }

      const batchColor = batch.status === 'active' ? '#16a34a' : '#6b7280';
      const endColor = batch.status === 'active' ? '#dc2626' : '#9ca3af';

      marks[start] = {
        startingDay: true,
        color: batchColor,
        textColor: 'white'
      };

      marks[end] = {
        endingDay: true,
        color: endColor,
        textColor: 'white'
      };

      const startDate = new Date(start);
      const endDate = new Date(end);
      const currentDate = new Date(startDate);
      
      while (currentDate < endDate) {
        currentDate.setDate(currentDate.getDate() + 1);
        const dateStr = currentDate.toISOString().split('T')[0];
        
        if (dateStr !== end) {
          marks[dateStr] = {
            color: batchColor,
            textColor: 'white'
          };
        }
      }

      batchesWithProgress.push({
        ...batch,
        progress,
        revenue,
        mortality,
        surviving: batch.initialChicks - mortality,
        endDate: end
      });
    });

    setMarkedDates(marks);
    setBatches(batchesWithProgress);
    setReminders(getUpcomingReminders(batchesWithProgress));
  };

  const scheduleNotifications = async (batch) => {
    try {
      await scheduleFeedReminders(batch.id, batch.name, batch.startDate);
      await scheduleVaccinationReminders(batch.id, batch.name, batch.startDate);
      Alert.alert('Reminder Guide', 'Feed and vaccination reminders are shown in the calendar guide. Native notifications are not enabled in this build.');
    } catch (error) {
      Alert.alert('Error', 'Failed to schedule notifications');
    }
  };

  const ReminderCard = ({ reminder }) => {
    const priorityColors = {
      critical: '#dc2626',
      high: '#f59e0b',
      medium: '#16a34a'
    };

    return (
      <View style={{
        backgroundColor: 'white',
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
        borderLeftWidth: 4,
        borderLeftColor: priorityColors[reminder.priority],
        elevation: 2
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
          <Text style={{ fontSize: 20, marginRight: 8 }}>{reminder.icon}</Text>
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1f2937', flex: 1 }}>
            {reminder.title}
          </Text>
          <View style={{
            backgroundColor: priorityColors[reminder.priority],
            paddingHorizontal: 8,
            paddingVertical: 2,
            borderRadius: 12
          }}>
            <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>
              {reminder.priority.toUpperCase()}
            </Text>
          </View>
        </View>
        <Text style={{ color: '#6b7280', fontSize: 14, marginBottom: 4 }}>
          {reminder.batch}
        </Text>
        <Text style={{ color: '#374151', fontSize: 14 }}>
          {reminder.message}
        </Text>
      </View>
    );
  };

  const onDayPress = (day) => {
    const selectedDate = day.dateString;
    const batchForDate = batches.find(batch => 
      batch.startDate === selectedDate || batch.endDate === selectedDate
    );
    
    if (batchForDate) {
      setSelectedBatch(batchForDate);
    } else {
      setSelectedBatch(null);
    }
  };

  const BatchDetailCard = ({ batch }) => {
    const statusColor = batch.status === 'active' ? '#16a34a' : '#6b7280';
    const profitColor = (batch.revenue - (batch.initialChicks * batch.chickPrice)) >= 0 ? '#059669' : '#dc2626';
    
    return (
      <View style={{
        backgroundColor: 'white',
        margin: 16,
        padding: 20,
        borderRadius: 12,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8
      }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1f2937' }}>{batch.name}</Text>
          <View style={{
            backgroundColor: statusColor,
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 16
          }}>
            <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>
              {batch.status.toUpperCase()}
            </Text>
          </View>
        </View>
        
        <View style={{ marginBottom: 16 }}>
          <Text style={{ color: '#6b7280', marginBottom: 8 }}>Progress: Week {batch.progress.week} • {batch.progress.percentage}% Complete</Text>
          <View style={{
            backgroundColor: '#e5e7eb',
            height: 8,
            borderRadius: 4,
            overflow: 'hidden'
          }}>
            <View style={{
              backgroundColor: statusColor,
              height: '100%',
              width: `${batch.progress.percentage}%`
            }} />
          </View>
        </View>
        
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>SURVIVING</Text>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1f2937' }}>
              {batch.surviving}/{batch.initialChicks}
            </Text>
          </View>
          
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>REVENUE</Text>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#059669' }}>
              ${batch.revenue.toFixed(2)}
            </Text>
          </View>
          
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>PROFIT</Text>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: profitColor }}>
              ${(batch.revenue - (batch.initialChicks * batch.chickPrice)).toFixed(2)}
            </Text>
          </View>
        </View>
        
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity
            style={{
              backgroundColor: '#16a34a',
              padding: 12,
              borderRadius: 8,
              flex: 1,
              alignItems: 'center'
            }}
            onPress={() => router.push(`/batches/${batch.id}`)}
          >
            <Text style={{ color: 'white', fontWeight: 'bold' }}>View Details</Text>
          </TouchableOpacity>
          
          {batch.status === 'active' && (
            <>
              <TouchableOpacity
                style={{
                  backgroundColor: '#059669',
                  padding: 12,
                  borderRadius: 8,
                  flex: 1,
                  alignItems: 'center',
                  marginRight: 4
                }}
                onPress={() => router.push(`/sales/add?batchId=${batch.id}`)}
              >
                <Text style={{ color: 'white', fontWeight: 'bold' }}>Record Sale</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={{
                  backgroundColor: '#8b5cf6',
                  padding: 12,
                  borderRadius: 8,
                  flex: 1,
                  alignItems: 'center'
                }}
                onPress={() => scheduleNotifications(batch)}
              >
                <Text style={{ color: 'white', fontWeight: 'bold' }}>Reminder Guide</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={{
                  backgroundColor: '#f59e0b',
                  padding: 12,
                  borderRadius: 8,
                  flex: 1,
                  alignItems: 'center'
                }}
                onPress={() => router.push(`/expenses/add?batchId=${batch.id}`)}
              >
                <Text style={{ color: 'white', fontWeight: 'bold' }}>Add Expense</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
        
        {batch.mortality > 0 && (
          <View style={{
            backgroundColor: '#fef2f2',
            padding: 12,
            borderRadius: 8,
            marginTop: 12,
            borderLeftWidth: 4,
            borderLeftColor: '#dc2626'
          }}>
            <Text style={{ color: '#dc2626', fontWeight: 'bold' }}>
              ⚠️ {batch.mortality} birds lost ({((batch.mortality / batch.initialChicks) * 100).toFixed(1)}% mortality)
            </Text>
          </View>
        )}
      </View>
    );
  };

  const activeBatches = batches.filter(b => b.status === 'active');
  const completedBatches = batches.filter(b => b.status === 'completed');

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      {/* Header */}
      <View style={{ padding: 16, backgroundColor: 'white', elevation: 2 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#1f2937' }}>Batch Calendar</Text>
          <TouchableOpacity
            style={{
              backgroundColor: '#16a34a',
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 8
            }}
            onPress={() => router.push('/batches/add')}
          >
            <Text style={{ color: 'white', fontWeight: 'bold' }}>+ New Batch</Text>
          </TouchableOpacity>
        </View>
        
        <Text style={{ color: '#6b7280' }}>
          {activeBatches.length} active • {completedBatches.length} completed • {reminders.length} reminders
        </Text>
      </View>

      {/* Reminders Section */}
      {reminders.length > 0 && (
        <View style={{ padding: 16, backgroundColor: 'white', margin: 16, borderRadius: 12, elevation: 2 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12, color: '#1f2937' }}>🔔 Active Reminders</Text>
          {reminders.map((reminder, index) => (
            <ReminderCard key={index} reminder={reminder} />
          ))}
        </View>
      )}

      {/* Feed Schedule Guide */}
      <View style={{ padding: 16, backgroundColor: 'white', margin: 16, borderRadius: 12, elevation: 2 }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12, color: '#1f2937' }}>🌾 Feed Schedule</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
          <View style={{ alignItems: 'center', flex: 1 }}>
            <View style={{ width: 40, height: 40, backgroundColor: '#16a34a', borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
              <Text style={{ color: 'white', fontWeight: 'bold' }}>S</Text>
            </View>
            <Text style={{ fontSize: 12, fontWeight: 'bold' }}>Starter</Text>
            <Text style={{ fontSize: 10, color: '#6b7280' }}>0-12 days</Text>
          </View>
          <View style={{ alignItems: 'center', flex: 1 }}>
            <View style={{ width: 40, height: 40, backgroundColor: '#f59e0b', borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
              <Text style={{ color: 'white', fontWeight: 'bold' }}>G</Text>
            </View>
            <Text style={{ fontSize: 12, fontWeight: 'bold' }}>Grower</Text>
            <Text style={{ fontSize: 10, color: '#6b7280' }}>12-26 days</Text>
          </View>
          <View style={{ alignItems: 'center', flex: 1 }}>
            <View style={{ width: 40, height: 40, backgroundColor: '#dc2626', borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
              <Text style={{ color: 'white', fontWeight: 'bold' }}>F</Text>
            </View>
            <Text style={{ fontSize: 12, fontWeight: 'bold' }}>Finisher</Text>
            <Text style={{ fontSize: 10, color: '#6b7280' }}>26-42 days</Text>
          </View>
        </View>
      </View>

      {/* Vaccination Schedule Guide */}
      <View style={{ padding: 16, backgroundColor: 'white', margin: 16, borderRadius: 12, elevation: 2 }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12, color: '#1f2937' }}>💉 Vaccination Schedule</Text>
        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 8, backgroundColor: '#f3f4f6', borderRadius: 6 }}>
            <Text style={{ fontWeight: 'bold', color: '#374151' }}>MA5clone30 spray</Text>
            <Text style={{ color: '#6b7280' }}>Days 10-12</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 8, backgroundColor: '#f3f4f6', borderRadius: 6 }}>
            <Text style={{ fontWeight: 'bold', color: '#374151' }}>IBD</Text>
            <Text style={{ color: '#6b7280' }}>Days 13-14</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 8, backgroundColor: '#f3f4f6', borderRadius: 6 }}>
            <Text style={{ fontWeight: 'bold', color: '#374151' }}>MA5clone30 spray</Text>
            <Text style={{ color: '#6b7280' }}>Days 19-21</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 8, backgroundColor: '#f3f4f6', borderRadius: 6 }}>
            <Text style={{ fontWeight: 'bold', color: '#374151' }}>Finisher program</Text>
            <Text style={{ color: '#6b7280' }}>Days 24-42</Text>
          </View>
        </View>
      </View>

      {/* Calendar */}
      <View style={{ backgroundColor: 'white', margin: 16, borderRadius: 12, elevation: 2, overflow: 'hidden' }}>
        <Calendar
          markingType={'period'}
          markedDates={markedDates}
          onDayPress={onDayPress}
          theme={{
            backgroundColor: 'white',
            calendarBackground: 'white',
            textSectionTitleColor: '#6b7280',
            selectedDayBackgroundColor: '#16a34a',
            selectedDayTextColor: 'white',
            todayTextColor: '#16a34a',
            dayTextColor: '#1f2937',
            textDisabledColor: '#d1d5db',
            arrowColor: '#16a34a',
            monthTextColor: '#1f2937',
            indicatorColor: '#16a34a',
            textDayFontWeight: '500',
            textMonthFontWeight: 'bold',
            textDayHeaderFontWeight: '600'
          }}
        />
      </View>

      {/* Selected Batch Details */}
      {selectedBatch && <BatchDetailCard batch={selectedBatch} />}

      {/* Quick Stats */}
      {!selectedBatch && (
        <View style={{ padding: 16 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16, color: '#1f2937' }}>Quick Overview</Text>
          
          {activeBatches.length > 0 && (
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8, color: '#16a34a' }}>Active Batches</Text>
              {activeBatches.map(batch => (
                <TouchableOpacity
                  key={batch.id}
                  style={{
                    backgroundColor: 'white',
                    padding: 12,
                    borderRadius: 8,
                    marginBottom: 8,
                    elevation: 1,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                  onPress={() => setSelectedBatch(batch)}
                >
                  <View>
                    <Text style={{ fontWeight: 'bold', color: '#1f2937' }}>{batch.name}</Text>
                    <Text style={{ color: '#6b7280', fontSize: 12 }}>Week {batch.progress.week} • {batch.surviving} birds</Text>
                  </View>
                  <Text style={{ color: '#16a34a', fontWeight: 'bold' }}>{batch.progress.percentage}%</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          
          {completedBatches.length > 0 && (
            <View>
              <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8, color: '#6b7280' }}>Recently Completed</Text>
              {completedBatches.slice(0, 3).map(batch => (
                <TouchableOpacity
                  key={batch.id}
                  style={{
                    backgroundColor: 'white',
                    padding: 12,
                    borderRadius: 8,
                    marginBottom: 8,
                    elevation: 1,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                  onPress={() => setSelectedBatch(batch)}
                >
                  <View>
                    <Text style={{ fontWeight: 'bold', color: '#1f2937' }}>{batch.name}</Text>
                    <Text style={{ color: '#6b7280', fontSize: 12 }}>Completed • ${batch.revenue.toFixed(2)} revenue</Text>
                  </View>
                  <Text style={{ color: '#6b7280', fontWeight: 'bold' }}>✓</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
};
