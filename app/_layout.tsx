import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { View, StyleSheet } from "react-native";

import { SettingsProvider } from "@/contexts/SettingsContext";
import { AdBanner } from "@/components/AdBanner";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

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

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <SettingsProvider>
        <GestureHandlerRootView style={styles.container}>
          <View style={styles.container}>
            <RootLayoutNav />
            <AdBanner />
          </View>
        </GestureHandlerRootView>
      </SettingsProvider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
