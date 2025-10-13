import { Platform, Alert, Share } from 'react-native';

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
        try {
          await navigator.share({
            title: 'Sequence Master Utfordring',
            text: message,
          });
          console.log('Share successful');
        } catch (shareError: any) {
          if (shareError.name === 'NotAllowedError') {
            console.log('Share not allowed, falling back to clipboard');
            await navigator.clipboard.writeText(message);
            Alert.alert('Kopiert!', 'Utfordringen er kopiert til utklippstavlen');
          } else if (shareError.name === 'AbortError') {
            console.log('Share cancelled by user');
          } else {
            throw shareError;
          }
        }
      } else {
        await navigator.clipboard.writeText(message);
        Alert.alert('Kopiert!', 'Utfordringen er kopiert til utklippstavlen');
      }
    } else {
      try {
        await Share.share({
          message: message,
        });
      } catch (nativeError: any) {
        if (nativeError.code !== 'CANCELLED') {
          console.error('Native sharing error:', nativeError);
          Alert.alert('Feil', 'Kunne ikke dele utfordringen');
        }
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
        try {
          await navigator.share({
            title: 'Sequence Master Score',
            text: message,
          });
          console.log('Share successful');
        } catch (shareError: any) {
          if (shareError.name === 'NotAllowedError') {
            console.log('Share not allowed, falling back to clipboard');
            await navigator.clipboard.writeText(message);
            Alert.alert('Kopiert!', 'Scoren er kopiert til utklippstavlen');
          } else if (shareError.name === 'AbortError') {
            console.log('Share cancelled by user');
          } else {
            throw shareError;
          }
        }
      } else {
        await navigator.clipboard.writeText(message);
        Alert.alert('Kopiert!', 'Scoren er kopiert til utklippstavlen');
      }
    } else {
      try {
        await Share.share({
          message: message,
        });
      } catch (nativeError: any) {
        if (nativeError.code !== 'CANCELLED') {
          console.error('Native sharing error:', nativeError);
          Alert.alert('Feil', 'Kunne ikke dele scoren');
        }
      }
    }
  } catch (error) {
    console.error('Error sharing score:', error);
  }
}
