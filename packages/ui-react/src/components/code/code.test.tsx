import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Code } from './code';

describe('Code', () => {
  it('renders inline code by default', () => {
    render(<Code>npm run dev</Code>);
    const code = screen.getByText(/npm run dev/i);
    expect(code.tagName).toBe('CODE');
    expect(code).toHaveClass('loom-code-inline');
  });

  it('renders block mode with language label', () => {
    const { container } = render(
      <Code block language="ts">
        const tokens = await getTokens();
      </Code>,
    );

    const pre = container.querySelector('pre');
    expect(pre).toBeTruthy();
    expect(pre).toHaveClass('loom-code-block');
    expect(pre).toHaveAttribute('data-language', 'ts');
  });
});
