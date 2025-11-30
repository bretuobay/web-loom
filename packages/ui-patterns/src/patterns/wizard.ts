import { createStore, type Store } from '@web-loom/store-core';
import { createFormBehavior, type FormBehavior, type ValidationFunction } from '@web-loom/ui-core';

/**
 * Represents a step in the wizard.
 */
export interface WizardStep {
  /**
   * Unique identifier for the step.
   */
  id: string;

  /**
   * Display label for the step.
   */
  label: string;

  /**
   * Optional validation function for this step.
   * Returns an error message if validation fails, or null/undefined if valid.
   */
  validate?: ValidationFunction<any>;

  /**
   * Optional function to determine the next step based on current data.
   * Enables branching logic in the wizard.
   * @param data Current wizard data.
   * @returns The ID of the next step, or null to use default sequential navigation.
   */
  getNextStep?: (data: any) => string | null;
}

/**
 * Represents the state of a wizard pattern.
 */
export interface WizardState<T = any> {
  /**
   * Array of all wizard steps.
   */
  steps: WizardStep[];

  /**
   * The index of the currently active step.
   */
  currentStepIndex: number;

  /**
   * Array of step indices that have been completed.
   */
  completedSteps: number[];

  /**
   * Whether the user can proceed to the next step.
   * Based on current step validation.
   */
  canProceed: boolean;

  /**
   * The accumulated data from all wizard steps.
   */
  data: T;
}

/**
 * Actions available for controlling the wizard pattern.
 */
export interface WizardActions {
  /**
   * Proceeds to the next step if validation passes.
   * @returns Promise that resolves to true if navigation succeeded, false otherwise.
   */
  goToNextStep: () => Promise<boolean>;

  /**
   * Goes back to the previous step.
   */
  goToPreviousStep: () => void;

  /**
   * Navigates to a specific step by index.
   * @param index The index of the step to navigate to.
   */
  goToStep: (index: number) => void;

  /**
   * Completes the wizard.
   * Validates all steps before completion.
   * @returns Promise that resolves when wizard is complete.
   */
  completeWizard: () => Promise<void>;

  /**
   * Sets or updates data for the wizard.
   * @param data Partial data to merge with existing wizard data.
   */
  setStepData: (data: any) => void;
}

/**
 * Options for configuring the wizard pattern.
 */
export interface WizardOptions<T = any> {
  /**
   * Array of wizard steps.
   */
  steps: WizardStep[];

  /**
   * Initial wizard data.
   * @default {}
   */
  initialData?: T;

  /**
   * Initial step index.
   * @default 0
   */
  initialStepIndex?: number;

  /**
   * Optional callback invoked when the wizard is completed.
   * @param data The final wizard data.
   */
  onComplete?: (data: T) => void | Promise<void>;

  /**
   * Optional callback invoked when the current step changes.
   * @param stepIndex The new step index.
   * @param step The new step.
   */
  onStepChange?: (stepIndex: number, step: WizardStep) => void;

  /**
   * Optional callback invoked when wizard data changes.
   * @param data The updated wizard data.
   */
  onDataChange?: (data: T) => void;
}

/**
 * The wizard pattern interface returned by createWizard.
 */
export interface WizardBehavior<T = any> {
  /**
   * Gets the current state of the wizard.
   */
  getState: () => WizardState<T>;

  /**
   * Subscribes to state changes.
   * @param listener Function called when state changes.
   * @returns Unsubscribe function.
   */
  subscribe: (listener: (state: WizardState<T>) => void) => () => void;

  /**
   * Actions for controlling the wizard.
   */
  actions: WizardActions;

  /**
   * Destroys the behavior and cleans up subscriptions.
   */
  destroy: () => void;
}

/**
 * Creates a wizard pattern for managing multi-step flows with validation.
 *
 * This pattern composes form behavior for step validation and provides
 * navigation controls for moving through wizard steps. It supports optional
 * branching logic where the next step can depend on previous answers.
 *
 * @example
 * ```typescript
 * interface WizardData {
 *   accountType?: 'personal' | 'business';
 *   email?: string;
 *   companyName?: string;
 * }
 *
 * const wizard = createWizard<WizardData>({
 *   steps: [
 *     {
 *       id: 'account-type',
 *       label: 'Account Type',
 *       validate: (data) => {
 *         if (!data.accountType) return 'Please select an account type';
 *         return null;
 *       },
 *       getNextStep: (data) => {
 *         // Branch based on account type
 *         return data.accountType === 'business' ? 'company-info' : 'personal-info';
 *       },
 *     },
 *     {
 *       id: 'company-info',
 *       label: 'Company Information',
 *       validate: (data) => {
 *         if (!data.companyName) return 'Company name is required';
 *         return null;
 *       },
 *     },
 *     {
 *       id: 'personal-info',
 *       label: 'Personal Information',
 *       validate: (data) => {
 *         if (!data.email) return 'Email is required';
 *         return null;
 *       },
 *     },
 *   ],
 *   initialData: {},
 *   onComplete: async (data) => {
 *     console.log('Wizard completed with data:', data);
 *     // Submit data to server
 *   },
 * });
 *
 * // Set step data
 * wizard.actions.setStepData({ accountType: 'business' });
 *
 * // Try to proceed to next step
 * const success = await wizard.actions.goToNextStep();
 * if (success) {
 *   console.log('Moved to next step');
 * }
 *
 * // Go back
 * wizard.actions.goToPreviousStep();
 *
 * // Complete wizard
 * await wizard.actions.completeWizard();
 *
 * // Clean up
 * wizard.destroy();
 * ```
 *
 * @param options Configuration options for the wizard pattern.
 * @returns A wizard pattern instance.
 */
export function createWizard<T extends Record<string, any> = Record<string, any>>(
  options: WizardOptions<T>,
): WizardBehavior<T> {
  const steps = options.steps;
  const initialStepIndex = options.initialStepIndex ?? 0;
  const initialData = (options.initialData ?? {}) as T;

  // Create a form behavior for validation
  // We'll use it to validate the current step's data
  const formBehavior: FormBehavior<T> = createFormBehavior<T>({
    initialValues: initialData,
    validateOnChange: false,
    validateOnBlur: false,
  });

  // Create store for wizard state
  const initialState: WizardState<T> = {
    steps,
    currentStepIndex: initialStepIndex,
    completedSteps: [],
    canProceed: true, // Will be updated after first validation
    data: initialData,
  };

  const store: Store<WizardState<T>, WizardActions> = createStore<WizardState<T>, WizardActions>(
    initialState,
    (set, get, actions) => ({
      goToNextStep: async () => {
        const state = get();
        const currentStep = state.steps[state.currentStepIndex];

        // Validate current step if it has a validation function
        if (currentStep.validate) {
          try {
            const error = await Promise.resolve(currentStep.validate(state.data));
            if (error) {
              // Validation failed, cannot proceed
              set((state) => ({
                ...state,
                canProceed: false,
              }));
              return false;
            }
          } catch (err) {
            console.error('Step validation error:', err);
            set((state) => ({
              ...state,
              canProceed: false,
            }));
            return false;
          }
        }

        // Mark current step as completed
        const completedSteps = [...state.completedSteps];
        if (!completedSteps.includes(state.currentStepIndex)) {
          completedSteps.push(state.currentStepIndex);
        }

        // Determine next step index
        let nextStepIndex: number;

        if (currentStep.getNextStep) {
          // Use branching logic
          const nextStepId = currentStep.getNextStep(state.data);
          if (nextStepId) {
            const foundIndex = state.steps.findIndex((s) => s.id === nextStepId);
            if (foundIndex !== -1) {
              nextStepIndex = foundIndex;
            } else {
              // Step ID not found, use sequential navigation
              nextStepIndex = state.currentStepIndex + 1;
            }
          } else {
            // No branching, use sequential navigation
            nextStepIndex = state.currentStepIndex + 1;
          }
        } else {
          // Sequential navigation
          nextStepIndex = state.currentStepIndex + 1;
        }

        // Check if we're at the last step
        if (nextStepIndex >= state.steps.length) {
          // Cannot proceed beyond last step
          set((state) => ({
            ...state,
            completedSteps,
            canProceed: false,
          }));
          return false;
        }

        // Move to next step
        set((state) => ({
          ...state,
          currentStepIndex: nextStepIndex,
          completedSteps,
          canProceed: true,
        }));

        // Invoke onStepChange callback if provided
        if (options.onStepChange) {
          options.onStepChange(nextStepIndex, state.steps[nextStepIndex]);
        }

        return true;
      },

      goToPreviousStep: () => {
        const state = get();

        if (state.currentStepIndex > 0) {
          const newStepIndex = state.currentStepIndex - 1;

          set((state) => ({
            ...state,
            currentStepIndex: newStepIndex,
            canProceed: true,
          }));

          // Invoke onStepChange callback if provided
          if (options.onStepChange) {
            options.onStepChange(newStepIndex, state.steps[newStepIndex]);
          }
        }
      },

      goToStep: (index: number) => {
        const state = get();

        // Validate index
        if (index < 0 || index >= state.steps.length) {
          return;
        }

        set((state) => ({
          ...state,
          currentStepIndex: index,
          canProceed: true,
        }));

        // Invoke onStepChange callback if provided
        if (options.onStepChange) {
          options.onStepChange(index, state.steps[index]);
        }
      },

      completeWizard: async () => {
        const state = get();

        // Validate all steps
        for (let i = 0; i < state.steps.length; i++) {
          const step = state.steps[i];
          if (step.validate) {
            try {
              const error = await Promise.resolve(step.validate(state.data));
              if (error) {
                console.error(`Step ${i} (${step.id}) validation failed:`, error);
                // Navigate to the first invalid step
                actions.goToStep(i);
                return;
              }
            } catch (err) {
              console.error(`Step ${i} (${step.id}) validation error:`, err);
              // Navigate to the first invalid step
              actions.goToStep(i);
              return;
            }
          }
        }

        // All steps are valid, complete the wizard
        if (options.onComplete) {
          try {
            await Promise.resolve(options.onComplete(state.data));
          } catch (err) {
            console.error('Wizard completion error:', err);
          }
        }
      },

      setStepData: (data: any) => {
        set((state) => {
          const newData = {
            ...state.data,
            ...data,
          };

          // Invoke onDataChange callback if provided
          if (options.onDataChange) {
            options.onDataChange(newData);
          }

          return {
            ...state,
            data: newData,
          };
        });

        // Update form behavior with new data
        formBehavior.actions.resetForm();
        Object.keys(data).forEach((key) => {
          formBehavior.actions.setFieldValue(key as keyof T, data[key]);
        });
      },
    }),
  );

  return {
    getState: store.getState,
    subscribe: store.subscribe,
    actions: store.actions,
    destroy: () => {
      formBehavior.destroy();
      store.destroy();
    },
  };
}
