/**
 * Property-based testing setup verification
 *
 * This test verifies that fast-check is properly configured
 * and can run property-based tests with 100+ iterations.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

describe('Property-based testing setup', () => {
  it('should run property tests with fast-check', () => {
    // Simple property: reversing a string twice returns the original
    fc.assert(
      fc.property(fc.string(), (str) => {
        const reversed = str.split('').reverse().join('');
        const doubleReversed = reversed.split('').reverse().join('');
        return doubleReversed === str;
      }),
      { numRuns: 100 }, // Explicitly set to 100 iterations
    );
  });

  it('should verify array length property', () => {
    // Property: concatenating two arrays results in combined length
    fc.assert(
      fc.property(fc.array(fc.integer()), fc.array(fc.integer()), (arr1, arr2) => {
        const combined = [...arr1, ...arr2];
        return combined.length === arr1.length + arr2.length;
      }),
      { numRuns: 100 },
    );
  });
});
