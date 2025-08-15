Prompt:

Examine the React app in mvvm-react and reproduce its functionality using vanilla JavaScript and EJS templates. The goal is to demonstrate that the MVVM pattern can be implemented in any frontend framework or library.

Requirements:

Use vanilla JavaScript for all logic and DOM manipulation.
Use EJS templates for rendering views, organized similarly to the React component structure.
You may use EJS via CDN:

<script src="https://cdn.jsdelivr.net/npm/ejs@3.1.9/ejs.min.js"></script>

or install with npm.
The following dependencies are already installed and should be used:
@repo/shared
@repo/view-models
chart.js (version ^4.4.3)
Instructions:

Analyze imports and usage in the React app:

Show how @repo/shared, @repo/view-models, and chart.js are imported and used in React components.
Provide equivalent vanilla JS import/require statements or usage patterns.
Organize EJS templates:

Structure EJS templates to mirror the React component hierarchy (e.g., views, widgets, charts).
Each template should correspond to a React component and accept the same data/model props.
MVVM pattern implementation:

Use view models from @repo/view-models to manage state and logic.
Bind view models to EJS templates for rendering and updates.
Demonstrate how to update the view when the model changes, using vanilla JS event listeners and EJS re-rendering.
Chart.js integration:

Show how charts are rendered using Chart.js in vanilla JS, using data from view models.
Provide an example of rendering a chart in an EJS template.
Example imports (from React version):

```tsx
// React version
import { someSharedUtil } from '@repo/shared';
import { SomeViewModel } from '@repo/view-models';
import Chart from 'chart.js/auto';
```

```typescript
// Vanilla JS version
const { someSharedUtil } = require('@repo/shared');
const { SomeViewModel } = require('@repo/view-models');
import Chart from 'chart.js/auto'; // or use CDN
```

Deliverables:

Directory structure for EJS templates matching React components.
Example vanilla JS files showing MVVM logic and EJS rendering.
Instructions for running the vanilla JS + EJS app.

Goal:
Show that the MVVM pattern and modular architecture from the React app can be implemented in vanilla JS and EJS, using the same shared libraries and view models.
