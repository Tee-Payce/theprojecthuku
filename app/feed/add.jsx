import { useAppContext } from '@/contexts/AppContext';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { getAllBatches } from '../../database/batchQueries';
import { addFeedExpense } from '../../database/feedQueries';

export default function AddFeed() {
  const { triggerRefresh } = useAppContext();
  const { batchId } = useLocalSearchParams();
  const [batches, setBatches] = useState([]);
  const [formData, setFormData] = useState({
    batchId: batchId || '',
    type: 'starter',
    quantityKg: '',
    pricePerKg: '',
    datePurchased: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    const batchData = getAllBatches().filter(b => b.status === 'active');
    setBatches(batchData);
  }, []);

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const save = () => {
    if (!formData.batchId || !formData.quantityKg || !formData.pricePerKg) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const quantityKg = Number(formData.quantityKg);
    const pricePerKg = Number(formData.pricePerKg);
    if (quantityKg <= 0 || pricePerKg <= 0) {
      Alert.alert('Error', 'Quantity and price must be greater than zero');
      return;
    }

    try {
      addFeedExpense({
        batchId: Number(formData.batchId),
        type: formData.type,
        quantityKg,
        pricePerKg,
        datePurchased: formData.datePurchased,
        receiptPath: null
      });

      triggerRefresh();
      Alert.alert('Success', 'Feed expense recorded!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to record feed expense');
    }
  };

  const totalCost = (Number(formData.quantityKg) || 0) * (Number(formData.pricePerKg) || 0);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <View style={{ padding: 16, backgroundColor: 'white', marginBottom: 16 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 8 }}>Add Feed Expense</Text>
        <Text style={{ color: '#666' }}>Record feed purchase for your batch</Text>
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
                  backgroundColor: formData.batchId === batch.id.toString() ? '#16a34a' : 'white',
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
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Feed Type */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8 }}>Feed Type *</Text>
          <View style={{ flexDirection: 'row' }}>
            {['starter', 'grower', 'finisher'].map(type => (
              <TouchableOpacity
                key={type}
                style={{
                  backgroundColor: formData.type === type ? '#16a34a' : 'white',
                  padding: 12,
                  borderRadius: 8,
                  margin: 4,
                  borderWidth: 1,
                  borderColor: '#d1d5db',
                  flex: 1,
                  alignItems: 'center'
                }}
                onPress={() => updateField('type', type)}
              >
                <Text style={{
                  color: formData.type === type ? 'white' : '#000000',
                  fontWeight: '600',
                  textTransform: 'capitalize'
                }}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Quantity */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8 }}>Quantity (bags) *</Text>
          <TextInput
            style={{
              borderWidth: 1,
              borderColor: '#d1d5db',
              borderRadius: 8,
              padding: 12,
              fontSize: 16,
              backgroundColor: 'white'
            }}
            value={formData.quantityKg}
            onChangeText={(value) => updateField('quantityKg', value)}
            placeholder="e.g., 50"
            keyboardType="decimal-pad"
          />
        </View>

        {/* Price per bag */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8 }}>Price per bag *</Text>
          <TextInput
            style={{
              borderWidth: 1,
              borderColor: '#d1d5db',
              borderRadius: 8,
              padding: 12,
              fontSize: 16,
              backgroundColor: 'white'
            }}
            value={formData.pricePerKg}
            onChangeText={(value) => updateField('pricePerKg', value)}
            placeholder="e.g., 0.75"
            keyboardType="decimal-pad"
          />
        </View>

        {/* Date */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8 }}>Purchase Date</Text>
          <TextInput
            style={{
              borderWidth: 1,
              borderColor: '#d1d5db',
              borderRadius: 8,
              padding: 12,
              fontSize: 16,
              backgroundColor: 'white'
            }}
            value={formData.datePurchased}
            onChangeText={(value) => updateField('datePurchased', value)}
            placeholder="YYYY-MM-DD"
          />
        </View>

        {/* Cost Summary */}
        {totalCost > 0 && (
          <View style={{
            backgroundColor: 'white',
            padding: 16,
            borderRadius: 8,
            marginBottom: 16,
            elevation: 2,
            borderLeftWidth: 4,
            borderLeftColor: '#dc2626'
          }}>
            <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 8 }}>Cost Summary</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text>Quantity:</Text>
              <Text style={{ fontWeight: 'bold' }}>{formData.quantityKg} bags</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
              <Text>Price per bag:</Text>
              <Text style={{ fontWeight: 'bold' }}>${formData.pricePerKg}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#e5e7eb' }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Total Cost:</Text>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#dc2626' }}>
                ${totalCost.toFixed(2)}
              </Text>
            </View>
          </View>
        )}

        <TouchableOpacity
          style={{
            backgroundColor: '#16a34a',
            padding: 16,
            borderRadius: 8,
            alignItems: 'center',
            marginTop: 16
          }}
          onPress={save}
        >
          <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>Record Feed Expense</Text>
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
