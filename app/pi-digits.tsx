import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowLeft, Hash, EyeOff } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSettings } from '@/contexts/SettingsContext';
import { PI_DIGITS } from '@/constants/pi';

export default function PiDigitsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useSettings();
  const [displayCount, setDisplayCount] = useState<string>('100');
  const [isKeyboardVisible, setIsKeyboardVisible] = useState<boolean>(false);

  const count = Math.min(parseInt(displayCount, 10) || 100, PI_DIGITS.length);
  const displayedDigits = PI_DIGITS.substring(0, count);

  const formatDigits = (digits: string) => {
    const formatted: string[] = [];
    for (let i = 0; i < digits.length; i += 10) {
      formatted.push(digits.substring(i, i + 10));
    }
    return formatted;
  };

  const formattedGroups = formatDigits(displayedDigits);

  return (
    <LinearGradient
      colors={[colors.background.start, colors.background.end]}
      style={styles.container}
    >
      <View style={[styles.safeArea, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <ArrowLeft color={colors.text.primary} size={24} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Sifrene i π</Text>
          <View style={styles.backButton} />
        </View>

        <View style={styles.content}>
          <View style={styles.controlSection}>
            <View style={styles.infoBox}>
              <Hash color={colors.text.primary} size={24} />
              <Text style={[styles.infoText, { color: colors.text.primary }]}>
                Viser {count} sifre av π
              </Text>
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.text.secondary }]}>
                Antall sifre:
              </Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={[styles.input, { color: colors.text.primary, borderColor: colors.text.secondary }]}
                  value={displayCount}
                  onChangeText={setDisplayCount}
                  onFocus={() => setIsKeyboardVisible(true)}
                  keyboardType="number-pad"
                  maxLength={4}
                  placeholder="100"
                  placeholderTextColor={colors.text.secondary}
                />
                {isKeyboardVisible && (
                  <TouchableOpacity
                    style={[styles.hideKeyboardButton, { backgroundColor: colors.button.primary }]}
                    onPress={() => {
                      Keyboard.dismiss();
                      setIsKeyboardVisible(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <EyeOff color={colors.button.primaryText} size={20} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>

          <ScrollView 
            style={styles.digitsContainer}
            showsVerticalScrollIndicator={true}
          >
            <View style={styles.digitsContent}>
              <Text style={[styles.piSymbol, { color: colors.text.primary }]}>π = </Text>
              {formattedGroups.map((group, index) => (
                <View key={index} style={styles.digitRow}>
                  <Text style={[styles.digitIndex, { color: colors.text.secondary }]}>
                    {(index * 10).toString().padStart(4, '0')}
                  </Text>
                  <Text style={[styles.digitGroup, { color: colors.text.primary }]}>
                    {group}
                  </Text>
                </View>
              ))}
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.text.secondary }]}>
              π (pi) er et irrasjonalt tall med uendelig mange desimaler
            </Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  controlSection: {
    marginBottom: 20,
    gap: 16,
  },
  infoBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  inputContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 16,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 16,
    fontWeight: '600' as const,
    minWidth: 80,
    textAlign: 'center',
    borderWidth: 1,
    flex: 1,
  },
  hideKeyboardButton: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  digitsContainer: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 16,
  },
  digitsContent: {
    gap: 8,
  },
  piSymbol: {
    fontSize: 20,
    fontWeight: '700' as const,
    marginBottom: 12,
  },
  digitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 4,
  },
  digitIndex: {
    fontSize: 14,
    fontWeight: '600' as const,
    fontFamily: 'monospace' as const,
    width: 40,
  },
  digitGroup: {
    fontSize: 18,
    fontWeight: '600' as const,
    fontFamily: 'monospace' as const,
    letterSpacing: 4,
  },
  footer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
