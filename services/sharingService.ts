

export interface ChallengeData {
  mode: 'colors' | 'numbers' | 'pi';
  score: number;
  difficulty: string;
  gridSize?: string;
}

export async function shareChallenge(data: ChallengeData): Promise<void> {
  console.log('Share challenge called with:', data);
}

export async function shareScore(data: ChallengeData): Promise<void> {
  console.log('Share score called with:', data);
}
