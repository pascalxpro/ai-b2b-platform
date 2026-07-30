'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  huePrimary: number;
  setHuePrimary: (hue: number) => void;
  hueAccent: number;
  setHueAccent: (hue: number) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>('dark');
  const [huePrimary, setHuePrimary] = useState(220); // Blue default
  const [hueAccent, setHueAccent] = useState(280);   // Purple default

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--hue-primary', huePrimary.toString());
    root.style.setProperty('--hue-accent', hueAccent.toString());
    
    // Apply baseline theme variables
    if (mode === 'dark') {
      root.style.setProperty('--color-background', '#0a0a0a');
      root.style.setProperty('--color-text-primary', '#ffffff');
      root.style.setProperty('--color-text-secondary', '#a1a1aa');
      root.style.setProperty('--color-border', 'rgba(255, 255, 255, 0.1)');
    } else {
      root.style.setProperty('--color-background', '#f4f4f5');
      root.style.setProperty('--color-text-primary', '#09090b');
      root.style.setProperty('--color-text-secondary', '#71717a');
      root.style.setProperty('--color-border', 'rgba(0, 0, 0, 0.1)');
    }
  }, [mode, huePrimary, hueAccent]);

  return (
    <ThemeContext.Provider value={{ mode, setMode, huePrimary, setHuePrimary, hueAccent, setHueAccent }}>
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
