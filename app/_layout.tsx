import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { initializeDatabase } from '../src/db/client';
import { Colors } from '../src/constants/theme';
import { useSettingsStore } from '../src/stores/settingsStore';
import { useCollectionStore } from '../src/stores/collectionStore';
import { ErrorBoundary } from '../src/components/ErrorBoundary';

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const themeMode = useSettingsStore((s) => s.themeMode);
  const loadSpecimens = useCollectionStore((s) => s.loadSpecimens);
  const loadTags = useCollectionStore((s) => s.loadTags);

  useEffect(() => {
    try {
      // Initialize database and reference seeds
      initializeDatabase();
      loadSpecimens();
      loadTags();
      useSettingsStore.getState().loadSecureSettings();
      setIsReady(true);
    } catch (err) {
      console.error('Failed to initialize database:', err);
      setIsReady(true);
    }
  }, []);

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.dark.primary} />
        <Text style={styles.loadingText}>Loading CoinVault...</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style={themeMode === 'light' ? 'dark' : 'light'} />
      <ErrorBoundary>
        <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: Colors.dark.surface,
          },
          headerTintColor: Colors.dark.text,
          headerTitleStyle: {
            fontWeight: '700',
            color: Colors.dark.primaryLight,
          },
          contentStyle: {
            backgroundColor: Colors.dark.background,
          },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="specimen/[id]"
          options={{
            title: 'Specimen Details',
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="specimen/new"
          options={{
            title: 'Add Specimen',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="specimen/edit/[id]"
          options={{
            title: 'Edit Specimen',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="coin-type/[id]"
          options={{
            title: 'Coin Type Details',
            headerBackTitle: 'Discover',
          }}
        />
        <Stack.Screen
          name="scan/confirm"
          options={{
            title: 'Confirm Identification',
            headerBackVisible: false,
          }}
        />
        <Stack.Screen
          name="analytics"
          options={{
            title: 'Collection Analytics',
            headerBackTitle: 'Home',
          }}
        />
      </Stack>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.dark.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: Colors.dark.primaryLight,
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
