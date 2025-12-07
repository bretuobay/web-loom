/**
 * Watch Command Implementation
 * Watches for changes and automatically compares screenshots
 */

import chalk from 'chalk';
import { watch, FSWatcher } from 'fs';
import { BrowserManager } from '../browser/browser-manager.js';
import { CaptureEngine } from '../capture/capture-engine.js';
import { CompareEngine, ComparisonPair } from '../compare/compare-engine.js';
import { StorageManager } from '../storage/storage-manager.js';
import { loadConfig } from '../config/loader.js';
import type { VisDiffConfig } from '../config/schema.js';

export interface WatchOptions {
  config?: string;
  interval?: string;
  debounce?: string;
}

/**
 * Generate identifier from URL and viewport name
 */
function generateIdentifier(url: string, viewportName: string): string {
  const urlObj = new URL(url);
  const path = urlObj.pathname === '/' ? 'home' : urlObj.pathname.replace(/\//g, '-').replace(/^-/, '');
  return `${path}-${viewportName}`;
}

/**
 * Perform a single comparison run
 */
async function performComparison(
  urls: string[],
  config: VisDiffConfig,
  browserManager: BrowserManager,
  captureEngine: CaptureEngine,
  compareEngine: CompareEngine,
  storage: StorageManager
): Promise<{ passed: number; failed: number; new: number }> {
  try {
    // Capture current screenshots
    const captureSummary = await captureEngine.captureAll(
      urls,
      config.viewports,
      config.captureOptions
    );

    // Load baselines and prepare comparisons
    const comparisons: ComparisonPair[] = [];
    const missingBaselines: string[] = [];

    for (const result of captureSummary.results) {
      if (!result.success) {
        continue;
      }

      const identifier = generateIdentifier(result.url, result.viewport.name);
      const baseline = await storage.loadBaseline(identifier);

      if (!baseline) {
        missingBaselines.push(identifier);
        continue;
      }

      comparisons.push({
        baseline,
        current: result.image,
        identifier,
      });
    }

    // Perform comparisons
    const comparisonResults = await compareEngine.compareAll(comparisons, config.diffOptions);

    // Save diff images for failures
    const timestamp = new Date();
    let failedCount = 0;
    let passedCount = 0;

    for (const result of comparisonResults) {
      if (result.passed) {
        passedCount++;
      } else {
        failedCount++;
        if (result.diffImage) {
          await storage.saveDiff(result, timestamp);
        }
      }
    }

    // Save report
    await storage.saveReport(comparisonResults, timestamp);

    return {
      passed: passedCount,
      failed: failedCount,
      new: missingBaselines.length,
    };
  } catch (error) {
    console.error(chalk.red('  Error during comparison:'), (error as Error).message);
    throw error;
  }
}

/**
 * Display comparison results in real-time
 */
function displayResults(
  results: { passed: number; failed: number; new: number },
  timestamp: Date
): void {
  const timeStr = timestamp.toLocaleTimeString();
  
  console.log();
  console.log(chalk.blue(`[${timeStr}] Comparison complete:`));
  
  if (results.failed === 0 && results.new === 0) {
    console.log(chalk.green(`  ✓ All ${results.passed} comparison(s) passed`));
  } else {
    console.log(chalk.gray(`  Passed: ${results.passed}`));
    if (results.failed > 0) {
      console.log(chalk.red(`  Failed: ${results.failed}`));
    }
    if (results.new > 0) {
      console.log(chalk.yellow(`  New: ${results.new}`));
    }
  }
  
  console.log(chalk.gray('  Watching for changes...'));
}

/**
 * Execute the watch command
 */
export async function watchCommand(
  url: string | undefined,
  options: WatchOptions = {}
): Promise<number> {
  const cwd = process.cwd();
  let browserManager: BrowserManager | null = null;
  let watcher: FSWatcher | null = null;
  let isRunning = false;
  let debounceTimer: NodeJS.Timeout | null = null;
  let shouldExit = false;

  // Parse options
  const pollInterval = parseInt(options.interval || '2000', 10);
  const debounceDelay = parseInt(options.debounce || '500', 10);

  try {
    // Load configuration
    console.log(chalk.blue('Loading configuration...'));
    const config: VisDiffConfig = await loadConfig(cwd);

    // Determine URLs to watch
    const urlsToWatch = url ? [url] : config.paths;
    
    if (urlsToWatch.length === 0) {
      console.error(chalk.red('✗ No URLs specified'));
      console.log(chalk.gray('  Provide a URL as argument or configure paths in visdiff.config.js'));
      return 1;
    }

    console.log(chalk.blue(`Watching ${urlsToWatch.length} URL(s) across ${config.viewports.length} viewport(s)...`));
    console.log();

    // Initialize components
    browserManager = new BrowserManager();
    await browserManager.launch();

    const captureEngine = new CaptureEngine(browserManager);
    const compareEngine = new CompareEngine();
    const storage = new StorageManager(cwd, config.storage);

    // Ensure storage directories exist
    await storage.initialize();

    // Perform initial comparison
    console.log(chalk.blue('Performing initial comparison...'));
    const initialResults = await performComparison(
      urlsToWatch,
      config,
      browserManager,
      compareEngine,
      storage
    );
    displayResults(initialResults, new Date());

    // Set up polling-based watching
    // We poll the URL periodically to detect changes
    const pollTimer = setInterval(async () => {
      if (isRunning || shouldExit) {
        return;
      }

      // Debounce rapid changes
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }

      debounceTimer = setTimeout(async () => {
        if (shouldExit) {
          return;
        }

        isRunning = true;
        
        try {
          const results = await performComparison(
            urlsToWatch,
            config,
            browserManager!,
            captureEngine,
            compareEngine,
            storage
          );
          displayResults(results, new Date());
        } catch (error) {
          // Continue watching even after failures
          console.error(chalk.red('  Comparison failed, continuing to watch...'));
        } finally {
          isRunning = false;
        }
      }, debounceDelay);
    }, pollInterval);

    // Set up file system watcher for local files (if watching localhost)
    const isLocalhost = urlsToWatch.some(u => u.includes('localhost') || u.includes('127.0.0.1'));
    
    if (isLocalhost) {
      // Watch common source directories
      const watchPaths = ['src', 'public', 'dist', 'build'].filter(p => {
        try {
          const fs = require('fs');
          return fs.existsSync(p);
        } catch {
          return false;
        }
      });

      if (watchPaths.length > 0) {
        console.log(chalk.gray(`  Watching file system: ${watchPaths.join(', ')}`));
        
        watcher = watch(watchPaths[0], { recursive: true }, async (eventType, filename) => {
          if (shouldExit || isRunning) {
            return;
          }

          // Debounce file system changes
          if (debounceTimer) {
            clearTimeout(debounceTimer);
          }

          debounceTimer = setTimeout(async () => {
            if (shouldExit) {
              return;
            }

            isRunning = true;
            console.log(chalk.gray(`  Change detected: ${filename || 'unknown'}`));
            
            try {
              const results = await performComparison(
                urlsToWatch,
                config,
                browserManager!,
                captureEngine,
                compareEngine,
                storage
              );
              displayResults(results, new Date());
            } catch (error) {
              // Continue watching even after failures
              console.error(chalk.red('  Comparison failed, continuing to watch...'));
            } finally {
              isRunning = false;
            }
          }, debounceDelay);
        });
      }
    }

    // Handle graceful shutdown
    const cleanup = async () => {
      if (shouldExit) {
        return;
      }
      
      shouldExit = true;
      console.log();
      console.log(chalk.blue('Shutting down watch mode...'));

      // Clear timers
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      clearInterval(pollTimer);

      // Close file watcher
      if (watcher) {
        watcher.close();
      }

      // Close browser
      if (browserManager) {
        try {
          await browserManager.close();
          console.log(chalk.green('✓ Resources cleaned up'));
        } catch (error) {
          console.error(chalk.yellow('Warning: Failed to close browser'), error);
        }
      }

      process.exit(0);
    };

    // Register signal handlers
    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);

    // Keep process alive
    return new Promise<number>(() => {
      // This promise never resolves - watch mode runs until interrupted
    });

  } catch (error) {
    console.error(chalk.red('✗ Watch mode failed'));
    console.error(chalk.red((error as Error).message));
    
    // Clean up on error
    if (watcher) {
      watcher.close();
    }
    
    if (browserManager) {
      try {
        await browserManager.close();
      } catch (cleanupError) {
        console.error(chalk.yellow('Warning: Failed to close browser'), cleanupError);
      }
    }
    
    return 1;
  }
}
