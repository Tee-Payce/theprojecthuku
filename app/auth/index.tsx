import { FarmButton, FarmInput, GlassCard } from '@/components/farm-ui';
import { FarmTheme } from '@/constants/theme';
import { signIn, signUp } from '@/services/authService';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function AuthScreen() {
  const { invitationToken } = useLocalSearchParams();
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Required Fields', 'Please enter your email and password.');
      return;
    }

    if (mode === 'signUp' && !fullName.trim()) {
      Alert.alert('Required Name', 'Please enter your full name.');
      return;
    }

    setSubmitting(true);
    try {
      if (mode === 'signIn') {
        await signIn({ email: email.trim(), password });
        router.replace(
          invitationToken
            ? { pathname: '/invite', params: { token: invitationToken } }
            : '/projects'
        );
      } else {
        const result = await signUp({
          email: email.trim(),
          password,
          fullName: fullName.trim(),
          whatsappNumber: whatsappNumber.trim(),
          invitationToken: Array.isArray(invitationToken) ? invitationToken[0] : invitationToken,
        });
        if (!result.session) {
          Alert.alert(
            'Confirm Email',
            'Your account was created! Check your inbox to confirm your email, then sign in.'
          );
          setMode('signIn');
        }
      }
    } catch (error) {
      const message =
        error.message === 'Failed to fetch'
          ? 'Cannot connect to Supabase. Check your internet connection.'
          : error.message || 'Authentication error. Please try again.';
      Alert.alert('Authentication Failed', message);
    } finally {
      setSubmitting(false);
    }
  };

  const isSignIn = mode === 'signIn';

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 24 : 0}
    >
      <LinearGradient
        colors={['#071F10', '#0F3C1E', '#14532D']}
        style={StyleSheet.absoluteFill}
      />

      {/* Decorative ambient glass light circles */}
      <View style={styles.ambientCircle1} />
      <View style={styles.ambientCircle2} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Brand Header */}
        <View style={styles.brandHeader}>
          <View style={styles.logoGlassWrapper}>
            <Image
              source={require('@/assets/images/thelogo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.brandTitle}>The Project Huku 🐔</Text>
          <Text style={styles.brandTagline}>
            Smart Poultry Management, Flock Health & Sales Sync
          </Text>
        </View>

        {/* Auth Glass Card */}
        <GlassCard variant="surface" contentStyle={styles.cardInner}>
          {/* Tab Selector */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, isSignIn && styles.tabSelected]}
              onPress={() => setMode('signIn')}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, isSignIn && styles.tabTextSelected]}>
                Sign In
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, !isSignIn && styles.tabSelected]}
              onPress={() => setMode('signUp')}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, !isSignIn && styles.tabTextSelected]}>
                New Farm Profile
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form Inputs */}
          {!isSignIn && (
            <>
              <FarmInput
                label="Full Name"
                placeholder="e.g. Tendai Moyo"
                value={fullName}
                onChangeText={setFullName}
                iconName="person-outline"
                required
              />
              <FarmInput
                label="WhatsApp Number (Optional)"
                placeholder="e.g. +263 77 123 4567"
                value={whatsappNumber}
                onChangeText={setWhatsappNumber}
                keyboardType="phone-pad"
                iconName="logo-whatsapp"
              />
            </>
          )}

          <FarmInput
            label="Email Address"
            placeholder="farmer@example.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            iconName="mail-outline"
            required
          />

          <FarmInput
            label="Password"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            iconName="lock-closed-outline"
            required
          />

          <FarmButton
            title={submitting ? 'Please wait...' : isSignIn ? 'Sign In to Workspace' : 'Create Farm Profile'}
            variant="primary"
            iconName={isSignIn ? 'log-in-outline' : 'person-add-outline'}
            onPress={submit}
            loading={submitting}
            size="lg"
            style={{ marginTop: 10 }}
          />

          <TouchableOpacity
            style={styles.toggleBtn}
            onPress={() => setMode(isSignIn ? 'signUp' : 'signIn')}
            activeOpacity={0.7}
          >
            <Text style={styles.toggleText}>
              {isSignIn
                ? "Don't have a profile? Register your farm"
                : 'Already have a profile? Sign in'}
            </Text>
          </TouchableOpacity>
        </GlassCard>

        <Text style={styles.footerCopyright}>
          The Project Huku • Offline-First Agricultural Platform
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#071F10',
  },
  ambientCircle1: {
    position: 'absolute',
    top: -60,
    right: -40,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
  },
  ambientCircle2: {
    position: 'absolute',
    bottom: 40,
    left: -60,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    paddingTop: 40,
    paddingBottom: 40,
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoGlassWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    ...FarmTheme.shadows.glowGreen,
  },
  logoImage: {
    width: 60,
    height: 60,
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  brandTagline: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.75)',
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 280,
  },
  cardInner: {
    padding: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(20, 83, 45, 0.08)',
    borderRadius: FarmTheme.radius.full,
    padding: 4,
    marginBottom: 18,
  },
  tab: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: FarmTheme.radius.full,
  },
  tabSelected: {
    backgroundColor: '#FFFFFF',
    ...FarmTheme.shadows.soft,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: FarmTheme.colors.textMuted,
  },
  tabTextSelected: {
    color: FarmTheme.colors.forest,
  },
  toggleBtn: {
    marginTop: 16,
    paddingVertical: 8,
    alignItems: 'center',
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '700',
    color: FarmTheme.colors.forest,
  },
  footerCopyright: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    marginTop: 24,
  },
});