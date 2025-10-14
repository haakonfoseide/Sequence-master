import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, AppState, AppStateStatus } from 'react-native';
import { Audio as ExpoAudio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';

export type MusicTheme = 'pi' | 'colors' | 'numbers';

interface BackgroundMusicControls {
  play: () => Promise<void>;
  pause: () => Promise<void>;
  setVolume: (v: number) => Promise<void>;
}

const THEME_TRACKS: Record<MusicTheme, string> = {
  pi: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  colors: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
  numbers: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
};

const WEB_FALLBACK: string = 'https://cdn.jsdelivr.net/gh/anars/blank-audio/1-minute-of-silence.mp3';

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
  const soundRef = useRef<ExpoAudio.Sound | null>(null);
  type WebAudioEl = { loop: boolean; preload: string; volume: number; play: () => Promise<void>; pause: () => void; src: string };
  const htmlAudioRef = useRef<WebAudioEl | null>(null);
  const controlsRef = useRef<BackgroundMusicControls | null>(null);
  const appStateRef = useRef<AppStateStatus>('active');
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  const source = useMemo(() => THEME_TRACKS[theme] ?? THEME_TRACKS.pi, [theme]);

  useEffect(() => {
    let isMounted = true;

    const setupAsync = async () => {
      console.log('[Music] setup start. platform=', Platform.OS, 'enabled=', enabled, 'src=', source);
      try {
        if (Platform.OS !== 'web') {
          await ExpoAudio.setAudioModeAsync({
            allowsRecordingIOS: false,
            staysActiveInBackground: false,
            interruptionModeIOS: InterruptionModeIOS.DuckOthers,
            playsInSilentModeIOS: true,
            shouldDuckAndroid: true,
            interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
            playThroughEarpieceAndroid: false,
          });
        }
      } catch (e) {
        console.log('Audio mode setup failed', e);
      }

      try {
        if (Platform.OS === 'web') {
          if (htmlAudioRef.current) {
            try { htmlAudioRef.current.pause(); } catch {}
            htmlAudioRef.current = null;
          }
          const audioEl = (typeof window !== 'undefined' ? new (window as any).Audio(source) : null) as unknown as WebAudioEl;
          audioEl.loop = true;
          audioEl.preload = 'auto';
          audioEl.volume = 0.18;
          htmlAudioRef.current = audioEl;

          controlsRef.current = {
            play: async () => {
              try {
                const el = htmlAudioRef.current;
                if (!el) return;
                await el.play();
                console.log('Music playing (web audio element)');
              } catch (err: any) {
                console.log('Failed to play via HTMLAudioElement. Retrying with fallback...', err?.message ?? err);
                try {
                  if (htmlAudioRef.current) {
                    htmlAudioRef.current.src = WEB_FALLBACK;
                    await htmlAudioRef.current.play();
                    console.log('Fallback web audio started');
                  }
                } catch (err2) {
                  console.log('Fallback web audio failed', err2);
                }
              }
            },
            pause: async () => {
              try {
                htmlAudioRef.current?.pause();
              } catch (err) {
                console.log('Pause failed (web)', err);
              }
            },
            setVolume: async (v: number) => {
              try {
                if (htmlAudioRef.current) {
                  htmlAudioRef.current.volume = Math.min(1, Math.max(0, v));
                }
              } catch (err) {
                console.log('Set volume failed (web)', err);
              }
            },
          };
          latestControls = controlsRef.current;
        } else {
          if (soundRef.current) {
            await soundRef.current.unloadAsync().catch(() => {});
            soundRef.current = null;
          }

          const { sound } = await ExpoAudio.Sound.createAsync(
            { uri: source },
            { isLooping: true, volume: 0.18, shouldPlay: false }
          );
          if (!isMounted) {
            await sound.unloadAsync().catch(() => {});
            return;
          }
          sound.setOnPlaybackStatusUpdate((status) => {
            // @ts-expect-error narrowing for logs only
            console.log('[Music status]', status?.isLoaded, status?.isPlaying, status?.positionMillis);
          });
          soundRef.current = sound;

          controlsRef.current = {
            play: async () => {
              try {
                await ExpoAudio.setIsEnabledAsync(true);
                const s = soundRef.current;
                if (!s) return;
                const status = await s.getStatusAsync();
                if (status.isLoaded && !status.isPlaying) {
                  await s.playAsync();
                  console.log('Music started playing (native)');
                }
              } catch (err: any) {
                console.log('Failed to start background music (native):', err?.message ?? err);
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

          if (enabled) {
            await controlsRef.current.play();
          }
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
      try {
        if (Platform.OS === 'web') {
          if (htmlAudioRef.current) {
            htmlAudioRef.current.pause();
            htmlAudioRef.current.src = '';
            htmlAudioRef.current = null;
          }
        } else if (soundRef.current) {
          soundRef.current.unloadAsync().catch(() => {});
          soundRef.current = null;
        }
      } catch {}
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

      document.addEventListener('click', handleInteraction, { once: true } as AddEventListenerOptions);
      document.addEventListener('touchstart', handleInteraction, { once: true } as AddEventListenerOptions);

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
