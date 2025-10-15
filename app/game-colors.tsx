import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Trophy, RotateCcw, ArrowLeft } from 'lucide-react-native';
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSettings } from '@/contexts/SettingsContext';
import { GRID_COLORS } from '@/constants/gridColors';
import { useBackgroundMusic } from '@/hooks/useBackgroundMusic';

type GamePhase = 'showing' | 'input' | 'result';

export default function ColorsGameScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, gameConfig, updateBestScore, bestScores, hapticsEnabled, musicEnabled } = useSettings();
  
  useBackgroundMusic('colors', musicEnabled);
  const [gamePhase, setGamePhase] = useState<GamePhase>('showing');
  const [currentLevel, setCurrentLevel] = useState<number>(1);
  const [sequence, setSequence] = useState<number[]>([]);
  const [userSequence, setUserSequence] = useState<number[]>([]);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showingIndex, setShowingIndex] = useState<number>(0);
  const [highlightedCell, setHighlightedCell] = useState<number | null>(null);

  const resultOpacity = useRef(new Animated.Value(0)).current;
  const shakeAnimation = useRef(new Animated.Value(0)).current;
  const nextLevelTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const gridSize = parseInt(gameConfig.gridSize.split('x')[0], 10);
  const totalCells = gridSize * gridSize;

  const gridColors = useMemo(() => {
    return GRID_COLORS.slice(0, totalCells);
  }, [totalCells]);

  const generateSequence = useCallback((length: number) => {
    const newSequence: number[] = [];
    for (let i = 0; i < length; i++) {
      newSequence.push(Math.floor(Math.random() * totalCells));
    }
    return newSequence;
  }, [totalCells]);

  const showSequence = useCallback(() => {
    let index = 0;
    
    const speedConfig = {
      easy: { show: 800, pause: 300 },
      normal: { show: 600, pause: 200 },
      hard: { show: 400, pause: 150 },
    };
    
    const speed = speedConfig[gameConfig.difficulty];
    
    const showNextCell = () => {
      if (index < sequence.length) {
        setHighlightedCell(sequence[index]);
        setShowingIndex(index + 1);
        
        setTimeout(() => {
          setHighlightedCell(null);
          index++;
          setTimeout(showNextCell, speed.pause);
        }, speed.show);
      } else {
        setGamePhase('input');
        setShowingIndex(0);
      }
    };

    showNextCell();
  }, [sequence, gameConfig.difficulty]);

  const startGame = useCallback(() => {
    console.log('Starting colors game at level:', currentLevel);
    const newSequence = generateSequence(currentLevel);
    setSequence(newSequence);
    setUserSequence([]);
    setIsCorrect(null);
    setShowingIndex(0);
    setHighlightedCell(null);
    setGamePhase('showing');
  }, [currentLevel, generateSequence]);

  useEffect(() => {
    try {
      if (sequence.length === 0) {
        startGame();
      }
    } catch (error) {
      console.error('Error starting game:', error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      if (gamePhase === 'showing' && sequence.length > 0) {
        showSequence();
      }
    } catch (error) {
      console.error('Error showing sequence:', error);
    }
  }, [gamePhase, sequence, showSequence]);

  const nextLevel = useCallback(() => {
    if (nextLevelTimeoutRef.current) {
      clearTimeout(nextLevelTimeoutRef.current);
      nextLevelTimeoutRef.current = null;
    }
    
    resultOpacity.setValue(0);
    setCurrentLevel(prev => prev + 1);
    const newElement = Math.floor(Math.random() * totalCells);
    const newSequence = [...sequence, newElement];
    setSequence(newSequence);
    setUserSequence([]);
    setIsCorrect(null);
    setShowingIndex(0);
    setHighlightedCell(null);
    setGamePhase('showing');
  }, [resultOpacity, sequence, totalCells]);

  const handleCellPress = useCallback((index: number) => {
    if (gamePhase !== 'input') return;
    
    if (hapticsEnabled && Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch((err: any) => {
          console.log('Haptics error:', err);
        });
      } catch (err) {
        console.log('Haptics sync error:', err);
      }
    }
    
    const newUserSequence = [...userSequence, index];
    setUserSequence(newUserSequence);
    
    const currentStep = newUserSequence.length - 1;
    if (newUserSequence[currentStep] !== sequence[currentStep]) {
      const correct = false;
      console.log('Wrong input detected:', { newUserSequence, sequence, correct });
      setIsCorrect(correct);
      setGamePhase('result');
      
      Animated.sequence([
        Animated.timing(shakeAnimation, {
          toValue: 10,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnimation, {
          toValue: -10,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnimation, {
          toValue: 10,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnimation, {
          toValue: 0,
          duration: 50,
          useNativeDriver: true,
        }),
      ]).start();

      Animated.timing(resultOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
      return;
    }
    
    if (newUserSequence.length === sequence.length) {
      const correct = true;
      console.log('Correct sequence completed:', { newUserSequence, sequence, correct });
      setIsCorrect(correct);
      
      const currentBest = bestScores.colors;
      if (currentLevel > currentBest) {
        updateBestScore('colors', currentLevel);
      }

      setGamePhase('result');
      Animated.timing(resultOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      nextLevelTimeoutRef.current = setTimeout(() => {
        nextLevel();
      }, 1500);
    }
  }, [gamePhase, userSequence, sequence, shakeAnimation, resultOpacity, bestScores.colors, currentLevel, updateBestScore, hapticsEnabled, nextLevel]);

  const restartGame = useCallback(() => {
    resultOpacity.setValue(0);
    setCurrentLevel(1);
    const newSequence = generateSequence(1);
    setSequence(newSequence);
    setUserSequence([]);
    setIsCorrect(null);
    setShowingIndex(0);
    setHighlightedCell(null);
    setGamePhase('showing');
  }, [resultOpacity, generateSequence]);

  const backToMenu = useCallback(() => {
    router.back();
  }, [router]);

  const renderGrid = useCallback(() => {
    const cellSize = getGridCellSize(gridSize);
    
    return (
      <View style={styles.grid}>
        {Array.from({ length: gridSize }).map((_, rowIndex) => (
          <View key={rowIndex} style={styles.gridRow}>
            {Array.from({ length: gridSize }).map((_, colIndex) => {
              const cellIndex = rowIndex * gridSize + colIndex;
              const isHighlighted = highlightedCell === cellIndex;
              const isInUserSequence = userSequence.includes(cellIndex);
              
              return (
                <TouchableOpacity
                  key={cellIndex}
                  style={[
                    styles.gridCell,
                    { 
                      width: cellSize,
                      height: cellSize,
                      backgroundColor: gridColors[cellIndex],
                    },
                    isInUserSequence && styles.gridCellSelected,
                    isHighlighted && styles.gridCellHighlighted,
                  ]}
                  onPress={() => handleCellPress(cellIndex)}
                  activeOpacity={0.7}
                  disabled={gamePhase !== 'input'}
                />
              );
            })}
          </View>
        ))}
      </View>
    );
  }, [gridSize, gridColors, highlightedCell, userSequence, gamePhase, handleCellPress]);

  return (
    <LinearGradient
      colors={[colors.background.start, colors.background.end]}
      style={styles.container}
    >
      <View style={[styles.safeArea, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}>
        {(gamePhase === 'showing' || gamePhase === 'input') && (
          <View style={styles.gameScreen}>
            <View style={styles.levelHeader}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={backToMenu}
                activeOpacity={0.7}
              >
                <ArrowLeft color={colors.text.primary} size={24} />
              </TouchableOpacity>
              <Text style={[styles.levelText, { color: colors.text.primary }]}>Nivå {currentLevel}</Text>
              <Text style={[styles.progressText, { color: colors.text.secondary }]}>
                {gamePhase === 'showing' ? `${showingIndex} / ${sequence.length}` : `${userSequence.length} / ${sequence.length}`}
              </Text>
            </View>

            <View style={styles.gridContainer}>
              {renderGrid()}
            </View>

            <Text style={[styles.instructionText, { color: colors.text.secondary }]}>
              {gamePhase === 'showing' ? 'Husk sekvensen...' : 'Trykk på fargene i riktig rekkefølge'}
            </Text>


          </View>
        )}

        {gamePhase === 'result' && (
          <Animated.View
            style={[
              styles.gameScreen,
              {
                opacity: resultOpacity,
              },
            ]}
          >
            <View style={styles.resultContainer}>
              {isCorrect ? (
                <>
                  <Text style={styles.resultEmoji}>🎉</Text>
                  <Text style={[styles.resultTitle, { color: colors.text.primary }]}>Perfekt!</Text>
                  <Text style={[styles.resultText, { color: colors.text.secondary }]}>
                    Du husket {currentLevel} farger i riktig rekkefølge!
                  </Text>

                  <View style={styles.autoAdvanceContainer}>
                    <Text style={[styles.autoAdvanceText, { color: colors.text.secondary }]}>
                      Går videre automatisk...
                    </Text>
                  </View>
                </>
              ) : (
                <>
                  <Text style={styles.resultEmoji}>😔</Text>
                  <Text style={[styles.resultTitle, { color: colors.text.primary }]}>Feil!</Text>
                  <Text style={[styles.resultText, { color: colors.text.secondary }]}>
                    Du nådde nivå {currentLevel}
                  </Text>

                  {currentLevel > bestScores.colors && (
                    <View style={styles.newRecordBadge}>
                      <Trophy color={colors.digit.correct} size={20} />
                      <Text style={[styles.newRecordText, { color: colors.digit.correct }]}>Ny Rekord!</Text>
                    </View>
                  )}

                  <TouchableOpacity
                    style={[styles.restartButton, { backgroundColor: colors.button.primary }]}
                    onPress={restartGame}
                    activeOpacity={0.8}
                  >
                    <RotateCcw color={colors.button.primaryText} size={20} />
                    <Text style={[styles.restartButtonText, { color: colors.button.primaryText }]}>Prøv Igjen</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </Animated.View>
        )}
      </View>
    </LinearGradient>
  );
}

const { width, height } = Dimensions.get('window');
const screenPadding = 48;
const gridGap = 8;

const getGridCellSize = (gridSize: number) => {
  const availableSpace = Math.min(width, height * 0.6);
  const totalGaps = (gridSize - 1) * gridGap;
  const cellSize = (availableSpace - screenPadding - totalGaps) / gridSize;
  return Math.floor(cellSize);
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  gameScreen: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 40,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  levelText: {
    fontSize: 24,
    fontWeight: '700' as const,
  },
  progressText: {
    fontSize: 18,
  },
  gridContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  grid: {
    gap: gridGap,
  },
  gridRow: {
    flexDirection: 'row',
    gap: gridGap,
  },
  gridCell: {
    borderRadius: 12,
  },
  gridCellSelected: {
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  gridCellHighlighted: {
    borderWidth: 6,
    borderColor: '#FFFFFF',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  },
  instructionText: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },

  resultContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 60,
  },
  resultEmoji: {
    fontSize: 80,
    marginBottom: 20,
  },
  resultTitle: {
    fontSize: 36,
    fontWeight: '800' as const,
    marginBottom: 8,
  },
  resultText: {
    fontSize: 18,
    marginBottom: 32,
  },
  newRecordBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 24,
  },
  newRecordText: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
  autoAdvanceContainer: {
    paddingVertical: 18,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  autoAdvanceText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  restartButton: {
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  restartButtonText: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
});
