import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSettings } from '@/contexts/SettingsContext';

export function AdBanner() {
  const insets = useSafeAreaInsets();
  const { adsRemoved, colors } = useSettings();

  if (adsRemoved) {
    return null;
  }

  return (
    <View style={[styles.adContainer, { paddingBottom: insets.bottom }]}>
      <View style={[styles.adBox, { backgroundColor: colors.button.secondary }]}>
        <Text style={[styles.adText, { color: colors.text.primary }]}>Annonse</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  adContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  adBox: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  adText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
});
