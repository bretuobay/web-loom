import { useState, useEffect } from 'react';
import { createWizard } from '@web-loom/ui-patterns';
import './examples.css';

interface WizardData {
  personalInfo?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  preferences?: {
    theme: string;
    notifications: boolean;
  };
  confirmation?: {
    agreed: boolean;
  };
}

/**
 * Example component demonstrating the Wizard pattern
 * Shows a multi-step form with validation
 */
export function WizardExample() {
  const [wizard] = useState(() =>
    createWizard<WizardData>({
      steps: [
        {
          id: 'personal',
          label: 'Personal Information',
          validate: async (data) => {
            const info = data.personalInfo;
            if (!info?.firstName || !info?.lastName || !info?.email) {
              return 'Please fill in all required fields';
            }
            if (!info.email.includes('@')) {
              return 'Please enter a valid email address';
            }
            return null;
          },
        },
        {
          id: 'preferences',
          label: 'Preferences',
          validate: async (data) => {
            const prefs = data.preferences;
            if (!prefs?.theme) {
              return 'Please select a theme';
            }
            return null;
          },
        },
        {
          id: 'confirmation',
          label: 'Confirmation',
          validate: async (data) => {
            if (!data.confirmation?.agreed) {
              return 'You must agree to the terms to continue';
            }
            return null;
          },
        },
      ],
      initialData: {},
      onComplete: async (data) => {
        console.log('Wizard completed with data:', data);
        alert('Wizard completed successfully!');
      },
    })
  );

  const [state, setState] = useState(wizard.getState());
  const [formData, setFormData] = useState<WizardData>({});

  useEffect(() => {
    const unsubscribe = wizard.subscribe(setState);
    return () => {
      unsubscribe();
      wizard.destroy();
    };
  }, [wizard]);

  const currentStep = state.steps[state.currentStepIndex];

  const handleNext = async () => {
    const success = await wizard.actions.goToNextStep();
    if (!success) {
      alert('Please fix validation errors before proceeding');
    }
  };

  const handleComplete = async () => {
    await wizard.actions.completeWizard();
  };

  const updatePersonalInfo = (field: string, value: string) => {
    const updated = {
      ...formData,
      personalInfo: {
        ...formData.personalInfo,
        [field]: value,
      } as WizardData['personalInfo'],
    };
    setFormData(updated);
    wizard.actions.setStepData(updated);
  };

  const updatePreferences = (field: string, value: string | boolean) => {
    const updated = {
      ...formData,
      preferences: {
        ...formData.preferences,
        [field]: value,
      } as WizardData['preferences'],
    };
    setFormData(updated);
    wizard.actions.setStepData(updated);
  };

  const updateConfirmation = (agreed: boolean) => {
    const updated = {
      ...formData,
      confirmation: { agreed },
    };
    setFormData(updated);
    wizard.actions.setStepData(updated);
  };

  return (
    <div className="example-container">
      <h2>Wizard Pattern Example</h2>
      <p>
        This example demonstrates the <code>createWizard</code> pattern from
        @web-loom/ui-patterns.
      </p>

      <div className="wizard-container">
        <div className="wizard-steps">
          {state.steps.map((step, index) => (
            <div
              key={step.id}
              className={`wizard-step ${
                index === state.currentStepIndex
                  ? 'active'
                  : state.completedSteps.includes(index)
                    ? 'completed'
                    : ''
              }`}
            >
              <div className="step-number">
                {state.completedSteps.includes(index) ? '✓' : index + 1}
              </div>
              <div className="step-label">{step.label}</div>
            </div>
          ))}
        </div>

        <div className="wizard-content">
          <h3>{currentStep.label}</h3>

          {currentStep.id === 'personal' && (
            <div className="form-group">
              <label>
                First Name *
                <input
                  type="text"
                  value={formData.personalInfo?.firstName || ''}
                  onChange={(e) =>
                    updatePersonalInfo('firstName', e.target.value)
                  }
                  className="input"
                />
              </label>
              <label>
                Last Name *
                <input
                  type="text"
                  value={formData.personalInfo?.lastName || ''}
                  onChange={(e) =>
                    updatePersonalInfo('lastName', e.target.value)
                  }
                  className="input"
                />
              </label>
              <label>
                Email *
                <input
                  type="email"
                  value={formData.personalInfo?.email || ''}
                  onChange={(e) => updatePersonalInfo('email', e.target.value)}
                  className="input"
                />
              </label>
            </div>
          )}

          {currentStep.id === 'preferences' && (
            <div className="form-group">
              <label>
                Theme *
                <select
                  value={formData.preferences?.theme || ''}
                  onChange={(e) => updatePreferences('theme', e.target.value)}
                  className="select"
                >
                  <option value="">Select a theme</option>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="auto">Auto</option>
                </select>
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.preferences?.notifications || false}
                  onChange={(e) =>
                    updatePreferences('notifications', e.target.checked)
                  }
                />
                Enable notifications
              </label>
            </div>
          )}

          {currentStep.id === 'confirmation' && (
            <div className="form-group">
              <div className="confirmation-summary">
                <h4>Review Your Information</h4>
                <div className="summary-section">
                  <h5>Personal Information</h5>
                  <p>
                    Name: {formData.personalInfo?.firstName}{' '}
                    {formData.personalInfo?.lastName}
                  </p>
                  <p>Email: {formData.personalInfo?.email}</p>
                </div>
                <div className="summary-section">
                  <h5>Preferences</h5>
                  <p>Theme: {formData.preferences?.theme}</p>
                  <p>
                    Notifications:{' '}
                    {formData.preferences?.notifications ? 'Enabled' : 'Disabled'}
                  </p>
                </div>
              </div>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.confirmation?.agreed || false}
                  onChange={(e) => updateConfirmation(e.target.checked)}
                />
                I agree to the terms and conditions *
              </label>
            </div>
          )}
        </div>

        <div className="wizard-actions">
          <button
            onClick={() => wizard.actions.goToPreviousStep()}
            disabled={state.currentStepIndex === 0}
            className="btn btn-secondary"
          >
            Previous
          </button>

          {state.currentStepIndex < state.steps.length - 1 ? (
            <button
              onClick={handleNext}
              disabled={!state.canProceed}
              className="btn btn-primary"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleComplete}
              disabled={!state.canProceed}
              className="btn btn-primary"
            >
              Complete
            </button>
          )}
        </div>

        <div className="example-state">
          <h3>Wizard State:</h3>
          <pre>{JSON.stringify(state, null, 2)}</pre>
        </div>
      </div>
    </div>
  );
}
