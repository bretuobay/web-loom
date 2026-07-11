import { signal, computed, debouncedSignal, type ReadonlySignal, type WritableSignal } from '@web-loom/signals-core';
import { ZodError, ZodSchema, ZodIssue } from 'zod';

// Minimal Command interface (can be expanded later)
export interface Command<TParam, TResult> {
  execute: (param?: TParam) => Promise<TResult>;
  canExecute$: ReadonlySignal<boolean>;
}

export class FormViewModel<
  TData extends Record<string, any>,
  TSchema extends ZodSchema<TData>,
  TResult = TData, // Default result of submission is the data itself
> {
  private readonly initialData: Readonly<Partial<TData>>;
  private readonly schema: TSchema;
  private readonly submitHandler: (data: TData) => Promise<TResult>;
  private readonly _debouncedFormData: ReturnType<typeof debouncedSignal<Partial<TData>>>;
  private readonly _unsubscribeValidation: () => void;

  public formData$: WritableSignal<Partial<TData>>;
  public errors$: WritableSignal<ZodError<TData> | null>;
  public isValid$: ReadonlySignal<boolean>;
  public fieldErrors$: ReadonlySignal<Record<keyof TData, string[] | undefined>>;
  public isDirty$: ReadonlySignal<boolean>;
  public submitCommand: Command<void, TResult>;

  constructor(
    initialData: Partial<TData>,
    schema: TSchema,
    // Allow a custom submit handler, e.g., for API calls
    submitHandler?: (data: TData) => Promise<TResult>,
  ) {
    this.initialData = Object.freeze({ ...initialData }); // Deep freeze for nested objects if necessary
    this.schema = schema;
    this.formData$ = signal<Partial<TData>>({ ...this.initialData });
    this.errors$ = signal<ZodError<TData> | null>(null);

    // Default submit handler if none provided
    this.submitHandler = submitHandler || ((data: TData) => Promise.resolve(data as unknown as TResult));

    // Debounce to avoid excessive validation on rapid input changes
    this._debouncedFormData = debouncedSignal(this.formData$, 50);

    // isValid$ derives from the debounced data — pure, no side effects.
    this.isValid$ = computed(() => this.schema.safeParse(this._debouncedFormData.get()).success);

    // errors$ is populated as data settles (subscribe fires on change, not
    // immediately — matching the previous behavior where the initial state
    // showed no errors until the user edited the form).
    this._unsubscribeValidation = this._debouncedFormData.subscribe((data) => {
      try {
        this.schema.parse(data);
        this.errors$.set(null);
      } catch (error) {
        if (error instanceof ZodError) {
          this.errors$.set(error as ZodError<TData>);
        } else {
          // Handle unexpected errors if necessary
          console.error('Unexpected validation error:', error);
          this.errors$.set(
            new ZodError([
              {
                code: 'custom',
                message: 'An unexpected error occurred during validation.',
                path: [],
              },
            ]),
          );
        }
      }
    });

    this.fieldErrors$ = computed(() => {
      const zodError = this.errors$.get();
      if (!zodError) {
        return {} as Record<keyof TData, string[] | undefined>;
      }
      // Transform ZodError into a more usable field-specific error map
      return zodError.issues.reduce(
        (acc, issue: ZodIssue) => {
          const path = issue.path[0] as keyof TData; // Assuming simple, non-nested paths for now
          if (!acc[path]) {
            acc[path] = [];
          }
          acc[path]?.push(issue.message);
          return acc;
        },
        {} as Record<keyof TData, string[] | undefined>,
      );
    });

    this.isDirty$ = computed(() => JSON.stringify(this.formData$.get()) !== JSON.stringify(this.initialData));

    this.submitCommand = this.createSubmitCommand();
  }

  public updateField<K extends keyof TData>(key: K, value: TData[K]): void {
    const currentData = this.formData$.peek();
    this.formData$.set({ ...currentData, [key]: value });
  }

  public setFormData(data: Partial<TData>): void {
    this.formData$.set({ ...this.initialData, ...data });
  }

  public resetForm(): void {
    this.formData$.set({ ...this.initialData });
    this.errors$.set(null); // Clear errors on reset
  }

  public getFieldErrors(fieldName: keyof TData): ReadonlySignal<string[] | undefined> {
    return computed(() => this.fieldErrors$.get()[fieldName], {
      equals: (prev, curr) => JSON.stringify(prev) === JSON.stringify(curr),
    });
  }

  private createSubmitCommand(): Command<void, TResult> {
    const canExecute$ = this.isValid$;

    const execute = async (): Promise<TResult> => {
      const currentData = this.formData$.peek();
      const validationResult = this.schema.safeParse(currentData);

      if (!validationResult.success) {
        this.errors$.set(validationResult.error as ZodError<TData>);
        return new Error('Form is invalid') as unknown as TResult; // Or throw
      }

      // Proceed with the actual submission logic
      return this.submitHandler(validationResult.data);
    };

    return { execute, canExecute$ };
  }

  // Call this method to clean up subscriptions if the ViewModel is no longer needed.
  // This is important in environments where ViewModels are created and destroyed.
  public dispose(): void {
    this._unsubscribeValidation();
    this._debouncedFormData.dispose();
  }
}
