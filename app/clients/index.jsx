import { FarmButton, FarmInput, GlassCard } from '@/components/farm-ui';
import { FarmTheme } from '@/constants/theme';
import { useAppContext } from '@/contexts/AppContext';
import { addClient, deleteClient, getClients } from '@/database/clientQueries';
import { getSalesByClientId, getTotalSalesByClientId } from '@/database/salesQueries';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function Clients() {
  const { refreshTrigger, triggerRefresh } = useAppContext();
  const [clients, setClients] = useState([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    loadClients();
  }, [refreshTrigger]);

  const loadClients = () => {
    const data = getClients();
    const clientsWithStats = data.map((client) => {
      const totalSpent = getTotalSalesByClientId(client.id);
      const sales = getSalesByClientId(client.id);
      return { ...client, totalSpent, salesCount: sales.length };
    });
    setClients(clientsWithStats);
  };

  const saveClient = () => {
    if (!name.trim()) {
      Alert.alert('Required Name', 'Please enter the client or business name.');
      return;
    }

    try {
      addClient({ name: name.trim(), phone: phone.trim() });
      setName('');
      setPhone('');
      setShowAddForm(false);
      triggerRefresh();
      Alert.alert('Client Added', `Added ${name.trim()} to your farm directory.`);
    } catch (_error) {
      Alert.alert('Error', 'Failed to add client.');
    }
  };

  const handleDeleteClient = (client) => {
    Alert.alert(
      'Remove Client',
      `Delete "${client.name}" from your client records?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            try {
              deleteClient(client.id);
              triggerRefresh();
            } catch (_error) {
              Alert.alert('Error', 'Failed to delete client.');
            }
          },
        },
      ]
    );
  };

  const filteredClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.phone && c.phone.includes(searchQuery))
  );

  const totalClientsRevenue = clients.reduce((sum, c) => sum + (c.totalSpent || 0), 0);

  const renderClientItem = ({ item }) => (
    <View style={styles.cardWrapper}>
      <GlassCard variant="surface" contentStyle={styles.cardInner}>
        <View style={styles.cardTopRow}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitials}>
              {item.name.charAt(0).toUpperCase()}
            </Text>
          </View>

          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={styles.clientName}>{item.name}</Text>
            {item.phone ? (
              <View style={styles.phoneChip}>
                <Ionicons name="call-outline" size={11} color={FarmTheme.colors.forest} style={{ marginRight: 3 }} />
                <Text style={styles.phoneText}>{item.phone}</Text>
              </View>
            ) : (
              <Text style={styles.noPhone}>No phone recorded</Text>
            )}
          </View>

          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => handleDeleteClient(item)}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={16} color={FarmTheme.colors.rose} />
          </TouchableOpacity>
        </View>

        {/* Stats & Quick Actions Footer */}
        <View style={styles.cardFooter}>
          <View style={styles.spentCol}>
            <Text style={styles.metricLabel}>TOTAL SPENT</Text>
            <Text style={styles.spentValue}>${item.totalSpent.toFixed(2)}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.spentCol}>
            <Text style={styles.metricLabel}>ORDERS</Text>
            <Text style={styles.ordersValue}>{item.salesCount}</Text>
          </View>

          <TouchableOpacity
            style={styles.recordSaleBtn}
            onPress={() => router.push(`/sales/add?clientId=${item.id}`)}
            activeOpacity={0.8}
          >
            <Ionicons name="cart-outline" size={13} color="#FFFFFF" style={{ marginRight: 4 }} />
            <Text style={styles.recordSaleText}>Record Sale</Text>
          </TouchableOpacity>
        </View>
      </GlassCard>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Directory Summary Banner */}
      <View style={styles.headerSection}>
        <GlassCard variant="forest" style={styles.summaryCard} contentStyle={styles.summaryInner}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>TOTAL CLIENTS</Text>
            <Text style={styles.summaryValue}>{clients.length}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>CLIENT REVENUE</Text>
            <Text style={[styles.summaryValue, { color: FarmTheme.colors.wheat }]}>
              ${totalClientsRevenue.toFixed(0)}
            </Text>
          </View>
        </GlassCard>

        {/* Search Bar & Add Button */}
        <View style={styles.searchBarRow}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search-outline" size={18} color={FarmTheme.colors.textMuted} style={{ marginRight: 8 }} />
            <FarmInput
              placeholder="Search clients by name or phone..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              containerStyle={{ flex: 1, marginBottom: 0 }}
              inputStyle={{ minHeight: 20 }}
            />
          </View>

          <FarmButton
            title={showAddForm ? 'Close' : 'Add'}
            variant={showAddForm ? 'glass' : 'primary'}
            size="sm"
            iconName={showAddForm ? 'close' : 'add'}
            onPress={() => setShowAddForm(!showAddForm)}
          />
        </View>
      </View>

      {/* Expandable Add Client Glass Card */}
      {showAddForm && (
        <View style={styles.formWrapper}>
          <GlassCard variant="surface" contentStyle={styles.formInner}>
            <Text style={styles.formTitle}>Add New Buyer Client</Text>
            <FarmInput
              label="Client / Business Name"
              placeholder="e.g. Fresh Mart Butchery"
              value={name}
              onChangeText={setName}
              iconName="person-outline"
              required
            />
            <FarmInput
              label="Phone Number"
              placeholder="e.g. +263 77 123 4567"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              iconName="call-outline"
            />
            <View style={styles.formBtnRow}>
              <FarmButton
                title="Save Client"
                variant="primary"
                iconName="checkmark"
                onPress={saveClient}
                style={{ flex: 1, marginRight: 8 }}
              />
              <FarmButton
                title="Cancel"
                variant="glass"
                onPress={() => {
                  setShowAddForm(false);
                  setName('');
                  setPhone('');
                }}
                style={{ flex: 1 }}
              />
            </View>
          </GlassCard>
        </View>
      )}

      {/* Client List */}
      <FlatList
        data={filteredClients}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderClientItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="people-outline" size={36} color={FarmTheme.colors.forest} />
            </View>
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'No matching clients' : 'No clients added yet'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery
                ? 'Try a different name or telephone search term.'
                : 'Add wholesalers, retailers, and individual buyers to keep purchase history.'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: FarmTheme.colors.background,
  },
  headerSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
  },
  summaryCard: {
    marginBottom: 10,
  },
  summaryInner: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.65)',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  summaryDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  searchBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: FarmTheme.radius.md,
    paddingHorizontal: 10,
    borderWidth: 1.2,
    borderColor: 'rgba(20, 83, 45, 0.12)',
    ...FarmTheme.shadows.soft,
  },
  formWrapper: {
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  formInner: {
    padding: 16,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: FarmTheme.colors.textPrimary,
    marginBottom: 12,
  },
  formBtnRow: {
    flexDirection: 'row',
    marginTop: 6,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
  },
  cardWrapper: {
    marginBottom: 10,
  },
  cardInner: {
    padding: 14,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: FarmTheme.colors.emeraldSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarInitials: {
    fontSize: 18,
    fontWeight: '800',
    color: FarmTheme.colors.forest,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '700',
    color: FarmTheme.colors.textPrimary,
  },
  phoneChip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  phoneText: {
    fontSize: 12,
    color: FarmTheme.colors.forest,
    fontWeight: '600',
  },
  noPhone: {
    fontSize: 11,
    color: FarmTheme.colors.textMuted,
    marginTop: 2,
  },
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: FarmTheme.colors.rosePale,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(20, 83, 45, 0.06)',
  },
  spentCol: {
    alignItems: 'flex-start',
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: FarmTheme.colors.textMuted,
    letterSpacing: 0.5,
  },
  spentValue: {
    fontSize: 15,
    fontWeight: '800',
    color: FarmTheme.colors.forestMedium,
    marginTop: 1,
  },
  ordersValue: {
    fontSize: 15,
    fontWeight: '800',
    color: FarmTheme.colors.textPrimary,
    marginTop: 1,
  },
  divider: {
    width: 1,
    height: 22,
    backgroundColor: 'rgba(20, 83, 45, 0.08)',
  },
  recordSaleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: FarmTheme.colors.forest,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: FarmTheme.radius.full,
    ...FarmTheme.shadows.soft,
  },
  recordSaleText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 50,
    paddingHorizontal: 20,
  },
  emptyIconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: FarmTheme.colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: FarmTheme.colors.textPrimary,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: FarmTheme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 260,
  },
});