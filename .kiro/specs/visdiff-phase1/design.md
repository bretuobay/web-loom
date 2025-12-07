# Design Document: @web-loom/visdiff Phase 1

## Overview

WebLoom VisDiff Phase 1 implements a local-first visual regression testing tool with a CLI interface, headless browser control, and pixel-level image comparison. The system captures screenshots across multiple viewports, compares them against baselines, and provides developers with immediate feedback on visual changes. The architecture prioritizes simplicity, performance, and developer experience while maintaining extensibility for future phases.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         CLI Layer                            │
│  (Command Parser, Argument Validation, Output Formatting)   │
└────────────────┬────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────┐
│                    Core Orchestrator                         │
│  (Workflow Coordination, State Management, Error Handling)  │
└─────┬──────────┬──────────┬──────────┬─────────────────────┘
      │          │          │          │
┌─────▼────┐ ┌──▼──────┐ ┌─▼────────┐ ┌▼──────────────────┐
│ Browser  │ │ Capture │ │ Compare  │ │ Storage           │
│ Manager  │ │ Engine  │ │ Engine   │ │ Manager           │
└──────────┘ └─────────┘ └──────────┘ └───────────────────┘
      │          │          │          │
      │          │          │          │
┌─────▼──────────▼──────────▼──────────▼───────────────────┐
│                  File System Layer                         │
│  (Baselines, Diffs, Configuration, Reports)               │
└────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

**CLI Layer**
- Parse command-line arguments and options
- Validate user input
- Format output for terminal display
- Handle process signals (SIGINT, SIGTERM)
- Provide help and usage information

**Core Orchestrator**
- Coordinate workflow between components
- Manage application state and lifecycle
- Handle errors and provide recovery strategies
- Emit events for logging and monitoring
- Enforce configuration constraints

**Browser Manager**
- Launch and manage Puppeteer browser instances
- Pool browser pages for reuse
- Handle browser crashes and restarts
- Monitor memory usage
- Clean up resources on shutdown

**Capture Engine**
- Navigate to URLs and wait for page ready
- Capture screenshots at specified viewports
- Handle full-page scrolling and stitching
- Execute custom scripts before capture
- Manage capture timeouts and retries

**Compare Engine**
- Load baseline and current images
- Perform pixel-level comparison using pixelmatch
- Apply threshold and ignore options
- Generate diff images with highlighted changes
- Calculate difference metrics

**Storage Manager**
- Read and write configuration files
- Organize baseline and diff directories
- Generate timestamped output directories
- Create JSON reports and summaries
- Manage backup directories for approvals

## Components and Interfaces

### CLI Commands Interface

```typescript
interface CLICommand {
  name: string;
  description: string;
  options: CLIOption[];
  execute(args: ParsedArguments): Promise<number>; // Returns exit code
}

interface CLIOption {
  name: string;
  alias?: string;
  description: string;
  type: 'string' | 'number' | 'boolean' | 'array';
  required: boolean;
  default?: unknown;
}

interface ParsedArguments {
  command: string;
  options: Record<string, unknown>;
  positional: string[];
}
```

### Configuration Schema

```typescript
interface VisDiffConfig {
  viewports: Viewport[];
  paths: string[];
  captureOptions: CaptureOptions;
  diffOptions: DiffOptions;
  storage: StorageConfig;
}

interface Viewport {
  width: number;
  height: number;
  name: string;
  deviceScaleFactor?: number;
}

interface CaptureOptions {
  fullPage: boolean;
  omitBackground: boolean;
  timeout: number;
  waitForNetworkIdle?: boolean;
  waitForSelector?: string;
  customScript?: string;
  animationDelay?: number;
}

interface DiffOptions {
  threshold: number; // 0-1, percentage of acceptable difference
  ignoreAntialiasing: boolean;
  ignoreColors: boolean;
  highlightColor: string; // RGB hex color for diff highlighting
}

interface StorageConfig {
  baselineDir: string;
  diffDir: string;
  format: 'png' | 'jpeg';
  compression?: number; // 0-100 for JPEG
}
```

### Browser Manager Interface

```typescript
interface BrowserManager {
  launch(): Promise<void>;
  getPage(): Promise<Page>;
  releasePage(page: Page): Promise<void>;
  restart(): Promise<void>;
  close(): Promise<void>;
  getMemoryUsage(): number;
}

interface Page {
  goto(url: string, options?: NavigationOptions): Promise<void>;
  setViewport(viewport: Viewport): Promise<void>;
  screenshot(options: ScreenshotOptions): Promise<Buffer>;
  evaluate(script: string): Promise<unknown>;
  waitForSelector(selector: string, options?: WaitOptions): Promise<void>;
  waitForNetworkIdle(options?: NetworkIdleOptions): Promise<void>;
}
```

### Capture Engine Interface

```typescript
interface CaptureEngine {
  capture(url: string, viewport: Viewport, options: CaptureOptions): Promise<CaptureResult>;
  captureAll(urls: string[], viewports: Viewport[], options: CaptureOptions): Promise<CaptureResult[]>;
}

interface CaptureResult {
  url: string;
  viewport: Viewport;
  image: Buffer;
  timestamp: Date;
  success: boolean;
  error?: Error;
  metadata: CaptureMetadata;
}

interface CaptureMetadata {
  loadTime: number;
  imageSize: number;
  dimensions: { width: number; height: number };
}
```

### Compare Engine Interface

```typescript
interface CompareEngine {
  compare(baseline: Buffer, current: Buffer, options: DiffOptions): Promise<ComparisonResult>;
  compareAll(comparisons: ComparisonPair[], options: DiffOptions): Promise<ComparisonResult[]>;
}

interface ComparisonPair {
  baseline: Buffer;
  current: Buffer;
  identifier: string; // e.g., "home-mobile"
}

interface ComparisonResult {
  identifier: string;
  passed: boolean;
  difference: number; // 0-1, percentage of pixels that differ
  diffImage?: Buffer;
  dimensions: { width: number; height: number };
  pixelsDifferent: number;
  error?: Error;
}
```

### Storage Manager Interface

```typescript
interface StorageManager {
  loadConfig(): Promise<VisDiffConfig>;
  saveConfig(config: VisDiffConfig): Promise<void>;
  loadBaseline(identifier: string): Promise<Buffer | null>;
  saveBaseline(identifier: string, image: Buffer): Promise<void>;
  saveDiff(result: ComparisonResult, timestamp: Date): Promise<void>;
  saveReport(results: ComparisonResult[], timestamp: Date): Promise<void>;
  getLatestReport(): Promise<Report | null>;
  backupBaselines(): Promise<void>;
  approveChanges(identifiers?: string[]): Promise<void>;
}

interface Report {
  timestamp: Date;
  results: ComparisonResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    new: number;
  };
}
```

## Data Models

### File System Structure

```
project-root/
├── visdiff.config.js          # User configuration
├── .visdiff/
│   ├── config.json            # Resolved configuration
│   ├── baselines/
│   │   ├── main/              # Branch-specific baselines
│   │   │   ├── home-mobile.png
│   │   │   ├── home-tablet.png
│   │   │   ├── home-desktop.png
│   │   │   ├── about-mobile.png
│   │   │   └── ...
│   │   └── feature-branch/
│   │       └── ...
│   ├── diffs/
│   │   └── 2024-12-07-14-30-22/  # Timestamped diff runs
│   │       ├── diff-home-mobile.png
│   │       ├── diff-about-tablet.png
│   │       ├── report.json
│   │       └── summary.md
│   └── backups/
│       └── 2024-12-07-14-25-10/  # Backup before approval
│           └── ...
```

### Report JSON Schema

```json
{
  "timestamp": "2024-12-07T14:30:22.000Z",
  "config": {
    "viewports": [...],
    "paths": [...],
    "diffOptions": {...}
  },
  "results": [
    {
      "identifier": "home-mobile",
      "url": "http://localhost:3000/",
      "viewport": { "width": 375, "height": 667, "name": "mobile" },
      "passed": false,
      "difference": 0.0234,
      "pixelsDifferent": 1250,
      "dimensions": { "width": 375, "height": 667 },
      "diffImagePath": ".visdiff/diffs/2024-12-07-14-30-22/diff-home-mobile.png"
    }
  ],
  "summary": {
    "total": 12,
    "passed": 10,
    "failed": 2,
    "new": 0
  }
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Default configuration application
*For any* invocation of the init command without configuration options, the system should create a configuration file with default viewports, paths, and capture options
**Validates: Requirements 1.3**

### Property 2: Configuration preservation on re-initialization
*For any* existing configuration file, running the init command should preserve the existing configuration without overwriting it
**Validates: Requirements 1.4**

### Property 3: Browser navigation for valid URLs
*For any* valid URL provided to the capture command, the system should successfully launch a headless browser and navigate to that URL
**Validates: Requirements 2.1**

### Property 4: Complete viewport coverage
*For any* set of configured viewports, the capture command should produce screenshots for all viewports
**Validates: Requirements 2.2**

### Property 5: Consistent file naming convention
*For any* page name and viewport combination, the stored screenshot filename should include both the page name and viewport name
**Validates: Requirements 2.3**

### Property 6: Error resilience during capture
*For any* page that fails to load within the timeout period, the system should report the error and continue capturing remaining pages
**Validates: Requirements 2.4**

### Property 7: Capture summary completeness
*For any* capture run, the output summary should include counts of both successful and failed captures
**Validates: Requirements 2.5**

### Property 8: Full-page capture height
*For any* page with content exceeding the viewport height, full-page capture should produce an image taller than the viewport
**Validates: Requirements 2.6**

### Property 9: Complete comparison coverage
*For any* configuration with multiple paths and viewports, the compare command should capture and compare all combinations
**Validates: Requirements 3.1**

### Property 10: Threshold respect
*For any* configured threshold value, pixel differences below that threshold should result in a passing comparison
**Validates: Requirements 3.2**

### Property 11: Diff image generation on failure
*For any* comparison where differences exceed the threshold, a diff image highlighting changed regions should be generated
**Validates: Requirements 3.3**

### Property 12: Timestamped diff storage
*For any* comparison run that detects differences, the diff output should be stored in a directory with a timestamp
**Validates: Requirements 3.4**

### Property 13: JSON report generation
*For any* completed comparison, a summary report in valid JSON format should be generated
**Validates: Requirements 3.5**

### Property 14: Success exit code
*For any* comparison run where all comparisons pass, the system should return exit code 0
**Validates: Requirements 3.7**

### Property 15: Failure exit code
*For any* comparison run where at least one comparison fails, the system should return a non-zero exit code
**Validates: Requirements 3.8**

### Property 16: Baseline replacement on approval
*For any* existing baseline, running the approve command should replace it with the current screenshot
**Validates: Requirements 4.1**

### Property 17: Baseline backup on approval
*For any* approval operation, the original baselines should be preserved in a backup directory before replacement
**Validates: Requirements 4.2**

### Property 18: Approval output listing
*For any* approve command execution, the output should list all baselines that were updated
**Validates: Requirements 4.3**

### Property 19: Selective approval
*For any* subset of paths specified in the approve command, only baselines for those paths should be updated
**Validates: Requirements 4.5**

### Property 20: Automatic capture on change in watch mode
*For any* change detected in the watched application, the system should automatically capture and compare screenshots
**Validates: Requirements 5.2**

### Property 21: Real-time output in watch mode
*For any* comparison performed in watch mode, results should be displayed in the terminal in real-time
**Validates: Requirements 5.3**

### Property 22: Watch mode resilience
*For any* comparison failure in watch mode, the system should continue watching without exiting
**Validates: Requirements 5.4**

### Property 23: Resource cleanup on watch exit
*For any* watch mode session, stopping the watcher should clean up all browser resources and exit gracefully
**Validates: Requirements 5.5**

### Property 24: Configuration validation
*For any* configuration file, the system should validate it against the schema and reject invalid configurations
**Validates: Requirements 6.1**

### Property 25: Custom viewport respect
*For any* custom viewport configuration with width, height, and name, the system should use those exact values for captures
**Validates: Requirements 6.2**

### Property 26: Capture options application
*For any* capture options specified (fullPage, omitBackground, timeout), the system should apply those settings during capture
**Validates: Requirements 6.3**

### Property 27: Diff options application
*For any* diff options configured (threshold, ignoreAntialiasing, ignoreColors), the system should apply those settings during comparison
**Validates: Requirements 6.4**

### Property 28: Custom storage paths
*For any* custom storage paths specified in configuration, the system should store baselines and diffs in those directories
**Validates: Requirements 6.5**

### Property 29: Configuration error reporting
*For any* invalid configuration, the system should report validation errors with helpful messages
**Validates: Requirements 6.6**

### Property 30: Status count accuracy
*For any* status command execution, the displayed counts of passed, failed, and new screenshots should match the latest comparison results
**Validates: Requirements 7.2**

### Property 31: Status timestamp inclusion
*For any* status display, the timestamp of the last comparison should be included
**Validates: Requirements 7.4**

### Property 32: Status failure details
*For any* failed comparisons, the status command should list the specific paths and viewports that failed
**Validates: Requirements 7.5**

### Property 33: Browser instance reuse
*For any* sequence of multiple captures, the same browser instance should be reused rather than launching new instances
**Validates: Requirements 8.1**

### Property 34: Page cleanup after capture
*For any* completed capture, the browser page should be closed to free memory
**Validates: Requirements 8.2**

### Property 35: Process termination on exit
*For any* system exit, all browser processes should be terminated
**Validates: Requirements 8.3**

### Property 36: Browser crash recovery
*For any* browser crash, the system should detect the failure and restart the browser
**Validates: Requirements 8.4**

### Property 37: Memory usage monitoring
*For any* execution where memory usage exceeds 1GB, the system should log a warning
**Validates: Requirements 8.5**

### Property 38: Anti-aliasing tolerance
*For any* pair of images with only anti-aliasing differences and ignoreAntialiasing enabled, the comparison should pass
**Validates: Requirements 9.1**

### Property 39: Color-blind comparison
*For any* pair of images with only color differences and ignoreColors enabled, the comparison should pass
**Validates: Requirements 9.2**

### Property 40: Threshold-based identity
*For any* pixel difference percentage below the configured threshold, the images should be considered identical
**Validates: Requirements 9.3**

### Property 41: Diff visualization contrast
*For any* generated diff image, changed pixels should be highlighted in a contrasting color
**Validates: Requirements 9.4**

### Property 42: CI environment detection
*For any* execution in a CI environment (detected via environment variables), the system should adjust output formatting for machine readability
**Validates: Requirements 10.1**

### Property 43: CI failure exit code
*For any* comparison failure in a CI environment, the system should return a non-zero exit code
**Validates: Requirements 10.2**

### Property 44: CI JSON output
*For any* execution in a CI environment, the system should output machine-readable JSON reports
**Validates: Requirements 10.3**

### Property 45: CI timeout compliance
*For any* execution in a CI environment, the system should complete within the configured timeout period
**Validates: Requirements 10.5**

### Property 46: Network idle waiting
*For any* page capture, the system should wait for network idle before taking the screenshot
**Validates: Requirements 11.1**

### Property 47: Timeout fallback
*For any* network idle timeout expiration, the system should proceed with capture and log a warning
**Validates: Requirements 11.2**

### Property 48: Custom selector waiting
*For any* custom wait selector specified, the system should wait for that selector to appear before capturing
**Validates: Requirements 11.3**

### Property 49: Pre-capture script execution
*For any* custom script specified, the system should execute it before taking the screenshot
**Validates: Requirements 11.4**

### Property 50: Animation delay respect
*For any* configured animation delay, the system should wait for that duration before capturing
**Validates: Requirements 11.5**

### Property 51: Descriptive error messages
*For any* error that occurs, the system should output a descriptive error message with context
**Validates: Requirements 12.1**

### Property 52: Navigation error details
*For any* browser navigation failure, the error message should include the URL and error details
**Validates: Requirements 12.2**

### Property 53: Comparison failure percentage
*For any* image comparison failure, the system should report the percentage difference
**Validates: Requirements 12.3**

### Property 54: Configuration error specificity
*For any* invalid configuration, the error message should highlight the specific configuration errors
**Validates: Requirements 12.4**

### Property 55: Verbose logging detail
*For any* execution with verbose logging enabled, the system should output detailed execution information
**Validates: Requirements 12.5**

## Error Handling

### Error Categories

**Configuration Errors**
- Invalid configuration schema
- Missing required fields
- Invalid viewport dimensions
- Invalid threshold values (outside 0-1 range)
- Invalid file paths

**Browser Errors**
- Browser launch failure
- Browser crash during execution
- Page navigation timeout
- Page load failure
- Memory exhaustion

**Capture Errors**
- Screenshot capture failure
- Network timeout
- Selector not found
- Script execution error
- Full-page stitching failure

**Comparison Errors**
- Image dimension mismatch
- Baseline not found
- Image decode failure
- Diff generation failure
- File write failure

**File System Errors**
- Permission denied
- Disk space exhausted
- Directory creation failure
- File read/write failure
- Backup creation failure

### Error Handling Strategies

**Retry with Exponential Backoff**
- Browser launch failures: 3 retries with 1s, 2s, 4s delays
- Page navigation failures: 2 retries with 2s, 4s delays
- File system operations: 2 retries with 500ms, 1s delays

**Graceful Degradation**
- Continue with remaining captures if one fails
- Continue watching after comparison failures in watch mode
- Proceed with capture if network idle timeout expires

**Resource Cleanup**
- Always close browser pages after capture
- Always terminate browser processes on exit
- Always release file handles after operations

**User Feedback**
- Log errors with context and suggestions
- Provide actionable error messages
- Include relevant URLs, paths, and identifiers in errors
- Suggest fixes for common configuration errors

## Testing Strategy

### Unit Testing

Unit tests will verify individual components in isolation:

**CLI Parser Tests**
- Command parsing with various argument combinations
- Option validation and default value application
- Help text generation
- Error handling for invalid arguments

**Configuration Tests**
- Schema validation with valid and invalid configs
- Default value merging
- File loading and saving
- Path resolution

**Browser Manager Tests**
- Browser launch and shutdown
- Page pooling and reuse
- Memory monitoring
- Crash detection and recovery

**Capture Engine Tests**
- Screenshot capture with various options
- Viewport setting
- Network idle detection
- Custom script execution
- Full-page scrolling logic

**Compare Engine Tests**
- Pixel-level comparison with various thresholds
- Anti-aliasing detection
- Color-blind comparison
- Diff image generation
- Dimension mismatch handling

**Storage Manager Tests**
- Baseline loading and saving
- Diff output organization
- Report generation
- Backup creation
- Approval workflow

### Property-Based Testing

Property-based tests will use **fast-check** (JavaScript property testing library) to verify universal properties across many randomly generated inputs. Each property test will run a minimum of 100 iterations.

**Property Test Examples:**

1. **Configuration round-trip**: For any valid configuration, saving and loading should produce an equivalent configuration
2. **Viewport coverage**: For any set of viewports, all should be captured
3. **Threshold consistency**: For any threshold, differences below it should pass
4. **File naming consistency**: For any page/viewport pair, filename should follow convention
5. **Exit code correctness**: For any comparison results, exit code should match pass/fail status
6. **Baseline replacement**: For any approval, new baselines should match current screenshots
7. **Browser cleanup**: For any execution, all browser processes should be terminated on exit
8. **Error resilience**: For any capture failure, remaining captures should continue
9. **Report completeness**: For any comparison run, report should include all results
10. **Memory bounds**: For any execution, memory usage should stay within limits

Each property-based test will be tagged with a comment referencing the design document:
```javascript
// Feature: visdiff-phase1, Property 13: JSON report generation
test.prop([fc.array(fc.record({...}))])('generates valid JSON reports', async (results) => {
  // Test implementation
});
```

### Integration Testing

Integration tests will verify end-to-end workflows:

- **Init workflow**: Run init, verify config and directories created
- **Capture workflow**: Run capture, verify screenshots saved
- **Compare workflow**: Run compare, verify diffs and reports generated
- **Approve workflow**: Run approve, verify baselines updated and backed up
- **Watch workflow**: Start watch, trigger change, verify auto-comparison
- **CI workflow**: Run in CI mode, verify exit codes and JSON output

### Performance Testing

Performance benchmarks will track:
- Time to capture single page: < 3s
- Time to compare single image: < 100ms
- Memory usage during 100 captures: < 1GB
- Disk space per baseline: ~100KB
- CLI startup time: < 500ms

## Dependencies

### Core Dependencies

- **puppeteer** (^21.0.0): Headless browser control
- **sharp** (^0.33.0): Image processing and manipulation
- **pixelmatch** (^5.3.0): Pixel-level image comparison
- **commander** (^11.0.0): CLI argument parsing
- **zod** (^3.22.0): Configuration schema validation
- **chalk** (^5.3.0): Terminal output formatting

### Development Dependencies

- **vitest** (^1.0.0): Unit testing framework
- **fast-check** (^3.15.0): Property-based testing library
- **@types/node** (^20.0.0): TypeScript types for Node.js
- **typescript** (^5.3.0): TypeScript compiler
- **eslint** (^8.56.0): Code linting
- **prettier** (^3.1.0): Code formatting

### Rationale for Key Choices

**Puppeteer over Playwright**: Smaller bundle size (Chromium-only), more stable screenshot API, better memory management for headless usage

**Sharp over Jimp**: 10x faster image processing, native bindings for performance, better memory efficiency

**Pixelmatch over resemblejs**: Simpler API, faster comparison, better anti-aliasing detection

**Commander over yargs**: Lighter weight, cleaner API, better TypeScript support

**Zod over joi**: Better TypeScript integration, smaller bundle, more modern API

## Performance Considerations

### Optimization Strategies

**Browser Pooling**
- Reuse browser instances across captures
- Pool pages for concurrent captures
- Lazy browser launch (only when needed)

**Parallel Capture**
- Capture multiple viewports concurrently
- Use worker threads for image processing
- Batch file system operations

**Caching**
- Cache configuration after first load
- Cache baseline images in memory during comparison
- Reuse browser context for same domain

**Memory Management**
- Close pages immediately after capture
- Stream large images to disk
- Limit concurrent captures based on available memory
- Monitor and warn on high memory usage

**Disk I/O**
- Use async file operations
- Batch writes when possible
- Compress images efficiently
- Clean up old diff directories

### Performance Targets

- **Capture time**: < 3s per page (including network idle)
- **Comparison time**: < 100ms per image pair
- **Memory usage**: < 1GB for typical usage (10-20 pages)
- **Disk usage**: ~100KB per baseline screenshot
- **CLI startup**: < 500ms
- **Watch mode latency**: < 5s from change to result

## Security Considerations

### Input Validation

- Validate all URLs before navigation
- Sanitize file paths to prevent directory traversal
- Validate configuration against schema
- Limit viewport dimensions to reasonable ranges
- Validate threshold values (0-1 range)

### File System Security

- Restrict file operations to project directory
- Validate file extensions before writing
- Check available disk space before operations
- Use secure file permissions (0644 for files, 0755 for directories)

### Browser Security

- Run browser in sandbox mode
- Disable unnecessary browser features
- Set resource limits for browser processes
- Timeout long-running page loads
- Validate custom scripts before execution

### Dependency Security

- Pin dependency versions
- Regular security audits with npm audit
- Minimize dependency tree
- Use only well-maintained packages
- Review dependency licenses

## Future Extensibility

### Plugin System (Phase 2+)

The architecture supports future plugin capabilities:

```typescript
interface VisDiffPlugin {
  name: string;
  version: string;
  hooks: {
    beforeCapture?: (context: CaptureContext) => Promise<void>;
    afterCapture?: (context: CaptureContext, result: CaptureResult) => Promise<void>;
    beforeCompare?: (context: CompareContext) => Promise<void>;
    afterCompare?: (context: CompareContext, result: ComparisonResult) => Promise<void>;
  };
}
```

### Framework Adapters (Phase 3)

Future framework-specific adapters will extend the core:

```typescript
interface FrameworkAdapter {
  name: string;
  detectProject(): boolean;
  getDefaultConfig(): Partial<VisDiffConfig>;
  setupDevServerIntegration(): Promise<void>;
  captureComponent(componentName: string, props: Record<string, unknown>): Promise<Buffer>;
}
```

### Cloud Sync (Phase 4)

Storage manager interface supports future cloud sync:

```typescript
interface CloudSyncAdapter {
  uploadBaseline(identifier: string, image: Buffer): Promise<void>;
  downloadBaseline(identifier: string): Promise<Buffer>;
  syncBaselines(branch: string): Promise<void>;
}
```

## Deployment and Distribution

### Package Distribution

- Published to npm as `@web-loom/visdiff`
- Includes compiled JavaScript and TypeScript definitions
- Bundles Chromium via Puppeteer
- Provides CLI binary via `bin` field in package.json

### Installation

```bash
npm install --save-dev @web-loom/visdiff
# or
yarn add --dev @web-loom/visdiff
```

### CLI Access

```bash
npx visdiff init
# or add to package.json scripts
{
  "scripts": {
    "visdiff": "visdiff"
  }
}
```

### CI/CD Integration

```yaml
# Example GitHub Actions workflow
- name: Visual Regression Tests
  run: |
    npm run visdiff compare
    if [ $? -ne 0 ]; then
      echo "Visual regressions detected"
      exit 1
    fi
```

## Documentation Requirements

### User Documentation

- **Getting Started Guide**: Installation, initialization, first capture
- **CLI Reference**: All commands with examples
- **Configuration Guide**: All options with explanations
- **Workflow Guide**: Common workflows (capture, compare, approve)
- **CI Integration Guide**: Setup for popular CI platforms
- **Troubleshooting Guide**: Common issues and solutions

### Developer Documentation

- **Architecture Overview**: Component diagram and responsibilities
- **API Reference**: All public interfaces
- **Plugin Development Guide**: Creating custom plugins (future)
- **Contributing Guide**: Setup, testing, PR process
- **Release Process**: Versioning, changelog, publishing

## Success Metrics

### Adoption Metrics

- 1,000 weekly downloads within 3 months of release
- 500 GitHub stars within 6 months
- 50 contributing developers within first year

### Quality Metrics

- False positive rate < 15% (Phase 1 target)
- Capture reliability > 99%
- Test coverage > 90%
- Zero critical bugs in production

### Developer Experience

- Setup time < 2 minutes
- Zero-config works for 80% of use cases
- User satisfaction > 4/5 stars
- Would recommend > 70% NPS

---

**Document Version**: 1.0  
**Last Updated**: December 7, 2025  
**Status**: Ready for Implementation
