import { useAppContext } from '@/contexts/AppContext';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { getAllBatches } from '../../database/batchQueries';
import { getMortalityByBatch, recordMortality } from '../../database/mortalityQueries';
import { getSalesDetailsByBatch } from '../../database/salesQueries';

export default function AddMortality() {
  const { triggerRefresh } = useAppContext();
  const { batchId } = useLocalSearchParams();
  const [batches, setBatches] = useState([]);
  const [formData, setFormData] = useState({
    batchId: batchId || '',
    quantity: '',
    reason: '',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    const batchData = getAllBatches().filter(b => b.status === 'active');
    setBatches(batchData);
  }, []);

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const save = () => {
    if (!formData.batchId || !formData.quantity) {
      Alert.alert('Error', 'Please select a batch and enter quantity');
      return;
    }

    const quantity = Number(formData.quantity);
    const batch = batches.find(item => item.id.toString() === formData.batchId);
    if (!Number.isInteger(quantity) || quantity <= 0 || !batch) {
      Alert.alert('Error', 'Enter a positive whole number of deaths and select a valid batch');
      return;
    }

    const existingMortality = getMortalityByBatch(batch.id);
    const soldBirds = getSalesDetailsByBatch(batch.id)
      .filter(sale => sale.saleType === 'per_bird')
      .reduce((sum, sale) => sum + sale.quantity, 0);
    const availableBirds = batch.initialChicks - existingMortality - soldBirds;
    if (quantity > availableBirds) {
      Alert.alert('Error', `Only ${Math.max(availableBirds, 0)} birds are available to record as mortality`);
      return;
    }

    try {
      recordMortality({
        batchId: Number(formData.batchId),
        quantity,
        date: formData.date,
        reason: formData.reason || 'Not specified'
      });

      triggerRefresh();
      Alert.alert('Success', 'Mortality recorded successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to record mortality');
    }
  };

  const commonReasons = [
    'Disease',
    'Heat stress',
    'Cold stress',
    'Predator attack',
    'Injury',
    'Unknown',
    'Other'
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <View style={{ padding: 16, backgroundColor: 'white', marginBottom: 16 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 8 }}>Record Mortality</Text>
        <Text style={{ color: '#666' }}>Track bird losses in your batches</Text>
      </View>

      <View style={{ padding: 16 }}>
        {/* Batch Selection */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8 }}>Batch *</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {batches.map(batch => (
              <TouchableOpacity
                key={batch.id}
                style={{
                  backgroundColor: formData.batchId === batch.id.toString() ? '#dc2626' : 'white',
                  padding: 12,
                  borderRadius: 8,
                  margin: 4,
                  borderWidth: 1,
                  borderColor: '#d1d5db'
                }}
                onPress={() => updateField('batchId', batch.id.toString())}
              >
                <Text style={{
                  color: formData.batchId === batch.id.toString() ? 'white' : '#000000',
                  fontWeight: '600'
                }}>
                  {batch.name}
                </Text>
                <Text style={{
                  color: formData.batchId === batch.id.toString() ? '#fca5a5' : '#666',
                  fontSize: 12
                }}>
                  {batch.initialChicks} chicks
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Quantity */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8 }}>Number of Deaths *</Text>
          <TextInput
            style={{
              borderWidth: 1,
              borderColor: '#d1d5db',
              borderRadius: 8,
              padding: 12,
              fontSize: 16,
              backgroundColor: 'white'
            }}
            value={formData.quantity}
            onChangeText={(value) => updateField('quantity', value)}
            placeholder="e.g., 2"
            keyboardType="numeric"
          />
        </View>

        {/* Reason Selection */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8 }}>Reason</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {commonReasons.map(reason => (
              <TouchableOpacity
                key={reason}
                style={{
                  backgroundColor: formData.reason === reason ? '#dc2626' : 'white',
                  padding: 8,
                  borderRadius: 6,
                  margin: 2,
                  borderWidth: 1,
                  borderColor: '#d1d5db'
                }}
                onPress={() => updateField('reason', reason)}
              >
                <Text style={{
                  color: formData.reason === reason ? 'white' : '#000000',
                  fontSize: 12,
                  fontWeight: '500'
                }}>
                  {reason}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Custom Reason */}
        {formData.reason === 'Other' && (
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8 }}>Specify Reason</Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: '#d1d5db',
                borderRadius: 8,
                padding: 12,
                fontSize: 16,
                backgroundColor: 'white'
              }}
              value={formData.customReason}
              onChangeText={(value) => updateField('reason', value)}
              placeholder="Describe the cause..."
              multiline
            />
          </View>
        )}

        {/* Date */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8 }}>Date</Text>
          <TextInput
            style={{
              borderWidth: 1,
              borderColor: '#d1d5db',
              borderRadius: 8,
              padding: 12,
              fontSize: 16,
              backgroundColor: 'white'
            }}
            value={formData.date}
            onChangeText={(value) => updateField('date', value)}
            placeholder="YYYY-MM-DD"
          />
        </View>

        {/* Warning if high mortality */}
        {Number(formData.quantity) > 5 && (
          <View style={{
            backgroundColor: '#fef2f2',
            padding: 16,
            borderRadius: 8,
            marginBottom: 16,
            borderLeftWidth: 4,
            borderLeftColor: '#dc2626'
          }}>
            <Text style={{ color: '#dc2626', fontWeight: 'bold', marginBottom: 4 }}>⚠️ High Mortality Alert</Text>
            <Text style={{ color: '#7f1d1d' }}>Consider investigating the cause and consulting a veterinarian if mortality continues.</Text>
          </View>
        )}

        <TouchableOpacity
          style={{
            backgroundColor: '#dc2626',
            padding: 16,
            borderRadius: 8,
            alignItems: 'center',
            marginTop: 16
          }}
          onPress={save}
        >
          <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>Record Mortality</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            padding: 16,
            alignItems: 'center',
            marginTop: 8
          }}
          onPress={() => router.back()}
        >
          <Text style={{ color: '#6b7280', fontSize: 16 }}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
