# Implementation Plan: @web-loom/visdiff Phase 1

- [x] 1. Set up project structure and core dependencies
  - Create package structure with src/, dist/, and test/ directories
  - Install core dependencies: puppeteer, sharp, pixelmatch, commander, zod, chalk
  - Install dev dependencies: vitest, fast-check, TypeScript, ESLint, Prettier
  - Configure TypeScript with strict mode and proper module resolution
  - Set up Vitest configuration with 100+ iterations for property tests
  - Create basic package.json with CLI bin entry point
  - _Requirements: All_

- [x] 2. Implement configuration system
- [x] 2.1 Create configuration schema with Zod
  - Define VisDiffConfig, Viewport, CaptureOptions, DiffOptions, StorageConfig types
  - Create Zod schemas for validation
  - Implement default configuration values
  - _Requirements: 1.3, 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 2.2 Write property test for configuration validation
  - **Property 24: Configuration validation**
  - **Validates: Requirements 6.1**

- [x] 2.3 Write property test for default configuration
  - **Property 1: Default configuration application**
  - **Validates: Requirements 1.3**

- [x] 2.4 Implement configuration file loading and saving
  - Create loadConfig() function to read visdiff.config.js
  - Create saveConfig() function to write .visdiff/config.json
  - Implement configuration merging (user config + defaults)
  - Handle missing configuration files gracefully
  - _Requirements: 1.1, 1.4, 6.6_

- [x] 2.5 Write property test for configuration preservation
  - **Property 2: Configuration preservation on re-initialization**
  - **Validates: Requirements 1.4**

- [x] 2.6 Write property test for configuration error reporting
  - **Property 29: Configuration error reporting**
  - **Validates: Requirements 6.6**

- [x] 3. Implement storage manager
- [x] 3.1 Create storage manager class
  - Implement directory structure creation (.visdiff/baselines, .visdiff/diffs, .visdiff/backups)
  - Create loadBaseline() and saveBaseline() functions
  - Implement saveDiff() with timestamped directories
  - Create saveReport() for JSON report generation
  - Implement getLatestReport() to read most recent results
  - _Requirements: 1.2, 2.3, 3.4, 3.5, 7.1_

- [x] 3.2 Write property test for file naming convention
  - **Property 5: Consistent file naming convention**
  - **Validates: Requirements 2.3**

- [x] 3.3 Write property test for timestamped storage
  - **Property 12: Timestamped diff storage**
  - **Validates: Requirements 3.4**

- [x] 3.4 Write property test for JSON report generation
  - **Property 13: JSON report generation**
  - **Validates: Requirements 3.5**

- [x] 3.5 Implement backup and approval functions
  - Create backupBaselines() to copy baselines to backup directory
  - Implement approveChanges() to replace baselines with current screenshots
  - Support selective approval by identifier
  - _Requirements: 4.1, 4.2, 4.5_

- [x] 3.6 Write property test for baseline replacement
  - **Property 16: Baseline replacement on approval**
  - **Validates: Requirements 4.1**

- [x] 3.7 Write property test for baseline backup
  - **Property 17: Baseline backup on approval**
  - **Validates: Requirements 4.2**

- [x] 3.8 Write property test for selective approval
  - **Property 19: Selective approval**
  - **Validates: Requirements 4.5**

- [x] 4. Implement browser manager
- [x] 4.1 Create browser manager class
  - Implement launch() to start Puppeteer browser
  - Create page pool for reuse (getPage(), releasePage())
  - Implement close() to terminate browser and cleanup
  - Add restart() for crash recovery
  - Implement getMemoryUsage() monitoring
  - _Requirements: 2.1, 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 4.2 Write property test for browser instance reuse
  - **Property 33: Browser instance reuse**
  - **Validates: Requirements 8.1**

- [x] 4.3 Write property test for page cleanup
  - **Property 34: Page cleanup after capture**
  - **Validates: Requirements 8.2**

- [x] 4.4 Write property test for process termination
  - **Property 35: Process termination on exit**
  - **Validates: Requirements 8.3**

- [x] 4.5 Write property test for crash recovery
  - **Property 36: Browser crash recovery**
  - **Validates: Requirements 8.4**

- [x] 4.6 Write property test for memory monitoring
  - **Property 37: Memory usage monitoring**
  - **Validates: Requirements 8.5**

- [ ] 5. Implement capture engine
- [ ] 5.1 Create capture engine class
  - Implement capture() for single URL and viewport
  - Add viewport setting logic
  - Implement network idle detection
  - Add custom script execution support
  - Handle capture timeouts with retries
  - _Requirements: 2.1, 2.4, 11.1, 11.2, 11.4_

- [ ] 5.2 Write property test for browser navigation
  - **Property 3: Browser navigation for valid URLs**
  - **Validates: Requirements 2.1**

- [ ] 5.3 Write property test for network idle waiting
  - **Property 46: Network idle waiting**
  - **Validates: Requirements 11.1**

- [ ] 5.4 Write property test for timeout fallback
  - **Property 47: Timeout fallback**
  - **Validates: Requirements 11.2**

- [ ] 5.5 Write property test for pre-capture script execution
  - **Property 49: Pre-capture script execution**
  - **Validates: Requirements 11.4**

- [ ] 5.2 Implement full-page capture with scrolling
  - Add fullPage option handling
  - Implement scroll and stitch logic for long pages
  - Ensure captured image height exceeds viewport for long content
  - _Requirements: 2.6_

- [ ] 5.7 Write property test for full-page capture
  - **Property 8: Full-page capture height**
  - **Validates: Requirements 2.6**

- [ ] 5.8 Implement captureAll() for batch captures
  - Add parallel capture support for multiple viewports
  - Implement error resilience (continue on failure)
  - Generate capture summary with success/failure counts
  - _Requirements: 2.2, 2.4, 2.5_

- [ ] 5.9 Write property test for viewport coverage
  - **Property 4: Complete viewport coverage**
  - **Validates: Requirements 2.2**

- [ ] 5.10 Write property test for error resilience
  - **Property 6: Error resilience during capture**
  - **Validates: Requirements 2.4**

- [ ] 5.11 Write property test for capture summary
  - **Property 7: Capture summary completeness**
  - **Validates: Requirements 2.5**

- [ ] 5.12 Add custom wait conditions
  - Implement waitForSelector support
  - Add animation delay handling
  - _Requirements: 11.3, 11.5_

- [ ] 5.13 Write property test for custom selector waiting
  - **Property 48: Custom selector waiting**
  - **Validates: Requirements 11.3**

- [ ] 5.14 Write property test for animation delay
  - **Property 50: Animation delay respect**
  - **Validates: Requirements 11.5**

- [ ] 6. Implement comparison engine
- [ ] 6.1 Create comparison engine class
  - Implement compare() using pixelmatch
  - Add threshold-based pass/fail logic
  - Implement ignoreAntialiasing option
  - Implement ignoreColors option
  - Generate diff images with highlighted changes
  - _Requirements: 3.2, 3.3, 9.1, 9.2, 9.3, 9.4_

- [ ] 6.2 Write property test for threshold respect
  - **Property 10: Threshold respect**
  - **Validates: Requirements 3.2**

- [ ] 6.3 Write property test for diff image generation
  - **Property 11: Diff image generation on failure**
  - **Validates: Requirements 3.3**

- [ ] 6.4 Write property test for anti-aliasing tolerance
  - **Property 38: Anti-aliasing tolerance**
  - **Validates: Requirements 9.1**

- [ ] 6.5 Write property test for color-blind comparison
  - **Property 39: Color-blind comparison**
  - **Validates: Requirements 9.2**

- [ ] 6.6 Write property test for threshold-based identity
  - **Property 40: Threshold-based identity**
  - **Validates: Requirements 9.3**

- [ ] 6.7 Write property test for diff visualization
  - **Property 41: Diff visualization contrast**
  - **Validates: Requirements 9.4**

- [ ] 6.8 Implement compareAll() for batch comparisons
  - Add parallel comparison support
  - Handle missing baselines gracefully
  - Calculate difference metrics (percentage, pixel count)
  - _Requirements: 3.1, 3.6, 12.3_

- [ ] 6.9 Write property test for comparison coverage
  - **Property 9: Complete comparison coverage**
  - **Validates: Requirements 3.1**

- [ ] 6.10 Write property test for comparison failure percentage
  - **Property 53: Comparison failure percentage**
  - **Validates: Requirements 12.3**

- [ ] 7. Implement CLI commands
- [ ] 7.1 Create CLI parser with Commander
  - Set up Commander with program name and version
  - Define command structure (init, capture, compare, approve, watch, status)
  - Implement argument parsing and validation
  - Add help text and usage examples
  - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1, 7.1_

- [ ] 7.2 Implement init command
  - Create default configuration file
  - Create directory structure
  - Output success message with next steps
  - Handle existing configuration preservation
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 7.3 Implement capture command
  - Parse URL and options
  - Initialize browser manager and capture engine
  - Capture screenshots for all viewports
  - Save baselines to storage
  - Output capture summary
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

- [ ] 7.4 Implement compare command
  - Load configuration
  - Capture current screenshots
  - Load baselines and compare
  - Generate diff images and report
  - Return appropriate exit code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

- [ ] 7.5 Write property test for success exit code
  - **Property 14: Success exit code**
  - **Validates: Requirements 3.7**

- [ ] 7.6 Write property test for failure exit code
  - **Property 15: Failure exit code**
  - **Validates: Requirements 3.8**

- [ ] 7.7 Implement approve command
  - Load current screenshots and baselines
  - Create backup of existing baselines
  - Replace baselines with current screenshots
  - Output list of updated baselines
  - Handle selective approval by path
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 7.8 Write property test for approval output
  - **Property 18: Approval output listing**
  - **Validates: Requirements 4.3**

- [ ] 7.9 Implement status command
  - Load latest comparison report
  - Display summary counts (passed, failed, new)
  - Show timestamp of last comparison
  - List failed paths and viewports
  - Handle case when no comparisons exist
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 7.10 Write property test for status count accuracy
  - **Property 30: Status count accuracy**
  - **Validates: Requirements 7.2**

- [ ] 7.11 Write property test for status timestamp
  - **Property 31: Status timestamp inclusion**
  - **Validates: Requirements 7.4**

- [ ] 7.12 Write property test for status failure details
  - **Property 32: Status failure details**
  - **Validates: Requirements 7.5**

- [ ] 7.13 Implement watch command
  - Start file system watcher or dev server monitor
  - Trigger automatic capture and compare on changes
  - Display real-time results in terminal
  - Continue watching after failures
  - Handle graceful shutdown with resource cleanup
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 7.14 Write property test for automatic capture on change
  - **Property 20: Automatic capture on change in watch mode**
  - **Validates: Requirements 5.2**

- [ ] 7.15 Write property test for real-time output
  - **Property 21: Real-time output in watch mode**
  - **Validates: Requirements 5.3**

- [ ] 7.16 Write property test for watch mode resilience
  - **Property 22: Watch mode resilience**
  - **Validates: Requirements 5.4**

- [ ] 7.17 Write property test for resource cleanup
  - **Property 23: Resource cleanup on watch exit**
  - **Validates: Requirements 5.5**

- [ ] 8. Implement CI/CD integration features
- [ ] 8.1 Add CI environment detection
  - Detect CI environment variables (CI, GITHUB_ACTIONS, etc.)
  - Adjust output formatting for machine readability
  - Ensure JSON reports are generated
  - _Requirements: 10.1, 10.3_

- [ ] 8.2 Write property test for CI environment detection
  - **Property 42: CI environment detection**
  - **Validates: Requirements 10.1**

- [ ] 8.3 Write property test for CI JSON output
  - **Property 44: CI JSON output**
  - **Validates: Requirements 10.3**

- [ ] 8.4 Implement CI-specific error handling
  - Ensure non-zero exit codes on failure
  - Fail fast on missing baselines
  - Enforce timeout compliance
  - _Requirements: 10.2, 10.4, 10.5_

- [ ] 8.5 Write property test for CI failure exit code
  - **Property 43: CI failure exit code**
  - **Validates: Requirements 10.2**

- [ ] 8.6 Write property test for CI timeout compliance
  - **Property 45: CI timeout compliance**
  - **Validates: Requirements 10.5**

- [ ] 9. Implement error handling and logging
- [ ] 9.1 Create error classes and handlers
  - Define ConfigurationError, BrowserError, CaptureError, ComparisonError, FileSystemError
  - Implement error context collection
  - Add retry logic with exponential backoff
  - _Requirements: 12.1, 12.2, 12.4_

- [ ] 9.2 Write property test for descriptive error messages
  - **Property 51: Descriptive error messages**
  - **Validates: Requirements 12.1**

- [ ] 9.3 Write property test for navigation error details
  - **Property 52: Navigation error details**
  - **Validates: Requirements 12.2**

- [ ] 9.4 Write property test for configuration error specificity
  - **Property 54: Configuration error specificity**
  - **Validates: Requirements 12.4**

- [ ] 9.5 Implement logging system
  - Create logger with levels (error, warn, info, debug)
  - Add verbose mode support
  - Format output with chalk for terminal
  - _Requirements: 12.5_

- [ ] 9.6 Write property test for verbose logging
  - **Property 55: Verbose logging detail**
  - **Validates: Requirements 12.5**

- [ ] 10. Implement configuration options
- [ ] 10.1 Add viewport configuration support
  - Parse and validate viewport dimensions
  - Apply custom viewports during capture
  - _Requirements: 6.2_

- [ ] 10.2 Write property test for custom viewport respect
  - **Property 25: Custom viewport respect**
  - **Validates: Requirements 6.2**

- [ ] 10.3 Add capture options support
  - Implement fullPage, omitBackground, timeout options
  - Apply options during capture
  - _Requirements: 6.3_

- [ ] 10.4 Write property test for capture options application
  - **Property 26: Capture options application**
  - **Validates: Requirements 6.3**

- [ ] 10.5 Add diff options support
  - Implement threshold, ignoreAntialiasing, ignoreColors options
  - Apply options during comparison
  - _Requirements: 6.4_

- [ ] 10.6 Write property test for diff options application
  - **Property 27: Diff options application**
  - **Validates: Requirements 6.4**

- [ ] 10.7 Add storage path customization
  - Support custom baselineDir and diffDir
  - Create directories if they don't exist
  - _Requirements: 6.5_

- [ ] 10.8 Write property test for custom storage paths
  - **Property 28: Custom storage paths**
  - **Validates: Requirements 6.5**

- [ ] 11. Create documentation
- [ ] 11.1 Write README.md
  - Add installation instructions
  - Include quick start guide
  - Document all CLI commands with examples
  - Add configuration reference
  - _Requirements: All_

- [ ] 11.2 Write API documentation
  - Document all public interfaces
  - Add JSDoc comments to code
  - Generate TypeScript documentation
  - _Requirements: All_

- [ ] 11.3 Create example configurations
  - Add example visdiff.config.js files
  - Document common use cases
  - Include CI integration examples
  - _Requirements: All_

- [ ] 12. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
