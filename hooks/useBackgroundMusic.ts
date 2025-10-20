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
  pi: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3',
  colors: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3',
  numbers: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3',
};

const WEB_FALLBACK: string = 'https://cdn.jsdelivr.net/gh/anars/blank-audio/1-minute-of-silence.mp3';

let latestControls: BackgroundMusicControls | null = null;
let globalSoundRef: ExpoAudio.Sound | null = null;
let globalHtmlAudioRef: any | null = null;
let globalCurrentSource: string | null = null;
let isGlobalMusicInitialized = false;
let activeListenerCount = 0;

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
    activeListenerCount++;
    console.log('[Music] Active listener count:', activeListenerCount);

    const setupAsync = async () => {
      console.log('[Music] setup start. platform=', Platform.OS, 'enabled=', enabled, 'src=', source, 'initialized=', isGlobalMusicInitialized);
      
      if (isGlobalMusicInitialized && globalCurrentSource === source) {
        console.log('[Music] Using existing global music instance');
        soundRef.current = globalSoundRef;
        htmlAudioRef.current = globalHtmlAudioRef;
        
        controlsRef.current = {
          play: async () => {
            try {
              if (Platform.OS === 'web') {
                const el = globalHtmlAudioRef;
                if (!el) return;
                await el.play();
                console.log('Music playing (web audio element)');
              } else {
                await ExpoAudio.setIsEnabledAsync(true);
                const s = globalSoundRef;
                if (!s) return;
                const status = await s.getStatusAsync();
                if (status.isLoaded && !status.isPlaying) {
                  await s.playAsync();
                  console.log('Music started playing (native)');
                }
              }
            } catch (err: any) {
              console.log('Failed to play music:', err?.message ?? err);
            }
          },
          pause: async () => {
            try {
              if (Platform.OS === 'web') {
                globalHtmlAudioRef?.pause();
              } else if (globalSoundRef) {
                await globalSoundRef.pauseAsync();
              }
            } catch (err) {
              console.log('Failed to pause music', err);
            }
          },
          setVolume: async (v: number) => {
            try {
              if (Platform.OS === 'web') {
                if (globalHtmlAudioRef) {
                  globalHtmlAudioRef.volume = Math.min(1, Math.max(0, v));
                }
              } else if (globalSoundRef) {
                await globalSoundRef.setVolumeAsync(Math.min(1, Math.max(0, v)));
              }
            } catch (err) {
              console.log('Failed to set volume', err);
            }
          },
        };
        latestControls = controlsRef.current;
        return;
      }

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
          if (globalHtmlAudioRef && globalCurrentSource !== source) {
            try { globalHtmlAudioRef.pause(); } catch {}
            globalHtmlAudioRef = null;
          }
          
          if (!globalHtmlAudioRef) {
            const audioEl = (typeof window !== 'undefined' ? new (window as any).Audio(source) : null) as unknown as WebAudioEl;
            audioEl.loop = true;
            audioEl.preload = 'auto';
            audioEl.volume = 0.18;
            globalHtmlAudioRef = audioEl;
            htmlAudioRef.current = audioEl;
            globalCurrentSource = source;
          }

          controlsRef.current = {
            play: async () => {
              try {
                const el = globalHtmlAudioRef;
                if (!el) return;
                await el.play();
                console.log('Music playing (web audio element)');
              } catch (err: any) {
                console.log('Failed to play via HTMLAudioElement. Retrying with fallback...', err?.message ?? err);
                try {
                  if (globalHtmlAudioRef) {
                    globalHtmlAudioRef.src = WEB_FALLBACK;
                    await globalHtmlAudioRef.play();
                    console.log('Fallback web audio started');
                  }
                } catch (err2) {
                  console.log('Fallback web audio failed', err2);
                }
              }
            },
            pause: async () => {
              try {
                globalHtmlAudioRef?.pause();
              } catch (err) {
                console.log('Pause failed (web)', err);
              }
            },
            setVolume: async (v: number) => {
              try {
                if (globalHtmlAudioRef) {
                  globalHtmlAudioRef.volume = Math.min(1, Math.max(0, v));
                }
              } catch (err) {
                console.log('Set volume failed (web)', err);
              }
            },
          };
          latestControls = controlsRef.current;
          isGlobalMusicInitialized = true;
        } else {
          if (globalSoundRef && globalCurrentSource !== source) {
            await globalSoundRef.unloadAsync().catch(() => {});
            globalSoundRef = null;
          }

          if (!globalSoundRef) {
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
            globalSoundRef = sound;
            soundRef.current = sound;
            globalCurrentSource = source;
          }

          controlsRef.current = {
            play: async () => {
              try {
                await ExpoAudio.setIsEnabledAsync(true);
                const s = globalSoundRef;
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
                if (globalSoundRef) {
                  await globalSoundRef.pauseAsync();
                }
              } catch (err) {
                console.log('Failed to pause background music', err);
              }
            },
            setVolume: async (v: number) => {
              try {
                if (globalSoundRef) {
                  await globalSoundRef.setVolumeAsync(Math.min(1, Math.max(0, v)));
                }
              } catch (err) {
                console.log('Failed to set volume', err);
              }
            },
          };
          latestControls = controlsRef.current;
          isGlobalMusicInitialized = true;
        }
      } catch (e) {
        console.log('Failed to load background music', e);
      }
    };

    setupAsync().then(() => {
      if (enabled && controlsRef.current) {
        console.log('[Music] Starting music on mount (enabled=true)');
        controlsRef.current.play().catch(err => {
          console.log('Failed to start music on mount:', err);
        });
      } else {
        console.log('[Music] Music disabled on mount, not starting');
      }
    });

    const onAppStateChange = async (nextState: AppStateStatus) => {
      appStateRef.current = nextState;
      if (nextState === 'active') {
        if (enabled && controlsRef.current) {
          console.log('App became active, resuming music (if enabled)');
          await controlsRef.current.play();
        }
      } else if (nextState.match(/inactive|background/)) {
        if (controlsRef.current) {
          console.log('App became inactive, pausing music');
          await controlsRef.current.pause();
        }
      }
    };

    const sub = AppState.addEventListener('change', onAppStateChange);

    return () => {
      isMounted = false;
      activeListenerCount--;
      console.log('[Music] Active listener count on cleanup:', activeListenerCount);
      sub.remove();
      
      if (activeListenerCount === 0) {
        console.log('[Music] Last listener removed, cleaning up global music');
        try {
          if (Platform.OS === 'web') {
            if (globalHtmlAudioRef) {
              globalHtmlAudioRef.pause();
              globalHtmlAudioRef.src = '';
              globalHtmlAudioRef = null;
            }
          } else if (globalSoundRef) {
            globalSoundRef.unloadAsync().catch(() => {});
            globalSoundRef = null;
          }
        } catch {}
        globalCurrentSource = null;
        isGlobalMusicInitialized = false;
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
          console.log('Music enabled, starting playback...');
          await controlsRef.current.play();
        } else {
          console.log('Music disabled by user, pausing...');
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
          console.log('User interacted on web, starting music...');
          controlsRef.current.play().catch(err => {
            console.log('Failed to start music after interaction:', err);
          });
        } else {
          console.log('User interacted on web but music is disabled');
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
