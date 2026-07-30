'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from '@/lib/theme/ThemeContext';
import { PALETTES } from '@/lib/theme/palettes';
import { Sun, Moon, Palette, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import styles from './ThemePalettePicker.module.css';

export function ThemePalettePicker() {
  const { theme, setTheme, palette, setPalette, customHues, setCustomHues } = useTheme();
  const [isCustomExpanded, setIsCustomExpanded] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null; // Avoid hydration mismatch on initial render
  }

  const activePrimary = customHues?.huePrimary ?? palette.huePrimary;
  const activeAccent = customHues?.hueAccent ?? palette.hueAccent;

  const handleCustomHueChange = (type: 'primary' | 'accent', value: number) => {
    if (!customHues) {
      setCustomHues({
        huePrimary: type === 'primary' ? value : palette.huePrimary,
        hueAccent: type === 'accent' ? value : palette.hueAccent,
      });
    } else {
      setCustomHues({
        ...customHues,
        [type === 'primary' ? 'huePrimary' : 'hueAccent']: value,
      });
    }
  };

  return (
    <div className={styles.pickerContainer}>
      {/* Theme Toggle */}
      <div className={styles.themeToggleRow}>
        <span className={styles.sectionTitle}>外觀主題</span>
        <div className={styles.toggleGroup}>
          <button
            className={`${styles.toggleButton} ${theme === 'light' ? styles.active : ''}`}
            onClick={() => setTheme('light')}
          >
            <Sun size={16} />
            <span>淺色</span>
          </button>
          <button
            className={`${styles.toggleButton} ${theme === 'dark' ? styles.active : ''}`}
            onClick={() => setTheme('dark')}
          >
            <Moon size={16} />
            <span>深色</span>
          </button>
        </div>
      </div>

      <div className={styles.divider} />

      {/* Palette Grid */}
      <div className={styles.paletteSection}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTitle}>色彩組合</span>
          <Palette size={16} className={styles.icon} />
        </div>
        <div className={styles.paletteGrid}>
          {PALETTES.map((p) => {
            const isSelected = !customHues && p.id === palette.id;
            return (
              <button
                key={p.id}
                className={`${styles.paletteCard} ${isSelected ? styles.selectedCard : ''}`}
                onClick={() => {
                  setPalette(p);
                  setCustomHues(null);
                }}
              >
                <div className={styles.paletteIconGroup}>
                  <span className={styles.emoji}>{p.emoji}</span>
                  <div
                    className={styles.colorCircle}
                    style={{ backgroundColor: `hsl(${p.huePrimary}, 80%, 50%)` }}
                  />
                </div>
                <span className={styles.paletteName}>{p.nameZh}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className={styles.divider} />

      {/* Custom Colors Section */}
      <div className={styles.customSection}>
        <button
          className={styles.customHeader}
          onClick={() => setIsCustomExpanded(!isCustomExpanded)}
        >
          <span className={styles.sectionTitle}>自訂色彩</span>
          {isCustomExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        
        {isCustomExpanded && (
          <div className={styles.customContent}>
            <div className={styles.sliderGroup}>
              <div className={styles.sliderHeader}>
                <span className={styles.sliderLabel}>主色調 (Primary)</span>
                <span className={styles.sliderValue}>{activePrimary}°</span>
              </div>
              <input
                type="range"
                min="0"
                max="360"
                value={activePrimary}
                onChange={(e) => handleCustomHueChange('primary', parseInt(e.target.value, 10))}
                className={styles.hueSlider}
              />
            </div>
            
            <div className={styles.sliderGroup}>
              <div className={styles.sliderHeader}>
                <span className={styles.sliderLabel}>輔助色 (Accent)</span>
                <span className={styles.sliderValue}>{activeAccent}°</span>
              </div>
              <input
                type="range"
                min="0"
                max="360"
                value={activeAccent}
                onChange={(e) => handleCustomHueChange('accent', parseInt(e.target.value, 10))}
                className={styles.hueSlider}
              />
            </div>

            <div className={styles.livePreview}>
              <div 
                className={styles.previewBox} 
                style={{ backgroundColor: `hsl(${activePrimary}, 80%, 50%)` }}
              >
                主色
              </div>
              <div 
                className={styles.previewBox} 
                style={{ backgroundColor: `hsl(${activeAccent}, 80%, 50%)` }}
              >
                輔助色
              </div>
            </div>

            <button
              className={styles.resetButton}
              onClick={() => setCustomHues(null)}
              disabled={!customHues}
            >
              <RotateCcw size={14} />
              <span>重設為預設值</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
