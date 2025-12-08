/**
 * Design Core Integration Example
 *
 * Demonstrates how to integrate @web-loom/design-core tokens with ui-react
 */

import React from 'react';
import { ThemeProvider } from '../providers/ThemeProvider';
import { Button } from '../components/button/Button';
import { Space } from '../components/space/Space';
import { mapDesignTokensToCSS, getCSSVarRef, mergeTokens } from '../utils/tokens';

/**
 * Example: Using design-core tokens directly
 */
export function BasicIntegrationExample() {
  // Custom theme using design-core token structure
  const customTheme = {
    token: {
      colorPrimary: '#9333ea', // Purple
      colorSuccess: '#10b981', // Green
      colorError: '#ef4444', // Red
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: '14px',
      borderRadius: '8px',
    },
  };

  return (
    <ThemeProvider theme={customTheme}>
      <Space direction="vertical" size="large">
        <h2>Design Core Integration</h2>
        <Space>
          <Button variant="primary">Primary Action</Button>
          <Button variant="default">Default Action</Button>
        </Space>
      </Space>
    </ThemeProvider>
  );
}

/**
 * Example: Merging default tokens with custom overrides
 */
export function TokenMergingExample() {
  const defaultTokens = {
    colorPrimary: '#1677ff',
    colorSuccess: '#52c41a',
    fontSize: '14px',
    fontFamily: 'system-ui, sans-serif',
  };

  const customTokens = {
    colorPrimary: '#ff6b6b', // Override primary color
    fontSize: '16px', // Override font size
  };

  const mergedTokens = mergeTokens(defaultTokens, customTokens);
  // Result: { colorPrimary: '#ff6b6b', colorSuccess: '#52c41a', fontSize: '16px', fontFamily: 'system-ui, sans-serif' }

  return (
    <ThemeProvider theme={{ token: mergedTokens }}>
      <Space direction="vertical">
        <h3>Merged Theme (Custom Primary Color & Font Size)</h3>
        <Button variant="primary">Custom Styled Button</Button>
      </Space>
    </ThemeProvider>
  );
}

/**
 * Example: Programmatically generating CSS variables
 */
export function CSSVariableGenerationExample() {
  const tokens = {
    colorPrimary: '#1677ff',
    colorSuccess: '#52c41a',
    fontSize: '14px',
    spacingMD: '16px',
  };

  // Convert to CSS variables
  const cssVars = mapDesignTokensToCSS(tokens);
  // Result: {
  //   '--ui-color-primary': '#1677ff',
  //   '--ui-color-success': '#52c41a',
  //   '--ui-font-size': '14px',
  //   '--ui-spacing-md': '16px'
  // }

  return (
    <div>
      <h3>Generated CSS Variables</h3>
      <pre>{JSON.stringify(cssVars, null, 2)}</pre>
    </div>
  );
}

/**
 * Example: Using CSS variable references in custom components
 */
export function CustomComponentExample() {
  // Create a custom styled component using CSS vars
  const CustomCard = () => {
    const cardStyles = {
      padding: getCSSVarRef('spaceLG', '24px'),
      backgroundColor: getCSSVarRef('colorBg', '#ffffff'),
      borderRadius: getCSSVarRef('radiusMD', '6px'),
      border: `1px solid ${getCSSVarRef('colorBorder', '#d9d9d9')}`,
      boxShadow: getCSSVarRef('shadowSM', '0 1px 2px rgba(0,0,0,0.05)'),
    };

    return (
      <div style={cardStyles}>
        <h4>Custom Card</h4>
        <p>This card uses CSS variables from the theme system.</p>
        <Button variant="primary">Action</Button>
      </div>
    );
  };

  return (
    <ThemeProvider mode="light">
      <CustomCard />
    </ThemeProvider>
  );
}

/**
 * Example: Component-specific tokens
 */
export function ComponentTokensExample() {
  const themeWithComponentTokens = {
    token: {
      colorPrimary: '#1677ff',
      fontSize: '14px',
    },
    components: {
      Button: {
        height: '40px',
        paddingX: '20px',
        fontSize: '16px',
        borderRadius: '8px',
      },
    },
  };

  return (
    <ThemeProvider theme={themeWithComponentTokens}>
      <Space direction="vertical">
        <h3>Component-Specific Tokens</h3>
        <p>This button uses custom height, padding, and border radius.</p>
        <Button variant="primary">Large Custom Button</Button>
      </Space>
    </ThemeProvider>
  );
}

/**
 * Example: Dynamic theme switching
 */
export function DynamicThemeSwitchingExample() {
  const purpleTheme = {
    token: {
      colorPrimary: '#9333ea',
      colorPrimaryHover: '#a855f7',
      colorPrimaryActive: '#7e22ce',
    },
  };

  const greenTheme = {
    token: {
      colorPrimary: '#10b981',
      colorPrimaryHover: '#34d399',
      colorPrimaryActive: '#059669',
    },
  };

  const [currentTheme, setCurrentTheme] = React.useState(purpleTheme);

  return (
    <ThemeProvider theme={currentTheme}>
      <Space direction="vertical" size="large">
        <h3>Dynamic Theme Switching</h3>
        <Space>
          <Button onClick={() => setCurrentTheme(purpleTheme)}>Purple Theme</Button>
          <Button onClick={() => setCurrentTheme(greenTheme)}>Green Theme</Button>
        </Space>
        <Button variant="primary">Themed Button</Button>
      </Space>
    </ThemeProvider>
  );
}

/**
 * Export all examples
 */
export const DesignCoreIntegrationExamples = {
  BasicIntegrationExample,
  TokenMergingExample,
  CSSVariableGenerationExample,
  CustomComponentExample,
  ComponentTokensExample,
  DynamicThemeSwitchingExample,
};
