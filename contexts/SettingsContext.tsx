import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback, useMemo } from 'react';

export type Theme = 'purple' | 'blue' | 'green' | 'orange' | 'pink' | 'red' | 'teal' | 'indigo';
export type GameMode = 'colors' | 'numbers' | 'pi';
export type PiMode = 'sequence' | 'free' | 'learn';
export type Difficulty = 'easy' | 'normal' | 'hard';
export type GridSize = '2x2' | '3x3' | '4x4' | '5x5';

export interface GameConfig {
  mode: GameMode;
  piMode?: PiMode;
  difficulty: Difficulty;
  gridSize: GridSize;
}

export interface BestScores {
  colors: number;
  numbers: number;
  pi: number;
  piFree: number;
}

export interface ThemeColors {
  background: {
    start: string;
    end: string;
  };
  digit: {
    display: string;
    correct: string;
    incorrect: string;
  };
  button: {
    primary: string;
    primaryText: string;
    secondary: string;
    secondaryText: string;
  };
  text: {
    primary: string;
    secondary: string;
  };
}

const THEMES: Record<Theme, ThemeColors> = {
  purple: {
    background: {
      start: '#9333EA',
      end: '#7C3AED',
    },
    digit: {
      display: '#FFFFFF',
      correct: '#10B981',
      incorrect: '#EF4444',
    },
    button: {
      primary: '#FFFFFF',
      primaryText: '#9333EA',
      secondary: 'rgba(255, 255, 255, 0.2)',
      secondaryText: '#FFFFFF',
    },
    text: {
      primary: '#FFFFFF',
      secondary: 'rgba(255, 255, 255, 0.8)',
    },
  },
  blue: {
    background: {
      start: '#0EA5E9',
      end: '#06B6D4',
    },
    digit: {
      display: '#FFFFFF',
      correct: '#10B981',
      incorrect: '#EF4444',
    },
    button: {
      primary: '#FFFFFF',
      primaryText: '#0EA5E9',
      secondary: 'rgba(255, 255, 255, 0.2)',
      secondaryText: '#FFFFFF',
    },
    text: {
      primary: '#FFFFFF',
      secondary: 'rgba(255, 255, 255, 0.8)',
    },
  },
  green: {
    background: {
      start: '#10B981',
      end: '#059669',
    },
    digit: {
      display: '#FFFFFF',
      correct: '#34D399',
      incorrect: '#EF4444',
    },
    button: {
      primary: '#FFFFFF',
      primaryText: '#10B981',
      secondary: 'rgba(255, 255, 255, 0.2)',
      secondaryText: '#FFFFFF',
    },
    text: {
      primary: '#FFFFFF',
      secondary: 'rgba(255, 255, 255, 0.8)',
    },
  },
  orange: {
    background: {
      start: '#F97316',
      end: '#EA580C',
    },
    digit: {
      display: '#FFFFFF',
      correct: '#10B981',
      incorrect: '#EF4444',
    },
    button: {
      primary: '#FFFFFF',
      primaryText: '#F97316',
      secondary: 'rgba(255, 255, 255, 0.2)',
      secondaryText: '#FFFFFF',
    },
    text: {
      primary: '#FFFFFF',
      secondary: 'rgba(255, 255, 255, 0.8)',
    },
  },
  pink: {
    background: {
      start: '#EC4899',
      end: '#DB2777',
    },
    digit: {
      display: '#FFFFFF',
      correct: '#10B981',
      incorrect: '#EF4444',
    },
    button: {
      primary: '#FFFFFF',
      primaryText: '#EC4899',
      secondary: 'rgba(255, 255, 255, 0.2)',
      secondaryText: '#FFFFFF',
    },
    text: {
      primary: '#FFFFFF',
      secondary: 'rgba(255, 255, 255, 0.8)',
    },
  },
  red: {
    background: {
      start: '#EF4444',
      end: '#DC2626',
    },
    digit: {
      display: '#FFFFFF',
      correct: '#10B981',
      incorrect: '#FCD34D',
    },
    button: {
      primary: '#FFFFFF',
      primaryText: '#EF4444',
      secondary: 'rgba(255, 255, 255, 0.2)',
      secondaryText: '#FFFFFF',
    },
    text: {
      primary: '#FFFFFF',
      secondary: 'rgba(255, 255, 255, 0.8)',
    },
  },
  teal: {
    background: {
      start: '#14B8A6',
      end: '#0D9488',
    },
    digit: {
      display: '#FFFFFF',
      correct: '#10B981',
      incorrect: '#EF4444',
    },
    button: {
      primary: '#FFFFFF',
      primaryText: '#14B8A6',
      secondary: 'rgba(255, 255, 255, 0.2)',
      secondaryText: '#FFFFFF',
    },
    text: {
      primary: '#FFFFFF',
      secondary: 'rgba(255, 255, 255, 0.8)',
    },
  },
  indigo: {
    background: {
      start: '#6366F1',
      end: '#4F46E5',
    },
    digit: {
      display: '#FFFFFF',
      correct: '#10B981',
      incorrect: '#EF4444',
    },
    button: {
      primary: '#FFFFFF',
      primaryText: '#6366F1',
      secondary: 'rgba(255, 255, 255, 0.2)',
      secondaryText: '#FFFFFF',
    },
    text: {
      primary: '#FFFFFF',
      secondary: 'rgba(255, 255, 255, 0.8)',
    },
  },
};

const SETTINGS_KEY = 'pi_game_settings';
const BEST_SCORES_KEY = 'sequence_master_best_scores';
const AD_REMOVAL_KEY = 'sequence_master_ad_removal';

const DEFAULT_BEST_SCORES: BestScores = {
  colors: 0,
  numbers: 0,
  pi: 0,
  piFree: 0,
};

export const [SettingsProvider, useSettings] = createContextHook(() => {
  const [theme, setTheme] = useState<Theme>('orange');
  const [musicEnabled, setMusicEnabled] = useState<boolean>(true);
  const [hapticsEnabled, setHapticsEnabled] = useState<boolean>(true);
  const [adsRemoved, setAdsRemoved] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [gameConfig, setGameConfig] = useState<GameConfig>({
    mode: 'pi',
    piMode: 'sequence',
    difficulty: 'normal',
    gridSize: '3x3',
  });
  const [bestScores, setBestScores] = useState<BestScores>(DEFAULT_BEST_SCORES);

  useEffect(() => {
    loadSettings();
    loadBestScores();
    loadAdRemovalStatus();
  }, []);

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem(SETTINGS_KEY);
      if (stored) {
        try {
          const settings = JSON.parse(stored);
          if (settings && typeof settings === 'object') {
            setTheme(settings.theme || 'orange');
            setMusicEnabled(settings.musicEnabled ?? true);
            setHapticsEnabled(settings.hapticsEnabled ?? true);
          } else {
            throw new Error('Invalid settings format');
          }
        } catch (parseError) {
          console.error('Failed to parse settings, resetting to defaults:', parseError);
          await AsyncStorage.removeItem(SETTINGS_KEY);
          setTheme('orange');
          setMusicEnabled(true);
          setHapticsEnabled(true);
        }
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadBestScores = async () => {
    try {
      const stored = await AsyncStorage.getItem(BEST_SCORES_KEY);
      if (stored) {
        try {
          const scores = JSON.parse(stored);
          if (scores && typeof scores === 'object' && 
              typeof scores.colors === 'number' && 
              typeof scores.numbers === 'number' && 
              typeof scores.pi === 'number') {
            setBestScores({
              ...DEFAULT_BEST_SCORES,
              ...scores,
            });
          } else {
            console.log('Invalid best scores structure, resetting to defaults');
            await AsyncStorage.removeItem(BEST_SCORES_KEY);
            setBestScores(DEFAULT_BEST_SCORES);
          }
        } catch (parseError) {
          console.error('Failed to parse best scores, resetting to defaults:', parseError);
          await AsyncStorage.removeItem(BEST_SCORES_KEY);
          setBestScores(DEFAULT_BEST_SCORES);
        }
      }
    } catch (error) {
      console.error('Failed to load best scores:', error);
    }
  };

  const saveSettings = async (newTheme: Theme, newMusicEnabled: boolean, newHapticsEnabled: boolean) => {
    try {
      await AsyncStorage.setItem(
        SETTINGS_KEY,
        JSON.stringify({ theme: newTheme, musicEnabled: newMusicEnabled, hapticsEnabled: newHapticsEnabled })
      );
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  const updateTheme = useCallback((newTheme: Theme) => {
    setTheme(newTheme);
    saveSettings(newTheme, musicEnabled, hapticsEnabled);
  }, [musicEnabled, hapticsEnabled]);

  const toggleMusic = useCallback(() => {
    const newValue = !musicEnabled;
    setMusicEnabled(newValue);
    saveSettings(theme, newValue, hapticsEnabled);
  }, [musicEnabled, theme, hapticsEnabled]);

  const toggleHaptics = useCallback(() => {
    const newValue = !hapticsEnabled;
    setHapticsEnabled(newValue);
    saveSettings(theme, musicEnabled, newValue);
  }, [hapticsEnabled, theme, musicEnabled]);

  const updateGameConfig = useCallback((config: Partial<GameConfig>) => {
    setGameConfig(prev => ({ ...prev, ...config }));
  }, []);

  const updateBestScore = useCallback(async (mode: GameMode | 'piFree', score: number) => {
    setBestScores(prev => {
      const newScores = { ...prev };
      if (score > newScores[mode as keyof BestScores]) {
        newScores[mode as keyof BestScores] = score;
      }
      AsyncStorage.setItem(BEST_SCORES_KEY, JSON.stringify(newScores)).catch(error => {
        console.error('Failed to save best scores:', error);
      });
      return newScores;
    });
  }, []);

  const resetBestScores = useCallback(async () => {
    setBestScores(DEFAULT_BEST_SCORES);
    try {
      await AsyncStorage.setItem(BEST_SCORES_KEY, JSON.stringify(DEFAULT_BEST_SCORES));
    } catch (error) {
      console.error('Failed to reset best scores:', error);
    }
  }, []);

  const loadAdRemovalStatus = async () => {
    try {
      const stored = await AsyncStorage.getItem(AD_REMOVAL_KEY);
      if (stored) {
        setAdsRemoved(stored === 'true');
      }
    } catch (error) {
      console.error('Failed to load ad removal status:', error);
    }
  };

  const setAdRemovalStatus = useCallback(async (removed: boolean) => {
    setAdsRemoved(removed);
    try {
      await AsyncStorage.setItem(AD_REMOVAL_KEY, removed ? 'true' : 'false');
    } catch (error) {
      console.error('Failed to save ad removal status:', error);
    }
  }, []);

  const colors = THEMES[theme] || THEMES.orange;

  return useMemo(() => ({
    theme,
    musicEnabled,
    hapticsEnabled,
    adsRemoved,
    colors,
    isLoading,
    gameConfig,
    bestScores,
    updateTheme,
    toggleMusic,
    toggleHaptics,
    updateGameConfig,
    updateBestScore,
    resetBestScores,
    setAdRemovalStatus,
  }), [theme, musicEnabled, hapticsEnabled, adsRemoved, colors, isLoading, gameConfig, bestScores, updateTheme, toggleMusic, toggleHaptics, updateGameConfig, updateBestScore, resetBestScores, setAdRemovalStatus]);
});
