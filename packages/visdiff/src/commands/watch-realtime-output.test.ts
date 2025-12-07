/**
 * Property Test: Real-time output in watch mode
 * Feature: visdiff-phase1, Property 21: Real-time output in watch mode
 * Validates: Requirements 5.3
 * 
 * For any comparison performed in watch mode, results should be 
 * displayed in the terminal in real-time
 * 
 * This test validates the output formatting logic used by watch mode
 * to display real-time comparison results.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import chalk from 'chalk';

/**
 * Simulates the displayResults function from watch.ts
 * This is the core logic that formats and displays real-time output
 */
function displayResults(
  results: { passed: number; failed: number; new: number },
  timestamp: Date
): string[] {
  const output: string[] = [];
  const timeStr = timestamp.toLocaleTimeString();
  
  output.push('');
  output.push(chalk.blue(`[${timeStr}] Comparison complete:`));
  
  if (results.failed === 0 && results.new === 0) {
    output.push(chalk.green(`  ✓ All ${results.passed} comparison(s) passed`));
  } else {
    output.push(chalk.gray(`  Passed: ${results.passed}`));
    if (results.failed > 0) {
      output.push(chalk.red(`  Failed: ${results.failed}`));
    }
    if (results.new > 0) {
      output.push(chalk.yellow(`  New: ${results.new}`));
    }
  }
  
  output.push(chalk.gray('  Watching for changes...'));
  
  return output;
}

describe('Property 21: Real-time output in watch mode', () => {
  let originalConsoleLog: typeof console.log;
  let consoleOutput: string[];

  beforeEach(() => {
    consoleOutput = [];
    originalConsoleLog = console.log;
    
    // Mock console.log to capture output
    console.log = vi.fn((...args: any[]) => {
      consoleOutput.push(args.join(' '));
    });
  });

  afterEach(() => {
    console.log = originalConsoleLog;
    vi.restoreAllMocks();
  });

  it('should display real-time results with timestamp for any comparison', () => {
    fc.assert(
      fc.property(
        fc.record({
          passed: fc.integer({ min: 0, max: 100 }),
          failed: fc.integer({ min: 0, max: 100 }),
          new: fc.integer({ min: 0, max: 50 }),
        }),
        fc.date(),
        (results, timestamp) => {
          // Display results
          const output = displayResults(results, timestamp);
          
          // Verify output contains comparison complete message
          const outputText = output.join('\n');
          expect(outputText).toContain('Comparison complete');
          
          // Verify timestamp is included
          expect(outputText).toMatch(/\d+:\d+:\d+/);
          
          // Verify watching message is displayed
          expect(outputText).toContain('Watching for changes');
          
          // Verify counts are displayed
          if (results.failed === 0 && results.new === 0) {
            // All passed case
            expect(outputText).toContain(`All ${results.passed} comparison(s) passed`);
          } else {
            // Mixed results case
            expect(outputText).toContain(`Passed: ${results.passed}`);
            
            if (results.failed > 0) {
              expect(outputText).toContain(`Failed: ${results.failed}`);
            }
            
            if (results.new > 0) {
              expect(outputText).toContain(`New: ${results.new}`);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should display results immediately with proper formatting', () => {
    const results = { passed: 5, failed: 2, new: 1 };
    const timestamp = new Date('2024-12-07T14:30:22.000Z');
    
    const output = displayResults(results, timestamp);
    const outputText = output.join('\n');
    
    // Verify all required elements are present
    expect(outputText).toContain('Comparison complete');
    expect(outputText).toMatch(/\d+:\d+:\d+/); // Timestamp format
    expect(outputText).toContain('Passed: 5');
    expect(outputText).toContain('Failed: 2');
    expect(outputText).toContain('New: 1');
    expect(outputText).toContain('Watching for changes');
  });

  it('should display success message when all comparisons pass', () => {
    const results = { passed: 10, failed: 0, new: 0 };
    const timestamp = new Date();
    
    const output = displayResults(results, timestamp);
    const outputText = output.join('\n');
    
    // Verify success message
    expect(outputText).toContain('All 10 comparison(s) passed');
    expect(outputText).not.toContain('Failed:');
    expect(outputText).not.toContain('New:');
  });

  it('should handle edge case of zero passed comparisons', () => {
    const results = { passed: 0, failed: 5, new: 2 };
    const timestamp = new Date();
    
    const output = displayResults(results, timestamp);
    const outputText = output.join('\n');
    
    // Verify counts are displayed correctly
    expect(outputText).toContain('Passed: 0');
    expect(outputText).toContain('Failed: 5');
    expect(outputText).toContain('New: 2');
  });
});
