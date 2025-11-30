import type { FontPairingSuggestion, TypographyRecommendation } from '../types';

const FONT_CATEGORIES: Record<string, { category: 'serif' | 'sans-serif' | 'mono'; compatible: string[] }> = {
  inter: { category: 'sans-serif', compatible: ['Merriweather', 'Source Serif Pro', 'IBM Plex Serif'] },
  roboto: { category: 'sans-serif', compatible: ['Roboto Slab', 'Lora', 'Spectral'] },
  poppins: { category: 'sans-serif', compatible: ['Cormorant', 'Literata', 'Fraunces'] },
  georgia: { category: 'serif', compatible: ['Inter', 'Roboto', 'Nunito'] },
  times: { category: 'serif', compatible: ['Helvetica', 'Work Sans', 'Space Grotesk'] },
};

const BRAND_NOTES: Record<string, string[]> = {
  modern: ['Favor geometric sans-serif pairings.', 'Leverage subtle gradients and lighter weights.'],
  classic: ['Prioritize high-contrast serif faces.', 'Consider small caps for headings.'],
  playful: ['Use rounded typefaces and larger letter spacing.', 'Emphasize color contrast and animation.'],
};

const PLATFORM_SIZE = {
  web: 16,
  mobile: 18,
  print: 12,
};

export function suggestFontPairings(baseFont: string): FontPairingSuggestion[] {
  const normalized = baseFont.toLowerCase();
  const profile = FONT_CATEGORIES[normalized];
  if (!profile) {
    return [
      {
        primary: baseFont,
        secondary: 'Georgia',
        contrast: 'high',
        remarks: 'Pairing fallback suggestion for unknown font. Combine serif + sans-serif for contrast.',
      },
    ];
  }

  return profile.compatible.map((secondary) => ({
    primary: capitalize(baseFont),
    secondary,
    contrast: profile.category === 'serif' ? 'medium' : 'high',
    remarks: `Balances ${profile.category} body text with ${secondary} for headings.`,
  }));
}

export function generateTypographyRecommendations(config: {
  baseFont: string;
  brandPersonality?: 'modern' | 'classic' | 'playful';
  platform?: 'web' | 'mobile' | 'print';
  audience?: 'children' | 'teen' | 'general' | 'professionals';
  readingDistance?: number;
}): TypographyRecommendation {
  const platformSize = PLATFORM_SIZE[config.platform ?? 'web'];
  const targetFontSize = Math.round(adjustForAudience(platformSize, config.audience));
  const lineHeight = config.audience === 'children' ? 1.8 : 1.6;
  const notes = [...(BRAND_NOTES[config.brandPersonality ?? 'modern'] ?? [])];

  if ((config.readingDistance ?? 50) > 60) {
    notes.push('Increase font size for longer reading distance.');
  }

  return {
    fontPairings: suggestFontPairings(config.baseFont),
    optimalLineHeight: parseFloat(lineHeight.toFixed(2)),
    targetFontSize,
    notes,
  };
}

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

function adjustForAudience(size: number, audience: string | undefined): number {
  switch (audience) {
    case 'children':
      return size * 1.25;
    case 'teen':
      return size * 1.1;
    case 'professionals':
      return size * 0.95;
    default:
      return size;
  }
}
