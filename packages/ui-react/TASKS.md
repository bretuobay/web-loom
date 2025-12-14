# Web Loom React Component Library: Step-by-Step Implementation Tasks

Tasks break down for packages/ui-react/PRODUCTS-REQUIREMENTS-DOCUMENT.md

## Phase 1: Foundation & Setup (Week 1-2)

### Task 1.1: Project Infrastructure Setup

```
**Task ID**: WL-RCT-001
**Priority**: P0
**Estimated Time**: 4 hours

**Objective**: Configure build system and basic project structure

NOTE: There is already some set up, evaluate if you need to execute task or not.

**Steps**:
1. Set up tsup configuration for building TypeScript
   - Create `tsup.config.ts` with ESM/CJS outputs
   - Configure CSS extraction for CSS Modules
   - Set up type definitions generation

2. Configure package.json for publishing
   - Define entry points: `./dist/index.js`, `./dist/index.css`
   - Set up exports field for tree-shaking
   - Configure peerDependencies: `react@^18.0.0`, `react-dom@^18.0.0`

3. Create project structure
```

src/
├── index.ts # Main exports
├── styles/
│ └── globals.css # CSS variables and global styles
├── providers/
├── hooks/
├── components/
└── utils/

```

**Acceptance Criteria**:
- ✓ `npm run build` produces both ESM and CJS outputs
- ✓ Type definitions are generated in `dist/`
- ✓ CSS is extracted to separate file
- ✓ Tree-shaking enabled via package.json exports
```

### Task 1.2: Theme Provider System

````
**Task ID**: WL-RCT-002
**Priority**: P0
**Estimated Time**: 6 hours
**Dependencies**: WL-RCT-001

**Objective**: Create theme provider and context system

**Steps**:
1. Create theme context and types
   ```typescript
   // src/providers/types.ts
   export interface ThemeConfig {
     token: {
       colorPrimary: string;
       colorSuccess: string;
       colorWarning: string;
       colorError: string;
       // ... other design tokens
     };
     components?: Record<string, any>;
   }
````

2. Implement ThemeProvider component

   ```typescript
   // src/providers/ThemeProvider.tsx
   export const ThemeProvider: React.FC<ThemeProviderProps>;
   ```

3. Create useTheme hook

   ```typescript
   // src/hooks/useTheme.ts
   export const useTheme = () => useContext(ThemeContext);
   ```

4. Implement CSS variable injection
   - Convert theme tokens to CSS custom properties
   - Inject into :root or specific container

5. Create ConfigProvider wrapper
   ```typescript
   // src/providers/ConfigProvider.tsx
   export const ConfigProvider: React.FC<ConfigProviderProps>;
   ```

**Acceptance Criteria**:

- ✓ ThemeProvider provides theme context
- ✓ CSS variables update when theme changes
- ✓ useTheme hook returns current theme
- ✓ Components receive theme via context
- ✓ Storybook shows theme switching

```

### Task 1.3: Base Button Component
```

**Task ID**: WL-RCT-003
**Priority**: P0
**Estimated Time**: 4 hours
**Dependencies**: WL-RCT-002

**Objective**: Create foundation Button component with variants

**Steps**:

1. Define Button props interface

   ```typescript
   interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
     type?: 'primary' | 'default' | 'dashed' | 'link' | 'text';
     size?: 'small' | 'middle' | 'large';
     shape?: 'default' | 'circle' | 'round';
     loading?: boolean;
     danger?: boolean;
     icon?: React.ReactNode;
   }
   ```

2. Implement Button component using CSS Modules
   - Create `src/components/button/Button.tsx`
   - Create `src/components/button/Button.module.css`
   - Use design tokens from theme

3. Add accessibility features
   - ARIA labels for loading state
   - Keyboard focus indicators
   - Disabled state handling

4. Create Button stories
   - All variants and sizes
   - Loading states
   - Disabled states
   - Icon buttons

5. Write Button tests
   - Render tests
   - Click handler tests
   - Prop validation tests

**Acceptance Criteria**:

- ✓ Button renders all variants correctly
- ✓ Loading spinner appears when loading=true
- ✓ Button is accessible via keyboard
- ✓ All props are TypeScript validated
- ✓ CSS classes are properly scoped

```

### Task 1.4: Space Component
```

**Task ID**: WL-RCT-004
**Priority**: P0
**Estimated Time**: 3 hours
**Dependencies**: WL-RCT-002

**Objective**: Create Space component for consistent spacing

**Steps**:

1. Define Space props

   ```typescript
   interface SpaceProps {
     direction?: 'vertical' | 'horizontal';
     size?: 'small' | 'middle' | 'large' | number;
     align?: 'start' | 'end' | 'center' | 'baseline';
     wrap?: boolean;
   }
   ```

2. Implement Space component
   - Use CSS flexbox
   - Convert size prop to actual spacing
   - Handle nested Spaces

3. Create Space stories
   - Different directions
   - Various sizes
   - Alignment examples

**Acceptance Criteria**:

- ✓ Children are spaced consistently
- ✓ Size prop accepts both preset and custom values
- ✓ Wrap works correctly
- ✓ No extra DOM elements created

```

### Task 1.5: CSS Variables System
```

**Task ID**: WL-RCT-005
**Priority**: P0
**Estimated Time**: 5 hours
**Dependencies**: WL-RCT-002

**Objective**: Integrate with @web-loom/design-core tokens

**Steps**:

1. Create token mapping utilities

   ```typescript
   // src/utils/tokens.ts
   export const mapDesignTokensToCSS = (tokens: DesignTokens) => {
     return {
       '--wl-color-primary': tokens.colorPrimary,
       // ... map all tokens
     };
   };
   ```

2. Create global stylesheet
   - Import design-core tokens
   - Define CSS custom properties
   - Set up theme overrides

3. Implement theme merging
   - Default theme from design-core
   - User overrides
   - Component-specific tokens

**Acceptance Criteria**:

- ✓ CSS variables update with theme changes
- ✓ Components use CSS variables for styling
- ✓ Theme merging preserves defaults
- ✓ No hardcoded colors in components

```

## Phase 2: Layout System (Week 2)

### Task 2.1: Grid System (Row & Col)
```

**Task ID**: WL-RCT-006
**Priority**: P0
**Estimated Time**: 6 hours
**Dependencies**: WL-RCT-002

**Objective**: Create responsive grid system

**Steps**:

1. Define Row and Col props

   ```typescript
   interface RowProps {
     gutter?: number | [number, number];
     justify?: 'start' | 'end' | 'center' | 'space-between' | 'space-around';
     align?: 'top' | 'middle' | 'bottom';
   }

   interface ColProps {
     span?: number;
     offset?: number;
     xs?: number | { span: number; offset: number };
     sm?: number | { span: number; offset: number };
     md?: number | { span: number; offset: number };
     lg?: number | { span: number; offset: number };
     xl?: number | { span: number; offset: number };
   }
   ```

2. Implement Row component
   - Handle gutter spacing
   - Implement flexbox layout
   - Create responsive breakpoints

3. Implement Col component
   - Calculate width based on span
   - Handle responsive props
   - Manage offsets

4. Create Grid stories
   - Basic grid layout
   - Responsive examples
   - Nested grids
   - Gutter examples

**Acceptance Criteria**:

- ✓ Grid responds to breakpoints
- ✓ Gutter spacing works correctly
- ✓ Col spans calculate percentages
- ✓ No layout shifts during resize

```

### Task 2.2: Layout Component
```

**Task ID**: WL-RCT-007
**Priority**: P0
**Estimated Time**: 5 hours
**Dependencies**: WL-RCT-006

**Objective**: Create Layout component with Header, Sider, Content, Footer

**Steps**:

1. Create Layout context
   - Track sider collapsed state
   - Provide context to children

2. Implement main Layout component
   - Basic flex container
   - Handle direction (vertical/horizontal)

3. Create subcomponents
   - Header with fixed position option
   - Sider with collapse functionality
   - Content with scrolling
   - Footer

4. Add accessibility
   - Skip links
   - Landmark roles (main, header, footer, navigation)

**Acceptance Criteria**:

- ✓ Layout renders all sections
- ✓ Sider collapses smoothly
- ✓ Content scrolls independently
- ✓ All sections have proper ARIA roles

```

### Task 2.3: Card Component
```

**Task ID**: WL-RCT-008
**Priority**: P0
**Estimated Time**: 4 hours
**Dependencies**: WL-RCT-002

**Objective**: Create Card component for content containers

**Steps**:

1. Define Card props

   ```typescript
   interface CardProps {
     title?: React.ReactNode;
     extra?: React.ReactNode;
     bordered?: boolean;
     hoverable?: boolean;
     loading?: boolean;
     size?: 'default' | 'small';
     cover?: React.ReactNode;
     actions?: React.ReactNode[];
   }
   ```

2. Implement Card component
   - Header, body, footer sections
   - Loading skeleton
   - Hover effects

3. Create Card stories
   - Different sizes
   - With images
   - Loading states
   - Action buttons

**Acceptance Criteria**:

- ✓ Card renders all sections
- ✓ Hover effects work
- ✓ Loading skeleton appears
- ✓ Actions positioned correctly

```

### Task 2.4: Divider Component
```

**Task ID**: WL-RCT-009
**Priority**: P1
**Estimated Time**: 2 hours
**Dependencies**: WL-RCT-002

**Objective**: Create Divider for visual separation

**Steps**:

1. Define Divider props

   ```typescript
   interface DividerProps {
     type?: 'horizontal' | 'vertical';
     orientation?: 'left' | 'right' | 'center';
     dashed?: boolean;
     plain?: boolean;
   }
   ```

2. Implement Divider component
   - Horizontal and vertical variants
   - Text in divider
   - Dashed style

**Acceptance Criteria**:

- ✓ Horizontal and vertical dividers work
- ✓ Text alignment options work
- ✓ Dashed style renders correctly

```

## Phase 3: Navigation Components (Week 3)

### Task 3.1: Menu Component
```

**Task ID**: WL-RCT-010
**Priority**: P1
**Estimated Time**: 8 hours
**Dependencies**: @web-loom/ui-core, @web-loom/ui-patterns
Check if there is a pattern in ui core or ui patterns you can use or if you think it should export some reuseable menu pattern

**Objective**: Create accessible Menu component.

**Steps**:

1. Integrate with ui-core menu behaviors

   ```typescript
   import { useMenu } from '@web-loom/ui-core/menu';
   ```

2. Define Menu types

   ```typescript
   interface MenuProps {
     mode?: 'vertical' | 'horizontal' | 'inline';
     theme?: 'light' | 'dark';
     selectedKeys?: string[];
     defaultSelectedKeys?: string[];
     inlineCollapsed?: boolean;
   }
   ```

3. Implement Menu components
   - Menu (container)
   - Menu.Item
   - Menu.SubMenu
   - Menu.Divider
   - Menu.ItemGroup

4. Add accessibility
   - Keyboard navigation (arrow keys, Enter, Escape)
   - ARIA roles and attributes
   - Focus management

5. Create Menu stories
   - Horizontal and vertical modes
   - Nested submenus
   - Collapsed state
   - Theme variants

**Acceptance Criteria**:

- ✓ Keyboard navigation works
- ✓ Submenus open/close correctly
- ✓ Selected states persist
- ✓ ARIA attributes are correct
- ✓ Collapse/expand works

```

### Task 3.2: Tabs Component
```

**Task ID**: WL-RCT-011
**Priority**: P1
**Estimated Time**: 6 hours
**Dependencies**: @web-loom/ui-core

**Objective**: Create Tabs component with keyboard support

**Steps**:

1. Integrate with ui-core tabs behavior
2. Define Tab types

   ```typescript
   interface TabsProps {
     activeKey?: string;
     defaultActiveKey?: string;
     type?: 'line' | 'card' | 'editable-card';
     size?: 'large' | 'middle' | 'small';
     tabPosition?: 'top' | 'right' | 'bottom' | 'left';
   }
   ```

3. Implement Tabs components
   - Tabs (container)
   - TabPane
   - Add/remove functionality for editable tabs

4. Add accessibility
   - Arrow key navigation
   - Home/End key support
   - ARIA tabs pattern

5. Create Tabs stories
   - Different types
   - Various positions
   - Editable tabs
   - Disabled tabs

**Acceptance Criteria**:

- ✓ Tab switching works with keyboard
- ✓ Content changes with active tab
- ✓ Editable tabs add/remove
- ✓ All positions render correctly

```

### Task 3.3: Breadcrumb Component
```

**Task ID**: WL-RCT-012
**Priority**: P1
**Estimated Time**: 3 hours
**Dependencies**: WL-RCT-002

**Objective**: Create Breadcrumb navigation

**Steps**:

1. Define Breadcrumb types

   ```typescript
   interface BreadcrumbProps {
     separator?: React.ReactNode;
     routes?: Array<{ path: string; breadcrumbName: string }>;
   }
   ```

2. Implement Breadcrumb components
   - Breadcrumb (container)
   - Breadcrumb.Item
   - Breadcrumb.Separator

3. Add accessibility
   - Navigation landmark
   - Current page indication

4. Create Breadcrumb stories
   - Simple breadcrumbs
   - With custom separator
   - Route-based breadcrumbs

**Acceptance Criteria**:

- ✓ Items render as links
- ✓ Custom separators work
- ✓ Current page is marked with aria-current
- ✓ Routes prop generates correct items

```

## Phase 4: Form Foundation (Week 4)

### Task 4.1: Form Component
```

**Task ID**: WL-RCT-013
**Priority**: P1
**Estimated Time**: 10 hours
**Dependencies**: Possible dependencies @web-loom/ui-core, @web-loom/forms-core, @web-loom/forms-react

**Objective**: Create comprehensive Form with validation

**Steps**:

1. Integrate with ui-core form behaviors
2. Define Form types

   ```typescript
   interface FormProps {
     layout?: 'horizontal' | 'vertical' | 'inline';
     colon?: boolean;
     labelAlign?: 'left' | 'right';
     requiredMark?: boolean | 'optional';
     onFinish?: (values: any) => void;
     onFinishFailed?: (errorInfo: any) => void;
   }
   ```

3. Implement Form components
   - Form (context provider)
   - Form.Item (field wrapper)
   - Form.List (dynamic fields)
   - Form.Provider (cross-form communication)

4. Add validation system
   - Rule-based validation
   - Async validation
   - Error message display
   - Form status management

5. Add accessibility
   - Error announcements
   - Required field indication
   - Field descriptions

6. Create Form stories
   - Different layouts
   - Validation examples
   - Dynamic forms
   - Form submission

**Acceptance Criteria**:

- ✓ Validation rules work
- ✓ Error messages display correctly
- ✓ Form submission triggers callbacks
- ✓ Layout options render properly
- ✓ Dynamic forms add/remove fields

```

### Task 4.2: Input Components
```

**Task ID**: WL-RCT-014
**Priority**: P1
**Estimated Time**: 6 hours
**Dependencies**: WL-RCT-013, @web-loom/ui-core

**Objective**: Create Input, Input.Password, Input.Search

**Steps**:

1. Integrate with ui-core input behaviors
2. Define Input types

   ```typescript
   interface InputProps {
     size?: 'large' | 'middle' | 'small';
     disabled?: boolean;
     allowClear?: boolean;
     prefix?: React.ReactNode;
     suffix?: React.ReactNode;
     addonBefore?: React.ReactNode;
     addonAfter?: React.ReactNode;
   }
   ```

3. Implement Input components
   - Input (basic text input)
   - Input.Password (with toggle)
   - Input.Search (with search button)
   - Input.TextArea (multiline)
   - Input.Group (combined inputs)

4. Add accessibility
   - Clear button label
   - Password toggle announcement
   - Search button description

5. Create Input stories
   - All variants
   - With addons
   - Clearable inputs
   - Disabled states

**Acceptance Criteria**:

- ✓ Password toggle works
- ✓ Clear button appears when text exists
- ✓ Addons position correctly
- ✓ All sizes render properly
- ✓ Focus states are visible

```

### Task 4.3: Select Component
```

**Task ID**: WL-RCT-015
**Priority**: P1
**Estimated Time**: 8 hours
**Dependencies**: @web-loom/ui-core, @web-loom/ui-patterns

**Objective**: Create Select dropdown with search and multi-select

**Steps**:

1. Integrate with ui-core select behaviors
2. Define Select types

   ```typescript
   interface SelectProps {
     mode?: 'multiple' | 'tags';
     allowClear?: boolean;
     showSearch?: boolean;
     filterOption?: boolean | ((inputValue: string, option: OptionType) => boolean);
     options?: OptionType[];
     loading?: boolean;
     notFoundContent?: React.ReactNode;
   }
   ```

3. Implement Select components
   - Select (main component)
   - Select.Option
   - Select.OptGroup
   - Virtual scrolling for large lists

4. Add accessibility
   - Combobox ARIA pattern
   - Screen reader announcements
   - Keyboard navigation

5. Create Select stories
   - Basic selection
   - Multi-select
   - Searchable
   - Grouped options
   - Loading state

**Acceptance Criteria**:

- ✓ Search filters options
- ✓ Multi-select works
- ✓ Options render with virtualization
- ✓ Loading indicator shows
- ✓ Keyboard navigation works

```

### Task 4.4: Checkbox & Radio Components
```

**Task ID**: WL-RCT-016
**Priority**: P1
**Estimated Time**: 5 hours
**Dependencies**: @web-loom/ui-core

**Objective**: Create Checkbox and Radio with groups

**Steps**:

1. Integrate with ui-core selection behaviors if they exist or create one if is worth it or don't decide based on correctness of abstraction and the philosophy of the framework
2. Define component types

   ```typescript
   interface CheckboxProps {
     checked?: boolean;
     disabled?: boolean;
     indeterminate?: boolean;
   }

   interface RadioProps {
     checked?: boolean;
     disabled?: boolean;
     value?: any;
   }
   ```

3. Implement components
   - Checkbox (individual)
   - Checkbox.Group
   - Radio (individual)
   - Radio.Group
   - Radio.Button (button style)

4. Add accessibility
   - Group labels
   - Required state
   - Keyboard navigation

5. Create stories
   - Checkbox groups
   - Radio groups
   - Button style radios
   - Indeterminate checkboxes

**Acceptance Criteria**:

- ✓ Groups manage selection state
- ✓ Indeterminate state works
- ✓ Button radios render correctly
- ✓ Disabled states work
- ✓ onChange fires correctly

```

## Phase 5: Data Display (Week 5-6)

### Task 5.1: Table Component

```

**Task ID**: WL-RCT-017
**Priority**: P1
**Estimated Time**: 12 hours
**Dependencies**: @web-loom/ui-core, @web-loom/ui-patterns

**Objective**: Create comprehensive Table component with sorting, filtering, and pagination. If pattern for table ( headless ui ) do not exist, then add them first

**Steps**:

1. Integrate with ui-core table behaviors

   ```typescript
   import { useTable, useSorting, usePagination } from '@web-loom/ui-core/table';
   ```

2. Define Table types

   ```typescript
   interface TableProps<T> {
     columns: ColumnType<T>[];
     dataSource?: T[];
     loading?: boolean;
     pagination?: false | PaginationConfig;
     scroll?: { x?: number; y?: number };
     rowSelection?: RowSelectionType<T>;
     expandable?: ExpandableConfig<T>;
     sortDirections?: ('ascend' | 'descend')[];
   }

   interface ColumnType<T> {
     title?: React.ReactNode;
     dataIndex?: keyof T;
     key?: string;
     render?: (value: any, record: T, index: number) => React.ReactNode;
     sorter?: boolean | ((a: T, b: T) => number);
     filters?: { text: string; value: string }[];
     width?: number | string;
     fixed?: 'left' | 'right';
   }
   ```

3. Implement Table components
   - Table (main container)
   - Table.Column
   - Table.ColumnGroup
   - Virtual scrolling for large datasets
   - Sticky headers and columns

4. Add advanced features
   - Row selection (single/multiple)
   - Expandable rows
   - Column resizing
   - Column reordering
   - Export functionality

5. Add accessibility
   - ARIA table roles
   - Sortable column announcements
   - Keyboard navigation
   - Screen reader support for complex data

6. Create Table stories
   - Basic table
   - Sortable columns
   - Filterable data
   - Pagination
   - Row selection
   - Expandable rows
   - Fixed columns
   - Loading states

**Acceptance Criteria**:

- ✓ Sorting works on all data types
- ✓ Pagination controls table display
- ✓ Row selection state managed correctly
- ✓ Virtual scrolling handles 10k+ rows
- ✓ Fixed columns scroll independently
- ✓ All table features accessible via keyboard

```

### Task 5.2: List Component

```

**Task ID**: WL-RCT-018
**Priority**: P1
**Estimated Time**: 6 hours
**Dependencies**: WL-RCT-002

**Objective**: Create flexible List component for various data display patterns

**Steps**:

1. Define List types

   ```typescript
   interface ListProps<T> {
     dataSource?: T[];
     renderItem?: (item: T, index: number) => React.ReactNode;
     size?: 'small' | 'default' | 'large';
     split?: boolean;
     bordered?: boolean;
     header?: React.ReactNode;
     footer?: React.ReactNode;
     loading?: boolean;
     pagination?: false | PaginationConfig;
     grid?: GridConfig;
   }

   interface ListItemProps {
     actions?: React.ReactNode[];
     extra?: React.ReactNode;
   }
   ```

2. Implement List components
   - List (main container)
   - List.Item
   - List.Item.Meta (for structured content)
   - Grid layout support

3. Add loading states
   - Skeleton loading
   - Spinner integration
   - Progressive loading

4. Add accessibility
   - List role attributes
   - Item navigation
   - Action button accessibility

5. Create List stories
   - Basic list
   - With actions
   - Grid layout
   - Loading states
   - Pagination
   - Custom renderItem

**Acceptance Criteria**:

- ✓ List renders all item types
- ✓ Grid layout calculates correctly
- ✓ Actions position properly
- ✓ Loading skeleton matches layout
- ✓ Pagination integrates seamlessly

```

### Task 5.3: Tag Component

```

**Task ID**: WL-RCT-019
**Priority**: P1
**Estimated Time**: 4 hours
**Dependencies**: WL-RCT-002

**Objective**: Create Tag component for labels and categories

**Steps**:

1. Define Tag types

   ```typescript
   interface TagProps {
     color?: string | 'success' | 'processing' | 'error' | 'warning' | 'default';
     closable?: boolean;
     closeIcon?: React.ReactNode;
     visible?: boolean;
     onClose?: (e: React.MouseEvent) => void;
     icon?: React.ReactNode;
     bordered?: boolean;
   }
   ```

2. Implement Tag component
   - Color variants (preset and custom)
   - Closable functionality
   - Icon support
   - Bordered/borderless styles

3. Create specialized variants
   - Tag.CheckableTag (for selections)
   - Status tags (success, error, warning)
   - Interactive tags

4. Add accessibility
   - Close button labels
   - Color meaning communication
   - Keyboard interaction

5. Create Tag stories
   - Color variants
   - Closable tags
   - Checkable tags
   - With icons
   - Custom colors

**Acceptance Criteria**:

- ✓ All color variants render correctly
- ✓ Close functionality works
- ✓ Checkable tags toggle state
- ✓ Custom colors apply properly
- ✓ Icons align correctly

```

### Task 5.4: Badge Component

```

**Task ID**: WL-RCT-020
**Priority**: P1
**Estimated Time**: 3 hours
**Dependencies**: WL-RCT-002

**Objective**: Create Badge component for notifications and status

**Steps**:

1. Define Badge types

   ```typescript
   interface BadgeProps {
     count?: React.ReactNode;
     dot?: boolean;
     showZero?: boolean;
     overflowCount?: number;
     offset?: [number, number];
     size?: 'default' | 'small';
     status?: 'success' | 'processing' | 'default' | 'error' | 'warning';
     text?: React.ReactNode;
     title?: string;
   }
   ```

2. Implement Badge component
   - Notification counts
   - Dot indicator
   - Status badges
   - Overflow handling (99+)
   - Positioning offset

3. Add animations
   - Count change transitions
   - Appear/disappear effects
   - Pulse animation for live updates

4. Add accessibility
   - Screen reader announcements
   - Count descriptions
   - Status meanings

5. Create Badge stories
   - Count badges
   - Dot badges
   - Status indicators
   - Overflow states
   - Animations

**Acceptance Criteria**:

- ✓ Count displays and updates correctly
- ✓ Overflow shows 99+ format
- ✓ Positioning offset works
- ✓ Status colors match design system
- ✓ Animations are smooth

```

### Task 5.5: Avatar Component

```

**Task ID**: WL-RCT-021
**Priority**: P1
**Estimated Time**: 4 hours
**Dependencies**: WL-RCT-002

**Objective**: Create Avatar component for user representation

**Steps**:

1. Define Avatar types

   ```typescript
   interface AvatarProps {
     size?: number | 'large' | 'small' | 'default';
     shape?: 'circle' | 'square';
     src?: string;
     alt?: string;
     icon?: React.ReactNode;
     gap?: number;
     draggable?: boolean;
     onError?: () => boolean;
   }
   ```

2. Implement Avatar component
   - Image avatars with fallback
   - Icon avatars
   - Text avatars (initials)
   - Responsive sizing
   - Error handling for images

3. Create Avatar.Group
   - Multiple avatar display
   - Overlap handling
   - Max count with overflow

4. Add accessibility
   - Alt text for images
   - Meaningful names for icons/text
   - Group descriptions

5. Create Avatar stories
   - Image avatars
   - Icon avatars
   - Text avatars
   - Different sizes and shapes
   - Avatar groups
   - Error states

**Acceptance Criteria**:

- ✓ Image fallback works correctly
- ✓ Text avatars generate initials
- ✓ Groups handle overflow properly
- ✓ All sizes render proportionally
- ✓ Error handling prevents broken images

```

### Task 5.6: Descriptions Component

```

**Task ID**: WL-RCT-022
**Priority**: P2
**Estimated Time**: 4 hours
**Dependencies**: WL-RCT-002

**Objective**: Create Descriptions component for structured information display

**Steps**:

1. Define Descriptions types

   ```typescript
   interface DescriptionsProps {
     title?: React.ReactNode;
     extra?: React.ReactNode;
     bordered?: boolean;
     column?: number | Record<string, number>;
     size?: 'default' | 'middle' | 'small';
     layout?: 'horizontal' | 'vertical';
     colon?: boolean;
   }

   interface DescriptionItemProps {
     label?: React.ReactNode;
     span?: number;
   }
   ```

2. Implement Descriptions components
   - Descriptions (container)
   - Descriptions.Item
   - Responsive column layout
   - Bordered and borderless styles

3. Add responsive behavior
   - Column count per breakpoint
   - Mobile-friendly stacking

4. Create Descriptions stories
   - Basic descriptions
   - Bordered variant
   - Multiple columns
   - Responsive layouts

**Acceptance Criteria**:

- ✓ Columns respond to screen size
- ✓ Bordered style renders correctly
- ✓ Items span multiple columns
- ✓ Vertical layout works on mobile

```

### Task 5.7: Empty Component

```

**Task ID**: WL-RCT-023
**Priority**: P2
**Estimated Time**: 2 hours
**Dependencies**: WL-RCT-002

**Objective**: Create Empty component for no-data states

**Steps**:

1. Define Empty types

   ```typescript
   interface EmptyProps {
     description?: React.ReactNode;
     image?: React.ReactNode;
     imageStyle?: React.CSSProperties;
   }
   ```

2. Implement Empty component
   - Default empty illustration
   - Custom images
   - Descriptive text
   - Call-to-action buttons

3. Create Empty stories
   - Default empty state
   - Custom description
   - Custom image
   - With action buttons

**Acceptance Criteria**:

- ✓ Default illustration displays
- ✓ Custom images render correctly
- ✓ Description text is accessible
- ✓ Actions are properly aligned

```

## Phase 6: Feedback Components (Week 6)

### Task 6.1: Modal Component

```

**Task ID**: WL-RCT-024
**Priority**: P1
**Estimated Time**: 8 hours
**Dependencies**: @web-loom/ui-core, @web-loom/ui-patterns

**Objective**: Create Modal component with accessibility and animations

**Steps**:

1. Integrate with ui-core modal behaviors

   ```typescript
   import { useModal, useFocusTrap, useScrollLock } from '@web-loom/ui-core/modal';
   ```

2. Define Modal types

   ```typescript
   interface ModalProps {
     open?: boolean;
     title?: React.ReactNode;
     closable?: boolean;
     onOk?: (e: React.MouseEvent) => void;
     onCancel?: (e: React.MouseEvent) => void;
     width?: string | number;
     centered?: boolean;
     keyboard?: boolean;
     maskClosable?: boolean;
     confirmLoading?: boolean;
     destroyOnClose?: boolean;
   }
   ```

3. Implement Modal component
   - Portal rendering
   - Focus trap
   - Scroll lock
   - ESC key handling
   - Backdrop click handling

4. Create specialized modals
   - Modal.confirm
   - Modal.info
   - Modal.success
   - Modal.error
   - Modal.warning

5. Add animations
   - Fade in/out
   - Scale entrance
   - Backdrop animations

6. Add accessibility
   - Focus management
   - ARIA dialog pattern
   - Screen reader announcements

7. Create Modal stories
   - Basic modal
   - Confirmation modals
   - Different sizes
   - Nested modals
   - Loading states

**Acceptance Criteria**:

- ✓ Focus traps inside modal
- ✓ ESC key closes modal
- ✓ Backdrop click behavior works
- ✓ Body scroll is locked
- ✓ Animations are smooth
- ✓ ARIA attributes are correct

```

### Task 6.2: Message Component

```

**Task ID**: WL-RCT-025
**Priority**: P1
**Estimated Time**: 5 hours
**Dependencies**: @web-loom/ui-core

**Objective**: Create Message component for global notifications

**Steps**:

1. Define Message types

   ```typescript
   interface MessageConfig {
     content: React.ReactNode;
     duration?: number;
     key?: string | number;
     className?: string;
     style?: React.CSSProperties;
   }

   interface MessageApi {
     info: (config: MessageConfig) => void;
     success: (config: MessageConfig) => void;
     error: (config: MessageConfig) => void;
     warning: (config: MessageConfig) => void;
     loading: (config: MessageConfig) => void;
     destroy: (key?: string | number) => void;
   }
   ```

2. Implement Message system
   - Global message container
   - Imperative API (message.success())
   - Auto-dismiss functionality
   - Stack management

3. Add animations
   - Slide down entrance
   - Fade out exit
   - Stack rearrangement

4. Add accessibility
   - ARIA live regions
   - Screen reader announcements
   - Focus handling

5. Create Message stories
   - Different types
   - Custom durations
   - Loading states
   - Multiple messages

**Acceptance Criteria**:

- ✓ Messages appear globally
- ✓ Auto-dismiss works correctly
- ✓ Stack manages multiple messages
- ✓ Imperative API functions work
- ✓ Accessible to screen readers

```

### Task 6.3: Notification Component

```

**Task ID**: WL-RCT-026
**Priority**: P1
**Estimated Time**: 6 hours
**Dependencies**: @web-loom/ui-core

**Objective**: Create Notification component for detailed alerts

**Steps**:

1. Define Notification types

   ```typescript
   interface NotificationConfig {
     message: React.ReactNode;
     description?: React.ReactNode;
     icon?: React.ReactNode;
     placement?: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
     duration?: number;
     closeIcon?: React.ReactNode;
     key?: string;
     onClick?: () => void;
     onClose?: () => void;
   }
   ```

2. Implement Notification system
   - Positioned containers (4 corners)
   - Rich content support
   - Action buttons
   - Manual dismiss

3. Add animations
   - Slide in from edge
   - Fade out on dismiss
   - Position-specific entrances

4. Create Notification stories
   - Different placements
   - With actions
   - Rich content
   - Auto-dismiss vs manual

**Acceptance Criteria**:

- ✓ Appears in correct position
- ✓ Rich content renders properly
- ✓ Actions work correctly
- ✓ Manual close functions
- ✓ Multiple notifications stack

```

### Task 6.4: Spin Component

```

**Task ID**: WL-RCT-027
**Priority**: P1
**Estimated Time**: 3 hours
**Dependencies**: WL-RCT-002

**Objective**: Create Spin component for loading states

**Steps**:

1. Define Spin types

   ```typescript
   interface SpinProps {
     spinning?: boolean;
     size?: 'small' | 'default' | 'large';
     tip?: React.ReactNode;
     delay?: number;
     indicator?: React.ReactNode;
     wrapperClassName?: string;
   }
   ```

2. Implement Spin component
   - Overlay spinning
   - Inline spinning
   - Custom indicators
   - Delay before showing

3. Add animations
   - Smooth rotation
   - Fade in/out
   - Size transitions

4. Create Spin stories
   - Overlay spinning
   - Inline spinning
   - Different sizes
   - Custom indicators
   - With tips

**Acceptance Criteria**:

- ✓ Overlay covers content correctly
- ✓ Delay prevents flash of spinner
- ✓ Custom indicators work
- ✓ Accessible to screen readers

```

### Task 6.5: Progress Component

```

**Task ID**: WL-RCT-028
**Priority**: P1
**Estimated Time**: 4 hours
**Dependencies**: WL-RCT-002

**Objective**: Create Progress component for task completion

**Steps**:

1. Define Progress types

   ```typescript
   interface ProgressProps {
     type?: 'line' | 'circle' | 'dashboard';
     percent?: number;
     showInfo?: boolean;
     status?: 'success' | 'exception' | 'active' | 'normal';
     strokeLinecap?: 'round' | 'butt' | 'square';
     strokeColor?: string | { from: string; to: string; direction: string };
     trailColor?: string;
     size?: 'default' | 'small' | [number, number];
   }
   ```

2. Implement Progress component
   - Line progress
   - Circle progress
   - Dashboard progress
   - Gradient support

3. Add animations
   - Smooth progress changes
   - Color transitions
   - Success animations

4. Create Progress stories
   - Different types
   - Various statuses
   - Gradient colors
   - Animated progress

**Acceptance Criteria**:

- ✓ Progress animates smoothly
- ✓ Circle progress calculates correctly
- ✓ Gradients render properly
- ✓ Status colors apply correctly

```

## Phase 7: Advanced Components (Week 7)

### Task 7.1: DatePicker Component

```

**Task ID**: WL-RCT-029
**Priority**: P1
**Estimated Time**: 10 hours
**Dependencies**: @web-loom/ui-core, date library (dayjs/date-fns)

**Objective**: Create comprehensive DatePicker with ranges and time

**Steps**:

1. Choose and integrate date library

   ```typescript
   import dayjs from 'dayjs';
   // or
   import { format, parse, isValid } from 'date-fns';
   ```

2. Define DatePicker types

   ```typescript
   interface DatePickerProps {
     value?: Dayjs;
     defaultValue?: Dayjs;
     format?: string;
     disabled?: boolean;
     disabledDate?: (currentDate: Dayjs) => boolean;
     showTime?: boolean | TimePickerProps;
     picker?: 'date' | 'week' | 'month' | 'quarter' | 'year';
     showToday?: boolean;
     locale?: Locale;
   }
   ```

3. Implement DatePicker components
   - DatePicker (single date)
   - DatePicker.RangePicker
   - DatePicker.TimePicker
   - DatePicker.MonthPicker
   - DatePicker.WeekPicker

4. Add accessibility
   - Keyboard navigation
   - ARIA date picker pattern
   - Screen reader support

5. Create DatePicker stories
   - Basic date selection
   - Date ranges
   - With time
   - Different formats
   - Disabled dates
   - Localization

**Acceptance Criteria**:

- ✓ Date selection works accurately
- ✓ Range picker validates ranges
- ✓ Time picker integrates properly
- ✓ Keyboard navigation works
- ✓ Localization applies correctly

```

### Task 7.2: Upload Component

```

**Task ID**: WL-RCT-030
**Priority**: P1
**Estimated Time**: 8 hours
**Dependencies**: @web-loom/ui-core

**Objective**: Create Upload component with drag-drop and progress

**Steps**:

1. Define Upload types

   ```typescript
   interface UploadProps {
     action?: string;
     method?: 'POST' | 'PUT' | 'PATCH';
     directory?: boolean;
     data?: object | ((file: UploadFile) => object);
     fileList?: UploadFile[];
     headers?: object;
     listType?: 'text' | 'picture' | 'picture-card';
     multiple?: boolean;
     name?: string;
     showUploadList?: boolean | ShowUploadListInterface;
     beforeUpload?: (file: UploadFile, FileList: UploadFile[]) => boolean | Promise<File>;
     onChange?: (info: UploadChangeParam) => void;
     onPreview?: (file: UploadFile) => void;
     onRemove?: (file: UploadFile) => boolean | Promise<boolean>;
   }
   ```

2. Implement Upload component
   - File selection
   - Drag and drop
   - Progress tracking
   - File list management

3. Create upload variants
   - Button upload
   - Drag upload area
   - Picture upload
   - Avatar upload

4. Add accessibility
   - Keyboard file selection
   - Screen reader announcements
   - Progress announcements

5. Create Upload stories
   - Basic upload
   - Drag and drop
   - Picture upload
   - Multiple files
   - Custom upload

**Acceptance Criteria**:

- ✓ File selection works
- ✓ Drag and drop functions
- ✓ Progress displays correctly
- ✓ File removal works
- ✓ Custom upload logic executes

```

### Task 7.3: Slider Component

```

**Task ID**: WL-RCT-031
**Priority**: P1
**Estimated Time**: 6 hours
**Dependencies**: @web-loom/ui-core

**Objective**: Create Slider component for numeric input

**Steps**:

1. Define Slider types

   ```typescript
   interface SliderProps {
     min?: number;
     max?: number;
     step?: number;
     value?: number | [number, number];
     defaultValue?: number | [number, number];
     disabled?: boolean;
     marks?: Record<number, React.ReactNode>;
     included?: boolean;
     vertical?: boolean;
     range?: boolean;
     tooltip?: { formatter?: (value: number) => React.ReactNode };
   }
   ```

2. Implement Slider component
   - Single value slider
   - Range slider
   - Vertical orientation
   - Mark indicators
   - Tooltip display

3. Add accessibility
   - ARIA slider pattern
   - Keyboard control
   - Value announcements

4. Create Slider stories
   - Basic slider
   - Range slider
   - With marks
   - Vertical slider
   - Disabled states

**Acceptance Criteria**:

- ✓ Value changes on drag
- ✓ Keyboard control works
- ✓ Range handles don't cross
- ✓ Marks align correctly
- ✓ Tooltips show values

```

### Task 7.4: TreeSelect Component

```

**Task ID**: WL-RCT-032
**Priority**: P2
**Estimated Time**: 8 hours
**Dependencies**: @web-loom/ui-core, Tree component logic

**Objective**: Create TreeSelect component for hierarchical selection

**Steps**:

1. Define TreeSelect types

   ```typescript
   interface TreeSelectProps {
     treeData?: TreeNode[];
     value?: string | string[];
     multiple?: boolean;
     checkable?: boolean;
     showSearch?: boolean;
     treeCheckStrictly?: boolean;
     treeDefaultExpandAll?: boolean;
     filterTreeNode?: (inputValue: string, treeNode: TreeNode) => boolean;
   }
   ```

2. Implement TreeSelect component
   - Tree structure display
   - Single and multiple selection
   - Search/filter functionality
   - Checkable nodes

3. Add accessibility
   - Tree navigation
   - Selection announcements
   - Keyboard control

4. Create TreeSelect stories
   - Basic tree select
   - Multiple selection
   - Checkable trees
   - Search functionality

**Acceptance Criteria**:

- ✓ Tree structure renders correctly
- ✓ Selection works properly
- ✓ Search filters nodes
- ✓ Checkbox logic is correct

```

### Task 7.5: Transfer Component

```

**Task ID**: WL-RCT-033
**Priority**: P2
**Estimated Time**: 6 hours
**Dependencies**: WL-RCT-002

**Objective**: Create Transfer component for moving items between lists

**Steps**:

1. Define Transfer types

   ```typescript
   interface TransferProps {
     dataSource: TransferItem[];
     targetKeys?: string[];
     selectedKeys?: string[];
     render?: (item: TransferItem) => React.ReactNode;
     titles?: string[];
     operations?: string[];
     showSearch?: boolean;
     filterOption?: (inputValue: string, item: TransferItem) => boolean;
     locale?: TransferLocale;
   }
   ```

2. Implement Transfer component
   - Two-panel layout
   - Item selection
   - Transfer operations
   - Search functionality

3. Add accessibility
   - List navigation
   - Transfer announcements
   - Button labels

4. Create Transfer stories
   - Basic transfer
   - With search
   - Custom render
   - Different operations

**Acceptance Criteria**:

- ✓ Items transfer between lists
- ✓ Selection works correctly
- ✓ Search filters items
- ✓ Custom rendering works

```

## Phase 8: Polish & Documentation (Week 8)

### Task 8.1: Accessibility Audit
```

**Task ID**: WL-RCT-050
**Priority**: P0
**Estimated Time**: 8 hours

**Objective**: Complete accessibility audit of all components

**Steps**:

1. Run automated accessibility tests
   - axe-core integration
   - Lighthouse CI
2. Manual keyboard testing
   - Tab through all components
   - Test arrow key navigation
   - Test Escape key dismissal
3. Screen reader testing
   - NVDA with Firefox
   - VoiceOver with Safari
   - JAWS with Edge
4. Color contrast testing
   - Test all color combinations
   - Ensure WCAG 2.1 AA compliance
5. Fix identified issues
   - Update ARIA attributes
   - Improve focus management
   - Add missing labels

```

### Task 8.2: Performance Optimization
```

**Task ID**: WL-RCT-051
**Priority**: P0
**Estimated Time**: 6 hours

**Steps**:

1. Bundle size analysis
   - Run bundle analyzer
   - Identify large dependencies
2. Implement code splitting
   - Lazy load heavy components
   - Dynamic imports for icons
3. Optimize renders
   - Add React.memo where needed
   - Use useCallback for handlers
   - Implement virtualization for lists
4. CSS optimization
   - Purge unused CSS
   - Minify CSS output
   - Optimize CSS custom properties

```

### Task 8.3: Documentation Completion
```

**Task ID**: WL-RCT-052
**Priority**: P0
**Estimated Time**: 8 hours

**Steps**:

1. Complete Storybook stories
   - Add interactive examples
   - Add usage guidelines
   - Add API documentation
2. Create component READMEs
   - Installation instructions
   - Basic usage examples
   - API reference
   - Migration guides
3. Set up TypeDoc
   - Generate API documentation
   - Link to Storybook
   - Publish to GitHub Pages

```

## Weekly Implementation Checklist

### Week 1 Checklist:
- [ ] Build system configured (tsup)
- [ ] ThemeProvider implemented
- [ ] Button component with variants
- [ ] Space component
- [ ] CSS variables system
- [ ] Storybook setup for foundation

### Week 2 Checklist:
- [ ] Grid system (Row/Col)
- [ ] Layout component with subcomponents
- [ ] Card component
- [ ] Divider component
- [ ] All components tested with Vitest

### Week 3 Checklist:
- [ ] Menu component with keyboard nav
- [ ] Tabs component
- [ ] Breadcrumb component
- [ ] Integration tests for navigation

### Week 4 Checklist:
- [ ] Form with validation
- [ ] Input components (text, password, search)
- [ ] Select dropdown
- [ ] Checkbox & Radio components
- [ ] Form submission tests

## Testing Requirements Per Component

Each component task should include:
1. **Render tests**: Component renders with default props
2. **Prop tests**: All props work as expected
3. **Event tests**: onClick, onChange handlers fire
4. **Accessibility tests**: ARIA attributes present
5. **Theme tests**: Component respects theme
6. **Snapshot tests**: Visual regression protection

## Code Review Checklist

For each component PR, verify:
- [ ] TypeScript types are strict and complete
- [ ] CSS uses design tokens (no hardcoded values)
- [ ] Accessibility attributes are present
- [ ] Keyboard navigation works
- [ ] Focus states are visible
- [ ] No console errors/warnings
- [ ] Tests cover all use cases
- [ ] Storybook stories exist
- [ ] Bundle size impact is minimal
- [ ] Follows established patterns

This task breakdown provides clear, actionable steps that can be executed sequentially by an LLM or development team. Each task is scoped to 2-8 hours of work with clear dependencies and acceptance criteria.
```
