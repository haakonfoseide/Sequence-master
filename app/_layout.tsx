import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, Component, ReactNode } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { View, StyleSheet, Text } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { SettingsProvider, useSettings } from "@/contexts/SettingsContext";
import { trpc, trpcClient } from "@/lib/trpc";
import { useBackgroundMusic } from "@/hooks/useBackgroundMusic";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync().catch((error) => {
  console.error('Failed to prevent splash screen auto-hide:', error);
});

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="settings" options={{ headerShown: false }} />
      <Stack.Screen name="mode-select" options={{ headerShown: false }} />
      <Stack.Screen name="pi-digits" options={{ headerShown: false }} />
      <Stack.Screen name="game-pi" options={{ headerShown: false }} />
      <Stack.Screen name="game-colors" options={{ headerShown: false }} />
      <Stack.Screen name="game-numbers" options={{ headerShown: false }} />
    </Stack>
  );
}

function BackgroundMusicBridge() {
  const { musicEnabled, gameConfig, isLoading } = useSettings();
  useBackgroundMusic(gameConfig.mode === 'pi' ? 'pi' : gameConfig.mode, !isLoading && musicEnabled);
  return null;
}

class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error boundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={[styles.container, styles.errorContainer]}>
          <Text style={styles.errorText}>Noe gikk galt</Text>
          <Text style={styles.errorDetails}>
            {this.state.error?.message || 'Ukjent feil'}
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync().catch((error) => {
      console.error('Failed to hide splash screen:', error);
    });
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <trpc.Provider client={trpcClient} queryClient={queryClient}>
          <SettingsProvider>
            <SafeAreaProvider>
              <GestureHandlerRootView style={styles.container}>
                <View style={styles.container}>
                  <BackgroundMusicBridge />
                  <RootLayoutNav />
                </View>
              </GestureHandlerRootView>
            </SafeAreaProvider>
          </SettingsProvider>
        </trpc.Provider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  errorContainer: {
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    backgroundColor: '#EF4444',
    padding: 20,
  },
  errorText: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginBottom: 10,
  },
  errorDetails: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center' as const,
  },
});
