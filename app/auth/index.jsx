import { signIn, signUp } from '@/services/authService';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function AuthScreen() {
  const { invitationToken } = useLocalSearchParams();
  const [mode, setMode] = useState('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Missing details', 'Enter your email and password');
      return;
    }

    if (mode === 'signUp' && !fullName.trim()) {
      Alert.alert('Missing details', 'Enter your full name');
      return;
    }

    setSubmitting(true);
    try {
      if (mode === 'signIn') {
        await signIn({ email: email.trim(), password });
        router.replace(invitationToken ? { pathname: '/invite', params: { token: invitationToken } } : '/projects');
      } else {
        const result = await signUp({
          email: email.trim(),
          password,
          fullName: fullName.trim(),
          whatsappNumber: whatsappNumber.trim(),
          invitationToken: Array.isArray(invitationToken) ? invitationToken[0] : invitationToken
        });
        if (!result.session) {
          Alert.alert('Check your email', 'Your account was created. Confirm your email, then sign in.');
          setMode('signIn');
        }
      }
    } catch (error) {
      const message = error.message === 'Failed to fetch'
        ? 'The app cannot reach Supabase. Check the Supabase URL, environment variable names, and device internet connection.'
        : error.message || 'Please try again';
      Alert.alert('Authentication failed', message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#f5faf6' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 24 : 0}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24, paddingBottom: 48 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <View style={{ backgroundColor: 'white', padding: 24, borderRadius: 12 }}>
        <Text style={{ color: '#17532d', fontSize: 28, fontWeight: 'bold', marginBottom: 8 }}>
          The Project Huku
        </Text>
        <Text style={{ color: '#4b5563', marginBottom: 24 }}>
          {mode === 'signIn' ? 'Sign in to manage your projects.' : 'Create your farm workspace profile.'}
        </Text>

        {mode === 'signUp' && (
          <>
            <TextInput style={styles.input} placeholder="Full name" value={fullName} onChangeText={setFullName} />
            <TextInput style={styles.input} placeholder="WhatsApp number (optional)" value={whatsappNumber} onChangeText={setWhatsappNumber} keyboardType="phone-pad" />
          </>
        )}
        <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        <TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />

        <TouchableOpacity style={styles.primaryButton} onPress={submit} disabled={submitting}>
          <Text style={styles.primaryText}>{submitting ? 'Please wait...' : mode === 'signIn' ? 'Sign in' : 'Create profile'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={() => setMode(mode === 'signIn' ? 'signUp' : 'signIn')}>
          <Text style={styles.secondaryText}>{mode === 'signIn' ? 'Create a profile' : 'Already have a profile? Sign in'}</Text>
        </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = {
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 13,
    marginBottom: 12,
    backgroundColor: 'white'
  },
  primaryButton: {
    backgroundColor: '#16a34a',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8
  },
  primaryText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  secondaryButton: { padding: 15, alignItems: 'center' },
  secondaryText: { color: '#17532d', fontWeight: '600' }
};