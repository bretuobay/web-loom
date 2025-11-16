# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

# MVVM in React

This project demonstrates how to apply the MVVM (Model-View-ViewModel) pattern in a React + TypeScript + Vite environment. MVVM helps separate concerns, making your codebase more maintainable and testable.

## How MVVM is Applied: Real Example from Dashboard

The Dashboard component in this project is a practical example of MVVM in React. It uses ViewModels to manage data and state, and the View (React component) subscribes to observable streams from the ViewModels.

### ViewModel Usage

ViewModels encapsulate data-fetching logic and expose observable streams for the View to consume. For example:

```ts
// src/view-models/GreenHouseViewModel.ts
export const greenHouseViewModel = {
  data$: greenHouseDataObservable, // Observable stream of greenhouse data
  isLoading$: isLoadingObservable, // Observable stream for loading state
  fetchCommand: {
    execute: async () => {
      /* fetches greenhouse data */
    },
  },
};
```

### View: Dashboard Component

The Dashboard component subscribes to these observables using a custom hook (`useObservable`) and triggers data fetching via ViewModel commands:

```tsx
import React, { useEffect } from 'react';
import { greenHouseViewModel } from '@repo/view-models/GreenHouseViewModel';
import { useObservable } from '../hooks/useObservable';

const Dashboard: React.FC = () => {
  const greenHouses = useObservable(greenHouseViewModel.data$, []);
  const isLoadingGreenHouses = useObservable(greenHouseViewModel.isLoading$, true);

  useEffect(() => {
    greenHouseViewModel.fetchCommand.execute();
  }, []);

  return <div>{isLoadingGreenHouses ? <p>Loading...</p> : <GreenhouseCard greenHouses={greenHouses} />}</div>;
};
```

### Full Dashboard Example

The full Dashboard aggregates multiple ViewModels and renders their data:

```tsx
import React, { useEffect } from 'react';
import {
  greenHouseViewModel,
  sensorViewModel,
  sensorReadingViewModel,
  thresholdAlertViewModel,
} from '@repo/view-models';
import { useObservable } from '../hooks/useObservable';

const Dashboard: React.FC = () => {
  const greenHouses = useObservable(greenHouseViewModel.data$, []);
  const isLoadingGreenHouses = useObservable(greenHouseViewModel.isLoading$, true);
  const sensors = useObservable(sensorViewModel.data$, []);
  const isLoadingSensors = useObservable(sensorViewModel.isLoading$, true);
  const sensorReadings = useObservable(sensorReadingViewModel.data$, []);
  const isLoadingSensorReadings = useObservable(sensorReadingViewModel.isLoading$, true);
  const thresholdAlerts = useObservable(thresholdAlertViewModel.data$, []);
  const isLoadingThresholdAlerts = useObservable(thresholdAlertViewModel.isLoading$, true);

  useEffect(() => {
    greenHouseViewModel.fetchCommand.execute();
    sensorViewModel.fetchCommand.execute();
    sensorReadingViewModel.fetchCommand.execute();
    thresholdAlertViewModel.fetchCommand.execute();
  }, []);

  const isLoading = isLoadingGreenHouses || isLoadingSensors || isLoadingSensorReadings || isLoadingThresholdAlerts;

  return (
    <div className="dashboard-container">
      {isLoading && <p>Loading dashboard data...</p>}
      {!isLoading && (
        <>
          <h2>Dashboard</h2>
          <div className="flex-container">
            <GreenhouseCard greenHouses={greenHouses} />
            <SensorCard sensors={sensors} />
            <ThresholdAlertCard thresholdAlerts={thresholdAlerts ?? []} />
            <SensorReadingCard sensorReadings={sensorReadings ?? []} />
          </div>
        </>
      )}
    </div>
  );
};
```

#### MVVM Mapping

- **Model:** Data sources and business logic (e.g., greenhouse, sensor, reading, alert models)
- **ViewModel:** Observable streams and commands (e.g., `data$`, `isLoading$`, `fetchCommand`)
- **View:** React components (e.g., `Dashboard`, `GreenhouseCard`, etc.) subscribe to ViewModel observables and render UI

This approach keeps data logic out of the UI components and enables reactive updates when data changes.

## How MVVM is Applied

- **Model:** Represents the application's data and business logic. In React, this is often managed via state, context, or external stores.
- **View:** The React components that render the UI.
- **ViewModel:** Encapsulates presentation logic and state, exposing data and actions to the View. In React, this is typically implemented using custom hooks or container components.

## Project Structure

- `src/model/` — Data models
- `src/view-models/` — ViewModel logic (custom hooks, state management)
- `src/components/` — React components (Views)

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Run the app:**
   ```bash
   npm start
   ```
3. Open the app in your browser.

## Contributing

Contributions and suggestions are welcome! Please open issues or submit pull requests for improvements.

## License

MIT

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config({
  extends: [
    // Remove ...tseslint.configs.recommended and replace with this
    ...tseslint.configs.recommendedTypeChecked,
    // Alternatively, use this for stricter rules
    ...tseslint.configs.strictTypeChecked,
    // Optionally, add this for stylistic rules
    ...tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
});
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x';
import reactDom from 'eslint-plugin-react-dom';

export default tseslint.config({
  plugins: {
    // Add the react-x and react-dom plugins
    'react-x': reactX,
    'react-dom': reactDom,
  },
  rules: {
    // other rules...
    // Enable its recommended typescript rules
    ...reactX.configs['recommended-typescript'].rules,
    ...reactDom.configs.recommended.rules,
  },
});
```
