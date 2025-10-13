import { useEffect, useRef } from 'react';

type MusicTheme = 'pi' | 'colors' | 'numbers';

export function useBackgroundMusic(theme: MusicTheme, enabled: boolean = true) {
  useEffect(() => {
    console.log(`Background music ${enabled ? 'enabled' : 'disabled'} for theme: ${theme}`);
  }, [theme, enabled]);

  return useRef(null);
}
