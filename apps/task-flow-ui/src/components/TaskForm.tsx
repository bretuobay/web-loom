import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { z } from 'zod';
import { TASK_PRIORITIES, formatTaskPriority } from '../domain/values/taskPriority';
import { TASK_STATUSES, formatTaskStatus } from '../domain/values/taskStatus';
import type { TaskFormValues } from '../domain/entities/task';

export type { TaskFormValues };

const TASK_FORM_SCHEMA = z.object({
  title: z.string().min(3, 'Task title is required'),
  description: z.string().optional(),
  status: z.enum(TASK_STATUSES),
  priority: z.enum(TASK_PRIORITIES),
  dueDate: z.string().nullable(),
});

const DEFAULT_FORM_VALUES: TaskFormValues = {
  title: '',
  description: '',
  status: TASK_STATUSES[0],
  priority: TASK_PRIORITIES[1],
  dueDate: null,
};

interface TaskFormProps {
  onSubmit: (values: TaskFormValues) => Promise<void> | void;
  initialValues?: Partial<TaskFormValues>;
  title?: string;
  submitLabel?: string;
  onCancel?: () => void;
}

const formatErrors = (result: z.SafeParseReturnType<TaskFormValues, TaskFormValues>) => {
  if (result.success) return {};
  return result.error.issues.reduce<Record<string, string>>((acc, issue) => {
    if (issue.path.length > 0) {
      acc[issue.path[0] as string] = issue.message;
    }
    return acc;
  }, {});
};

export function TaskForm({
  onSubmit,
  initialValues,
  title = 'Create task',
  submitLabel = 'Save task',
  onCancel,
}: TaskFormProps) {
  const mergedInitial = useMemo(() => ({ ...DEFAULT_FORM_VALUES, ...initialValues }), [initialValues]);
  const [values, setValues] = useState<TaskFormValues>(mergedInitial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const handleChange = (field: keyof TaskFormValues, rawValue: unknown) => {
    const nextValue =
      field === 'dueDate' ? (rawValue === '' ? null : String(rawValue)) : (rawValue as TaskFormValues[typeof field]);
    const next = { ...values, [field]: nextValue };
    setValues(next);
    if (errors[field]) {
      const validation = TASK_FORM_SCHEMA.safeParse(next);
      setErrors(formatErrors(validation));
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    const validation = TASK_FORM_SCHEMA.safeParse(values);
    const nextErrors = formatErrors(validation);
    if (!validation.success) {
      setErrors(nextErrors);
      setIsSubmitting(false);
      showTemporaryFeedback('Please fix the highlighted fields.');
      return;
    }

    try {
      await onSubmit(validation.data);
      setErrors({});
      showTemporaryFeedback('Task saved!');
    } catch (error) {
      console.error('Task form submission failed', error);
      const message = error instanceof Error ? error.message : 'Task save failed.';
      showTemporaryFeedback(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="task-form" onSubmit={handleSubmit} noValidate>
      <h3>{title}</h3>
      <div className="task-form__field">
        <label htmlFor="task-title">Title</label>
        <input
          id="task-title"
          value={values.title}
          onChange={(event) => handleChange('title', event.target.value)}
          placeholder="Describe what needs to be done"
          required
        />
        {errors.title && <p className="task-form__error">{errors.title}</p>}
      </div>

      <div className="task-form__field">
        <label htmlFor="task-description">Description</label>
        <textarea
          id="task-description"
          value={values.description ?? ''}
          onChange={(event) => handleChange('description', event.target.value)}
          placeholder="Add supporting notes or context"
        />
      </div>

      <div className="task-form__grid">
        <div className="task-form__field">
          <label htmlFor="task-status">Status</label>
          <select
            id="task-status"
            value={values.status}
            onChange={(event) => handleChange('status', event.target.value)}
          >
            {TASK_STATUSES.map((status) => (
              <option key={status} value={status}>
                {formatTaskStatus(status)}
              </option>
            ))}
          </select>
        </div>
        <div className="task-form__field">
          <label htmlFor="task-priority">Priority</label>
          <select
            id="task-priority"
            value={values.priority}
            onChange={(event) => handleChange('priority', event.target.value)}
          >
            {TASK_PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>
                {formatTaskPriority(priority)}
              </option>
            ))}
          </select>
        </div>
        <div className="task-form__field">
          <label htmlFor="task-due">Due date</label>
          <input
            id="task-due"
            type="date"
            value={values.dueDate ?? ''}
            onChange={(event) => handleChange('dueDate', event.target.value)}
          />
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
