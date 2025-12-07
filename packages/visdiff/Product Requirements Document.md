# Product Requirements Document: @web-loom/visdiff

## Product Vision

A local-first, intelligent visual regression testing tool that catches UI bugs during development, not after deployment. WebLoom VisDiff makes visual testing as accessible as unit testing.

## Product Name & Identity

- **Package Name**: `@web-loom/visdiff`
- **CLI Command**: `visdiff`
- **Brand Concept**: "Weaving quality into your UI"
- **Tagline**: "Visual regression testing for developers, not just CI"

## Phase 1: Core Engine (MVP) - "Local Snapshot"

**Timeline**: 6-8 weeks
**Goal**: Functional CLI that captures and compares screenshots with basic intelligence

### Requirements

#### 1. CLI Interface

```
Commands:
  visdiff init              # Initialize project with default config
  visdiff capture <url|path> # Capture baseline screenshots
  visdiff watch [url]       # Watch for changes and compare
  visdiff compare           # Compare current vs baseline
  visdiff approve           # Accept current changes as new baseline
  visdiff status            # Show current diff status
```

#### 2. Core Features

- **Headless Browser Control**: Puppeteer integration for screenshot capture
- **Basic Image Comparison**: Pixel-level diffing with adjustable thresholds
- **Multi-viewport Support**: Mobile (375px), Tablet (768px), Desktop (1440px)
- **Baseline Management**: Store snapshots in `.visdiff/baselines/`
- **Diff Output**: Generate side-by-side comparisons with visual diffs highlighted
- **Exit Codes**: Non-zero exit on unapproved changes for CI readiness

#### 3. Configuration (`visdiff.config.js`)

```javascript
module.exports = {
  viewports: [
    { width: 375, height: 667, name: 'mobile' },
    { width: 768, height: 1024, name: 'tablet' },
    { width: 1440, height: 900, name: 'desktop' },
  ],
  paths: ['/', '/about', '/dashboard'],
  captureOptions: {
    fullPage: false,
    omitBackground: true,
    timeout: 30000,
  },
  diffOptions: {
    threshold: 0.01,
    ignoreAntialiasing: true,
    ignoreColors: false,
  },
  storage: {
    baselineDir: '.visdiff/baselines',
    diffDir: '.visdiff/diffs',
    format: 'png',
  },
};
```

#### 4. Output Structure

```
.visdiff/
├── baselines/
│   ├── main/
│   │   ├── home-mobile.png
│   │   ├── home-tablet.png
│   │   └── home-desktop.png
│   └── feature-branch/
│       └── ...
├── diffs/
│   └── 2024-01-15-10-30-22/
│       ├── diff-home-mobile.png
│       ├── report.json
│       └── summary.md
└── config.json
```

#### 5. Technical Specifications

- **Runtime**: Node.js 20+
- **Browser Control**: Puppeteer (Chromium)
- **Image Processing**: Sharp + pixelmatch
- **Package Size**: < 20MB (including Chromium)
- **Performance**: < 3s per page capture (including network idle)
- **Memory**: < 1GB RAM usage during capture

#### 6. Success Metrics (MVP)

- False positive rate < 15% on typical UI changes
- Setup time < 2 minutes
- Zero config works for 80% of use cases
- CLI commands intuitive (no help needed for basic usage)

---

## Phase 2: Intelligence Layer - "Smart Diffs"

**Timeline**: 8-10 weeks after Phase 1
**Goal**: Reduce false positives and add semantic understanding

### Requirements

#### 1. Semantic Diffing Engine

- **DOM Structure Analysis**: Compare HTML structure alongside pixels
- **CSS Property Extraction**: Detect which CSS properties changed
- **Layout Shift Detection**: Flag elements that moved > 5px
- **Content-Aware Ignoring**: Auto-ignore timestamps, random IDs, dynamic data
- **Component Boundary Detection**: Recognize component-level changes

#### 2. Advanced Configuration

```javascript
module.exports = {
  // ... previous config

  intelligence: {
    ignoreRegions: [
      { selector: '.timestamp', type: 'content' },
      { selector: '[data-testid="dynamic-data"]', type: 'element' },
      { x: 10, y: 20, width: 100, height: 50, type: 'area' },
    ],
    acceptableChanges: {
      position: 2, // pixels
      color: 0.02, // rgb delta
      size: 1, // pixels
    },
    significanceThreshold: 0.85, // Confidence score for "real change"
  },

  // New: Component mode
  components: {
    mode: 'isolated', // 'fullpage' | 'isolated' | 'viewport'
    isolation: {
      padding: 20,
      backgroundColor: '#ffffff',
    },
  },
};
```

#### 3. Machine Learning Features

- **Training Dataset**: Collect anonymized diffs (opt-in) to train model
- **False Positive Detection**: Classify common non-issues (font rendering, sub-pixel shifts)
- **Change Categorization**: Auto-tag changes as "layout", "color", "content", "animation"
- **Confidence Scoring**: Each diff gets a confidence score (0-1)

#### 4. Enhanced CLI

```
New Commands:
  visdiff train              # Train local model on your project's patterns
  visdiff analyze <diff-dir> # Get detailed analysis of changes
  visdiff ignore <selector>  # Add selector to ignore list
  visdiff learn              # Mark current false positives as "ignore patterns"
```

#### 5. Performance Optimizations

- **Parallel Capture**: Capture multiple viewports concurrently
- **Incremental Comparison**: Only compare changed regions detected by DOM diff
- **Caching**: Cache rendered assets between runs
- **Smart Re-capture**: Skip unchanged pages/components

#### 6. Success Metrics (Phase 2)

- False positive rate < 5%
- 50% reduction in comparison time
- Auto-detection of 80% of dynamic content
- Change categorization accuracy > 90%

---

## Phase 3: Development Experience - "Seamless Workflow"

**Timeline**: 6-8 weeks after Phase 2
**Goal**: Integrate into existing developer workflows

### Requirements

#### 1. Development Server Integration

- **Live Reload Detection**: Auto-capture on dev server rebuild
- **Hot Module Replacement**: Smart partial re-captures for HMR updates
- **Storybook Integration**: `visdiff storybook` command
- **Framework Plugins**:
  - `@web-loom/visdiff-react` for React
  - `@web-loom/visdiff-vue` for Vue
  - `@web-loom/visdiff-next` for Next.js
  - `@web-loom/visdiff-remix` for Remix

#### 2. Interactive Review UI

- **Local Dashboard**: `visdiff ui` starts local review server
- **Keyboard Navigation**: Arrow keys to navigate diffs, 'a' to approve, 'r' to reject
- **Batch Operations**: Approve/reject all changes in category
- **Change Highlighting**: Click on diff to highlight DOM element in Elements panel

#### 3. Git Integration

- **Automatic Branch Baselines**: Create baselines per git branch
- **Merge Conflict Detection**: Visual diff conflicts during git merges
- **Commit Hooks**: Pre-commit hook to check for visual regressions
- **Git History**: Track visual changes alongside code changes

#### 4. Enhanced Configuration

```javascript
module.exports = {
  // ... previous config

  workflow: {
    gitIntegration: {
      autoBranch: true,
      protectBranches: ['main', 'production'],
      preCommitHook: 'warn', // 'off' | 'warn' | 'block'
    },

    devServer: {
      port: 3000,
      captureOnReady: true,
      pathsToWatch: ['src/**/*.css', 'src/**/*.jsx', 'src/**/*.tsx'],
    },

    notifications: {
      desktop: true,
      sound: 'chime',
      onlyOnFailure: true,
    },
  },
};
```

#### 5. API for Advanced Use Cases

```javascript
// Programmatic API
const { VisDiff } = require('@web-loom/visdiff');

const visdiff = new VisDiff(config);
await visdiff.captureComponent('Button', { props: { variant: 'primary' } });
await visdiff.compare();
const results = await visdiff.getResults();
```

#### 6. Success Metrics (Phase 3)

- Integration setup time < 30 seconds
- Review time per diff < 10 seconds
- 95% of users enable git integration
- 80% reduction in manual QA for visual issues

---

## Phase 4: Collaboration & Scale - "Team Ready"

**Timeline**: 8-10 weeks after Phase 3
**Goal**: Support team workflows and enterprise features

### Requirements

#### 1. Collaboration Features

- **Shared Baselines**: Team baseline repository (optional cloud sync)
- **Review Workflow**: Request reviews for visual changes
- **Commenting**: Add comments to specific diff regions
- **Approval Gates**: Required approvals for certain routes/components

#### 2. Enterprise Features

- **SSO Integration**: Okta, Auth0, SAML
- **Audit Logging**: Who approved which changes
- **RBAC**: Roles for viewer, approver, admin
- **On-premise Option**: Self-hosted coordination server

#### 3. Advanced Testing Scenarios

- **Interaction States**: Capture hover, focus, active states
- **Animation Frames**: Capture multiple frames of animations
- **Accessibility Overlays**: Test with simulated vision deficiencies
- **Internationalization**: Test with different languages and RTL

#### 4. Performance at Scale

- **Distributed Capture**: Split capture across multiple machines
- **Incremental Baselines**: Store only differences from parent baseline
- **Cloud Cache**: Optional CDN for asset caching between runs
- **Priority Queue**: Smart ordering of critical paths first

#### 5. Enhanced Configuration

```javascript
module.exports = {
  // ... previous config

  team: {
    repository: 'https://api.webloom.dev/projects/abc123',
    requireReview: {
      paths: ['/checkout', '/pricing'],
      reviewers: ['team-lead', 'designer'],
    },
    sync: {
      enabled: true,
      conflictResolution: 'smart-merge', // 'manual' | 'theirs' | 'ours' | 'smart-merge'
    },
  },

  advanced: {
    states: ['default', 'hover', 'focus', 'disabled'],
    animations: {
      captureFrames: 3,
      frameDelay: 100,
    },
    accessibility: {
      simulate: ['protanopia', 'low-vision', 'motor-impairment'],
    },
  },
};
```

#### 6. Success Metrics (Phase 4)

- Support for 1000+ page test suites
- Review collaboration reduces visual bugs by 50%
- Enterprise compliance requirements met (SOC2, GDPR)
- < 1% regression rate in production UI

---

## Phase 5: Ecosystem & AI - "Proactive Prevention"

**Timeline**: 10-12 weeks after Phase 4
**Goal**: Predict and prevent visual regressions before they happen

### Requirements

#### 1. Predictive Analysis

- **Change Impact Prediction**: Analyze PR to predict visual impact
- **Risk Scoring**: Assign risk scores to code changes
- **Prevention Rules**: "Never break these spacing rules"
- **Design System Enforcement**: Enforce design token usage

#### 2. Design-Dev Alignment

- **Figma Plugin**: Compare implementation with Figma designs
- **Design Token Validation**: Ensure implementation matches design tokens
- **Visual Test Generation**: Auto-generate tests from design specs
- **Drift Detection**: Alert when implementation drifts from design

#### 3. Advanced AI Features

- **Intent Recognition**: "Was this change intentional?"
- **Automatic Fix Suggestions**: "Add 4px margin-left to fix alignment"
- **Pattern Recognition**: "This looks like the card component pattern"
- **Anomaly Detection**: "This color doesn't match your design system"

#### 4. Ecosystem Integrations

- **VS Code Extension**: Inline diff visualization in editor
- **GitHub/GitLab App**: PR status checks with visual diffs
- **Slack/Discord Integration**: Notifications with diff previews
- **Jira/Trello Integration**: Create tickets from visual bugs

#### 5. Success Metrics (Phase 5)

- 30% of visual bugs prevented before code review
- Design-system compliance > 95%
- False positive rate < 1%
- 50% reduction in design-review cycles

---

## Technical Architecture Principles

### 1. Core Philosophy

- **Local-first**: Everything works offline
- **Batteries included**: Zero config works for most cases
- **Progressive disclosure**: Advanced features available but not required
- **Unix philosophy**: Do one thing well, compose with other tools

### 2. Performance Constraints

- **Initial load**: < 2 seconds for first capture
- **Memory**: < 1GB for typical usage
- **Disk**: Efficient storage (approx. 100KB per snapshot)
- **CPU**: Minimal impact during development

### 3. Compatibility Matrix

- **Node.js**: 20.x, 22.x, 24.x
- **Browsers**: Chromium 115+, Firefox 115+
- **Frameworks**: React 19+, Vue 3+, Svelte 3+, Angular 18+
- **Platforms**: macOS 10.15+, Windows 10+, Linux (Ubuntu 20.04+)

### 4. Quality Gates

- **Unit test coverage**: > 90%
- **Integration tests**: Cover all major frameworks
- **Performance benchmarks**: Tracked per release
- **Bundle size**: Monitored with every PR

## Monetization Strategy (Future)

### Open Source Core

- `@web-loom/visdiff`: MIT Licensed, free forever
- All Phase 1-3 features included

### Premium Features (Phase 4+)

- Team collaboration features
- Advanced AI capabilities
- Enterprise support & SLA
- On-premise deployment

### Pricing Model (Future Consideration)

- Free: Individual developers, open source
- Team: $20/user/month (collaboration features)
- Enterprise: Custom (advanced features, on-premise)

## Success Metrics (Overall)

### Adoption Metrics

- 10,000 weekly downloads within 6 months of Phase 1
- 1,000 GitHub stars within 3 months
- 100 contributing developers within first year

### Quality Metrics

- False positive rate: < 3% by Phase 3
- Capture reliability: > 99.9%
- Regression detection: > 95% of visual bugs

### Developer Experience

- Setup satisfaction: > 4.5/5 stars
- Would recommend: > 80% NPS
- Daily active usage: > 60% of installed users

---

## Appendix: Technical Decisions

### Why Puppeteer over Playwright?

- Smaller bundle size (Chromium-only)
- More stable API for screenshot capture
- Better memory management for headless usage
- Can add Playwright support later if needed

### Why Node.js over Go/Rust?

- Easier integration with existing frontend toolchains
- Larger ecosystem for image processing
- Lower barrier for contributors
- Can compile to binary later if performance demands

### Storage Format Decisions

- PNG for screenshots (lossless, good compression)
- JSON for metadata (human-readable, diff-friendly)
- Git-friendly structure (text where possible)

### Extension Points

- Plugin system for framework integrations
- Adapter pattern for different browsers
- Hook system for custom comparison logic
- API-first design for programmatic usage

---

**Document Version**: 1.0  
**Last Updated**: December 06, 2025
**Owner**: Festus Yeboah
**Status**: Draft for Review
