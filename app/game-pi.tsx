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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSettings } from '@/contexts/SettingsContext';
import { PI_DIGITS } from '@/constants/pi';
import { useBackgroundMusic } from '@/hooks/useBackgroundMusic';
import { AD_BANNER_HEIGHT } from '@/components/AdBanner';

type GamePhase = 'showing' | 'input' | 'result';

type TimeoutRef = ReturnType<typeof setTimeout> | null;

export default function PiGameScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, gameConfig, updateBestScore, bestScores, musicEnabled, adsRemoved } = useSettings();
  
  useBackgroundMusic('pi', musicEnabled);
  const [gamePhase, setGamePhase] = useState<GamePhase>('showing');
  const [currentLevel, setCurrentLevel] = useState<number>(1);
  const [displayedDigit, setDisplayedDigit] = useState<string>('');
  const [userInput, setUserInput] = useState<string>('');
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showingIndex, setShowingIndex] = useState<number>(0);
  const [isNewRecord, setIsNewRecord] = useState<boolean>(false);

  const digitScale = useRef(new Animated.Value(1)).current;
  const resultOpacity = useRef(new Animated.Value(0)).current;
  const shakeAnimation = useRef(new Animated.Value(0)).current;

  const piMode = gameConfig.piMode || 'sequence';

  const timeoutsRef = useRef<TimeoutRef[]>([]);

  const clearAllTimeouts = useCallback(() => {
    timeoutsRef.current.forEach((t) => t && clearTimeout(t));
    timeoutsRef.current = [];
  }, []);

  const showSequence = useCallback(() => {
    clearAllTimeouts();
    let index = 0;
    const sequence = PI_DIGITS.substring(0, currentLevel);
    
    const speedConfig = {
      easy: 1000,
      normal: 800,
      hard: 600,
    };
    
    const showSpeed = speedConfig[gameConfig.difficulty];
    
    const showNextDigit = () => {
      if (index < sequence.length) {
        setDisplayedDigit(sequence[index]);
        setShowingIndex(index);
        
        Animated.sequence([
          Animated.timing(digitScale, {
            toValue: 1.2,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(digitScale, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
        ]).start();

        index++;
        const t = setTimeout(showNextDigit, showSpeed);
        timeoutsRef.current.push(t);
      } else {
        const t = setTimeout(() => {
          setGamePhase('input');
        }, showSpeed);
        timeoutsRef.current.push(t);
      }
    };

    showNextDigit();
  }, [currentLevel, digitScale, clearAllTimeouts, gameConfig.difficulty]);

  const startGame = useCallback(() => {
    console.log('Starting game at level:', currentLevel, 'mode:', piMode);
    setUserInput('');
    setIsCorrect(null);
    setShowingIndex(0);
    setIsNewRecord(false);
    
    if (piMode === 'sequence') {
      setGamePhase('showing');
      showSequence();
    } else {
      setGamePhase('input');
    }
  }, [currentLevel, showSequence, piMode]);

  useEffect(() => {
    try {
      startGame();
    } catch (error) {
      console.error('Error starting game:', error);
    }
    return () => {
      clearAllTimeouts();
    };
  }, [startGame, clearAllTimeouts]);

  const nextLevel = useCallback(() => {
    setCurrentLevel(prev => prev + 1);
    resultOpacity.setValue(0);
    startGame();
  }, [resultOpacity, startGame]);

  const checkAnswer = useCallback((input: string) => {
    const actualLength = piMode === 'free' ? input.length : currentLevel;
    const correctSequence = PI_DIGITS.substring(0, actualLength);
    const correct = input === correctSequence;
    
    console.log('Checking answer:', { input, correctSequence, correct, mode: piMode });
    setIsCorrect(correct);
    setGamePhase('result');

    if (correct) {
      const isRecord = piMode === 'sequence' 
        ? currentLevel > bestScores.pi
        : input.length > bestScores.piFree;
      
      setIsNewRecord(isRecord);

      Animated.timing(resultOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      if (piMode === 'sequence' && currentLevel > bestScores.pi) {
        updateBestScore('pi', currentLevel);
      } else if (piMode === 'free' && input.length > bestScores.piFree) {
        updateBestScore('piFree', input.length);
      }

      if (piMode === 'sequence') {
        setTimeout(() => {
          nextLevel();
        }, 1500);
      }
    } else {
      const actualScore = piMode === 'free' ? Math.max(0, input.length - 1) : currentLevel;
      const isRecord = piMode === 'sequence'
        ? actualScore > bestScores.pi
        : actualScore > bestScores.piFree;
      
      setIsNewRecord(isRecord);
      
      if (piMode === 'sequence' && actualScore > bestScores.pi) {
        updateBestScore('pi', actualScore);
      } else if (piMode === 'free' && actualScore > bestScores.piFree) {
        updateBestScore('piFree', actualScore);
      }
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
  }, [currentLevel, bestScores.pi, bestScores.piFree, resultOpacity, shakeAnimation, piMode, updateBestScore, nextLevel]);

  const handleNumberPress = useCallback((num: string) => {
    if (gamePhase !== 'input') return;
    
    const newInput = userInput + num;
    const currentIndex = userInput.length;
    
    if (piMode === 'free') {
      const correctDigit = PI_DIGITS[currentIndex];
      if (num !== correctDigit) {
        setUserInput(newInput);
        checkAnswer(newInput);
        return;
      }
      setUserInput(newInput);
      console.log('Correct! Current progress:', newInput.length, 'digits');
    } else {
      setUserInput(newInput);
      console.log('User input:', newInput, 'Expected:', PI_DIGITS.substring(0, currentLevel));
      if (newInput.length === currentLevel) {
        checkAnswer(newInput);
      }
    }
  }, [gamePhase, userInput, currentLevel, checkAnswer, piMode]);

  const handleBackspace = useCallback(() => {
    if (gamePhase !== 'input') return;
    setUserInput(prev => prev.slice(0, -1));
  }, [gamePhase]);

  useEffect(() => {
    const handleKeyPress = (e: any) => {
      try {
        if (gamePhase !== 'input') return;
        
        const key = e.key || e.nativeEvent?.key;
        if (!key) return;

        if (key >= '0' && key <= '9') {
          handleNumberPress(key);
        } else if (key === 'Backspace' || key === 'Delete') {
          handleBackspace();
        }
      } catch (error) {
        console.error('Error handling key press:', error);
      }
    };

    if (Platform.OS === 'web') {
      window.addEventListener('keydown', handleKeyPress);
      return () => window.removeEventListener('keydown', handleKeyPress);
    }
  }, [gamePhase, handleNumberPress, handleBackspace]);

  const restartGame = useCallback(() => {
    clearAllTimeouts();
    setCurrentLevel(1);
    resultOpacity.setValue(0);
    startGame();
  }, [resultOpacity, startGame, clearAllTimeouts]);

  const backToMenu = useCallback(() => {
    clearAllTimeouts();
    router.back();
  }, [router, clearAllTimeouts]);

  const renderNumberPad = useCallback(() => {
    const rows = [
      ['1', '2', '3'],
      ['4', '5', '6'],
      ['7', '8', '9'],
      ['←', '0', '⌫']
    ];
    
    return (
      <View style={styles.numberPad}>
        {rows.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.numberPadRow}>
            {row.map((item) => {
              const isBackspace = item === '←' || item === '⌫';
              const isEmpty = item === '←';
              
              if (isEmpty) {
                return <View key={item} style={styles.numberButton} />;
              }
              
              return (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.numberButton,
                    isBackspace && styles.backspaceButton
                  ]}
                  onPress={() => isBackspace ? handleBackspace() : handleNumberPress(item)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.numberButtonText, { color: colors.text.primary }]}>{item}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    );
  }, [colors.text.primary, handleBackspace, handleNumberPress]);

  const adBannerSpace = adsRemoved ? 0 : AD_BANNER_HEIGHT;

  return (
    <LinearGradient
      colors={[colors.background.start, colors.background.end]}
      style={styles.container}
    >
      <View style={[styles.safeArea, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + adBannerSpace }]}>
        {gamePhase === 'showing' && (
          <View style={styles.gameScreen}>
            <View style={styles.levelHeader}>
              <TouchableOpacity
                testID="pi-back-button"
                style={styles.backButton}
                onPress={backToMenu}
                activeOpacity={0.7}
              >
                <ArrowLeft color={colors.text.primary} size={24} />
              </TouchableOpacity>
              <Text style={[styles.levelText, { color: colors.text.primary }]}>{piMode === 'free' ? 'Pi' : `Nivå ${currentLevel}`}</Text>
              <Text style={[styles.progressText, { color: colors.text.secondary }]}>
                {showingIndex + 1} / {currentLevel}
              </Text>
            </View>

            <View style={styles.sequenceTopDisplay}>
              <Text style={[styles.sequenceTopText, { color: colors.text.primary }]}>
                {PI_DIGITS.substring(0, currentLevel)}
              </Text>
            </View>

            <View testID="pi-digit-display" style={styles.digitDisplay}>
              <Animated.View
                style={{
                  transform: [{ scale: digitScale }],
                }}
              >
                <Text style={[styles.digitText, { color: colors.digit.display }]}>
                  {displayedDigit}
                </Text>
              </Animated.View>
            </View>

            <Text style={[styles.watchText, { color: colors.text.secondary }]}>Husk sekvensen...</Text>


          </View>
        )}

        {gamePhase === 'input' && (
          <KeyboardAvoidingView 
            testID="pi-input-screen"
            style={styles.gameScreen}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={0}
          >
            <View style={styles.levelHeader}>
              <TouchableOpacity
                testID="pi-back-button"
                style={styles.backButton}
                onPress={backToMenu}
                activeOpacity={0.7}
              >
                <ArrowLeft color={colors.text.primary} size={24} />
              </TouchableOpacity>
              <Text style={[styles.levelText, { color: colors.text.primary }]}>{piMode === 'free' ? 'Pi' : `Nivå ${currentLevel}`}</Text>
              <View style={styles.placeholder} />
            </View>

            <View style={styles.inputDisplayCompact}>
              <Text style={[styles.inputLabel, { color: colors.text.secondary }]}>
                {piMode === 'sequence' ? 'Skriv inn sekvensen:' : 'Skriv inn π-sifrene:'}
              </Text>
              <Animated.View
                style={[
                  styles.inputBox,
                  {
                    transform: [{ translateX: shakeAnimation }],
                  },
                ]}
              >
                <Text style={[
                  styles.inputText, 
                  { 
                    color: colors.text.primary,
                    fontSize: piMode === 'free' && userInput.length > 10 
                      ? Math.max(10, 28 - Math.floor((userInput.length - 10) / 3) * 2)
                      : piMode === 'sequence' && userInput.length > 15
                      ? Math.max(12, 28 - Math.floor((userInput.length - 15) / 3) * 2)
                      : 28
                  }
                ]}>
                  {userInput || ' '}
                </Text>
                <Text style={[styles.inputProgress, { color: colors.text.secondary }]}>
                  {piMode === 'free' ? `${userInput.length} sifre` : `${userInput.length} / ${currentLevel}`}
                </Text>
              </Animated.View>
            </View>

            <View style={styles.flexSpacer} />

            <View testID="pi-number-pad" style={styles.numberPadContainer}>
              {renderNumberPad()}
            </View>
          </KeyboardAvoidingView>
        )}

        {gamePhase === 'result' && (
          <Animated.View
            testID="pi-result-screen"
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
                    {piMode === 'free' 
                      ? `Du husket ${userInput.length} sifre av π!`
                      : `Du husket ${currentLevel} sifre av π`
                    }
                  </Text>
                  
                  <View style={styles.sequenceDisplay}>
                    <Text style={[styles.sequenceLabel, { color: colors.text.secondary }]}>Sekvensen:</Text>
                    <Text style={[styles.sequenceText, { color: colors.text.primary }]}>
                      {piMode === 'free' 
                        ? PI_DIGITS.substring(0, userInput.length)
                        : PI_DIGITS.substring(0, currentLevel)
                      }
                    </Text>
                  </View>

                  {isNewRecord && (
                    <View style={styles.newRecordBadge}>
                      <Trophy color={colors.digit.correct} size={20} />
                      <Text style={[styles.newRecordText, { color: colors.digit.correct }]}>Ny Rekord!</Text>
                    </View>
                  )}

                  {piMode === 'sequence' ? (
                    <View style={styles.autoAdvanceContainer}>
                      <Text style={[styles.autoAdvanceText, { color: colors.text.secondary }]}>

                        Går videre automatisk...
                      </Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      testID="pi-restart-button"
                      style={[styles.restartButton, { backgroundColor: colors.button.primary }]}
                      onPress={restartGame}
                      activeOpacity={0.8}
                    >
                      <RotateCcw color={colors.button.primaryText} size={20} />
                      <Text style={[styles.restartButtonText, { color: colors.button.primaryText }]}>Prøv Igjen</Text>
                    </TouchableOpacity>
                  )}
                </>
              ) : (
                <>
                  <Text style={styles.resultEmoji}>😔</Text>
                  <Text style={[styles.resultTitle, { color: colors.text.primary }]}>Feil!</Text>
                  <Text style={[styles.resultText, { color: colors.text.secondary }]}>
                    {piMode === 'free'
                      ? `Du husket ${userInput.length - 1} sifre riktig`
                      : `Du nådde nivå ${currentLevel}`
                    }
                  </Text>
                  
                  <View style={styles.comparisonContainer}>
                    <View style={styles.comparisonBox}>
                      <Text style={[styles.comparisonLabel, { color: colors.text.secondary }]}>Ditt svar:</Text>
                      <Text style={[styles.comparisonText, { color: colors.digit.incorrect }]}>
                        {userInput}
                      </Text>
                    </View>
                    <View style={styles.comparisonBox}>
                      <Text style={[styles.comparisonLabel, { color: colors.text.secondary }]}>Riktig:</Text>
                      <Text style={[styles.comparisonText, { color: colors.digit.correct }]}>
                        {piMode === 'free'
                          ? PI_DIGITS.substring(0, userInput.length)
                          : PI_DIGITS.substring(0, currentLevel)
                        }
                      </Text>
                    </View>
                  </View>

                  {isNewRecord && (
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
const buttonSize = Math.min((width - 96) / 3, 75);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  placeholder: {
    width: 40,
    height: 40,
  },
  gameScreen: {
    flex: 1,
    paddingHorizontal: 24,
  },
  flexSpacer: {
    flex: 1,
    minHeight: 20,
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 20,
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
  digitDisplay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  digitText: {
    fontSize: 120,
    fontWeight: '800' as const,
  },
  watchText: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 40,
  },
  inputDisplay: {
    flex: 1,
    justifyContent: 'center',
  },
  inputDisplayCompact: {
    paddingTop: 12,
    paddingBottom: 8,
  },
  inputLabel: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 16,
  },
  inputBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputText: {
    fontWeight: '700' as const,
    letterSpacing: 2,
    textAlign: 'center',
    flexWrap: 'wrap',
  },
  inputProgress: {
    fontSize: 16,
    marginTop: 8,
  },
  numberPadContainer: {
    paddingBottom: 8,
  },
  numberPad: {
    alignItems: 'center',
    paddingVertical: 4,
  },

  numberPadRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 8,
  },
  numberButton: {
    width: buttonSize,
    height: buttonSize,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backspaceButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  numberButtonText: {
    fontSize: 24,
    fontWeight: '600' as const,
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
  sequenceDisplay: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    width: '100%',
  },
  sequenceLabel: {
    fontSize: 16,
    marginBottom: 8,
  },
  sequenceText: {
    fontSize: 24,
    fontWeight: '700' as const,
    letterSpacing: 2,
    textAlign: 'center',
  },
  comparisonContainer: {
    width: '100%',
    gap: 16,
    marginBottom: 32,
  },
  comparisonBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 16,
  },
  comparisonLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  comparisonText: {
    fontSize: 20,
    fontWeight: '700' as const,
    letterSpacing: 2,
    textAlign: 'center',
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
  autoAdvanceContainer: {
    paddingVertical: 18,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  autoAdvanceText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  sequenceTopDisplay: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  sequenceTopText: {
    fontSize: 24,
    fontWeight: '700' as const,
    letterSpacing: 4,
    textAlign: 'center',
  },
});
