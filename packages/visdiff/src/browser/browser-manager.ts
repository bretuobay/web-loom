/**
 * Browser Manager for @web-loom/visdiff
 * Manages Puppeteer browser lifecycle, page pooling, and resource cleanup
 */

import puppeteer, { Browser, Page } from 'puppeteer';

/**
 * Configuration options for the browser manager
 */
export interface BrowserManagerOptions {
  headless?: boolean;
  args?: string[];
  maxPages?: number;
}

/**
 * Manages browser lifecycle and page pooling for efficient screenshot capture
 */
export class BrowserManager {
  private browser: Browser | null = null;
  private pagePool: Page[] = [];
  private activePagesCount = 0;
  private options: BrowserManagerOptions;
  private isLaunching = false;
  private launchPromise: Promise<void> | null = null;

  constructor(options: BrowserManagerOptions = {}) {
    this.options = {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      maxPages: 5,
      ...options,
    };
  }

  /**
   * Launch the Puppeteer browser instance
   */
  async launch(): Promise<void> {
    // If already launching, wait for that to complete
    if (this.isLaunching && this.launchPromise) {
      return this.launchPromise;
    }

    // If already launched, return immediately
    if (this.browser && this.browser.connected) {
      return;
    }

    // Set launching flag and create promise
    this.isLaunching = true;
    this.launchPromise = this._doLaunch();

    try {
      await this.launchPromise;
    } finally {
      this.isLaunching = false;
      this.launchPromise = null;
    }
  }

  private async _doLaunch(): Promise<void> {
    try {
      this.browser = await puppeteer.launch({
        headless: this.options.headless,
        args: this.options.args,
      });

      // Set up disconnect handler for crash detection
      this.browser.on('disconnected', () => {
        this.browser = null;
        this.pagePool = [];
        this.activePagesCount = 0;
      });
    } catch (error) {
      this.browser = null;
      throw new Error(`Failed to launch browser: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get a page from the pool or create a new one
   */
  async getPage(): Promise<Page> {
    // Ensure browser is launched
    if (!this.browser || !this.browser.connected) {
      await this.launch();
    }

    if (!this.browser) {
      throw new Error('Browser not available');
    }

    // Try to get a page from the pool
    const pooledPage = this.pagePool.pop();
    if (pooledPage) {
      this.activePagesCount++;
      return pooledPage;
    }

    // Create a new page if under the limit
    if (this.activePagesCount < (this.options.maxPages || 5)) {
      const page = await this.browser.newPage();
      this.activePagesCount++;
      return page;
    }

    // Wait a bit and try again if at max capacity
    await new Promise((resolve) => setTimeout(resolve, 100));
    return this.getPage();
  }

  /**
   * Release a page back to the pool
   */
  async releasePage(page: Page): Promise<void> {
    if (!page || page.isClosed()) {
      this.activePagesCount = Math.max(0, this.activePagesCount - 1);
      return;
    }

    try {
      // Clear any navigation state
      await page.goto('about:blank', { waitUntil: 'load', timeout: 5000 }).catch(() => {
        // Ignore navigation errors when going to about:blank
      });

      // Return to pool if under max size
      if (this.pagePool.length < (this.options.maxPages || 5)) {
        this.pagePool.push(page);
        this.activePagesCount = Math.max(0, this.activePagesCount - 1);
      } else {
        // Close the page if pool is full
        await page.close();
        this.activePagesCount = Math.max(0, this.activePagesCount - 1);
      }
    } catch (error) {
      // If there's an error, just close the page
      try {
        await page.close();
      } catch {
        // Ignore close errors
      }
      this.activePagesCount = Math.max(0, this.activePagesCount - 1);
    }
  }

  /**
   * Restart the browser (useful for crash recovery)
   */
  async restart(): Promise<void> {
    await this.close();
    await this.launch();
  }

  /**
   * Close the browser and cleanup all resources
   */
  async close(): Promise<void> {
    // Close all pooled pages
    const closePromises = this.pagePool.map((page) =>
      page.close().catch(() => {
        // Ignore errors when closing pages
      }),
    );
    await Promise.all(closePromises);
    this.pagePool = [];

    // Close the browser
    if (this.browser) {
      try {
        await this.browser.close();
      } catch (error) {
        // Ignore errors when closing browser
      }
      this.browser = null;
    }

    this.activePagesCount = 0;
  }

  /**
   * Get current memory usage in bytes
   */
  async getMemoryUsage(): Promise<number> {
    if (!this.browser || !this.browser.connected) {
      return 0;
    }

    try {
      // Use process memory as a simpler approach
      if (process.memoryUsage) {
        return process.memoryUsage().heapUsed;
      }
      return 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Check if browser is currently running
   */
  isRunning(): boolean {
    return this.browser !== null && this.browser.connected;
  }

  /**
   * Get the number of active pages
   */
  getActivePageCount(): number {
    return this.activePagesCount;
  }

  /**
   * Get the number of pooled pages
   */
  getPooledPageCount(): number {
    return this.pagePool.length;
  }
}
