// packages/design-core/src/utils/__tests__/index.test.ts
import { describe, it, expect } from 'vitest';
import * as utils from '../index';

describe('Utils Index Exports', () => {
  it('should export getAllTokens function', () => {
    expect(utils.getAllTokens).toBeDefined();
    expect(typeof utils.getAllTokens).toBe('function');
  });

  it('should export getTokenValue function', () => {
    expect(utils.getTokenValue).toBeDefined();
    expect(typeof utils.getTokenValue).toBe('function');
  });

  it('should export pathToCssVar function', () => {
    expect(utils.pathToCssVar).toBeDefined();
    expect(typeof utils.pathToCssVar).toBe('function');
  });

  it('should export getTokenVar function', () => {
    expect(utils.getTokenVar).toBeDefined();
    expect(typeof utils.getTokenVar).toBe('function');
  });

  it('should export getSafeTokenVar function', () => {
    expect(utils.getSafeTokenVar).toBeDefined();
    expect(typeof utils.getSafeTokenVar).toBe('function');
  });

  it('should export generateCssVariablesMap function', () => {
    expect(utils.generateCssVariablesMap).toBeDefined();
    expect(typeof utils.generateCssVariablesMap).toBe('function');
  });

  it('should export generateCssVariablesString function', () => {
    expect(utils.generateCssVariablesString).toBeDefined();
    expect(typeof utils.generateCssVariablesString).toBe('function');
  });

  it('should export createTheme function', () => {
    expect(utils.createTheme).toBeDefined();
    expect(typeof utils.createTheme).toBe('function');
  });

  it('should export applyTheme function', () => {
    expect(utils.applyTheme).toBeDefined();
    expect(typeof utils.applyTheme).toBe('function');
  });

  it('should export setTheme function', () => {
    expect(utils.setTheme).toBeDefined();
    expect(typeof utils.setTheme).toBe('function');
  });

  it('should export getCurrentTheme function', () => {
    expect(utils.getCurrentTheme).toBeDefined();
    expect(typeof utils.getCurrentTheme).toBe('function');
  });
});
