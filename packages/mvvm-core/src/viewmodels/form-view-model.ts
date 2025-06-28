import { BehaviorSubject, Observable, combineLatest, of } from 'rxjs';
import { map, startWith, distinctUntilChanged, debounceTime } from 'rxjs/operators';
import { z, ZodError, ZodSchema, ZodIssue } from 'zod';

// Minimal Command interface (can be expanded later)
export interface Command<TParam, TResult> {
  execute: (param?: TParam) => Observable<TResult>;
  canExecute$: Observable<boolean>;
}

export class FormViewModel<
  TData extends Record<string, any>,
  TSchema extends ZodSchema<TData>,
  TResult = TData // Default result of submission is the data itself
> {
  private readonly initialData: Readonly<Partial<TData>>;
  private readonly schema: TSchema;
  private readonly submitHandler: (data: TData) => Observable<TResult>;

  public formData$: BehaviorSubject<Partial<TData>>;
  public errors$: BehaviorSubject<ZodError<TData> | null>;
  public isValid$: Observable<boolean>;
  public fieldErrors$: Observable<Record<keyof TData, string[] | undefined>>;
  public isDirty$: Observable<boolean>;
  public submitCommand: Command<void, TResult>;

  constructor(
    initialData: Partial<TData>,
    schema: TSchema,
    // Allow a custom submit handler, e.g., for API calls
    submitHandler?: (data: TData) => Observable<TResult>
  ) {
    this.initialData = Object.freeze({ ...initialData }); // Deep freeze for nested objects if necessary
    this.schema = schema;
    this.formData$ = new BehaviorSubject<Partial<TData>>({ ...this.initialData });
    this.errors$ = new BehaviorSubject<ZodError<TData> | null>(null);

    // Default submit handler if none provided
    this.submitHandler = submitHandler || ((data: TData) => of(data as unknown as TResult));

    this.isValid$ = this.formData$.pipe(
      // Debounce to avoid excessive validation on rapid input changes
      debounceTime(50), // Adjust as needed
      map(data => {
        try {
          this.schema.parse(data);
          this.errors$.next(null);
          return true;
        } catch (error) {
          if (error instanceof ZodError) {
            this.errors$.next(error as ZodError<TData>);
          } else {
            // Handle unexpected errors if necessary
            console.error("Unexpected validation error:", error);
            this.errors$.next(new ZodError([{
                code: 'custom',
                message: 'An unexpected error occurred during validation.',
                path: []
            }]));
          }
          return false;
        }
      }),
      startWith(this.schema.safeParse(this.initialData).success), // Initial validation state
      distinctUntilChanged() // Only emit when validation status actually changes
    );

    this.fieldErrors$ = this.errors$.pipe(
      map(zodError => {
        if (!zodError) {
          return {} as Record<keyof TData, string[] | undefined>;
        }
        // Transform ZodError into a more usable field-specific error map
        return zodError.issues.reduce((acc, issue: ZodIssue) => {
          const path = issue.path[0] as keyof TData; // Assuming simple, non-nested paths for now
          if (!acc[path]) {
            acc[path] = [];
          }
          acc[path]?.push(issue.message);
          return acc;
        }, {} as Record<keyof TData, string[] | undefined>);
      }),
      startWith({} as Record<keyof TData, string[] | undefined>)
    );

    this.isDirty$ = this.formData$.pipe(
      map(currentData => JSON.stringify(currentData) !== JSON.stringify(this.initialData)),
      startWith(false),
      distinctUntilChanged()
    );

    this.submitCommand = this.createSubmitCommand();
  }

  public updateField<K extends keyof TData>(key: K, value: TData[K]): void {
    const currentData = this.formData$.getValue();
    this.formData$.next({ ...currentData, [key]: value });
  }

  public setFormData(data: Partial<TData>): void {
    this.formData$.next({ ...this.initialData, ...data });
  }

  public resetForm(): void {
    this.formData$.next({ ...this.initialData });
    this.errors$.next(null); // Clear errors on reset
  }

  public getFieldErrors(fieldName: keyof TData): Observable<string[] | undefined> {
    return this.fieldErrors$.pipe(
      map(errors => errors[fieldName]),
      distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr))
    );
  }

  private createSubmitCommand(): Command<void, TResult> {
    const canExecute$ = combineLatest([
      this.isValid$,
      // this.isDirty$ // Optional: only allow submit if dirty
    ]).pipe(
      map(([isValid]) => isValid), // map(([isValid, isDirty]) => isValid && isDirty),
      startWith(false)
    );

    const execute = (): Observable<TResult> => {
      const currentData = this.formData$.getValue();
      const validationResult = this.schema.safeParse(currentData);

      if (!validationResult.success) {
        this.errors$.next(validationResult.error as ZodError<TData>);
        return of(new Error("Form is invalid") as unknown as TResult); // Or throw
      }

      // Proceed with the actual submission logic
      return this.submitHandler(validationResult.data).pipe(
        map(result => {
          // Optionally reset form or update initialData on successful submission
          // For example, make the current data the new initial data
          // this.initialData = Object.freeze({ ...validationResult.data });
          // this.resetForm(); // This would clear dirtiness
          return result;
        }),
        // catchError(error => {
        //   // Handle submission errors (e.g., from API)
        //   // This could also be a place to push to GlobalErrorService
        //   console.error("Submission Error:", error);
        //   // Potentially map to a ZodError or a specific error format for the form
        //   this.errors$.next(new ZodError([{ code: 'custom', message: "Submission failed.", path: [] }]));
        //   return throwError(() => error); // Re-throw for subscribers to handle
        // })
      );
    };

    return { execute, canExecute$ };
  }

  // Call this method to clean up subscriptions if the ViewModel is no longer needed.
  // This is important in environments where ViewModels are created and destroyed.
  public dispose(): void {
    // Complete BehaviorSubjects to prevent memory leaks
    this.formData$.complete();
    this.errors$.complete();
    // Add other subjects if they exist and need completion
    // e.g. this.isDirty$.complete() if it were a Subject
    // Observables derived from these will also complete.
  }
}
