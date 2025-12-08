import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Card } from './card';

describe('Card', () => {
  it('renders semantic article when href is not provided', () => {
    render(
      <Card title="Design language" description="Unified typography scale">
        Scale content
      </Card>,
    );

    const article = screen.getByRole('article');
    expect(article).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /design language/i })).toBeInTheDocument();
    expect(article).toHaveTextContent(/unified typography scale/i);
  });

  it('renders anchor card when href is provided', () => {
    render(
      <Card title="Tokens explorer" href="https://example.com/design">
        Inspect every primitive
      </Card>,
    );

    const anchor = screen.getByRole('link', { name: /tokens explorer/i });
    expect(anchor).toHaveAttribute('href', 'https://example.com/design');
    expect(anchor).toHaveAttribute('rel', 'noreferrer noopener');
    expect(anchor).toHaveAttribute('target', '_blank');
  });

  it('supports badge and footer content', () => {
    render(
      <Card title="Release notes" badge="beta" footer={<span>Read more</span>}>
        Latest drop
      </Card>,
    );

    expect(screen.getByText(/beta/i)).toBeInTheDocument();
    expect(screen.getByText(/read more/i)).toBeInTheDocument();
  });
});

