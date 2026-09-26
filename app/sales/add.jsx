import { useAppContext } from '@/contexts/AppContext';
import { Picker } from '@react-native-picker/picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { getAllBatches, getBatchById } from '../../database/batchQueries';
import { getClients } from '../../database/clientQueries';
import { getMortalityByBatch } from '../../database/mortalityQueries';
import { addSale, getSalesDetailsByBatch } from '../../database/salesQueries';

export default function AddSale() {
  const { triggerRefresh } = useAppContext();
  const { batchId, clientId } = useLocalSearchParams();
  const [batches, setBatches] = useState([]);
  const [clients, setClients] = useState([]);
  const [formData, setFormData] = useState({
    batchId: batchId || '',
    clientId: clientId || '',
    saleType: 'per_bird',
    quantity: '',
    price: '',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const batchData = getAllBatches().filter(b => b.status === 'active');
    const clientData = getClients();
    setBatches(batchData);
    setClients(clientData);
  };

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const calculateTotal = () => {
    const quantity = Number(formData.quantity) || 0;
    const price = Number(formData.price) || 0;
    return quantity * price;
  };

  const save = () => {
    if (!formData.batchId || !formData.clientId || !formData.quantity || !formData.price) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const quantity = Number(formData.quantity);
    const price = Number(formData.price);
    if (quantity <= 0 || price <= 0) {
      Alert.alert('Error', 'Quantity and price must be greater than zero');
      return;
    }

    const batch = getBatchById(Number(formData.batchId));
    if (!batch || batch.status !== 'active') {
      Alert.alert('Error', 'Select an active batch');
      return;
    }

    if (formData.saleType === 'per_bird') {
      const dead = getMortalityByBatch(batch.id);
      const sold = getSalesDetailsByBatch(batch.id)
        .filter(sale => sale.saleType === 'per_bird')
        .reduce((sum, sale) => sum + sale.quantity, 0);
      const available = batch.initialChicks - dead - sold;
      if (quantity > available) {
        Alert.alert('Error', `Only ${Math.max(available, 0)} birds are available for sale`);
        return;
      }
    }

    try {
      const total = calculateTotal();
      addSale({
        batchId: Number(formData.batchId),
        clientId: Number(formData.clientId),
        saleType: formData.saleType,
        quantity,
        price,
        total,
        date: formData.date,
        receiptPath: null
      });

      triggerRefresh();
      Alert.alert('Success', 'Sale recorded successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to record sale');
    }
  };

  const InputField = ({ label, value, onChangeText, placeholder, keyboardType = 'default', required = false }) => (
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

  const PickerField = ({ label, selectedValue, onValueChange, items, required = false }) => (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8, color: '#374151' }}>
        {label} {required && <Text style={{ color: '#dc2626' }}>*</Text>}
      </Text>
      <View style={{
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        backgroundColor: 'white'
      }}>
        <Picker
          selectedValue={selectedValue}
          onValueChange={onValueChange}
          style={{ 
            height: 50,
            color: '#000000'
          }}
          itemStyle={{
            color: '#000000',
            fontSize: 16
          }}
        >
          <Picker.Item label="Select..." value="" color="#6b7280" />
          {items.map(item => (
            <Picker.Item key={item.value} label={item.label} value={item.value} color="#000000" />
          ))}
        </Picker>
      </View>
    </View>
  );

  const total = calculateTotal();

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <View style={{ padding: 16, backgroundColor: 'white', marginBottom: 16 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 8 }}>Record Sale</Text>
        <Text style={{ color: '#666' }}>Add a new sale transaction</Text>
      </View>

      <View style={{ padding: 16 }}>
        <PickerField
          label="Batch"
          // style={{ backgroundColor: '#95ef85ff', borderColor: '#49fe88ff' }}
          selectedValue={formData.batchId}
          onValueChange={(value) => updateField('batchId', value)}
          items={batches.map(batch => ({
            label: `${batch.name} (${batch.initialChicks} chicks)`,
            value: batch.id.toString()
          }))}
          required
        />

        <PickerField
          label="Client"
          selectedValue={formData.clientId}
          onValueChange={(value) => updateField('clientId', value)}
          items={clients.map(client => ({
            label: `${client.name}${client.phone ? ` (${client.phone})` : ''}`,
            value: client.id.toString()
          }))}
          required
        />

        <PickerField
          label="Sale Type"
          selectedValue={formData.saleType}
          onValueChange={(value) => updateField('saleType', value)}
          items={[
            { label: 'Per Bird (Live)', value: 'per_bird' },
            { label: 'Per Kilogram', value: 'per_kg' }
          ]}
          required
        />

        <InputField
          label={`Quantity (${formData.saleType === 'per_bird' ? 'Birds' : 'Kg'})`}
          value={formData.quantity}
          onChangeText={(value) => updateField('quantity', value)}
          placeholder={formData.saleType === 'per_bird' ? 'e.g., 10' : 'e.g., 25.5'}
          keyboardType="decimal-pad"
          required
        />

        <InputField
          label={`Price per ${formData.saleType === 'per_bird' ? 'Bird' : 'Kg'}`}
          value={formData.price}
          onChangeText={(value) => updateField('price', value)}
          placeholder="e.g., 8.00"
          keyboardType="decimal-pad"
          required
        />

        <InputField
          label="Sale Date"
          value={formData.date}
          onChangeText={(value) => updateField('date', value)}
          placeholder="YYYY-MM-DD"
        />

        {/* Total Display */}
        {total > 0 && (
          <View style={{
            backgroundColor: 'white',
            padding: 16,
            borderRadius: 8,
            marginBottom: 16,
            elevation: 2,
            borderLeftWidth: 4,
            borderLeftColor: '#059669'
          }}>
            <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 8 }}>Sale Summary</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text>Quantity:</Text>
              <Text style={{ fontWeight: 'bold' }}>
                {formData.quantity} {formData.saleType === 'per_bird' ? 'birds' : 'kg'}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
              <Text>Price per unit:</Text>
              <Text style={{ fontWeight: 'bold' }}>${formData.price}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#e5e7eb' }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Total Amount:</Text>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#059669' }}>
                ${total.toFixed(2)}
              </Text>
            </View>
          </View>
        )}

        <TouchableOpacity
          style={{
            backgroundColor: '#059669',
            padding: 16,
            borderRadius: 8,
            alignItems: 'center',
            marginTop: 16
          }}
          onPress={save}
        >
          <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>Record Sale</Text>
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