/**
 * Storage Manager for @web-loom/visdiff
 * Handles file system operations for baselines, diffs, and reports
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import type { Report, StoragePaths } from './types';
import type { ComparisonResult } from '../types';

/**
 * Default storage paths relative to project root
 */
const DEFAULT_PATHS: StoragePaths = {
  baselineDir: '.visdiff/baselines',
  diffDir: '.visdiff/diffs',
  backupDir: '.visdiff/backups',
  configDir: '.visdiff',
};

/**
 * StorageManager handles all file system operations for visdiff
 */
export class StorageManager {
  private paths: StoragePaths;
  private rootDir: string;

  constructor(rootDir: string = process.cwd(), customPaths?: Partial<StoragePaths>) {
    this.rootDir = rootDir;
    this.paths = { ...DEFAULT_PATHS, ...customPaths };
  }

  /**
   * Initialize directory structure
   * Creates .visdiff/baselines, .visdiff/diffs, .visdiff/backups
   */
  async initialize(): Promise<void> {
    const dirs = [
      this.getAbsolutePath(this.paths.baselineDir),
      this.getAbsolutePath(this.paths.diffDir),
      this.getAbsolutePath(this.paths.backupDir),
      this.getAbsolutePath(this.paths.configDir),
    ];

    for (const dir of dirs) {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  /**
   * Load a baseline image by identifier
   * @param identifier - Unique identifier (e.g., "home-mobile")
   * @returns Buffer containing the image, or null if not found
   */
  async loadBaseline(identifier: string): Promise<Buffer | null> {
    const filename = this.getBaselineFilename(identifier);
    const filepath = path.join(this.getAbsolutePath(this.paths.baselineDir), filename);

    try {
      return await fs.readFile(filepath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  /**
   * Save a baseline image
   * @param identifier - Unique identifier (e.g., "home-mobile")
   * @param image - Image buffer to save
   */
  async saveBaseline(identifier: string, image: Buffer): Promise<void> {
    const filename = this.getBaselineFilename(identifier);
    const filepath = path.join(this.getAbsolutePath(this.paths.baselineDir), filename);

    await fs.writeFile(filepath, image);
  }

  /**
   * Save a diff image with timestamped directory
   * @param result - Comparison result containing diff image
   * @param timestamp - Timestamp for the diff run
   */
  async saveDiff(result: ComparisonResult, timestamp: Date): Promise<void> {
    if (!result.diffImage) {
      return;
    }

    const timestampDir = this.getTimestampedDir(timestamp);
    const diffDir = path.join(this.getAbsolutePath(this.paths.diffDir), timestampDir);
    
    await fs.mkdir(diffDir, { recursive: true });

    const filename = this.getDiffFilename(result.identifier);
    const filepath = path.join(diffDir, filename);

    await fs.writeFile(filepath, result.diffImage);
  }

  /**
   * Save a JSON report of comparison results
   * @param results - Array of comparison results
   * @param timestamp - Timestamp for the report
   */
  async saveReport(results: ComparisonResult[], timestamp: Date): Promise<void> {
    const timestampDir = this.getTimestampedDir(timestamp);
    const diffDir = path.join(this.getAbsolutePath(this.paths.diffDir), timestampDir);
    
    await fs.mkdir(diffDir, { recursive: true });

    const report: Report = {
      timestamp,
      results: results.map(r => ({
        ...r,
        diffImage: undefined, // Don't include buffer in JSON
      })),
      summary: {
        total: results.length,
        passed: results.filter(r => r.passed).length,
        failed: results.filter(r => !r.passed && !r.error).length,
        new: results.filter(r => r.error).length,
      },
    };

    const filepath = path.join(diffDir, 'report.json');
    await fs.writeFile(filepath, JSON.stringify(report, null, 2));
  }

  /**
   * Get the most recent comparison report
   * @returns Latest report or null if none exists
   */
  async getLatestReport(): Promise<Report | null> {
    const diffDir = this.getAbsolutePath(this.paths.diffDir);

    try {
      const entries = await fs.readdir(diffDir, { withFileTypes: true });
      const dirs = entries
        .filter(e => e.isDirectory())
        .map(e => e.name)
        .sort()
        .reverse();

      if (dirs.length === 0) {
        return null;
      }

      const latestDir = dirs[0];
      if (!latestDir) {
        return null;
      }
      const reportPath = path.join(diffDir, latestDir, 'report.json');
      
      const content = await fs.readFile(reportPath, 'utf-8');
      const report = JSON.parse(content);
      
      // Convert timestamp string back to Date
      report.timestamp = new Date(report.timestamp);
      
      return report;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  /**
   * Backup all current baselines
   * Creates a timestamped backup directory
   */
  async backupBaselines(): Promise<void> {
    const timestamp = new Date();
    const timestampDir = this.getTimestampedDir(timestamp);
    const backupDir = path.join(this.getAbsolutePath(this.paths.backupDir), timestampDir);
    
    await fs.mkdir(backupDir, { recursive: true });

    const baselineDir = this.getAbsolutePath(this.paths.baselineDir);
    
    try {
      const files = await fs.readdir(baselineDir);
      
      for (const file of files) {
        const srcPath = path.join(baselineDir, file);
        const destPath = path.join(backupDir, file);
        
        const stat = await fs.stat(srcPath);
        if (stat.isFile()) {
          await fs.copyFile(srcPath, destPath);
        }
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        // No baselines to backup
        return;
      }
      throw error;
    }
  }

  /**
   * Approve changes by replacing baselines with current screenshots
   * @param identifiers - Optional array of specific identifiers to approve
   * @param currentScreenshots - Map of identifier to image buffer
   */
  async approveChanges(
    currentScreenshots: Map<string, Buffer>,
    identifiers?: string[]
  ): Promise<string[]> {
    // Backup existing baselines first
    await this.backupBaselines();

    const approved: string[] = [];
    const toApprove = identifiers || Array.from(currentScreenshots.keys());

    for (const identifier of toApprove) {
      const screenshot = currentScreenshots.get(identifier);
      if (screenshot) {
        await this.saveBaseline(identifier, screenshot);
        approved.push(identifier);
      }
    }

    return approved;
  }

  /**
   * Get absolute path from relative path
   */
  private getAbsolutePath(relativePath: string): string {
    return path.join(this.rootDir, relativePath);
  }

  /**
   * Get baseline filename from identifier
   * Format: {identifier}.png
   */
  private getBaselineFilename(identifier: string): string {
    return `${identifier}.png`;
  }

  /**
   * Get diff filename from identifier
   * Format: diff-{identifier}.png
   */
  private getDiffFilename(identifier: string): string {
    return `diff-${identifier}.png`;
  }

  /**
   * Get timestamped directory name
   * Format: YYYY-MM-DD-HH-mm-ss
   */
  private getTimestampedDir(timestamp: Date): string {
    const year = timestamp.getFullYear();
    const month = String(timestamp.getMonth() + 1).padStart(2, '0');
    const day = String(timestamp.getDate()).padStart(2, '0');
    const hours = String(timestamp.getHours()).padStart(2, '0');
    const minutes = String(timestamp.getMinutes()).padStart(2, '0');
    const seconds = String(timestamp.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day}-${hours}-${minutes}-${seconds}`;
  }
}
