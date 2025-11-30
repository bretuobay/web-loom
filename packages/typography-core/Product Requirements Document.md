Product Requirements Document: Typography-Core

1. Introduction & Overview
   Typography-Core is a framework-agnostic toolkit that provides advanced typography utilities, animation primitives, AI-assisted recommendations, and cross-platform adapters. It focuses exclusively on the reading experience layer of an application—text scaling, modular calculations, readability analytics, motion, and typography testing—while other design tokens live inside `@web-loom/design-core`. The package is written in strict TypeScript and compiled as an ESM/CJS JavaScript library with zero required CSS (optional helper classes may be included for demos).

2. Goals & Objectives
   Simplify Typographic Calculations: Offer modular scale, fluid typography, line-height, and rhythm utilities that work with any design tokens.

Enhance Reading Experiences: Provide guided reading, focus assistance, and animation recipes that elevate how text is consumed on the web and mobile.

Accelerate Decision Making: Ship AI-driven font pairing suggestions, readability analytics, and typography A/B testing helpers for data-informed iteration.

Maintain Framework Flexibility: Run seamlessly in React, Vue, Angular, SSG/SSR, or vanilla projects, plus provide adapters for React Native.

Stay Interoperable with Design-Core: Consume typography tokens from `@web-loom/design-core` so the broader design system stays in sync.

3. Target Audience
   The primary users of this library will be front-end developers, particularly those working on projects where consistent branding and dynamic styling are important. This includes developers of:

Blogging platforms and content management systems

Personal or professional portfolio websites

E-commerce sites

Teams seeking consistent branding and UI theming across projects

Developers wanting to incorporate smooth text animations and typographic controls

4. Key Features
   Typography-Core ships as a set of composable modules:

- **Theme + Design-Core Integration**: `createTheme`, token consumers, and preset generators bridge external design tokens into typography calculations.
- **Typography Calculations**: Modular scales, fluid `clamp()` helpers, line-height/vertical rhythm generators, optical sizing, and character-per-line estimators.
- **Color Utilities**: Lighten/darken plus perceptual color similarity (RGB/HSL/LAB) for textual contrast and brand pairing.
- **Animations**: Typewriter, fade-in, character reveal, and scale animations plus advanced morphing, variable font timelines, and RSVP speed reading.
- **Accessibility + Analysis**: Dyslexia presets, low vision adjustments, motion-safe fallbacks, readability scoring, language detection, and keyword extraction.
- **Font + Web Performance**: Loading strategies, subset planning, font feature detection, and validation utilities.
- **AI + Experiments**: Font pairing recommendations, typography optimization hints, and A/B testing helpers to capture conversion rates.
- **Cross-Platform Adapters**: React Native typography presets, device scaling helpers, and locale-aware RTL utilities.

5. Project Structure
   The repository follows a modular breakdown aligned with the roadmap:

- `src/core`: Theme configuration + design-core integration bridges.
- `src/calculations`: Modular scales, fluid typer, line-height, text measurements.
- `src/fonts`: Loading, performance, validation utilities.
- `src/animations` & `src/effects`: Base text animations plus advanced 3D/variable font effects.
- `src/accessibility`, `src/analysis`, `src/multilingual`, `src/reading`: Readability, language detection, guided reading, focus assist, and locale helpers.
- `src/ai`, `src/testing`, `src/cross-platform`: AI recommendations, typography experiments, React Native adapters.
- `src/utils`: Color similarity, typography math, and shared helpers.

6. API Design & Definitions
   The library's API will be designed to be intuitive and easy to use.

/\*\*

- Interface for brand colors.
  \*/
  interface BrandColors {
  primary: string;
  secondary: string;
  accent?: string;
  // Optionally, additional brand-specific colors can be added
  }

/\*\*

- Interface for the overall theme configuration.
  \*/
  interface ThemeConfig {
  fontSize: {
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  // Additional sizes can be added here
  };
  color: {
  textDark: string;
  textLight: string;
  background: string;
  surface: string;
  // Standard UI colors
  };
  brandColors: BrandColors;
  typography?: {
  fontFamily?: string;
  fontWeights?: { [key: string]: number };
  lineHeights?: { [key: string]: number };
  letterSpacing?: { [key: string]: string };
  };
  }

/\*\*

- Interface for animation options.
  \*/
  interface AnimationOptions {
  speed?: number;
  delay?: number;
  easing?: string;
  }

/\*\*

- Initializes the library and returns a theme object with utility functions.
- @param config The theme configuration object.
- @returns An object containing the theme and API functions.
  \*/
  declare function createTheme(config: ThemeConfig): {
  getColor(key: keyof ThemeConfig['color']): string;
  getBrandColor(key: keyof ThemeConfig['brandColors']): string;
  getFontSize(key: keyof ThemeConfig['fontSize']): string;
  lighten(color: string, amount: number): string;
  darken(color: string, amount: number): string;
  getTheme(): ThemeConfig;
  animateText(element: HTMLElement, animationType: string, options?: AnimationOptions): void;
  setTheme(themeObj: ThemeConfig): void;
  };

7. Development & Tooling
   - TypeScript: strict mode, declaration output, and shared types across modules.
   - Bundling: Vite + `vite-plugin-dts` to emit ESM/CJS bundles.
   - Testing: Vitest (jsdom) for utilities and browser-specific code. Current suites cover color, theme, calculations, animations, accessibility, AI, testing, effects, and cross-platform modules.
   - Documentation: Central README + PRD/GAP analysis with use-case playbooks and roadmap context. Additional guides can live in `/docs`.
   - Showcase: Optional Storybook or sandboxes for animation demos and typography experiments.

8. Future Considerations
   - CLI Tooling: Generate boilerplate theme configs, experiments, or font pairing reports from the terminal.
   - Framework Bindings: Ship reference React/Vue hooks for guided reading, focus assist, or typography experiments.
   - Palette Generation: Leverage color similarity utilities to create tonal palettes or accessible contrast variants automatically.
   - Telemetry Hooks: Offer adapters that feed experiment metrics to analytics providers (Segment, GA4, etc.).

9. Roadmap Alignment
   The GAP Analysis tracks delivery across four phases (completed in order):

   1. Typography scale generation, design-core integration, typography calculations, and web font management.
   2. Accessibility, analytics, font performance, and typography math enhancements.
   3. Advanced text animations, content analysis, multilingual support, and guided reading experiences.
   4. 3D typography effects, AI-powered recommendations, typography testing utilities, and cross-platform/native adapters.

   This PRD stays synchronized with that roadmap so documentation, implementation, and future planning remain consistent.
