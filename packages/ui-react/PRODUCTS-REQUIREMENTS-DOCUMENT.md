# Product Requirements Document (PRD): @web-loom/ui-react

## 1. Overview

### 1.1 Product Name

**@web-loom/ui-react** - A themeable, accessible React component library built on the Web Loom ecosystem.

### 1.2 Product Vision

Create a lightweight, themeable React component library that provides essential UI components with an API similar to Ant Design, built exclusively on Web Loom's framework-agnostic foundations. The library should be production-ready, accessible, and maintainable while leveraging existing Web Loom packages.

### 1.3 Success Metrics

- Zero third-party styling or UI dependencies (only Web Loom packages)
- 100% TypeScript coverage
- WCAG 2.1 AA compliance for all components
- Bundle size under 100KB gzipped for core components. Implement code splitting
- Full test coverage with Vitest
- Comprehensive Storybook documentation

## 2. Scope & Constraints

### 2.1 In Scope

- React components built on @web-loom/design-core, @web-loom/ui-core, and @web-loom/ui-patterns
- Theme system with React Context provider
- Core components (90% usage) as priority
- Full TypeScript support
- Accessibility compliance
- Storybook documentation
- Vitest unit testing

### 2.2 Out of Scope

- Third-party styling libraries (Tailwind, Emotion, Styled-components)
- Third-party UI libraries
- Server-side rendering optimizations (initial release)
- Mobile-specific components
- Internationalization (i18n) - future phase

## 3. Technical Architecture

### 3.1 Dependencies

```
@web-loom/ui-react
├── @web-loom/design-core (tokens, themes, design constants)
├── @web-loom/ui-core (headless behaviors)
└── @web-loom/ui-patterns (composed patterns)
```

### 3.2 Project Structure

```
packages/ui-react/
├── src/
│   ├── providers/          # Theme providers, config context
│   ├── hooks/             # Custom React hooks
│   ├── components/        # React components
│   │   ├── layout/        # Layout components
│   │   ├── navigation/    # Navigation components
│   │   ├── data-entry/    # Form components
│   │   ├── data-display/  # Display components
│   │   └── feedback/      # Feedback components
│   ├── styles/           # Component styles (CSS-in-JS or CSS modules)
│   ├── types/            # TypeScript definitions
│   └── utils/            # Shared utilities
├── stories/              # Storybook stories
├── tests/                # Vitest tests
└── docs/                 # Documentation
```

### 3.3 Styling Approach

- Use CSS variables from @web-loom/design-core for theming
- CSS Modules for component-scoped styles
- Leverage design tokens for consistency
- No CSS-in-JS runtime overhead

## 4. Core Requirements

### 4.1 Theme System (Priority 1)

**ThemeProvider Component**

```typescript
interface ThemeConfig {
  token: DesignToken;
  components: Record<string, ComponentToken>;
}

interface WebLoomConfigProviderProps {
  theme?: ThemeConfig;
  children: React.ReactNode;
  locale?: LocaleType; // Future
}
```

### 4.2 Component Requirements

#### Phase 1: Foundation & Layout (Weeks 1-2)

1. **ThemeProvider** - Configuration context provider
2. **Layout Components**
   - `<Layout>` with Header, Sider, Content, Footer
   - `<Grid>` (Row/Col) responsive system
   - `<Space>` spacing component
   - `<Card>` content container
   - `<Divider>` visual separator

#### Phase 2: Navigation & Basic Inputs (Weeks 3-4)

3. **Navigation**
   - `<Menu>` vertical/horizontal
   - `<Tabs>` tabbed navigation
   - `<Breadcrumb>` navigation path
4. **Form Components**
   - `<Form>` with validation context
   - `<Input>` (text, password, search)
   - `<Select>` dropdown
   - `<Checkbox>` & `<Radio>`
   - `<Button>` primary action

#### Phase 3: Data Display & Feedback (Weeks 5-6)

5. **Data Display**
   - `<Table>` with pagination
   - `<List>` vertical lists
   - `<Tag>` & `<Badge>` labels
   - `<Avatar>` user image
6. **Feedback**
   - `<Modal>` dialog
   - `<Message>` toast notifications
   - `<Notification>` rich alerts
   - `<Spin>` loading indicator
   - `<Tooltip>` & `<Popover>`

#### Phase 4: Advanced Components (Weeks 7-8)

7. **Advanced Form**
   - `<DatePicker>` & `<RangePicker>`
   - `<TimePicker>`
   - `<Upload>` file upload
   - `<Slider>` range input
8. **Additional Components**
   - `<Drawer>` slide-out panel
   - `<Collapse>` accordion
   - `<Steps>` progress indicator
   - `<Progress>` bar/circle
   - `<Skeleton>` loading placeholder

### 4.3 Accessibility Standards

- ARIA labels and attributes
- Keyboard navigation support
- Focus management
- Screen reader compatibility
- Color contrast compliance
- Reduced motion support

### 4.4 TypeScript Requirements

- Strict typing for all props
- Generic components where applicable (Table, Select)
- Export all types from package
- Complete JSDoc comments

## 5. Implementation Plan

### Week 1: Setup & Foundation

1. **Project Setup**
   - Configure build system (tsup or similar)
   - Set up CSS processing
   - Configure Storybook theming
   - Set up test utilities
   - Changes should all be scoped in packages/ui-react

2. **Theme System Implementation**
   - Create ThemeProvider component
   - Implement theme context
   - Create theme merging utilities
   - Set up CSS variable injection
   - See example of apps/mvvm-react-integrated/src/providers/ThemeProvider.tsx

3. **Base Components**
   - Create `<Button>` component
   - Create `<Space>` layout component
   - Set up component testing patterns

### Week 2: Layout System

1. **Grid System**
   - Implement `<Row>` and `<Col>`
   - Responsive breakpoint system
   - Gutter/spacing utilities

2. **Layout Components**
   - Create `<Layout>` and subcomponents
   - Implement `<Card>` with variants
   - Create `<Divider>` component

### Week 3: Navigation

1. **Menu System**
   - Implement `<Menu>` component
   - Create menu items and submenus
   - Add keyboard navigation

2. **Tabs & Breadcrumbs**
   - Create `<Tabs>` component
   - Implement `<Breadcrumb>`
   - Add accessibility features

### Week 4: Form Foundation

1. **Form Context**
   - Create `<Form>` component
   - Implement validation system
   - Create form item management

2. **Basic Inputs**
   - Create `<Input>` with variants
   - Implement `<Select>` dropdown
   - Create `<Checkbox>` and `<Radio>`

### Week 5: Data Display

1. **Table Component**
   - Implement `<Table>` with columns
   - Add sorting and filtering
   - Implement pagination

2. **List & Tags**
   - Create `<List>` component
   - Implement `<Tag>` with colors
   - Create `<Badge>` component

### Week 6: Feedback Components

1. **Modal & Drawer**
   - Create `<Modal>` dialog
   - Implement `<Drawer>` side panel
   - Add focus trapping

2. **Notifications**
   - Create `<Message>` system
   - Implement `<Notification>`
   - Create `<Spin>` loader

### Week 7: Advanced Components

1. **Date & Time**
   - Implement `<DatePicker>`
   - Create `<TimePicker>`
   - Add range selections

2. **Upload & Slider**
   - Create `<Upload>` component
   - Implement `<Slider>` input
   - Add file validation

### Week 8: Polish & Documentation

1. **Accessibility Audit**
   - Test all components with screen readers
   - Verify keyboard navigation
   - Check color contrast

2. **Documentation**
   - Complete Storybook stories
   - Add usage examples
   - Create API documentation

3. **Performance Optimization**
   - Bundle size analysis
   - Lazy loading for large components
   - Memoization where needed

## 6. Component API Design Guidelines

### 6.1 Consistent Prop Patterns

```typescript
// Size prop (consistent across all components)
type ComponentSize = 'small' | 'medium' | 'large';

// Variant prop
type ComponentVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

// Common props interface
interface CommonProps {
  className?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
  size?: ComponentSize;
  'data-testid'?: string;
}
```

### 6.2 Component Structure Pattern

```typescript
// Example component structure
const ComponentName: React.FC<ComponentProps> = (props) => {
  // 1. Extract props with defaults
  // 2. Use Web Loom hooks/behaviors
  // 3. Compose with ui-patterns
  // 4. Apply theme tokens
  // 5. Add accessibility attributes
  // 6. Return JSX with proper DOM structure
};
```

## 7. Testing Strategy

### 7.1 Unit Testing (Vitest)

- Component rendering tests
- Prop validation tests
- Event handler tests
- Theme application tests

### 7.2 Integration Testing

- Component composition tests
- Form validation flows
- Accessibility compliance tests

### 7.3 Visual Testing (Storybook)

- Component stories for all variants
- Interaction testing
- Visual regression testing

## 8. Quality Standards

### 8.1 Code Quality

- ESLint with strict rules
- Prettier for code formatting
- Husky pre-commit hooks
- Conventional commits

### 8.2 Performance

- Bundle size tracking
- Render performance optimization
- Memoization strategy
- Lazy loading for large components

### 8.3 Documentation

- Storybook for visual documentation
- JSDoc for API documentation
- Usage examples
- Migration guides (if applicable)

## 9. Release Plan

### 9.1 Alpha Release (Week 4)

- Theme system
- Layout components
- Basic form inputs
- Documentation foundation

### 9.2 Beta Release (Week 6)

- Complete form components
- Data display components
- Feedback components
- Comprehensive testing

### 9.3 v1.0 Release (Week 8)

- All core components
- Full accessibility audit
- Performance optimization
- Production documentation

## 10. Future Considerations

### 10.1 Phase 2 (Post v1.0)

- Internationalization (i18n) support
- Server-side rendering optimization
- Advanced data visualization components
- Custom theme generator

### 10.2 Integration Opportunities

- React Native compatibility layer
- Figma design token sync
- CLI for component generation
- Plugin system for extensions

---

## Appendix A: Component Priority Matrix

| Priority | Components                          | Estimated Effort | Dependencies         |
| -------- | ----------------------------------- | ---------------- | -------------------- |
| P0       | ThemeProvider, Button, Grid, Layout | 2 weeks          | design-core          |
| P1       | Form, Input, Select, Modal          | 2 weeks          | ui-core, ui-patterns |
| P2       | Table, Menu, Tabs, Message          | 2 weeks          | ui-patterns          |
| P3       | DatePicker, Upload, Drawer, Steps   | 2 weeks          | ui-patterns          |

## Appendix B: Accessibility Checklist

- [ ] Keyboard navigation
- [ ] Screen reader announcements
- [ ] Focus management
- [ ] ARIA attributes
- [ ] Color contrast compliance
- [ ] Reduced motion support
- [ ] Error message associations
- [ ] Form label associations

---

**Status**: Draft  
**Last Updated**: [Date]  
**Owner**: UI React Team  
**Stakeholders**: Design System Team, Product Engineering
