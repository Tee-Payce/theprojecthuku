import { useAppContext } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { Redirect, useSegments } from 'expo-router';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { activeProject } = useAppContext();
  const segments = useSegments();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#16a34a" />
      </View>
    );
  }

  const currentSegment = segments[0] as string | undefined;
  const isAuthScreen = currentSegment === 'auth' && segments[1] !== 'callback';
  if (!user && currentSegment !== 'auth' && currentSegment !== 'invite') return <Redirect href={'/auth' as never} />;
  if (user && isAuthScreen) return <Redirect href={'/projects' as never} />;
  if (user && !activeProject && currentSegment !== 'projects' && currentSegment !== 'invite') return <Redirect href={'/projects' as never} />;

  return <>{children}</>;
}