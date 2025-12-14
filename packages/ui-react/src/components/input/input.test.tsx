import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Input, InputGroup, InputPassword, InputSearch, InputTextArea } from './Input';

describe('Input', () => {
  it('renders a basic input with placeholder', () => {
    render(<Input placeholder="Name" />);
    expect(screen.getByPlaceholderText('Name')).toBeInTheDocument();
  });

  it('shows a clear button when allowClear is enabled and value exists', () => {
    render(<Input allowClear defaultValue="filled" />);
    const clearButton = screen.getByRole('button', { name: 'Clear input' });
    expect(clearButton).toBeInTheDocument();
    const input = screen.getByDisplayValue('filled') as HTMLInputElement;
    fireEvent.click(clearButton);
    expect(input.value).toBe('');
    expect(document.activeElement).toBe(input);
  });

  it('renders prefix, suffix, and addons', () => {
    render(
      <Input
        placeholder="Url"
        prefix="https://"
        suffix="/home"
        addonBefore="http://"
        addonAfter=".com"
      />
    );

    expect(screen.getByText('https://')).toBeInTheDocument();
    expect(screen.getByText('/home')).toBeInTheDocument();
    expect(screen.getByText('http://')).toBeInTheDocument();
    expect(screen.getByText('.com')).toBeInTheDocument();
  });

  it('renders grouped inputs inline', () => {
    render(
      <InputGroup>
        <Input placeholder="First" />
        <Input placeholder="Last" />
      </InputGroup>
    );

    expect(screen.getByPlaceholderText('First')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Last')).toBeInTheDocument();
  });
});

describe('InputPassword', () => {
  it('toggles between hidden and visible values', () => {
    render(<InputPassword placeholder="Password" />);
    const input = screen.getByPlaceholderText('Password') as HTMLInputElement;
    const toggle = screen.getByRole('button', { name: /Show password/i });
    expect(input).toHaveAttribute('type', 'password');

    fireEvent.click(toggle);
    expect(screen.getByRole('button', { name: /Hide password/i })).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'text');
  });
});

describe('InputSearch', () => {
  it('calls onSearch when the search button is clicked and Enter is pressed', () => {
    const handleSearch = vi.fn();
    render(<InputSearch placeholder="Search" onSearch={handleSearch} />);

    const input = screen.getByPlaceholderText('Search') as HTMLInputElement;
    const searchButton = screen.getByRole('button', { name: 'Search input' });

    fireEvent.change(input, { target: { value: 'query' } });
    fireEvent.click(searchButton);
    expect(handleSearch).toHaveBeenCalledTimes(1);
    expect(handleSearch.mock.calls[0]?.[0]).toBe('query');

    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
    expect(handleSearch).toHaveBeenCalledTimes(2);
  });

  it('disables the search button when the input is disabled', () => {
    render(<InputSearch placeholder="Search" disabled />);
    expect(screen.getByRole('button', { name: 'Search input' })).toBeDisabled();
  });
});

describe('InputTextArea', () => {
  it('renders a textarea with provided size', () => {
    render(<InputTextArea placeholder="Notes" size="large" />);
    expect(screen.getByPlaceholderText('Notes')).toBeInTheDocument();
  });
});
