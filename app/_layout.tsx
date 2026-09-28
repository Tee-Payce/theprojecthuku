import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import AuthGate from '@/components/AuthGate';
import { FarmTheme } from '@/constants/theme';
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
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <Stack
              screenOptions={{
                headerStyle: {
                  backgroundColor: FarmTheme.colors.forest,
                },
                headerTitleStyle: {
                  color: '#FFFFFF',
                  fontWeight: '700',
                  fontSize: 18,
                },
                headerTintColor: '#FFFFFF',
                headerTitleAlign: 'center',
                headerShadowVisible: false,
                contentStyle: {
                  backgroundColor: FarmTheme.colors.background,
                },
              }}
            >
              <Stack.Screen name="auth" options={{ headerShown: false }} />
              <Stack.Screen name="invite" options={{ headerShown: false }} />
              <Stack.Screen name="projects" options={{ headerShown: false }} />
              <Stack.Screen name="projects/index" options={{ headerShown: false }} />
              <Stack.Screen name="projects/members" options={{ headerShown: false }} />
              <Stack.Screen name="modal" options={{ presentation: 'modal', headerShown: false }} />

              <Stack.Screen
                name="index"
                options={{
                  headerShown: false,
                }}
              />
              <Stack.Screen
                name="progress/index"
                options={{
                  title: 'Growth & Progress',
                }}
              />
              <Stack.Screen
                name="projects/index"
                options={{
                  title: 'Projects',
                }}
              />
              <Stack.Screen
                name="batches/index"
                options={{
                  title: 'Flock Batches',
                }}
              />
              <Stack.Screen
                name="batches/[id]"
                options={{
                  title: 'Batch Details',
                }}
              />
              <Stack.Screen
                name="batches/add"
                options={{
                  title: 'New Flock Batch',
                }}
              />
              <Stack.Screen
                name="sales/index"
                options={{
                  title: 'Sales & Revenue',
                }}
              />
              <Stack.Screen
                name="sales/add"
                options={{
                  title: 'Record Sale',
                }}
              />
              <Stack.Screen
                name="clients/index"
                options={{
                  title: 'Client Directory',
                }}
              />
              <Stack.Screen
                name="calendar/index"
                options={{
                  title: 'Farm Schedule & Calendar',
                }}
              />
              <Stack.Screen
                name="mortality/add"
                options={{
                  title: 'Record Mortality',
                }}
              />
              <Stack.Screen
                name="feed/add"
                options={{
                  title: 'Record Feed Purchase',
                }}
              />
              <Stack.Screen
                name="expenses/add"
                options={{
                  title: 'Add Farm Expense',
                }}
              />
            </Stack>
            <StatusBar style="light" />
          </ThemeProvider>
        </AuthGate>
      </AppProvider>
    </AuthProvider>
  );
}
