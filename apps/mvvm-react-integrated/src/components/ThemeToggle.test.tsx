import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { ThemeToggle } from './ThemeToggle';
import { ThemeProvider } from '../providers/ThemeProvider';

describe('ThemeToggle', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should render with light theme by default', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>,
    );

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-label', 'Switch to dark mode');
    expect(screen.getByText('Dark Mode')).toBeInTheDocument();
  });

  it('should toggle theme when clicked', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>,
    );

    const button = screen.getByRole('button');

    // Initial state should be light
    expect(screen.getByText('Dark Mode')).toBeInTheDocument();

    // Click to toggle to dark
    fireEvent.click(button);
    expect(screen.getByText('Light Mode')).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-label', 'Switch to light mode');

    // Click to toggle back to light
    fireEvent.click(button);
    expect(screen.getByText('Dark Mode')).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-label', 'Switch to dark mode');
  });

  it('should display correct icon for each theme', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>,
    );

    const button = screen.getByRole('button');
    const icons = button.querySelectorAll('svg');

    // Should have one icon
    expect(icons).toHaveLength(1);

    // Toggle and check again
    fireEvent.click(button);
    const iconsAfterToggle = button.querySelectorAll('svg');
    expect(iconsAfterToggle).toHaveLength(1);
  });

  it('should have correct title attribute', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>,
    );

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('title', 'Switch to dark mode');

    fireEvent.click(button);
    expect(button).toHaveAttribute('title', 'Switch to light mode');
  });

  it('should apply theme-toggle class', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>,
    );

    const button = screen.getByRole('button');
    expect(button).toHaveClass('theme-toggle');
  });
});
