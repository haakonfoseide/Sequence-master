import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react-native';
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSettings, GameMode, Difficulty, GridSize, PiMode } from '@/contexts/SettingsContext';

export default function ModeSelectScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, gameConfig, updateGameConfig } = useSettings();
  const [selectedMode, setSelectedMode] = useState<GameMode>(gameConfig.mode);
  const [piMode, setPiMode] = useState<PiMode>(gameConfig.piMode || 'sequence');
  const [difficulty, setDifficulty] = useState<Difficulty>(gameConfig.difficulty);
  const [gridSize, setGridSize] = useState<GridSize>(gameConfig.gridSize);
  const [showGridPicker, setShowGridPicker] = useState<boolean>(false);
  const [showPiModePicker, setShowPiModePicker] = useState<boolean>(false);

  useEffect(() => {
    setSelectedMode(gameConfig.mode);
    setPiMode(gameConfig.piMode || 'sequence');
    setDifficulty(gameConfig.difficulty);
    setGridSize(gameConfig.gridSize);
  }, [gameConfig]);

  const handleStart = () => {
    updateGameConfig({
      mode: selectedMode,
      piMode: selectedMode === 'pi' ? piMode : undefined,
      difficulty,
      gridSize,
    });

    if (selectedMode === 'pi') {
      if (piMode === 'learn') {
        router.push('/pi-digits');
      } else {
        router.push('/game-pi');
      }
    } else if (selectedMode === 'colors') {
      router.push('/game-colors');
    } else if (selectedMode === 'numbers') {
      router.push('/game-numbers');
    }
  };


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
            <Text style={[styles.backText, { color: colors.text.primary }]}>Back</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Sequence Master</Text>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Velg oppsett</Text>

          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.text.secondary }]}>MODUS</Text>
            <View style={styles.modeButtons}>
              <TouchableOpacity
                style={[
                  styles.modeButton,
                  selectedMode === 'colors' && styles.modeButtonActive,
                  { backgroundColor: 'rgba(255, 255, 255, 0.15)' }
                ]}
                onPress={() => setSelectedMode('colors')}
                activeOpacity={0.7}
              >
                <Text style={[styles.modeButtonText, { color: colors.text.primary }]}>Farger</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modeButton,
                  selectedMode === 'numbers' && styles.modeButtonActive,
                  { backgroundColor: 'rgba(255, 255, 255, 0.15)' }
                ]}
                onPress={() => setSelectedMode('numbers')}
                activeOpacity={0.7}
              >
                <Text style={[styles.modeButtonText, { color: colors.text.primary }]}>Tall</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modeButton,
                  selectedMode === 'pi' && styles.modeButtonActive,
                  { backgroundColor: 'rgba(255, 255, 255, 0.15)' }
                ]}
                onPress={() => setSelectedMode('pi')}
                activeOpacity={0.7}
              >
                <Text style={[styles.modeButtonText, { color: colors.text.primary }]}>Pi</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.text.secondary }]}>VANSKELIGHETSGRAD</Text>
            <View style={styles.modeButtons}>
              <TouchableOpacity
                style={[
                  styles.modeButton,
                  difficulty === 'easy' && styles.modeButtonActive,
                  { backgroundColor: 'rgba(255, 255, 255, 0.15)' }
                ]}
                onPress={() => setDifficulty('easy')}
                activeOpacity={0.7}
              >
                <Text style={[styles.modeButtonText, { color: colors.text.primary }]}>Lett</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modeButton,
                  difficulty === 'normal' && styles.modeButtonActive,
                  { backgroundColor: 'rgba(255, 255, 255, 0.15)' }
                ]}
                onPress={() => setDifficulty('normal')}
                activeOpacity={0.7}
              >
                <Text style={[styles.modeButtonText, { color: colors.text.primary }]}>Normal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modeButton,
                  difficulty === 'hard' && styles.modeButtonActive,
                  { backgroundColor: 'rgba(255, 255, 255, 0.15)' }
                ]}
                onPress={() => setDifficulty('hard')}
                activeOpacity={0.7}
              >
                <Text style={[styles.modeButtonText, { color: colors.text.primary }]}>Vanskelig</Text>
              </TouchableOpacity>
            </View>
          </View>

          {selectedMode === 'pi' && (
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.text.secondary }]}>PI MODUS</Text>
              <TouchableOpacity
                style={[styles.gridSelector, { backgroundColor: 'rgba(255, 255, 255, 0.15)' }]}
                onPress={() => setShowPiModePicker(!showPiModePicker)}
                activeOpacity={0.7}
              >
                <Text style={[styles.gridSelectorLabel, { color: colors.text.primary }]}>Type</Text>
                <View style={styles.gridSelectorRight}>
                  <Text style={[styles.gridSelectorValue, { color: colors.text.primary }]}>
                    {piMode === 'sequence' ? 'Frekvens' : piMode === 'free' ? 'Fritt' : 'Les og øv'}
                  </Text>
                  {showPiModePicker ? (
                    <ChevronUp color={colors.text.primary} size={20} />
                  ) : (
                    <ChevronDown color={colors.text.primary} size={20} />
                  )}
                </View>
              </TouchableOpacity>

              {showPiModePicker && (
                <View style={[styles.gridPicker, { backgroundColor: 'rgba(255, 255, 255, 0.1)' }]}>
                  {[
                    { value: 'sequence' as PiMode, label: 'Frekvens' },
                    { value: 'free' as PiMode, label: 'Fritt' },
                    { value: 'learn' as PiMode, label: 'Les og øv' }
                  ].map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.gridOption,
                        piMode === option.value && [styles.gridOptionActive, { backgroundColor: colors.button.primary }]
                      ]}
                      onPress={() => {
                        setPiMode(option.value);
                        setShowPiModePicker(false);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={[
                        styles.gridOptionText,
                        { color: piMode === option.value ? colors.button.primaryText : colors.text.primary }
                      ]}>
                        {option.label}
                      </Text>
                      {piMode === option.value && (
                        <Text style={[styles.checkmark, { color: colors.button.primaryText }]}>✓</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}

          {(selectedMode === 'colors' || selectedMode === 'numbers') && (
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.text.secondary }]}>RUTENETT</Text>
              <TouchableOpacity
                style={[styles.gridSelector, { backgroundColor: 'rgba(255, 255, 255, 0.15)' }]}
                onPress={() => setShowGridPicker(!showGridPicker)}
                activeOpacity={0.7}
              >
                <Text style={[styles.gridSelectorLabel, { color: colors.text.primary }]}>Størrelse</Text>
                <View style={styles.gridSelectorRight}>
                  <Text style={[styles.gridSelectorValue, { color: colors.text.primary }]}>{gridSize}</Text>
                  {showGridPicker ? (
                    <ChevronUp color={colors.text.primary} size={20} />
                  ) : (
                    <ChevronDown color={colors.text.primary} size={20} />
                  )}
                </View>
              </TouchableOpacity>

              {showGridPicker && (
                <View style={[styles.gridPicker, { backgroundColor: 'rgba(255, 255, 255, 0.1)' }]}>
                  {(['2x2', '3x3', '4x4', '5x5'] as GridSize[]).map((size) => (
                    <TouchableOpacity
                      key={size}
                      style={[
                        styles.gridOption,
                        gridSize === size && [styles.gridOptionActive, { backgroundColor: colors.button.primary }]
                      ]}
                      onPress={() => {
                        setGridSize(size);
                        setShowGridPicker(false);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={[
                        styles.gridOptionText,
                        { color: gridSize === size ? colors.button.primaryText : colors.text.primary }
                      ]}>
                        {size}
                      </Text>
                      {gridSize === size && (
                        <Text style={[styles.checkmark, { color: colors.button.primaryText }]}>✓</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}

          <TouchableOpacity
            style={[styles.startButton, { backgroundColor: colors.button.primary }]}
            onPress={handleStart}
            activeOpacity={0.8}
          >
            <Text style={[styles.startButtonText, { color: colors.button.primaryText }]}>Start</Text>
          </TouchableOpacity>
        </ScrollView>
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
  sectionTitle: {
    fontSize: 32,
    fontWeight: '700' as const,
    marginBottom: 32,
    textAlign: 'center',
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
  modeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modeButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  modeButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  modeButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  gridSelector: {
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gridSelectorLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  gridSelectorRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  gridSelectorValue: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  gridPicker: {
    borderRadius: 12,
    marginTop: 8,
    overflow: 'hidden',
  },
  gridOption: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gridOptionActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  gridOptionText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  checkmark: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
  startButton: {
    borderRadius: 16,
    paddingVertical: 20,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  startButtonText: {
    fontSize: 20,
    fontWeight: '700' as const,
  },
});
