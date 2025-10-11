import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Trophy, RotateCcw, ArrowLeft } from 'lucide-react-native';
import React, { useState, useEffect, useCallback, useRef } from 'react';
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

type GamePhase = 'showing' | 'input' | 'result';

export default function NumbersGameScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, gameConfig, updateBestScore, bestScores, hapticsEnabled } = useSettings();
  const [gamePhase, setGamePhase] = useState<GamePhase>('showing');
  const [currentLevel, setCurrentLevel] = useState<number>(1);
  const [sequence, setSequence] = useState<number[]>([]);
  const [userSequence, setUserSequence] = useState<number[]>([]);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showingIndex, setShowingIndex] = useState<number>(0);
  const [highlightedCell, setHighlightedCell] = useState<number | null>(null);

  const resultOpacity = useRef(new Animated.Value(0)).current;
  const shakeAnimation = useRef(new Animated.Value(0)).current;

  const gridSize = parseInt(gameConfig.gridSize.split('x')[0], 10);
  const totalCells = gridSize * gridSize;

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
        setTimeout(() => {
          setGamePhase('input');
          setShowingIndex(0);
        }, 500);
      }
    };

    showNextCell();
  }, [sequence, gameConfig.difficulty]);

  const startGame = useCallback(() => {
    console.log('Starting numbers game at level:', currentLevel);
    const newSequence = generateSequence(currentLevel);
    setSequence(newSequence);
    setUserSequence([]);
    setIsCorrect(null);
    setShowingIndex(0);
    setHighlightedCell(null);
    setGamePhase('showing');
  }, [currentLevel, generateSequence]);

  useEffect(() => {
    if (sequence.length === 0) {
      startGame();
    }
  }, []);

  useEffect(() => {
    if (gamePhase === 'showing' && sequence.length > 0) {
      showSequence();
    }
  }, [gamePhase, sequence, showSequence]);

  const checkAnswer = useCallback(() => {
    const correct = userSequence.length === sequence.length && 
                    userSequence.every((val, idx) => val === sequence[idx]);
    
    console.log('Checking answer:', { userSequence, sequence, correct });
    setIsCorrect(correct);

    if (correct) {
      const currentBest = bestScores.numbers[gameConfig.gridSize];
      if (currentLevel > currentBest) {
        updateBestScore('numbers', currentLevel, gameConfig.gridSize);
      }

      setGamePhase('result');
      Animated.timing(resultOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      setTimeout(() => {
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
      }, 1500);
    } else {
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
    }
  }, [userSequence, sequence, currentLevel, bestScores.numbers, gameConfig.gridSize, resultOpacity, shakeAnimation, updateBestScore, generateSequence]);

  const handleCellPress = useCallback((index: number) => {
    if (gamePhase !== 'input') return;
    
    if (hapticsEnabled && Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
      
      const currentBest = bestScores.numbers[gameConfig.gridSize];
      if (currentLevel > currentBest) {
        updateBestScore('numbers', currentLevel, gameConfig.gridSize);
      }

      setGamePhase('result');
      Animated.timing(resultOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      setTimeout(() => {
        nextLevel();
      }, 1500);
    }
  }, [gamePhase, userSequence, sequence, shakeAnimation, resultOpacity, bestScores.numbers, gameConfig.gridSize, currentLevel, updateBestScore, totalCells, hapticsEnabled]);

  const nextLevel = useCallback(() => {
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
                      backgroundColor: isHighlighted ? colors.button.primary : 'rgba(255, 255, 255, 0.2)',
                      opacity: gamePhase === 'showing' && !isHighlighted ? 0.5 : 1,
                      transform: [{ scale: isHighlighted ? 1.1 : 1 }],
                    },
                    isInUserSequence && styles.gridCellSelected,
                  ]}
                  onPress={() => handleCellPress(cellIndex)}
                  activeOpacity={0.7}
                  disabled={gamePhase !== 'input'}
                >
                  <Text style={[
                    styles.gridCellText, 
                    { color: isHighlighted ? colors.button.primaryText : colors.text.primary }
                  ]}>
                    {cellIndex + 1}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    );
  }, [gridSize, highlightedCell, userSequence, gamePhase, colors, handleCellPress]);

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
              {gamePhase === 'showing' ? 'Husk sekvensen...' : 'Trykk på tallene i riktig rekkefølge'}
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
                    Du husket {currentLevel} tall i riktig rekkefølge!
                  </Text>

                  <TouchableOpacity
                    style={[styles.continueButton, { backgroundColor: colors.button.primary }]}
                    onPress={nextLevel}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.continueButtonText, { color: colors.button.primaryText }]}>
                      Neste Nivå ({currentLevel + 1} tall)
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={styles.resultEmoji}>😔</Text>
                  <Text style={[styles.resultTitle, { color: colors.text.primary }]}>Feil!</Text>
                  <Text style={[styles.resultText, { color: colors.text.secondary }]}>
                    Du nådde nivå {currentLevel}
                  </Text>

                  {currentLevel > bestScores.numbers[gameConfig.gridSize] && (
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

const { width } = Dimensions.get('window');
const gridPadding = 48;
const gridGap = 12;

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
    width: (width - gridPadding - gridGap * 4) / 5,
    height: (width - gridPadding - gridGap * 4) / 5,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridCellText: {
    fontSize: 24,
    fontWeight: '700' as const,
  },
  gridCellSelected: {
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  instructionText: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 40,
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
  continueButton: {
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 32,
    minWidth: 200,
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '700' as const,
    textAlign: 'center',
  },
  restartButton: {
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  restartButtonText: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
});
