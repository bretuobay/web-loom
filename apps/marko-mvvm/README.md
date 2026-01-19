# Marko MVVM Demo

This Marko application demonstrates how `@web-loom/mvvm-core` integrates into a Marko.js + TypeScript project while reusing the shared view models from Web-Loom.

## Getting started

```bash
npm install
npm run dev
```

### Common scripts

- `npm run dev` – start the Marko development server with hot reload  
- `npm run build` – produce a production-ready bundle  
- `npm run preview` – run the production server locally  
- `npm run type-check` – verify TypeScript without emitting files

## Overview

- **Dashboard** (`/` or `/dashboard`): Surface the greenhouse, sensor, reading, and alert ViewModels with loading/error handling via the reusable `<observable-data>` tag.  
- **Greenhouses** (`/greenhouses`): Create, update, and delete greenhouse entities while syncing with the shared `@repo/view-models` data source.  
- **Sensors** (`/sensors`), **Sensor Readings** (`/sensor-readings`), and **Threshold Alerts** (`/threshold-alerts`): Dedicated list pages that mirror the React MVVM reference implementation.

All pages share the `Header` / `Footer` layout that reads navigation items from `@repo/shared/view-models/NavigationViewModel` and imports the shared theme/utility styles.

## How MVVM is wired

1. ViewModels live inside `@repo/view-models` and wrap the shared models in reusable RxJS-powered observables.  
2. The `<observable-data>` tag subscribes to `data$`, `isLoading$`, and `error$`, providing sensible loading / error slots for each view.  
3. Dashboard and list pages consume the same ViewModels that the React demo uses to ensure parity.

## Extending the app

- Add new routes inside `src/routes` or expose reusable tags under `src/tags`.  
- Use `@web-loom/mvvm-core` utilities (commands, `ObservableCollection`, etc.) directly in TypeScript logic.  
- Keep styling consistent by importing `@repo/shared/styles` at the layout level (already done in `src/routes/+layout.marko`).
