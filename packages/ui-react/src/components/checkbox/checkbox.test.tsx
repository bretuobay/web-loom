import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Checkbox } from './Checkbox';

describe('Checkbox', () => {
  it('renders a checkbox with label', () => {
    render(<Checkbox value="yes">Agree to terms</Checkbox>);
    expect(screen.getByText('Agree to terms')).toBeInTheDocument();
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
  });

  it('triggers onChange when clicked', () => {
    const handleChange = vi.fn();
    render(
      <Checkbox value="toggle" onChange={handleChange}>
        Toggle
      </Checkbox>,
    );
    const input = screen.getByRole('checkbox');
    fireEvent.click(input);
    expect(handleChange).toHaveBeenCalled();
  });

  it('respects indeterminate state', () => {
    render(
      <Checkbox indeterminate value="ind">
        Partial
      </Checkbox>,
    );
    const input = screen.getByRole('checkbox') as HTMLInputElement;
    expect(input.indeterminate).toBe(true);
    expect(input).toHaveAttribute('aria-checked', 'mixed');
  });
});

describe('Checkbox.Group', () => {
  it('manages selection state and fires onChange', () => {
    const handleChange = vi.fn();
    render(
      <Checkbox.Group defaultValue={['one']} onChange={handleChange} label="Choices" ariaLabel="Checkbox choices">
        <Checkbox value="one">One</Checkbox>
        <Checkbox value="two">Two</Checkbox>
      </Checkbox.Group>,
    );

    const secondCheckbox = screen.getByText('Two');
    fireEvent.click(secondCheckbox);
    expect(handleChange).toHaveBeenCalledWith(['one', 'two']);

    fireEvent.click(secondCheckbox);
    expect(handleChange).toHaveBeenCalledWith(['one']);
  });

  it('does not fire onChange when disabled', () => {
    const handleChange = vi.fn();
    render(
      <Checkbox.Group disabled onChange={handleChange}>
        <Checkbox value="one">One</Checkbox>
      </Checkbox.Group>,
    );

    fireEvent.click(screen.getByText('One'));
    expect(handleChange).not.toHaveBeenCalled();
  });
});
