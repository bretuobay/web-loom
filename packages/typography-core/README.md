# @web-loom/typography-core

Minimal client-side typography, color manipulation, and text animation library for modern web applications.

## Overview

`@web-loom/typography-core` provides utilities for theming, color operations, and text animations. It's framework-agnostic, lightweight, and built with TypeScript for type safety.

## Installation

```bash
npm install @web-loom/typography-core
```

## Features

- **Theme Management**: Create and manage configurable themes with colors, typography, and brand colors
- **Typography Calculations**: Generate modular scales, fluid type clamp expressions, vertical rhythm maps, and text measurements
- **Design-System Integration**: Consume `@web-loom/design-core` tokens and generate typography presets instantly
- **Web Font Management**: Load, preload, and validate fonts with performance-aware utilities
- **Accessibility Presets**: Dyslexia-friendly adjustments, low-vision sizing, and motion-safe fallbacks
- **Readability Analytics**: Reading time, readability scores, and structural metrics
- **Font Performance**: Character subset planning and transfer saving estimations
- **Typography Math**: Golden ratio scaling and optical sizing helpers
- **Advanced Text Animations**: Morph text, run RSVP speed reading flows, and animate variable fonts
- **Reading Experience**: Guided reading highlights and focus assistance overlays
- **Multilingual Support**: Locale-aware typography adjustments plus RTL utilities
- **3D Typography Effects**: Apply perspective transforms and continuously animate depth
- **AI Typography Assistant**: Suggest smart font pairings and optimization hints for each platform
- **Typography Experiments**: Run lightweight A/B tests to compare type stacks
- **Cross-Platform Scaling**: Generate React Native typography tokens and pixel-ratio aware sizing
- **Color Utilities**: Lighten, darken, and compare colors with perceptual accuracy
- **Color Similarity**: Advanced color comparison using RGB, HSL, and LAB color spaces
- **Text Animations**: Typewriter, fade-in, character reveal, and scale animations using Web Animations API
- **Zero Dependencies**: Lightweight with no external dependencies
- **Type-Safe**: Full TypeScript support

## Core APIs

### Theme Management

Create a theme with typography and color configuration:

```typescript
import { createTheme } from '@web-loom/typography-core';

const theme = createTheme({
  fontSize: {
    sm: '0.875rem',
    md: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
  },
  color: {
    textDark: '#1a1a1a',
    textLight: '#ffffff',
    background: '#f5f5f5',
    surface: '#ffffff',
  },
  brandColors: {
    primary: '#007bff',
    secondary: '#6c757d',
    accent: '#17a2b8',
  },
  typography: {
    fontFamily: 'Inter, system-ui, sans-serif',
    fontWeights: { normal: 400, medium: 500, bold: 700 },
    lineHeights: { tight: 1.25, normal: 1.5, loose: 1.75 },
    letterSpacing: { tight: '-0.05em', normal: '0', wide: '0.05em' },
  },
});

// Access theme values
const primaryColor = theme.getBrandColor('primary'); // '#007bff'
const fontSize = theme.getFontSize('lg'); // '1.125rem'
const textColor = theme.getColor('textDark'); // '#1a1a1a'

// Update theme
theme.setTheme(newThemeConfig);

// Get entire theme
const currentTheme = theme.getTheme();
```

### Color Manipulation

#### Lighten and Darken

```typescript
import { lighten, darken } from '@web-loom/typography-core';

const lightBlue = lighten('#007bff', 20); // Lighten by 20%
const darkBlue = darken('#007bff', 30); // Darken by 30%
```

#### Color Similarity

Compare colors using different color spaces for perceptual accuracy:

```typescript
import {
  areHexColorsSimilar,
  getHexColorSimilarityPercentage,
  findMostSimilarHexColor,
} from '@web-loom/typography-core';

// Basic similarity check
const similar = areHexColorsSimilar('#FF0000', '#FE0000', {
  threshold: 5, // 0-100 scale
  colorSpace: 'rgb', // 'rgb', 'hsl', or 'lab'
});

// LAB color space for perceptual accuracy
const perceptual = areHexColorsSimilar('#FF0000', '#FE0000', {
  threshold: 10,
  colorSpace: 'lab', // Best for human perception
});

// Get exact similarity percentage
const similarity = getHexColorSimilarityPercentage('#FF0000', '#FE0000', 'lab');
console.log(`Colors are ${similarity}% similar`);

// Find closest match in a palette
const closest = findMostSimilarHexColor('#FF5733', ['#FF0000', '#00FF00', '#0000FF', '#FF6666']);
console.log(closest); // { color: '#FF6666', similarity: 85.2, index: 3 }
```

#### RGB Color Operations

```typescript
import {
  areColorsSimilar,
  hexToRGB,
  rgbToHSL,
  rgbToLAB,
  getColorSimilarityPercentage,
} from '@web-loom/typography-core';

// Convert hex to RGB
const rgb = hexToRGB('#FF5733'); // [255, 87, 51]

// Convert RGB to HSL
const hsl = rgbToHSL([255, 87, 51]); // [9, 100, 60]

// Convert RGB to LAB (perceptually uniform)
const lab = rgbToLAB([255, 87, 51]); // [58.2, 61.4, 51.7]

// Compare RGB colors
const similar = areColorsSimilar([255, 0, 0], [254, 0, 0], {
  threshold: 10,
  colorSpace: 'lab',
});

// Get similarity percentage
const similarity = getColorSimilarityPercentage([255, 0, 0], [254, 0, 0], 'lab');
```

### Typography Calculations

Unlock the advanced typography utilities introduced in Phase 1 of the refactor:

```typescript
import {
  calculateCharactersPerLine,
  calculateOptimalLineHeight,
  createFluidType,
  generateModularScale,
  generateVerticalRhythm,
  measureText,
} from '@web-loom/typography-core';

const scale = generateModularScale(16, 1.2, 3);
const fluidHeading = createFluidType(20, 40, 320, 1440); // clamp() expression
const optimalLineHeight = calculateOptimalLineHeight(16, 'body');
const rhythm = generateVerticalRhythm(24, [0.5, 1, 2]);
const charactersPerLine = calculateCharactersPerLine(16, 640, 'Inter');
const metrics = measureText('Refine reading experience', 18, 'Inter');
```

Each helper returns pure data and formatted CSS friendly strings so you can plug the output directly into CSS-in-JS, style objects, or build-time token transforms.

### Accessibility Helpers

```typescript
import { adjustForLowVision, optimizeForDyslexia, respectMotionPreferences } from '@web-loom/typography-core';

const dyslexiaPreset = optimizeForDyslexia({ baseFontSize: 18 });
const visionSupport = adjustForLowVision(16, { severity: 'moderate', prefersHighContrast: true });
const safeAnimations = respectMotionPreferences([{ name: 'typewriter', duration: 1200 }]);
```

Use these presets to drive theme overrides or user preferences while honoring reduced-motion settings automatically.

### Readability & Analytics

```typescript
import {
  analyzeTextContent,
  calculateReadingTime,
  generateContentInsights,
  getReadabilityScore,
} from '@web-loom/typography-core';

const sample = 'Great typography boosts comprehension and delight.';
const metrics = analyzeTextContent(sample);
const readingTime = calculateReadingTime(sample, 250);
const readability = getReadabilityScore(sample);
const insights = generateContentInsights(sample, 18);
```

These helpers make it easy to surface editorial dashboards, highlight difficult passages, and tailor layouts for your audience.

### Font Performance

```typescript
import { estimateFontTransferSavings, generateFontSubset, planFontSubsets } from '@web-loom/typography-core';

const subset = generateFontSubset('Hero Headline – 2025 Edition');
const plans = planFontSubsets([{ text: 'Headlines' }, { text: 'Body copy with multilingual content' }]);
const savings = estimateFontTransferSavings(120, subset.uniqueGlyphs, 1200);
```

Produce unicode ranges, subset strings, and transfer savings estimates for build pipelines or design handoffs.

### Typography Math

```typescript
import {
  applyGoldenRatio,
  calculateOpticalSize,
  createOpticalSizeRamp,
  generateGoldenScale,
} from '@web-loom/typography-core';

const goldenHeading = applyGoldenRatio(24);
const goldenScale = generateGoldenScale(16, 3);
const opticalSize = calculateOpticalSize(16, 55, 240);
const opticalRamp = createOpticalSizeRamp(16);
```

Golden ratio helpers keep typographic scales harmonious, while optical sizing compensates for viewing distance and pixel density.

### Advanced Animations

```typescript
import { animateVariableFont, createSpeedReading, morphText } from '@web-loom/typography-core';

const morphController = morphText(element, 'Read deeply', 'Write boldly', { duration: 1200 });
const speedReading = createSpeedReading(longformContent, { wordsPerMinute: 450, target: readerElement });
const variableFont = animateVariableFont(element, [
  { settings: { wght: 400, wdth: 100 } },
  { settings: { wght: 700, wdth: 110 }, duration: 600 },
]);
```

### 3D Typography Effects

```typescript
import { animate3DText, apply3DTextEffect } from '@web-loom/typography-core';

const effect = apply3DTextEffect(titleElement, { depth: 30, rotateX: 18, rotateY: -10 });
const rotation = animate3DText(titleElement, { duration: 1800 });
```

Layer perspective text shadows, rotate on both axis, and optionally animate the element for futuristic hero treatments.

### Reading Experience

```typescript
import { createFocusAssist, createGuidedReading } from '@web-loom/typography-core';

const guided = createGuidedReading(articleElement, { interval: 2000, loop: false });
const focusAssist = createFocusAssist(articleElement, { highlightColor: 'rgba(255,255,0,0.15)' });

guided.start();
focusAssist.enable();
```

These helpers power guided reading overlays, RSVP flows, and focus tracking interactions.

### Multilingual & Language Tools

```typescript
import { adaptTypographyForLocale, applyRTLSupport, detectLanguage, extractKeywords } from '@web-loom/typography-core';

const languageInfo = detectLanguage(bodyCopy);
const keywords = extractKeywords(bodyCopy);
const typography = adaptTypographyForLocale('ar-EG');
applyRTLSupport(document.documentElement, 'ar-EG');
```

Automatically detect scripts, keep RTL layouts correct, and derive locale-specific typography presets for high quality international experiences.

### AI Typography Assistant

```typescript
import { generateTypographyRecommendations, suggestFontPairings } from '@web-loom/typography-core';

const pairings = suggestFontPairings('Inter');
const recommendations = generateTypographyRecommendations({
  baseFont: 'Poppins',
  brandPersonality: 'modern',
  platform: 'web',
  audience: 'general',
});
```

Use heuristics to select complementary font stacks, determine platform-specific sizes, and surface brand-specific adjustments.

### Typography Experiments

```typescript
import {
  createTypographyExperiment,
  recordTypographyInteraction,
  getTypographyExperimentResults,
} from '@web-loom/typography-core';

const experiment = createTypographyExperiment('Hero Headline', [
  { id: 'a', label: 'Sans', fontFamily: 'Inter', fontSize: 36, lineHeight: 1.25 },
  { id: 'b', label: 'Serif', fontFamily: 'Fraunces', fontSize: 38, lineHeight: 1.3 },
]);

recordTypographyInteraction(experiment, 'a', 'impression');
recordTypographyInteraction(experiment, 'a', 'conversion');
const results = getTypographyExperimentResults(experiment);
```

Track impressions and conversions for each variant and compute conversion rates for data-informed typography choices.

### Cross-Platform Typography

```typescript
import {
  createNativeTypographyPreset,
  createReactNativeTypography,
  scaleFontForDevice,
} from '@web-loom/typography-core';

const rnBody = createReactNativeTypography('Inter', { baseFontSize: 17, platform: 'android' });
const rnHeading = createNativeTypographyPreset('heading', 'Poppins', { baseFontSize: 18 });
const scaled = scaleFontForDevice(16, 3); // => 24
```

Generate React Native friendly tokens, create named presets, and adapt sizes per device pixel ratio for consistent mobile typography.

### Use Case Playbook

**Editorial QA Dashboards**

```typescript
import {
  analyzeTextContent,
  calculateReadingTime,
  getReadabilityScore,
  suggestFontPairings,
} from '@web-loom/typography-core';

const metrics = analyzeTextContent(articleCopy);
const readingTime = calculateReadingTime(articleCopy, 275);
const readability = getReadabilityScore(articleCopy);
const pairingOptions = suggestFontPairings('Poppins');
```

- Surface readability regressions before launch
- Recommend type pairings that match editorial intent
- Export data into CMS dashboards or Slack alerts

**Immersive Landing Pages**

```typescript
import {
  animate3DText,
  animateVariableFont,
  apply3DTextEffect,
  createGuidedReading,
  morphText,
} from '@web-loom/typography-core';

const effect = apply3DTextEffect(heroTitle, { depth: 40 });
const loop = animate3DText(heroTitle, { duration: 2200 });
const morph = morphText(subTitle, 'Design clarity', 'Deliver delight');
const guided = createGuidedReading(featureList, { interval: 1800 });
```

- Build futuristic hero messaging without WebGL
- Morph supporting copy to highlight benefits
- Guide users through dense sections with timed highlights

**Data-Driven Typography Experiments**

```typescript
import {
  createTypographyExperiment,
  generateTypographyRecommendations,
  getTypographyExperimentResults,
  recordTypographyInteraction,
} from '@web-loom/typography-core';

const experiment = createTypographyExperiment('Pricing Headline', [
  { id: 'a', label: 'Sans', fontFamily: 'Inter', fontSize: 40, lineHeight: 1.15 },
  { id: 'b', label: 'Serif', fontFamily: 'Fraunces', fontSize: 42, lineHeight: 1.2 },
]);

const recs = generateTypographyRecommendations({ baseFont: 'Inter', platform: 'web', audience: 'professionals' });

recordTypographyInteraction(experiment, 'a', 'impression');
recordTypographyInteraction(experiment, 'a', 'conversion');

const results = getTypographyExperimentResults(experiment);
```

- Spin up A/B tests without third-party tooling
- Capture conversion rates per type stack
- Feed outcomes back into recommendation engines

**Cross-Platform Product Teams**

```typescript
import {
  adaptTypographyForLocale,
  createNativeTypographyPreset,
  createReactNativeTypography,
  isRTLLocale,
  scaleFontForDevice,
} from '@web-loom/typography-core';

const localeTokens = adaptTypographyForLocale(currentLocale);
const rnBody = createReactNativeTypography(localeTokens.fontFamily, { baseFontSize: 16 * localeTokens.lineHeight });
const rnHeading = createNativeTypographyPreset('heading', localeTokens.fontFamily, { baseFontSize: 20 });
const scaledFont = scaleFontForDevice(16, 3);
const direction = isRTLLocale(currentLocale) ? 'rtl' : 'ltr';
```

- Keep web and native typography in sync using shared config
- Handle RTL, locale-specific fonts, and pixel-ratio scaling with one toolkit
- Ship consistent reading experiences across React Native, Next.js, and documentation

### Strategic Alignment

- **Product Requirements Document**: `packages/typography-core/Product Requirements Document.md` describes the package scope, goals, and module breakdown that match the feature sections above.
- **GAP Analysis**: `packages/typography-core/GAP_ANALYSIS.md` tracks the four delivery phases. The status table at the top mirrors the rollout referenced throughout this README.

### Design-Core Integration

Bridge design tokens from `@web-loom/design-core` into actionable typography data:

```typescript
import { consumeDesignTokens, createThemeFromDesignCore, generatePresetsFromTokens } from '@web-loom/typography-core';

// `tokens` is the resolved design token object produced by @web-loom/design-core
const tokens = await loadDesignCoreTokensSomehow();
const typographyConfig = consumeDesignTokens(tokens);
const presets = generatePresetsFromTokens(tokens);
const snapshot = createThemeFromDesignCore({ name: 'light', tokens });
```

You get normalized font families, numeric scales, fluid typography clamps, and validation feedback without reimplementing token parsing.

### Web Font Management

Manage fonts with the provided high-level helpers:

```typescript
import {
  detectFontFeatures,
  loadWebFont,
  optimizeFontLoading,
  preloadFonts,
  validateFontSupport,
} from '@web-loom/typography-core';

preloadFonts([{ href: '/fonts/Inter-Variable.woff2', type: 'font/woff2' }]);
const loadResult = await loadWebFont({
  family: 'Inter',
  sources: [{ url: '/fonts/Inter-Variable.woff2', format: 'woff2' }],
});
const validation = validateFontSupport({ family: 'Inter', formats: ['woff2'], weights: ['400', '700'] });
const features = detectFontFeatures('Inter');
const strategy = optimizeFontLoading('critical');
```

The utilities gracefully degrade when the FontFace API is unavailable, making them safe for SSR and unit tests.

### Text Animations

Animate text with the Web Animations API:

```typescript
import { animateText } from '@web-loom/typography-core';

const element = document.querySelector('.animated-text');

// Typewriter animation
const controller = animateText(element, 'typewriter', {
  speed: 100, // ms per character
  cursor: true,
  cursorChar: '|',
  cursorBlink: true,
  onComplete: () => console.log('Done!'),
});

// Character reveal with stagger
animateText(element, 'character', {
  duration: 800,
  stagger: 50, // ms delay between characters
  randomDelay: false,
  easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
});

// Fade in from direction
animateText(element, 'fadein', {
  from: 'bottom', // 'top', 'bottom', 'left', 'right'
  distance: '30px',
  duration: 1200,
  easing: 'ease-out',
});

// Scale animation
animateText(element, 'scale', {
  duration: 1000,
  easing: 'ease-in-out',
  iterations: 1,
});

// Control animation
controller.play();
controller.pause();
controller.reverse();
controller.cancel();
controller.finish();

// Wait for completion
await controller.finished;
```

#### Animation Options

```typescript
interface AnimationOptions {
  // Timing
  duration?: number; // Animation duration in ms
  delay?: number; // Delay before animation starts
  easing?: string; // CSS easing function
  iterations?: number; // Number of times to repeat

  // Playback
  direction?: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse';
  fillMode?: 'none' | 'forwards' | 'backwards' | 'both';
  pauseOnHover?: boolean;

  // Callbacks
  onStart?: () => void;
  onComplete?: () => void;

  // Typewriter specific
  speed?: number; // ms per character
  cursor?: boolean;
  cursorChar?: string;
  cursorBlink?: boolean;

  // Fade/slide specific
  from?: 'top' | 'bottom' | 'left' | 'right';
  distance?: string;

  // Character animation specific
  stagger?: number; // ms delay between characters
  randomDelay?: boolean;
}
```

## Usage Examples

### Theme with Dynamic Updates

```typescript
const theme = createTheme({
  fontSize: { sm: '14px', md: '16px', lg: '18px', xl: '24px', '2xl': '32px' },
  color: {
    textDark: '#2c3e50',
    textLight: '#ecf0f1',
    background: '#ffffff',
    surface: '#f8f9fa',
  },
  brandColors: {
    primary: '#3498db',
    secondary: '#95a5a6',
  },
});

// Apply theme to elements
document.body.style.backgroundColor = theme.getColor('background');
document.body.style.color = theme.getColor('textDark');
document.body.style.fontSize = theme.getFontSize('md');

// Dark mode toggle
function toggleDarkMode() {
  const current = theme.getTheme();
  theme.setTheme({
    ...current,
    color: {
      ...current.color,
      textDark: '#ecf0f1',
      textLight: '#2c3e50',
      background: '#2c3e50',
      surface: '#34495e',
    },
  });
}
```

### Color Palette Matching

```typescript
import { findMostSimilarHexColor, getHexColorSimilarityPercentage } from '@web-loom/typography-core';

// Brand color palette
const brandPalette = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#FFA07A', // Orange
  '#98D8C8', // Mint
];

// Find closest brand color to user input
const userColor = '#FF5555';
const match = findMostSimilarHexColor(userColor, brandPalette, 'lab');

console.log(`Closest brand color: ${match.color}`);
console.log(`Similarity: ${match.similarity}%`);

// Use in design system
if (match.similarity < 80) {
  console.warn('User color differs significantly from brand palette');
}
```

### Animated Landing Page

```typescript
import { animateText } from '@web-loom/typography-core';

// Animate heading with typewriter
const heading = document.querySelector('.hero-heading');
const headingCtrl = animateText(heading, 'typewriter', {
  speed: 80,
  cursor: true,
  onComplete: () => {
    // Animate subheading after heading completes
    const subheading = document.querySelector('.hero-subheading');
    animateText(subheading, 'fadein', {
      from: 'bottom',
      distance: '20px',
      duration: 800,
    });
  },
});

// Animate feature cards with stagger
document.querySelectorAll('.feature-card').forEach((card, index) => {
  animateText(card, 'character', {
    delay: index * 200,
    stagger: 30,
    duration: 600,
  });
});
```

### Accessibility-Friendly Color Contrast

```typescript
import { lighten, darken, getHexColorSimilarityPercentage } from '@web-loom/typography-core';

function ensureContrast(bgColor: string, textColor: string): string {
  const similarity = getHexColorSimilarityPercentage(bgColor, textColor, 'lab');

  // If colors are too similar, adjust text color
  if (similarity > 70) {
    // Try darkening first
    let adjusted = darken(textColor, 50);
    let newSimilarity = getHexColorSimilarityPercentage(bgColor, adjusted, 'lab');

    // If still too similar, try lightening instead
    if (newSimilarity > 70) {
      adjusted = lighten(textColor, 50);
    }

    return adjusted;
  }

  return textColor;
}

const bgColor = '#f0f0f0';
const textColor = '#e8e8e8'; // Too similar!
const adjustedText = ensureContrast(bgColor, textColor); // Much darker
```

## Color Space Comparison

Choose the right color space for your use case:

- **RGB**: Fast, simple Euclidean distance. Good for exact matching.
- **HSL**: Considers hue, saturation, and lightness separately. Good for color harmony.
- **LAB**: Perceptually uniform. Best for matching how humans see color differences.

```typescript
// RGB: Fast but not perceptually accurate
areHexColorsSimilar('#FF0000', '#FF3333', { colorSpace: 'rgb' });

// HSL: Good for hue-based comparisons
areHexColorsSimilar('#FF0000', '#FF3333', { colorSpace: 'hsl' });

// LAB: Most accurate for human perception
areHexColorsSimilar('#FF0000', '#FF3333', { colorSpace: 'lab' });
```

## TypeScript Support

Full TypeScript support with comprehensive type definitions:

```typescript
import type {
  ThemeConfig,
  BrandColors,
  AnimationOptions,
  AnimationController,
  RGBColor,
  HSLColor,
  LABColor,
  ColorSimilarityOptions,
} from '@web-loom/typography-core';

const theme: ThemeConfig = {
  fontSize: { sm: '14px', md: '16px', lg: '18px', xl: '24px', '2xl': '32px' },
  color: {
    textDark: '#000',
    textLight: '#fff',
    background: '#f5f5f5',
    surface: '#fff',
  },
  brandColors: {
    primary: '#007bff',
    secondary: '#6c757d',
  },
};

const options: AnimationOptions = {
  duration: 1000,
  easing: 'ease-in-out',
};

const rgb: RGBColor = [255, 0, 0];
const hsl: HSLColor = [0, 100, 50];
const lab: LABColor = [53.2, 80.1, 67.2];
```

## API Reference

### Theme API

- `createTheme(config)`: Create theme instance
- `getColor(key)`: Get color from theme
- `getBrandColor(key)`: Get brand color
- `getFontSize(key)`: Get font size
- `getTheme()`: Get entire theme config
- `setTheme(config)`: Update theme config

### Color API

- `lighten(color, amount)`: Lighten hex color by percentage
- `darken(color, amount)`: Darken hex color by percentage
- `hexToRGB(hex)`: Convert hex to RGB tuple
- `hexToRGBA(hex)`: Convert hex to RGBA tuple
- `rgbToHSL(rgb)`: Convert RGB to HSL
- `rgbToLAB(rgb)`: Convert RGB to LAB
- `areColorsSimilar(rgb1, rgb2, options)`: Compare RGB colors
- `areHexColorsSimilar(hex1, hex2, options)`: Compare hex colors
- `getColorSimilarityPercentage(rgb1, rgb2, space)`: Get similarity percentage
- `getHexColorSimilarityPercentage(hex1, hex2, space)`: Get hex similarity percentage
- `findMostSimilarColor(target, palette, space)`: Find closest color in palette
- `findMostSimilarHexColor(hex, palette, space)`: Find closest hex in palette

### Animation API

- `animateText(element, type, options)`: Animate text element

Animation types: `'typewriter'`, `'fadein'`, `'character'`, `'scale'`

### Animation Controller

- `play()`: Resume animation
- `pause()`: Pause animation
- `reverse()`: Reverse animation direction
- `cancel()`: Cancel and reset animation
- `finish()`: Jump to end of animation
- `finished`: Promise that resolves when animation completes

## Bundle Size

- ~3KB minified + gzipped
- Tree-shakeable ESM build
- Zero dependencies

## Browser Support

Works in all modern browsers supporting:

- Web Animations API
- ES2015+

For older browsers, consider polyfills for Web Animations API.

## License

MIT
