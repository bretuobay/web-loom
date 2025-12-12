import {
  useState,
  type CSSProperties,
  type InputHTMLAttributes,
  type TextareaHTMLAttributes,
  type ButtonHTMLAttributes,
} from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { z } from 'zod';
import { Form } from './Form';

const LayoutSchema = z.object({
  name: z.string().min(1, 'Please provide a name'),
  email: z.string().email('Enter a valid email'),
});

const DefaultSchema = z.object({
  username: z.string().min(3, 'Username must be at least three characters'),
  message: z.string().min(1, 'Required'),
});

const meta: Meta<typeof Form> = {
  title: 'Components/Form',
  component: Form,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Form>;

const inputStyles: CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: '8px',
  border: '1px solid var(--ui-color-border, #d9d9d9)',
  backgroundColor: 'var(--ui-color-bg-primary, #fff)',
  fontSize: 'var(--ui-font-size-md, 16px)',
  fontFamily: 'inherit',
  color: 'var(--ui-color-text, #000)',
  transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
  boxSizing: 'border-box',
};

const buttonStyles: CSSProperties = {
  padding: '10px 16px',
  borderRadius: '8px',
  border: 'none',
  backgroundColor: 'var(--ui-color-primary, #2563eb)',
  color: '#fff',
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontSize: 'var(--ui-font-size-md, 16px)',
};

function StyledInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} style={{ ...inputStyles, ...props.style }} />;
}

function StyledTextarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} style={{ ...inputStyles, ...props.style }} />;
}

function StyledButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} style={{ ...buttonStyles, ...props.style }} />;
}

function LayoutsStory() {
  const verticalForm = Form.useForm({
    schema: LayoutSchema,
    defaultValues: { name: '', email: '' },
  });

  const horizontalForm = Form.useForm({
    schema: LayoutSchema,
    defaultValues: { name: '', email: '' },
  });

  const inlineForm = Form.useForm({
    schema: LayoutSchema,
    defaultValues: { name: '', email: '' },
  });

  return (
    <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
      <div style={{ width: 280 }}>
        <h3>Vertical</h3>
        <Form form={verticalForm} layout="vertical">
          <Form.Item label="Name" name="name">
            <StyledInput placeholder="Name" />
          </Form.Item>
          <Form.Item label="Email" name="email">
            <StyledInput placeholder="Email" />
          </Form.Item>
        </Form>
      </div>
      <div style={{ width: 280 }}>
        <h3>Horizontal</h3>
        <Form form={horizontalForm} layout="horizontal">
          <Form.Item label="Name" name="name">
            <StyledInput placeholder="Name" />
          </Form.Item>
          <Form.Item label="Email" name="email">
            <StyledInput placeholder="Email" />
          </Form.Item>
        </Form>
      </div>
      <div style={{ width: 360 }}>
        <h3>Inline</h3>
        <Form form={inlineForm} layout="inline">
          <Form.Item name="name">
            <StyledInput placeholder="Name" />
          </Form.Item>
          <Form.Item name="email">
            <StyledInput placeholder="Email" />
          </Form.Item>
          <Form.Item>
            <StyledButton type="submit">Submit</StyledButton>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
}

export const Layouts: Story = {
  render: () => <LayoutsStory />,
};

function ValidationStory() {
  const form = Form.useForm({
    schema: DefaultSchema,
    defaultValues: { username: '', message: '' },
  });
  const [feedback, setFeedback] = useState<string>('Fill the form');

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={(values) => setFeedback(`Thanks ${values.username}`)}
      onFinishFailed={() => setFeedback('Fix the errors before submitting')}
    >
      <Form.Item label="Username" name="username" rules={[{ required: true }]}>
        <StyledInput placeholder="Username" />
      </Form.Item>
      <Form.Item label="Message" name="message" rules={[{ required: true }]}>
        <StyledTextarea rows={3} placeholder="Add a message" />
      </Form.Item>
      <StyledButton type="submit">Validate</StyledButton>
      <p>{feedback}</p>
    </Form>
  );
}

export const Validation: Story = {
  render: () => <ValidationStory />,
};

function DynamicFieldsStory() {
  const form = Form.useForm({
    schema: z.object({
      tags: z.array(z.object({ value: z.string().min(1, 'Tag is required') })),
    }),
    defaultValues: { tags: [{ value: 'Example' }] },
  });

  return (
    <Form form={form}>
      <Form.List name="tags">
        {(fields, operations) => (
          <>
            {fields.map((field, index) => (
              <Form.Item key={field.id} label={`Tag ${index + 1}`} name={`tags.${index}.value`}>
                <StyledInput placeholder="Tag value" />
              </Form.Item>
            ))}
            <StyledButton type="button" onClick={() => operations.append({ value: '' })}>
              Add tag
            </StyledButton>
          </>
        )}
      </Form.List>
      <StyledButton type="submit">Save tags</StyledButton>
    </Form>
  );
}

export const DynamicFields: Story = {
  render: () => <DynamicFieldsStory />,
};

function SubmissionStory() {
  const form = Form.useForm({
    schema: z.object({
      contact: z.string().email('Please use a valid email'),
    }),
    defaultValues: { contact: '' },
  });
  const [status, setStatus] = useState('Ready to submit');

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={(values) => setStatus(`Submitted ${values.contact}`)}
      onFinishFailed={() => setStatus('Submission blocked')}
    >
      <Form.Item label="Email" name="contact" rules={[{ required: true }]}>
        <StyledInput placeholder="Email address" />
      </Form.Item>
      <StyledButton type="submit">Submit</StyledButton>
      <p>{status}</p>
    </Form>
  );
}

export const Submission: Story = {
  render: () => <SubmissionStory />,
};
