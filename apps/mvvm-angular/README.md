# MvvmAngular

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 19.2.12.

# MVVM in Angular

This project applies the MVVM (Model-View-ViewModel) pattern in Angular. Components interact with ViewModels that expose observable streams for data, loading, and error states. The GreenhouseCardComponent is a practical example of MVVM in action.

## How MVVM is Applied: Real Example from GreenhouseCardComponent

### ViewModel Usage

ViewModels encapsulate data-fetching logic and expose observable streams for the component to consume. For example:

```typescript
// Provided via DI in the component
export const greenHouseViewModel = {
  data$: greenHouseDataObservable, // Observable stream of greenhouse data
  isLoading$: isLoadingObservable, // Observable stream for loading state
  error$: errorObservable, // Observable stream for error state
  fetchCommand: {
    execute: () => {
      /* fetches greenhouse data */
    },
  },
};
```

### View: GreenhouseCardComponent

The component subscribes to these observables and triggers data fetching via the ViewModel command:

```typescript
@Component({
  selector: 'app-greenhouse-card',
  // ...existing code...
})
export class GreenhouseCardComponent implements OnInit {
  public vm: typeof greenHouseViewModel;
  public data$!: Observable<GreenhouseListData | null>;
  public loading$!: Observable<boolean>;
  public error$!: Observable<any>;

  constructor(@Inject(GREENHOUSE_VIEW_MODEL) vm: typeof greenHouseViewModel) {
    this.vm = vm;
  }

  ngOnInit(): void {
    this.data$ = this.vm.data$;
    this.loading$ = this.vm.isLoading$;
    this.error$ = this.vm.error$;
    this.vm.fetchCommand.execute();
  }
}
```

### Template Example

The template uses Angular's async pipe to bind to observable data:

```html
<ng-container *ngIf="loading$ | async; else loaded">
  <p>Loading greenhouse data...</p>
</ng-container>
<ng-template #loaded>
  <div *ngIf="data$ | async as data">
    <!-- Render greenhouse data here -->
  </div>
  <div *ngIf="error$ | async as error">
    <p>Error: {{ error }}</p>
  </div>
</ng-template>
```

#### MVVM Mapping

- **Model:** Data sources and business logic (e.g., greenhouse models)
- **ViewModel:** Observable streams and commands (e.g., `data$`, `isLoading$`, `error$`, `fetchCommand`)
- **View:** Angular components and templates subscribe to ViewModel observables and render UI

This approach keeps data logic out of the UI components and enables reactive updates when data changes.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
