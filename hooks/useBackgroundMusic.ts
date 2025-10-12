import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { Audio } from 'expo-av';

type MusicTheme = 'pi' | 'colors' | 'numbers';

const MUSIC_URLS: Record<MusicTheme, string> = {
  pi: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  colors: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
  numbers: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
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
      if (isLoadingRef.current) return;

      if (globalSound && globalTheme === theme) {
        console.log(`Music already loaded for theme: ${theme}`);
        soundRef.current = globalSound;
        
        if (enabled) {
          try {
            const status = await globalSound.getStatusAsync();
            if (status.isLoaded && !status.isPlaying) {
              console.log(`Resuming music for theme: ${theme}`);
              await globalSound.playAsync();
            }
          } catch (err) {
            console.error('Error resuming sound:', err);
          }
        }
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

      if (!enabled) {
        console.log('Music disabled, not loading');
        return;
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
        console.log('Music error details:', error?.message || error);
      } finally {
        isLoadingRef.current = false;
      }
    };

    const stopMusic = async () => {
      if (globalSound) {
        try {
          const status = await globalSound.getStatusAsync();
          if (status.isLoaded && status.isPlaying) {
            console.log(`Pausing music for theme: ${globalTheme}`);
            await globalSound.pauseAsync();
          }
        } catch (err) {
          console.error('Error pausing sound:', err);
        }
      }
    };

    if (enabled) {
      loadAndPlayMusic();
    } else {
      stopMusic();
    }

    return () => {
      isMountedRef.current = false;
    };
  }, [theme, enabled]);

  return soundRef;
}
