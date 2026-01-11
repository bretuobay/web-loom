# Task Flow UI

React + Vite MVVM demo that showcases Web Loom integration with lightweight stateful ViewModels and a pluggable widget registry.

## Scripts

- `npm run dev` - run the Vite dev server (default port 5173).
- `npm run build` - bundle the application for production.
- `npm run preview` - preview the production build locally.
- `npm run lint` - run ESLint across the `src` tree.
- `npm run test` - run Vitest once.
- `npm run type-check` - perform a TypeScript build.
- `npm run format` - format source files with Prettier.

## Web Loom integration

- `ProjectBoardViewModel` uses `@web-loom/mvvm-core`'s `BaseModel` + `BaseViewModel` to keep a reactive project list.
- `PluginRegistry` from `@repo/plugin-core` demonstrates runtime plugin manifest registration.
- Shared styling imports from `@repo/shared/styles` ensure Web Loom design tokens are included.
