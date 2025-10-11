import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { Audio } from 'expo-av';

type MusicTheme = 'pi' | 'colors' | 'numbers';

const MUSIC_URLS: Record<MusicTheme, string> = {
  pi: 'https://assets.mixkit.co/music/preview/mixkit-tech-house-vibes-130.mp3',
  colors: 'https://assets.mixkit.co/music/preview/mixkit-dreaming-big-31.mp3',
  numbers: 'https://assets.mixkit.co/music/preview/mixkit-games-worldbeat-466.mp3',
};

export function useBackgroundMusic(theme: MusicTheme, enabled: boolean = true) {
  const soundRef = useRef<Audio.Sound | null>(null);
  const isLoadingRef = useRef<boolean>(false);

  useEffect(() => {
    if (Platform.OS === 'web') {
      console.log('Background music not supported on web');
      return;
    }

    let isMounted = true;

    const loadAndPlayMusic = async () => {
      if (!enabled || isLoadingRef.current) return;

      try {
        isLoadingRef.current = true;
        console.log(`Loading music for theme: ${theme}`);

        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
        });

        const { sound } = await Audio.Sound.createAsync(
          { uri: MUSIC_URLS[theme] },
          { 
            shouldPlay: true, 
            isLooping: true,
            volume: 0.3,
          }
        );

        if (isMounted) {
          soundRef.current = sound;
          console.log(`Music loaded and playing for theme: ${theme}`);
        } else {
          await sound.unloadAsync();
        }
      } catch (error) {
        console.error('Error loading background music:', error);
      } finally {
        isLoadingRef.current = false;
      }
    };

    loadAndPlayMusic();

    return () => {
      isMounted = false;
      if (soundRef.current) {
        console.log(`Unloading music for theme: ${theme}`);
        soundRef.current.unloadAsync().catch((err) => 
          console.error('Error unloading sound:', err)
        );
        soundRef.current = null;
      }
    };
  }, [theme, enabled]);

  return soundRef;
}
