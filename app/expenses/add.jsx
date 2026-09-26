import { useAppContext } from '@/contexts/AppContext';
import { getAllBatches } from '@/database/batchQueries';
import { addExpense } from '@/database/expenseQueries';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

const EXPENSE_CATEGORIES = [
  { name: 'Heating Coal', icon: '🔥' },
  { name: 'Stress Pack', icon: '💊' },
  { name: 'Vaccines', icon: '💉' },
  { name: 'Antibiotics', icon: '🧪' },
  { name: 'Vitamins', icon: '🍊' },
  { name: 'Disinfectant', icon: '🧽' },
  { name: 'Equipment', icon: '🔧' },
  { name: 'Labor', icon: '👷' },
  { name: 'Transport', icon: '🚚' },
  { name: 'Other', icon: '📝' }
];

export default function AddExpenseScreen() {
  const { batchId } = useLocalSearchParams();
  const { triggerRefresh } = useAppContext();
  
  const [selectedCategory, setSelectedCategory] = useState('');
  const [customItem, setCustomItem] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedBatchId, setSelectedBatchId] = useState(batchId || '');
  const [batches, setBatches] = useState([]);

  useEffect(() => {
    const batchData = getAllBatches();
    setBatches(batchData);
  }, []);


  const handleSubmit = () => {
    const itemName = selectedCategory === 'Other' ? customItem : selectedCategory;
    const parsedAmount = Number(amount);
    
    if (!itemName || !amount || !selectedBatchId) {
      Alert.alert('Error', 'Please fill in item name, amount, and select a batch');
      return;
    }

    if (parsedAmount <= 0) {
      Alert.alert('Error', 'Expense amount must be greater than zero');
      return;
    }

    const expenseId = addExpense(
      parseInt(selectedBatchId),
      itemName,
      selectedCategory,
      parsedAmount,
      new Date().toISOString().split('T')[0],
      notes
    );

    if (expenseId) {
      triggerRefresh();
      Alert.alert('Success', 'Expense added successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } else {
      Alert.alert('Error', 'Failed to add expense');
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f9fafb',  marginBottom: 40, }}>
      <View style={{ padding: 16 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 24, color: '#1f2937' }}>
          Add Expense
        </Text>

        <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 12, color: '#374151' }}>
          Select Batch
        </Text>
        
        <View style={{ marginBottom: 24 }}>
          {batches.length > 0 ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {batches.map((batch) => (
                <TouchableOpacity
                  key={batch.id}
                  style={{
                    backgroundColor: selectedBatchId === batch.id.toString() ? '#16a34a' : 'white',
                    padding: 12,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: selectedBatchId === batch.id.toString() ? '#16a34a' : '#d1d5db',
                    minWidth: '45%'
                  }}
                  onPress={() => setSelectedBatchId(batch.id.toString())}
                >
                  <Text style={{
                    color: selectedBatchId === batch.id.toString() ? 'white' : '#000000',
                    fontWeight: selectedBatchId === batch.id.toString() ? 'bold' : 'normal'
                  }}>
                    {batch.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <Text style={{ color: '#6b7280', fontStyle: 'italic' }}>No batches available</Text>
          )}
        </View>

        <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 12, color: '#374151' }}>
          Select Category
        </Text>
        
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
          {EXPENSE_CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category.name}
              style={{
                backgroundColor: selectedCategory === category.name ? '#16a34a' : 'white',
                padding: 12,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: selectedCategory === category.name ? '#16a34a' : '#d1d5db',
                flexDirection: 'row',
                alignItems: 'center',
                minWidth: '45%'
              }}
              onPress={() => setSelectedCategory(category.name)}
            >
              <Text style={{ fontSize: 16, marginRight: 8 }}>{category.icon}</Text>
              <Text style={{
                color: selectedCategory === category.name ? 'white' : '#000000',
                fontWeight: selectedCategory === category.name ? 'bold' : 'normal'
              }}>
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {selectedCategory === 'Other' && (
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 14, fontWeight: '500', marginBottom: 8, color: '#374151' }}>
              Custom Item Name
            </Text>
            <TextInput
              style={{
                backgroundColor: 'white',
                padding: 12,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: '#d1d5db',
                fontSize: 16
              }}
              placeholder="Enter item name"
              value={customItem}
              onChangeText={setCustomItem}
            />
          </View>
        )}

        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 14, fontWeight: '500', marginBottom: 8, color: '#374151' }}>
            Amount ($)
          </Text>
          <TextInput
            style={{
              backgroundColor: 'white',
              padding: 12,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: '#d1d5db',
              fontSize: 16
            }}
            placeholder="0.00"
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
          />
        </View>

        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 14, fontWeight: '500', marginBottom: 8, color: '#374151' }}>
            Notes (Optional)
          </Text>
          <TextInput
            style={{
              backgroundColor: 'white',
              padding: 12,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: '#d1d5db',
              fontSize: 16,
              height: 80,
              textAlignVertical: 'top'
            }}
            placeholder="Additional notes..."
            value={notes}
            onChangeText={setNotes}
            multiline
          />
        </View>

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TouchableOpacity
            style={{
              backgroundColor: '#6b7280',
              padding: 16,
              borderRadius: 8,
              flex: 1,
              alignItems: 'center'
            }}
            onPress={() => router.back()}
          >
            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              backgroundColor: '#16a34a',
              padding: 16,
              borderRadius: 8,
             
              flex: 1,
              alignItems: 'center'
            }}
            onPress={handleSubmit}
          >
            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>Add Expense</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}