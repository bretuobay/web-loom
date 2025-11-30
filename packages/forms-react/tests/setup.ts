import '@testing-library/jest-dom';

// Mock console errors to avoid noise in tests
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
};
