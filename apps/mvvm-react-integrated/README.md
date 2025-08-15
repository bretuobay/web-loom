# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

# MVVM in React Integrated

This project applies the MVVM (Model-View-ViewModel) pattern in a React + TypeScript + Vite environment. The Dashboard component is a practical example of MVVM in action, using ViewModels to manage data and state, and the View (React component) subscribes to observable streams from the ViewModels.

## How MVVM is Applied: Real Example from Dashboard

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
            <div className="flex-item">
              <GreenhouseCard greenHouses={greenHouses} />
            </div>
            <div className="flex-item">
              <SensorCard sensors={sensors} />
            </div>
            <div className="flex-item">
              <ThresholdAlertCard thresholdAlerts={thresholdAlerts ?? []} />
            </div>
            <div className="flex-item">
              <SensorReadingCard sensorReadings={sensorReadings ?? []} />
            </div>
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
