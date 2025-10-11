import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { Audio } from 'expo-av';

type MusicTheme = 'pi' | 'colors' | 'numbers';

const MUSIC_URLS: Record<MusicTheme, string> = {
  pi: 'https://cdn.pixabay.com/audio/2022/03/10/audio_4a8f1b5a8e.mp3',
  colors: 'https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3',
  numbers: 'https://cdn.pixabay.com/audio/2022/03/24/audio_c8a7e1d2f0.mp3',
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
          },
          (status) => {
            if (status.isLoaded) {
              console.log(`Music loaded successfully for theme: ${theme}`);
            } else if (status.error) {
              console.error(`Error in playback status: ${status.error}`);
            }
          }
        );

        if (isMounted) {
          soundRef.current = sound;
          console.log(`Music playing for theme: ${theme}`);
        } else {
          await sound.unloadAsync();
        }
      } catch (error: any) {
        console.error('Error loading background music:', error);
        console.error('Error details:', {
          message: error?.message,
          code: error?.code,
          domain: error?.domain,
        });
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
