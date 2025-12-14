import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Radio } from './Radio';

describe('Radio', () => {
  it('renders and calls onChange', () => {
    const handleChange = vi.fn();
    render(
      <Radio value="yes" onChange={handleChange}>
        Options
      </Radio>
    );

    fireEvent.click(screen.getByText('Options'));
    expect(handleChange).toHaveBeenCalled();
  });
});

describe('Radio.Group', () => {
  it('manages selection and fires onChange', () => {
    const handleChange = vi.fn();
    render(
      <Radio.Group defaultValue="first" onChange={handleChange} label="Choices">
        <Radio value="first">First</Radio>
        <Radio value="second">Second</Radio>
      </Radio.Group>
    );

    fireEvent.click(screen.getByText('Second'));
    expect(handleChange).toHaveBeenCalledWith('second');
  });

  it('does not change when disabled', () => {
    const handleChange = vi.fn();
    render(
      <Radio.Group disabled onChange={handleChange}>
        <Radio value="a">A</Radio>
      </Radio.Group>
    );

    fireEvent.click(screen.getByText('A'));
    expect(handleChange).not.toHaveBeenCalled();
  });
});

describe('Radio.Button', () => {
  it('renders button style radios and triggers onChange', () => {
    const handleChange = vi.fn();
    render(
      <Radio.Group onChange={handleChange} defaultValue="one">
        <Radio.Button value="one">One</Radio.Button>
        <Radio.Button value="two">Two</Radio.Button>
      </Radio.Group>
    );

    fireEvent.click(screen.getByText('Two'));
    expect(handleChange).toHaveBeenCalledWith('two');
  });
});
