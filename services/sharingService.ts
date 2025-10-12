import * as Sharing from 'expo-sharing';
import { Platform, Alert } from 'react-native';

export interface ChallengeData {
  mode: 'colors' | 'numbers' | 'pi';
  score: number;
  difficulty: string;
  gridSize?: string;
}

export async function shareChallenge(data: ChallengeData): Promise<void> {
  const modeNames = {
    colors: 'Farger',
    numbers: 'Tall',
    pi: 'Pi',
  };

  const message = `🎮 Jeg scoret ${data.score} i ${modeNames[data.mode]}-modus på Sequence Master! Kan du slå meg? 🏆`;

  try {
    if (Platform.OS === 'web') {
      if (navigator.share) {
        await navigator.share({
          title: 'Sequence Master Utfordring',
          text: message,
        });
      } else {
        await navigator.clipboard.writeText(message);
        Alert.alert('Kopiert!', 'Utfordringen er kopiert til utklippstavlen');
      }
    } else {
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        const tempMessage = `data:text/plain;base64,${btoa(message)}`;
        await Sharing.shareAsync(tempMessage, {
          dialogTitle: 'Utfordre venner',
        });
      } else {
        Alert.alert('Deling ikke tilgjengelig', 'Kan ikke dele på denne enheten');
      }
    }
  } catch (error) {
    console.error('Error sharing challenge:', error);
  }
}

export async function shareScore(data: ChallengeData): Promise<void> {
  const modeNames = {
    colors: 'Farger',
    numbers: 'Tall',
    pi: 'Pi',
  };

  const message = `🎮 Ny rekord i Sequence Master!\n\nModus: ${modeNames[data.mode]}\nScore: ${data.score}\n\nProver selv! 🏆`;

  try {
    if (Platform.OS === 'web') {
      if (navigator.share) {
        await navigator.share({
          title: 'Sequence Master Score',
          text: message,
        });
      } else {
        await navigator.clipboard.writeText(message);
        Alert.alert('Kopiert!', 'Scoren er kopiert til utklippstavlen');
      }
    } else {
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        const tempMessage = `data:text/plain;base64,${btoa(message)}`;
        await Sharing.shareAsync(tempMessage, {
          dialogTitle: 'Del score',
        });
      } else {
        Alert.alert('Deling ikke tilgjengelig', 'Kan ikke dele på denne enheten');
      }
    }
  } catch (error) {
    console.error('Error sharing score:', error);
  }
}
