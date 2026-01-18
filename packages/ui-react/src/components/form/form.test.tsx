import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { z } from 'zod';
import { Form } from './Form';

describe('Form component suite', () => {
  it('shows validation errors for required fields', async () => {
    const schema = z.object({
      name: z.string().min(1, 'Name is required'),
    });

    const form = Form.useForm({
      schema,
      defaultValues: { name: '' },
    });

    render(
      <Form form={form}>
        <Form.Item label="Name" name="name" rules={[{ required: true, message: 'Name is required' }]}>
          <input data-testid="name-input" />
        </Form.Item>
        <button type="submit">Submit</button>
      </Form>,
    );

    const input = screen.getByTestId('name-input');
    fireEvent.blur(input);

    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument();
    });
  });

  it('adds dynamic fields via Form.List', async () => {
    const schema = z.object({
      items: z.array(z.object({ value: z.string().min(1) })),
    });

    const form = Form.useForm({
      schema,
      defaultValues: { items: [] },
    });

    render(
      <Form form={form}>
        <Form.List name="items">
          {(fields, operations) => (
            <>
              {fields.map((field, index) => (
                <Form.Item key={field.id} label={`Item ${index + 1}`} name={`items.${index}.value`}>
                  <input data-testid={`item-${index}`} />
                </Form.Item>
              ))}
              <button type="button" onClick={() => operations.append({ value: '' })}>
                Add
              </button>
            </>
          )}
        </Form.List>
      </Form>,
    );

    fireEvent.click(screen.getByText('Add'));

    await waitFor(() => {
      expect(screen.getByTestId('item-0')).toBeInTheDocument();
    });
  });

  it('notifies Form.Provider on successful submit', async () => {
    const schema = z.object({
      email: z.string().email(),
    });

    const form = Form.useForm({
      schema,
      defaultValues: { email: '' },
    });

    const finishSpy = vi.fn();

    render(
      <Form.Provider onFormFinish={finishSpy}>
        <Form form={form} name="newsletter" onFinish={({ email }) => {}}>
          <Form.Item label="Email" name="email">
            <input data-testid="email-input" />
          </Form.Item>
          <button type="submit">Submit</button>
        </Form>
      </Form.Provider>,
    );

    const emailInput = screen.getByTestId('email-input');
    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    fireEvent.click(screen.getByText('Submit'));

    await waitFor(() => {
      expect(finishSpy).toHaveBeenCalledWith('newsletter', { email: 'user@example.com' });
    });
  });
});
