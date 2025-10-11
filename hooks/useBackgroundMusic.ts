import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { Audio } from 'expo-av';

type MusicTheme = 'pi' | 'colors' | 'numbers';

const MUSIC_URLS: Record<MusicTheme, string> = {
  pi: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  colors: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
  numbers: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
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

        const { sound, status } = await Audio.Sound.createAsync(
          { uri: MUSIC_URLS[theme] },
          { 
            shouldPlay: true, 
            isLooping: true,
            volume: 0.3,
          },
          (playbackStatus) => {
            if (playbackStatus.isLoaded) {
              console.log(`Music loaded successfully for theme: ${theme}`);
            }
          }
        );

        if (!status.isLoaded) {
          throw new Error('Failed to load audio');
        }

        if (isMounted) {
          soundRef.current = sound;
          console.log(`Music playing for theme: ${theme}`);
        } else {
          await sound.unloadAsync();
        }
      } catch (error: any) {
        console.log('Background music could not be loaded. Continuing without music.');
        if (__DEV__) {
          console.log('Music error details:', error?.message || error);
        }
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
