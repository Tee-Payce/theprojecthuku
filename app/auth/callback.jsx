import { completeEmailConfirmation } from '@/services/authService';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Text, View } from 'react-native';

export default function AuthCallbackScreen() {
  const { code, error, error_description: errorDescription, invitationToken } = useLocalSearchParams();
  const [message, setMessage] = useState('Confirming your email...');

  useEffect(() => {
    const complete = async () => {
      if (error) {
        const detail = Array.isArray(errorDescription) ? errorDescription[0] : errorDescription;
        setMessage(detail || 'The confirmation link is invalid or expired.');
        return;
      }

      try {
        await completeEmailConfirmation(Array.isArray(code) ? code[0] : code);
        router.replace(invitationToken ? { pathname: '/invite', params: { token: invitationToken } } : '/projects');
      } catch (confirmationError) {
        const detail = confirmationError.message || 'The confirmation link is invalid or expired.';
        setMessage(detail);
        Alert.alert('Email confirmation failed', detail);
      }
    };

    complete();
  }, [code, error, errorDescription, invitationToken]);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <ActivityIndicator color="#16a34a" />
      <Text style={{ marginTop: 16, textAlign: 'center' }}>{message}</Text>
    </View>
  );
}