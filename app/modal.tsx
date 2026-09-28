import { FarmButton, GlassCard } from '@/components/farm-ui';
import { FarmTheme } from '@/constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Image, StyleSheet, Text, View } from 'react-native';

export default function ModalScreen() {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#071F10', '#0F3C1E', '#14532D']}
        style={StyleSheet.absoluteFill}
      />

      <GlassCard variant="surface" style={styles.card} contentStyle={styles.cardInner}>
        <View style={styles.logoGlassContainer}>
          <Image
            source={require('@/assets/images/thelogo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.title}>The Project Huku 🐔</Text>
        <Text style={styles.subtitle}>
          Professional Poultry & Flock Management System
        </Text>

        <View style={styles.featureList}>
          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <MaterialCommunityIcons name="cloud-sync-outline" size={18} color={FarmTheme.colors.forest} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.featureTitle}>Offline-First Cloud Sync</Text>
              <Text style={styles.featureDesc}>Full local SQLite storage with Supabase cloud backup</Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <MaterialCommunityIcons name="timeline-clock-outline" size={18} color={FarmTheme.colors.forest} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.featureTitle}>6-Week Growth Milestones</Text>
              <Text style={styles.featureDesc}>Starter, grower, and finisher vaccination alerts</Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <MaterialCommunityIcons name="cash-multiple" size={18} color={FarmTheme.colors.forest} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.featureTitle}>Live Margin & Profit Analytics</Text>
              <Text style={styles.featureDesc}>Automatic feed conversion & harvest revenue tracking</Text>
            </View>
          </View>
        </View>

        <FarmButton
          title="Return to Dashboard"
          variant="primary"
          iconName="home-outline"
          onPress={() => router.replace('/')}
          size="lg"
          style={{ width: '100%', marginTop: 8 }}
        />
      </GlassCard>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#071F10',
  },
  card: {
    width: '100%',
    maxWidth: 380,
  },
  cardInner: {
    alignItems: 'center',
    padding: 24,
  },
  logoGlassContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(20, 83, 45, 0.1)',
    borderWidth: 1.5,
    borderColor: 'rgba(20, 83, 45, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    ...FarmTheme.shadows.glowGreen,
  },
  logo: {
    width: 70,
    height: 70,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: FarmTheme.colors.forestDeep,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    color: FarmTheme.colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20,
  },
  featureList: {
    width: '100%',
    gap: 12,
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: FarmTheme.colors.emeraldSoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: FarmTheme.colors.textPrimary,
  },
  featureDesc: {
    fontSize: 11,
    color: FarmTheme.colors.textMuted,
    marginTop: 1,
  },
});
