import { create } from 'zustand';

export type ThemeMode = 'light' | 'dark' | 'system';

export type ColorScheme = {
  background: string;
  card: string;
  text: string;
  textSecondary: string;
  border: string;
  primary: string;
  primaryLight: string;
  secondary: string;
  accent: string;
  success: string;
  warning: string;
  error: string;
  inputBackground: string;
  headerBackground: string;
  gradientStart: string;
  gradientEnd: string;
};

export const lightColors: ColorScheme = {
  background: '#FFFFFF',
  card: '#FFFFFF',
  text: '#1a1a1a',
  textSecondary: '#666666',
  border: '#F3F4F6',
  primary: '#9d74f7',
  primaryLight: '#EEE6FF',
  secondary: '#06B6D4',
  accent: '#F59E0B',
  success: '#10B981',
  warning: '#F97316',
  error: '#EF4444',
  inputBackground: '#F9FAFB',
  headerBackground: '#FFFFFF',
  gradientStart: '#9d74f7',
  gradientEnd: '#EC4899',
};

export const darkColors: ColorScheme = {
  background: '#0F0F0F',
  card: '#1A1A1A',
  text: '#FFFFFF',
  textSecondary: '#A0A0A0',
  border: '#2A2A2A',
  primary: '#9d74f7',
  primaryLight: '#2D2145',
  secondary: '#22D3EE',
  accent: '#FBBF24',
  success: '#34D399',
  warning: '#FB923C',
  error: '#F87171',
  inputBackground: '#1F1F1F',
  headerBackground: '#1A1A1A',
  gradientStart: '#9d74f7',
  gradientEnd: '#F472B6',
};

interface ThemeState {
  themeMode: ThemeMode;
  isDarkMode: boolean;
  colors: ColorScheme;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  initTheme: () => void;
}

const getIsDarkMode = (mode: ThemeMode): boolean => {
  if (typeof window === 'undefined') return false;
  if (mode === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  return mode === 'dark';
};

const updateDOMTheme = (isDark: boolean) => {
  if (typeof window === 'undefined') return;
  const root = window.document.documentElement;
  if (isDark) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
};

export const useThemeStore = create<ThemeState>((set, get) => ({
  themeMode: 'light',
  isDarkMode: false,
  colors: lightColors,
  setThemeMode: (mode) => {
    localStorage.setItem('@nxtvibes_theme', mode);
    const isDark = getIsDarkMode(mode);
    updateDOMTheme(isDark);
    set({
      themeMode: mode,
      isDarkMode: isDark,
      colors: isDark ? darkColors : lightColors,
    });
  },
  toggleTheme: () => {
    const currentMode = get().themeMode;
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const currentEffectiveDark = currentMode === 'system' ? systemDark : currentMode === 'dark';
    const newMode: ThemeMode = currentEffectiveDark ? 'light' : 'dark';
    get().setThemeMode(newMode);
  },
  initTheme: () => {
    if (typeof window === 'undefined') return;
    const savedTheme = localStorage.getItem('@nxtvibes_theme') as ThemeMode | null;
    const initialMode: ThemeMode = savedTheme || 'light';
    const isDark = getIsDarkMode(initialMode);
    updateDOMTheme(isDark);
    set({
      themeMode: initialMode,
      isDarkMode: isDark,
      colors: isDark ? darkColors : lightColors,
    });

    // Listen to system changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = () => {
      const state = useThemeStore.getState();
      if (state.themeMode === 'system') {
        const isSystemDark = mediaQuery.matches;
        updateDOMTheme(isSystemDark);
        set({
          isDarkMode: isSystemDark,
          colors: isSystemDark ? darkColors : lightColors,
        });
      }
    };
    mediaQuery.addEventListener('change', listener);
  },
}));
