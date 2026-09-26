import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import AuthGate from '@/components/AuthGate';
import { AppProvider } from '@/contexts/AppContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { initDatabase } from '@/database/init';
import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    initDatabase();
  }, []);
  

  return (
    <AuthProvider>
      <AppProvider>
        <AuthGate>
          <ThemeProvider value={colorScheme === 'light' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="auth" options={{ headerShown: false }} />
          <Stack.Screen name="invite" options={{ headerShown: false }} />
          <Stack.Screen name="projects" options={{ headerShown: false }} />
          <Stack.Screen name="projects/members" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', headerShown: false }} />
          <Stack.Screen name="index" options={{ 
            title: 'Dashboard',
            headerStyle: { backgroundColor: '#17532dff' },
            headerTitleStyle: { color: '#fff' },
            headerTintColor: '#a4eab9ff',
            headerTitleAlign: 'center'
          }} />
          <Stack.Screen name="progress/index" options={{
             title: 'Progress' ,
              headerStyle: { backgroundColor: '#17532dff' },
            headerTitleStyle: { color: '#fff' },
            headerTintColor: '#a4eab9ff',
            headerTitleAlign: 'center'
             }} />

            <Stack.Screen name="batches/index" options={{ 
            title: 'Batches',
             headerStyle: { backgroundColor: '#17532dff' },
            headerTitleStyle: { color: '#fff' },
            headerTintColor: '#a4eab9ff',
            headerTitleAlign: 'center'
            }} />
            <Stack.Screen name="batches/add" options={{
            title: 'Add Batch',
             headerStyle: { backgroundColor: '#2e8e51ff' },
            headerTitleStyle: { color: '#fff' },
            headerTintColor: '#a4eab9ff',
            headerTitleAlign: 'center'
            }} />
          <Stack.Screen name="sales/index" options={{ title: 'Sales' }} />
          <Stack.Screen name="clients/index" options={{
             title: 'Clients',
              headerStyle: { backgroundColor: '#17532dff' },
            headerTitleStyle: { color: '#fff' },
            headerTintColor: '#a4eab9ff',
            headerTitleAlign: 'center'
             }} />
             <Stack.Screen name="sales/add" options={{ title: 'Add Sale',
              headerStyle: { backgroundColor: '#2e8e51ff' },
            headerTitleStyle: { color: '#fff' },
            headerTintColor: '#a4eab9ff',
            headerTitleAlign: 'center'
              }} />
          <Stack.Screen name="calendar/index" options={{ 
            title: 'Calendar',
             headerStyle: { backgroundColor: '#17532dff' },
            headerTitleStyle: { color: '#fff' },
            headerTintColor: '#a4eab9ff',
            headerTitleAlign: 'center'
            }} />
            <Stack.Screen name="mortality/add" options={{ 
            title: 'Add Mortality',
             headerStyle: { backgroundColor: '#2e8e51ff' },
            headerTitleStyle: { color: '#fff' },
            headerTintColor: '#a4eab9ff',
            headerTitleAlign: 'center'
            }} />
            <Stack.Screen name="feed/add" options={{ 
            title: 'Add Feed',
             headerStyle: { backgroundColor: '#2e8e51ff' },
            headerTitleStyle: { color: '#fff' },
            headerTintColor: '#a4eab9ff',
            headerTitleAlign: 'center'
            }} />
            <Stack.Screen name="expenses/add" options={{ 
            title: 'Add Expense',
             headerStyle: { backgroundColor: '#2e8e51ff' },
            headerTitleStyle: { color: '#fff' },
            headerTintColor: '#a4eab9ff',
            headerTitleAlign: 'center'
            }} />
        </Stack>
        <StatusBar style="auto" />
          </ThemeProvider>
        </AuthGate>
      </AppProvider>
    </AuthProvider>
  );
}
