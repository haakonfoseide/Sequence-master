import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, AppState, AppStateStatus } from 'react-native';
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';

export type MusicTheme = 'pi' | 'colors' | 'numbers';

interface BackgroundMusicControls {
  play: () => Promise<void>;
  pause: () => Promise<void>;
  setVolume: (v: number) => Promise<void>;
}

const THEME_TRACKS: Record<MusicTheme, string> = {
  // Royalty-free calm tracks hosted on Pixabay CDN
  // Fallback to the same gentle loop for all themes to keep experience consistent
  pi: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_6e6aab4b4e.mp3?filename=calm-ambient-110058.mp3',
  colors: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_6e6aab4b4e.mp3?filename=calm-ambient-110058.mp3',
  numbers: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_6e6aab4b4e.mp3?filename=calm-ambient-110058.mp3',
};

let latestControls: BackgroundMusicControls | null = null;

export function requestBackgroundMusicPlay() {
  if (latestControls) {
    latestControls.play().catch((err: any) => {
      console.log('Manual music start failed', err?.message ?? err);
    });
  } else {
    console.log('No background music controls available to start');
  }
}

export function useBackgroundMusic(theme: MusicTheme, enabled: boolean = true): React.MutableRefObject<BackgroundMusicControls | null> {
  const soundRef = useRef<Audio.Sound | null>(null);
  const controlsRef = useRef<BackgroundMusicControls | null>(null);
  const appStateRef = useRef<AppStateStatus>('active');
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  const source = useMemo(() => THEME_TRACKS[theme] ?? THEME_TRACKS.pi, [theme]);

  useEffect(() => {
    let isMounted = true;

    const setupAsync = async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: false,
          interruptionModeIOS: InterruptionModeIOS.DuckOthers,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
          playThroughEarpieceAndroid: false,
        });
      } catch (e) {
        console.log('Audio mode setup failed', e);
      }

      try {
        if (soundRef.current) {
          await soundRef.current.unloadAsync().catch(() => {});
          soundRef.current = null;
        }

        const { sound } = await Audio.Sound.createAsync(
          { uri: source },
          { isLooping: true, volume: 0.18, shouldPlay: false }
        );
        if (!isMounted) {
          await sound.unloadAsync().catch(() => {});
          return;
        }
        soundRef.current = sound;

        controlsRef.current = {
          play: async () => {
            try {
              if (soundRef.current) {
                await Audio.setIsEnabledAsync(true);
                const status = await soundRef.current.getStatusAsync();
                if (status.isLoaded && !status.isPlaying) {
                  await soundRef.current.playAsync();
                  console.log('Music started playing');
                }
              }
            } catch (err: any) {
              console.log('Failed to start background music:', err?.message ?? err);
            }
          },
          pause: async () => {
            try {
              if (soundRef.current) {
                await soundRef.current.pauseAsync();
              }
            } catch (err) {
              console.log('Failed to pause background music', err);
            }
          },
          setVolume: async (v: number) => {
            try {
              if (soundRef.current) {
                await soundRef.current.setVolumeAsync(Math.min(1, Math.max(0, v)));
              }
            } catch (err) {
              console.log('Failed to set volume', err);
            }
          },
        };
        latestControls = controlsRef.current;

        if (enabled && Platform.OS !== 'web') {
          await controlsRef.current.play();
        }
      } catch (e) {
        console.log('Failed to load background music', e);
      }
    };

    setupAsync();

    const onAppStateChange = async (nextState: AppStateStatus) => {
      appStateRef.current = nextState;
      if (nextState === 'active') {
        if (enabled) {
          await controlsRef.current?.play();
        }
      } else if (nextState.match(/inactive|background/)) {
        await controlsRef.current?.pause();
      }
    };

    const sub = AppState.addEventListener('change', onAppStateChange);

    return () => {
      isMounted = false;
      sub.remove();
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
        soundRef.current = null;
      }
      controlsRef.current = null;
      latestControls = null;
    };
  }, [source, enabled]);

  useEffect(() => {
    const applyEnabled = async () => {
      try {
        if (!controlsRef.current) return;
        if (enabled) {
          if (Platform.OS === 'web' && !hasUserInteracted) {
            console.log('Waiting for user interaction to start music on web');
            return;
          }
          await controlsRef.current.play();
        } else {
          await controlsRef.current.pause();
        }
      } catch (e) {
        console.log('Toggling music failed', e);
      }
    };
    applyEnabled();
  }, [enabled, hasUserInteracted]);

  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleInteraction = () => {
        setHasUserInteracted(true);
        if (enabled && controlsRef.current) {
          controlsRef.current.play().catch(err => {
            console.log('Failed to start music after interaction:', err);
          });
        }
      };

      document.addEventListener('click', handleInteraction, { once: true });
      document.addEventListener('touchstart', handleInteraction, { once: true });

      return () => {
        document.removeEventListener('click', handleInteraction);
        document.removeEventListener('touchstart', handleInteraction);
      };
    } else {
      setHasUserInteracted(true);
    }
  }, [enabled]);

  return controlsRef;
}
