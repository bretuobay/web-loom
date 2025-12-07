# Requirements Document: @web-loom/visdiff Phase 1

## Introduction

WebLoom VisDiff is a local-first, intelligent visual regression testing tool designed to catch UI bugs during development rather than after deployment. Phase 1 focuses on building the core engine with essential CLI functionality, headless browser control, and basic image comparison capabilities. The goal is to make visual testing as accessible as unit testing for frontend developers.

## Glossary

- **VisDiff System**: The complete visual regression testing tool including CLI, browser control, and comparison engine
- **Baseline**: A reference screenshot captured at a known-good state of the UI
- **Diff**: The visual difference between a current screenshot and its baseline
- **Viewport**: A specific screen size configuration (width × height) for capturing screenshots
- **Capture**: The process of taking a screenshot of a web page or component
- **Comparison Engine**: The algorithm that analyzes pixel differences between images
- **Threshold**: The acceptable level of difference before flagging a visual regression
- **CLI**: Command-line interface for interacting with the VisDiff System
- **Headless Browser**: A browser instance running without a graphical user interface
- **Exit Code**: A numeric value returned by the CLI to indicate success or failure

## Requirements

### Requirement 1

**User Story:** As a frontend developer, I want to initialize visual regression testing in my project with minimal configuration, so that I can start capturing baselines quickly.

#### Acceptance Criteria

1. WHEN a developer runs the init command THEN the VisDiff System SHALL create a default configuration file in the project root
2. WHEN the init command completes THEN the VisDiff System SHALL create the baseline storage directory structure
3. WHEN no configuration options are provided THEN the VisDiff System SHALL use sensible defaults for viewports, paths, and capture options
4. WHEN the init command runs in an existing project THEN the VisDiff System SHALL detect and preserve any existing configuration
5. WHEN the initialization completes THEN the VisDiff System SHALL output a success message with next steps

### Requirement 2

**User Story:** As a frontend developer, I want to capture baseline screenshots of my application across multiple viewports, so that I can establish reference images for future comparisons.

#### Acceptance Criteria

1. WHEN a developer runs the capture command with a URL THEN the VisDiff System SHALL launch a headless browser and navigate to the specified URL
2. WHEN capturing screenshots THEN the VisDiff System SHALL capture images for all configured viewports
3. WHEN a capture completes successfully THEN the VisDiff System SHALL store the screenshot in the baseline directory with a naming convention that includes the page name and viewport
4. WHEN the browser fails to load a page within the timeout period THEN the VisDiff System SHALL report an error and continue with remaining captures
5. WHEN all captures complete THEN the VisDiff System SHALL output a summary showing the number of successful and failed captures
6. WHEN capturing a full page THEN the VisDiff System SHALL scroll and stitch screenshots to capture content beyond the viewport

### Requirement 3

**User Story:** As a frontend developer, I want to compare current screenshots against baselines automatically, so that I can detect visual regressions without manual inspection.

#### Acceptance Criteria

1. WHEN a developer runs the compare command THEN the VisDiff System SHALL capture current screenshots for all configured paths and viewports
2. WHEN comparing images THEN the VisDiff System SHALL use pixel-level diffing with the configured threshold
3. WHEN differences exceed the threshold THEN the VisDiff System SHALL generate a diff image highlighting the changed regions
4. WHEN differences are detected THEN the VisDiff System SHALL store the diff output in a timestamped directory
5. WHEN the comparison completes THEN the VisDiff System SHALL generate a summary report in JSON format
6. WHEN no baseline exists for a screenshot THEN the VisDiff System SHALL report it as a new baseline needed
7. WHEN all comparisons pass THEN the VisDiff System SHALL return exit code 0
8. WHEN any comparison fails THEN the VisDiff System SHALL return a non-zero exit code

### Requirement 4

**User Story:** As a frontend developer, I want to approve visual changes as new baselines, so that intentional UI updates don't continue to be flagged as regressions.

#### Acceptance Criteria

1. WHEN a developer runs the approve command THEN the VisDiff System SHALL replace existing baselines with the current screenshots
2. WHEN approving changes THEN the VisDiff System SHALL preserve the original baselines in a backup directory
3. WHEN the approve command completes THEN the VisDiff System SHALL output a list of updated baselines
4. WHEN no pending changes exist THEN the VisDiff System SHALL inform the user that no approvals are needed
5. WHEN approving specific paths THEN the VisDiff System SHALL only update baselines for the specified paths

### Requirement 5

**User Story:** As a frontend developer, I want to watch for changes during development and automatically compare screenshots, so that I can get immediate feedback on visual regressions.

#### Acceptance Criteria

1. WHEN a developer runs the watch command THEN the VisDiff System SHALL start monitoring the specified URL or local server
2. WHEN the watched application changes THEN the VisDiff System SHALL automatically capture and compare screenshots
3. WHEN running in watch mode THEN the VisDiff System SHALL display real-time comparison results in the terminal
4. WHEN a comparison fails in watch mode THEN the VisDiff System SHALL continue watching without exiting
5. WHEN the developer stops watch mode THEN the VisDiff System SHALL clean up browser resources and exit gracefully

### Requirement 6

**User Story:** As a frontend developer, I want to configure viewport sizes, capture options, and comparison thresholds, so that I can customize visual testing for my project's needs.

#### Acceptance Criteria

1. WHEN the VisDiff System reads configuration THEN the VisDiff System SHALL validate the configuration against a schema
2. WHEN viewport configurations are provided THEN the VisDiff System SHALL support custom width, height, and name properties
3. WHEN capture options are specified THEN the VisDiff System SHALL respect fullPage, omitBackground, and timeout settings
4. WHEN diff options are configured THEN the VisDiff System SHALL apply threshold, ignoreAntialiasing, and ignoreColors settings
5. WHEN storage paths are customized THEN the VisDiff System SHALL use the specified directories for baselines and diffs
6. WHEN configuration is invalid THEN the VisDiff System SHALL report validation errors with helpful messages

### Requirement 7

**User Story:** As a frontend developer, I want to check the current diff status without running a full comparison, so that I can quickly see if there are pending visual changes.

#### Acceptance Criteria

1. WHEN a developer runs the status command THEN the VisDiff System SHALL read the most recent comparison results
2. WHEN displaying status THEN the VisDiff System SHALL show the number of passed, failed, and new screenshots
3. WHEN no comparisons have been run THEN the VisDiff System SHALL inform the user that no status is available
4. WHEN displaying status THEN the VisDiff System SHALL include the timestamp of the last comparison
5. WHEN failed comparisons exist THEN the VisDiff System SHALL list the paths and viewports that failed

### Requirement 8

**User Story:** As a frontend developer, I want the VisDiff System to handle browser lifecycle efficiently, so that I don't experience memory leaks or resource exhaustion during testing.

#### Acceptance Criteria

1. WHEN launching a headless browser THEN the VisDiff System SHALL reuse browser instances across multiple captures
2. WHEN captures complete THEN the VisDiff System SHALL close browser pages to free memory
3. WHEN the VisDiff System exits THEN the VisDiff System SHALL terminate all browser processes
4. WHEN browser crashes occur THEN the VisDiff System SHALL detect the failure and restart the browser
5. WHEN memory usage exceeds 1GB THEN the VisDiff System SHALL log a warning

### Requirement 9

**User Story:** As a frontend developer, I want image comparison to ignore anti-aliasing differences and minor color variations, so that I don't get false positives from rendering differences.

#### Acceptance Criteria

1. WHEN comparing images with ignoreAntialiasing enabled THEN the VisDiff System SHALL apply anti-aliasing detection algorithms
2. WHEN comparing images with ignoreColors enabled THEN the VisDiff System SHALL compare only luminance values
3. WHEN pixel differences are below the threshold THEN the VisDiff System SHALL consider the images identical
4. WHEN generating diff images THEN the VisDiff System SHALL highlight changed pixels in a contrasting color
5. WHEN comparing images of different dimensions THEN the VisDiff System SHALL report a dimension mismatch error

### Requirement 10

**User Story:** As a frontend developer, I want the VisDiff System to work in CI/CD pipelines, so that I can catch visual regressions before merging code.

#### Acceptance Criteria

1. WHEN running in a CI environment THEN the VisDiff System SHALL detect the CI environment and adjust output formatting
2. WHEN comparisons fail in CI THEN the VisDiff System SHALL return a non-zero exit code
3. WHEN running in CI THEN the VisDiff System SHALL output machine-readable JSON reports
4. WHEN baselines are missing in CI THEN the VisDiff System SHALL fail with a clear error message
5. WHEN running in CI THEN the VisDiff System SHALL complete within the configured timeout period

### Requirement 11

**User Story:** As a frontend developer, I want to capture screenshots with network idle detection, so that dynamic content is fully loaded before comparison.

#### Acceptance Criteria

1. WHEN capturing a page THEN the VisDiff System SHALL wait for network idle before taking the screenshot
2. WHEN the network idle timeout is reached THEN the VisDiff System SHALL proceed with capture and log a warning
3. WHEN capturing with custom wait conditions THEN the VisDiff System SHALL support waiting for specific selectors
4. WHEN JavaScript execution is required THEN the VisDiff System SHALL allow custom scripts to run before capture
5. WHEN animations are present THEN the VisDiff System SHALL wait for the configured animation delay

### Requirement 12

**User Story:** As a frontend developer, I want clear error messages and helpful debugging information, so that I can quickly resolve issues with visual testing.

#### Acceptance Criteria

1. WHEN errors occur THEN the VisDiff System SHALL output descriptive error messages with context
2. WHEN browser navigation fails THEN the VisDiff System SHALL include the URL and error details
3. WHEN image comparison fails THEN the VisDiff System SHALL report the percentage difference
4. WHEN configuration is invalid THEN the VisDiff System SHALL highlight the specific configuration errors
5. WHEN running with verbose logging THEN the VisDiff System SHALL output detailed execution information
