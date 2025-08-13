You are working in a TypeScript-based Turborepo monorepo. Your task is to use the package `@repo/plugin-core` to build a working plugin architecture demo inside the `apps/plugin-react` directory.

---

### 📦 Packages to Use

- **@repo/plugin-core**
  - Location: `packages/plugin-core`
  - You must read and follow the documentation from: `packages/plugin-core/README.md`
  - This package contains the core plugin runtime and registration logic for building plugin-based systems in a framework-agnostic way.

- **React** (latest)
  - Use React components to build a frontend plugin interface.
  - Target audience: developers building plugin-based dashboards or tools with React.

---

### 🎯 Objective

Build a minimal but complete **React app** inside `apps/plugin-react` that demonstrates how to:

1. Define a plugin interface using `@repo/plugin-core`.
2. Register and render multiple React-based plugins.
3. Demonstrate **data flow**, **plugin communication** (if supported), and **slot rendering** (if supported).
4. Provide basic styling and layout to distinguish plugin components visually.

---

### 🧱 Expected Architecture

Inside `apps/plugin-react`:

### 🛠️ Implementation Tasks

1. **Install & Import `@repo/plugin-core`** from the monorepo.
2. **Define Plugin Types** in `plugin.config.ts`:
   - Plugin ID
   - Metadata
   - Lifecycle methods (if available)
3. **Create Sample Plugins** in `app/plugins/`:
   - `HelloWorldPlugin`: renders static content.
   - `ChartPlugin`: renders a simple bar chart using a library like `recharts` or a placeholder div.
4. **Implement `PluginHost.tsx`**:
   - Initializes `@repo/plugin-core`
   - Registers all plugin instances from `plugin.config.ts`
   - Renders all plugins using React
5. **Create `App.tsx`**:
   - Basic layout (header + plugin container)
   - Theme or styling support optional
6. **Create `index.tsx` in `pages/`** to render `<App />`.
7. **Document in `README.md`** how the plugin architecture works with `@repo/plugin-core`.

---

### 📌 Constraints

- Use only TypeScript.
- Everything must be framework-agnostic except in `apps/plugin-react`, which is React-specific.
- Use only internal monorepo packages and public open-source libraries.
- Add comments explaining key integration points between React and `@repo/plugin-core`.

---

### ✅ Deliverables

- A running React app in `apps/plugin-react`.
- 2 example plugins rendered via `@repo/plugin-core`.
- Clear documentation in `apps/plugin-react/README.md`.
- Sample screenshot or GIF optional but encouraged.
