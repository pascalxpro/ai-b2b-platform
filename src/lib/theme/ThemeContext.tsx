'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { ColorPalette, DEFAULT_PALETTE, getPaletteById } from './palettes';

export type ThemeMode = 'light' | 'dark';

export interface CustomHues {
  huePrimary: number;
  hueAccent: number;
}

export interface ThemeContextProps {
  theme: ThemeMode;
  palette: ColorPalette;
  customHues: CustomHues | null;
  setTheme: (theme: ThemeMode) => void;
  setPalette: (palette: ColorPalette) => void;
  setCustomHues: (hues: CustomHues | null) => void;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>('light');
  const [palette, setPaletteState] = useState<ColorPalette>(DEFAULT_PALETTE);
  const [customHues, setCustomHuesState] = useState<CustomHues | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('app-theme') as ThemeMode;
    const savedPaletteId = localStorage.getItem('app-palette');
    const savedCustomHues = localStorage.getItem('app-custom-hues');

    if (savedTheme) setThemeState(savedTheme);
    if (savedPaletteId) setPaletteState(getPaletteById(savedPaletteId));
    if (savedCustomHues) {
      try {
        setCustomHuesState(JSON.parse(savedCustomHues));
      } catch (e) {
        console.error('Failed to parse custom hues', e);
      }
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    const root = document.documentElement;
    root.classList.add('theme-transition');
    
    if (theme === 'dark') {
      root.setAttribute('data-theme', 'dark');
    } else {
      root.setAttribute('data-theme', 'light');
    }

    const primary = customHues ? customHues.huePrimary : palette.huePrimary;
    const accent = customHues ? customHues.hueAccent : palette.hueAccent;

    root.style.setProperty('--hue-primary', primary.toString());
    root.style.setProperty('--hue-accent', accent.toString());
    
    if (palette.saturationBase !== undefined) {
      root.style.setProperty('--saturation-base', `${palette.saturationBase}%`);
    } else {
      root.style.removeProperty('--saturation-base');
    }
    
    const timeout = setTimeout(() => {
      root.classList.remove('theme-transition');
    }, 300);
    
    return () => clearTimeout(timeout);
  }, [theme, palette, customHues, mounted]);

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    localStorage.setItem('app-theme', newTheme);
  };

  const setPalette = (newPalette: ColorPalette) => {
    setPaletteState(newPalette);
    localStorage.setItem('app-palette', newPalette.id);
  };

  const setCustomHues = (hues: CustomHues | null) => {
    setCustomHuesState(hues);
    if (hues) {
      localStorage.setItem('app-custom-hues', JSON.stringify(hues));
    } else {
      localStorage.removeItem('app-custom-hues');
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, palette, customHues, setTheme, setPalette, setCustomHues }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
