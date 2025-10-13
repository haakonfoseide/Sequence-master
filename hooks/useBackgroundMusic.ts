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
    }).catch((err: any) => {
      console.log('Audio mode async error:', err?.message || err);
      throw err;
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
          try {
            const status = await globalSound.getStatusAsync().catch((err: any) => {
              console.log('Error getting status:', err);
              return { isLoaded: false, isPlaying: false };
            });
            if (status.isLoaded && !status.isPlaying) {
              console.log(`Resuming music for theme: ${theme}`);
              await globalSound.playAsync().catch((err: any) => {
                console.log('Error playing sound:', err);
              });
            }
          } catch (err) {
            console.log('Error resuming sound, will continue without music:', err);
          }
        }
        return;
      }

      if (globalSound && globalTheme !== theme) {
        console.log(`Stopping previous music (${globalTheme}) to play new theme: ${theme}`);
        try {
          await globalSound.unloadAsync().catch((err: any) => {
            console.log('Unload async error:', err);
          });
        } catch (err) {
          console.log('Error unloading previous sound:', err);
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

        await initializeAudioMode().catch(err => {
          console.log('Audio mode init failed, continuing:', err);
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
        ).catch((err: any) => {
          console.log('Failed to create sound:', err?.message || err);
          return { sound: null, status: { isLoaded: false } };
        });

        if (!status.isLoaded || !sound) {
          console.log('Audio not loaded, skipping music');
          return;
        }

        if (isMountedRef.current) {
          soundRef.current = sound;
          globalSound = sound;
          globalTheme = theme;
          console.log(`Music playing for theme: ${theme}`);
        } else {
          try {
            await sound.unloadAsync().catch(err => {
              console.log('Error unloading sound on unmount:', err);
            });
          } catch (unloadErr) {
            console.log('Error in unload catch:', unloadErr);
          }
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
          const status = await globalSound.getStatusAsync().catch(err => {
            console.log('Error getting sound status:', err);
            return { isLoaded: false, isPlaying: false };
          });
          if (status.isLoaded && status.isPlaying) {
            console.log(`Pausing music for theme: ${globalTheme}`);
            await globalSound.pauseAsync().catch(err => {
              console.log('Error pausing sound:', err);
            });
          }
        } catch (err) {
          console.log('Error pausing sound, will continue:', err);
        }
      }
    };

    if (enabled) {
      loadAndPlayMusic().catch(err => {
        console.log('Error in loadAndPlayMusic:', err);
      });
    } else {
      stopMusic().catch(err => {
        console.log('Error in stopMusic:', err);
      });
    }

    return () => {
      isMountedRef.current = false;
    };
  }, [theme, enabled]);

  return soundRef;
}
