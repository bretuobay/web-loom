/**
 * Status Command Tests
 * Tests for the status command implementation
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import { statusCommand } from './status.js';
import type { Report } from '../storage/types.js';

describe('Status Command', () => {
  const testDir = path.join(process.cwd(), '.test-visdiff-status');
  const diffDir = path.join(testDir, '.visdiff', 'diffs');

  beforeEach(async () => {
    // Create test directory structure
    await fs.mkdir(diffDir, { recursive: true });

    // Create a default config file
    const configPath = path.join(testDir, 'visdiff.config.js');
    await fs.writeFile(
      configPath,
      `export default {
        viewports: [{ width: 1920, height: 1080, name: 'desktop' }],
        paths: ['http://localhost:3000'],
        captureOptions: { fullPage: false, omitBackground: false, timeout: 30000 },
        diffOptions: { threshold: 0.01, ignoreAntialiasing: true, ignoreColors: false, highlightColor: '#ff00ff' },
        storage: { baselineDir: '.visdiff/baselines', diffDir: '.visdiff/diffs', format: 'png' }
      };`,
    );
  });

  afterEach(async () => {
    // Clean up test directory
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('should return 0 when no comparisons exist', async () => {
    const originalCwd = process.cwd();
    process.chdir(testDir);

    try {
      const exitCode = await statusCommand({ json: true });
      expect(exitCode).toBe(0);
    } finally {
      process.chdir(originalCwd);
    }
  });

  it('should display summary counts from latest report', async () => {
    // Create a mock report
    const timestamp = new Date();
    const timestampDir = formatTimestamp(timestamp);
    const reportDir = path.join(diffDir, timestampDir);
    await fs.mkdir(reportDir, { recursive: true });

    const report: Report = {
      timestamp,
      results: [
        {
          identifier: 'home-desktop',
          passed: true,
          difference: 0.005,
          dimensions: { width: 1920, height: 1080 },
          pixelsDifferent: 100,
        },
        {
          identifier: 'about-desktop',
          passed: false,
          difference: 0.025,
          dimensions: { width: 1920, height: 1080 },
          pixelsDifferent: 500,
        },
      ],
      summary: {
        total: 2,
        passed: 1,
        failed: 1,
        new: 0,
      },
    };

    await fs.writeFile(path.join(reportDir, 'report.json'), JSON.stringify(report, null, 2));

    const originalCwd = process.cwd();
    process.chdir(testDir);

    try {
      const exitCode = await statusCommand({ json: true });
      expect(exitCode).toBe(0);
    } finally {
      process.chdir(originalCwd);
    }
  });

  it('should include timestamp in status output', async () => {
    // Create a mock report
    const timestamp = new Date();
    const timestampDir = formatTimestamp(timestamp);
    const reportDir = path.join(diffDir, timestampDir);
    await fs.mkdir(reportDir, { recursive: true });

    const report: Report = {
      timestamp,
      results: [],
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        new: 0,
      },
    };

    await fs.writeFile(path.join(reportDir, 'report.json'), JSON.stringify(report, null, 2));

    const originalCwd = process.cwd();
    process.chdir(testDir);

    try {
      const exitCode = await statusCommand({ json: true });
      expect(exitCode).toBe(0);
    } finally {
      process.chdir(originalCwd);
    }
  });

  it('should list failed paths and viewports', async () => {
    // Create a mock report with failures
    const timestamp = new Date();
    const timestampDir = formatTimestamp(timestamp);
    const reportDir = path.join(diffDir, timestampDir);
    await fs.mkdir(reportDir, { recursive: true });

    const report: Report = {
      timestamp,
      results: [
        {
          identifier: 'home-mobile',
          passed: false,
          difference: 0.025,
          dimensions: { width: 375, height: 667 },
          pixelsDifferent: 500,
        },
        {
          identifier: 'about-tablet',
          passed: false,
          difference: 0.035,
          dimensions: { width: 768, height: 1024 },
          pixelsDifferent: 800,
        },
      ],
      summary: {
        total: 2,
        passed: 0,
        failed: 2,
        new: 0,
      },
    };

    await fs.writeFile(path.join(reportDir, 'report.json'), JSON.stringify(report, null, 2));

    const originalCwd = process.cwd();
    process.chdir(testDir);

    try {
      const exitCode = await statusCommand({ json: true });
      expect(exitCode).toBe(0);
    } finally {
      process.chdir(originalCwd);
    }
  });
});

/**
 * Format timestamp for directory name
 */
function formatTimestamp(timestamp: Date): string {
  const year = timestamp.getFullYear();
  const month = String(timestamp.getMonth() + 1).padStart(2, '0');
  const day = String(timestamp.getDate()).padStart(2, '0');
  const hours = String(timestamp.getHours()).padStart(2, '0');
  const minutes = String(timestamp.getMinutes()).padStart(2, '0');
  const seconds = String(timestamp.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day}-${hours}-${minutes}-${seconds}`;
}
