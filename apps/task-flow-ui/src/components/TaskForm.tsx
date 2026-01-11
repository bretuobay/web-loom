import { FormFactory } from '@web-loom/forms-core';
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { z } from 'zod';
import { TASK_PRIORITIES, formatTaskPriority } from '../domain/values/taskPriority';
import { TASK_STATUSES, formatTaskStatus } from '../domain/values/taskStatus';

const TASK_FORM_SCHEMA = z.object({
  title: z.string().min(3, 'Task title is required'),
  description: z.string().optional(),
  status: z.enum(TASK_STATUSES),
  priority: z.enum(TASK_PRIORITIES),
  dueDate: z.string().nullable()
});

export type TaskFormValues = z.infer<typeof TASK_FORM_SCHEMA>;

const DEFAULT_FORM_VALUES: TaskFormValues = {
  title: '',
  description: '',
  status: TASK_STATUSES[0],
  priority: TASK_PRIORITIES[1],
  dueDate: null
};

interface TaskFormProps {
  onSubmit: (values: TaskFormValues) => Promise<void> | void;
  initialValues?: Partial<TaskFormValues>;
  title?: string;
  submitLabel?: string;
  onCancel?: () => void;
}

export function TaskForm({ onSubmit, initialValues, title = 'Create task', submitLabel = 'Save task', onCancel }: TaskFormProps) {
  const mergedInitial = useMemo(() => ({ ...DEFAULT_FORM_VALUES, ...initialValues }), [initialValues]);

  const form = useMemo(
    () =>
      FormFactory.create({
        schema: TASK_FORM_SCHEMA,
        defaultValues: DEFAULT_FORM_VALUES,
        validateOnChange: true,
        validateOnBlur: true,
        onSubmit
      }),
    [onSubmit]
  );

  useEffect(() => {
    form.reset(mergedInitial);
  }, [form, mergedInitial]);

  useEffect(() => {
    const unregisters = [
      form.registerField('title'),
      form.registerField('description'),
      form.registerField('status'),
      form.registerField('priority'),
      form.registerField('dueDate')
    ];
    return () => {
      unregisters.forEach((dispose) => dispose());
    };
  }, [form]);

  useEffect(() => () => form.destroy(), [form]);

  const [formState, setFormState] = useState(form.getState());
  const [feedback, setFeedback] = useState<string | null>(null);
  const feedbackTimer = useRef<number | null>(null);

  useEffect(() => {
    const unsubscribe = form.subscribe('stateChange', (state) => setFormState(state));
    return () => unsubscribe();
  }, [form]);

  useEffect(() => {
    const unsubscribe = form.subscribe('submit', ({ success }) => {
      if (success) {
        setFeedback('Task saved!');
        if (feedbackTimer.current) {
          clearTimeout(feedbackTimer.current);
        }
        feedbackTimer.current = window.setTimeout(() => setFeedback(null), 3000);
      } else {
        setFeedback('Please fix the highlighted fields.');
      }
    });
    return () => {
      unsubscribe();
      if (feedbackTimer.current) {
        clearTimeout(feedbackTimer.current);
      }
    };
  }, [form]);

  const values = formState.values as TaskFormValues;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await form.submit();
  };

  const setFieldValue = (path: keyof TaskFormValues, value: unknown) => {
    form.setFieldValue(path as string, value);
  };

  return (
    <form className="task-form" onSubmit={handleSubmit} noValidate>
      <h3>{title}</h3>
      <div className="task-form__field">
        <label htmlFor="task-title">Title</label>
        <input
          id="task-title"
          value={values.title}
          onChange={(event) => setFieldValue('title', event.target.value)}
          placeholder="Describe what needs to be done"
          required
        />
        {formState.fieldErrors.title && <p className="task-form__error">{formState.fieldErrors.title}</p>}
      </div>

      <div className="task-form__field">
        <label htmlFor="task-description">Description</label>
        <textarea
          id="task-description"
          value={values.description ?? ''}
          onChange={(event) => setFieldValue('description', event.target.value)}
          placeholder="Add supporting notes or context"
        />
      </div>

      <div className="task-form__grid">
        <div className="task-form__field">
          <label htmlFor="task-status">Status</label>
          <select id="task-status" value={values.status} onChange={(event) => setFieldValue('status', event.target.value)}>
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
            onChange={(event) => setFieldValue('priority', event.target.value)}
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
            onChange={(event) => setFieldValue('dueDate', event.target.value || null)}
          />
        </div>
      </div>

      <div className="task-form__actions">
        <button type="submit" disabled={formState.isSubmitting}>
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
