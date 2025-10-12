import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Switch,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSettings, Theme } from '@/contexts/SettingsContext';
import { purchaseProduct, restorePurchases } from '@/services/purchaseService';
import { showLeaderboard } from '@/services/gameCenterService';
import { AD_BANNER_HEIGHT } from '@/components/AdBanner';

const THEME_OPTIONS: { value: Theme; label: string; emoji: string }[] = [
  { value: 'purple', label: 'Lilla', emoji: '💜' },
  { value: 'blue', label: 'Blå', emoji: '💙' },
  { value: 'green', label: 'Grønn', emoji: '💚' },
  { value: 'orange', label: 'Oransje', emoji: '🧡' },
  { value: 'pink', label: 'Rosa', emoji: '💗' },
  { value: 'red', label: 'Rød', emoji: '❤️' },
  { value: 'teal', label: 'Turkis', emoji: '💎' },
  { value: 'indigo', label: 'Indigo', emoji: '🔮' },
];

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { theme, musicEnabled, hapticsEnabled, adsRemoved, colors, bestScores, updateTheme, toggleMusic, toggleHaptics, resetBestScores, setAdRemovalStatus } = useSettings();
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
  const [showThemePicker, setShowThemePicker] = useState<boolean>(false);

  const adBannerSpace = adsRemoved ? 0 : AD_BANNER_HEIGHT;

  return (
    <LinearGradient
      colors={[colors.background.start, colors.background.end]}
      style={styles.container}
    >
      <View style={[styles.safeArea, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + adBannerSpace + 20 }]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <ArrowLeft color={colors.text.primary} size={24} />
            <Text style={[styles.backText, { color: colors.text.primary }]}>Back</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Innstillinger</Text>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.text.secondary }]}>UTSEENDE</Text>
            <TouchableOpacity
              style={[styles.settingCard, { backgroundColor: 'rgba(255, 255, 255, 0.15)' }]}
              onPress={() => setShowThemePicker(true)}
              activeOpacity={0.7}
            >
              <View style={styles.settingRow}>
                <Text style={[styles.settingLabel, { color: colors.text.primary }]}>Tema</Text>
                <View style={styles.themeSelector}>
                  <Text style={[styles.themeValue, { color: colors.text.primary }]}>
                    {THEME_OPTIONS.find(t => t.value === theme)?.label || 'Oransje'}
                  </Text>
                  <View style={[styles.themeDot, { backgroundColor: colors.background.start }]} />
                </View>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.text.secondary }]}>LYD & HAPTIKK</Text>
            <View style={[styles.settingCard, { backgroundColor: 'rgba(255, 255, 255, 0.15)' }]}>
              <View style={styles.settingRow}>
                <Text style={[styles.settingLabel, { color: colors.text.primary }]}>Musikk</Text>
                <Switch
                  value={musicEnabled}
                  onValueChange={toggleMusic}
                  trackColor={{ false: 'rgba(255, 255, 255, 0.2)', true: colors.button.primary }}
                  thumbColor={musicEnabled ? colors.button.primaryText : '#f4f3f4'}
                />
              </View>
              <View style={styles.divider} />
              <View style={styles.settingRow}>
                <Text style={[styles.settingLabel, { color: colors.text.primary }]}>Haptisk Feedback</Text>
                <Switch
                  value={hapticsEnabled}
                  onValueChange={toggleHaptics}
                  trackColor={{ false: 'rgba(255, 255, 255, 0.2)', true: colors.button.primary }}
                  thumbColor={hapticsEnabled ? colors.button.primaryText : '#f4f3f4'}
                />
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.text.secondary }]}>ANNONSER</Text>
            <View style={[styles.settingCard, { backgroundColor: 'rgba(255, 255, 255, 0.15)' }]}>
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingLabel, { color: colors.text.primary }]}>Fjern reklame (Pro)</Text>
                  {adsRemoved && (
                    <Text style={[styles.settingSubtext, { color: colors.text.secondary }]}>Aktivert ✓</Text>
                  )}
                </View>
                {!adsRemoved ? (
                  <TouchableOpacity
                    style={[styles.purchaseButton, { backgroundColor: colors.button.primary }]}
                    onPress={async () => {
                      const success = await purchaseProduct('com.sequencemaster.removeads');
                      if (success) {
                        setAdRemovalStatus(true);
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.purchaseButtonText, { color: colors.button.primaryText }]}>Kjøp</Text>
                  </TouchableOpacity>
                ) : (
                  <Switch
                    value={true}
                    onValueChange={() => {}}
                    trackColor={{ false: 'rgba(255, 255, 255, 0.2)', true: colors.button.primary }}
                    thumbColor={colors.button.primaryText}
                    disabled
                  />
                )}
              </View>
              {!adsRemoved && (
                <TouchableOpacity
                  style={[styles.restoreButton, { backgroundColor: 'rgba(255, 255, 255, 0.1)' }]}
                  onPress={async () => {
                    const purchases = await restorePurchases();
                    if (purchases.includes('com.sequencemaster.removeads')) {
                      setAdRemovalStatus(true);
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.restoreButtonText, { color: colors.text.secondary }]}>Gjenopprett kjøp</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.text.secondary }]}>GAME CENTER</Text>
            <View style={[styles.settingCard, { backgroundColor: 'rgba(255, 255, 255, 0.15)' }]}>
              <TouchableOpacity
                style={styles.settingRow}
                onPress={() => showLeaderboard()}
                activeOpacity={0.7}
              >
                <Text style={[styles.settingLabel, { color: colors.text.primary }]}>Vis Leaderboards</Text>
                <Text style={[styles.settingValue, { color: colors.text.secondary }]}>›</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.text.secondary }]}>HIGHSCORE</Text>
            <View style={[styles.settingCard, { backgroundColor: 'rgba(255, 255, 255, 0.15)' }]}>
              <View style={styles.highscoreRow}>
                <Text style={[styles.highscoreLabel, { color: colors.text.primary }]}>Farger: {bestScores.colors}</Text>
              </View>
              <View style={styles.highscoreRow}>
                <Text style={[styles.highscoreLabel, { color: colors.text.primary }]}>Tall: {bestScores.numbers}</Text>
              </View>
              <View style={styles.highscoreRow}>
                <Text style={[styles.highscoreLabel, { color: colors.text.primary }]}>Pi: {bestScores.pi}</Text>
              </View>
              <TouchableOpacity
                style={[styles.resetButton, { backgroundColor: 'rgba(255, 255, 255, 0.1)' }]}
                onPress={() => setShowResetConfirm(true)}
                activeOpacity={0.7}
              >
                <Text style={[styles.resetButtonText, { color: '#EF4444' }]}>Nullstill</Text>
              </TouchableOpacity>
            </View>
          </View>


        </ScrollView>

        <Modal
          visible={showResetConfirm}
          transparent
          animationType="fade"
          onRequestClose={() => setShowResetConfirm(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.background.start }]}>
              <Text style={[styles.modalTitle, { color: colors.text.primary }]}>Nullstill rekorder?</Text>
              <Text style={[styles.modalText, { color: colors.text.secondary }]}>
                Er du sikker på at du vil nullstille alle rekorder? Dette kan ikke angres.
              </Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}
                  onPress={() => setShowResetConfirm(false)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.modalButtonText, { color: colors.text.primary }]}>Avbryt</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: '#EF4444' }]}
                  onPress={() => {
                    resetBestScores();
                    setShowResetConfirm(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>Nullstill</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <Modal
          visible={showThemePicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowThemePicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.background.start }]}>
              <Text style={[styles.modalTitle, { color: colors.text.primary }]}>Velg tema</Text>
              <View style={styles.themeOptions}>
                {THEME_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.themeOption,
                      { backgroundColor: 'rgba(255, 255, 255, 0.15)' },
                      theme === option.value && { backgroundColor: 'rgba(255, 255, 255, 0.3)', borderWidth: 2, borderColor: 'rgba(255, 255, 255, 0.6)' }
                    ]}
                    onPress={() => {
                      updateTheme(option.value);
                      setShowThemePicker(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.themeEmoji}>{option.emoji}</Text>
                    <Text style={[styles.themeLabel, { color: colors.text.primary }]}>{option.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </Modal>
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
  header: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  backText: {
    fontSize: 18,
    fontWeight: '500' as const,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    letterSpacing: 1,
    marginBottom: 12,
  },
  settingCard: {
    borderRadius: 16,
    padding: 20,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500' as const,
  },
  themeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  themeValue: {
    fontSize: 16,
    fontWeight: '500' as const,
  },
  themeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 12,
  },
  highscoreRow: {
    paddingVertical: 8,
  },
  highscoreLabel: {
    fontSize: 16,
    fontWeight: '500' as const,
  },
  resetButton: {
    marginTop: 16,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  settingInfo: {
    flex: 1,
  },
  settingSubtext: {
    fontSize: 12,
    marginTop: 4,
  },
  settingValue: {
    fontSize: 18,
    fontWeight: '600' as const,
  },
  purchaseButton: {
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  purchaseButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  restoreButton: {
    marginTop: 12,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  restoreButtonText: {
    fontSize: 14,
    fontWeight: '500' as const,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    marginBottom: 12,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  themeOptions: {
    gap: 12,
  },
  themeOption: {
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  themeEmoji: {
    fontSize: 24,
  },
  themeLabel: {
    fontSize: 18,
    fontWeight: '600' as const,
  },
});
