import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Button } from './button';

describe('Button', () => {
  it('renders children with default variant', () => {
    render(<Button>Deploy</Button>);
    const button = screen.getByRole('button', { name: /deploy/i });

    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('btn', 'btn-primary');
  });

  it('supports variant, size and block props', () => {
    render(
      <Button variant="secondary" size="lg" block>
        Continue
      </Button>,
    );

    const button = screen.getByRole('button', { name: /continue/i });
    expect(button).toHaveClass('btn-secondary', 'loom-btn-lg', 'loom-btn-block');
  });

  it('fires click handlers', async () => {
    const onClick = vi.fn();
    render(
      <Button variant="ghost" onClick={onClick}>
        Send
      </Button>,
    );

    await userEvent.click(screen.getByRole('button', { name: /send/i }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
