import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createWizard, type WizardStep } from '../wizard';

interface TestWizardData {
  accountType?: 'personal' | 'business';
  email?: string;
  companyName?: string;
  password?: string;
}

describe('createWizard', () => {
  let basicSteps: WizardStep[];

  beforeEach(() => {
    basicSteps = [
      {
        id: 'step-1',
        label: 'Step 1',
      },
      {
        id: 'step-2',
        label: 'Step 2',
      },
      {
        id: 'step-3',
        label: 'Step 3',
      },
    ];
  });

  describe('initial state', () => {
    it('should initialize with first step active', () => {
      const wizard = createWizard({
        steps: basicSteps,
      });

      const state = wizard.getState();

      expect(state.currentStepIndex).toBe(0);
      expect(state.steps).toEqual(basicSteps);
      expect(state.completedSteps).toEqual([]);
      expect(state.canProceed).toBe(true);
      expect(state.data).toEqual({});

      wizard.destroy();
    });

    it('should initialize with custom initial step index', () => {
      const wizard = createWizard({
        steps: basicSteps,
        initialStepIndex: 1,
      });

      const state = wizard.getState();

      expect(state.currentStepIndex).toBe(1);

      wizard.destroy();
    });

    it('should initialize with initial data', () => {
      const initialData: TestWizardData = {
        email: 'test@example.com',
        accountType: 'personal',
      };

      const wizard = createWizard<TestWizardData>({
        steps: basicSteps,
        initialData,
      });

      const state = wizard.getState();

      expect(state.data).toEqual(initialData);

      wizard.destroy();
    });

    it('should handle empty steps array', () => {
      const wizard = createWizard({
        steps: [],
      });

      const state = wizard.getState();

      expect(state.steps).toEqual([]);
      expect(state.currentStepIndex).toBe(0);

      wizard.destroy();
    });
  });

  describe('goToNextStep action', () => {
    it('should move to next step when no validation is required', async () => {
      const wizard = createWizard({
        steps: basicSteps,
      });

      const success = await wizard.actions.goToNextStep();

      expect(success).toBe(true);
      expect(wizard.getState().currentStepIndex).toBe(1);

      wizard.destroy();
    });

    it('should mark current step as completed when moving to next step', async () => {
      const wizard = createWizard({
        steps: basicSteps,
      });

      await wizard.actions.goToNextStep();

      const state = wizard.getState();
      expect(state.completedSteps).toContain(0);

      wizard.destroy();
    });

    it('should track multiple completed steps', async () => {
      const wizard = createWizard({
        steps: basicSteps,
      });

      await wizard.actions.goToNextStep(); // Complete step 0
      await wizard.actions.goToNextStep(); // Complete step 1

      const state = wizard.getState();
      expect(state.completedSteps).toContain(0);
      expect(state.completedSteps).toContain(1);
      expect(state.currentStepIndex).toBe(2);

      wizard.destroy();
    });

    it('should not proceed beyond last step', async () => {
      const wizard = createWizard({
        steps: basicSteps,
        initialStepIndex: 2, // Start at last step
      });

      const success = await wizard.actions.goToNextStep();

      expect(success).toBe(false);
      expect(wizard.getState().currentStepIndex).toBe(2);
      expect(wizard.getState().canProceed).toBe(false);

      wizard.destroy();
    });

    it('should validate current step before proceeding', async () => {
      const stepsWithValidation: WizardStep[] = [
        {
          id: 'step-1',
          label: 'Step 1',
          validate: (data: TestWizardData) => {
            if (!data.email) return 'Email is required';
            return null;
          },
        },
        {
          id: 'step-2',
          label: 'Step 2',
        },
      ];

      const wizard = createWizard<TestWizardData>({
        steps: stepsWithValidation,
        initialData: {},
      });

      const success = await wizard.actions.goToNextStep();

      expect(success).toBe(false);
      expect(wizard.getState().currentStepIndex).toBe(0);
      expect(wizard.getState().canProceed).toBe(false);

      wizard.destroy();
    });

    it('should proceed when validation passes', async () => {
      const stepsWithValidation: WizardStep[] = [
        {
          id: 'step-1',
          label: 'Step 1',
          validate: (data: TestWizardData) => {
            if (!data.email) return 'Email is required';
            return null;
          },
        },
        {
          id: 'step-2',
          label: 'Step 2',
        },
      ];

      const wizard = createWizard<TestWizardData>({
        steps: stepsWithValidation,
        initialData: { email: 'test@example.com' },
      });

      const success = await wizard.actions.goToNextStep();

      expect(success).toBe(true);
      expect(wizard.getState().currentStepIndex).toBe(1);

      wizard.destroy();
    });

    it('should support async validation', async () => {
      const stepsWithAsyncValidation: WizardStep[] = [
        {
          id: 'step-1',
          label: 'Step 1',
          validate: async (data: TestWizardData) => {
            // Simulate async validation
            await new Promise((resolve) => setTimeout(resolve, 10));
            if (!data.email) return 'Email is required';
            return null;
          },
        },
        {
          id: 'step-2',
          label: 'Step 2',
        },
      ];

      const wizard = createWizard<TestWizardData>({
        steps: stepsWithAsyncValidation,
        initialData: { email: 'test@example.com' },
      });

      const success = await wizard.actions.goToNextStep();

      expect(success).toBe(true);
      expect(wizard.getState().currentStepIndex).toBe(1);

      wizard.destroy();
    });

    it('should invoke onStepChange callback when step changes', async () => {
      const onStepChange = vi.fn();
      const wizard = createWizard({
        steps: basicSteps,
        onStepChange,
      });

      await wizard.actions.goToNextStep();

      expect(onStepChange).toHaveBeenCalledTimes(1);
      expect(onStepChange).toHaveBeenCalledWith(1, basicSteps[1]);

      wizard.destroy();
    });
  });

  describe('goToPreviousStep action', () => {
    it('should move to previous step', () => {
      const wizard = createWizard({
        steps: basicSteps,
        initialStepIndex: 1,
      });

      wizard.actions.goToPreviousStep();

      expect(wizard.getState().currentStepIndex).toBe(0);

      wizard.destroy();
    });

    it('should not move before first step', () => {
      const wizard = createWizard({
        steps: basicSteps,
        initialStepIndex: 0,
      });

      wizard.actions.goToPreviousStep();

      expect(wizard.getState().currentStepIndex).toBe(0);

      wizard.destroy();
    });

    it('should set canProceed to true when moving back', () => {
      const wizard = createWizard({
        steps: basicSteps,
        initialStepIndex: 2,
      });

      wizard.actions.goToPreviousStep();

      expect(wizard.getState().canProceed).toBe(true);

      wizard.destroy();
    });

    it('should invoke onStepChange callback', () => {
      const onStepChange = vi.fn();
      const wizard = createWizard({
        steps: basicSteps,
        initialStepIndex: 2,
        onStepChange,
      });

      wizard.actions.goToPreviousStep();

      expect(onStepChange).toHaveBeenCalledTimes(1);
      expect(onStepChange).toHaveBeenCalledWith(1, basicSteps[1]);

      wizard.destroy();
    });
  });

  describe('goToStep action', () => {
    it('should navigate to specific step by index', () => {
      const wizard = createWizard({
        steps: basicSteps,
      });

      wizard.actions.goToStep(2);

      expect(wizard.getState().currentStepIndex).toBe(2);

      wizard.destroy();
    });

    it('should handle invalid step indices', () => {
      const wizard = createWizard({
        steps: basicSteps,
      });

      wizard.actions.goToStep(-1);
      expect(wizard.getState().currentStepIndex).toBe(0);

      wizard.actions.goToStep(10);
      expect(wizard.getState().currentStepIndex).toBe(0);

      wizard.destroy();
    });

    it('should set canProceed to true', () => {
      const wizard = createWizard({
        steps: basicSteps,
      });

      wizard.actions.goToStep(1);

      expect(wizard.getState().canProceed).toBe(true);

      wizard.destroy();
    });

    it('should invoke onStepChange callback', () => {
      const onStepChange = vi.fn();
      const wizard = createWizard({
        steps: basicSteps,
        onStepChange,
      });

      wizard.actions.goToStep(2);

      expect(onStepChange).toHaveBeenCalledTimes(1);
      expect(onStepChange).toHaveBeenCalledWith(2, basicSteps[2]);

      wizard.destroy();
    });
  });

  describe('setStepData action', () => {
    it('should update wizard data', () => {
      const wizard = createWizard<TestWizardData>({
        steps: basicSteps,
        initialData: {},
      });

      wizard.actions.setStepData({ email: 'test@example.com' });

      const state = wizard.getState();
      expect(state.data.email).toBe('test@example.com');

      wizard.destroy();
    });

    it('should merge data with existing data', () => {
      const wizard = createWizard<TestWizardData>({
        steps: basicSteps,
        initialData: { email: 'test@example.com' },
      });

      wizard.actions.setStepData({ accountType: 'business' });

      const state = wizard.getState();
      expect(state.data.email).toBe('test@example.com');
      expect(state.data.accountType).toBe('business');

      wizard.destroy();
    });

    it('should invoke onDataChange callback', () => {
      const onDataChange = vi.fn();
      const wizard = createWizard<TestWizardData>({
        steps: basicSteps,
        initialData: {},
        onDataChange,
      });

      wizard.actions.setStepData({ email: 'test@example.com' });

      expect(onDataChange).toHaveBeenCalledTimes(1);
      expect(onDataChange).toHaveBeenCalledWith({ email: 'test@example.com' });

      wizard.destroy();
    });
  });

  describe('completeWizard action', () => {
    it('should complete wizard when all steps are valid', async () => {
      const onComplete = vi.fn();
      const wizard = createWizard<TestWizardData>({
        steps: basicSteps,
        initialData: { email: 'test@example.com' },
        onComplete,
      });

      await wizard.actions.completeWizard();

      expect(onComplete).toHaveBeenCalledTimes(1);
      expect(onComplete).toHaveBeenCalledWith({ email: 'test@example.com' });

      wizard.destroy();
    });

    it('should validate all steps before completion', async () => {
      const stepsWithValidation: WizardStep[] = [
        {
          id: 'step-1',
          label: 'Step 1',
          validate: (data: TestWizardData) => {
            if (!data.email) return 'Email is required';
            return null;
          },
        },
        {
          id: 'step-2',
          label: 'Step 2',
          validate: (data: TestWizardData) => {
            if (!data.password) return 'Password is required';
            return null;
          },
        },
      ];

      const onComplete = vi.fn();
      const wizard = createWizard<TestWizardData>({
        steps: stepsWithValidation,
        initialData: { email: 'test@example.com' }, // Missing password
        onComplete,
      });

      await wizard.actions.completeWizard();

      // Should not complete because step 2 validation fails
      expect(onComplete).not.toHaveBeenCalled();
      // Should navigate to the first invalid step
      expect(wizard.getState().currentStepIndex).toBe(1);

      wizard.destroy();
    });

    it('should complete when all validations pass', async () => {
      const stepsWithValidation: WizardStep[] = [
        {
          id: 'step-1',
          label: 'Step 1',
          validate: (data: TestWizardData) => {
            if (!data.email) return 'Email is required';
            return null;
          },
        },
        {
          id: 'step-2',
          label: 'Step 2',
          validate: (data: TestWizardData) => {
            if (!data.password) return 'Password is required';
            return null;
          },
        },
      ];

      const onComplete = vi.fn();
      const wizard = createWizard<TestWizardData>({
        steps: stepsWithValidation,
        initialData: {
          email: 'test@example.com',
          password: 'password123',
        },
        onComplete,
      });

      await wizard.actions.completeWizard();

      expect(onComplete).toHaveBeenCalledTimes(1);

      wizard.destroy();
    });

    it('should support async onComplete callback', async () => {
      const onComplete = vi.fn(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      const wizard = createWizard({
        steps: basicSteps,
        onComplete,
      });

      await wizard.actions.completeWizard();

      expect(onComplete).toHaveBeenCalledTimes(1);

      wizard.destroy();
    });
  });

  describe('branching logic', () => {
    it('should support conditional next step based on data', async () => {
      const branchingSteps: WizardStep[] = [
        {
          id: 'account-type',
          label: 'Account Type',
          getNextStep: (data: TestWizardData) => {
            return data.accountType === 'business' ? 'company-info' : 'personal-info';
          },
        },
        {
          id: 'company-info',
          label: 'Company Information',
        },
        {
          id: 'personal-info',
          label: 'Personal Information',
        },
      ];

      const wizard = createWizard<TestWizardData>({
        steps: branchingSteps,
        initialData: { accountType: 'business' },
      });

      await wizard.actions.goToNextStep();

      // Should navigate to company-info (index 1) instead of personal-info (index 2)
      expect(wizard.getState().currentStepIndex).toBe(1);
      expect(wizard.getState().steps[1].id).toBe('company-info');

      wizard.destroy();
    });

    it('should use sequential navigation when getNextStep returns null', async () => {
      const branchingSteps: WizardStep[] = [
        {
          id: 'step-1',
          label: 'Step 1',
          getNextStep: () => null, // Use default sequential navigation
        },
        {
          id: 'step-2',
          label: 'Step 2',
        },
      ];

      const wizard = createWizard({
        steps: branchingSteps,
      });

      await wizard.actions.goToNextStep();

      expect(wizard.getState().currentStepIndex).toBe(1);

      wizard.destroy();
    });

    it('should fallback to sequential navigation when step ID not found', async () => {
      const branchingSteps: WizardStep[] = [
        {
          id: 'step-1',
          label: 'Step 1',
          getNextStep: () => 'non-existent-step',
        },
        {
          id: 'step-2',
          label: 'Step 2',
        },
      ];

      const wizard = createWizard({
        steps: branchingSteps,
      });

      await wizard.actions.goToNextStep();

      // Should fallback to sequential navigation (step 2)
      expect(wizard.getState().currentStepIndex).toBe(1);

      wizard.destroy();
    });
  });

  describe('subscribe', () => {
    it('should notify subscribers when state changes', async () => {
      const wizard = createWizard({
        steps: basicSteps,
      });

      const listener = vi.fn();
      wizard.subscribe(listener);

      await wizard.actions.goToNextStep();

      expect(listener).toHaveBeenCalled();
      const lastCall = listener.mock.calls[listener.mock.calls.length - 1];
      expect(lastCall[0]).toMatchObject({
        currentStepIndex: 1,
      });

      wizard.destroy();
    });

    it('should allow unsubscribing', async () => {
      const wizard = createWizard({
        steps: basicSteps,
      });

      const listener = vi.fn();
      const unsubscribe = wizard.subscribe(listener);

      unsubscribe();

      await wizard.actions.goToNextStep();

      expect(listener).not.toHaveBeenCalled();

      wizard.destroy();
    });
  });

  describe('destroy', () => {
    it('should clean up subscriptions when destroyed', async () => {
      const wizard = createWizard({
        steps: basicSteps,
      });

      const listener = vi.fn();
      wizard.subscribe(listener);

      wizard.destroy();

      await wizard.actions.goToNextStep();

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete wizard lifecycle', async () => {
      const stepsWithValidation: WizardStep[] = [
        {
          id: 'email',
          label: 'Email',
          validate: (data: TestWizardData) => {
            if (!data.email) return 'Email is required';
            return null;
          },
        },
        {
          id: 'password',
          label: 'Password',
          validate: (data: TestWizardData) => {
            if (!data.password) return 'Password is required';
            if (data.password.length < 8) return 'Password must be at least 8 characters';
            return null;
          },
        },
        {
          id: 'confirm',
          label: 'Confirmation',
        },
      ];

      const onComplete = vi.fn();
      const onStepChange = vi.fn();
      const onDataChange = vi.fn();

      const wizard = createWizard<TestWizardData>({
        steps: stepsWithValidation,
        initialData: {},
        onComplete,
        onStepChange,
        onDataChange,
      });

      // Try to proceed without data - should fail
      let success = await wizard.actions.goToNextStep();
      expect(success).toBe(false);
      expect(wizard.getState().currentStepIndex).toBe(0);

      // Set email and proceed
      wizard.actions.setStepData({ email: 'test@example.com' });
      expect(onDataChange).toHaveBeenCalled();

      success = await wizard.actions.goToNextStep();
      expect(success).toBe(true);
      expect(wizard.getState().currentStepIndex).toBe(1);
      expect(onStepChange).toHaveBeenCalledWith(1, stepsWithValidation[1]);

      // Try to proceed without password - should fail
      success = await wizard.actions.goToNextStep();
      expect(success).toBe(false);

      // Set password and proceed
      wizard.actions.setStepData({ password: 'password123' });
      success = await wizard.actions.goToNextStep();
      expect(success).toBe(true);
      expect(wizard.getState().currentStepIndex).toBe(2);

      // Complete wizard
      await wizard.actions.completeWizard();
      expect(onComplete).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });

      wizard.destroy();
    });

    it('should handle navigation back and forth', async () => {
      const wizard = createWizard({
        steps: basicSteps,
      });

      // Move forward
      await wizard.actions.goToNextStep();
      expect(wizard.getState().currentStepIndex).toBe(1);

      await wizard.actions.goToNextStep();
      expect(wizard.getState().currentStepIndex).toBe(2);

      // Move backward
      wizard.actions.goToPreviousStep();
      expect(wizard.getState().currentStepIndex).toBe(1);

      wizard.actions.goToPreviousStep();
      expect(wizard.getState().currentStepIndex).toBe(0);

      // Jump to specific step
      wizard.actions.goToStep(2);
      expect(wizard.getState().currentStepIndex).toBe(2);

      wizard.destroy();
    });
  });
});
