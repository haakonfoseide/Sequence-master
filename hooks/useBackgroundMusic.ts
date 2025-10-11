import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { Audio } from 'expo-av';

type MusicTheme = 'pi' | 'colors' | 'numbers';

const MUSIC_URLS: Record<MusicTheme, string> = {
  pi: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  colors: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
  numbers: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
};

let globalSound: Audio.Sound | null = null;
let globalTheme: MusicTheme | null = null;

export function useBackgroundMusic(theme: MusicTheme, enabled: boolean = true) {
  const soundRef = useRef<Audio.Sound | null>(null);
  const isLoadingRef = useRef<boolean>(false);
  const isMountedRef = useRef<boolean>(true);

  useEffect(() => {
    if (Platform.OS === 'web') {
      console.log('Background music not supported on web');
      return;
    }

    isMountedRef.current = true;

    const loadAndPlayMusic = async () => {
      if (!enabled || isLoadingRef.current) return;

      if (globalSound && globalTheme === theme) {
        console.log(`Music already playing for theme: ${theme}`);
        soundRef.current = globalSound;
        return;
      }

      if (globalSound && globalTheme !== theme) {
        console.log(`Stopping previous music (${globalTheme}) to play new theme: ${theme}`);
        try {
          await globalSound.unloadAsync();
        } catch (err) {
          console.error('Error unloading previous sound:', err);
        }
        globalSound = null;
        globalTheme = null;
      }

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

        if (isMountedRef.current) {
          soundRef.current = sound;
          globalSound = sound;
          globalTheme = theme;
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
      isMountedRef.current = false;
      if (soundRef.current && soundRef.current === globalSound) {
        console.log(`Unloading music for theme: ${theme}`);
        soundRef.current.unloadAsync().catch((err) => 
          console.error('Error unloading sound:', err)
        );
        soundRef.current = null;
        globalSound = null;
        globalTheme = null;
      }
    };
  }, [theme, enabled]);

  return soundRef;
}
