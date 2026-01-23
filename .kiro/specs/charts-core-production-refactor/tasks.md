# Implementation Plan: Charts-Core Production Refactor

## Overview

This implementation plan refactors `@web-loom/charts-core` to production-level quality through incremental enhancements. Tasks marked with `*` are optional and can be skipped for a faster MVP focused on core visual polish and performance improvements.

## Tasks

- [x] 1. Setup and Foundation
  - [x] Create new component files and update exports
  - [x] Set up fast-check for property-based testing
  - [x] Configure test utilities and helpers
  - _Requirements: All_

- [x] 2. Theme System Integration
  - [x] 2.1 Create ThemeManager component
    - Implement theme creation and merging logic
    - Integrate with @web-loom/design-core tokens
    - Add default light theme with Chart.js-inspired colors
    - _Requirements: 1.1, 1.2, 14.1, 14.2_

  - [ ]* 2.2 Write property tests for ThemeManager
    - **Property 1: Default Color Palette Application**
    - **Validates: Requirements 1.1**

  - [x] 2.3 Add theme application to ChartManager
    - Extend ChartManager constructor to accept theme config
    - Apply theme colors to series, axes, and grid lines
    - _Requirements: 1.1, 1.2, 14.1_

  - [ ]* 2.4 Write unit tests for theme merging
    - Test partial theme overrides
    - Test theme validation
    - _Requirements: 14.5, 14.6_

- [x] 3. Visual Polish - Default Styling
  - [x] 3.1 Update axis default styles
    - Apply muted baseline colors (rgba(15, 23, 42, 0.08))
    - Set soft tick text color (#64748b)
    - Configure subtle grid lines (rgba(15, 23, 42, 0.04))
    - _Requirements: 1.2_

  - [ ]* 3.2 Write property test for axis styling
    - **Property 2: Axis Default Styling**
    - **Validates: Requirements 1.2**

  - [x] 3.3 Enhance line series rendering
    - Add shape-rendering="geometricPrecision"
    - Set stroke-linecap="round"
    - Apply 2px default stroke width
    - _Requirements: 1.3_

  - [ ]* 3.4 Write property test for line series styling
    - **Property 3: Line Series Anti-aliasing**
    - **Validates: Requirements 1.3**

  - [x] 3.5 Update marker default styles
    - Set 4px radius with 2px white stroke
    - Add drop shadow filter (0 2px 4px rgba(0,0,0,0.1))
    - _Requirements: 1.4_

  - [ ]* 3.6 Write property test for marker styling
    - **Property 4: Marker Default Styling**
    - **Validates: Requirements 1.4**

- [x] 4. Animation System
  - [x] 4.1 Add transition utilities
    - Create transition helper with 300ms duration
    - Use cubic-bezier(0.4, 0, 0.2, 1) easing
    - Apply to data updates, zoom, and theme changes
    - _Requirements: 1.5_

  - [ ]* 4.2 Write property test for transition timing
    - **Property 5: Transition Timing**
    - **Validates: Requirements 1.5**

  - [x] 4.3 Enhance tooltip styling
    - Apply 8px border-radius
    - Add shadow (0 4px 12px rgba(0,0,0,0.15))
    - Set 12px padding with Inter font
    - _Requirements: 1.6_

  - [ ]* 4.4 Write property test for tooltip styling
    - **Property 6: Tooltip Styling**
    - **Validates: Requirements 1.6**

- [x] 5. Checkpoint - Visual Polish Complete
  - ✅ All tests passing (12 tests across 4 test files)
  - ✅ Visual polish implementation verified

- [ ] 6. Performance - Adaptive Rendering
  - [x] 6.1 Create RenderStrategy component
    - Implement shouldUseCanvas() with 10K threshold
    - Add getOptimalCurve() for curve selection
    - Implement progressive chunk sizing
    - _Requirements: 2.1, 2.3_

  - [ ]* 6.2 Write property test for canvas fallback
    - **Property 7: Canvas Fallback Threshold**
    - **Validates: Requirements 2.1**

  - [x] 6.3 Implement canvas rendering in SeriesRenderer
    - Add renderToCanvas() method
    - Implement canvas line and area rendering
    - Add canvas gradient support
    - _Requirements: 2.1_

  - [ ]* 6.4 Write performance benchmark for canvas rendering
    - Test 10K points render in < 300ms
    - _Requirements: 2.1, 12.2_

- [ ] 7. Performance - Progressive Rendering
  - [x] 7.1 Add progressive rendering to ChartManager
    - Implement visible range calculation
    - Render only points within viewport
    - _Requirements: 2.2_

  - [ ]* 7.2 Write property test for progressive rendering
    - **Property 8: Progressive Rendering**
    - **Validates: Requirements 2.2**

  - [x] 7.3 Optimize D3 enter/update/exit pattern
    - Ensure DOM elements are reused on updates
    - Add transition animations to updates
    - _Requirements: 2.4_

  - [ ]* 7.4 Write property test for DOM reuse
    - **Property 10: DOM Element Reuse**
    - **Validates: Requirements 2.4**

- [x] 8. Enhanced SeriesRenderer - Gradients
  - [x] 8.1 Implement gradient fill system
    - Create gradient cache in SeriesRenderer
    - Generate linear gradients (40% opacity to transparent)
    - Store gradients in SVG <defs>
    - _Requirements: 2.5, 7.1, 7.5_

  - [ ]* 8.2 Write property tests for gradients
    - **Property 11: Gradient Fill Opacity**
    - **Property 35: Gradient Caching**
    - **Validates: Requirements 2.5, 7.5**

  - [x] 8.3 Implement z-index layering
    - Ensure render order: grids → areas → lines → markers
    - _Requirements: 2.6_

  - [ ]* 8.4 Write property test for z-index layering
    - **Property 12: Z-Index Layering**
    - **Validates: Requirements 2.6**

- [ ] 9. Checkpoint - Performance Optimizations Complete
  - Ensure all tests pass, ask the user if questions arise.
  - use function to generate a large data set in strorybook to test

- [ ] 10. CrosshairManager Component
  - [ ] 10.1 Create CrosshairManager
    - Implement vertical/horizontal line rendering
    - Add crosshair styling (1px, rgba(100, 116, 139, 0.4), dashed)
    - Implement show/hide methods
    - _Requirements: 3.1_

  - [ ]* 10.2 Write property test for crosshair rendering
    - **Property 13: Crosshair Rendering**
    - **Validates: Requirements 3.1**

  - [ ] 10.3 Add point highlighting
    - Create highlight circles (6px radius)
    - Add glow filter effect
    - Update highlights on crosshair move
    - _Requirements: 3.2_

  - [ ]* 10.4 Write property test for point highlighting
    - **Property 14: Point Highlighting**
    - **Validates: Requirements 3.2**

  - [ ] 10.5 Integrate CrosshairManager with ChartManager
    - Add crosshair to hover interactions
    - Connect to tooltip system
    - _Requirements: 3.1, 3.2_

- [ ] 11. Enhanced TooltipManager
  - [ ] 11.1 Extend TooltipManager with smart positioning
    - Implement SmartPositionStrategy
    - Add boundary detection and repositioning
    - _Requirements: 3.4, 3.5_

  - [ ]* 11.2 Write property test for tooltip positioning
    - **Property 16: Tooltip Boundary Detection**
    - **Validates: Requirements 3.4, 3.5**

  - [ ] 11.3 Enhance multi-series tooltip formatting
    - Add timestamp header
    - Sort values by magnitude
    - Add color indicators
    - _Requirements: 3.3, 3.6_

  - [ ]* 11.4 Write property tests for tooltip content
    - **Property 15: Shared Tooltip Content**
    - **Property 17: Tooltip Value Sorting**
    - **Validates: Requirements 3.3, 3.6**

- [ ] 12. Enhanced AxisRenderer - Intelligent Formatting
  - [ ] 12.1 Create TimeAxisFormatter
    - Implement intelligent date formatting
    - Hours for < 1 day, days for < 1 month, etc.
    - _Requirements: 4.2_

  - [ ]* 12.2 Write property test for date formatting
    - **Property 19: Intelligent Date Formatting**
    - **Validates: Requirements 4.2**

  - [ ] 12.3 Create ValueAxisFormatter
    - Implement SI prefix formatting (K, M, B)
    - Handle decimal places for small numbers
    - _Requirements: 4.3_

  - [ ]* 12.4 Write property test for value formatting
    - **Property 20: SI Prefix Formatting**
    - **Validates: Requirements 4.3**

  - [ ] 12.5 Add responsive tick density
    - Calculate optimal tick count based on available space
    - Target 60-80px spacing for horizontal, 50px for vertical
    - _Requirements: 4.1_

  - [ ]* 12.6 Write property test for responsive ticks
    - **Property 18: Responsive Tick Density**
    - **Validates: Requirements 4.1**

- [ ] 13. Checkpoint - Interactivity Enhancements Complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ]* 14. Enhanced ZoomPanPlugin
  - [ ]* 14.1 Extend ZoomPanPlugin with enhanced features
    - Add zoom scale factor (1.2x per scroll)
    - Implement pan with real-time domain updates
    - Add debouncing (16ms for 60fps)
    - _Requirements: 5.1, 5.2, 5.3_

  - [ ]* 14.2 Write property tests for zoom/pan
    - **Property 23: Zoom Scale Factor**
    - **Property 24: Pan Domain Update**
    - **Property 25: Render Debouncing**
    - **Validates: Requirements 5.1, 5.2, 5.3**

  - [ ]* 14.3 Add elastic pan resistance
    - Implement rubber-band effect at data bounds
    - _Requirements: 5.5_

  - [ ]* 14.4 Add double-click reset
    - Reset zoom to original extent with 300ms animation
    - _Requirements: 5.6_

  - [ ]* 14.5 Write unit test for zoom reset
    - Test double-click behavior
    - _Requirements: 5.6_

- [ ]* 15. Marker Interactions
  - [ ]* 15.1 Add marker hover animations
    - Scale from 4px to 6px on hover (300ms transition)
    - Add glow filter effect
    - _Requirements: 6.1, 6.2_

  - [ ]* 15.2 Write property tests for marker interactions
    - **Property 28: Marker Hover Animation**
    - **Property 29: Marker Glow Effect**
    - **Validates: Requirements 6.1, 6.2**

  - [ ]* 15.3 Add marker click events
    - Emit 'pointClick' event with data
    - _Requirements: 6.3_

  - [ ]* 15.4 Implement marker collision detection
    - Show only non-overlapping markers when dense
    - _Requirements: 6.4_

  - [ ]* 15.5 Add dynamic marker on line hover
    - Show temporary marker at nearest point
    - _Requirements: 6.5_

  - [ ]* 15.6 Add series highlighting on hover
    - Dim non-hovered series to 40% opacity
    - _Requirements: 6.6_

- [ ]* 16. LegendManager Component
  - [ ]* 16.1 Create LegendManager
    - Implement legend rendering with series names and colors
    - Add positioning support (top, bottom, left, right, floating)
    - _Requirements: 9.1, 9.4_

  - [ ]* 16.2 Write property test for legend rendering
    - **Property 37: Legend Rendering**
    - **Validates: Requirements 9.1**

  - [ ]* 16.3 Add legend interactivity
    - Implement click to toggle series visibility
    - Add hover to highlight series
    - _Requirements: 9.2, 9.3_

  - [ ]* 16.4 Write property tests for legend interactions
    - **Property 38: Legend Toggle Animation**
    - **Property 39: Legend Hover Highlighting**
    - **Validates: Requirements 9.2, 9.3**

  - [ ]* 16.5 Style hidden series in legend
    - Apply 50% opacity and strikethrough
    - _Requirements: 9.6_

  - [ ]* 16.6 Write property test for hidden series styling
    - **Property 40: Hidden Series Styling**
    - **Validates: Requirements 9.6**

- [ ]* 17. Responsive Behavior
  - [ ]* 17.1 Add ResizeObserver support
    - Implement resize detection with ResizeObserver
    - Fallback to window resize events
    - Debounce to 150ms
    - _Requirements: 10.1, 10.6_

  - [ ]* 17.2 Write property tests for resize handling
    - **Property 41: Resize Debouncing**
    - **Property 44: ResizeObserver Usage**
    - **Validates: Requirements 10.1, 10.6**

  - [ ]* 17.3 Add responsive margin and tick adjustments
    - Reduce margins at small widths
    - Adjust tick density for readability
    - _Requirements: 10.2_

  - [ ]* 17.4 Add mobile touch target sizing
    - Increase interactive elements to 44px minimum on mobile
    - _Requirements: 10.5_

  - [ ]* 17.5 Write property tests for responsive behavior
    - **Property 42: Constrained Width Adaptation**
    - **Property 43: Mobile Touch Targets**
    - **Validates: Requirements 10.2, 10.5**

- [ ]* 18. Accessibility Enhancements
  - [ ]* 18.1 Add ARIA live region
    - Create live region with data summary
    - Update on data changes
    - _Requirements: 11.1, 11.6_

  - [ ]* 18.2 Write property test for ARIA live region
    - **Property 45: ARIA Live Region**
    - **Validates: Requirements 11.1**

  - [ ]* 18.3 Implement keyboard navigation
    - Tab to focus chart
    - Arrow keys to navigate points
    - Enter to activate
    - _Requirements: 11.2_

  - [ ]* 18.4 Write property test for keyboard navigation
    - **Property 46: Keyboard Navigation**
    - **Validates: Requirements 11.2**

  - [ ]* 18.5 Add screen reader announcements
    - Announce point values on focus
    - Use aria-describedby for tooltips
    - _Requirements: 11.3, 11.5_

  - [ ]* 18.6 Write property tests for screen reader support
    - **Property 47: Screen Reader Announcements**
    - **Property 48: Tooltip ARIA Association**
    - **Validates: Requirements 11.3, 11.5**

- [ ]* 19. Export Functionality
  - [ ]* 19.1 Implement PNG export
    - Render chart to canvas
    - Return PNG data URL
    - Support scale factors (1x, 2x, 3x)
    - _Requirements: 13.1, 13.4_

  - [ ]* 19.2 Write unit test for PNG export
    - Test export with different scale factors
    - _Requirements: 13.1, 13.4_

  - [ ]* 19.3 Implement SVG export
    - Serialize SVG DOM
    - Return SVG string
    - _Requirements: 13.2_

  - [ ]* 19.4 Add print-friendly export styles
    - White background, darker colors, larger fonts
    - _Requirements: 13.3_

  - [ ]* 19.5 Add export error handling
    - Fallback to clipboard copy
    - Provide error messages
    - _Requirements: 13.6_

- [ ]* 20. StreamingDataManager Component
  - [ ]* 20.1 Create StreamingDataManager
    - Implement circular buffer
    - Add appendData() method
    - Implement sliding window
    - _Requirements: 15.1, 15.6_

  - [ ]* 20.2 Write property tests for streaming
    - **Property 49: Sliding Window**
    - **Property 52: Circular Buffer Management**
    - **Validates: Requirements 15.1, 15.6**

  - [ ]* 20.3 Add render rate limiting
    - Throttle to 30fps for streaming
    - _Requirements: 15.2_

  - [ ]* 20.4 Write property test for rate limiting
    - **Property 50: Render Rate Limiting**
    - **Validates: Requirements 15.2**

  - [ ]* 20.5 Implement data aggregation
    - Support average, min, max strategies
    - Apply when data rate exceeds capacity
    - _Requirements: 15.3_

  - [ ]* 20.6 Write property test for aggregation
    - **Property 51: Data Aggregation**
    - **Validates: Requirements 15.3**

- [ ]* 21. Dark Theme Support
  - [ ]* 21.1 Create dark theme
    - Define dark color palette
    - Invert colors for readability
    - _Requirements: 14.4_

  - [ ]* 21.2 Add theme switching with animation
    - Animate color transitions (300ms)
    - _Requirements: 14.3_

  - [ ]* 21.3 Write property tests for theme switching
    - **Property 14.3: Theme Transition Animation**
    - **Validates: Requirements 14.3**

- [ ] 22. Integration and Documentation
  - [ ] 22.1 Update Storybook stories
    - Add stories for new features
    - Showcase visual polish improvements
    - Demonstrate performance with large datasets
    - _Requirements: All_

  - [ ]* 22.2 Write integration tests
    - Test component interactions
    - Test full chart lifecycle
    - _Requirements: All_

  - [ ] 22.3 Update README and API documentation
    - Document new theme system
    - Document export functionality
    - Add performance guidelines
    - _Requirements: All_

  - [ ]* 22.4 Create migration guide
    - Document breaking changes (if any)
    - Provide upgrade examples
    - _Requirements: All_

- [ ] 23. Final Checkpoint - Production Ready
  - Ensure all tests pass, ask the user if questions arise.

## Notes

### MVP Focus (Non-Optional Tasks)
The MVP includes essential visual polish and performance improvements:
- Theme system with Chart.js-inspired defaults
- Visual polish (colors, styling, animations)
- Performance optimizations (canvas fallback, progressive rendering)
- Gradient fills and z-index layering
- Crosshair and enhanced tooltips
- Intelligent axis formatting
- Basic integration and documentation

### Optional Enhancements (Marked with *)
Optional tasks add advanced features:
- Enhanced zoom/pan with elastic bounds
- Marker interactions and collision detection
- Interactive legend
- Responsive behavior and mobile optimization
- Full accessibility support
- Export functionality (PNG/SVG)
- Real-time streaming data
- Dark theme support
- Comprehensive property-based tests

### Testing Approach
- Each core feature has associated property tests
- Property tests validate universal correctness across all inputs
- Unit tests cover specific examples and edge cases
- Integration tests ensure components work together
- Visual regression tests maintain consistent appearance

### Implementation Order
Tasks are ordered to:
1. Establish foundation (theme system, visual polish)
2. Add performance optimizations (critical for large datasets)
3. Enhance interactivity (crosshair, tooltips, axes)
4. Add optional advanced features (legend, accessibility, export, streaming)
5. Complete with integration and documentation
