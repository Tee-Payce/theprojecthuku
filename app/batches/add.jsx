import { useAppContext } from '@/contexts/AppContext';
import { router } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { createBatch } from '../../database/batchQueries';

const InputField = React.memo(function InputField({ label, value, onChangeText, placeholder, keyboardType = 'default', required = false }) {
  return (
  <View style={{ marginBottom: 16 }}>
    <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8, color: '#374151' }}>
      {label} {required && <Text style={{ color: '#dc2626' }}>*</Text>}
    </Text>
    <TextInput
      style={{
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: 'white'
      }}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      keyboardType={keyboardType}
    />
  </View>
  );
});

export default function AddBatch() {
  const { triggerRefresh } = useAppContext();
  const [name, setName] = useState('');
  const [initialChicks, setInitialChicks] = useState('');
  const [chickPrice, setChickPrice] = useState('');
  const [expectedPricePerBird, setExpectedPricePerBird] = useState('');
  const [expectedPricePerKg, setExpectedPricePerKg] = useState('');

  const save = useCallback(() => {
    if (!name || !initialChicks || !chickPrice) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const chickCount = Number(initialChicks);
    const pricePerChick = Number(chickPrice);
    if (!Number.isInteger(chickCount) || chickCount <= 0 || pricePerChick <= 0) {
      Alert.alert('Error', 'Enter a positive whole number of chicks and a positive chick price');
      return;
    }

    try {
      createBatch({
        name,
        startDate: new Date().toISOString().split('T')[0],
        initialChicks: chickCount,
        chickPrice: pricePerChick,
        expectedPricePerBird: Number(expectedPricePerBird) || 8,
        expectedPricePerKg: Number(expectedPricePerKg) || 5
      });

      triggerRefresh();
      Alert.alert('Success', 'Batch created successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to create batch');
    }
  }, [name, initialChicks, chickPrice, expectedPricePerBird, expectedPricePerKg, triggerRefresh]);

  const totalCost = (Number(initialChicks) || 0) * (Number(chickPrice) || 0);
  const expectedRevenueBird = (Number(initialChicks) || 0) * (Number(expectedPricePerBird) || 0);
  const expectedRevenueKg = (Number(initialChicks) || 0) * 2.5 * (Number(expectedPricePerKg) || 0);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <View style={{ padding: 16, backgroundColor: 'white', marginBottom: 16 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 8 }}>New Batch</Text>
        <Text style={{ color: '#666' }}>Create a new poultry batch to start tracking</Text>
      </View>

      <View style={{ padding: 16 }}>
        <InputField
          label="Batch Name"
          value={name}
          onChangeText={setName}
          placeholder="e.g., Batch March 2024"
          required
        />

        <InputField
          label="Number of Chicks"
          value={initialChicks}
          onChangeText={setInitialChicks}
          placeholder="e.g., 100"
          keyboardType="numeric"
          required
        />

        <InputField
          label="Price per Chick"
          value={chickPrice}
          onChangeText={setChickPrice}
          placeholder="e.g., 1.50"
          keyboardType="decimal-pad"
          required
        />

        <InputField
          label="Expected Price per Bird (Live)"
          value={expectedPricePerBird}
          onChangeText={setExpectedPricePerBird}
          placeholder="e.g., 8.00"
          keyboardType="decimal-pad"
        />

        <InputField
          label="Expected Price per Kg"
          value={expectedPricePerKg}
          onChangeText={setExpectedPricePerKg}
          placeholder="e.g., 5.00"
          keyboardType="decimal-pad"
        />

        {totalCost > 0 && (
          <View style={{
            backgroundColor: 'white',
            padding: 16,
            borderRadius: 8,
            marginBottom: 16,
            elevation: 2
          }}>
            <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 8 }}>Cost Summary</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text>Initial Investment:</Text>
              <Text style={{ fontWeight: 'bold' }}>${totalCost.toFixed(2)}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
              <Text>Expected Revenue (Live):</Text>
              <Text style={{ fontWeight: 'bold', color: '#059669' }}>${expectedRevenueBird.toFixed(2)}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
              <Text>Expected Revenue (Kg):</Text>
              <Text style={{ fontWeight: 'bold', color: '#059669' }}>${expectedRevenueKg.toFixed(2)}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#e5e7eb' }}>
              <Text style={{ fontWeight: 'bold' }}>Expected Profit (Live):</Text>
              <Text style={{ fontWeight: 'bold', color: expectedRevenueBird - totalCost >= 0 ? '#059669' : '#dc2626' }}>
                ${(expectedRevenueBird - totalCost).toFixed(2)}
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
          <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>Create Batch</Text>
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
