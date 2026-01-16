# TaskFlow - Project Management Platform PRD

## 📋 Executive Summary

**TaskFlow** is a demonstration project management platform designed to showcase Web Loom's MVVM architecture and plugin system capabilities. It serves as a comprehensive example of how to build scalable, framework-agnostic applications using Web Loom's core packages.

### Project Objectives

- **Primary**: Demonstrate Web Loom's MVVM + Plugin architecture in a real-world application
- **Secondary**: Create a functional project management tool suitable for small teams
- **Technical**: Showcase framework-agnostic business logic and plugin extensibility

---

## 🎯 Requirements

### Functional Requirements

#### FR-001: Project Management

- **FR-001.1**: Users can create, read, update, and delete projects
- **FR-001.2**: Projects have properties: name, description, color theme, creation date
- **FR-001.3**: Users can invite team members to projects
- **FR-001.4**: Projects display task statistics (total, completed, in progress)

#### FR-002: Task Management

- **FR-002.1**: Users can create tasks with: title, description, status, priority, assignee, due date
- **FR-002.2**: Tasks can be moved between statuses via drag-and-drop
- **FR-002.3**: Tasks support rich text descriptions using typography-core
- **FR-002.4**: Tasks can be filtered by: status, assignee, priority, due date
- **FR-002.5**: Tasks can be searched by title and description

#### FR-003: User Management

- **FR-003.1**: User authentication (login/logout)
- **FR-003.2**: User profiles with avatar and display name
- **FR-003.3**: Team member management within projects

#### FR-004: Plugin System

- **FR-004.1**: Support for pluggable views (Kanban, List, Calendar)
- **FR-004.2**: Plugin marketplace UI for discovering/enabling plugins
- **FR-004.3**: Runtime plugin loading and unloading
- **FR-004.4**: Plugin configuration persistence
- **FR-004.5**: Ship a view-model backed `Flow Metrics` plugin that surfaces status breakdowns and overdue alerts through the same plugin registry that delivers widgets and menu hooks, proving the MVVM + plugin contract works end-to-end.

#### FR-005: Real-time Features

- **FR-005.1**: Live task updates across all connected clients
- **FR-005.2**: Presence indicators showing active users
- **FR-005.3**: Real-time commenting system

#### FR-006: Personal Todo Workspace

- **FR-006.1**: Surface a standalone `Todos` workspace from the top navigation so the personal checklist is always available, even when users are browsing other projects or task boards.
- **FR-006.2**: Allow users to create, update, complete, and delete todos through MVVM-powered forms/commands; the payload includes `title`, optional `details`, optional `dueDate`, and a completion flag while the backend defaults unset due dates to today.
- **FR-006.3**: Render todos grouped by due date, pin today’s groups at the top, and provide a “Hide past days” toggle so stale reminders can be collapsed without losing history.

### Non-Functional Requirements

#### NFR-001: Performance

- **NFR-001.1**: Initial page load under 3 seconds
- **NFR-001.2**: Task operations respond within 200ms
- **NFR-001.3**: Support for 100+ tasks per project without performance degradation

#### NFR-002: Usability

- **NFR-002.1**: Intuitive drag-and-drop interface
- **NFR-002.2**: Responsive design for desktop and mobile
- **NFR-002.3**: Keyboard shortcuts for power users
- **NFR-002.4**: Dark/light theme switching
- **NFR-002.5**: Dashboard panels (especially the plugin registry) must consume design-token-driven styling so both day/night modes render without broken gradients or unreadable cards.

#### NFR-003: Architecture

- **NFR-003.1**: Framework-agnostic business logic (100% reusable across React/Vue/Angular)
- **NFR-003.2**: Plugin-based architecture for extensibility
- **NFR-003.3**: Offline-first with optimistic updates
- **NFR-003.4**: Type-safe throughout (TypeScript)

---

## 🏗️ System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────┐
│                 TaskFlow UI                 │
│              (React + Web Loom)             │
├─────────────────────────────────────────────┤
│                   Plugins                   │
│    ┌─────────┐ ┌─────────┐ ┌─────────┐     │
│    │ Kanban  │ │  List   │ │Calendar │     │
│    │  View   │ │  View   │ │  View   │     │
│    └─────────┘ └─────────┘ └─────────┘     │
├─────────────────────────────────────────────┤
│               Web Loom Core                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│  │   MVVM   │ │  Plugin  │ │  Store   │    │
│  │   Core   │ │   Core   │ │   Core   │    │
│  └──────────┘ └──────────┘ └──────────┘    │
├─────────────────────────────────────────────┤
│                TaskFlow API                 │
│             (Node.js + Sequelize)           │
└─────────────────────────────────────────────┘
```

### Domain Architecture (DDD)

#### Domains

1. **Project Management Domain**
   - Entities: Project, ProjectMember
   - Value Objects: ProjectSettings, ProjectStats
   - Services: ProjectService, ProjectMemberService

2. **Task Management Domain**
   - Entities: Task, Comment, Attachment
   - Value Objects: TaskStatus, Priority, TaskFilters
   - Services: TaskService, CommentService

3. **User Domain**
   - Entities: User, UserProfile
   - Value Objects: UserPreferences
   - Services: AuthService, UserService

4. **Plugin Domain**
   - Entities: Plugin, PluginConfig
   - Value Objects: PluginManifest
   - Services: PluginRegistryService
   - Demonstration Plugin: The `Flow Metrics` plugin wires the MVVM `MetricsViewModel` (which subscribes to `TaskStore` + `CachingTaskRepository`) to compute status breakdowns, overdue alerts, and focus insights; the widget is registered like any other plugin contribution so the dashboard can render it inside the plugin grid to prove the architecture.

5. **Todo Domain**
   - Entities: Todo (title, details, completed flag, due date, owner)
   - Value Objects: TodoDueDate, TodoVisibility (today vs. future)
   - Services: TodoService (scopes lists/updates to the authenticated user, defaults missing due dates to the current day, and exposes CRUD operations used by the UI)

### Technical Stack

#### Frontend (task-flow-ui)

- **Framework**: React 18 with TypeScript
- **Architecture**: MVVM + DDD (using Web Loom packages)
- **State Management**: Web Loom store-core + RxJS
- **UI Components**: Custom components using Web Loom ui-core
- **Routing**: Web Loom router-core
- **Forms**: Web Loom forms-core with validation
- **Styling**: CSS Modules + Web Loom design-core

#### Backend (task-flow-api)

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: SQLite (for demo) with Sequelize ORM
- **Authentication**: JWT tokens
- **Real-time**: WebSockets
- **File Upload**: Multer for attachments

---

## 🎨 User Interface Design

### Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│                        Header                               │
│  TaskFlow Logo │ Project Selector │ User Menu │ Theme Toggle│
├─────────────────────────────────────────────────────────────┤
│ Sidebar        │              Main Content Area             │
│ ┌─────────────┐│ ┌─────────────────────────────────────────┐│
│ │ Projects    ││ │          Current View                   ││
│ │ - Project A ││ │  ┌─────────┐ ┌─────────┐ ┌─────────┐   ││
│ │ - Project B ││ │  │   To    │ │   In    │ │  Done   │   ││
│ │             ││ │  │   Do    │ │Progress │ │         │   ││
│ │ Team        ││ │  │ ┌─────┐ │ │ ┌─────┐ │ │ ┌─────┐ │   ││
│ │ - Member 1  ││ │  │ │Task │ │ │ │Task │ │ │ │Task │ │   ││
│ │ - Member 2  ││ │  │ │  A  │ │ │ │  B  │ │ │ │  C  │ │   ││
│ │             ││ │  │ └─────┘ │ │ └─────┘ │ │ └─────┘ │   ││
│ │ Views       ││ │  └─────────┘ └─────────┘ └─────────┘   ││
│ │ ○ Kanban    ││ │                                         ││
│ │ ○ List      ││ │                                         ││
│ │ ○ Calendar  ││ │                                         ││
│ └─────────────┘│ └─────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────┤
│                       Footer                                │
│               © 2026 TaskFlow Demo                          │
└─────────────────────────────────────────────────────────────┘
```

### Key UI Components

- **ProjectSelector**: Dropdown to switch between projects
- **TaskCard**: Draggable card displaying task information
- **TaskModal**: Detailed task view/edit form
- **PluginTabs**: Dynamic tabs for different view plugins
- **FilterPanel**: Collapsible panel for task filtering
- **CommentThread**: Real-time comment system

### Plugin Widget Surface

- **Plugin registry cards** now coexist with a widget preview grid inside the dashboard panel so plugin contributions can render actual UI instead of just metadata.
- **Flow Metrics plugin** demonstrates how MVVM-powered data (via `MetricsViewModel` observing `TaskStore`/`CachingTaskRepository`) feeds widget components registered through `PluginManifest.widgets`. The widget surface renders these components inside the grid so the host UI can show live status breakdowns and overdue alerts supplied by the plugin without knowing any domain details.
- **Widgets stay decoupled**: each plugin exports a manifest + view model, the host reads `widget.component` from the registry, and the dashboard renders it alongside the metadata cards.
- **Grid-first layout & theming**: The dashboard widget area now uses CSS Grid (not stacked flex boxes) so plugin cards line up evenly, and every wrapper relies on Web Loom design tokens (`--panel-surface`, `--panel-border`, etc.) to keep night mode styling intact instead of hard-coded gradients.
- **Dense card layout**: Plugin registry cards keep padding tight (≈1rem), remove excess min-height, and stack via responsive grid columns so the white space between cards shrinks and the dashboard feels compact while remaining readable.

### Todo Workspace UI

- The header navigation gains a _Todos_ entry that opens a dedicated workspace presenting the personal checklist independently from projects and boards.
- The todo panel splits the stream by due date, keeps today’s buckets pinned inside the main content area, and surfaces a “Hide past days” toggle plus creation controls that default unset due dates to today.
- A shared MVVM TodoViewModel (via `@repo/view-models/TodoViewModel`) wires the UI to the `/todos` endpoints so creation, updates, completion, and deletion stay synchronized with the API while exposing loading/error observables for buttons and badges.

---

## 🔧 Implementation Tasks

### Phase 1: Foundation & Core Features

#### Task 1.1: Project Setup

- **T1.1.1**: Create `apps/task-flow-api` directory structure, I have copied over existing api, you can remove the existing folders and files
- **T1.1.2**: Set up Express.js server with TypeScript
- **T1.1.3**: Configure Sequelize with SQLite database
- **T1.1.4**: Create `apps/task-flow-ui` directory structure, i have copied over existing mvvm-react app, you can remove the existing folders and files.
- **T1.1.5**: Set up React app with Web Loom integration
- **T1.1.6**: Configure TypeScript, ESLint, and Prettier

#### Task 1.2: Data Layer (API)

- **T1.2.1**: Design database schema (Projects, Tasks, Users, Comments)
- **T1.2.2**: Create Sequelize models and migrations
- **T1.2.3**: Implement API routes for CRUD operations
- **T1.2.4**: Add JWT authentication middleware
- **T1.2.5**: Implement error handling and validation

#### Task 1.3: Domain Models (UI)

- **T1.3.1**: Create domain entities (Project, Task, User)
- **T1.3.2**: Implement value objects (TaskStatus, Priority)
- **T1.3.3**: Create repository interfaces
- **T1.3.4**: Implement API client services
- **T1.3.5**: Set up RxJS observables for reactive data

#### Task 1.4: Core ViewModels

- **T1.4.1**: Implement `ProjectListViewModel`
- **T1.4.2**: Implement `ProjectDetailViewModel`
- **T1.4.3**: Implement `TaskBoardViewModel`
- **T1.4.4**: Implement `TaskDetailViewModel`
- **T1.4.5**: Add state management with store-core

#### Task 1.5: Basic UI Components

- **T1.5.1**: Create project list/grid component
- **T1.5.2**: Create task card component
- **T1.5.3**: Create task form component with forms-core
- **T1.5.4**: Implement basic routing with router-core
- **T1.5.5**: Add loading and error states

#### Task 1.6: Project CRUD Operations (API + UI)

- **T1.6.1**: Verify that `apps/task-flow-api` exposes a full project CRUD surface (POST/PUT/DELETE) with parameter validation (name, description, color, status) so clients can reliably persist new workspaces.
- **T1.6.2**: Extend the shared MVVM repositories and stores so `ProjectListViewModel` can coordinate creation, optimistic state updates, and error handling via observables (e.g., `projectFormError$`, `isProjectFormSubmitting$`) when calling the new API surface.
- **T1.6.3**: Surface a toggleable `ProjectForm` in the project explorer UI that uses the MVVM view model to submit `ProjectFormValues` (name, description, color, status), reuse the existing Web Loom form styling, and display server and client validation feedback before refreshing the project list.

#### Task 1.7: Task CRUD Operations (API + UI)

- **T1.7.1**: Deliver an end-to-end task CRUD endpoint surface in `apps/task-flow-api` so projects can list, create, read, update, and delete tasks. At a minimum the API surfaces must include:
  - `GET    /api/projects/:id/tasks` — list tasks scoped to a project.
  - `POST   /api/projects/:id/tasks` — create a new task for a project.
  - `GET    /api/tasks/:id` — hydrate task details for editing flows.
  - `PUT    /api/tasks/:id` — persist task updates (status, description, priority, due date, assignee).
  - `DELETE /api/tasks/:id` — remove a task and its attachments/metadata.
- **T1.7.2**: Extend the shared MVVM task stack (`TaskStore`, repositories, `TaskBoardViewModel`, etc.) so the TaskBoard UI can invoke the new endpoints, keep observable task lists in sync, and expose error/loading state for the edit/delete flows without duplicating business logic across components.
- **T1.7.3**: Update the TaskBoard UI to surface editing/deletion affordances (e.g., select a card to open an `Edit task` form, show a delete action, and keep the creation form alongside the MVVM-powered flows) while honoring the current MVVM wiring (commands, observables, store updates).

#### Task 1.8: Todo Workspace (API + UI)

- **T1.8.1**: Build the `/todos` CRUD surface on `apps/task-flow-api` so every request is scoped to the authenticated user, default the due date to today when omitted, and return the user’s list ordered by due date.
  - `GET    /todos` — fetch user-specific todos, includes owner metadata and sorts ascending on dueDate.
  - `POST   /todos` — accept `{ title, details?, dueDate? }`, set missing due dates to the current day, respond with the created todo and a 201 status.
  - `PUT    /todos/:id` — update title, details, dueDate, or completion flag for an owned todo.
  - `DELETE /todos/:id` — delete the todo and return 204.
- **T1.8.2**: Extend `packages/models` with `TodoModel`/`todoConfig` and `packages/view-models` with `TodoViewModel`, wiring `taskFlowAuthFetcher` so the MVVM commands respect the stored JWT token when calling the new API.
- **T1.8.3**: Add a `Todos` header nav item that renders a `TodoPanel` on its own route; the panel should group items by day, keep today’s buckets at the top, and expose controls for create/update/delete plus a “Hide past days” toggle.
- **T1.8.4**: Polish the new UI to show todays first, present friendly badges (completed vs. open), include a lightweight creation form, and keep the layout consistent with the design system tokens used elsewhere in the app.

### Phase 2: Plugin System

#### Task 2.1: Plugin Architecture

- **T2.1.1**: Define plugin interfaces and types
- **T2.1.2**: Implement plugin registry service
- **T2.1.3**: Create plugin loading mechanism
- **T2.1.4**: Add plugin configuration persistence
- **T2.1.5**: Implement plugin lifecycle management

#### Task 2.2: View Plugins

- **T2.2.1**: Create Kanban view plugin (default)
- **T2.2.2**: Create List view plugin
- **T2.2.3**: Create Calendar view plugin
- **T2.2.4**: Implement view switching UI
- **T2.2.5**: Add drag-and-drop for Kanban view

#### Task 2.3: Feature Plugins

- **T2.3.1**: Create task filtering plugin
- **T2.3.2**: Create task search plugin
- **T2.3.3**: Create export plugin (CSV, PDF)
- **T2.3.4**: Create theme switcher plugin
- **T2.3.5**: Create plugin marketplace UI

### Phase 3: Advanced Features

#### Task 3.1: Real-time Features

- **T3.1.1**: Set up WebSocket server
- **T3.1.2**: Implement real-time task updates
- **T3.1.3**: Add presence indicators
- **T3.1.4**: Create real-time comment system
- **T3.1.5**: Handle connection states and reconnection

#### Task 3.2: Project Status Persistence

- **T3.2.1**: Ensure the project PUT endpoint accepts status transitions and returns the fully hydrated project (with tasks) after persisting the new state
- **T3.2.2**: Update the `ProjectListViewModel`/detail flows to call the API when cycling a project’s status, keep the UI optimistic, and surface errors when persistence fails
- **T3.2.3**: Keep project/task surfaces in sync with the latest status (refresh caches after persistence and refresh task/project counts in the UI)

#### Task 3.3: Design System Integration & Task Flow Theme

**Objective**: Apply the Web Loom design system (`packages/design-core`) to the task-flow-ui application and create a cohesive, professional theme specifically tailored for project management workflows.

**Context**:
This is a public demo that showcases the integration between:

- **UI**: `apps/task-flow-ui` (React + Vite frontend)
- **API**: `apps/task-flow-api` (Express backend with CRUD routes)

The task involves implementing the design system setup pattern established in `apps/mvvm-react-integrated` to create a polished, branded experience for the task flow project.

**Target Theme**: Professional Project Management Dashboard

- **Primary Color Palette**: Blue-based productivity theme (#1E40AF primary, #64748B secondary)
- **Style**: Modern flat design with subtle shadows and clean typography
- **Focus**: Task-oriented, productivity-focused visual hierarchy

**Technical Requirements**:

- **T3.3.1**: Install and configure @web-loom/design-core dependency
  - Add `@web-loom/design-core` to task-flow-ui package.json dependencies
  - Ensure proper TypeScript support and CSS import capabilities
  - Set up build system integration for design token CSS files

- **T3.3.2**: Create task-flow specific design token system
  - Create `src/styles/tokens.css` importing base design-core tokens:
    - Colors, spacing, typography, shadows, radii, borders, transitions
  - Define semantic task-flow tokens:
    - Project status colors (active, completed, on-hold, overdue)
    - Task priority indicators (high, medium, low, critical)
    - Board/card system colors and spacing
    - Dashboard component tokens

- **T3.3.3**: Implement task-flow theme CSS custom properties
  - **Project Cards**: Define card styling with subtle shadows, hover states
  - **Task Items**: Create priority-based visual indicators and status badges
  - **Dashboard Layout**: Header, sidebar, main content area tokens
  - **Interactive Elements**: Button variants (primary, secondary, danger, success)
  - **Data Visualization**: Chart colors, progress bars, status indicators

- **T3.3.4**: Apply design system to existing components
  - Update main application styles (index.css, App.css)
  - Style core components: ProjectList, TaskList, TaskCard, ProjectCard
  - Implement consistent spacing, typography, and color usage
  - Add hover states, focus rings, and interaction feedback

- **T3.3.5**: Create responsive task flow layout system
  - Mobile-first responsive breakpoints using design-core tokens
  - Dashboard grid system for project overview
  - Kanban board responsive behavior
  - Mobile task creation and editing interfaces

- **T3.3.6**: Implement theme-aware component variants
  - Create styled component variants for task status (TODO, IN_PROGRESS, DONE)
  - Priority-based visual styling (background colors, border indicators)
  - Project health indicators (on-track, at-risk, overdue)
  - Team member avatars and presence indicators

**Design Theme Specifications**:

```css
/* Task Flow Custom Theme - Based on Design Core Tokens */
:root {
  /* Project Status Colors */
  --project-status-active: var(--colors-primary);
  --project-status-completed: var(--colors-success);
  --project-status-onhold: var(--colors-warning);
  --project-status-overdue: var(--colors-danger);

  /* Task Priority Colors */
  --task-priority-critical: #dc2626;
  --task-priority-high: var(--colors-danger);
  --task-priority-medium: var(--colors-warning);
  --task-priority-low: var(--colors-secondary);

  /* Task Flow Specific Components */
  --taskcard-bg: var(--colors-background-surface);
  --taskcard-border: var(--colors-border-default);
  --taskcard-shadow: var(--shadows-sm);
  --taskcard-hover-shadow: var(--shadows-md);

  /* Dashboard Layout */
  --dashboard-header-bg: var(--colors-primary);
  --dashboard-sidebar-bg: var(--colors-background-elevated);
  --dashboard-content-bg: var(--colors-background-page);
}
```

**Implementation Pattern** (following `apps/mvvm-react-integrated`):

1. Import design-core CSS tokens in main CSS files
2. Create semantic token mappings for task-flow specific use cases
3. Apply tokens consistently across React components
4. Use CSS custom properties for dynamic theming support
5. Implement responsive behavior using design-core breakpoints

**Acceptance Criteria**:

- [ ] Design-core package successfully integrated and building
- [ ] Custom task-flow tokens defined and documented
- [ ] All major UI components styled consistently using design tokens
- [ ] Responsive layout works across mobile, tablet, and desktop
- [ ] Task status, priority, and project health visually distinct
- [ ] Theme follows modern flat design principles with subtle depth
- [ ] All interactive elements have proper hover/focus states
- [ ] Components maintain accessibility standards (contrast, focus rings)

**Files to Create/Modify**:

- `apps/task-flow-ui/package.json` - Add design-core dependency
- `apps/task-flow-ui/src/styles/tokens.css` - Task flow design tokens
- `apps/task-flow-ui/src/styles/theme.css` - Task flow theme implementation
- `apps/task-flow-ui/src/index.css` - Global styles with design system integration
- Component CSS files - Apply design tokens to existing components

#### Task 3.4: Enhanced UX

- **T3.2.1**: Add keyboard shortcuts
- **T3.2.2**: Implement optimistic updates
- **T3.2.3**: Add offline support with storage-core
- **T3.2.4**: Create responsive mobile layout
- **T3.2.5**: Add animations and transitions

#### Task 3.4: File Management

- **T3.3.1**: Implement file upload API
- **T3.3.2**: Add task attachment support
- **T3.3.3**: Create file preview components
- **T3.3.4**: Implement drag-and-drop file upload
- **T3.3.5**: Add file type validation and size limits

#### Task 3.5: Collaboration & Comments

- **T3.5.1**: Add persistent comments to the API (list/create/update/delete) with author metadata
- **T3.5.2**: Create a comments ViewModel + repository wiring so UI components can stream threads per task
- **T3.5.3**: Surface threaded comments and quick-reply form inside the project detail drawer (MVVM-bound, `forms-core` validation)
- **T3.5.4**: Show comment counts/thumbnails on task cards and keep the drawer/list in sync with the selected task

#### Task 3.6: Profile Management

- **T3.6.1**: Create profile endpoints so authenticated users can read/update their display name, avatar, and preferences while preserving the existing password flow
- **T3.6.2**: Build a ProfileViewModel that keeps user data reactive, validates edits (`forms-core`), and centralizes avatar + preferences updates
- **T3.6.3**: Add a profile/settings panel in the shell that shows the current tokenized user, allows editing with save/cancel actions, and displays feedback without leaking password hashes
- **T3.6.4**: Persist profile edits to the store and refresh downstream components to keep the task/project surfaces in sync with the latest user metadata
### Phase 4: Polish & Documentation

#### Task 4.1: Testing

- **T4.1.1**: Write unit tests for ViewModels
- **T4.1.2**: Write integration tests for API
- **T4.1.3**: Add E2E tests with Playwright
- **T4.1.4**: Test plugin loading/unloading
- **T4.1.5**: Performance testing and optimization

#### Task 4.2: Documentation

- **T4.2.1**: Create comprehensive README
- **T4.2.2**: Document plugin development guide
- **T4.2.3**: Create API documentation
- **T4.2.4**: Write architecture decision records
- **T4.2.5**: Create demo video and screenshots

#### Task 4.3: Deployment

- **T4.3.1**: Create Docker configurations
- **T4.3.2**: Set up CI/CD pipeline
- **T4.3.3**: Configure production builds
- **T4.3.4**: Add environment-specific configurations
- **T4.3.5**: Deploy demo instance

---

## 📊 Web Loom Package Integration

### Package Utilization Matrix

| Package           | Usage                         | Implementation                                 |
| ----------------- | ----------------------------- | ---------------------------------------------- |
| `mvvm-core`       | Core MVVM implementation      | All ViewModels extend BaseViewModel            |
| `plugin-core`     | Plugin system                 | View plugins, feature plugins, plugin registry |
| `store-core`      | Global state management       | User preferences, current project, cache       |
| `query-core`      | Data fetching & caching       | API queries with optimistic updates            |
| `event-bus-core`  | Cross-component communication | Real-time updates, plugin communication        |
| `router-core`     | Navigation                    | Project/task routing, deep linking             |
| `forms-core`      | Form handling                 | Task creation/editing forms with validation    |
| `storage-core`    | Local storage                 | Offline task drafts, user preferences          |
| `i18n-core`       | Internationalization          | Multi-language support                         |
| `error-core`      | Error handling                | API error handling, user feedback              |
| `media-core`      | File handling                 | Task attachments, image uploads                |
| `design-core`     | Theming                       | Dark/light theme, design tokens                |
| `typography-core` | Rich text                     | Task descriptions, comments                    |

---

## 🎯 Success Metrics

### Technical Metrics

- **Code Reusability**: 90%+ of business logic is framework-agnostic
- **Plugin Extensibility**: 3+ functional plugins demonstrating system flexibility
- **Performance**: Sub-200ms task operations, 95th percentile
- **Test Coverage**: 80%+ for ViewModels and core business logic

### Demo Effectiveness

- **Comprehension**: Developers understand MVVM benefits within 5 minutes
- **Extensibility**: New view plugin can be added in under 30 minutes
- **Framework Agnostic**: Same ViewModel works in React/Vue demo
- **Real-world Relevance**: App feels production-ready, not just a toy

### User Experience

- **Usability**: Intuitive task management without documentation
- **Responsiveness**: Smooth drag-and-drop interactions
- **Visual Polish**: Professional appearance suitable for client demos
- **Feature Completeness**: Core project management workflows supported

---

## 🚀 Getting Started

### Prerequisites

- Node.js 23+
- npm (for monorepo management)
- Web Loom packages installed

### Quick Start

```bash
# Install dependencies
npm install

# Start API server
cd apps/task-flow-api
npm dev

# Start UI in another terminal
cd apps/task-flow-ui
npm dev

# Open http://localhost:3000
```

### Development Workflow

1. **API First**: Implement data layer and API endpoints
2. **Domain Models**: Create TypeScript models and services
3. **ViewModels**: Implement business logic in framework-agnostic ViewModels
4. **UI Components**: Build React components that consume ViewModels
5. **Plugins**: Add plugins to demonstrate extensibility
6. **Integration**: Connect all pieces with proper error handling and UX

---

## 📋 Appendices

### Appendix A: API Endpoints

```
GET    /api/projects              - List user's projects
POST   /api/projects              - Create new project
GET    /api/projects/:id          - Get project details
PUT    /api/projects/:id          - Update project
DELETE /api/projects/:id          - Delete project

GET    /api/projects/:id/tasks    - List project tasks
POST   /api/projects/:id/tasks    - Create new task
GET    /api/tasks/:id             - Get task details
PUT    /api/tasks/:id             - Update task
DELETE /api/tasks/:id             - Delete task

GET    /api/auth/profile          - Get current user
POST   /api/auth/login            - User login
POST   /api/auth/logout           - User logout
```

### Appendix B: Plugin Manifest Schema

```typescript
interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  type: 'view' | 'feature' | 'integration';
  author: string;
  permissions: string[];
  dependencies?: string[];
  entryPoint: string;
}
```

### Appendix C: Key Technologies

- **Frontend**: React 18, TypeScript, CSS Modules, RxJS
- **Backend**: Node.js, Express, Sequelize, SQLite, WebSockets
- **Build Tools**: Vite, ESBuild, Turbo (monorepo)
- **Testing**: Vitest, Playwright, Testing Library
- **Code Quality**: ESLint, Prettier, TypeScript strict mode
