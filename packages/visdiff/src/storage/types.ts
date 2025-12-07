/**
 * Storage-related type definitions for @web-loom/visdiff
 */

import type { ComparisonResult } from '../types';

/**
 * Report structure for comparison results
 */
export interface Report {
  timestamp: Date;
  results: ComparisonResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    new: number;
  };
}

/**
 * Storage paths configuration
 */
export interface StoragePaths {
  baselineDir: string;
  diffDir: string;
  backupDir: string;
  configDir: string;
}
