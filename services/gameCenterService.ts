import { Platform, Alert } from 'react-native';

export interface LeaderboardConfig {
  colors: string;
  numbers: string;
  pi: string;
}

const LEADERBOARD_IDS: LeaderboardConfig = {
  colors: 'com.sequencemaster.colors.leaderboard',
  numbers: 'com.sequencemaster.numbers.leaderboard',
  pi: 'com.sequencemaster.pi.leaderboard',
};

export async function initializeGameCenter(): Promise<boolean> {
  if (Platform.OS !== 'ios') {
    console.log('Game Center is only available on iOS');
    return false;
  }

  console.log('Game Center would be initialized here in a native build');
  return false;
}

export async function submitScore(
  mode: 'colors' | 'numbers' | 'pi',
  score: number
): Promise<void> {
  if (Platform.OS !== 'ios') {
    console.log('Game Center is only available on iOS');
    return;
  }

  console.log(`Would submit score ${score} to ${mode} leaderboard: ${LEADERBOARD_IDS[mode]}`);
}

export async function showLeaderboard(mode?: 'colors' | 'numbers' | 'pi'): Promise<void> {
  if (Platform.OS !== 'ios') {
    Alert.alert(
      'Game Center',
      'Game Center er kun tilgjengelig på iOS-enheter med en native build av appen.'
    );
    return;
  }

  console.log(`Would show leaderboard for ${mode || 'all modes'}`);
  Alert.alert(
    'Game Center',
    'Game Center krever en native build av appen. Denne funksjonen vil være tilgjengelig når appen er publisert.'
  );
}

export async function unlockAchievement(achievementId: string, percentComplete: number = 100): Promise<void> {
  if (Platform.OS !== 'ios') {
    console.log('Game Center is only available on iOS');
    return;
  }

  console.log(`Would unlock achievement ${achievementId} at ${percentComplete}%`);
}

export const ACHIEVEMENTS = {
  FIRST_WIN: 'com.sequencemaster.achievement.firstwin',
  SCORE_10: 'com.sequencemaster.achievement.score10',
  SCORE_20: 'com.sequencemaster.achievement.score20',
  SCORE_50: 'com.sequencemaster.achievement.score50',
  MASTER_ALL: 'com.sequencemaster.achievement.masterall',
};
