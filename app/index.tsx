import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSettings } from '@/contexts/SettingsContext';
import { AD_BANNER_HEIGHT } from '@/components/AdBanner';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, bestScores, musicEnabled, adsRemoved, isLoading } = useSettings();

  if (isLoading) {
    return (
      <LinearGradient
        colors={[colors.background.start, colors.background.end]}
        style={styles.container}
      >
        <View style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={[styles.title, { color: colors.text.primary }]}>Sequence Master</Text>
        </View>
      </LinearGradient>
    );
  }

  const getBestScore = (mode: 'colors' | 'numbers' | 'pi') => {
    return bestScores[mode] || 0;
  };

  const getPiFreeScore = () => {
    return bestScores.piFree || 0;
  };

  const adBannerSpace = adsRemoved ? 0 : AD_BANNER_HEIGHT;

  return (
    <LinearGradient
      colors={[colors.background.start, colors.background.end]}
      style={styles.container}
    >
      <View style={[styles.safeArea, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + adBannerSpace + 20 }]}>
        <View style={styles.startScreen}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text.primary }]}>Sequence Master</Text>
          </View>

          <View style={styles.mainButtons}>
            <TouchableOpacity
              style={[styles.mainButton, { backgroundColor: colors.button.primary }]}
              onPress={() => router.push('/mode-select')}
              activeOpacity={0.8}
            >
              <Text style={[styles.mainButtonText, { color: colors.button.primaryText }]}>Start</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.mainButton, { backgroundColor: colors.button.primary }]}
              onPress={() => router.push('/settings')}
              activeOpacity={0.8}
            >
              <Text style={[styles.mainButtonText, { color: colors.button.primaryText }]}>Innstillinger</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.recordsSection}>
            <Text style={[styles.recordsTitle, { color: colors.text.primary }]}>Rekorder</Text>
            <View style={styles.recordsBox}>
              <View style={styles.recordRow}>
                <Text style={[styles.recordLabel, { color: colors.text.primary }]}>Farger</Text>
                <Text style={[styles.recordValue, { color: colors.text.primary }]}>{getBestScore('colors')}</Text>
              </View>
              <View style={styles.recordRow}>
                <Text style={[styles.recordLabel, { color: colors.text.primary }]}>Tall</Text>
                <Text style={[styles.recordValue, { color: colors.text.primary }]}>{getBestScore('numbers')}</Text>
              </View>
              <View style={styles.recordRow}>
                <Text style={[styles.recordLabel, { color: colors.text.primary }]}>Pi (Frekvens)</Text>
                <Text style={[styles.recordValue, { color: colors.text.primary }]}>{getBestScore('pi')}</Text>
              </View>
              <View style={styles.recordRow}>
                <Text style={[styles.recordLabel, { color: colors.text.primary }]}>Pi (Fritt)</Text>
                <Text style={[styles.recordValue, { color: colors.text.primary }]}>{getPiFreeScore()}</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  startScreen: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 60,
  },
  title: {
    fontSize: 42,
    fontWeight: '800' as const,
    letterSpacing: -1,
  },
  mainButtons: {
    gap: 16,
    marginBottom: 60,
  },
  mainButton: {
    borderRadius: 16,
    paddingVertical: 20,
    alignItems: 'center' as const,
  },
  mainButtonText: {
    fontSize: 20,
    fontWeight: '700' as const,
  },
  recordsSection: {
    flex: 1,
  },
  recordsTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    marginBottom: 16,
  },
  recordsBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    padding: 24,
    gap: 16,
  },
  recordRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  recordLabel: {
    fontSize: 18,
    fontWeight: '500' as const,
  },
  recordValue: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
});
