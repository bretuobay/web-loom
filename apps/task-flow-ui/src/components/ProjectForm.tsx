import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { z } from 'zod';
import { PROJECT_STATUSES, formatProjectStatus } from '../domain/values/projectStatus';
import type { ProjectFormValues } from '../domain/entities/project';

interface ProjectFormProps {
  onSubmit: (values: ProjectFormValues) => Promise<void> | void;
  onSuccess?: () => void;
  onCancel?: () => void;
  initialValues?: Partial<ProjectFormValues>;
  title?: string;
  submitLabel?: string;
  isSubmitting?: boolean;
}

const PROJECT_FORM_SCHEMA = z.object({
  name: z.string().min(3, 'Project name is required'),
  description: z.string().max(1024).optional(),
  status: z.enum(PROJECT_STATUSES),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Pick a valid color token'),
});

const DEFAULT_VALUES: ProjectFormValues = {
  name: '',
  description: '',
  color: '#60a5fa',
  status: PROJECT_STATUSES[0],
};

const formatErrors = (result: z.SafeParseReturnType<ProjectFormValues, ProjectFormValues>) => {
  if (result.success) return {};
  return result.error.issues.reduce<Record<string, string>>((acc, issue) => {
    if (issue.path.length > 0) {
      acc[issue.path[0] as string] = issue.message;
    }
    return acc;
  }, {});
};

export function ProjectForm({
  onSubmit,
  onSuccess,
  onCancel,
  initialValues,
  title = 'Create project',
  submitLabel = 'Save project',
  isSubmitting = false,
}: ProjectFormProps) {
  const mergedInitial = useMemo(() => ({ ...DEFAULT_VALUES, ...initialValues }), [initialValues]);
  const [values, setValues] = useState<ProjectFormValues>(mergedInitial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<string | null>(null);
  const feedbackTimer = useRef<number | null>(null);

  useEffect(() => {
    setValues(mergedInitial);
    setErrors({});
  }, [mergedInitial]);

  useEffect(() => {
    return () => {
      if (feedbackTimer.current) {
        clearTimeout(feedbackTimer.current);
      }
    };
  }, []);

  const showTemporaryFeedback = (message: string) => {
    setFeedback(message);
    if (feedbackTimer.current) {
      clearTimeout(feedbackTimer.current);
    }
    feedbackTimer.current = window.setTimeout(() => setFeedback(null), 3000);
  };

  const handleChange = <T extends keyof ProjectFormValues>(field: T, rawValue: unknown) => {
    const nextValue = rawValue as ProjectFormValues[T];
    const next = { ...values, [field]: nextValue };
    setValues(next);
    if (errors[field as string]) {
      const validation = PROJECT_FORM_SCHEMA.safeParse(next);
      setErrors(formatErrors(validation));
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    const validation = PROJECT_FORM_SCHEMA.safeParse(values);
    const nextErrors = formatErrors(validation);
    if (!validation.success) {
      setErrors(nextErrors);
      showTemporaryFeedback('Please resolve the highlighted fields.');
      return;
    }

    try {
      await onSubmit(validation.data);
      setErrors({});
      showTemporaryFeedback('Project saved!');
      onSuccess?.();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Project save failed.';
      showTemporaryFeedback(message);
      throw error;
    }
  };

  return (
    <form className="task-form" onSubmit={handleSubmit} noValidate>
      <h3>{title}</h3>
      <div className="task-form__field">
        <label htmlFor="project-name">Name</label>
        <input
          id="project-name"
          value={values.name}
          onChange={(event) => handleChange('name', event.target.value)}
          placeholder="Project name"
          required
        />
        {errors.name && <p className="task-form__error">{errors.name}</p>}
      </div>

      <div className="task-form__field">
        <label htmlFor="project-description">Description</label>
        <textarea
          id="project-description"
          value={values.description ?? ''}
          onChange={(event) => handleChange('description', event.target.value)}
          placeholder="Short summary of the project"
        />
        {errors.description && <p className="task-form__error">{errors.description}</p>}
      </div>

      <div className="task-form__grid">
        <div className="task-form__field">
          <label htmlFor="project-status">Status</label>
          <select
            id="project-status"
            value={values.status}
            onChange={(event) => handleChange('status', event.target.value)}
          >
            {PROJECT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {formatProjectStatus(status)}
              </option>
            ))}
          </select>
        </div>
        <div className="task-form__field">
          <label htmlFor="project-color">Accent color</label>
          <input
            id="project-color"
            type="color"
            value={values.color}
            onChange={(event) => handleChange('color', event.target.value)}
          />
          {errors.color && <p className="task-form__error">{errors.color}</p>}
        </div>
      </div>

      <div className="task-form__actions">
        <button type="submit" disabled={isSubmitting}>
          {submitLabel}
        </button>
        {onCancel && (
          <button type="button" className="task-form__cancel" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>

      {feedback && <p className="task-form__feedback">{feedback}</p>}
    </form>
  );
}
