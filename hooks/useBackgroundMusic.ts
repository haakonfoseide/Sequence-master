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
let audioModeInitialized = false;

async function initializeAudioMode() {
  if (audioModeInitialized || Platform.OS === 'web') {
    return;
  }

  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });
    audioModeInitialized = true;
    console.log('Audio mode initialized successfully');
  } catch (error: any) {
    console.log('Could not initialize audio mode:', error?.message || error);
    audioModeInitialized = true;
  }
}

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
          const status = await globalSound.getStatusAsync();
          if (status.isLoaded && !status.isPlaying) {
            console.log(`Resuming music for theme: ${theme}`);
            await globalSound.playAsync();
          }
        }
        return;
      }

      if (globalSound && globalTheme !== theme) {
        console.log(`Stopping previous music (${globalTheme}) to play new theme: ${theme}`);
        await globalSound.unloadAsync();
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

        await initializeAudioMode();

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

        if (!status || !status.isLoaded || !sound) {
          console.log('Audio not loaded, skipping music');
          return;
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
        const status = await globalSound.getStatusAsync();
        if (status.isLoaded && status.isPlaying) {
          console.log(`Pausing music for theme: ${globalTheme}`);
          await globalSound.pauseAsync();
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
