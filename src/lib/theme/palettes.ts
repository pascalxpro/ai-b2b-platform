export interface ColorPalette {
  id: string;
  name: string;
  nameZh: string;
  emoji: string;
  huePrimary: number;
  hueAccent: number;
  saturationBase?: number;
}

export const PALETTES: ColorPalette[] = [
  { id: 'amethyst', name: 'Amethyst', nameZh: '紫水晶', emoji: '🔮', huePrimary: 265, hueAccent: 35 },
  { id: 'ocean', name: 'Deep Ocean', nameZh: '深海藍', emoji: '🌊', huePrimary: 220, hueAccent: 170 },
  { id: 'emerald', name: 'Emerald', nameZh: '翡翠綠', emoji: '🌿', huePrimary: 160, hueAccent: 45 },
  { id: 'amber', name: 'Amber', nameZh: '琥珀金', emoji: '💎', huePrimary: 35, hueAccent: 265 },
  { id: 'rose', name: 'Rose', nameZh: '玫瑰紅', emoji: '🌹', huePrimary: 340, hueAccent: 210 },
  { id: 'slate', name: 'Slate', nameZh: '石板灰', emoji: '🪨', huePrimary: 215, hueAccent: 25, saturationBase: 30 },
  { id: 'sunset', name: 'Sunset', nameZh: '日落橙', emoji: '🌅', huePrimary: 20, hueAccent: 280 },
  { id: 'sakura', name: 'Sakura', nameZh: '櫻花粉', emoji: '🌸', huePrimary: 330, hueAccent: 180 },
];

export const DEFAULT_PALETTE = PALETTES[0];

export function getPaletteById(id: string): ColorPalette {
  return PALETTES.find((p) => p.id === id) || DEFAULT_PALETTE;
}
